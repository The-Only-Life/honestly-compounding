import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function Stocks() {
  const { userRole } = useAuth();
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStocks: 0
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select(`
          *,
          themes:theme_id(name),
          risk_buckets:risk_bucket_id(name)
        `);

      if (stocksError) throw stocksError;

      setStocks(stocksData || []);
      setStats({
        totalStocks: stocksData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

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
            <div className="text-2xl font-bold">{stats.totalStocks}</div>
            <p className="text-xs text-muted-foreground">Under coverage</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Universe</CardTitle>
          <CardDescription>Browse all stocks under research coverage</CardDescription>
        </CardHeader>
        <CardContent>
          {stocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No stocks found in database</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stocks.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{stock.symbol}</h3>
                    </div>
                    <h4 className="font-medium">{stock.company_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Theme: {stock.themes?.name || 'N/A'}</span>
                      <span>Risk: {stock.risk_buckets?.name || 'N/A'}</span>
                      <span>Updated: {new Date(stock.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {stock.pdf_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(stock.pdf_url, '_blank')}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}