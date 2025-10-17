import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AwaitingApproval } from '@/components/AwaitingApproval';
import { AccessDenied } from '@/components/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/auth'
}) => {
  const { user, userRole } = useAuth();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has no role OR user doesn't have access approval
  if (!userRole || userRole === '' || !user.accessApproved) {
    return <AwaitingApproval />;
  }

  // Check if user has wrong role for this route
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};