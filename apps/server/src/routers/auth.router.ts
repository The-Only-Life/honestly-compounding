import type { FastifyInstance } from "fastify";
import {
  InviteUserSchema,
  BulkInviteUserSchema,
  LoginSchema,
  VerifyInviteSchema,
  CompleteProfileSchema,
  SendOTPSchema,
  VerifyOTPSchema,
} from "../schemas/auth.schema";
import type { FastifyCustomOptions } from "../types";
import type { Static } from "@fastify/type-provider-typebox";
import Config from "../server.config";
import { sendInviteEmail } from "../utils/email";
import { verifyRecaptcha } from "../utils/recaptcha";

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

    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // Login with email/password
  server.post("/login", async (req, res) => {
    try {
      const { email, password, captchaToken } = req.body as Static<typeof LoginSchema> & { captchaToken?: string };
      // Verify CAPTCHA if provided
      if (captchaToken) {
        const captchaValid = await verifyRecaptcha(captchaToken, req.ip);
        if (!captchaValid) {
          return res.status(400).send({ error: "Invalid CAPTCHA verification" });
        }
      }

      if (!emailRegex.test(email)) {
        console.log("Invalid email format:", email);
        return res.status(400).send({ error: "Invalid email format" });
      }

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
        maxAge: 604800, // 7 days
      });

      res.setCookie("sb-refresh-token", data.session.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 604800, // 7 days
      });

      // Fetch user metadata from user_metadata table
      const { data: metadata, error: metadataError } = await supabase
        .from("user_metadata")
        .select("role, access_approved, profile_completed, has_agreed_to_terms, full_name, phone")
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
          phone: metadata?.phone || null,
          fullName: metadata?.full_name || null,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          profileCompleted: metadata?.profile_completed || false,
          hasAgreedToTerms: metadata?.has_agreed_to_terms || false,
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
        maxAge: 604800, // 7 days
      });

      res.setCookie("sb-refresh-token", data.session.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 604800, // 7 days
      });

      // Fetch user metadata from user_metadata table
      const { data: metadata, error: metadataError } = await supabase
        .from("user_metadata")
        .select("role, access_approved, profile_completed, has_agreed_to_terms, full_name, phone")
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
          phone: metadata?.phone || null,
          fullName: metadata?.full_name || null,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          profileCompleted: metadata?.profile_completed || false,
          hasAgreedToTerms: metadata?.has_agreed_to_terms || false,
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
        .select("role, access_approved, profile_completed, has_agreed_to_terms, full_name, phone")
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
          phone: metadata?.phone || null,
          fullName: metadata?.full_name || null,
          role: metadata?.role || null,
          accessApproved: metadata?.access_approved || false,
          profileCompleted: metadata?.profile_completed || false,
          hasAgreedToTerms: metadata?.has_agreed_to_terms || false,
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

        // Determine contact method
        const contactMethod = email ? 'email' : 'phone';

        // Insert into user_metadata table with invited_by and contact_method
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .insert({
            user_id: data.user.id,
            role,
            access_approved: accessApproved,
            invited_by: invitedBy,
            contact_method: contactMethod,
            profile_completed: false,
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

            // Determine contact method
            const contactMethod = email ? 'email' : 'phone';

            // Insert into user_metadata table with invited_by and contact_method
            const { error: metadataError } = await supabase
              .from("user_metadata")
              .insert({
                user_id: data.user.id,
                role,
                access_approved: accessApproved,
                invited_by: invitedBy,
                contact_method: contactMethod,
                profile_completed: false,
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

  // Verify invite token endpoint
  // This endpoint exchanges the token_hash from the invite email for a real JWT access token
  server.post(
    "/verify-invite",
    {
      schema: {
        body: VerifyInviteSchema,
      },
    },
    async (req, res) => {
      try {
        const { token_hash, type } = req.body as Static<typeof VerifyInviteSchema>;

        // Verify the token_hash with Supabase to get a session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });

        if (error) {
          console.error("Token verification error:", error);
          return res.status(401).send({ error: error.message || "Invalid or expired invitation token" });
        }

        if (!data.session) {
          return res.status(401).send({ error: "Failed to create session from invitation" });
        }

        // The session was successfully created, now we return the access token
        // so the frontend can use it in the complete-profile endpoint
        return res.send({
          message: "Invitation verified successfully",
          access_token: data.session.access_token,
        });
      } catch (error: any) {
        console.error("Verify invite error:", error);
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

        const { email, phone, full_name, password } = req.body as Static<
          typeof CompleteProfileSchema
        >;

        // Update user with new information
        // Note: We do NOT set email_confirm: true here. Email verification happens
        // when they click the invite link. This allows admins to regenerate links.
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email: email || user.email,
            phone: phone || user.phone,
            password: password,
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
          maxAge: 604800, // 7 days
        });

        res.setCookie("sb-refresh-token", sessionData.session.refresh_token, {
          ...COOKIE_OPTIONS,
          maxAge: 604800, // 7 days
        });

        // Update user_metadata: mark profile as completed and persist name/phone
        const { error: updateMetadataError } = await supabase
          .from("user_metadata")
          .update({
            profile_completed: true,
            ...(full_name ? { full_name } : {}),
            ...(phone ? { phone } : {}),
          })
          .eq("user_id", sessionData.user.id);

        if (updateMetadataError) {
          console.error("Failed to update profile_completed flag:", updateMetadataError);
        }

        // Fetch user metadata from user_metadata table
        const { data: metadata, error: metadataError } = await supabase
          .from("user_metadata")
          .select("role, access_approved, profile_completed, has_agreed_to_terms, full_name, phone")
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
            phone: metadata?.phone || sessionData.user.phone,
            fullName: metadata?.full_name || null,
            role: metadata?.role || null,
            accessApproved: metadata?.access_approved || false,
            profileCompleted: metadata?.profile_completed || false,
            hasAgreedToTerms: metadata?.has_agreed_to_terms || false,
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

  // Generate verification link for a user (admin only)
  server.post(
    "/generate-verification-link",
    {
      preHandler: async (req, res) => {
        // Verify user is admin
        const accessToken = req.cookies["sb-access-token"];
        if (!accessToken) {
          return res.status(401).send({ error: "Unauthorized" });
        }

        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (error || !user) {
          return res.status(401).send({ error: "Unauthorized" });
        }

        const { data: metadata } = await supabase
          .from("user_metadata")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (metadata?.role !== "admin" && metadata?.role !== "sponsor") {
          return res.status(403).send({ error: "Forbidden: Admin or Sponsor access required" });
        }

        (req as any).user = user;
      },
    },
    async (req, res) => {
      try {
        const { userId } = req.body as { userId: string };

        if (!userId) {
          return res.status(400).send({ error: "User ID is required" });
        }

        // Get user details
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError || !userData?.user) {
          return res.status(404).send({ error: "User not found" });
        }

        const user = userData.user;

        // Check if user has email
        if (!user.email) {
          return res.status(400).send({
            error: "User does not have an email address. Verification links require email."
          });
        }

        // Use "recovery" type for existing users — "invite" fails with email_exists for them
        const { data: inviteData, error: inviteTokenError } =
          await supabase.auth.admin.generateLink({
            type: "recovery",
            email: user.email,
          });

        if (inviteTokenError || !inviteData) {
          console.error("Failed to generate verification token:", inviteTokenError);
          return res.status(500).send({
            error: "Failed to generate verification link",
          });
        }

        // Generate the verification URL
        const verificationUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=recovery&next=/complete-profile`;

        return res.send({
          message: "Verification link generated successfully",
          verificationUrl,
          user: {
            id: user.id,
            email: user.email,
            emailVerified: !!user.email_confirmed_at,
          },
        });
      } catch (error: any) {
        console.error("Generate verification link error:", error);
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Resend invitation email to an existing user (admin/sponsor only)
  server.post(
    "/resend-invite",
    {
      preHandler: verifyAdminOrSponsor,
    },
    async (req, res) => {
      try {
        const { userId } = req.body as { userId: string };

        if (!userId) {
          return res.status(400).send({ error: "User ID is required" });
        }

        // Get user details
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError || !userData?.user) {
          return res.status(404).send({ error: "User not found" });
        }

        const user = userData.user;

        // Check if user has email
        if (!user.email) {
          return res.status(400).send({
            error: "User does not have an email address. Cannot resend invitation."
          });
        }

        // Generate new invite token
        const { data: inviteData, error: inviteTokenError } =
          await supabase.auth.admin.generateLink({
            type: "invite",
            email: user.email,
          });

        if (inviteTokenError || !inviteData) {
          console.error("Failed to generate invite token:", inviteTokenError);
          return res.status(500).send({
            error: "Failed to generate invitation link",
          });
        }

        // Send invite email via Resend
        const inviteUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=invite&next=/complete-profile`;
        const emailResult = await sendInviteEmail({
          to: user.email,
          inviteUrl,
        });

        if (!emailResult.success) {
          console.error("Failed to send invitation email:", emailResult.error);
          return res.status(500).send({
            error: `Failed to send invitation email: ${emailResult.error}`,
          });
        }

        return res.send({
          message: "Invitation email resent successfully",
          user: {
            id: user.id,
            email: user.email,
          },
        });
      } catch (error: any) {
        console.error("Resend invitation error:", error);
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Send OTP to phone number
  server.post(
    "/phone/send-otp",
    {
      schema: {
        body: SendOTPSchema,
      },
    },
    async (req, res) => {
      try {
        const { phone } = req.body as Static<typeof SendOTPSchema>;

        // Send OTP via Supabase (SMS channel)
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            channel: 'sms',
          },
        });

        if (error) {
          return res.status(400).send({
            error: "Failed to send OTP: " + error.message,
          });
        }

        return res.send({
          message: "OTP sent successfully",
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Verify OTP and create session
  server.post(
    "/phone/verify-otp",
    {
      schema: {
        body: VerifyOTPSchema,
      },
    },
    async (req, res) => {
      try {
        const { phone, otp } = req.body as Static<typeof VerifyOTPSchema>;

        // Verify OTP with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });

        if (error) {
          return res.status(401).send({
            error: "Invalid OTP: " + error.message,
          });
        }

        if (!data.session || !data.user) {
          return res.status(401).send({
            error: "Failed to create session",
          });
        }

        // Set HTTPOnly cookies
        res.setCookie("sb-access-token", data.session.access_token, {
          ...COOKIE_OPTIONS,
          maxAge: 604800, // 7 days
        });

        res.setCookie("sb-refresh-token", data.session.refresh_token, {
          ...COOKIE_OPTIONS,
          maxAge: 604800, // 7 days
        });

        // Fetch user metadata from user_metadata table
        const { data: metadata, error: metadataError } = await supabase
          .from("user_metadata")
          .select("role, access_approved, profile_completed, has_agreed_to_terms, full_name, phone")
          .eq("user_id", data.user.id)
          .single();

        if (metadataError && metadataError.code !== "PGRST116") {
          console.error("Error fetching user metadata:", metadataError);
        }

        // Check if user needs to complete profile based on profile_completed flag
        const needsProfileCompletion = !metadata?.profile_completed;

        return res.send({
          message: "OTP verified successfully",
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: metadata?.phone || data.user.phone,
            fullName: metadata?.full_name || null,
            role: metadata?.role || null,
            accessApproved: metadata?.access_approved || false,
            profileCompleted: metadata?.profile_completed || false,
            hasAgreedToTerms: metadata?.has_agreed_to_terms || false,
            emailVerified: !!data.user.email_confirmed_at,
            createdAt: data.user.created_at,
          },
          needsProfileCompletion,
          accessToken: needsProfileCompletion ? data.session.access_token : undefined,
        });
      } catch (error: any) {
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );
}
