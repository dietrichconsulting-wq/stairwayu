-- Single RPC that returns all achievement-related counts in one round trip,
-- replacing 6 hooks + 4 inline queries in useAchievements.
create or replace function get_achievement_context()
returns json
language plpgsql
stable
security definer
as $$
declare
  _uid uuid := auth.uid();
  _tasks_completed int;
  _essay_actions int;
  _schools_compared int;
  _scholarships_tracked int;
  _strategy_generated boolean;
  _milestones_reached int;
  _total_xp int;
  _challenges_completed int;
  _streak int;
begin
  -- Tasks completed
  select count(*)::int into _tasks_completed
  from tasks
  where user_id = _uid and status = 'Done';

  -- Essay actions from xp_ledger
  select count(*)::int into _essay_actions
  from xp_ledger
  where user_id = _uid and action in ('essay_brainstorm', 'essay_critique');

  -- Schools compared
  select count(*)::int into _schools_compared
  from user_colleges
  where user_id = _uid;

  -- Scholarships tracked
  select count(*)::int into _scholarships_tracked
  from scholarships
  where user_id = _uid;

  -- Strategy ever generated
  select exists(
    select 1 from xp_ledger
    where user_id = _uid and action = 'generate_strategy'
  ) into _strategy_generated;

  -- Milestones reached
  select count(*)::int into _milestones_reached
  from progress
  where user_id = _uid;

  -- Total XP
  select coalesce(sum(xp), 0)::int into _total_xp
  from xp_ledger
  where user_id = _uid;

  -- Challenge completions
  select count(*)::int into _challenges_completed
  from challenge_completions
  where user_id = _uid;

  -- Streak: consecutive days ending today or yesterday
  with ranked as (
    select activity_date,
           activity_date - (row_number() over (order by activity_date desc))::int as grp
    from daily_activity
    where user_id = _uid
  ),
  current_grp as (
    select grp from ranked
    where activity_date >= current_date - 1
    order by activity_date desc
    limit 1
  )
  select coalesce(
    (select count(*)::int from ranked where grp = (select grp from current_grp)),
    0
  ) into _streak;

  return json_build_object(
    'tasks_completed', _tasks_completed,
    'essay_actions', _essay_actions,
    'schools_compared', _schools_compared,
    'scholarships_tracked', _scholarships_tracked,
    'strategy_generated', _strategy_generated,
    'milestones_reached', _milestones_reached,
    'total_xp', _total_xp,
    'challenges_completed', _challenges_completed,
    'streak', _streak
  );
end;
$$;
