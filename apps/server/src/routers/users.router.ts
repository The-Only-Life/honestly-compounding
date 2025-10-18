import type { FastifyInstance } from "fastify";
import { CreateUserSchema, UpdateUserRoleSchema } from "../schemas/users.schema";
import type { FastifyCustomOptions } from "../types";
import type { Static } from "@fastify/type-provider-typebox";

export default async function usersRouter(
  server: FastifyInstance,
  options: FastifyCustomOptions
) {
  const { supabase } = options;
  if (!supabase) throw new Error("Supabase client not initialized");

  // Middleware to verify admin access
  const verifyAdmin = async (req: any, res: any) => {
    const accessToken = req.cookies["sb-access-token"];

    if (!accessToken) {
      return res.status(401).send({ error: "Not authenticated" });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return res.status(401).send({ error: "Invalid token" });
    }

    // Fetch user role from user_metadata table
    const { data: metadata, error: metadataError } = await supabase
      .from("user_metadata")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (metadataError || !metadata || metadata.role !== "admin") {
      return res.status(403).send({ error: "Forbidden: Admin access required" });
    }

    // Attach user to request
    req.user = user;
  };

  // GET /users - Fetch all users (Admin only)
  server.get("/", { preHandler: verifyAdmin }, async (req, res) => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) {
        return res.status(500).send({ error: error.message });
      }

      // Fetch all user metadata with invited_by information
      const { data: metadataList, error: metadataError } = await supabase
        .from("user_metadata")
        .select("user_id, role, access_approved, invited_by");

      if (metadataError) {
        console.error("Error fetching user metadata:", metadataError);
      }

      // Create a map for quick lookup
      const metadataMap = new Map(
        metadataList?.map((m) => [m.user_id, m]) || []
      );

      // Fetch inviter information for users who have invited_by set
      const inviterIds = metadataList
        ?.map((m) => m.invited_by)
        .filter((id): id is string => id !== null) || [];

      let inviterEmailMap = new Map<string, string>();

      if (inviterIds.length > 0) {
        // Fetch inviter users from auth
        const { data: inviters } = await supabase.auth.admin.listUsers();

        inviters?.users.forEach((inviter) => {
          inviterEmailMap.set(inviter.id, inviter.email || '');
        });
      }

      // Map users to a cleaner format with metadata
      const users = data.users.map((user) => {
        const metadata = metadataMap.get(user.id);
        const inviterEmail = metadata?.invited_by
          ? inviterEmailMap.get(metadata.invited_by) || null
          : null;

        return {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          emailVerified: !!user.email_confirmed_at,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
          invitedBy: inviterEmail,
        };
      });

      return res.send({ users });
    } catch (error: any) {
      return res.status(500).send({
        error: "Internal server error: " + error.message,
      });
    }
  });

  // POST /users - Create new user with role (Admin only)
  server.post(
    "/",
    {
      schema: { body: CreateUserSchema },
      preHandler: verifyAdmin,
    },
    async (req, res) => {
      try {
        const { email, phone, role } = req.body as Static<typeof CreateUserSchema>;

        // Validate that at least email or phone is provided
        if (!email && !phone) {
          return res.status(400).send({
            error: "Either email or phone number is required",
          });
        }

        // Generate a random password (user will set their own via invite link)
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

        // Create user via Supabase Admin API
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          phone,
          password: tempPassword,
          email_confirm: false, // User will confirm via invite
        });

        if (error) {
          return res.status(400).send({
            error: "Failed to create user: " + error.message,
          });
        }

        // Determine access_approved based on role
        // Subscribers need approval, sponsors and admins are auto-approved
        const accessApproved = role === 'subscriber' ? false : true;

        // Insert into user_metadata table
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .insert({
            user_id: data.user.id,
            role,
            access_approved: accessApproved,
          });

        if (metadataError) {
          console.error("Failed to create user metadata:", metadataError);
          // Rollback: delete the auth user if metadata creation fails
          await supabase.auth.admin.deleteUser(data.user.id);
          return res.status(500).send({
            error: "Failed to create user metadata: " + metadataError.message,
          });
        }

        return res.status(201).send({
          message: "User created successfully",
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            role,
            accessApproved,
            emailVerified: !!data.user.email_confirmed_at,
            createdAt: data.user.created_at,
          },
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // PATCH /users/:id/role - Update user role (Admin only)
  server.patch(
    "/:id/role",
    {
      schema: { body: UpdateUserRoleSchema },
      preHandler: verifyAdmin,
    },
    async (req, res) => {
      try {
        const { id } = req.params as { id: string };
        const { role } = req.body as Static<typeof UpdateUserRoleSchema>;

        // Check if user exists
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);

        if (userError || !userData.user) {
          return res.status(404).send({
            error: "User not found",
          });
        }

        // Update role in user_metadata table (upsert to handle if row doesn't exist)
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .upsert({
            user_id: id,
            role,
            access_approved: role === 'subscriber' ? false : true, // Auto-approve non-subscribers
          }, {
            onConflict: 'user_id'
          });

        if (metadataError) {
          return res.status(500).send({
            error: "Failed to update user metadata: " + metadataError.message,
          });
        }

        // Fetch updated metadata
        const { data: metadata } = await supabase
          .from("user_metadata")
          .select("role, access_approved")
          .eq("user_id", id)
          .single();

        return res.send({
          message: "User role updated successfully",
          user: {
            id: userData.user.id,
            email: userData.user.email,
            phone: userData.user.phone,
            role: metadata?.role || role,
            accessApproved: metadata?.access_approved || false,
            emailVerified: !!userData.user.email_confirmed_at,
            createdAt: userData.user.created_at,
          },
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // PATCH /users/:id/access - Update user access approval (Admin only)
  server.patch(
    "/:id/access",
    {
      preHandler: verifyAdmin,
    },
    async (req, res) => {
      try {
        const { id } = req.params as { id: string };
        const { accessApproved } = req.body as { accessApproved: boolean };

        // Update access_approved in user_metadata table
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .update({ access_approved: accessApproved })
          .eq("user_id", id);

        if (metadataError) {
          return res.status(500).send({
            error: "Failed to update user access: " + metadataError.message,
          });
        }

        return res.send({
          message: "User access updated successfully",
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // DELETE /users/:id - Delete a user (Admin only)
  server.delete(
    "/:id",
    {
      preHandler: verifyAdmin,
    },
    async (req, res) => {
      try {
        const { id } = req.params as { id: string };

        // Check if user exists
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(id);

        if (userError || !userData.user) {
          return res.status(404).send({
            error: "User not found",
          });
        }

        // Delete user metadata first
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .delete()
          .eq("user_id", id);

        if (metadataError) {
          console.error("Failed to delete user metadata:", metadataError);
          // Continue with auth user deletion even if metadata deletion fails
        }

        // Delete user from Supabase Auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

        if (deleteError) {
          return res.status(500).send({
            error: "Failed to delete user: " + deleteError.message,
          });
        }

        return res.send({
          message: "User deleted successfully",
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );
}
