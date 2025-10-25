import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const PhoneLoginForm = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP via SMS
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format phone number
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replaceAll(/\D/g, '')}`;

      // Validate phone format
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      if (!phoneRegex.test(formattedPhone)) {
        toast.error('Invalid phone number', {
          description: 'Please enter a valid Indian phone number (10 digits)',
        });
        setLoading(false);
        return;
      }

      // Send OTP via backend API
      await apiClient.sendOTP({ phone: formattedPhone });

      toast.success('OTP sent!', {
        description: 'Check your phone for the verification code',
      });

      setPhone(formattedPhone);
      setStep('otp');
    } catch (error: any) {
      toast.error('Failed to send OTP', {
        description: error.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify OTP via backend API
      const response = await apiClient.verifyOTP({
        phone,
        otp,
      });

      toast.success('Success!', {
        description: 'You are now logged in',
      });

      // Check if user needs to complete profile
      if (response.needsProfileCompletion) {
        // Redirect with access token in hash for CompleteProfile to use
        navigate(`/complete-profile#access_token=${response.accessToken}&type=phone`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error('Invalid OTP', {
        description: error.message || 'Please check your code and try again',
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP(new Event('submit') as any);
  };

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOTP} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            You'll receive a verification code via SMS
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send OTP'
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div className="space-y-2">
        <Label>Enter OTP sent to {phone}</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Check your SMS messages
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify & Login'
        )}
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setStep('phone')}
          disabled={loading}
        >
          Change Number
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResendOTP}
          disabled={loading}
        >
          Resend OTP
        </Button>
      </div>
    </form>
  );
};
