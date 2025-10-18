import { useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinWaitlist } from '@/hooks/use-waitlist-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReCaptcha, ReCaptchaRef } from '@/components/ReCaptcha';
import { toast } from 'sonner';

const Auth = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const joinWaitlistMutation = useJoinWaitlist();
  const [loading, setLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const loginCaptchaRef = useRef<ReCaptchaRef>(null);
  const waitlistCaptchaRef = useRef<ReCaptchaRef>(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify CAPTCHA
      const captchaToken = await loginCaptchaRef.current?.executeAsync();
      if (!captchaToken) {
        toast.error('Please complete the CAPTCHA verification');
        setLoading(false);
        return;
      }

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      await signIn(email, password, captchaToken);
      // Navigation will happen automatically due to user state change
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Error is already handled by the useLogin hook
      console.error('Login failed:', error);
      loginCaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Verify CAPTCHA
      const captchaToken = await waitlistCaptchaRef.current?.executeAsync();
      if (!captchaToken) {
        toast.error('Please complete the CAPTCHA verification');
        return;
      }

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;

      await joinWaitlistMutation.mutateAsync({ email, captchaToken });

      // Reset form on success
      setWaitlistEmail('');
      waitlistCaptchaRef.current?.reset();
    } catch (error) {
      console.error('Join waitlist failed:', error);
      waitlistCaptchaRef.current?.reset();
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
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Join Waitlist</TabsTrigger>
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
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <ReCaptcha ref={loginCaptchaRef} size="normal" />
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
                <ReCaptcha ref={waitlistCaptchaRef} size="normal" />
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