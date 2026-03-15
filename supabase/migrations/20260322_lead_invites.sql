-- Add invited status to quote_leads
alter table public.quote_leads
drop constraint if exists quote_leads_status_check;

alter table public.quote_leads
add constraint quote_leads_status_check
check (status in ('new', 'invited', 'converted', 'archived'));

-- Lead invites: admin sends estimate + meeting link, lead approves to get portal access
create table public.lead_invites (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.quote_leads(id) on delete cascade not null,
  token text not null unique,
  estimate text,
  meeting_link text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz
);

alter table public.lead_invites enable row level security;

create policy "Admins can manage lead invites"
  on public.lead_invites for all
  using (public.is_admin());

-- Public read via API (service role); no direct client access needed

create index idx_lead_invites_lead on public.lead_invites(lead_id);
create index idx_lead_invites_token on public.lead_invites(token);
