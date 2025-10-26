import type { FastifyInstance } from "fastify";
import type { FastifyCustomOptions } from "../types";
import { randomBytes } from "crypto";

// Simple CUID-like ID generator
const generateId = () => `c${randomBytes(12).toString("base64url")}`;

export default async function bucketsRouter(
  server: FastifyInstance,
  options: FastifyCustomOptions
) {
  const { supabase } = options;
  if (!supabase) throw new Error("Supabase client not initialized");

  // Middleware to verify admin role
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

    // Fetch role from user_metadata
    const { data: metadata, error: metadataError } = await supabase
      .from("user_metadata")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (metadataError || !metadata || metadata.role !== "admin") {
      return res
        .status(403)
        .send({ error: "Forbidden: Admin access required" });
    }

    req.user = user;
  };

  // GET /api/buckets - List all buckets (public for authenticated users)
  server.get("/", async (req, res) => {
      try {
        const accessToken = req.cookies["sb-access-token"];

        if (!accessToken) {
          return res.status(401).send({ error: "Not authenticated" });
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(accessToken);

        if (authError || !user) {
          return res.status(401).send({ error: "Invalid token" });
        }

        // Fetch all buckets with creator info
        const { data: buckets, error } = await supabase
          .from("buckets")
          .select(
            `
            id,
            name,
            description,
            risk_measure,
            created_by,
            created_at,
            updated_at,
            creator:profiles!buckets_creator_fkey(full_name)
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          req.log.error(error);
          return res.status(500).send({ error: "Failed to fetch buckets" });
        }

        // Transform the response to match schema
        const formattedBuckets = (buckets || []).map((bucket: any) => ({
          id: bucket.id,
          name: bucket.name,
          description: bucket.description,
          riskMeasure: bucket.risk_measure,
          createdBy: bucket.created_by,
          createdAt: bucket.created_at,
          updatedAt: bucket.updated_at,
          creator: bucket.creator
            ? { fullName: bucket.creator.full_name }
            : undefined,
        }));

        return res.send({
          buckets: formattedBuckets,
          total: formattedBuckets.length,
        });
      } catch (err) {
        req.log.error(err);
        return res.status(500).send({ error: "Internal server error" });
      }
    }
  );

  // POST /api/buckets - Create a new bucket (admin only)
  server.post("/", { preHandler: verifyAdmin }, async (req, res) => {
    try {
      const { name, description, riskMeasure } = req.body as any;
      const user = (req as any).user;

      // Get user's profile ID (userId)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).send({ error: "User profile not found" });
      }

      const bucketId = generateId();
      const now = new Date().toISOString();

      // Insert the new bucket
      const { data: bucket, error } = await supabase
        .from("buckets")
        .insert({
          id: bucketId,
          name,
          description,
          risk_measure: riskMeasure,
          created_by: profile.user_id,
          created_at: now,
          updated_at: now,
        })
        .select(
          `
          id,
          name,
          description,
          risk_measure,
          created_by,
          created_at,
          updated_at,
          creator:profiles!buckets_creator_fkey(full_name)
        `
        )
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          return res
            .status(409)
            .send({ error: "A bucket with this name already exists" });
        }
        req.log.error(error);
        return res.status(500).send({ error: "Failed to create bucket" });
      }

      // Format response
      const formattedBucket = {
        id: bucket.id,
        name: bucket.name,
        description: bucket.description,
        riskMeasure: bucket.risk_measure,
        createdBy: bucket.created_by,
        createdAt: bucket.created_at,
        updatedAt: bucket.updated_at,
        creator: bucket.creator
          ? { fullName: (bucket.creator as any).full_name }
          : undefined,
      };

      return res.status(201).send(formattedBucket);
      } catch (err) {
        req.log.error(err);
        return res.status(500).send({ error: "Internal server error" });
      }
    });

  // GET /api/buckets/:id - Get a single bucket by ID
  server.get("/:id", async (req, res) => {
      try {
        const accessToken = req.cookies["sb-access-token"];

        if (!accessToken) {
          return res.status(401).send({ error: "Not authenticated" });
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(accessToken);

        if (authError || !user) {
          return res.status(401).send({ error: "Invalid token" });
        }

        const { id } = req.params as any;

        const { data: bucket, error } = await supabase
          .from("buckets")
          .select(
            `
            id,
            name,
            description,
            risk_measure,
            created_by,
            created_at,
            updated_at,
            creator:profiles!buckets_creator_fkey(full_name)
          `
          )
          .eq("id", id)
          .single();

        if (error || !bucket) {
          return res.status(404).send({ error: "Bucket not found" });
        }

        const formattedBucket = {
          id: bucket.id,
          name: bucket.name,
          description: bucket.description,
          riskMeasure: bucket.risk_measure,
          createdBy: bucket.created_by,
          createdAt: bucket.created_at,
          updatedAt: bucket.updated_at,
          creator: bucket.creator
            ? { fullName: (bucket.creator as any).full_name }
            : undefined,
        };

        return res.send(formattedBucket);
      } catch (err) {
        req.log.error(err);
        return res.status(500).send({ error: "Internal server error" });
      }
    });
}
