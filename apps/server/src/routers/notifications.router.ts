import type { FastifyInstance } from "fastify";
import type { ServerResponse } from "http";
import type { FastifyCustomOptions } from "../types";
import { addClient, removeClient } from "../notification-broadcaster";

export default async function notificationsRouter(
  server: FastifyInstance,
  options: FastifyCustomOptions
) {
  const { supabase } = options;
  if (!supabase) throw new Error("Supabase client not initialized");

  // GET /api/notifications - Get recent notifications (authenticated users)
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

      // Fetch notifications ordered by created_at DESC (newest first)
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("id, entity_type, action, entity_id, entity_name, created_by, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        req.log.error(error);
        return res.status(500).send({ error: "Failed to fetch notifications" });
      }

      // Transform to camelCase for frontend
      const formattedNotifications = (notifications || []).map((notification: any) => ({
        id: notification.id,
        entityType: notification.entity_type,
        action: notification.action,
        entityId: notification.entity_id,
        entityName: notification.entity_name,
        createdBy: notification.created_by,
        createdAt: notification.created_at,
      }));

      return res.send({ notifications: formattedNotifications });
    } catch (err) {
      req.log.error(err);
      return res.status(500).send({ error: "Internal server error" });
    }
  });

  // GET /api/notifications/stream - SSE endpoint for real-time notification updates
  server.get("/stream", async (req, res) => {
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

    res.hijack();

    const raw = res.raw as ServerResponse;

    raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    addClient(raw);
    raw.write("event: connected\ndata: {}\n\n");

    const heartbeat = setInterval(() => {
      if (!raw.writableEnded) {
        raw.write(":heartbeat\n\n");
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);

    req.raw.on("close", () => {
      clearInterval(heartbeat);
      removeClient(raw);
    });
  });
}
