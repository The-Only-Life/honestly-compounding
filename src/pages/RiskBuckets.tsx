import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

export default function RiskBuckets() {
  const { userRole } = useAuth();

  const mockRiskBuckets = [
    {
      id: 1,
      name: "Conservative",
      description: "Low volatility, stable dividend-paying companies",
      riskLevel: "Low",
      stockCount: 45,
      avgVolatility: "12%",
      color: "green",
      allocation: "35%"
    },
    {
      id: 2,
      name: "Moderate Growth", 
      description: "Balanced growth potential with moderate risk",
      riskLevel: "Medium",
      stockCount: 38,
      avgVolatility: "18%",
      color: "blue",
      allocation: "40%"
    },
    {
      id: 3,
      name: "High Growth",
      description: "High growth potential with increased volatility",
      riskLevel: "High",
      stockCount: 28,
      avgVolatility: "25%",
      color: "orange",
      allocation: "20%"
    },
    {
      id: 4,
      name: "Speculative",
      description: "Emerging companies and high-risk opportunities",
      riskLevel: "Very High",
      stockCount: 15,
      avgVolatility: "35%",
      color: "red",
      allocation: "5%"
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-blue-600 bg-blue-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Very High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Low': return <TrendingUp className="h-4 w-4" />;
      case 'Medium': return <Shield className="h-4 w-4" />;
      case 'High': return <TrendingDown className="h-4 w-4" />;
      case 'Very High': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Risk Buckets</h1>
          <p className="text-muted-foreground">Risk categorization and portfolio allocation</p>
        </div>
        {(userRole === 'admin' || userRole === 'analyst') && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Risk Bucket
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buckets</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Risk categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">126</div>
            <p className="text-xs text-muted-foreground">Categorized stocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Volatility</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20%</div>
            <p className="text-xs text-muted-foreground">Portfolio average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conservative Allocation</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">Low-medium risk</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Bucket Analysis</CardTitle>
          <CardDescription>Portfolio risk distribution and characteristics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockRiskBuckets.map((bucket) => (
              <Card key={bucket.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getRiskIcon(bucket.riskLevel)}
                        {bucket.name}
                      </CardTitle>
                      <Badge className={getRiskColor(bucket.riskLevel)}>
                        {bucket.riskLevel} Risk
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{bucket.allocation}</div>
                      <div className="text-xs text-muted-foreground">allocation</div>
                    </div>
                  </div>
                  <CardDescription>{bucket.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Stocks:</span>
                      <span className="font-medium">{bucket.stockCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Volatility:</span>
                      <span className="font-medium">{bucket.avgVolatility}</span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Stocks
                      </Button>
                      {(userRole === 'admin' || userRole === 'analyst') && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
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