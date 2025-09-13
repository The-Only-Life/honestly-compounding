import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Plus, FileText, Users, Download, Upload } from 'lucide-react';

export default function ContentManagement() {
  const { userRole } = useAuth();

  const mockContent = [
    {
      id: 1,
      title: "Q4 2024 Technology Sector Report",
      type: "Research Report",
      access: "Premium",
      downloads: 145,
      created: "2024-01-10",
      status: "published"
    },
    {
      id: 2,
      title: "ESG Investment Guidelines",
      type: "Document", 
      access: "All Users",
      downloads: 89,
      created: "2024-01-08",
      status: "published"
    },
    {
      id: 3,
      title: "Risk Management Framework",
      type: "Policy Document",
      access: "Admin Only",
      downloads: 23,
      created: "2024-01-05",
      status: "draft"
    },
    {
      id: 4,
      title: "Market Outlook 2024",
      type: "Research Report",
      access: "Subscribers",
      downloads: 278,
      created: "2024-01-03",
      status: "published"
    }
  ];

  const mockAccessRequests = [
    {
      id: 1,
      user: "john.doe@company.com",
      content: "Biotechnology Sector Deep Dive",
      requestDate: "2024-01-15",
      status: "pending"
    },
    {
      id: 2,
      user: "sarah.smith@company.com", 
      content: "Private Equity Market Analysis",
      requestDate: "2024-01-14",
      status: "approved"
    },
    {
      id: 3,
      user: "mike.johnson@company.com",
      content: "Cryptocurrency Investment Guide",
      requestDate: "2024-01-13",
      status: "pending"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage research content and user access</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Content
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">Research documents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72</div>
            <p className="text-xs text-muted-foreground">83% published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,345</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Library</CardTitle>
            <CardDescription>Manage research documents and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockContent.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Access: {item.access}</span>
                      <span>Downloads: {item.downloads}</span>
                      <span>Created: {item.created}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Requests</CardTitle>
            <CardDescription>Review and approve content access requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAccessRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{request.content}</h3>
                    <p className="text-sm text-muted-foreground">{request.user}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {request.requestDate}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                      {request.status}
                    </Badge>
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="text-green-600">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          Deny
                        </Button>
                      </div>
                    )}
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