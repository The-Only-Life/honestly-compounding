import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';

import { useEffect, useState } from 'react';
import { PDFViewer } from '@/components/PDFViewer';
import { SecurePDFViewer } from '@/components/SecurePDFViewer';

export default function Stocks() {
  const { userRole } = useAuth();
  const [stocks, setStocks] = useState<any[]>([]);
  const [storagePDFs, setStoragePDFs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState<{ url: string; title: string; fileName?: string } | null>(null);
  const [stats, setStats] = useState({
    totalStocks: 0
  });

  useEffect(() => {
    fetchStocks();
    fetchStoragePDFs();
  }, []);

  const fetchStoragePDFs = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('research-pdfs')
        .list('', { limit: 100 });

      if (error) throw error;

      const stockPDFs = data?.filter(file => 
        file.name.toLowerCase().includes('stock') || 
        file.name.toLowerCase().includes('note') ||
        file.name.toLowerCase().includes('research')
      ) || [];

      const pdfUrls = stockPDFs.map((file) => ({
        name: file.name,
        fileName: file.name,
        created_at: file.created_at
      }));

      console.log('Stock PDFs found:', pdfUrls);
      setStoragePDFs(pdfUrls);
    } catch (error) {
      console.error('Error fetching storage PDFs:', error);
    }
  };

  const handleViewPDF = (fileName: string, title: string) => {
    console.log('handleViewPDF called with:', { fileName, title });
    setSelectedPDF({ url: '', title, fileName });
  };

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
          <CardDescription>Browse all stocks and research documents</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Storage PDFs Section */}
          {storagePDFs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Stock Research Documents</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {storagePDFs.map((pdf, index) => (
                  <Card key={index} className="relative hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{pdf.name}</CardTitle>
                      <CardDescription>
                        Uploaded: {new Date(pdf.created_at || '').toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleViewPDF(pdf.fileName, pdf.name)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Database Stocks Section */}
          {stocks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Database Stocks</h3>
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
                          onClick={() => handleViewPDF(stock.pdf_url.split('/').pop() || '', stock.company_name)}
                        >
                          <Eye className="w-4 h-4" />
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
            </div>
          )}

          {stocks.length === 0 && storagePDFs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No stocks or documents found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SecurePDFViewer 
        isOpen={!!selectedPDF}
        onClose={() => setSelectedPDF(null)}
        fileName={selectedPDF?.fileName}
        title={selectedPDF?.title || ''}
      />
    </div>
  );
}