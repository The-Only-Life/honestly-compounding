import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface SecurePDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  title: string;
}

export function SecurePDFViewer({ isOpen, onClose, fileName, title }: SecurePDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (isOpen && fileName) {
      loadPDF();
    } else {
      // Reset state when closing
      setPdfData(null);
      setPageNum(1);
      setTotalPages(0);
      setScale(1.0);
      setError(null);
    }
  }, [isOpen, fileName]);

  const loadPDF = async () => {
    if (!fileName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: downloadError } = await supabase.storage
        .from('research-pdfs')
        .download(fileName);

      if (downloadError) throw downloadError;

      const arrayBuffer = await data.arrayBuffer();
      setPdfData(arrayBuffer);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setPageNum(1);
  };

  const onDocumentLoadError = (error: any) => {
    console.error('Error loading document:', error);
    setError('Failed to load PDF document');
  };

  const goToPrevPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNum < totalPages) {
      setPageNum(pageNum + 1);
    }
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[800px] sm:max-w-[90vw]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            <div className="flex items-center gap-2">
              {totalPages > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">{Math.round(scale * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={pageNum <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">{pageNum} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={pageNum >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>
            Secure PDF viewer - content cannot be downloaded
          </SheetDescription>
        </SheetHeader>
        
        <div className="h-[calc(100vh-120px)] relative overflow-auto">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading PDF...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="text-center">
                <p className="text-destructive mb-2">{error}</p>
                <Button onClick={loadPDF}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {pdfData && !loading && !error && (
            <div className="flex justify-center p-4">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Rendering PDF...</span>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="flex items-center justify-center h-[600px] w-[400px] border border-border rounded-lg bg-muted/10">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  }
                />
              </Document>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}