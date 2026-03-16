-- Track when quotes are accepted so admin can see approval timing
alter table public.quotes
add column if not exists accepted_at timestamptz;
