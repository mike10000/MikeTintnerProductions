-- Quote leads from contact/get-a-quote form - convert to clients
create table public.quote_leads (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null,
  organization text,
  org_type text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'converted', 'archived')),
  converted_client_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.quote_leads enable row level security;

create policy "Admins can manage quote leads"
  on public.quote_leads for all
  using (public.is_admin());

create policy "Anyone can insert quote leads (public form)"
  on public.quote_leads for insert
  with check (true);

create index idx_quote_leads_status on public.quote_leads(status);
create index idx_quote_leads_created on public.quote_leads(created_at desc);
