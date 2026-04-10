-- Gift pledges: family members indicate how much they'd contribute to 529.
-- Non-binding — validates demand before integrating a real payment flow.

create table if not exists public.gift_pledges (
  id            uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  user_id       uuid not null,  -- the student who owns the share link (denormalized for easy queries)
  -- Pledger info
  pledger_name  text not null,
  pledger_email text,
  pledger_relation text,          -- "Grandparent", "Aunt/Uncle", "Family friend", etc.
  amount        integer not null, -- dollars pledged
  message       text,             -- optional note ("For your first semester!")
  -- Lifecycle
  created_at    timestamptz not null default now()
);

create index if not exists gift_pledges_user_idx on public.gift_pledges (user_id);
create index if not exists gift_pledges_link_idx on public.gift_pledges (share_link_id);

alter table public.gift_pledges enable row level security;

-- Student can read their own pledges.
create policy gift_pledges_owner_read
  on public.gift_pledges
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Anyone (anon) can insert a pledge via the share page.
create policy gift_pledges_anon_insert
  on public.gift_pledges
  for insert
  to anon, authenticated
  with check (true);

-- Increment gift_clicks on the share link when a pledge is made.
create or replace function public.increment_gift_clicks()
returns trigger language plpgsql as $$
begin
  update public.share_links
    set gift_clicks = gift_clicks + 1
    where id = new.share_link_id;
  return new;
end;
$$;

create trigger gift_pledge_increment_clicks
  after insert on public.gift_pledges
  for each row execute function public.increment_gift_clicks();
