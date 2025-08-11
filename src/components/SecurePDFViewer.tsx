import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

// Set up PDF.js worker with bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface SecurePDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  title: string;
}

export function SecurePDFViewer({ isOpen, onClose, fileName, title }: SecurePDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && fileName) {
      loadPDF();
    }
    
    return () => {
      // Cleanup
      if (pdf) {
        pdf.destroy();
      }
    };
  }, [isOpen, fileName]);

  useEffect(() => {
    if (pdf) {
      renderPage();
    }
  }, [pdf, pageNum, scale]);

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
      const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdf(loadedPdf);
      setTotalPages(loadedPdf.numPages);
      setPageNum(1);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page');
    }
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
              {pdf && (
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
                <Button onClick={loadPDF}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {pdf && !loading && !error && (
            <div className="flex justify-center p-4">
              <canvas 
                ref={canvasRef} 
                className="border border-border rounded-lg shadow-lg max-w-full"
                style={{
                  display: 'block',
                  background: 'white'
                }}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}