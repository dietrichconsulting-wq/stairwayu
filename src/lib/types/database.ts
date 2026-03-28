export type TaskStatus = 'To Do' | 'In Progress' | 'Done'
export type TaskCategory =
  | 'Testing' | 'Applications' | 'Essays' | 'Financial Aid'
  | 'Recommendations' | 'Visits' | 'Scholarships' | 'Research' | 'Other'
export type ScholarshipDifficulty = 'Easy' | 'Medium' | 'Hard'
export type ScholarshipStage = 'Researching' | 'Applying' | 'Submitted' | 'Won'
export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
export type BillingInterval = 'month' | 'year'

export interface Profile {
  id: string
  display_name: string | null
  gpa: number | null
  gpa_weighted: number | null
  sat: number | null
  act_score: number | null
  proposed_major: string | null
  home_state: string | null
  grad_year: number | null
  desired_climate: string | null
  school_size_pref: string | null
  school_type_pref: string | null
  distance_pref: string | null
  extracurriculars: string | null
  career_interests: string | null
  onboarding_complete: boolean
  walkthrough_complete: boolean
  created_at: string
  updated_at: string
}

export interface UserCollege {
  id: string
  user_id: string
  college_name: string
  college_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  category: TaskCategory
  due_date: string | null
  calendar_event_id: string | null
  sort_order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  user_id: string
  milestone_key: string
  reached_at: string
  notes: string | null
}

export interface Scholarship {
  id: string
  user_id: string
  name: string
  amount: number | null
  deadline: string | null
  essay_required: boolean
  difficulty: ScholarshipDifficulty
  stage: ScholarshipStage
  url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  tier: SubscriptionTier
  status: SubscriptionStatus | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  trial_end: string | null
  billing_interval: BillingInterval | null
  created_at: string
  updated_at: string
}

export interface EmailPreferences {
  user_id: string
  weekly_nudge: boolean
  unsubscribe_token: string
  last_nudge_sent: string | null
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referral_code: string
  created_at: string
}

export interface ReferralCompletion {
  id: string
  referral_code: string
  referrer_id: string
  referred_id: string
  referrer_bonus_applied: boolean
  referred_bonus_applied: boolean
  created_at: string
}

export interface DailyActivity {
  id: string
  user_id: string
  activity_date: string
  created_at: string
}

export type XpAction =
  | 'complete_task'
  | 'mark_milestone'
  | 'generate_strategy'
  | 'essay_brainstorm'
  | 'essay_critique'
  | 'add_scholarship'
  | 'add_college'
  | 'refer_friend'

export interface XpEvent {
  id: string
  user_id: string
  action: XpAction
  xp: number
  ref_id: string | null
  created_at: string
}

// Required for Supabase typed client — minimal inline version
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      user_colleges: { Row: UserCollege; Insert: Partial<UserCollege>; Update: Partial<UserCollege> }
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> }
      progress: { Row: Milestone; Insert: Partial<Milestone>; Update: Partial<Milestone> }
      scholarships: { Row: Scholarship; Insert: Partial<Scholarship>; Update: Partial<Scholarship> }
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> }
      email_preferences: { Row: EmailPreferences; Insert: Partial<EmailPreferences>; Update: Partial<EmailPreferences> }
      referrals: { Row: Referral; Insert: Partial<Referral>; Update: Partial<Referral> }
      referral_completions: { Row: ReferralCompletion; Insert: Partial<ReferralCompletion>; Update: Partial<ReferralCompletion> }
      daily_activity: { Row: DailyActivity; Insert: Partial<DailyActivity>; Update: Partial<DailyActivity> }
      xp_ledger: { Row: XpEvent; Insert: Partial<XpEvent>; Update: Partial<XpEvent> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
