-- When a contract is signed:
-- 1. If task_id is set: move task to Done column (existing behavior)
-- 2. If task_id is null: create a new board for the client named after the contract
create or replace function public.on_contract_signed_update_task()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_done_column_id uuid;
  v_board_id uuid;
  v_new_board_id uuid;
begin
  if new.status = 'signed' then
    if new.task_id is not null then
      -- Existing: move linked task to Done
      select bc.board_id into v_board_id
      from public.tasks t
      join public.board_columns bc on bc.id = t.column_id
      where t.id = new.task_id;

      if v_board_id is not null then
        select id into v_done_column_id
        from public.board_columns
        where board_id = v_board_id
        order by position desc
        limit 1;

        if v_done_column_id is not null then
          update public.tasks
          set column_id = v_done_column_id, updated_at = now()
          where id = new.task_id;
        end if;
      end if;
    else
      -- New: create a board for the client when no task was selected
      insert into public.boards (name, client_id)
      values (
        coalesce(nullif(trim(new.name), ''), 'Project') || ' - ' || coalesce(to_char(new.signed_at, 'YYYY-MM-DD'), 'Signed'),
        new.client_id
      )
      returning id into v_new_board_id;

      if v_new_board_id is not null then
        insert into public.board_columns (board_id, title, position)
        select v_new_board_id, cols.title, cols.pos
        from (values (0, 'Backlog'), (1, 'To Do'), (2, 'In Progress'), (3, 'Review'), (4, 'Done')) as cols(pos, title);
      end if;
    end if;
  end if;
  return new;
end;
$$;
