import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

// Enable reCAPTCHA only in production where keys are configured
const RECAPTCHA_ENABLED =
  import.meta.env.MODE === 'production' && !!import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Auth = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extract form data BEFORE async operations (e.currentTarget becomes null after await)
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      let captchaToken: string | undefined;

      if (RECAPTCHA_ENABLED) {
        if (!executeRecaptcha) {
          toast.error('reCAPTCHA not loaded. Please refresh the page.');
          setLoading(false);
          return;
        }
        captchaToken = await executeRecaptcha('login');
      }

      await signIn(email, password, captchaToken);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - Honestly Compounding</title>
        <meta name="description" content="Sign in to access professional stock research, thematic analysis, and risk assessment tools." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Sign In - Honestly Compounding" />
        <meta property="og:description" content="Access professional stock research and analysis platform" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Sign In - Honestly Compounding" />
        <meta name="twitter:description" content="Access professional stock research and analysis platform" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/Logo.png" alt="Honestly Compounding" className="h-16 mx-auto mb-4" />
            <CardDescription>
              Access professional stock research and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Auth;
