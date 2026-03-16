-- Link contracts to invoices for scope of work and payment terms
alter table public.client_contracts
add column if not exists invoice_id uuid references public.invoices(id) on delete set null;

create index if not exists idx_client_contracts_invoice on public.client_contracts(invoice_id);
