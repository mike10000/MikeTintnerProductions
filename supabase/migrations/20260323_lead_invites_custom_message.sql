-- Add custom message to lead invites (admin's personal note to the lead)
alter table public.lead_invites
add column if not exists custom_message text;
