import type { FastifyInstance } from "fastify";
import {
  InviteUserSchema,
  BulkInviteUserSchema,
  LoginSchema,
  CompleteProfileSchema,
} from "../schemas/auth.schema";
import type { FastifyCustomOptions } from "../types";
import type { Static } from "@fastify/type-provider-typebox";
import Config from "../server.config";
import { sendInviteEmail } from "../utils/email";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: Config.IS_PRODUCTION,
  sameSite: "lax" as const,
  path: "/",
};

export default async function authRouter(
  server: FastifyInstance,
  options: FastifyCustomOptions
) {
  const { supabase } = options;
  if (!supabase) throw new Error("Supabase client not initialized");

  // Login with email/password
  server.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body as Static<typeof LoginSchema>;

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).send({ error: error.message });
      }

      if (!data.session) {
        return res.status(401).send({ error: "Failed to create session" });
      }

      // Set HTTPOnly cookies
      res.setCookie("sb-access-token", data.session.access_token, {
        ...COOKIE_OPTIONS,
        maxAge: 3600, // 1 hour
      });

      res.setCookie("sb-refresh-token", data.session.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 604800, // 7 days
      });

      // Fetch user metadata from user_metadata table
      const { data: metadata, error: metadataError } = await supabase
        .from("user_metadata")
        .select("role, access_approved")
        .eq("user_id", data.user.id)
        .single();

      if (metadataError && metadataError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error fetching user metadata:", metadataError);
      }

      return res.send({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          emailVerified: !!data.user.email_confirmed_at,
          createdAt: data.user.created_at,
        },
        message: "Login successful",
      });
    } catch (error: any) {
      return res.status(500).send({
        error: "Internal server error: " + error.message,
      });
    }
  });

  // Refresh token endpoint
  server.post("/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies["sb-refresh-token"];

      if (!refreshToken) {
        return res.status(401).send({ error: "No refresh token found" });
      }

      // Refresh the session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session || !data.user) {
        res.clearCookie("sb-access-token");
        res.clearCookie("sb-refresh-token");
        return res.status(401).send({ error: "Invalid refresh token" });
      }

      // Update cookies with new tokens
      res.setCookie("sb-access-token", data.session.access_token, {
        ...COOKIE_OPTIONS,
        maxAge: 3600,
      });

      res.setCookie("sb-refresh-token", data.session.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 604800,
      });

      // Fetch user metadata from user_metadata table
      const { data: metadata, error: metadataError } = await supabase
        .from("user_metadata")
        .select("role, access_approved")
        .eq("user_id", data.user.id)
        .single();

      if (metadataError && metadataError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error fetching user metadata:", metadataError);
      }

      return res.send({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          emailVerified: !!data.user.email_confirmed_at,
          createdAt: data.user.created_at,
        },
        message: "Token refreshed successfully",
      });
    } catch (error: any) {
      return res.status(500).send({
        error: "Internal server error: " + error.message,
      });
    }
  });

  // Logout endpoint
  server.post("/logout", async (req, res) => {
    try {
      const accessToken = req.cookies["sb-access-token"];

      if (accessToken) {
        // Revoke the session in Supabase
        await supabase.auth.admin.signOut(accessToken);
      }

      // Clear cookies
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");

      return res.send({ message: "Logged out successfully" });
    } catch (error: any) {
      // Still clear cookies even if Supabase call fails
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");

      return res.status(500).send({
        error: "Internal server error: " + error.message,
      });
    }
  });

  // Logout all devices endpoint
  server.post("/logout-all", async (req, res) => {
    try {
      const accessToken = req.cookies["sb-access-token"];

      if (!accessToken) {
        return res.status(401).send({ error: "Not authenticated" });
      }

      // Get user from token
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(accessToken);

      if (userError || !user) {
        return res.status(401).send({ error: "Invalid token" });
      }

      // Sign out all sessions for this user
      const { error } = await supabase.auth.admin.signOut(user.id, "global");

      if (error) {
        return res.status(500).send({ error: error.message });
      }

      // Clear cookies
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");

      return res.send({ message: "Logged out from all devices" });
    } catch (error: any) {
      return res.status(500).send({
        error: "Internal server error: " + error.message,
      });
    }
  });

  // Get current user endpoint
  server.get("/me", async (req, res) => {
    try {
      const accessToken = req.cookies["sb-access-token"];

      if (!accessToken) {
        return res.status(401).send({ error: "Not authenticated" });
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        res.clearCookie("sb-access-token");
        res.clearCookie("sb-refresh-token");
        return res.status(401).send({ error: "Invalid token" });
      }

      // Fetch user metadata from user_metadata table
      const { data: metadata, error: metadataError } = await supabase
        .from("user_metadata")
        .select("role, access_approved")
        .eq("user_id", user.id)
        .single();

      if (metadataError && metadataError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error("Error fetching user metadata:", metadataError);
      }

      return res.send({
        user: {
          id: user.id,
          email: user.email!,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          emailVerified: !!user.email_confirmed_at,
          createdAt: user.created_at,
        },
      });
    } catch (error: any) {
      return res.status(500).send({
        error: "Internal server error: " + error.message,
      });
    }
  });

  // Middleware to verify admin/sponsor access
  const verifyAdminOrSponsor = async (req: any, res: any) => {
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

    if (metadataError || !metadata || (metadata.role !== "admin" && metadata.role !== "sponsor")) {
      return res.status(403).send({ error: "Forbidden: Admin or Sponsor access required" });
    }

    // Attach user to request
    req.user = user;
  };

  // Invite user endpoint (admin/sponsor only)
  server.post(
    "/invite",
    {
      schema: {
        body: InviteUserSchema,
      },
      preHandler: verifyAdminOrSponsor,
    },
    async (req, res) => {
      try {
        const { email, phone, role } = req.body as Static<typeof InviteUserSchema>;
        const invitedBy = (req as any).user.id;

        // Validate that at least email or phone is provided
        if (!email && !phone) {
          return res.status(400).send({
            error: "Either email or phone number is required",
          });
        }

        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

        // Create user via Supabase Admin API
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          phone,
          password: tempPassword,
          email_confirm: false,
          phone_confirm: false,
        });

        if (error) {
          return res.status(400).send({
            error: "Failed to create user: " + error.message,
          });
        }

        // Determine access_approved based on role
        const accessApproved = role === 'subscriber' ? false : true;

        // Insert into user_metadata table with invited_by
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .insert({
            user_id: data.user.id,
            role,
            access_approved: accessApproved,
            invited_by: invitedBy,
          });

        if (metadataError) {
          console.error("Failed to create user metadata:", metadataError);
          // Rollback: delete the auth user if metadata creation fails
          await supabase.auth.admin.deleteUser(data.user.id);
          return res.status(500).send({
            error: "Failed to create user metadata: " + metadataError.message,
          });
        }

        // Send invite based on contact method
        if (email) {
          // Generate invite token
          const { data: inviteData, error: inviteTokenError } =
            await supabase.auth.admin.generateLink({
              type: "invite",
              email,
            });

          if (inviteTokenError || !inviteData) {
            console.error("Failed to generate invite token:", inviteTokenError);
            return res.status(500).send({
              error: "User created but failed to generate invite token",
            });
          }

          // Send invite email via Resend
          const inviteUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=invite&next=/complete-profile`;
          const emailResult = await sendInviteEmail({
            to: email,
            inviteUrl,
          });

          if (!emailResult.success) {
            console.error("Failed to send email invite:", emailResult.error);
            return res.status(500).send({
              error: `User created but failed to send email invite: ${emailResult.error}`,
            });
          }
        }

        // Note: SMS invites would need to be implemented separately
        // Supabase doesn't have a built-in admin.inviteUserByPhone method
        // You'll need to use a service like Twilio, AWS SNS, etc.
        if (phone && !email) {
          // TODO: Implement SMS invite sending
          console.log("SMS invite not yet implemented. User created with phone:", phone);
        }

        return res.send({
          message: "Invitation sent successfully",
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            role,
            accessApproved,
          },
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Bulk invite users endpoint (admin/sponsor only)
  server.post(
    "/invite-bulk",
    {
      schema: {
        body: BulkInviteUserSchema,
      },
      preHandler: verifyAdminOrSponsor,
    },
    async (req, res) => {
      try {
        const { users } = req.body as Static<typeof BulkInviteUserSchema>;
        const invitedBy = (req as any).user.id;

        const results = {
          successful: [] as any[],
          failed: [] as any[],
        };

        for (const userData of users) {
          const { email, phone, role } = userData;

          // Validate that at least email or phone is provided
          if (!email && !phone) {
            results.failed.push({
              email,
              phone,
              error: "Either email or phone number is required",
            });
            continue;
          }

          try {
            // Generate a random temporary password
            const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);

            // Create user via Supabase Admin API
            const { data, error } = await supabase.auth.admin.createUser({
              email,
              phone,
              password: tempPassword,
              email_confirm: false,
              phone_confirm: false,
            });

            if (error) {
              results.failed.push({
                email,
                phone,
                error: error.message,
              });
              continue;
            }

            // Determine access_approved based on role
            const accessApproved = role === 'subscriber' ? false : true;

            // Insert into user_metadata table with invited_by
            const { error: metadataError } = await supabase
              .from("user_metadata")
              .insert({
                user_id: data.user.id,
                role,
                access_approved: accessApproved,
                invited_by: invitedBy,
              });

            if (metadataError) {
              // Rollback: delete the auth user if metadata creation fails
              await supabase.auth.admin.deleteUser(data.user.id);
              results.failed.push({
                email,
                phone,
                error: "Failed to create user metadata: " + metadataError.message,
              });
              continue;
            }

            // Send invite based on contact method
            if (email) {
              // Generate invite token
              const { data: inviteData, error: inviteTokenError } =
                await supabase.auth.admin.generateLink({
                  type: "invite",
                  email,
                });

              if (inviteTokenError || !inviteData) {
                console.error("Failed to generate invite token:", inviteTokenError);
                results.failed.push({
                  email,
                  phone,
                  error: "Failed to generate invite token",
                });
                continue;
              }

              // Send invite email via Resend
              const inviteUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=invite&next=/complete-profile`;
              const emailResult = await sendInviteEmail({
                to: email,
                inviteUrl,
              });

              if (!emailResult.success) {
                console.error("Failed to send email invite:", emailResult.error);
                results.failed.push({
                  email,
                  phone,
                  error: "User created but failed to send email invite",
                });
                continue;
              }
            }

            // Note: SMS invites would need to be implemented separately
            if (phone && !email) {
              console.log("SMS invite not yet implemented. User created with phone:", phone);
            }

            results.successful.push({
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone,
              role,
            });
          } catch (error: any) {
            results.failed.push({
              email,
              phone,
              error: error.message,
            });
          }
        }

        return res.send({
          message: `Bulk invite completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
          results,
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Complete profile endpoint (for invited users)
  server.post(
    "/complete-profile",
    {
      schema: {
        body: CompleteProfileSchema,
      },
    },
    async (req, res) => {
      try {
        const accessToken = req.headers.authorization?.replace("Bearer ", "");

        if (!accessToken) {
          return res.status(401).send({ error: "No access token provided" });
        }

        // Get user from token
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser(accessToken);

        if (userError || !user) {
          return res.status(401).send({ error: "Invalid access token" });
        }

        const { email, phone, password } = req.body as Static<
          typeof CompleteProfileSchema
        >;

        // Update user with new information
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email: email || user.email,
            phone: phone || user.phone,
            password: password,
            email_confirm: true, // Auto-confirm email since they were invited
          }
        );

        if (updateError) {
          return res.status(400).send({
            error: "Failed to update profile: " + updateError.message,
          });
        }

        // Create a new session for the user with their new password
        const { data: sessionData, error: sessionError } =
          await supabase.auth.signInWithPassword({
            email: email || user.email!,
            password: password,
          });

        if (sessionError || !sessionData.session) {
          return res.status(500).send({
            error: "Profile updated but failed to create session",
          });
        }

        // Set HTTPOnly cookies for the new session
        res.setCookie("sb-access-token", sessionData.session.access_token, {
          ...COOKIE_OPTIONS,
          maxAge: 3600,
        });

        res.setCookie("sb-refresh-token", sessionData.session.refresh_token, {
          ...COOKIE_OPTIONS,
          maxAge: 604800,
        });

        // Fetch user metadata from user_metadata table
        const { data: metadata, error: metadataError } = await supabase
          .from("user_metadata")
          .select("role, access_approved")
          .eq("user_id", sessionData.user.id)
          .single();

        if (metadataError && metadataError.code !== "PGRST116") {
          // PGRST116 is "not found" error
          console.error("Error fetching user metadata:", metadataError);
        }

        return res.send({
          message: "Profile completed successfully",
          user: {
            id: sessionData.user.id,
            email: sessionData.user.email!,
            phone: sessionData.user.phone,
            role: metadata?.role || null,
            accessApproved: metadata?.access_approved || false,
            emailVerified: !!sessionData.user.email_confirmed_at,
            createdAt: sessionData.user.created_at,
          },
        });
      } catch (error: any) {
        return res
          .status(500)
          .send({ error: "Internal server error: " + error.message });
      }
    }
  );
}
