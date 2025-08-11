import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Loader2, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
  fileName?: string;
}

export function PDFViewer({ isOpen, onClose, pdfUrl, title, fileName }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && pdfUrl && fileName) {
      fetchPDFBlob();
    }
    
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, pdfUrl, fileName]);

  const fetchPDFBlob = async () => {
    if (!fileName) {
      console.log('No fileName provided');
      return;
    }
    
    console.log('Fetching PDF blob for:', fileName);
    setLoading(true);
    setError(null);
    
    try {
      console.log('Downloading from Supabase storage...');
      const { data, error: downloadError } = await supabase.storage
        .from('research-pdfs')
        .download(fileName);

      if (downloadError) {
        console.error('Download error:', downloadError);
        throw downloadError;
      }

      console.log('Downloaded data:', data);
      console.log('Data size:', data?.size);

      if (!data) {
        throw new Error('No data received');
      }

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url);
      setBlobUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (blobUrl && fileName) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[800px] sm:max-w-[90vw]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            <div className="flex items-center gap-2">
              {blobUrl && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open in Tab
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>
            View research document in PDF format
          </SheetDescription>
        </SheetHeader>
        
        <div className="h-[calc(100vh-120px)] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading PDF...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <p className="text-destructive mb-2">{error}</p>
                <Button onClick={fetchPDFBlob}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {blobUrl && !loading && !error && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0 rounded-lg"
              title={title}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}