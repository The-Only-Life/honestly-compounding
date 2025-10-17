import { Button } from '@/components/ui/button';
import { ShieldAlert, Home, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  message?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ message }) => {
  const { userRole, signOut } = useAuth();
  const navigate = useNavigate();

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
            {message || (
              <>
                You don't have permission to access this area. Your current role is{' '}
                <span className="font-semibold">{userRole}</span>.
              </>
            )}
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
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
