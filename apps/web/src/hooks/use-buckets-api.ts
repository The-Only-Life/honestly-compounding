import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, type CreateBucketRequest } from "@/lib/api-client";
import { toast } from "sonner";

export const BUCKETS_QUERY_KEY = ["buckets"];

export function useBuckets() {
  return useQuery({
    queryKey: BUCKETS_QUERY_KEY,
    queryFn: () => apiClient.getBuckets(),
    staleTime: 30000, // 30 seconds
  });
}

export function useBucket(id: string) {
  return useQuery({
    queryKey: [...BUCKETS_QUERY_KEY, id],
    queryFn: () => apiClient.getBucket(id),
    enabled: !!id,
  });
}

export function useCreateBucket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBucketRequest) => apiClient.createBucket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUCKETS_QUERY_KEY });
      toast.success("Bucket created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create bucket");
    },
  });
}
