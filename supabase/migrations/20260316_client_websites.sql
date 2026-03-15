-- Client websites/projects - links clients can view on their dashboard
create table public.client_websites (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.client_websites enable row level security;

create policy "Clients can view own websites"
  on public.client_websites for select
  using (auth.uid() = client_id);

create policy "Admins can manage all client websites"
  on public.client_websites for all
  using (public.is_admin());

create index idx_client_websites_client on public.client_websites(client_id);
