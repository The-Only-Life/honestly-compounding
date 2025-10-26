import { useState } from "react";
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
import { useCreateStock, useUploadStockPDF } from "@/hooks/use-stocks-api";
import { useThemes } from "@/hooks/use-themes-api";
import { useBuckets } from "@/hooks/use-buckets-api";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface CreateStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStockDialog({
  open,
  onOpenChange,
}: CreateStockDialogProps) {
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [themeId, setThemeId] = useState("");
  const [bucketId, setBucketId] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createStock = useCreateStock();
  const uploadPDF = useUploadStockPDF();
  const { data: themesData, isLoading: themesLoading } = useThemes();
  const { data: bucketsData, isLoading: bucketsLoading } = useBuckets();

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim() || !companyName.trim() || !themeId || !bucketId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsUploading(true);
      let pdfUrl: string | undefined;

      // Upload PDF if provided
      if (pdfFile) {
        const uploadResult = await uploadPDF.mutateAsync(pdfFile);
        pdfUrl = uploadResult.fileName; // Store the file path, not the full URL
      }

      // Create stock
      await createStock.mutateAsync({
        symbol: symbol.trim().toUpperCase(),
        companyName: companyName.trim(),
        themeId,
        bucketId,
        pdfUrl,
      });

      // Reset form
      setSymbol("");
      setCompanyName("");
      setThemeId("");
      setBucketId("");
      setPdfFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create stock:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSymbol("");
    setCompanyName("");
    setThemeId("");
    setBucketId("");
    setPdfFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Stock</DialogTitle>
          <DialogDescription>
            Add a new stock with its associated theme, bucket, and research note
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
                {pdfFile ? "Change PDF" : "Upload PDF (Optional)"}
              </Button>
            </div>
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
              disabled={isUploading || createStock.isPending}
            >
              {isUploading
                ? "Uploading..."
                : createStock.isPending
                ? "Creating..."
                : "Add Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
