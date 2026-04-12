# StairwayU — CLAUDE.md

## What This Is
College planning app for high school students. Helps them explore schools, compare options, estimate admission chances, find scholarships, get essay help, and build a college strategy. Live at stairwayu.com.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Database:** Supabase (PostgreSQL) with RLS policies
- **Auth:** Supabase Auth (cookie-based via `@supabase/ssr`)
- **Payments:** Stripe (monthly/annual subscriptions, credit system)
- **AI:** Google Gemini (`@google/generative-ai`) for essays and strategy
- **External Data:** College Scorecard API (US Dept of Education)
- **Rate Limiting:** Upstash Redis
- **State Management:** React Query (`@tanstack/react-query`)
- **Path alias:** `@/*` → `./src/*`

## Project Structure
```
src/
  app/           # Next.js App Router — pages and API routes
    api/         # 23 API routes (colleges, essays, stripe, strategy, etc.)
  components/    # React components (dashboard/, ui/)
  hooks/         # Custom React hooks (useUserColleges, useXp, etc.)
  lib/           # Utilities and services
    services/    # collegeScorecard.ts, admissionChance.ts, programStrength.ts
    supabase/    # server.ts (createClient, getAuthUser), client.ts
    majorCipMap.ts   # Maps major names → CIP 4-digit codes
    validations.ts   # Zod schemas for all API routes
    tierConfig.ts    # Admission tier labels/colors
  data/          # Static data files
supabase/
  migrations/    # 32 migration files (001–032)
  functions/     # Edge functions (weekly-nudge)
```

## Key Data Concepts

### College Scorecard API
- **Base URL:** `https://api.data.gov/ed/collegescorecard/v1/schools.json`
- **API Key:** `COLLEGE_SCORECARD_API_KEY` env var
- **RICH_FIELDS** (in `collegeScorecard.ts`): defines all fields pulled per school
- **`mapRichResult()`**: transforms raw Scorecard response → clean JS object
- **Program-level data:** `latest.programs.cip_4_digit` — completions, earnings by major
- **CIP codes:** 4-digit Classification of Instructional Programs (e.g., '1101' = CS)

### Cost Fields (important — common source of bugs)
- `costOfAttendance` → `latest.cost.attendance.academic_year` — **in-state** sticker price (tuition + fees + R&B + books)
- `avgNetPrice` → `latest.cost.avg_net_price.public/private` — average cost **after grants** (includes R&B)
- `tuitionInState` / `tuitionOutOfState` → sticker tuition only, no R&B
- For public schools, out-of-state cost = `costOfAttendance + (tuitionOutOfState - tuitionInState)`
- The `lookupByName()` function uses `RICH_FIELDS` for its field list (not a hardcoded string)

### Database (Supabase)
- **`home_state`** column: `char(2)` — stores 2-letter state abbreviations ("TX", "CA") matching Scorecard's `school.state` format
- Profiles table has: gpa, gpa_weighted, sat, act_score, home_state, proposed_major
- RLS policies on all tables — use `createServiceClient()` to bypass when needed

### Program Strength Score
- Composite 0–100 score in `src/lib/services/programStrength.ts`
- Percentile-ranks schools within the result set on 6 factors (grad rate, retention, selectivity, program share, program earnings, school earnings)
- When no major selected, drops to 4 school-level factors with redistributed weights
- Used as default sort on Explore page when a major is selected

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

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check without emitting
```

## Known Issues & Workarounds

### Bash Mount Truncation (Cowork/Claude sessions only)
Files written via the Edit/Write tools sometimes appear truncated when read from the bash sandbox. Symptoms:
- `tsc` reports `'}' expected` errors at the end of files
- `tail` shows the file cut off mid-line or ending in null bytes (`\x00`)
- The Read tool shows the correct full content

**Fix:** Use Python in bash to read the file, strip trailing null bytes, and append the missing closing lines:
```python
with open('path/to/file.ts', 'rb') as f:
    content = f.read()
clean = content.rstrip(b'\x00')
# Check if it ends properly, append missing tail if needed
with open('path/to/file.ts', 'wb') as f:
    f.write(clean)
```

For large files (ExplorePlayground.tsx is ~530 lines), you may need to write the entire file from Python using heredocs or base64 encoding.

### Git Index Lock
The sandbox cannot remove `.git/index.lock` due to permissions. If git commands fail with "index.lock exists", the user must run `rm -f .git/index.lock` locally.

### PowerShell Commit Messages
Multi-line or special-character commit messages fail in PowerShell. Keep commits to single-line, simple strings:
```powershell
git commit -m "feat: short description here"
```

## Code Patterns

### API Route Pattern
```typescript
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Parse params with Zod schema from validations.ts
  const parsed = parseBody(exploreSchema, rawParams)
  if ('error' in parsed) return parsed.error
  // ... business logic
}
```

### Scorecard Data Flow (Explore page)
1. `ExplorePlayground.tsx` sends request to `/api/colleges/explore`
2. `route.ts` builds Scorecard API query using `RICH_FIELDS` + optional `latest.programs.cip_4_digit`
3. Results mapped through `mapRichResult()`, program data extracted inline
4. `scoreProgramStrength()` adds composite scores
5. Client-side: `estimatedCost()` adjusts for in-state/out-of-state, budget filter applied, admission chances calculated
