import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const CompleteProfile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedPhone, setInvitedPhone] = useState<string | null>(null);

  // Get token from URL and extract user info
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check for invitation token in URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const type = hashParams.get('type') || searchParams.get('type');

        if (!accessToken || type !== 'invite') {
          toast({
            title: "Invalid invitation link",
            description: "This invitation link is invalid or has expired.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 2000);
          return;
        }

        // Fetch user info from token to determine what they were invited with
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Could not verify invitation');
        }

        const data = await response.json();

        // Determine if invited with email or phone
        if (data.user.email) {
          setInvitedEmail(data.user.email);
        }
        if (data.user.phone) {
          setInvitedPhone(data.user.phone);
        }

        setTokenValid(true);
      } catch (error) {
        console.error('Token verification failed:', error);
        toast({
          title: "Verification failed",
          description: "Could not verify your invitation. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/auth'), 2000);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const handleCompleteProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please ensure both passwords are identical.",
          variant: "destructive",
        });
        return;
      }

      // Get the token from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');

      // Update user profile
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          email: invitedEmail || email,
          phone: invitedPhone || phone,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete profile');
      }

      toast({
        title: "Profile completed!",
        description: "Your account is ready. Redirecting to dashboard...",
      });

      // User should now be logged in with the session cookies
      // Redirect to dashboard
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error: any) {
      console.error('Profile completion failed:', error);
      toast({
        title: "Setup failed",
        description: error.message || "Could not complete your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Verifying your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Invalid invitation. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Fill in the missing information to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                defaultValue={invitedEmail || ''}
                disabled={!!invitedEmail}
                required
              />
              {invitedEmail && (
                <p className="text-xs text-muted-foreground">Email from invitation</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                defaultValue={invitedPhone || ''}
                disabled={!!invitedPhone}
                required
              />
              {invitedPhone && (
                <p className="text-xs text-muted-foreground">Phone from invitation</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up account...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
