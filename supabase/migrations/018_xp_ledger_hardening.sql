-- Harden XP ledger: move insert logic to a server-side function so clients
-- cannot forge XP amounts, fabricate actions, or bypass deduplication.

-- 1. Drop the permissive INSERT policy
drop policy if exists "Users can insert own xp" on xp_ledger;

-- 2. Canonical XP rewards — single source of truth lives in the database now
create or replace function record_xp(p_action text, p_ref_id text)
returns void
language plpgsql
security definer          -- runs with table-owner privileges
set search_path = public  -- prevent search-path hijack
as $$
declare
  v_xp int;
begin
  -- Validate action and resolve XP in one step
  v_xp := case p_action
    when 'complete_task'     then 10
    when 'mark_milestone'    then 30
    when 'generate_strategy' then 50
    when 'essay_brainstorm'  then 25
    when 'essay_critique'    then 25
    when 'add_scholarship'   then 15
    when 'add_college'       then 10
    when 'refer_friend'      then 50
    when 'complete_challenge' then 20
    when 'explore_interact'  then  5
    when 'surprise_me'       then  5
    else null
  end;

  if v_xp is null then
    raise exception 'invalid xp action: %', p_action;
  end if;

  if p_ref_id is null or p_ref_id = '' then
    raise exception 'ref_id is required';
  end if;

  -- Upsert: if (user_id, action, ref_id) already exists, do nothing
  insert into xp_ledger (user_id, action, xp, ref_id)
  values (auth.uid(), p_action, v_xp, p_ref_id)
  on conflict (user_id, action, ref_id) where ref_id is not null
  do nothing;
end;
$$;

-- 3. Only authenticated users may call the function
revoke all on function record_xp(text, text) from public;
grant execute on function record_xp(text, text) to authenticated;
