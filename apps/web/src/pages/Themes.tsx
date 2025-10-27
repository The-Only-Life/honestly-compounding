import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Eye, Download, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PDFViewer } from '@/components/PDFViewer';
import { SecurePDFViewer } from '@/components/SecurePDFViewer';
import { SidePanel } from '@/components/SidePanel';
import ReactMarkdown from 'react-markdown';

export default function Themes() {
  const { userRole } = useAuth();
  const [themes, setThemes] = useState<any[]>([]);
  const [storagePDFs, setStoragePDFs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState<{ url: string; title: string; fileName?: string } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<{ id: string; name: string; description: string } | null>(null);
  const [stats, setStats] = useState({
    totalThemes: 0,
    totalStocks: 0
  });

  useEffect(() => {
    fetchThemes();
    fetchStoragePDFs();
  }, []);

  const fetchStoragePDFs = async () => {
    // TODO: Implement API call to BFF server for PDFs
    setStoragePDFs([]);
  };

  const handleViewPDF = (fileName: string, title: string) => {
    setSelectedPDF({ url: '', title, fileName });
  };

  const handleViewTheme = (theme: any) => {
    setSelectedTheme({
      id: theme.id,
      name: theme.name,
      description: theme.description || "No description available.",
    });
  };

  const fetchThemes = async () => {
    try {
      // TODO: Replace with API call to BFF server
      const response = await fetch('/api/themes');
      const { themes } = await response.json();
      
      setThemes(themes || []);
      setStats({
        totalThemes: themes?.length || 0,
        totalStocks: 0 // Will be calculated from themes data
      });
    } catch (error) {
      console.error('Error fetching themes:', error);
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
          <h1 className="text-3xl font-bold">Investment Themes</h1>
          <p className="text-muted-foreground">Thematic investment research and analysis</p>
        </div>
        {(userRole === 'admin' || userRole === 'analyst') && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Theme
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Themes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThemes}</div>
            <p className="text-xs text-muted-foreground">Investment themes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStocks}</div>
            <p className="text-xs text-muted-foreground">Across all themes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Library</CardTitle>
          <CardDescription>Browse investment themes and research documents</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Storage PDFs Section */}
          {storagePDFs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Research Documents</h3>
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

          {/* Database Themes Section */}
          {themes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Database Themes</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {themes.map((theme) => (
                  <Card key={theme.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{theme.description || 'No description available'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">{new Date(theme.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Updated:</span>
                          <span className="font-medium">{new Date(theme.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewTheme(theme)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                          {theme.pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPDF(theme.pdf_url.split('/').pop() || '', theme.name)}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {themes.length === 0 && storagePDFs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No themes or documents found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SidePanel
        open={!!selectedTheme}
        onClose={() => setSelectedTheme(null)}
        title={selectedTheme ? `Theme: ${selectedTheme.name}` : ''}
      >
        {selectedTheme && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{selectedTheme.description}</ReactMarkdown>
          </div>
        )}
      </SidePanel>

      <SecurePDFViewer
        isOpen={!!selectedPDF}
        onClose={() => setSelectedPDF(null)}
        fileName={selectedPDF?.fileName}
        title={selectedPDF?.title || ''}
      />
    </div>
  );
}