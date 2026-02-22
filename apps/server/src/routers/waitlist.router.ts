import type { FastifyInstance } from "fastify";
import {
  JoinWaitlistSchema,
  GetWaitlistSchema,
  ApproveWaitlistSchema,
} from "../schemas/waitlist.schema";
import type { FastifyCustomOptions } from "../types";
import type { Static } from "@fastify/type-provider-typebox";
import Config from "../server.config";
import { sendWaitlistApprovalEmail } from "../utils/email";
import { verifyRecaptcha } from "../utils/recaptcha";

export default async function waitlistRouter(
  server: FastifyInstance,
  options: FastifyCustomOptions
) {
  const { supabase } = options;
  if (!supabase) throw new Error("Supabase client not initialized");

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

    if (
      metadataError ||
      !metadata ||
      (metadata.role !== "admin" && metadata.role !== "sponsor")
    ) {
      return res
        .status(403)
        .send({ error: "Forbidden: Admin or Sponsor access required" });
    }

    // Attach user to request
    req.user = user;
  };

  // Join waitlist endpoint (public)
  server.post(
    "/join",
    {
      schema: {
        body: JoinWaitlistSchema,
      },
    },
    async (req, res) => {
      try {
        const { email, name, phone, captchaToken } = req.body as Static<typeof JoinWaitlistSchema> & { captchaToken?: string };
        const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

        // Check if email already exists
        const { data: existing } = await supabase
          .from("waitlist")
          .select("id, status")
          .eq("email", email)
          .single();

        if (existing) {
          if (existing.status === "invited") {
            return res.status(400).send({
              error: "You've already been invited! Check your email for the invitation link.",
            });
          }
          return res.status(400).send({
            error: "You're already on the waitlist!",
          });
        }

        // Insert into waitlist
        const { data, error } = await supabase
          .from("waitlist")
          .insert({
            email,
            name: name || null,
            phone: phone || null,
            status: "pending",
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to add to waitlist:", error);
          return res.status(500).send({
            error: "Failed to join waitlist. Please try again.",
          });
        }

        return res.send({
          message: "Successfully joined the waitlist! We'll be in touch soon.",
          data: {
            id: data.id,
            email: data.email,
            status: data.status,
          },
        });
      } catch (error: any) {
        console.error("Waitlist join error:", error);
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Get waitlist entries (admin/sponsor only)
  server.get(
    "/",
    {
      schema: {
        querystring: GetWaitlistSchema,
      },
      preHandler: verifyAdminOrSponsor,
    },
    async (req, res) => {
      try {
        const query = req.query as Static<typeof GetWaitlistSchema>;
        const { status } = query;

        let queryBuilder = supabase
          .from("waitlist")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false });

        if (status) {
          queryBuilder = queryBuilder.eq("status", status);
        }

        const { data, error, count } = await queryBuilder;

        if (error) {
          console.error("Failed to fetch waitlist:", error);
          return res.status(500).send({
            error: "Failed to fetch waitlist entries.",
          });
        }

        return res.send({
          data,
          count,
        });
      } catch (error: any) {
        console.error("Waitlist fetch error:", error);
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );

  // Approve waitlist entry and send invite (admin/sponsor only)
  server.post(
    "/approve",
    {
      schema: {
        body: ApproveWaitlistSchema,
      },
      preHandler: verifyAdminOrSponsor,
    },
    async (req, res) => {
      try {
        const { id, email } = req.body as Static<typeof ApproveWaitlistSchema>;
        const invitedBy = (req as any).user.id;

        // Verify the waitlist entry exists and is pending
        const { data: waitlistEntry, error: fetchError } = await supabase
          .from("waitlist")
          .select("id, email, name, phone, status")
          .eq("id", id)
          .eq("email", email)
          .single();

        if (fetchError || !waitlistEntry) {
          return res.status(404).send({
            error: "Waitlist entry not found",
          });
        }

        if (waitlistEntry.status === "invited") {
          return res.status(400).send({
            error: "This user has already been invited",
          });
        }

        // Generate a random temporary password
        const tempPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).slice(-12);

        // Create user via Supabase Admin API, storing name in user_metadata
        // so CompleteProfile can pre-populate the field from the JWT
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: false,
            user_metadata: {
              full_name: waitlistEntry.name || null,
            },
          });

        if (authError) {
          return res.status(400).send({
            error: "Failed to create user: " + authError.message,
          });
        }

        // Insert into user_metadata table with subscriber role, carrying
        // name and phone captured from the waitlist submission
        const { error: metadataError } = await supabase
          .from("user_metadata")
          .insert({
            user_id: authData.user.id,
            role: "subscriber",
            access_approved: false,
            invited_by: invitedBy,
            contact_method: "email",
            profile_completed: false,
            full_name: waitlistEntry.name || null,
            phone: waitlistEntry.phone || null,
          });

        if (metadataError) {
          console.error("Failed to create user metadata:", metadataError);
          // Rollback: delete the auth user if metadata creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          return res.status(500).send({
            error: "Failed to create user metadata: " + metadataError.message,
          });
        }

        // Generate invite token for the URL
        const { data: inviteData, error: inviteTokenError} =
          await supabase.auth.admin.generateLink({
            type: "invite",
            email,
          });

        if (inviteTokenError || !inviteData) {
          console.error("Failed to generate invite token:", inviteTokenError);
          await supabase.auth.admin.deleteUser(authData.user.id);
          return res.status(500).send({
            error: "Failed to generate invite token",
          });
        }

        // Send invite email via Resend
        const inviteUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=invite&next=/complete-profile`;
        const emailResult = await sendWaitlistApprovalEmail({
          to: email,
          inviteUrl,
        });

        if (!emailResult.success) {
          console.error("Failed to send email invite:", emailResult.error);
          // Don't rollback here, just notify - user is already created
          return res.status(500).send({
            error: `User created but failed to send email invite: ${emailResult.error}`,
          });
        }

        // Update waitlist status to invited
        const { error: updateError } = await supabase
          .from("waitlist")
          .update({ status: "invited" })
          .eq("id", id);

        if (updateError) {
          console.error("Failed to update waitlist status:", updateError);
          // Don't fail the request, user is already invited
        }

        return res.send({
          message: "User approved and invitation sent successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: "subscriber",
          },
        });
      } catch (error: any) {
        console.error("Waitlist approval error:", error);
        return res.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );
}
