import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, FileText, Users } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Honestly Compounding",
    "description": "Professional stock research and analysis platform providing comprehensive stock analysis, thematic research, and risk assessment tools for institutional investors and analysts.",
    "url": window.location.origin,
    "logo": `${window.location.origin}/Logo.png`,
    "sameAs": [
      "https://twitter.com/honestly_compounding"
    ],
    "offers": {
      "@type": "Offer",
      "category": "Financial Research"
    },
    "serviceType": "Financial Research Platform",
    "areaServed": "Global",
    "audience": {
      "@type": "Audience",
      "audienceType": "Institutional Investors, Financial Analysts, Investment Professionals"
    },
    "featureList": [
      "Stock Research",
      "Thematic Investment Analysis",
      "Risk Assessment Tools",
      "Expert Research Reports",
      "Investment Theme Curation"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Honestly Compounding - Professional Stock Research & Analysis</title>
        <meta name="description" content="Access comprehensive stock analysis, thematic research, and risk assessment tools designed for institutional investors and analysts. Expert research reports and investment themes." />
        <meta name="keywords" content="stock research, investment analysis, thematic research, risk assessment, stock analysis, institutional investors, financial research, equity research" />

        {/* GEO - Generative Engine Optimization */}
        <meta name="author" content="Honestly Compounding" />
        <meta name="category" content="Financial Research" />
        <meta name="coverage" content="Worldwide" />
        <meta name="rating" content="General" />
        <meta name="language" content="English" />

        {/* AI-friendly meta tags */}
        <meta property="article:publisher" content="Honestly Compounding" />
        <meta property="article:tag" content="stock research, investment analysis, thematic research, risk assessment, institutional investing" />

        {/* Open Graph */}
        <meta property="og:title" content="Honestly Compounding - Professional Stock Research & Analysis" />
        <meta property="og:description" content="Access comprehensive stock analysis, thematic research, and risk assessment tools designed for institutional investors and analysts." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={`${window.location.origin}/Logo.png`} />
        <meta property="og:site_name" content="Honestly Compounding" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Honestly Compounding - Professional Stock Research & Analysis" />
        <meta name="twitter:description" content="Access comprehensive stock analysis, thematic research, and risk assessment tools designed for institutional investors and analysts." />
        <meta name="twitter:image" content={`${window.location.origin}/Logo.png`} />
        <meta name="twitter:site" content="@honestly_compounding" />

        {/* Additional SEO */}
        <link rel="canonical" href={window.location.origin} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/Logo.png" alt="Honestly Compounding" className="h-12" />
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
        <img src="/Logo.png" alt="Honestly Compounding" className="h-20 mx-auto mb-8" />
        <h1 className="text-5xl font-bold mb-6">Professional Stock Research & Analysis Platform</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Honestly Compounding provides comprehensive stock analysis, thematic investment research, and risk assessment tools
          designed for institutional investors, financial analysts, and investment professionals seeking data-driven insights.
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
      <section className="container mx-auto px-4 py-16" aria-label="Platform Features">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features for Investment Professionals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle>Investment Research Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Curated thematic investment research with detailed fundamental analysis, sector trends, and stock recommendations for long-term value creation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle>Risk Assessment Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive risk categorization and quantitative analysis framework for informed investment decision making and portfolio management.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle>Expert Research Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                In-depth company analysis, industry research, and market intelligence reports from experienced financial analysts and investment professionals.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
              <CardTitle>Enterprise Access Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access control and granular content permissions for institutional teams, sponsors, and subscriber tiers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
