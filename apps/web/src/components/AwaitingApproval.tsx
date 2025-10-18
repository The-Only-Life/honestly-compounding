import { Button } from '@/components/ui/button';
import { Clock, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AwaitingApproval: React.FC = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-4">
            <Clock className="h-12 w-12 text-amber-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Awaiting Approval</h1>
          <p className="text-muted-foreground">
            Your request to access Honestly Compounding is pending admin approval.
            You'll receive an email at <span className="font-semibold">{user?.email}</span> once
            your access has been granted.
          </p>
        </div>
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = 'mailto:jayaramnitk@gmail.com?subject=Access Approval Status'}
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact Support
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
