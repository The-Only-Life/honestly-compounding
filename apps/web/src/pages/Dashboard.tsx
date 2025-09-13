import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Briefcase, Shield, Building, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { user, userRole } = useAuth();

  const stats = [
    {
      title: "Total Users",
      value: "156",
      description: "Active subscribers and analysts",
      icon: Users,
      visible: userRole === 'admin'
    },
    {
      title: "Research Themes",
      value: "24",
      description: "Published research themes",
      icon: Briefcase,
      visible: true
    },
    {
      title: "Risk Buckets",
      value: "8",
      description: "Risk categorization buckets",
      icon: Shield,
      visible: true
    },
    {
      title: "Stocks Covered",
      value: "342",
      description: "Companies under analysis",
      icon: Building,
      visible: true
    },
    {
      title: "Content Access Grants",
      value: "89",
      description: "Active content permissions",
      icon: FileText,
      visible: true
    },
    {
      title: "Monthly Growth",
      value: "+12%",
      description: "Platform usage increase",
      icon: TrendingUp,
      visible: userRole === 'admin'
    }
  ];

  const visibleStats = stats.filter(stat => stat.visible);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || user?.email}
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {userRole?.charAt(0).toUpperCase()}{userRole?.slice(1)} Access
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New theme "AI & Automation" published</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Stock TSLA added to Tech Growth theme</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Risk bucket "High Growth" updated</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                <div className="font-medium">Add New Stock</div>
                <div className="text-sm text-muted-foreground">Add a company to research coverage</div>
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                <div className="font-medium">Create Theme</div>
                <div className="text-sm text-muted-foreground">Start a new research theme</div>
              </button>
              <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                <div className="font-medium">Grant Access</div>
                <div className="text-sm text-muted-foreground">Provide content access to users</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;