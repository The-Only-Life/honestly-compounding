import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServerResponse } from "http";

const clients = new Set<ServerResponse>();

export function addClient(res: ServerResponse): void {
  clients.add(res);
}

export function removeClient(res: ServerResponse): void {
  clients.delete(res);
}

export function broadcastNotificationUpdate(): void {
  const data = `data: ${JSON.stringify({ type: "notifications_updated" })}\n\n`;
  for (const client of clients) {
    if (!client.writableEnded) {
      client.write(data);
    }
  }
}

export function initRealtimeSubscription(supabase: SupabaseClient): void {
  supabase
    .channel("server-notifications-listener")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
      },
      () => {
        broadcastNotificationUpdate();
      }
    )
    .subscribe();
}
