-- ============================================================
-- Mike Tintner Productions - Supabase Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  company_name text,
  phone text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper to avoid RLS recursion (profiles policy querying profiles)
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select role from public.profiles where id = auth.uid()), '') = 'admin';
$$;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'company_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- WORK ORDERS
-- ============================================================
create table public.work_orders (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  status text not null default 'submitted'
    check (status in ('submitted', 'in_progress', 'review', 'completed', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.work_orders enable row level security;

create policy "Clients can view own work orders"
  on public.work_orders for select
  using (auth.uid() = client_id);

create policy "Clients can create work orders"
  on public.work_orders for insert
  with check (auth.uid() = client_id);

create policy "Admins can do anything with work orders"
  on public.work_orders for all
  using (public.is_admin());

-- ============================================================
-- QUOTES
-- ============================================================
create table public.quotes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  line_items jsonb not null default '[]',
  total numeric(10,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined')),
  valid_until date,
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

create policy "Clients can view own quotes"
  on public.quotes for select
  using (auth.uid() = client_id);

create policy "Clients can update own quotes (accept/decline)"
  on public.quotes for update
  using (auth.uid() = client_id);

create policy "Admins can do anything with quotes"
  on public.quotes for all
  using (public.is_admin());

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  quote_id uuid references public.quotes(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  square_invoice_id text,
  square_payment_link text,
  line_items jsonb not null default '[]',
  total numeric(10,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue')),
  due_date date not null default (current_date + interval '30 days'),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Clients can view own invoices"
  on public.invoices for select
  using (auth.uid() = client_id);

create policy "Admins can do anything with invoices"
  on public.invoices for all
  using (public.is_admin());

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "Clients can view own conversations"
  on public.conversations for select
  using (auth.uid() = client_id);

create policy "Clients can create conversations"
  on public.conversations for insert
  with check (auth.uid() = client_id);

create policy "Admins can do anything with conversations"
  on public.conversations for all
  using (public.is_admin());

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id and client_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Admins can update messages (mark read)"
  on public.messages for update
  using (public.is_admin());

create policy "Clients can mark own messages read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id and client_id = auth.uid()
    )
  );

-- ============================================================
-- KANBAN BOARDS
-- ============================================================
create table public.boards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.boards enable row level security;

create policy "Admins can do anything with boards"
  on public.boards for all
  using (public.is_admin());

create table public.board_columns (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  position integer not null default 0
);

alter table public.board_columns enable row level security;

create policy "Admins can do anything with board columns"
  on public.board_columns for all
  using (public.is_admin());

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  column_id uuid references public.board_columns(id) on delete cascade not null,
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  labels text[] not null default '{}',
  position integer not null default 0,
  client_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Admins can do anything with tasks"
  on public.tasks for all
  using (public.is_admin());

create policy "Clients can view visible tasks"
  on public.tasks for select
  using (client_visible = true);

create table public.task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

create policy "Admins can do anything with task comments"
  on public.task_comments for all
  using (public.is_admin());

-- ============================================================
-- REALTIME (enable for messages)
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_work_orders_client on public.work_orders(client_id);
create index idx_work_orders_status on public.work_orders(status);
create index idx_quotes_client on public.quotes(client_id);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_conversations_client on public.conversations(client_id);
create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_read on public.messages(read);
create index idx_board_columns_board on public.board_columns(board_id);
create index idx_tasks_column on public.tasks(column_id);
create index idx_task_comments_task on public.task_comments(task_id);
