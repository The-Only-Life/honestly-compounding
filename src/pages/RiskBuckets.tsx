import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, AlertTriangle, TrendingDown, TrendingUp, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function RiskBuckets() {
  const { userRole } = useAuth();
  const [riskBuckets, setRiskBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBuckets: 0,
    totalStocks: 0
  });

  useEffect(() => {
    fetchRiskBuckets();
  }, []);

  const fetchRiskBuckets = async () => {
    try {
      const { data: bucketsData, error: bucketsError } = await supabase
        .from('risk_buckets')
        .select(`
          *,
          stocks:stocks(count)
        `);

      if (bucketsError) throw bucketsError;

      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('count');

      if (stocksError) throw stocksError;

      setRiskBuckets(bucketsData || []);
      setStats({
        totalBuckets: bucketsData?.length || 0,
        totalStocks: stocksData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching risk buckets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

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
            <div className="text-2xl font-bold">{stats.totalBuckets}</div>
            <p className="text-xs text-muted-foreground">Risk categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStocks}</div>
            <p className="text-xs text-muted-foreground">Categorized stocks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Bucket Analysis</CardTitle>
          <CardDescription>Portfolio risk distribution and characteristics</CardDescription>
        </CardHeader>
        <CardContent>
          {riskBuckets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No risk buckets found in database</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {riskBuckets.map((bucket) => (
                <Card key={bucket.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          {bucket.name}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription>{bucket.description || 'No description available'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{new Date(bucket.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="font-medium">{new Date(bucket.updated_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Stocks
                        </Button>
                        {bucket.pdf_url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(bucket.pdf_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}