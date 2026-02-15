# Quick Setup Guide: PDF Cleanup Automation

This guide will help you set up automated cleanup of orphaned PDFs in your Supabase storage.

## What Was Implemented

✅ Edge Function to identify and delete orphaned PDFs
✅ GitHub Actions workflow for scheduled cleanup (daily at 2 AM UTC)
✅ Security via secret key authentication

## Quick Setup (5 minutes)

### Step 1: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link your project (find YOUR_PROJECT_REF in your Supabase Dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Deploy Edge Function

```bash
# From the root of this repository
supabase functions deploy cleanup-orphaned-pdfs
```

### Step 4: Set Supabase Secrets

1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add a new secret:
   - **Name:** `CLEANUP_SECRET_KEY`
   - **Value:** Generate using: `openssl rand -hex 32`

### Step 5: Set GitHub Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add two secrets:
   - **SUPABASE_PROJECT_REF**: Your project reference (e.g., `abcdefghijklmnop`)
   - **CLEANUP_SECRET_KEY**: Same value from Step 4

### Step 6: Test the Function

```bash
# Test manually (replace placeholders)
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-orphaned-pdfs' \
  -H 'Authorization: Bearer YOUR_CLEANUP_SECRET_KEY' \
  -H 'Content-Type: application/json'
```

## How It Works

1. **Daily Schedule**: GitHub Actions runs at 2 AM UTC every day
2. **Detection**: Lists all PDFs in storage and compares with database references
3. **Cleanup**: Deletes PDFs not referenced by any stock entry
4. **Reporting**: Returns summary of files deleted

## Files Created

- `supabase/functions/cleanup-orphaned-pdfs/index.ts` - Edge function code
- `.github/workflows/cleanup-pdfs.yml` - GitHub Actions workflow
- `supabase/functions/README.md` - Detailed documentation

## Manual Trigger

You can trigger cleanup manually from GitHub:
1. Go to Actions tab
2. Select "Cleanup Orphaned PDFs" workflow
3. Click "Run workflow"

## Monitoring

- **Edge Function Logs**: Supabase Dashboard → Edge Functions → cleanup-orphaned-pdfs → Logs
- **GitHub Actions**: Repository → Actions tab → Cleanup Orphaned PDFs

## Support

For detailed documentation, see: `supabase/functions/README.md`
