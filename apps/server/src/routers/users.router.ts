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

    const userRole = user.user_metadata?.role || user.role;
    if (userRole !== "admin") {
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

      // Map users to a cleaner format
      const users = data.users.map((user) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.user_metadata?.role || user.role,
        emailVerified: !!user.email_confirmed_at,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      }));

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
          user_metadata: {
            role,
          },
        });

        if (error) {
          return res.status(400).send({
            error: "Failed to create user: " + error.message,
          });
        }

        // Update user role in auth.users
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          data.user.id,
          {
            user_metadata: {
              role,
            },
          }
        );

        if (updateError) {
          console.error("Failed to update user role:", updateError);
        }

        return res.status(201).send({
          message: "User created successfully",
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            role,
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

        // Update user role
        const { data, error } = await supabase.auth.admin.updateUserById(id, {
          user_metadata: {
            role,
          },
        });

        if (error) {
          return res.status(400).send({
            error: "Failed to update user role: " + error.message,
          });
        }

        return res.send({
          message: "User role updated successfully",
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.user_metadata?.role || role,
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
}
