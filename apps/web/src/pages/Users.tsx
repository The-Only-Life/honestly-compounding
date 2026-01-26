import { useState } from 'react';
import { useUsers, useInviteUser, useInviteUsersBulk, useResendInvitation, useUpdateUserRole, useUpdateUserAccess, useDeleteUser, useGenerateVerificationLink } from '@/hooks/use-users-api';
import { useWaitlist, useApproveWaitlist } from '@/hooks/use-waitlist-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserIcon, Plus, Mail, Phone, Shield, CheckCircle, XCircle, Users as UsersIcon, Trash2, Send, Link2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { UserRole } from '@/types/roles';

export default function Users() {
  const { data: usersData, isLoading } = useUsers();
  const { data: waitlistData, isLoading: isLoadingWaitlist } = useWaitlist('pending');
  const inviteUserMutation = useInviteUser();
  const inviteUsersBulkMutation = useInviteUsersBulk();
  const resendInvitationMutation = useResendInvitation();
  const updateUserRoleMutation = useUpdateUserRole();
  const updateUserAccessMutation = useUpdateUserAccess();
  const deleteUserMutation = useDeleteUser();
  const approveWaitlistMutation = useApproveWaitlist();
  const generateVerificationLinkMutation = useGenerateVerificationLink();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('subscriber');
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');
  const [bulkInviteText, setBulkInviteText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const users = usersData?.users || [];
  const waitlistEntries = waitlistData?.data || [];

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  // Calculate statistics
  const totalUsers = users.length;
  const approvedUsers = users.filter((u) => u.accessApproved).length;
  const verifiedEmails = users.filter((u) => u.emailVerified).length;
  const pendingApproval = users.filter((u) => !u.accessApproved).length;
  const pendingWaitlist = waitlistEntries.length;

  const handleInviteUser = async () => {
    if (contactMethod === 'email' && !newUserEmail) {
      return;
    }
    if (contactMethod === 'phone' && !newUserPhone) {
      return;
    }

    await inviteUserMutation.mutateAsync({
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

  const handleBulkInvite = async () => {
    const lines = bulkInviteText.trim().split('\n').filter(line => line.trim());

    const users = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      const emailOrPhone = parts[0];
      const role = (parts[1] || 'subscriber') as UserRole;

      // Simple email check
      const isEmail = emailOrPhone.includes('@');

      return {
        email: isEmail ? emailOrPhone : undefined,
        phone: isEmail ? undefined : emailOrPhone,
        role,
      };
    });

    await inviteUsersBulkMutation.mutateAsync({ users });

    // Reset form
    setBulkInviteText('');
    setIsBulkDialogOpen(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRoleMutation.mutateAsync({ userId, role: newRole });
  };

  const handleAccessToggle = async (userId: string, currentAccess: boolean) => {
    await updateUserAccessMutation.mutateAsync({ userId, accessApproved: !currentAccess });
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUserMutation.mutateAsync(userId);
  };

  const handleApproveWaitlist = async (id: string, email: string) => {
    await approveWaitlistMutation.mutateAsync({ id, email });
  };

  const handleResendInvite = async (userId: string) => {
    await resendInvitationMutation.mutateAsync(userId);
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
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UsersIcon className="mr-2 h-4 w-4" />
                Bulk Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Invite Users</DialogTitle>
                <DialogDescription>
                  Add multiple users at once. Enter one user per line in the format: email/phone, role
                  <br />
                  Example: user@example.com, subscriber
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkInvite">User List</Label>
                  <Textarea
                    id="bulkInvite"
                    placeholder="user1@example.com, subscriber&#10;user2@example.com, sponsor&#10;+1234567890, subscriber"
                    value={bulkInviteText}
                    onChange={(e) => setBulkInviteText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported roles: subscriber, sponsor, admin
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkInvite} disabled={inviteUsersBulkMutation.isPending}>
                  {inviteUsersBulkMutation.isPending ? 'Sending Invites...' : 'Send Invites'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Invite a new user to the platform. They will receive an invitation to complete their
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
                <Button onClick={handleInviteUser} disabled={inviteUserMutation.isPending}>
                  {inviteUserMutation.isPending ? 'Sending Invite...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
            <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0}% approved
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Awaiting access approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users ({totalUsers})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({pendingWaitlist})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
              <CardDescription>Manage user accounts, roles, and access approvals</CardDescription>
            </CardHeader>
            <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Create your first user to get started.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact Method</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Access Approved</TableHead>
                    <TableHead>Email Verified</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.email || user.phone || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(user as any).contactMethod === 'phone' ? (
                          <Badge variant="outline" className="text-blue-600">
                            <Phone className="w-3 h-3 mr-1" />
                            Phone
                          </Badge>
                        ) : (user as any).contactMethod === 'email' ? (
                          <Badge variant="outline" className="text-purple-600">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            -
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || ''}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                          disabled={updateUserRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="sponsor">Sponsor</SelectItem>
                            <SelectItem value="subscriber">Subscriber</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.accessApproved || false}
                            onCheckedChange={() => handleAccessToggle(user.id, user.accessApproved || false)}
                            disabled={updateUserAccessMutation.isPending}
                          />
                          {user.accessApproved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge variant="outline" className="text-green-600">
                            <Mail className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.invitedBy || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastSignInAt
                          ? new Date(user.lastSignInAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.emailVerified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary"
                              onClick={() => handleResendInvite(user.id)}
                              disabled={resendInvitationMutation.isPending}
                              title="Resend invitation email"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {user.email && !user.profileCompleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => generateVerificationLinkMutation.mutate(user.id)}
                              disabled={generateVerificationLinkMutation.isPending}
                              title="Get verification link (copies to clipboard) - Only for users who haven't completed profile"
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.email || user.phone}? This action cannot be undone and will permanently remove the user and all their data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="waitlist">
          <Card>
            <CardHeader>
              <CardTitle>Waitlist</CardTitle>
              <CardDescription>Manage waitlist requests and approve new subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWaitlist ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading waitlist...</p>
                </div>
              ) : waitlistEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending waitlist requests.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">{entry.email}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600">
                            Pending
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleApproveWaitlist(entry.id, entry.email)}
                            disabled={approveWaitlistMutation.isPending}
                          >
                            {approveWaitlistMutation.isPending ? 'Approving...' : 'Approve & Invite'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
