-- Migration: Setup RLS policies for research-pdfs storage bucket
-- Description: Configures RLS policies for PDF uploads to the research-pdfs bucket

-- Policy 1: Allow authenticated admin users to INSERT (upload) files
CREATE POLICY "Admin users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'research-pdfs'
  AND auth.uid() IN (
    SELECT user_id
    FROM public.user_metadata
    WHERE role = 'admin'
  )
);

-- Policy 2: Allow authenticated admin users to UPDATE files
CREATE POLICY "Admin users can update PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'research-pdfs'
  AND auth.uid() IN (
    SELECT user_id
    FROM public.user_metadata
    WHERE role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'research-pdfs'
  AND auth.uid() IN (
    SELECT user_id
    FROM public.user_metadata
    WHERE role = 'admin'
  )
);

-- Policy 3: Allow authenticated admin users to DELETE files
CREATE POLICY "Admin users can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'research-pdfs'
  AND auth.uid() IN (
    SELECT user_id
    FROM public.user_metadata
    WHERE role = 'admin'
  )
);

-- Policy 4: Allow all authenticated users to SELECT (read/download) files
CREATE POLICY "Authenticated users can read PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'research-pdfs');
