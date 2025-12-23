import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AppConfig } from '@/config';

/**
 * Auth Confirmation Page
 *
 * This page handles Supabase email confirmation links.
 * It exchanges the token_hash for an access_token by calling Supabase's verify endpoint,
 * then redirects to the next page.
 *
 * URL format: /auth/confirm?token_hash=xxx&type=invite&next=/complete-profile
 */
const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        // Get parameters from URL
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const next = searchParams.get('next') || '/dashboard';

        if (!tokenHash || !type) {
          console.error('Missing required parameters');
          navigate('/auth');
          return;
        }

        // For invite type, verify the token with our backend
        // The backend will exchange the token_hash for a real JWT access_token
        if (type === 'invite') {
          try {
            // Call our backend to verify the token_hash
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/auth/verify-invite`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                token_hash: tokenHash,
                type: type
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Token verification failed:', errorData);
              throw new Error(errorData.error || 'Token verification failed');
            }

            const data = await response.json();

            // If verification succeeded, redirect to next page with the access_token
            // Pass the JWT access token in the URL hash so CompleteProfile can use it
            window.location.href = `${next}#access_token=${data.access_token}&type=${type}`;
            return;
          } catch (error) {
            console.error('Invite verification failed:', error);
            // On error, redirect to auth page
            navigate('/auth');
            return;
          }
        }

        // For other types (signup, recovery, etc.), handle them here
        // For now, just redirect to auth page
        navigate('/auth');
      } catch (error) {
        console.error('Confirmation processing failed:', error);
        navigate('/auth');
      }
    };

    processConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-center text-muted-foreground">Processing your invitation...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthConfirm;
