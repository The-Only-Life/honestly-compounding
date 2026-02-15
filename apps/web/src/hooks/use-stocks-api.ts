import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateStockRequest, UpdateStockRequest } from "@/lib/api-client";
import { toast } from "sonner";

export const STOCKS_QUERY_KEY = ["stocks"];

export function useStocks(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [...STOCKS_QUERY_KEY, page, limit],
    queryFn: () => apiClient.getStocks(page, limit),
    staleTime: 30000, // 30 seconds
  });
}

export function useStock(id: string) {
  return useQuery({
    queryKey: [...STOCKS_QUERY_KEY, id],
    queryFn: () => apiClient.getStock(id),
    staleTime: 30000,
    enabled: !!id,
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockRequest) => apiClient.createStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCKS_QUERY_KEY });
      toast.success("Stock created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create stock");
    },
  });
}

export function useUploadStockPDF() {
  return useMutation({
    mutationFn: (file: File) => apiClient.uploadStockPDF(file),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload PDF");
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockRequest }) =>
      apiClient.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCKS_QUERY_KEY });
      toast.success("Stock updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update stock");
    },
  });
}

export function useDeleteStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteStock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCKS_QUERY_KEY });
      toast.success("Stock deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete stock");
    },
  });
}
