-- When a new client signs up: create welcome task board and send welcome email
-- Trigger runs after profile insert (from handle_new_user on auth signup)

-- Add welcome_client to notification types
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (type in (
    'work_order_update', 'quote_sent', 'invoice_sent', 'task_update', 'new_message', 'contract_ready', 'welcome_client'
  ));

-- Function: create welcome board + notification when new client profile is created
create or replace function public.on_new_client_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_board_id uuid;
  v_backlog_id uuid;
  v_client_name text;
  v_welcome_body text;
begin
  -- Only for clients (default role)
  if new.role <> 'client' then
    return new;
  end if;

  v_client_name := coalesce(nullif(trim(new.full_name), ''), new.company_name, 'there');

  -- Create welcome board
  insert into public.boards (name, client_id)
  values ('Welcome, ' || v_client_name || '!', new.id)
  returning id into v_board_id;

  -- Create default columns
  insert into public.board_columns (board_id, title, position)
  select v_board_id, cols.title, cols.pos
  from (values (0, 'Backlog'), (1, 'To Do'), (2, 'In Progress'), (3, 'Review'), (4, 'Done')) as cols(pos, title);

  -- Get Backlog column for the welcome task
  select id into v_backlog_id
  from public.board_columns
  where board_id = v_board_id and title = 'Backlog'
  limit 1;

  if v_backlog_id is not null then
    -- Create welcome task with instructions
    insert into public.tasks (column_id, title, description, position, client_visible)
    values (
      v_backlog_id,
      'Welcome! Get started here',
      E'Welcome to Mike Tintner Productions! Thank you for the opportunity to work with you.\n\n' ||
      E'**Getting started:**\n' ||
      E'• Dashboard – Overview of your projects and activity\n' ||
      E'• Work Orders – Submit requests and track progress\n' ||
      E'• Quotes – Review and approve project estimates\n' ||
      E'• Messages – Communicate with our team\n' ||
      E'• Files – Upload and access project documents\n\n' ||
      E'**Tell us about your project:** Reply to the welcome email or start a new message to share your goals, timeline, and any questions. We''re excited to get started!',
      0,
      true
    );
  end if;

  -- Insert notification for welcome email (send-emails cron will pick it up)
  v_welcome_body :=
    'Welcome to Mike Tintner Productions! Thank you for the opportunity to work with you. We''re excited to get started.' || E'\n\n' ||
    '**Getting started with your portal:**' || E'\n' ||
    '• **Dashboard** – See an overview of your projects and recent activity' || E'\n' ||
    '• **Work Orders** – Submit project requests and track their progress' || E'\n' ||
    '• **Quotes** – Review and approve estimates we send you' || E'\n' ||
    '• **Messages** – Communicate directly with our team' || E'\n' ||
    '• **Files** – Upload documents and access project files' || E'\n' ||
    '• **Contracts** – Sign agreements and view signed documents' || E'\n\n' ||
    '**Tell us about your project:** Reply to this email or start a new message in the portal to share your goals, timeline, and any questions. We''d love to hear what you have in mind!';

  insert into public.notifications (user_id, type, title, body, link_url)
  values (
    new.id,
    'welcome_client',
    'Welcome to your client portal!',
    v_welcome_body,
    '/portal'
  );

  return new;
end;
$$;

drop trigger if exists on_new_client_profile on public.profiles;
create trigger on_new_client_profile
  after insert on public.profiles
  for each row
  execute function public.on_new_client_profile();
