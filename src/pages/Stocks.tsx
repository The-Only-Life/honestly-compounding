import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Plus, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StockRel { name?: string | null }

interface Stock {
  id: number | string;
  symbol: string;
  company_name?: string | null;
  pdf_url?: string | null; 
  theme_id?: string | null;
  risk_bucket_id?: string | null;
  updated_at?: string | null;
  themes?: StockRel;
  risk_buckets?: StockRel;
}

interface StoragePDF {
  name: string;
  fileName: string;
  updated_at?: string | null;
  url?: string; // public or signed URL
}


export default function Stocks() {
  const { userRole } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [storagePDFs, setStoragePDFs] = useState<StoragePDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStocks: 0 });
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const addDebug = (op: string, details: any, err?: any) => {
    const payload = {
      time: new Date().toISOString(),
      op,
      details,
      error: err ? (err.message || JSON.stringify(err)) : null,
    };
    setDebugInfo(payload);
    return payload;
  };
  // errorMessage is replaced by minimal toasts; kept debugInfo for internal diagnostics
  const STORAGE_BUCKET = 'research-pdfs';

  // helper: try to create a signed url, fallback to public url
  const makeFileUrl = async (fileName: string) => {
    try {
      if (!fileName || fileName === '') {
        console.log('[makeFileUrl] Empty filename provided');
        return null;
      }

      console.log('[makeFileUrl] Resolving URL for file:', fileName);

      // try signed url (private buckets)
      const { data: signedData, error: signedErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(fileName, 60 * 60); 

      if (signedErr) {
        console.warn('[makeFileUrl] createSignedUrl error:', signedErr);
        addDebug('makeFileUrl.createSignedUrl', { fileName }, signedErr);
      }

      const signedUrl = (signedData as any)?.signedUrl || (signedData as any)?.signedurl || (signedData as any)?.signed_url;
      if (signedUrl) {
        console.log('[makeFileUrl] Got signed URL, length:', signedUrl.length);
        return signedUrl;
      }

      
      if (signedErr) {
        const msg = (signedErr?.message || '').toLowerCase();
        const statusCode = (signedErr as any)?.status;
        if (statusCode === 404 || /not found|object not found|no such object/i.test(msg)) {
          console.warn(`[makeFileUrl] File "${fileName}" not found in bucket "${STORAGE_BUCKET}".`, signedErr);
          addDebug('makeFileUrl.notFound', { fileName, statusCode, msg }, signedErr);
          return null;
        }
      }

      const pubData = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      const publicUrl = (pubData as any)?.data?.publicUrl || (pubData as any)?.publicUrl || (pubData as any)?.public_url;
      console.log('[makeFileUrl] Got public URL, length:', publicUrl?.length);
      console.log('[makeFileUrl] File path would be:', `${STORAGE_BUCKET}/${fileName}`);

      if (publicUrl) {
        try {
          const res = await fetch(publicUrl, { method: 'HEAD' });
          if (!res.ok) {
            console.warn(`[makeFileUrl] Public URL head check failed (${res.status}) for ${publicUrl}`);
            addDebug('makeFileUrl.headCheckFailed', { publicUrl, status: res.status });
            return null;
          }
        } catch (headErr) {
          console.warn('[makeFileUrl] HEAD request failed; returning public URL anyway:', headErr);
          addDebug('makeFileUrl.headRequestError', { publicUrl }, headErr);
        }
      }

      return publicUrl || null;
    } catch (err) {
      console.error('[makeFileUrl] Unexpected error:', err);
      addDebug('makeFileUrl.unexpected', { fileName }, err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      try {
        const stocksPromise = fetchStocks();
        const pdfsPromise = fetchStoragePDFs();
        await Promise.all([stocksPromise, pdfsPromise]);
      } catch (err) {
        console.error('loadAll error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  
const fetchStoragePDFs = async () => {
  try {
    console.log('[fetchStoragePDFs] Attempting to list files from bucket:', STORAGE_BUCKET);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 200 });
    if (error) {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("bucket not found")) {
        console.warn(`[fetchStoragePDFs] Bucket "${STORAGE_BUCKET}" does not exist.`);
        addDebug('fetchStoragePDFs.bucketNotFound', { bucket: STORAGE_BUCKET }, error);
          toast({ title: 'Unable to fetch PDFs' });
          setStoragePDFs([]);
          return;
      }
      addDebug('fetchStoragePDFs.listError', { bucket: STORAGE_BUCKET }, error);
      toast({ title: 'Unable to fetch PDFs' });
      throw error;
    }

    const stockPDFs = (data || []).filter((file: any) => {
      const name = (file.name || '').toLowerCase();
      return (
        name.includes('stock') ||
        name.includes('note') ||
        name.includes('research')
      );
    });

      const mapped: StoragePDF[] = await Promise.all(
      stockPDFs.map(async (file: any) => {
        const fileName = file.name;
        const url = await makeFileUrl(fileName);
        if (!url) {
          // record per-file unreachable status for debugging
          addDebug('fetchStoragePDFs.fileUrlMissing', { fileName });
        }

        return {
          name: fileName,
          fileName,
          updated_at: file.updated_at || file.last_modified || null,
          url: url || undefined
        };
      })
    );

    const reachable = mapped.filter((m) => !!m.url);
    setStoragePDFs(reachable);
  } catch (error) {
    console.error('[fetchStoragePDFs] Unexpected error:', error);
    addDebug('fetchStoragePDFs.unexpected', {}, error);
    toast({ title: 'Unable to fetch PDFs' });
    setStoragePDFs([]);
  }
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

      const normalized = (stocksData || []) as Stock[];
      setStocks(normalized);
      setStats({ totalStocks: normalized.length });
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setStocks([]);
      setStats({ totalStocks: 0 });
    }
  };


const handleViewPDF = useCallback(async (fileNameOrUrl: string) => {
  try {
    if (!fileNameOrUrl) {
      addDebug('handleViewPDF.missingParam', { fileNameOrUrl });
      toast({ title: 'PDF not available' });
      return;
    }

    if (/^https?:\/\//i.test(fileNameOrUrl)) {
      const newWindow = window.open(fileNameOrUrl, "_blank");
      if (!newWindow) {
        addDebug('handleViewPDF.popupBlocked', { fileNameOrUrl });
        toast({ title: 'Unable to open PDF' });
      }
      return;
    }


    const url = await makeFileUrl(fileNameOrUrl);

    if (!url) {
      addDebug('handleViewPDF.notFound', { fileNameOrUrl });
      toast({ title: 'File not found' });
      return;
    }

    const newWindow = window.open(url, "_blank");
    if (!newWindow) {
      addDebug('handleViewPDF.popupBlocked', { url });
      toast({ title: 'Unable to open PDF' });
    }
  } catch (err) {
    console.error("[handleViewPDF] Error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    addDebug('handleViewPDF.unexpected', { fileNameOrUrl }, err);
    toast({ title: 'Error opening PDF' });
  }
}, []);



  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Research</h1>
          <p className="text-muted-foreground">Individual stock analysis and research reports</p>
        </div>
        <div className="flex items-center gap-2">
          {(userRole === 'admin' || userRole === 'analyst') && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          )}

  
        </div>
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
                {storagePDFs.map((pdf) => (
                  <Card key={pdf.fileName} className="relative hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{pdf.name}</CardTitle>
                      <CardDescription>
                        Uploaded: {pdf.updated_at ? new Date(pdf.updated_at).toLocaleDateString() : 'Unknown'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewPDF(pdf.url)}
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
                        <span>Updated: {stock.updated_at ? new Date(stock.updated_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewPDF(stock.pdf_url)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      {(userRole === 'admin' || userRole === 'analyst') && (
                        <Button variant="outline" size="sm">Edit</Button>
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
    </div>
  );
}