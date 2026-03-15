-- Client contracts - upload, view, and sign
create table public.client_contracts (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  file_url text not null,
  status text not null default 'pending' check (status in ('pending', 'signed')),
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

alter table public.client_contracts enable row level security;

create policy "Clients can view own contracts"
  on public.client_contracts for select
  using (auth.uid() = client_id);

create policy "Clients can update own contracts (sign)"
  on public.client_contracts for update
  using (auth.uid() = client_id);

create policy "Admins can manage all contracts"
  on public.client_contracts for all
  using (public.is_admin());

create policy "Clients can insert own contracts"
  on public.client_contracts for insert
  with check (auth.uid() = client_id);

create policy "Admins can insert contracts for clients"
  on public.client_contracts for insert
  with check (public.is_admin());

create index idx_client_contracts_client on public.client_contracts(client_id);
