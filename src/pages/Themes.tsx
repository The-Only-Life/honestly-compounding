import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Eye, Download, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function Themes() {
  const { userRole } = useAuth();
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalThemes: 0,
    totalStocks: 0
  });

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const { data: themesData, error: themesError } = await supabase
        .from('themes')
        .select(`
          *,
          stocks:stocks(count)
        `);

      if (themesError) throw themesError;

      const { data: stocksData, error: stocksError } = await supabase
        .from('stocks')
        .select('count');

      if (stocksError) throw stocksError;

      setThemes(themesData || []);
      setStats({
        totalThemes: themesData?.length || 0,
        totalStocks: stocksData?.length || 0
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
          <CardDescription>Browse and manage investment themes</CardDescription>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No themes found in database</p>
            </div>
          ) : (
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
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {theme.pdf_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(theme.pdf_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}