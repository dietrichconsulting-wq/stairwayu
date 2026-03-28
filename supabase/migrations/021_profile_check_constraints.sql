-- Add CHECK constraints to validate profile score ranges

alter table profiles
  add constraint profiles_gpa_range
    check (gpa >= 0 and gpa <= 5.0);

alter table profiles
  add constraint profiles_sat_range
    check (sat >= 400 and sat <= 1600);

alter table profiles
  add constraint profiles_act_score_range
    check (act_score >= 1 and act_score <= 36);
