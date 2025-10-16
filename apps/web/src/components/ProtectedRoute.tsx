import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, Mail } from 'lucide-react';

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
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has no role assigned
  if (!userRole || userRole === '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">No Role Assigned</h1>
            <p className="text-muted-foreground">
              Your account doesn't have a role assigned yet. Please contact support to get access.
            </p>
          </div>
          <div className="space-y-3 pt-4">
            <Button
              variant="default"
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@honestlycompounding.com?subject=Role Access Request'}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has wrong role for this route
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this area. Your current role is <span className="font-semibold">{userRole}</span>.
            </p>
          </div>
          <div className="space-y-3 pt-4">
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = 'mailto:support@honestlycompounding.com?subject=Access Request'}
            >
              <Mail className="mr-2 h-4 w-4" />
              Request Access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};