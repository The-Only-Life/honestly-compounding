# Phone Authentication & WhatsApp Implementation Plan

**Last Updated:** 2025-01-19
**Status:** Ready for Implementation

---

## Executive Summary

Implement phone-based authentication using:
- ✅ **Supabase Native Phone Auth** (with Twilio) for OTP login
- ✅ **Direct Twilio WhatsApp API** for invite messages
- ✅ **Both SMS and WhatsApp** channels supported

---

## Architecture Overview

### For OTP Login (User-initiated)
**Use:** Supabase Phone Auth with Twilio
- Supabase handles OTP generation, storage, and verification
- Automatically creates/updates user sessions
- Built-in rate limiting and security
- Can use **SMS** or **WhatsApp** channel

### For Invites (Admin-initiated)
**Use:** Direct Twilio WhatsApp API
- Custom invite messages with context
- Can include role information and personalization
- Not limited to OTP format
- Can use rich WhatsApp templates

---

## Implementation Phases

### ✅ PHASE 1: Supabase Phone Auth Setup (Day 1)

#### 1.1 Configure Supabase Dashboard

Navigate to: Supabase Dashboard → Authentication → Settings → Phone Auth

**Settings to configure:**
```
✅ Enable Phone Sign-ups
✅ Provider: Twilio Verify (recommended for WhatsApp)
   OR Twilio (for basic SMS/WhatsApp)

Configuration:
- Twilio Account SID: AC...
- Twilio Auth Token: ...
- Message Service SID: MG... (if using Twilio)
  OR Verify Service SID: VA... (if using Twilio Verify)

WhatsApp Settings (if using WhatsApp channel):
- WhatsApp enabled: ✅
- WhatsApp sender: whatsapp:+14155238886 (Twilio number)

OTP Settings:
- OTP expiry: 300 seconds (5 minutes)
- OTP length: 6 digits

SMS Template:
"Your Honestly Compounding verification code is {{ .Code }}"

WhatsApp Template (requires Twilio template approval):
"Your Honestly Compounding verification code is {{ .Code }}\n\nValid for 5 minutes."
```

#### 1.2 Update Backend Config

**File:** `/apps/server/src/server.config.ts`

```typescript
const Config = {
  // ... existing config

  // Twilio (for WhatsApp invites - separate from Supabase auth)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',

  // No need for OTP storage - Supabase handles it!
};

export default Config;
```

#### 1.3 Environment Variables

**File:** `.env`

```bash
# Supabase uses these for phone auth (configure in dashboard)
# TWILIO_ACCOUNT_SID - set in Supabase dashboard
# TWILIO_AUTH_TOKEN - set in Supabase dashboard

# For direct WhatsApp messaging (invites)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

---

### ⏳ PHASE 2: Backend - WhatsApp Utilities (Day 1-2)

#### 2.1 Install Twilio

```bash
cd apps/server
npm install twilio
```

#### 2.2 Create WhatsApp Utility

**File:** `/apps/server/src/utils/whatsapp.ts` (NEW)

```typescript
import twilio from 'twilio';
import Config from '../server.config';

const twilioClient = twilio(
  Config.TWILIO_ACCOUNT_SID,
  Config.TWILIO_AUTH_TOKEN
);

/**
 * Send WhatsApp invite message
 * Used when admin invites a user via phone number
 */
export async function sendWhatsAppInvite({
  phone,
  inviteUrl,
  role,
}: {
  phone: string;
  inviteUrl: string;
  role: string;
}): Promise<void> {
  try {
    // Ensure phone has +91 prefix
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    await twilioClient.messages.create({
      from: Config.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`,
      body: `
Hey there! 👋

You've been invited to join *Honestly Compounding* as a *${role}*.

Click here to complete your profile and get started:
${inviteUrl}

This invitation is valid for 7 days.

If you didn't request this, you can safely ignore this message.
      `.trim(),
    });

    console.log(`WhatsApp invite sent to ${formattedPhone}`);
  } catch (error) {
    console.error('Failed to send WhatsApp invite:', error);
    throw new Error('Failed to send WhatsApp invitation');
  }
}

/**
 * Send WhatsApp notification (optional - for other use cases)
 */
export async function sendWhatsAppNotification({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<void> {
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    await twilioClient.messages.create({
      from: Config.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`,
      body: message,
    });

    console.log(`WhatsApp notification sent to ${formattedPhone}`);
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    throw error;
  }
}
```

#### 2.3 Update Invite Endpoint

**File:** `/apps/server/src/routers/auth.router.ts`

**Import at top:**
```typescript
import { sendWhatsAppInvite } from '../utils/whatsapp';
```

**Update line 395-401 (single invite):**
```typescript
// BEFORE:
if (phone && !email) {
  // TODO: Implement SMS invite sending
  console.log("SMS invite not yet implemented. User created with phone:", phone);
}

