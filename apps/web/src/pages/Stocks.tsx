import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building, Plus, Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useStocks } from "@/hooks/use-stocks-api";
import { CreateStockDialog } from "@/components/CreateStockDialog";
import { SidePanel } from "@/components/SidePanel";
import { SecurePDFViewer } from "@/components/SecurePDFViewer";
import ReactMarkdown from "react-markdown";
import type { Stock } from "@/lib/api-client";

type SidePanelView =
  | { type: "theme"; theme: { id: string; name: string; description: string } }
  | { type: "bucket"; bucket: { id: string; name: string; description: string } }
  | null;

export default function Stocks() {
  const { userRole } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sidePanelView, setSidePanelView] = useState<SidePanelView>(null);
  const [selectedPDF, setSelectedPDF] = useState<{
    fileName: string;
    title: string;
  } | null>(null);

  const { data, isLoading, error } = useStocks(currentPage, pageSize);

  const handleViewTheme = (stock: Stock) => {
    if (stock.theme) {
      setSidePanelView({
        type: "theme",
        theme: {
          id: stock.theme.id,
          name: stock.theme.name,
          description: stock.theme.description || "No description available.",
        },
      });
    }
  };

  const handleViewBucket = (stock: Stock) => {
    if (stock.bucket) {
      setSidePanelView({
        type: "bucket",
        bucket: {
          id: stock.bucket.id,
          name: stock.bucket.name,
          description: stock.bucket.description || "No description available.",
        },
      });
    }
  };

  const handleViewPDF = (stock: Stock) => {
    if (stock.pdfUrl) {
      setSelectedPDF({
        fileName: stock.pdfUrl,
        title: `${stock.symbol} - ${stock.companyName}`,
      });
    }
  };

  const handleCloseSidePanel = () => {
    setSidePanelView(null);
  };

  const handleClosePDF = () => {
    setSelectedPDF(null);
  };

  const canAddStocks = userRole === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading stocks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-destructive">
          Error loading stocks: {error.message}
        </div>
      </div>
    );
  }

  const stocks = data?.stocks || [];
  const totalStocks = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const getSidePanelTitle = () => {
    if (sidePanelView?.type === "theme") {
      return `Theme: ${sidePanelView.theme.name}`;
    }
    if (sidePanelView?.type === "bucket") {
      return `Bucket: ${sidePanelView.bucket.name}`;
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Research</h1>
          <p className="text-muted-foreground">
            Individual stock analysis and research reports
          </p>
        </div>
        {canAddStocks && (
          <Button onClick={() => setCreateDialogOpen(true)}>
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
            <div className="text-2xl font-bold">{totalStocks}</div>
            <p className="text-xs text-muted-foreground">Under coverage</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Universe</CardTitle>
          <CardDescription>
            Browse all stocks and research documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stocks.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                No stocks found
              </p>
              {canAddStocks && (
                <p className="text-sm text-muted-foreground">
                  Click "Add Stock" to create your first stock entry
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stock Name</TableHead>
                      <TableHead>Stock Symbol</TableHead>
                      <TableHead>Associated Theme</TableHead>
                      <TableHead>Associated Bucket</TableHead>
                      <TableHead>Stock Note</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">
                          {stock.companyName}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold">
                            {stock.symbol}
                          </span>
                        </TableCell>
                        <TableCell>
                          {stock.theme ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal"
                              onClick={() => handleViewTheme(stock)}
                            >
                              {stock.theme.name}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stock.bucket ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-normal"
                              onClick={() => handleViewBucket(stock)}
                            >
                              {stock.bucket.name}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {stock.pdfUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPDF(stock)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View PDF
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No PDF
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing page {currentPage} of {totalPages} ({totalStocks}{" "}
                    total stocks)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Stock Dialog */}
      <CreateStockDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Side Panel for Theme/Bucket */}
      <SidePanel
        open={!!sidePanelView}
        onClose={handleCloseSidePanel}
        title={getSidePanelTitle()}
      >
        {sidePanelView?.type === "theme" && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{sidePanelView.theme.description}</ReactMarkdown>
          </div>
        )}
        {sidePanelView?.type === "bucket" && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{sidePanelView.bucket.description}</ReactMarkdown>
          </div>
        )}
      </SidePanel>

      {/* PDF Viewer */}
      <SecurePDFViewer
        isOpen={!!selectedPDF}
        onClose={handleClosePDF}
        fileName={selectedPDF?.fileName}
        title={selectedPDF?.title || ""}
      />
    </div>
  );
}