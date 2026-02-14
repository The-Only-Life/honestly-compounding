# Supabase Edge Functions - PDF Cleanup

## Overview

This directory contains Edge Functions for managing Supabase operations. The `cleanup-orphaned-pdfs` function automatically removes PDF files from storage that are no longer referenced in the database.

## Functions

### cleanup-orphaned-pdfs

Removes orphaned PDF files from the `research-pdfs` storage bucket that are no longer associated with any stock entries.

**Location:** `supabase/functions/cleanup-orphaned-pdfs/index.ts`

**Functionality:**
- Lists all PDF files in the `research-pdfs/stocks` directory
- Queries the stocks table for all referenced PDFs
- Identifies and deletes orphaned PDFs
- Returns a summary of deleted files

## Setup Instructions

### Prerequisites

1. **Install Supabase CLI**

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

2. **Login to Supabase**

```bash
supabase login
```

### Deployment

1. **Link your Supabase project**

```bash
# Run this from the root of your repository
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in the Supabase Dashboard URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

2. **Deploy the Edge Function**

```bash
supabase functions deploy cleanup-orphaned-pdfs
```

3. **Set Environment Secrets**

Go to your Supabase Dashboard → Edge Functions → Secrets and add:

- `CLEANUP_SECRET_KEY`: Generate a random secret key
  ```bash
  # Generate a secure random key
  openssl rand -hex 32
  ```

The following secrets are automatically available:
- `SUPABASE_URL`: Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided by Supabase

### GitHub Actions Setup

The cleanup function is scheduled to run daily via GitHub Actions.

**Required GitHub Secrets:**

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

1. `SUPABASE_PROJECT_REF`: Your Supabase project reference ID
   - Example: `abcdefghijklmnop`
   - Find this in your Supabase Dashboard URL

2. `CLEANUP_SECRET_KEY`: The same secret key you set in Supabase Edge Functions
   - Use the same value from the previous step

**Workflow File:** `.github/workflows/cleanup-pdfs.yml`

**Schedule:** Daily at 2 AM UTC (configurable in the workflow file)

**Manual Trigger:** You can also trigger the workflow manually from the GitHub Actions tab

### Testing

#### Test the Edge Function Directly

```bash
# Using curl (replace with your actual values)
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-orphaned-pdfs' \
  -H 'Authorization: Bearer YOUR_CLEANUP_SECRET_KEY' \
  -H 'Content-Type: application/json'
```

#### Expected Responses

**Success (no orphaned files):**
```json
{
  "message": "No orphaned PDFs found",
  "totalFiles": 10,
  "referencedFiles": 10
}
```

**Success (orphaned files deleted):**
```json
{
  "message": "Successfully deleted 3 orphaned PDFs",
  "deletedFiles": [
    "stocks/1234567890-old-file.pdf",
    "stocks/0987654321-deleted-stock.pdf",
    "stocks/1122334455-unused.pdf"
  ],
  "totalFiles": 13,
  "referencedFiles": 10
}
```

**Error (unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

### Monitoring

#### Check Function Logs

In Supabase Dashboard:
1. Go to Edge Functions
2. Click on `cleanup-orphaned-pdfs`
3. View the Logs tab

#### Check GitHub Actions Runs

In GitHub:
1. Go to your repository
2. Click on the "Actions" tab
3. Select "Cleanup Orphaned PDFs" workflow
4. View run history and logs

### Manual Cleanup Query

If you want to check for orphaned PDFs manually before running cleanup:

```sql
-- View potential orphaned PDFs
SELECT
  name as file_name,
  created_at,
  updated_at,
  (metadata->>'size')::bigint as size_bytes
FROM storage.objects
WHERE bucket_id = 'research-pdfs'
  AND name LIKE 'stocks/%'
ORDER BY created_at DESC;

-- Count orphaned vs referenced PDFs
WITH storage_files AS (
  SELECT name
  FROM storage.objects
  WHERE bucket_id = 'research-pdfs'
    AND name LIKE 'stocks/%'
),
referenced_files AS (
  SELECT DISTINCT
    split_part(pdf_url, '/research-pdfs/', 2) as file_path
  FROM stocks
  WHERE pdf_url IS NOT NULL
)
SELECT
  (SELECT COUNT(*) FROM storage_files) as total_files,
  (SELECT COUNT(*) FROM referenced_files) as referenced_files,
  (SELECT COUNT(*) FROM storage_files WHERE name NOT IN (SELECT file_path FROM referenced_files WHERE file_path IS NOT NULL)) as orphaned_files;
```

## Troubleshooting

### Function deployment fails

```bash
# Check if you're linked to the right project
supabase projects list

# Re-link if needed
supabase link --project-ref YOUR_PROJECT_REF
```

### Unauthorized error

- Verify `CLEANUP_SECRET_KEY` matches in both Supabase Edge Functions secrets and GitHub secrets
- Check that the Authorization header format is correct: `Bearer YOUR_SECRET_KEY`

### GitHub Action fails

- Check that both `SUPABASE_PROJECT_REF` and `CLEANUP_SECRET_KEY` are set in GitHub secrets
- Verify the project ref in the workflow file URL matches your actual project

### Function logs show errors

- Check Supabase Dashboard → Edge Functions → Logs for detailed error messages
- Verify the `research-pdfs` bucket exists
- Ensure the storage bucket has proper RLS policies for service role access

## Security Notes

- The cleanup function requires a secret key to prevent unauthorized access
- Only the service role key can delete files from storage
- The function is designed to fail safely - if it can't delete a file, it continues with others
- All operations are logged for audit purposes

## Customization

### Change Cleanup Schedule

Edit `.github/workflows/cleanup-pdfs.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Change this line
```

Common cron patterns:
- `'0 */6 * * *'` - Every 6 hours
- `'0 0 * * 0'` - Weekly on Sunday at midnight
- `'0 3 1 * *'` - Monthly on the 1st at 3 AM

### Modify Cleanup Logic

Edit `supabase/functions/cleanup-orphaned-pdfs/index.ts` to customize:
- Which files to consider orphaned
- Add additional validation checks
- Change the storage bucket path
- Add notification on cleanup

After changes, redeploy:
```bash
supabase functions deploy cleanup-orphaned-pdfs
```
