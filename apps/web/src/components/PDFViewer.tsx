import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { AppConfig } from '@/config';


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
    console.log('PDFViewer useEffect triggered with:', { isOpen, pdfUrl, fileName });
    
    if (isOpen && fileName) {
      console.log('Calling fetchPDFBlob...');
      fetchPDFBlob();
    }
    
    return () => {
      if (blobUrl) {
        console.log('Cleaning up blob URL:', blobUrl);
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
      console.log('Downloading PDF from API...');
      // Encode the fileName to handle special characters
      const encodedFileName = encodeURIComponent(fileName);
      const response = await fetch(`${AppConfig.API_BASE_URL}/api/stocks/download-pdf/${encodedFileName}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('Downloaded blob:', blob);
      console.log('Blob size:', blob.size);

      if (!blob || blob.size === 0) {
        throw new Error('No data received');
      }

      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url);
      setBlobUrl(url);
      setLoading(false);
    } catch (err: any) {
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
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="flex items-center justify-between">
            <span>View research document in PDF format</span>
            {blobUrl && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in Tab
                </Button>
              </div>
            )}
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
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">PDF Ready to View</h3>
                <p className="text-muted-foreground mb-4">
                  Due to browser security restrictions, PDFs cannot be displayed inline.
                  Please use one of the options below to view the document.
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={handleOpenInNewTab} size="lg">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open PDF in New Tab
                </Button>
                <Button variant="outline" onClick={handleDownload} size="lg">
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground max-w-md text-center">
                The PDF will open in a new browser tab where you can view, zoom, and navigate through the document.
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}