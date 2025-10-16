import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUserRole } from '@/hooks/use-users-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserIcon, Plus, Mail, Phone, Shield } from 'lucide-react';
import type { UserRole } from '@/types/roles';

export default function Users() {
  const { data: usersData, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserRoleMutation = useUpdateUserRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('subscriber');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');

  const users = usersData?.users || [];

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.emailVerified).length;
  const verifiedEmails = users.filter((u) => u.emailVerified).length;
  const pendingUsers = users.filter((u) => !u.emailVerified).length;

  const handleCreateUser = async () => {
    if (contactMethod === 'email' && !newUserEmail) {
      return;
    }
    if (contactMethod === 'phone' && !newUserPhone) {
      return;
    }

    await createUserMutation.mutateAsync({
      email: contactMethod === 'email' ? newUserEmail : undefined,
      phone: contactMethod === 'phone' ? newUserPhone : undefined,
      role: newUserRole,
    });

    // Reset form
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserRole('subscriber');
    setContactMethod('email');
    setIsDialogOpen(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRoleMutation.mutateAsync({ userId, role: newRole });
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'sponsor':
        return 'default';
      case 'subscriber':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the platform. They will receive an invitation to complete their
                profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Contact Method</Label>
                <Select
                  value={contactMethod}
                  onValueChange={(value) => setContactMethod(value as 'email' | 'phone')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contactMethod === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% active rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedEmails}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((verifiedEmails / totalUsers) * 100) : 0}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Manage user accounts and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found. Create your first user to get started.
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.email || user.phone || 'Unknown'}</h3>
                      <Badge variant={getRoleBadgeVariant(user.role)}>{user.role || 'No Role'}</Badge>
                      {user.emailVerified && (
                        <Badge variant="outline" className="text-green-600">
                          <Mail className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {user.id.slice(0, 8)}... • Created:{' '}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                    {user.lastSignInAt && (
                      <p className="text-xs text-muted-foreground">
                        Last sign in: {new Date(user.lastSignInAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    {user.role !== 'admin' && (
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        disabled={updateUserRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subscriber">Subscriber</SelectItem>
                          <SelectItem value="sponsor">Sponsor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
