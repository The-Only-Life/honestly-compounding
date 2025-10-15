import type { FastifyInstance } from "fastify";
import {
  InviteUserSchema,
  LoginSchema,
  CompleteProfileSchema,
} from "../schemas/auth.schema";
import type { FastifyCustomOptions } from "../types";
import type { Static } from "@fastify/type-provider-typebox";
import Config from "../server.config";

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

        return res.send({
          user: {
            id: data.user.id,
            email: data.user.email!,
            role: data.user.role,
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
    }
  );

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

      return res.send({
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: data.user.role,
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
    }
  );

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

      return res.send({
        user: {
          id: user.id,
          email: user.email!,
          role: user.role,
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

  // Invite user endpoint (admin only)
  server.post(
    "/invite",
    {
      schema: {
        body: InviteUserSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    async (req, res) => {
      try {
        const { email } = req.body as Static<typeof InviteUserSchema>;

        const { data, error } = await supabase.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo: `${Config.FRONTEND_URL}/complete-profile`,
          }
        );

        if (error) {
          return res
            .status(400)
            .send({ error: "Error while sending invite: " + error.message });
        }

        return res.send({
          message: "Invitation sent successfully",
          user: data.user,
        });
      } catch (error: any) {
        return res
          .status(500)
          .send({ error: "Internal server error: " + error.message });
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
        const { error: updateError } =
          await supabase.auth.admin.updateUserById(user.id, {
            email: email || user.email,
            phone: phone || user.phone,
            password: password,
            email_confirm: true, // Auto-confirm email since they were invited
          });

        if (updateError) {
          return res
            .status(400)
            .send({ error: "Failed to update profile: " + updateError.message });
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

        return res.send({
          message: "Profile completed successfully",
          user: {
            id: sessionData.user.id,
            email: sessionData.user.email!,
            phone: sessionData.user.phone,
            role: sessionData.user.role,
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
