# Supabase Phone Authentication Setup Guide

This guide will walk you through setting up phone authentication in Supabase for the Honestly Insight Hub project.

## Prerequisites

- Supabase project created
- Twilio account (for SMS/WhatsApp)
- Admin access to Supabase Dashboard

---

## Part 1: Database Schema Updates

### Step 1: Add contact_method column to user_metadata table

Run this SQL in Supabase SQL Editor:

```sql
-- Add contact_method column to user_metadata table
ALTER TABLE public.user_metadata
ADD COLUMN IF NOT EXISTS contact_method TEXT CHECK (contact_method IN ('email', 'phone'));

-- Set default value for existing rows
UPDATE public.user_metadata
SET contact_method = 'email'
WHERE contact_method IS NULL AND user_id IN (
  SELECT id FROM auth.users WHERE email IS NOT NULL
);

UPDATE public.user_metadata
SET contact_method = 'phone'
WHERE contact_method IS NULL AND user_id IN (
  SELECT id FROM auth.users WHERE phone IS NOT NULL AND email IS NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_metadata_contact_method
ON public.user_metadata(contact_method);

-- Add comment for documentation
COMMENT ON COLUMN public.user_metadata.contact_method IS
'Contact method used for inviting the user: email or phone';
```

### Step 2: Verify the schema update

```sql
-- Check if column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_metadata'
  AND table_schema = 'public'
  AND column_name = 'contact_method';
```

---

## Part 2: Configure Twilio

### Step 1: Create Twilio Account

1. Go to https://www.twilio.com/
2. Sign up for a free trial account
3. Verify your account with a phone number

### Step 2: Get Twilio Credentials

1. Go to Twilio Console: https://console.twilio.com/
2. Note down these credentials:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "Show" to reveal)

### Step 3: Get a Phone Number (for SMS)

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a phone number with SMS capabilities
3. Purchase the number (free trial includes credits)
4. Note down the phone number in E.164 format (e.g., `+14155551234`)

### Step 4: (Optional) Set up WhatsApp Sandbox

