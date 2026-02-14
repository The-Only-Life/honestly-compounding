import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateStock, useUploadStockPDF } from "@/hooks/use-stocks-api";
import { useThemes } from "@/hooks/use-themes-api";
import { useBuckets } from "@/hooks/use-buckets-api";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import type { Stock } from "@/lib/api-client";

interface EditStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: Stock;
}

export function EditStockDialog({
  open,
  onOpenChange,
  stock,
}: EditStockDialogProps) {
  const [symbol, setSymbol] = useState(stock.symbol);
  const [companyName, setCompanyName] = useState(stock.companyName);
  const [themeId, setThemeId] = useState(stock.themeId);
  const [bucketId, setBucketId] = useState(stock.bucketId);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const updateStock = useUpdateStock();
  const uploadPDF = useUploadStockPDF();
  const { data: themesData, isLoading: themesLoading } = useThemes();
  const { data: bucketsData, isLoading: bucketsLoading } = useBuckets();

  // Reset form when stock changes or dialog opens
  useEffect(() => {
    if (open) {
      setSymbol(stock.symbol);
      setCompanyName(stock.companyName);
      setThemeId(stock.themeId);
      setBucketId(stock.bucketId);
      setPdfFile(null);
      setRemovePdf(false);
    }
  }, [stock, open]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setPdfFile(file);
      setRemovePdf(false);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setRemovePdf(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim() || !companyName.trim() || !themeId || !bucketId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsUploading(true);
      let pdfUrl: string | null | undefined;

      // Upload new PDF if provided
      if (pdfFile) {
        const uploadResult = await uploadPDF.mutateAsync(pdfFile);
        pdfUrl = uploadResult.fileName; // Store the file path
      } else if (removePdf) {
        pdfUrl = null; // Explicitly remove the PDF
      }

      // Update stock
      await updateStock.mutateAsync({
        id: stock.id,
        data: {
          symbol: symbol.trim().toUpperCase(),
          companyName: companyName.trim(),
          themeId,
          bucketId,
          ...(pdfUrl !== undefined && { pdfUrl }),
        },
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update stock:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Stock</DialogTitle>
          <DialogDescription>
            Update stock information, theme, bucket, or research note
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">
                Stock Symbol <span className="text-red-500">*</span>
              </Label>
              <Input
                id="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
                required
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Apple Inc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">
                Theme <span className="text-red-500">*</span>
              </Label>
              <Select value={themeId} onValueChange={setThemeId} required>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading themes...
                    </SelectItem>
                  ) : themesData?.themes && themesData.themes.length > 0 ? (
                    themesData.themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No themes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket">
                Bucket <span className="text-red-500">*</span>
              </Label>
              <Select value={bucketId} onValueChange={setBucketId} required>
                <SelectTrigger id="bucket">
                  <SelectValue placeholder="Select a bucket" />
                </SelectTrigger>
                <SelectContent>
                  {bucketsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading buckets...
                    </SelectItem>
                  ) : bucketsData?.buckets && bucketsData.buckets.length > 0 ? (
                    bucketsData.buckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={bucket.id}>
                        {bucket.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No buckets available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf">Stock Note (PDF)</Label>

            {/* Show current PDF if exists and not being removed */}
            {stock.pdfUrl && !removePdf && !pdfFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">
                  Current PDF attached
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePdf}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("pdf")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {pdfFile
                  ? "Change PDF"
                  : stock.pdfUrl && !removePdf
                  ? "Replace PDF"
                  : "Upload PDF"}
              </Button>
            </div>

            {/* Show newly selected PDF */}
            {pdfFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPdfFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Upload a PDF file (max 10MB) containing research notes for this
              stock
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || updateStock.isPending}
            >
              {isUploading
                ? "Uploading..."
                : updateStock.isPending
                ? "Updating..."
                : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
