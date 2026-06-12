# StairwayU — Full Project Context

You are working on **StairwayU**, a college planning web app for high school students. It's live at stairwayu.com. The app helps students explore schools, compare options, estimate admission chances, find scholarships, get AI essay coaching, and build a college strategy.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion for animations
- **Database:** Supabase (PostgreSQL) with Row-Level Security on all tables
- **Auth:** Supabase Auth (cookie-based SSR via `@supabase/ssr`)
- **Payments:** Stripe (monthly $9.99 / annual subscriptions, 7-day free trial)
- **AI:** Google Gemini 2.5 Flash (`@google/generative-ai`) for essays and strategy
- **External Data:** College Scorecard API (US Dept of Education)
- **Rate Limiting:** Upstash Redis (per-user/IP, 3/day free tier for AI features)
- **State Management:** React Query (`@tanstack/react-query`)
- **Path alias:** `@/*` → `./src/*`

---

## Project Structure

```
src/
  app/                    # Next.js App Router
    (dashboard)/          # Route group — all dashboard pages (explore, strategy, essays, etc.)
    api/                  # 23 API routes
      colleges/           # explore, compare, chances, search, suggest
      essays/             # brainstorm, critique
      strategy/generate/
      scholarships/find/
      stripe/             # checkout, webhook, portal
      referral/           # code, fulfill
      auth/callback/
      cron/ingest-colleges/
      admin/, credits/, redeem/, share/, pledge/, account/delete/
  components/
    dashboard/            # Main feature components (ExplorePlayground, StrategyPageClient, EssayStudio, etc.)
    colleges/             # Public college pages (ChancesCalculator, CollegeHeader)
    ui/                   # Shared UI (button, Tooltip)
    onboarding/           # OnboardingClient
  hooks/                  # 14 custom hooks (useUserColleges, useXp, useSubscription, useProfile, etc.)
  lib/
    services/             # Core business logic
      collegeScorecard.ts   # Scorecard API integration (mapRichResult, lookupByName, getProgramStats)
      admissionChance.ts    # Logistic admission probability model
      programStrength.ts    # Composite 0-100 program quality score
    supabase/
      server.ts             # createClient, getAuthUser (cached), createServiceClient (bypass RLS)
      client.ts             # Browser client
    majorCipMap.ts          # 75 major names → CIP 4-digit codes
    validations.ts          # Zod schemas for all API routes
    tierConfig.ts           # Admission tiers (Reach/Target/Safety), region labels
  data/                   # Static data files
supabase/
  migrations/             # 32 SQL migration files (001-032)
  functions/              # Edge functions (weekly-nudge via Resend)
```

---

## Database Schema (Supabase/PostgreSQL)

### Key Tables

**profiles** (pk: id → auth.users, auto-created on signup)
- `id` uuid, `display_name` text, `gpa` numeric(3,2), `gpa_weighted` numeric(3,2)
- `sat` int, `act_score` int, `proposed_major` text
- `home_state` char(2) — **2-letter abbreviation** ("TX", "CA") matching College Scorecard's `school.state`
- `onboarding_complete` bool, `grad_year` int
- `desired_climate`, `school_size_pref`, `school_type_pref`, `distance_pref` text
- `extracurriculars`, `career_interests` text
- `ec_entries` jsonb — structured extracurricular activities with tiers
- `strategy_result` jsonb, `strategy_generated_at` timestamptz

**user_colleges** (normalized junction table, replaced old school1-9 columns)
- `id` uuid pk, `user_id` fk, `college_name` text, `college_id` text
- `sort_order` int, unique on (user_id, college_name)
- Free tier limited to 4 colleges (enforced by DB trigger)

**subscriptions** (one per user)
- `tier` enum: free/pro
- `status` enum: active/trialing/past_due/canceled/paused
- `stripe_customer_id`, `stripe_subscription_id`, `billing_interval`
- `trial_end`, `current_period_end`, `cancel_at_period_end`

**xp_ledger** — action-based XP tracking with dedup on (user_id, action, ref_id)
**tasks** — user todo items with status/category/due_date
**progress** — milestone tracking (unique user_id + milestone_key)
**scholarships** — user-tracked scholarships with stage pipeline
**ai_usage** — AI feature usage logging
**stripe_webhook_events** — idempotency table for webhook dedup

### RLS Pattern
All tables enforce `auth.uid() = user_id`. Use `createServiceClient()` to bypass RLS for backend operations.

---

## College Scorecard API

