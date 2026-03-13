import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type LoginRequest } from '@/lib/api-client';
import { toast } from './use-toast';

// Query keys
export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
};

// Hook to get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: () => apiClient.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// Hook for login
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (response) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.currentUser, {
        user: response.user,
      });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for logout
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(authKeys.currentUser, null);
      queryClient.clear(); // Clear all queries

      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for logout all devices
export const useLogoutAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logoutAll(),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.currentUser, null);
      queryClient.clear();

      toast({
        title: 'Signed out from all devices',
        description: 'You have been signed out from all devices.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for token refresh
export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.refreshToken(),
    onSuccess: (response) => {
      queryClient.setQueryData(authKeys.currentUser, {
        user: response.user,
      });
    },
  });
};
