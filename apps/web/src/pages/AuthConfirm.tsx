import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Auth Confirmation Page
 *
 * This page handles Supabase email confirmation links.
 * It exchanges the token_hash for an access_token and redirects to the next page.
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

        // For invite type, the token_hash IS the access_token from Supabase
        // We just need to redirect to the next page with it in the hash
        if (type === 'invite') {
          // Redirect to the next page with the access_token in the URL hash
          // This allows the CompleteProfile page to use it
          window.location.href = `${next}#access_token=${tokenHash}&type=${type}`;
          return;
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
