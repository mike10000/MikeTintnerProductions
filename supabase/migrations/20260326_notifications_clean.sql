-- Client notifications and email preferences (idempotent - safe to re-run)
-- Run this entire file in Supabase SQL Editor

-- Drop triggers first (they depend on tables)
drop trigger if exists on_work_order_updated on public.work_orders;
drop trigger if exists on_quote_updated on public.quotes;
drop trigger if exists on_invoice_updated on public.invoices;
drop trigger if exists on_message_inserted on public.messages;
drop trigger if exists on_task_updated on public.tasks;
drop trigger if exists on_task_inserted on public.tasks;
drop trigger if exists on_contract_inserted on public.client_contracts;

-- Drop tables (order matters for FKs)
drop table if exists public.notification_preferences;
drop table if exists public.notifications;

-- Create notifications table
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in (
    'work_order_update', 'quote_sent', 'invoice_sent', 'task_update', 'new_message', 'contract_ready'
  )),
  title text not null,
  body text,
  link_url text,
  read boolean not null default false,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (public.is_admin());

create policy "Admins can view all notifications"
  on public.notifications for select
  using (public.is_admin());

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_created on public.notifications(created_at desc);
create index idx_notifications_unread on public.notifications(user_id, read) where read = false;

-- Create notification_preferences table
create table public.notification_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  work_order_updates boolean not null default true,
  quote_updates boolean not null default true,
  invoice_updates boolean not null default true,
  task_updates boolean not null default true,
  new_messages boolean not null default true,
  contract_updates boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can view own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

-- Triggers
create or replace function public.notify_work_order_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      new.client_id,
      'work_order_update',
      'Work order updated',
      'Your work order "' || new.title || '" is now ' || new.status || '.',
      '/portal/work-orders?order=' || new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_work_order_updated
  after update on public.work_orders
  for each row execute function public.notify_work_order_update();

create or replace function public.notify_quote_sent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'sent' and new.status = 'sent' then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      new.client_id,
      'quote_sent',
      'New quote ready',
      'A new quote has been sent for your review.',
      '/portal/quotes'
    );
  end if;
  return new;
end;
$$;

create trigger on_quote_updated
  after update on public.quotes
  for each row execute function public.notify_quote_sent();

create or replace function public.notify_invoice_sent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'sent' and new.status = 'sent' then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      new.client_id,
      'invoice_sent',
      'New invoice',
      'An invoice has been sent. Please review and pay when ready.',
      '/portal/invoices'
    );
  end if;
  return new;
end;
$$;

create trigger on_invoice_updated
  after update on public.invoices
  for each row execute function public.notify_invoice_sent();

create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  conv_client_id uuid;
  sender_role text;
begin
  select client_id into conv_client_id from public.conversations where id = new.conversation_id;
  select role into sender_role from public.profiles where id = new.sender_id;
  if sender_role = 'admin' and conv_client_id is not null then
    insert into public.notifications (user_id, type, title, body, link_url)
    values (
      conv_client_id,
      'new_message',
      'New message',
      'You have a new message from Mike Tintner Productions.',
      '/portal/messages'
    );
  end if;
  return new;
end;
$$;

create trigger on_message_inserted
  after insert on public.messages
  for each row execute function public.notify_new_message();

create or replace function public.notify_task_update()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  b_client_id uuid;
begin
  if new.client_visible then
    select b.client_id into b_client_id
    from public.board_columns bc
    join public.boards b on b.id = bc.board_id
    where bc.id = new.column_id;
    if b_client_id is not null then
      insert into public.notifications (user_id, type, title, body, link_url)
      values (
        b_client_id,
        'task_update',
        'Task updated',
        'Task "' || new.title || '" has been updated.',
        '/portal'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger on_task_updated
  after update on public.tasks
  for each row execute function public.notify_task_update();

create or replace function public.notify_task_visible()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  b_client_id uuid;
begin
  if new.client_visible then
    select b.client_id into b_client_id
    from public.board_columns bc
    join public.boards b on b.id = bc.board_id
    where bc.id = new.column_id;
    if b_client_id is not null then
      insert into public.notifications (user_id, type, title, body, link_url)
      values (
        b_client_id,
        'task_update',
        'New task for you',
        'Task "' || new.title || '" has been added and is visible to you.',
        '/portal'
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger on_task_inserted
  after insert on public.tasks
  for each row execute function public.notify_task_visible();

create or replace function public.notify_contract_ready()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url)
  values (
    new.client_id,
    'contract_ready',
    'New contract to review',
    'A new contract "' || new.name || '" has been added for your review.',
    '/portal/contracts'
  );
  return new;
end;
$$;

create trigger on_contract_inserted
  after insert on public.client_contracts
  for each row execute function public.notify_contract_ready();
