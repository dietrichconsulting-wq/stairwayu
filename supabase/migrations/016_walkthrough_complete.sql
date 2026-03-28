-- Add walkthrough_complete flag so the welcome tour only fires once
alter table public.profiles
  add column if not exists walkthrough_complete boolean not null default false;
