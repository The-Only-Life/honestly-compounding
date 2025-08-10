import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, FileText, Users } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Stock Research Platform</h1>
          <div className="space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-6">Professional Stock Research</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Access comprehensive stock analysis, thematic research, and risk assessment tools 
          designed for institutional investors and analysts.
        </p>
        {!user && (
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Research Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Curated investment themes with detailed analysis and stock recommendations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive risk categorization and analysis for informed decision making.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Research Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                In-depth company analysis and market research reports from expert analysts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Granular permissions and content access management for different user tiers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
