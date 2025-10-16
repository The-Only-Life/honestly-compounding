import { useAuth } from '@/contexts/AuthContext';
import { ReactElement, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import type { UserRole } from '@/types/roles';

interface RoleAccessConfig {
  allowedRoles: UserRole[];
  fallback?: ReactElement | null;
}

/**
 * Higher-order component that conditionally renders components based on user role.
 *
 * Role hierarchy:
 * - Admin: Can see everything (sponsor + subscriber + admin-only components)
 * - Sponsor & Subscriber: See the same components
 *
 * @param config - Configuration object with allowed roles and optional fallback
 * @returns HOC that wraps the component with role-based access control
 *
 * @example
 * // Admin only component
 * const AdminOnlyComponent = withRoleAccess({ allowedRoles: ['admin'] })(MyComponent);
 *
 * @example
 * // Component for sponsors and subscribers
 * const UserComponent = withRoleAccess({
 *   allowedRoles: ['sponsor', 'subscriber', 'admin']
 * })(MyComponent);
 */
export function withRoleAccess(config: RoleAccessConfig) {
  return function <P extends object>(
    Component: React.ComponentType<P>
  ): React.FC<P> {
    return function RoleAccessWrapper(props: P) {
      const { userRole, signOut } = useAuth();

      useEffect(() => {
        // If no role is assigned, log out the user
        if (userRole === null || userRole === undefined || userRole === '') {
          toast({
            title: 'Access Denied',
            description: 'You do not have a role assigned. Please contact support at support@honestlycompounding.com',
            variant: 'destructive',
          });
          signOut();
        }
      }, [userRole, signOut]);

      // If no role is set, don't render
      if (!userRole) {
        return config.fallback || null;
      }

      // Check if user's role is in the allowed roles
      if (config.allowedRoles.includes(userRole as UserRole)) {
        return <Component {...props} />;
      }

      // Return fallback if provided, otherwise null
      return config.fallback || null;
    };
  };
}

/**
 * Hook to check if the current user has access based on roles
 *
 * @param allowedRoles - Array of roles that have access
 * @returns boolean indicating if user has access
 *
 * @example
 * const hasAccess = useRoleAccess(['admin', 'sponsor']);
 */
export function useRoleAccess(allowedRoles: UserRole[]): boolean {
  const { userRole } = useAuth();

  if (!userRole) {
    return false;
  }

  return allowedRoles.includes(userRole as UserRole);
}
