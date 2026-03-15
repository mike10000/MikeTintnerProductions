-- Contract templates - admin fills price, generates PDF
create table public.contract_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.contract_templates enable row level security;

create policy "Admins can manage contract templates"
  on public.contract_templates for all
  using (public.is_admin());

-- Add task_id to client_contracts for task board linkage
alter table public.client_contracts
add column if not exists task_id uuid references public.tasks(id) on delete set null;

create index idx_client_contracts_task on public.client_contracts(task_id);

-- Seed web design template
insert into public.contract_templates (name, slug, description, content)
values (
  'Web Design Agreement',
  'web-design',
  'Standard web design contract. Admin enters project price.',
  E'WEB DESIGN AGREEMENT\n\nThis agreement is entered into between Mike Tintner Productions ("Designer") and the Client for web design services.\n\nSCOPE OF WORK\nDesigner will create a custom website based on the project requirements discussed. This includes design, development, and deployment.\n\nPROJECT FEE\nTotal project cost: ${{PRICE}}\n\nPayment terms: 50% deposit to begin, 50% upon completion.\n\nTIMELINE\nProject timeline will be agreed upon at kickoff. Revisions are included as outlined in the project scope.\n\nACCEPTANCE\nBy signing below, Client agrees to the terms of this agreement.\n\n___________________________\nClient Signature\n\n___________________________\nDate'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  content = excluded.content;
