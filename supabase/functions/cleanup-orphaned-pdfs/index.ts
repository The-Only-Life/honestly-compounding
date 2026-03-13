import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    const expectedKey = Deno.env.get("CLEANUP_SECRET_KEY");

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all PDFs from storage
    const { data: files, error: listError } = await supabase.storage
      .from("research-pdfs")
      .list("stocks");

    if (listError) {
      console.error("Error listing files:", listError);
      throw listError;
    }

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: "No files found in storage" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all PDF URLs from stocks table
    const { data: stocks, error: stocksError } = await supabase
      .from("stocks")
      .select("pdf_url")
      .not("pdf_url", "is", null);

    if (stocksError) {
      console.error("Error fetching stocks:", stocksError);
      throw stocksError;
    }

    // Extract file paths from PDF URLs
    const referencedPaths = new Set(
      (stocks || [])
        .map((s) => {
          if (!s.pdf_url) return null;
          const parts = s.pdf_url.split("/research-pdfs/");
          return parts.length > 1 ? parts[1] : null;
        })
        .filter(Boolean) as string[]
    );

    // Find orphaned files
    const orphanedFiles = files.filter(
      (file) => !referencedPaths.has(`stocks/${file.name}`)
    );

    if (orphanedFiles.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No orphaned PDFs found",
          totalFiles: files.length,
          referencedFiles: referencedPaths.size
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete orphaned PDFs
    const pathsToDelete = orphanedFiles.map((f) => `stocks/${f.name}`);

    const { data: deleteData, error: deleteError } = await supabase.storage
      .from("research-pdfs")
      .remove(pathsToDelete);

    if (deleteError) {
      console.error("Error deleting files:", deleteError);
      throw deleteError;
    }

    return new Response(
      JSON.stringify({
        message: `Successfully deleted ${orphanedFiles.length} orphaned PDFs`,
        deletedFiles: pathsToDelete,
        totalFiles: files.length,
        referencedFiles: referencedPaths.size
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup function error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