For development/testing with WhatsApp:

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join the sandbox (send a WhatsApp message to Twilio's number)
3. WhatsApp Sandbox number: `whatsapp:+14155238886`

**Note:** For production WhatsApp, you need to:
- Request WhatsApp Business API access
- Get your WhatsApp Business number approved
- Submit message templates for approval

---

## Part 3: Configure Supabase Phone Auth

### Step 1: Navigate to Phone Auth Settings

1. Go to your Supabase Dashboard
2. Select your project
3. Navigate to: **Authentication** → **Providers**
4. Scroll down to **Phone**

### Step 2: Enable Phone Provider

1. Toggle **Enable Phone Sign-up** to ON
2. Choose SMS/WhatsApp provider: **Twilio**

### Step 3: Configure Twilio Settings

Enter your Twilio credentials:

```
Account SID: AC... (from Twilio Console)
Auth Token: ••••• (from Twilio Console)
```

### Step 4: Configure Phone Number

For SMS:
```
Twilio Phone Number: +14155551234
```

For WhatsApp (sandbox):
```
Twilio WhatsApp Number: whatsapp:+14155238886
```

### Step 5: Configure OTP Settings

```
OTP Expiry: 300 seconds (5 minutes)
OTP Length: 6 digits
```

### Step 6: Customize SMS Template (Optional)

Default template:
```
Your verification code is {{ .Code }}
```

Custom template for Honestly Compounding:
```
Your Honestly Compounding verification code is {{ .Code }}

Valid for 5 minutes.
```

### Step 7: Save Configuration

Click **Save** to apply the changes.

---

## Part 4: Update Environment Variables

### Backend (.env.development)

Add Twilio credentials for direct WhatsApp invites (Phase 2):

```bash
# Twilio Configuration (for WhatsApp invites)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Frontend (.env)

Add Supabase credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key_here
```

**To get these values:**
1. Supabase Dashboard → **Settings** → **API**
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## Part 5: Test Phone Authentication

### Test 1: Send OTP via SMS

1. Start the web app: `cd apps/web && bun run dev`
2. Navigate to `/auth`
3. Click the **Phone** tab
4. Enter a phone number: `+919876543210`
5. Click **Send OTP**
6. Check your phone for SMS with 6-digit code
7. Enter the OTP code
8. Click **Verify & Login**
9. Should redirect to `/complete-profile`

### Test 2: Complete Profile

1. After OTP verification, you should be on `/complete-profile`
2. Phone number should be pre-filled and read-only
3. Add email (optional) and password
4. Click **Complete Setup**
5. Should redirect to `/dashboard`

### Test 3: Login Again

1. Logout
2. Go to `/auth` → **Phone** tab
3. Enter same phone number
4. Verify OTP
5. Should go directly to `/dashboard` (profile already complete)

---

## Part 6: Verify Database Records

Check that users are created correctly:

```sql
-- Check auth.users table
SELECT id, phone, email, created_at, last_sign_in_at
FROM auth.users
WHERE phone IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Check user_metadata table
SELECT um.user_id, um.role, um.access_approved, um.contact_method, au.phone, au.email
FROM public.user_metadata um
JOIN auth.users au ON um.user_id = au.id
WHERE um.contact_method = 'phone'
ORDER BY um.created_at DESC
LIMIT 5;
```

---

## Part 7: Enable Row Level Security (RLS)

Ensure user_metadata table has proper RLS policies:

```sql
-- Enable RLS on user_metadata
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own metadata
CREATE POLICY "Users can view own metadata"
ON public.user_metadata
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can do anything (for backend)
CREATE POLICY "Service role has full access"
ON public.user_metadata
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## Troubleshooting

### Issue: OTP not received

**Possible causes:**
1. Phone number format incorrect (must include country code, e.g., `+91` for India)
2. Twilio trial account restrictions (can only send to verified numbers)
3. Insufficient Twilio credits
4. Phone number blocked/invalid

**Solutions:**
- Verify phone number format: `+[country code][number]`
- For trial accounts, add recipient numbers to Verified Caller IDs in Twilio
- Check Twilio logs: Console → Monitor → Logs → Messaging

### Issue: "Invalid CAPTCHA" error

Make sure reCAPTCHA is configured:
1. Add `VITE_RECAPTCHA_SITE_KEY` to frontend .env
2. reCAPTCHA v3 should be loaded in the app

### Issue: Session not persisting

Check that:
1. Supabase client is configured with `persistSession: true`
2. Browser allows cookies
3. HTTPOnly cookies are set correctly in backend

### Issue: "User already exists" error

This means a user with that phone/email already exists. Options:
1. Delete the existing user from Supabase Dashboard
2. Use the "Resend Invite" button in User Management
3. Have the user login instead of signing up again

---

## Rate Limits

Twilio trial account limits:
- **SMS:** ~1 message per second
- **Credits:** $15 free trial credit
- **Restrictions:** Can only send to verified phone numbers

Supabase auth rate limits:
- **OTP requests:** 4 per hour per phone number
- **Login attempts:** Configurable in Supabase Dashboard

---

## Production Checklist

Before going to production:

- [ ] Upgrade Twilio account from trial to paid
- [ ] Get dedicated phone number(s) for SMS
- [ ] (Optional) Set up WhatsApp Business API
- [ ] Submit WhatsApp message templates for approval
- [ ] Configure custom SMS templates
- [ ] Set up monitoring and alerts for failed messages
- [ ] Enable rate limiting and abuse prevention
- [ ] Update CORS settings for production domain
- [ ] Configure proper error tracking (Sentry, LogRocket, etc.)
- [ ] Test with phone numbers from different countries (if applicable)
- [ ] Review and adjust OTP expiry time
- [ ] Set up backup SMS provider (for redundancy)

---

## Cost Estimation

**Twilio Pricing (approximate):**
- SMS: $0.0075 per message (India)
- WhatsApp: $0.005 per session (first 1000 free per month)
- Phone number rental: $1-2 per month

**Example monthly cost for 1000 users:**
- 1000 users × 2 OTPs (signup + occasional login) = 2000 SMS
- 2000 × $0.0075 = $15/month (SMS)
- Or WhatsApp: First 1000 free, remaining 1000 × $0.005 = $5/month

---

## Next Steps (Phase 2)

The following features are planned but not yet implemented:

1. **WhatsApp Invites:** Direct Twilio API integration for custom invite messages
2. **SMS Invites:** Similar to WhatsApp but via SMS channel
3. **Multi-channel Support:** Let users choose SMS vs WhatsApp for OTP
4. **International Phone Support:** Support for multiple country codes
5. **Phone Number Verification:** Verify phone ownership before account creation

---

**Last Updated:** 2025-01-21
**Version:** 1.0.0
**Maintained by:** Honestly Compounding Team