// AFTER:
if (phone && !email) {
  // Send WhatsApp invite
  const inviteUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=invite&next=/complete-profile`;

  await sendWhatsAppInvite({
    phone,
    inviteUrl,
    role,
  });
}
```

**Update line 536-539 (bulk invite):**
```typescript
// BEFORE:
if (phone && !email) {
  console.log("SMS invite not yet implemented. User created with phone:", phone);
}

// AFTER:
if (phone && !email) {
  const inviteUrl = `${Config.FRONTEND_URL}/auth/confirm?token_hash=${inviteData.properties.hashed_token}&type=invite&next=/complete-profile`;

  await sendWhatsAppInvite({
    phone,
    inviteUrl,
    role,
  });
}
```

---

### ⏳ PHASE 3: Frontend - Phone Login UI (Day 2-3)

#### 3.1 Install Supabase Client

```bash
cd apps/web
npm install @supabase/supabase-js
```

#### 3.2 Create Supabase Client

**File:** `/apps/web/src/lib/supabase.ts` (NEW)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

**Add to `.env`:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

#### 3.3 Create Phone Login Component

**File:** `/apps/web/src/components/auth/PhoneLoginForm.tsx` (NEW)

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const PhoneLoginForm = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP via WhatsApp
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format phone number
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/[^0-9]/g, '')}`;

      // Validate phone format
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      if (!phoneRegex.test(formattedPhone)) {
        toast({
          title: 'Invalid phone number',
          description: 'Please enter a valid Indian phone number',
          variant: 'destructive',
        });
        return;
      }

      // Send OTP via Supabase (WhatsApp channel)
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'whatsapp', // or 'sms'
        },
      });

      if (error) throw error;

      toast({
        title: 'OTP sent!',
        description: 'Check your WhatsApp for the verification code',
      });

      setPhone(formattedPhone);
      setStep('otp');
    } catch (error: any) {
      toast({
        title: 'Failed to send OTP',
        description: error.message,
        variant: 'destructive',
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
      // Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms', // For phone OTP, type is 'sms' even if sent via WhatsApp
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('No session created');
      }

      toast({
        title: 'Success!',
        description: 'You are now logged in',
      });

      // Check if user needs to complete profile
      const user = data.user;
      if (!user.email) {
        // User signed up via phone, needs to complete profile
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Invalid OTP',
        description: error.message || 'Please check your code and try again',
        variant: 'destructive',
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
            You'll receive a verification code via WhatsApp
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
          Check your WhatsApp messages
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
```

#### 3.4 Update Auth Page

**File:** `/apps/web/src/pages/Auth.tsx`

**Import at top:**
```typescript
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm';
```

**Update tabs:**
```typescript
<Tabs defaultValue="email" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="email">Email</TabsTrigger>
    <TabsTrigger value="phone">Phone</TabsTrigger>
    <TabsTrigger value="waitlist">Join Waitlist</TabsTrigger>
  </TabsList>

  <TabsContent value="email">
    {/* Existing email login form */}
  </TabsContent>

  <TabsContent value="phone">
    <Card>
      <CardHeader>
        <CardTitle>Sign in with Phone</CardTitle>
        <CardDescription>
          We'll send a verification code to your WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PhoneLoginForm />
      </CardContent>
    </Card>
  </TabsContent>

  <TabsContent value="waitlist">
    {/* Existing waitlist form */}
  </TabsContent>
</Tabs>
```

---

### ⏳ PHASE 4: Testing & Validation (Day 3-4)

#### 4.1 Test Phone Login Flow

**Test Case 1: Send OTP via WhatsApp**
1. Go to `/auth`
2. Click "Phone" tab
3. Enter phone number: `+919876543210`
4. Click "Send OTP"
5. ✅ Should receive WhatsApp message with 6-digit code
6. ✅ UI should show OTP input screen

**Test Case 2: Verify OTP**
1. Enter 6-digit code from WhatsApp
2. Click "Verify & Login"
3. ✅ Should redirect to dashboard (if profile complete)
4. ✅ OR redirect to `/complete-profile` (if new user)

**Test Case 3: Error Cases**
- ❌ Invalid phone format → Show error toast
- ❌ Wrong OTP → Show "Invalid OTP" error
- ❌ Expired OTP (wait 5 minutes) → Show expiry error
- ❌ Rate limiting (multiple sends) → Show rate limit error

**Test Case 4: Resend OTP**
1. Click "Resend OTP" button
2. ✅ Should receive new code
3. ✅ Old code should be invalid

#### 4.2 Test WhatsApp Invites

**Test Case 1: Invite user with phone only**
1. Go to Users page (`/dashboard/users`)
2. Click "Invite User"
3. Select "Phone Number" contact method
4. Enter: `+919876543210`
5. Select role: "Subscriber"
6. Click "Send Invite"
7. ✅ Backend should create user
8. ✅ User should receive WhatsApp message with invite link