The primary external data source. Returns data from the US Department of Education.

**Base URL:** `https://api.data.gov/ed/collegescorecard/v1/schools.json`

### Fields We Pull (RICH_FIELDS)
- School: name, city, state, type (1=public, 2=private nonprofit, 3=for-profit), locale, region_id
- Admissions: admission_rate, SAT avg/25th/75th, ACT midpoint
- Cost: tuition in-state/out-of-state, avg_net_price (public/private), net_price by 5 income brackets, cost.attendance.academic_year (total sticker price)
- Students: enrollment size, retention rate (4yr full-time)
- Completion: graduation rate (4yr and overall)
- Earnings: median at 6yr and 10yr post-entry
- Programs (when major selected): `latest.programs.cip_4_digit` — completions, 1yr/4yr earnings per CIP code

### Cost Fields (Critical — Common Bug Source)
- `costOfAttendance` → `latest.cost.attendance.academic_year` — **in-state** sticker price (tuition + fees + R&B + books)
- `avgNetPrice` → `latest.cost.avg_net_price.public/private` — average cost **after grants** (includes R&B, misleadingly low)
- `tuitionInState` / `tuitionOutOfState` → sticker tuition only, no R&B
- **Out-of-state total cost** = `costOfAttendance + (tuitionOutOfState - tuitionInState)`
- Budget filter on Explore page defaults to out-of-state cost unless student's `home_state` matches school's `state`

### CIP Codes
4-digit Classification of Instructional Programs. Mapped in `majorCipMap.ts` (75 majors). Example: Computer Science = ['1101', '1107']. `getCipCodes()` does exact + fuzzy fallback matching.

### mapRichResult()
Transforms raw Scorecard API response into a clean JS object with normalized field names. All percentages (admission rate, grad rate, retention) are pre-multiplied by 100 (stored as 0-100, not 0-1).

### lookupByName()
Has a 70+ entry nickname expansion map (e.g., "UT" → "University of Texas at Austin", "UCLA" → "University of California-Los Angeles"). Uses RICH_FIELDS for its field list.

---

## Core Services

### Admission Chance Calculator (`admissionChance.ts`)
Logistic model producing 0-100 probability per school.
- **Inputs:** SAT (or ACT converted via concordance table), GPA (weighted normalized to 4.0 scale), extracurriculars (4-tier system), school stats
- **Factors:** SAT percentile position vs school's 25th-75th range, GPA strength, school admission rate as baseline, EC score (0-15 points from up to 5 activities)
- **Output:** Rounded to nearest 5% + array of Insight objects (factor, sentiment, message, impact)
- **Tiers:** Safety (65%+), Target (35-65%), Reach (<35%)

### Program Strength Score (`programStrength.ts`)
Composite 0-100 score using percentile ranking within result set.
- **With major (6 factors):** Grad rate 20%, retention 10%, selectivity 15%, program share 25%, program earnings 20%, school earnings 10%
- **Without major (4 factors):** Grad rate 36%, retention 18%, selectivity 27%, school earnings 19%
- Requires min 2 factors with data. Missing factors are skipped and remaining weights renormalized.
- All scoring is relative to the current search context (not absolute benchmarks).

### College Scorecard Service (`collegeScorecard.ts`)
Functions: `searchColleges()` (lightweight), `getCollege()` (full profile by ID), `lookupByName()` (name→profile with nickname expansion), `batchLookup()` (parallel), `getProgramStats()` (program-level data for CIP codes)

---

## Key User Flows

### Explore Page
1. Server component fetches user profile + saved colleges from Supabase
2. `ExplorePlayground.tsx` renders interactive controls: SAT slider, GPA slider, budget input, major dropdown, region checkboxes, Stretch Mode toggle
3. Client calls `/api/colleges/explore` with filters → **local-first:** queries the `colleges` table (+ `college_programs` inner join when a major is selected), falling back to the live Scorecard API + `mapRichResult()` if local data is unusable → `scoreProgramStrength()` → sorted results
4. Client-side: `estimatedCost()` adjusts for in-state/out-of-state, budget filter applied, `calculateChance()` computes admission probability per school
5. Local data refreshed monthly by `.github/workflows/ingest-colleges.yml` running `scripts/ingest-colleges.mjs` (replaced the Vercel cron; no 5-min ceiling)
5. Cards show: Total Cost, Admit %, Grads/yr, Major $1yr, Strength score, admission chance ring

