-- Link task boards to clients
alter table public.boards
add column if not exists client_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_boards_client on public.boards(client_id);
