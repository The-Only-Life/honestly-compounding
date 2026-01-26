import type { FastifyInstance } from "fastify";
import type { FastifyCustomOptions } from "../types";
import { randomBytes } from "crypto";


// Simple CUID-like ID generator
const generateId = () => `c${randomBytes(12).toString("base64url")}`;

export default async function stocksRouter(
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

  // GET /api/stocks - List all stocks (public for authenticated users, with pagination)
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

      // Parse pagination parameters
      const query = req.query as any;
      const page = parseInt(query.page || "1", 10);
      const limit = parseInt(query.limit || "10", 10);
      const offset = (page - 1) * limit;

      // Fetch total count
      const { count, error: countError } = await supabase
        .from("stocks")
        .select("*", { count: "exact", head: true });

      if (countError) {
        req.log.error(countError);
        return res.status(500).send({ error: "Failed to fetch stock count" });
      }

      // Fetch stocks with creator, theme, and bucket info
      const { data: stocks, error } = await supabase
        .from("stocks")
        .select(
          `
          id,
          symbol,
          company_name,
          theme_id,
          bucket_id,
          pdf_url,
          created_by,
          created_at,
          updated_at,
          creator:profiles!stocks_creator_fkey(full_name),
          theme:themes!stocks_theme_fkey(id, name),
          bucket:buckets!stocks_bucket_fkey(id, name)
        `
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        req.log.error(error);
        return res.status(500).send({ error: "Failed to fetch stocks" });
      }

      // Transform the response to match schema
      const formattedStocks = (stocks || []).map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        companyName: stock.company_name,
        themeId: stock.theme_id,
        bucketId: stock.bucket_id,
        pdfUrl: stock.pdf_url,
        createdBy: stock.created_by,
        createdAt: stock.created_at,
        updatedAt: stock.updated_at,
        creator: stock.creator
          ? { fullName: (stock.creator as any).full_name }
          : undefined,
        theme: stock.theme
          ? { id: (stock.theme as any).id, name: (stock.theme as any).name }
          : undefined,
        bucket: stock.bucket
          ? { id: (stock.bucket as any).id, name: (stock.bucket as any).name }
          : undefined,
      }));

      return res.send({
        stocks: formattedStocks,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /api/stocks - Create a new stock (admin only)
  server.post("/", { preHandler: verifyAdmin }, async (req, res) => {
    try {
      const { symbol, companyName, themeId, bucketId, pdfUrl } = req.body as any;
      const user = (req as any).user;

      // Validate required fields
      if (!symbol || !companyName || !themeId || !bucketId) {
        return res.status(400).send({
          error: "Missing required fields: symbol, companyName, themeId, bucketId"
        });
      }

      // Get user's profile ID (userId)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).send({ error: "User profile not found" });
      }

      // Verify theme exists
      const { data: theme, error: themeError } = await supabase
        .from("themes")
        .select("id")
        .eq("id", themeId)
        .single();

      if (themeError || !theme) {
        return res.status(404).send({ error: "Theme not found" });
      }

      // Verify bucket exists
      const { data: bucket, error: bucketError } = await supabase
        .from("buckets")
        .select("id")
        .eq("id", bucketId)
        .single();

      if (bucketError || !bucket) {
        return res.status(404).send({ error: "Bucket not found" });
      }

      const stockId = generateId();
      const now = new Date().toISOString();

      // Insert the new stock
      const { data: stock, error } = await supabase
        .from("stocks")
        .insert({
          id: stockId,
          symbol: symbol.toUpperCase(), // Ensure uppercase for stock symbols
          company_name: companyName,
          theme_id: themeId,
          bucket_id: bucketId,
          pdf_url: pdfUrl || null,
          created_by: profile.user_id,
          created_at: now,
          updated_at: now,
        })
        .select(
          `
          id,
          symbol,
          company_name,
          theme_id,
          bucket_id,
          pdf_url,
          created_by,
          created_at,
          updated_at,
          creator:profiles!stocks_creator_fkey(full_name),
          theme:themes!stocks_theme_fkey(id, name),
          bucket:buckets!stocks_bucket_fkey(id, name)
        `
        )
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          return res
            .status(409)
            .send({ error: "A stock with this symbol already exists" });
        }
        req.log.error(error);
        return res.status(500).send({ error: "Failed to create stock" });
      }

      // Format response
      const formattedStock = {
        id: stock.id,
        symbol: stock.symbol,
        companyName: stock.company_name,
        themeId: stock.theme_id,
        bucketId: stock.bucket_id,
        pdfUrl: stock.pdf_url,
        createdBy: stock.created_by,
        createdAt: stock.created_at,
        updatedAt: stock.updated_at,
        creator: stock.creator
          ? { fullName: (stock.creator as any).full_name }
          : undefined,
        theme: stock.theme
          ? { id: (stock.theme as any).id, name: (stock.theme as any).name }
          : undefined,
        bucket: stock.bucket
          ? { id: (stock.bucket as any).id, name: (stock.bucket as any).name }
          : undefined,
      };

      return res.status(201).send(formattedStock);
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /api/stocks/:id - Get a single stock by ID
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

      const { data: stock, error } = await supabase
        .from("stocks")
        .select(
          `
          id,
          symbol,
          company_name,
          theme_id,
          bucket_id,
          pdf_url,
          created_by,
          created_at,
          updated_at,
          creator:profiles!stocks_creator_fkey(full_name),
          theme:themes!stocks_theme_fkey(id, name, description),
          bucket:buckets!stocks_bucket_fkey(id, name, description)
        `
        )
        .eq("id", id)
        .single();

      if (error || !stock) {
        return res.status(404).send({ error: "Stock not found" });
      }

      const formattedStock = {
        id: stock.id,
        symbol: stock.symbol,
        companyName: stock.company_name,
        themeId: stock.theme_id,
        bucketId: stock.bucket_id,
        pdfUrl: stock.pdf_url,
        createdBy: stock.created_by,
        createdAt: stock.created_at,
        updatedAt: stock.updated_at,
        creator: stock.creator
          ? { fullName: (stock.creator as any).full_name }
          : undefined,
        theme: stock.theme
          ? {
              id: (stock.theme as any).id,
              name: (stock.theme as any).name,
              description: (stock.theme as any).description
            }
          : undefined,
        bucket: stock.bucket
          ? {
              id: (stock.bucket as any).id,
              name: (stock.bucket as any).name,
              description: (stock.bucket as any).description
            }
          : undefined,
      };

      return res.send(formattedStock);
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // POST /api/stocks/upload-pdf - Upload PDF to Supabase Storage (admin only)
  server.post("/upload-pdf", { preHandler: verifyAdmin }, async (req, res) => {
    try {
      const data = await req.file();

      if (!data) {
        return res.status(400).send({ error: "No file uploaded" });
      }

    const buffer = await data.toBuffer();

    const fileName = `stocks/${Date.now()}-${data.filename}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("research-pdfs")
          .upload(fileName, buffer, {
            contentType: "application/pdf",
           upsert: false,
          });

      if (uploadError) {
        req.log.error(uploadError);
        return res.status(500).send({ error: "Failed to upload PDF" });
      }

      const { data: { publicUrl } } = supabase.storage
        .from("research-pdfs")
        .getPublicUrl(fileName);

      return res.send({
        fileName: uploadData.path,
        url: publicUrl,
      });
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /api/stocks/download-pdf/:fileName - Download PDF from Supabase Storage
  server.get("/download-pdf/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params as { fileName: string };

      if (!fileName) {
        return res.status(400).send({ error: "No filename provided" });
      }

      // Decode the filename (it might be URL encoded)
      const decodedFileName = decodeURIComponent(fileName);

      // Download from Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from("research-pdfs")
        .download(decodedFileName);

      if (downloadError) {
        req.log.error(downloadError);
        return res.status(404).send({ error: "PDF not found" });
      }

      if (!data) {
        return res.status(404).send({ error: "No data received" });
      }

      // Convert blob to buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Set headers for PDF
      res.header("Content-Type", "application/pdf");
      res.header("Content-Disposition", `inline; filename="${decodedFileName.split('/').pop()}"`);
      res.header("Content-Length", buffer.length.toString());

      return res.send(buffer);
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });
}
