import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';

export default function Stocks() {
  const { userRole } = useAuth();

  const mockStocks = [
    {
      id: 1,
      symbol: "AAPL",
      companyName: "Apple Inc.",
      theme: "Technology Innovation",
      riskBucket: "Moderate Growth",
      price: "$175.43",
      change: "+2.34%",
      positive: true,
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      symbol: "TSLA",
      companyName: "Tesla Inc.",
      theme: "Green Energy Transition",
      riskBucket: "High Growth", 
      price: "$248.92",
      change: "-1.87%",
      positive: false,
      lastUpdated: "2024-01-15"
    },
    {
      id: 3,
      symbol: "NVDA",
      companyName: "NVIDIA Corporation",
      theme: "Technology Innovation",
      riskBucket: "High Growth",
      price: "$591.78",
      change: "+5.12%",
      positive: true,
      lastUpdated: "2024-01-15"
    },
    {
      id: 4,
      symbol: "JNJ",
      companyName: "Johnson & Johnson",
      theme: "Healthcare Revolution",
      riskBucket: "Conservative",
      price: "$158.34",
      change: "+0.45%",
      positive: true,
      lastUpdated: "2024-01-15"
    },
    {
      id: 5,
      symbol: "AMZN",
      companyName: "Amazon.com Inc.",
      theme: "Consumer Trends",
      riskBucket: "Moderate Growth",
      price: "$142.67",
      change: "+1.23%",
      positive: true,
      lastUpdated: "2024-01-15"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Research</h1>
          <p className="text-muted-foreground">Individual stock analysis and research reports</p>
        </div>
        {(userRole === 'admin' || userRole === 'analyst') && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">Under coverage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gainers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">189</div>
            <p className="text-xs text-muted-foreground">77% positive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decliners</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">56</div>
            <p className="text-xs text-muted-foreground">23% negative</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">198</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Universe</CardTitle>
          <CardDescription>Browse all stocks under research coverage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockStocks.map((stock) => (
              <div key={stock.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">{stock.symbol}</h3>
                    <Badge 
                      variant={stock.positive ? "default" : "destructive"}
                      className={stock.positive ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}
                    >
                      {stock.change}
                    </Badge>
                  </div>
                  <h4 className="font-medium">{stock.companyName}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Theme: {stock.theme}</span>
                    <span>Risk: {stock.riskBucket}</span>
                    <span>Updated: {stock.lastUpdated}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stock.price}</div>
                    <div className="text-xs text-muted-foreground">Current Price</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}