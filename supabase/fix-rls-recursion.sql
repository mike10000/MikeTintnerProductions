-- Fix infinite recursion in RLS policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gkvtievstddoctiqblff/sql

-- Create helper function that bypasses RLS (SECURITY DEFINER)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    ''
  ) = 'admin';
$$;

-- Drop the recursive policies on profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- Recreate using the helper (no recursion)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- Update other tables that use the same pattern (drop and recreate)
drop policy if exists "Admins can do anything with work orders" on public.work_orders;
create policy "Admins can do anything with work orders"
  on public.work_orders for all
  using (public.is_admin());

drop policy if exists "Admins can do anything with quotes" on public.quotes;
create policy "Admins can do anything with quotes"
  on public.quotes for all
  using (public.is_admin());

drop policy if exists "Admins can do anything with invoices" on public.invoices;
create policy "Admins can do anything with invoices"
  on public.invoices for all
  using (public.is_admin());

drop policy if exists "Admins can do anything with conversations" on public.conversations;
create policy "Admins can do anything with conversations"
  on public.conversations for all
  using (public.is_admin());

drop policy if exists "Admins can update messages (mark read)" on public.messages;
create policy "Admins can update messages (mark read)"
  on public.messages for update
  using (public.is_admin());

drop policy if exists "Admins can do anything with boards" on public.boards;
create policy "Admins can do anything with boards"
  on public.boards for all
  using (public.is_admin());

drop policy if exists "Admins can do anything with board columns" on public.board_columns;
create policy "Admins can do anything with board columns"
  on public.board_columns for all
  using (public.is_admin());

drop policy if exists "Admins can do anything with tasks" on public.tasks;
create policy "Admins can do anything with tasks"
  on public.tasks for all
  using (public.is_admin());

drop policy if exists "Admins can do anything with task comments" on public.task_comments;
create policy "Admins can do anything with task comments"
  on public.task_comments for all
  using (public.is_admin());
