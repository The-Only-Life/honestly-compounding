import type { FastifyInstance } from "fastify";
import type { FastifyCustomOptions } from "../types";
import { randomBytes } from "crypto";

// Simple CUID-like ID generator
const generateId = () => `c${randomBytes(12).toString("base64url")}`;

export default async function themesRouter(
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

  // GET /api/themes - List all themes (public for authenticated users)
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

      // Fetch all themes with creator info
      const { data: themes, error } = await supabase
        .from("themes")
        .select(
          `
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at,
          creator:profiles!themes_creator_fkey(full_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        req.log.error(error);
        return res.status(500).send({ error: "Failed to fetch themes" });
      }

      // Transform the response to match schema
      const formattedThemes = (themes || []).map((theme: any) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        createdBy: theme.created_by,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at,
        creator: theme.creator
          ? { fullName: (theme.creator as any).full_name }
          : undefined,
      }));

      return res.send({
        themes: formattedThemes,
        total: formattedThemes.length,
      });
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /api/themes - Create a new theme (admin only)
  server.post("/", { preHandler: verifyAdmin }, async (req, res) => {
    try {
      const { name, description } = req.body as any;
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

      const themeId = generateId();
      const now = new Date().toISOString();

      // Insert the new theme
      const { data: theme, error } = await supabase
        .from("themes")
        .insert({
          id: themeId,
          name,
          description,
          created_by: profile.user_id,
          created_at: now,
          updated_at: now,
        })
        .select(
          `
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at,
          creator:profiles!themes_creator_fkey(full_name)
        `
        )
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          return res
            .status(409)
            .send({ error: "A theme with this name already exists" });
        }
        req.log.error(error);
        return res.status(500).send({ error: "Failed to create theme" });
      }

      // Format response
      const formattedTheme = {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        createdBy: theme.created_by,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at,
        creator: theme.creator
          ? { fullName: (theme.creator as any).full_name }
          : undefined,
      };

      return res.status(201).send(formattedTheme);
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /api/themes/:id - Get a single theme by ID
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

      const { data: theme, error } = await supabase
        .from("themes")
        .select(
          `
          id,
          name,
          description,
          created_by,
          created_at,
          updated_at,
          creator:profiles!themes_creator_fkey(full_name)
        `
        )
        .eq("id", id)
        .single();

      if (error || !theme) {
        return res.status(404).send({ error: "Theme not found" });
      }

      const formattedTheme = {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        createdBy: theme.created_by,
        createdAt: theme.created_at,
        updatedAt: theme.updated_at,
        creator: theme.creator
          ? { fullName: (theme.creator as any).full_name }
          : undefined,
      };

      return res.send(formattedTheme);
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });
}
