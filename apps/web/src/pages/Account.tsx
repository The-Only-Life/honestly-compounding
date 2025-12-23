import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { format } from 'date-fns';

export default function Account() {
  const { user, userRole, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2">
                <p className="font-medium">{user.email}</p>
                {user.emailVerified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Mail className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant="default" className="capitalize">
                  {userRole || 'User'}
                </Badge>
              </div>
            </div>

            {user.accessApproved !== undefined && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Access Status</label>
                <Badge
                  variant={user.accessApproved ? "default" : "secondary"}
                  className={user.accessApproved ? "bg-green-600" : ""}
                >
                  {user.accessApproved ? 'Approved' : 'Pending Approval'}
                </Badge>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="font-medium">
                {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="font-mono text-xs text-muted-foreground truncate">{user.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-muted-foreground">
                    {user.emailVerified ? 'Your email is verified' : 'Email not verified'}
                  </p>
                </div>
                {user.emailVerified ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Verify Email
                  </Button>
                )}
              </div>

              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-900">
                  <strong>Note:</strong> Password and email verification features are currently managed by your administrator. Please contact support for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
