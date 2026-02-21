import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type Notification } from "@/lib/api-client";
import { AppConfig } from "@/config";
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

  // Subscribe to server-sent events for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(
      `${AppConfig.API_BASE_URL}/api/notifications/stream`,
      { withCredentials: true }
    );

    eventSource.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  return {
    notifications: query.data?.notifications || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
