-- Track whether subscription is monthly or annual
create type billing_interval as enum ('month', 'year');

alter table public.subscriptions
  add column if not exists billing_interval billing_interval;
