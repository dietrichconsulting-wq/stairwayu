-- RPC to return a user's total XP as a single scalar instead of fetching all rows.
create or replace function get_total_xp()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(xp), 0)::int
  from xp_ledger
  where user_id = auth.uid();
$$;

revoke all on function get_total_xp() from public;
grant execute on function get_total_xp() to authenticated;
