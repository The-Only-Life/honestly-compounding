import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinWaitlist } from '@/hooks/use-waitlist-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
// Phone OTP login hidden for POC
// import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm';

const Auth = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const joinWaitlistMutation = useJoinWaitlist();
  const [loading, setLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
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

      // Execute reCAPTCHA v3
      if (!executeRecaptcha) {
        toast.error('reCAPTCHA not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      const captchaToken = await executeRecaptcha('login');

      await signIn(email, password, captchaToken);
      // Navigation will happen automatically due to user state change
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Error is already handled by the useLogin hook
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Execute reCAPTCHA v3
      if (!executeRecaptcha) {
        toast.error('reCAPTCHA not loaded. Please refresh the page.');
        return;
      }

      const captchaToken = await executeRecaptcha('join_waitlist');

      // Use the state value instead of FormData since this is a controlled input
      await joinWaitlistMutation.mutateAsync({ email: waitlistEmail, captchaToken });

      // Reset form on success
      setWaitlistEmail('');
    } catch (error) {
      console.error('Join waitlist failed:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - Honestly Compounding</title>
        <meta name="description" content="Sign in to access professional stock research, thematic analysis, and risk assessment tools. Create an account to get started with Honestly Compounding." />
        <meta name="robots" content="noindex, nofollow" />

        {/* Open Graph */}
        <meta property="og:title" content="Sign In - Honestly Compounding" />
        <meta property="og:description" content="Access professional stock research and analysis platform" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
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
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Email</TabsTrigger>
              <TabsTrigger value="signup">Waitlist</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
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
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="waitlist-email">Email Address</Label>
                  <Input
                    id="waitlist-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={joinWaitlistMutation.isPending}>
                  {joinWaitlistMutation.isPending ? 'Joining...' : 'Join Waitlist'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This is an invite-only platform. Join the waitlist and we'll send you an invitation once approved.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default Auth;