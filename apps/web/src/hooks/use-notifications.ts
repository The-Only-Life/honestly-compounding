import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type Notification } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export function useNotifications() {
  const queryClient = useQueryClient();

  // Fetch initial notifications
  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => apiClient.getNotifications(),
    staleTime: 30000, // 30 seconds
  });

  // Subscribe to Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Notification change received:", payload);

          // Invalidate and refetch notifications when changes occur
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    notifications: query.data?.notifications || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
