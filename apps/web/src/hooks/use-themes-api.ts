import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type CreateThemeRequest } from "@/lib/api-client";
import { toast } from "sonner";

export const THEMES_QUERY_KEY = ["themes"];

export function useThemes() {
  return useQuery({
    queryKey: THEMES_QUERY_KEY,
    queryFn: () => apiClient.getThemes(),
    staleTime: 30000, // 30 seconds
  });
}

export function useTheme(id: string) {
  return useQuery({
    queryKey: [...THEMES_QUERY_KEY, id],
    queryFn: () => apiClient.getTheme(id),
    enabled: !!id,
  });
}

export function useCreateTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateThemeRequest) => apiClient.createTheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THEMES_QUERY_KEY });
      toast.success("Theme created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create theme");
    },
  });
}
