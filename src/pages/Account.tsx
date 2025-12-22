import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Clock, Settings, Key } from 'lucide-react';

export default function Account() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const mockProfile = {
    fullName: "John Smith",
    email: user?.email || "john.smith@company.com",
    role: userRole || "analyst",
    emailVerified: true,
    lastLogin: "2024-01-15 10:30 AM",
    accountCreated: "2023-06-15",
    totalLogins: 342,
    totalDownloads: 89
  };

  const mockSessions = [
    {
      id: 1,
      device: "MacBook Pro - Chrome",
      location: "New York, NY",
      lastActive: "Current session",
      current: true
    },
    {
      id: 2,
      device: "iPhone - Safari",
      location: "New York, NY", 
      lastActive: "2 hours ago",
      current: false
    },
    {
      id: 3,
      device: "Windows PC - Edge",
      location: "Boston, MA",
      lastActive: "Yesterday",
      current: false
    }
  ];

  const mockActivity = [
    {
      id: 1,
      action: "Downloaded research report",
      content: "Q4 Technology Sector Analysis",
      timestamp: "2024-01-15 09:45 AM"
    },
    {
      id: 2,
      action: "Viewed stock analysis", 
      content: "NVIDIA Corporation (NVDA)",
      timestamp: "2024-01-15 09:30 AM"
    },
    {
      id: 3,
      action: "Updated profile",
      content: "Changed notification preferences",
      timestamp: "2024-01-14 04:20 PM"
    },
    {
      id: 4,
      action: "Accessed theme",
      content: "Green Energy Transition",
      timestamp: "2024-01-14 02:15 PM"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>

          <Button
            variant="outline"
            className="text-red-600"
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="font-medium">{mockProfile.fullName}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2">
                <p className="font-medium">{mockProfile.email}</p>
                {mockProfile.emailVerified && (
                  <Badge variant="outline" className="text-green-600">
                    <Mail className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Badge variant="default">{mockProfile.role}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="font-medium">{mockProfile.accountCreated}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Last Login</label>
              <p className="font-medium">{mockProfile.lastLogin}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>Your activity and usage overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Total Logins</span>
                </div>
                <p className="text-2xl font-bold">{mockProfile.totalLogins}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Downloads</span>
                </div>
                <p className="text-2xl font-bold">{mockProfile.totalDownloads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>Manage your active login sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                    <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                  </div>
                  
                  {!session.current && (
                    <Button variant="outline" size="sm" className="text-red-600">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions and downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.content}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}