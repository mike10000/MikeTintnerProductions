-- Add signed_file_url to store the PDF with signature embedded
ALTER TABLE public.client_contracts
ADD COLUMN IF NOT EXISTS signed_file_url text;