**Test Case 2: Complete invite flow**
1. User clicks WhatsApp invite link
2. ✅ Goes to `/auth/confirm?token_hash=xxx&type=invite&next=/complete-profile`
3. ✅ Redirects to `/complete-profile#access_token=JWT&type=invite`
4. ✅ Phone should be pre-filled (read-only or editable?)
5. User fills in:
   - Email: `user@example.com` (optional or required?)
   - Password: `password123`
6. Click "Complete Setup"
7. ✅ Creates session
8. ✅ Redirects to dashboard

**Test Case 3: Bulk invites**
1. Click "Bulk Invite"
2. Enter:
   ```
   +919876543210, subscriber
   +919876543211, sponsor
   ```
3. Click "Send Invites"
4. ✅ Both users should receive WhatsApp invites

---

## File Structure Summary

```
apps/
├── server/
│   ├── src/
│   │   ├── routers/
│   │   │   └── auth.router.ts (UPDATE - lines 395-401, 536-539)
│   │   ├── utils/
│   │   │   ├── email.ts (existing)
│   │   │   └── whatsapp.ts (NEW)
│   │   └── server.config.ts (UPDATE - add Twilio config)
│   └── package.json (UPDATE - add twilio)
│
└── web/
    ├── src/
    │   ├── components/
    │   │   └── auth/
    │   │       └── PhoneLoginForm.tsx (NEW)
    │   ├── lib/
    │   │   ├── supabase.ts (NEW)
    │   │   └── api-client.ts (existing)
    │   ├── pages/
    │   │   ├── Auth.tsx (UPDATE - add phone tab)
    │   │   └── CompleteProfile.tsx (may need updates)
    │   └── .env (UPDATE - add Supabase keys)
    └── package.json (UPDATE - add @supabase/supabase-js)
```

---

## Key Benefits

✅ **Less code:** Supabase handles OTP logic
✅ **More secure:** Built-in rate limiting and expiration
✅ **Simpler:** No Redis/DB for OTP storage
✅ **Scalable:** Supabase manages infrastructure
✅ **Flexible:** Can switch between SMS/WhatsApp channels
✅ **Consistent:** Same auth flow as email OTP

---

## Important Considerations

### 1. WhatsApp Channel Requirements

**For Supabase Phone Auth with WhatsApp:**
- Must use **Twilio Verify** (recommended) or **Twilio Programmable Messaging**
- WhatsApp sender must be approved by Twilio
- Template must follow WhatsApp Business Policy
- May require business verification for production

**For Direct WhatsApp Invites:**
- Can use Twilio Sandbox for development
- Production requires approved WhatsApp Business Account
- Custom messages allowed (not just OTP format)

### 2. Email vs Phone as Primary Identifier

**Decision needed:** Should users have email OR phone, or both?

**Current behavior:**
- Invite endpoint accepts email OR phone (not both required)
- CompleteProfile accepts both (both optional)
- JWT includes both if available

**Recommendation:**
- **Primary:** Phone (for Indian market)
- **Optional:** Email (for notifications, recovery)
- **Validation:** At least one required (phone or email)

### 3. Phone Number Validation

**Current:** Only Indian format `+91[6-9]XXXXXXXXX`

**Consider:**
- International support?
- Multiple country codes?
- Update regex pattern if needed

### 4. Supabase Session Sync

**Important:** When using Supabase auth on frontend, sessions are managed by Supabase SDK, not our backend cookies.

**Options:**
1. **Use Supabase sessions exclusively** (frontend manages auth)
2. **Sync with backend** (after Supabase login, call backend to set cookies)
3. **Hybrid approach** (use Supabase for phone, backend for email)

**Recommendation:** Option 2 - Sync sessions
- After successful `verifyOtp()`, call `/api/auth/sync-session`
- Backend validates Supabase session and sets HTTPOnly cookies
- Maintains consistency with existing email auth flow

---

## Questions to Resolve Before Implementation

1. **WhatsApp vs SMS priority?**
   - Use WhatsApp primarily, SMS as fallback?
   - Let user choose?

2. **Email requirement for phone users?**
   - Make email optional for phone-only users?
   - Require email for important notifications?

3. **Session management approach?**
   - Use Supabase sessions only?
   - Sync with backend cookies?

4. **International phone support?**
   - Support only Indian numbers initially?
   - Plan for multi-country expansion?

5. **Rate limiting strategy?**
   - Rely on Twilio/Supabase limits?
   - Add custom rate limiting?

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Set up Twilio account and get credentials
3. ⏳ Configure Supabase Phone Auth in dashboard
4. ⏳ Implement Phase 2 (Backend WhatsApp utilities)
5. ⏳ Implement Phase 3 (Frontend Phone Login UI)
6. ⏳ Execute Phase 4 (Testing)

---

**End of Implementation Plan**