### Strategy Page
1. User inputs stats (GPA, SAT/ACT, major, budget, climate preferences)
2. `/api/strategy/generate` calls Gemini AI with structured prompt + user profile
3. Returns categorized school lists (Reach/Target/Safety) with rationale
4. Rate limited: 3/day free, unlimited Pro

### Essay Studio
1. Two modes: Brainstorm (generates discussion questions → essay prompts) and Critique (feedback on drafts)
2. Uses Gemini 2.5 Flash with sanitized inputs (injection defense)
3. Rate limited same as strategy

---

## Monetization & Subscription

- **Free tier:** 4 colleges, 3 AI uses/day (strategy + essays)
- **Pro tier:** $9.99/month or annual, 7-day free trial, unlimited colleges + AI
- Stripe checkout → webhook updates subscription status
- `useSubscription` hook checks tier client-side
- API routes check via `getAuthUser()` which returns profile + subscription data

---

## Gamification System

- **XP Ledger:** Actions earn XP (strategy=50, essay=25, add_college=10, explore=5, etc.)
- **Levels:** Thresholds at 0, 50, 150, 300, 500, 750, 1100, 1500, 2000
- **Daily Challenges:** Tracked per-day completion (explore_slider, surprise_me, save_from_explore, etc.)
- **Milestones:** One-time achievements tracked in progress table
- **Streaks:** Consecutive daily activity tracking

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_MONTHLY_PRICE_ID, STRIPE_ANNUAL_PRICE_ID
GEMINI_API_KEY
COLLEGE_SCORECARD_API_KEY
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_APP_URL
```

---

## Commands

```bash
npm run dev      # Start dev server (Next.js 16)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check without emitting
```

---

## API Route Pattern

```typescript
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const rawParams = Object.fromEntries(searchParams.entries())
  const parsed = parseBody(exploreSchema, rawParams)
  if ('error' in parsed) return parsed.error

  // ... business logic using parsed.data
  return NextResponse.json({ results })
}
```

---

## Known Issues & Workarounds

### Bash Mount Truncation (Cowork/Claude Agent Sessions Only)
Files written via Edit/Write tools sometimes appear truncated when read from the bash sandbox. Symptoms: `tsc` reports `'}' expected` errors at end of files; `tail` shows file cut off mid-line or ending in null bytes.

**The Read tool sees the correct full content.** The issue is only in the bash mount.

**Fix:** Use Python in bash to strip trailing null bytes and append missing content:
```python
with open('path/to/file.ts', 'rb') as f:
    content = f.read()
clean = content.rstrip(b'\x00')
with open('path/to/file.ts', 'wb') as f:
    f.write(clean)
```
For large files, write the entire file from Python using heredocs or base64.

### Git Index Lock
The sandbox cannot remove `.git/index.lock`. If git commands fail with "index.lock exists", provide the user with manual commands to run locally: `rm -f .git/index.lock`

### PowerShell Commit Messages
Multi-line or special-character commit messages fail in PowerShell. Always provide single-line, simple commit messages.

---

## Component Architecture Notes

- **Server Components** (page.tsx files): Fetch user data from Supabase, pass as props to client components
- **Client Components** ('use client'): Handle interactivity, call API routes, manage local state
- **Hooks:** All use React Query for caching/mutation. Key: `useUserColleges`, `useProfile`, `useSubscription`, `useXp`, `useDailyChallenges`
- **UI:** Dark theme by default (`data-theme="dark"`), Geist + Inter fonts, shadcn/ui components
- **Animations:** Framer Motion for card entrances, expandable sections, ring progress indicators

---

## Important Implementation Details

1. **home_state is char(2)** — always 2-letter abbreviations ("TX", "CA"), same format as Scorecard's `school.state`. Comparisons work directly.
2. **Admission percentages are 0-100** — mapRichResult multiplies by 100. Don't multiply again.
3. **avgNetPrice includes room & board** — it's total cost minus grants, not just tuition. But it's an average across all aid recipients, so it can be misleadingly low.
4. **costOfAttendance is in-state only** for public schools. Must add tuition differential for out-of-state.
5. **Program data availability varies** — completions available ~61-85% of schools, earnings only ~16-55%. The UI shows "N/A" for missing data.
6. **Zod validation on all API routes** — schemas in `validations.ts`, parsed via `parseBody()`.
7. **Free tier college limit enforced by DB trigger** — returns error code P0001 with "Free plan" message.
8. **XP deduplication** — `ref_id` column prevents duplicate XP awards for the same action/entity.
