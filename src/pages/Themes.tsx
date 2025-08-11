import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Eye, Download, TrendingUp } from 'lucide-react';

export default function Themes() {
  const { userRole } = useAuth();

  const mockThemes = [
    {
      id: 1,
      name: "Technology Innovation",
      description: "Focused on emerging tech companies and digital transformation",
      stockCount: 24,
      lastUpdated: "2024-01-15",
      performance: "+12.5%",
      status: "active"
    },
    {
      id: 2,
      name: "Green Energy Transition", 
      description: "Renewable energy and sustainable technology investments",
      stockCount: 18,
      lastUpdated: "2024-01-14",
      performance: "+8.2%",
      status: "active"
    },
    {
      id: 3,
      name: "Healthcare Revolution",
      description: "Biotech, pharmaceuticals, and medical device companies",
      stockCount: 31,
      lastUpdated: "2024-01-13",
      performance: "+15.7%",
      status: "active"
    },
    {
      id: 4,
      name: "Consumer Trends",
      description: "Retail and consumer goods adapting to changing demographics",
      stockCount: 22,
      lastUpdated: "2024-01-12",
      performance: "+4.1%",
      status: "draft"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investment Themes</h1>
          <p className="text-muted-foreground">Thematic investment research and analysis</p>
        </div>
        {(userRole === 'admin' || userRole === 'analyst') && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Theme
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 this quarter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Themes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
            <p className="text-xs text-muted-foreground">75% active rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">Across all themes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+10.1%</div>
            <p className="text-xs text-muted-foreground">YTD average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Library</CardTitle>
          <CardDescription>Browse and manage investment themes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockThemes.map((theme) => (
              <Card key={theme.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{theme.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={theme.status === 'active' ? 'default' : 'secondary'}>
                          {theme.status}
                        </Badge>
                        <Badge variant="outline" className="text-green-600">
                          {theme.performance}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stocks:</span>
                      <span className="font-medium">{theme.stockCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">{theme.lastUpdated}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    {(userRole === 'admin' || userRole === 'analyst') && (
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}