import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from './use-toast';

// Query keys
export const waitlistKeys = {
  all: ['waitlist'] as const,
  list: (status?: 'pending' | 'invited') => [...waitlistKeys.all, 'list', status] as const,
};

// Hook to get waitlist entries
export const useWaitlist = (status?: 'pending' | 'invited') => {
  return useQuery({
    queryKey: waitlistKeys.list(status),
    queryFn: () => apiClient.getWaitlist(status),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
};

// Hook to join waitlist (public)
export const useJoinWaitlist = () => {
  return useMutation({
    mutationFn: (email: string) => apiClient.joinWaitlist(email),
    onSuccess: (response) => {
      toast({
        title: 'Success!',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to join waitlist',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Hook to approve waitlist entry (admin/sponsor)
export const useApproveWaitlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      apiClient.approveWaitlist(id, email),
    onSuccess: (response) => {
      // Invalidate waitlist queries to refetch
      queryClient.invalidateQueries({ queryKey: waitlistKeys.all });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to approve waitlist entry',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
