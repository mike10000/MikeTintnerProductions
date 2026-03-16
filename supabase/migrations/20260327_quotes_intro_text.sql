-- Add intro/message text to quotes (paragraph shown above line items, displayed in bold)
alter table public.quotes
add column if not exists intro_text text;
