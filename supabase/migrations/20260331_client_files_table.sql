-- Table to track direct file uploads (separate from message/work order attachments)
create table if not exists public.client_files (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  file_url text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

alter table public.client_files enable row level security;

create policy "Clients can view own files"
  on public.client_files for select
  using (auth.uid() = client_id);

create policy "Clients can insert own files"
  on public.client_files for insert
  with check (auth.uid() = client_id);

create policy "Admins can manage all client files"
  on public.client_files for all
  using (public.is_admin());

create index idx_client_files_client on public.client_files(client_id);

-- Ensure storage bucket allows required file types (run if bucket exists)
-- PDF, DOC, DOCX, CSV, TXT, JPG, PNG, GIF, WEBP
update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]
where id = 'client-files';
