-- When a contract is signed and linked to a task, move task to last column (Done)
create or replace function public.on_contract_signed_update_task()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_done_column_id uuid;
  v_board_id uuid;
begin
  if new.status = 'signed' and new.task_id is not null then
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
  end if;
  return new;
end;
$$;

drop trigger if exists on_contract_signed on public.client_contracts;
create trigger on_contract_signed
  after update on public.client_contracts
  for each row
  when (old.status is distinct from new.status and new.status = 'signed')
  execute function public.on_contract_signed_update_task();
