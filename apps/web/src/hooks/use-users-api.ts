import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type CreateUserRequest, type UpdateUserRoleRequest, type InviteUserRequest, type BulkInviteUserRequest } from '@/lib/api-client';
import { toast } from './use-toast';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
};

// Hook to get all users
export const useUsers = () => {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: () => apiClient.getAllUsers(),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
};

// Hook to create a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => apiClient.createUser(data),
    onSuccess: (response) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook to update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UpdateUserRoleRequest['role'] }) =>
      apiClient.updateUserRole(userId, { role }),
    onSuccess: (response) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update user role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook to update user access approval
export const useUpdateUserAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, accessApproved }: { userId: string; accessApproved: boolean }) =>
      apiClient.updateUserAccess(userId, accessApproved),
    onSuccess: (response) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update user access',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook to invite a single user
export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteUserRequest) => apiClient.inviteUser(data),
    onSuccess: (response) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send invite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook to invite users in bulk
export const useInviteUsersBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkInviteUserRequest) => apiClient.inviteUsersBulk(data),
    onSuccess: (response) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });

      const { successful, failed } = response.results;

      toast({
        title: 'Bulk invite completed',
        description: `${successful.length} successful, ${failed.length} failed`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send bulk invites',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook to generate verification link for a user
export const useGenerateVerificationLink = () => {
  return useMutation({
    mutationFn: (userId: string) => apiClient.generateVerificationLink(userId),
    onSuccess: (response) => {
      // Copy to clipboard
      navigator.clipboard.writeText(response.verificationUrl);

      toast({
        title: 'Verification link generated',
        description: 'Link copied to clipboard. Send it to the user.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate verification link',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook to delete a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: (response) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.list() });

      toast({
        title: 'Success',
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
