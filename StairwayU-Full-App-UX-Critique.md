# StairwayU — Full-App UX Critique & Redesign Recommendations

**Date:** April 11, 2026  
**Reviewer:** Claude (Design Critique Agent)  
**Stage:** Post-MVP refinement — the app works; now it needs to breathe.  
**Scope:** All 12 page-level components, sidebar, global CSS, onboarding, landing page  

---

## Executive Summary

StairwayU has an impressive feature set — admission chancing, financial planning, essay coaching, scholarship discovery, milestone tracking, and more — all grounded in real federal data. The problem isn't what the app *does*; it's that every feature competes for attention simultaneously. The result is a dense, icon-heavy interface that reads more like an admin dashboard than a consumer product for anxious 17-year-olds and their parents.

**The single biggest opportunity:** Reduce visible complexity by 40–50% through progressive disclosure, information hierarchy, and a unified visual language. The app currently shows everything at once on every page. A phased redesign focused on "less visible, more discoverable" would dramatically improve first impressions, task completion, and retention.

---

## 1. First Impression (2-Second Test)

### What draws the eye first
Across every page, the eye is pulled to **emoji icons, badge pills, and dense stat grids** — not to the primary action or content. The sidebar alone has 11 nav items with emoji prefixes, PRO badges, an XP level badge, AI call counter, referral CTA, and a sign-out button. That's 6+ distinct information types in a 220px column.

### Emotional reaction
**Overwhelming.** A prospective user (or parent) landing on the dashboard sees: a mode toggle, readiness score ring, admission snapshot cards, daily challenges, EC score, quick actions, share-with-family CTA, pledge system, referral toasts, and a welcome tour. It feels like opening a cockpit, not a guide.

### Is the purpose immediately clear?
No. The landing page communicates value well ("Replace 5 tabs with 1 dashboard"), but once inside, the app doesn't guide users toward a workflow. There's no clear "start here" moment after onboarding completes.

---

## 2. Usability — Page-by-Page Findings

### 2.1 Sidebar (Sidebar.tsx — 406 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| 11 nav items + admin link — exceeds 7±2 cognitive limit | 🔴 Critical | Group into 3–4 sections: Discover (Explore, Score Bands, Find Major), Apply (Essays, Strategy, Compare), Plan (Finance, Scholarships, Journey), You (Profile, Snapshot). Use collapsible groups. |
| Emoji icons lack semantic consistency (⊞, 🗺️, ⚡, 🎚️, 📊, ⚖️, 🧭, ✍️, 🏆, 💵, 👤) | 🟡 Moderate | Replace with a monochrome icon set (Lucide, Phosphor). Emojis render differently per OS and clash with the app's card-based design. |
| Footer stacks 5 distinct widgets (referral CTA, Pro badge, AI counter, XP level bar, user info) | 🔴 Critical | Keep only: user info + sign out. Move XP/AI counters to profile page. Move upgrade CTA to a subtle banner or settings page. |
| PRO badges on 4 of 11 items create "locked" anxiety | 🟡 Moderate | Instead of inline PRO pills, use a single "Unlock all features" card at the bottom. Reduce visual noise in the nav itself. |
| Student/Mom mode reorders nav silently | 🟢 Minor | Add a visible indicator of which mode is active. Consider showing the toggle in sidebar header, not on the dashboard. |

### 2.2 Dashboard (DashboardClient.tsx — dense, multi-widget)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Readiness score, admission snapshot, daily challenges, EC score, quick actions, share CTA, pledge, referral, tour — all above the fold | 🔴 Critical | Reduce to 3 widgets max above fold: (1) Admission Snapshot, (2) Up Next task, (3) Quick Stats strip. Move challenges, pledges, referrals to profile/settings. |
| "Daily Challenges" is gamification that doesn't map to real admissions outcomes | 🟡 Moderate | Replace with "Your Next Steps" — actionable tasks pulled from the Journey milestone system. |
| Referral toasts and pledge system compete with core content | 🟡 Moderate | Move to profile page. These are retention mechanics, not primary user flows. |
| Welcome tour triggered on first load adds more cognitive load to an already dense page | 🟢 Minor | Simplify to a 3-step tour: "Here's your snapshot → Explore schools → Track your journey." |

### 2.3 Explore Schools (ExplorePlayground.tsx — 495 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| School cards show 5 stats (Admit, Avg SAT, Net Cost, Grad Rate, Earnings) + SAT range + match ring + tier badge + save button — very dense | 🔴 Critical | Show 2–3 key stats on card face (match %, net cost, one differentiator). Expand to full stats on click/hover. |
| Controls panel (320px sticky sidebar) takes ~30% of viewport | 🟡 Moderate | Collapse to a horizontal filter bar on desktop. Use the full width for results. |
| "Surprise Me" button is fun but lacks explanation of what changed | 🟢 Minor | After randomization, show a toast: "Showing schools in [Region] for SAT ~[X]" |
| XP recording on every slider interaction is invisible to the user | 🟢 Minor | Either show XP gain ("+ 5 XP") or remove the tracking. Invisible gamification builds no engagement. |

### 2.4 Score Bands (ScoreBandBrowser.tsx — 464 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| 8 sort options displayed as horizontal pill buttons — wraps on most viewports | 🟡 Moderate | Use a single dropdown: "Sort by: [Match Score ▾]". Reserve pills for 3–4 primary sorts. |
| Schools grouped by region within each tier — 2 levels of nesting | 🟡 Moderate | Default to flat list within tier. Add region as an optional filter, not a forced grouping. |
| Empty state when no test scores says "Add your test scores first" with a link — good | 🟢 Minor | This is well handled. Keep it. |
| BandCard stats (Cost, Grad, Earnings) use 9px labels — too small | 🟡 Moderate | Minimum 11px for stat labels. Current 9px is below WCAG AA for readability. |

### 2.5 Essay Studio (EssayStudio.tsx — 574 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Two-tab structure (Brainstorm vs. Critique) is clean and focused | ✅ Works well | One of the better-designed pages. The progressive flow (setup → questions → ideas) is intuitive. |
| Critique results layout (side-by-side on desktop) creates good comparison | ✅ Works well | Sticky draft input + scrollable results is a strong pattern. |
| Score display (large number + color-coded label + summary) is effective | ✅ Works well | Good information hierarchy — score anchors, then label provides context. |
| Essay type dropdown has 8 options — manageable | 🟢 Minor | Consider adding "Not sure" as a first option that triggers a short quiz. |
| Emoji in tab buttons ("💡 Brainstorm", "🔍 Critique Draft") | 🟢 Minor | Replace with Lucide icons for consistency with recommended icon system. |

### 2.6 Scholarships (ScholarshipsPageClient.tsx — 518 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Find tab questionnaire has 11 fields (GPA, W-GPA, SAT, ACT, major, state, grad year, ECs, career, background, circumstances) — most already exist in profile | 🔴 Critical | Pre-fill from profile data (already partially done). Hide pre-filled fields under "Edit profile data" toggle. Show only the 2 new fields (background, circumstances) prominently. |
| Kanban pipeline (4 columns) on the Pipeline tab | 🟡 Moderate | Good concept, but 4 columns on mobile collapse poorly. Consider a list view with stage badges as default, Kanban as optional "Board view". |
| Scholarship cards in Find results are dense (name, org, amount, difficulty, essay badge, deadline, eligibility, why-match, 2 action buttons) | 🟡 Moderate | Reduce to: name + amount + deadline + one-line eligibility. Expand for full details + why-match on click. |
| "Let's find you some free money 💰" empty state is motivating | ✅ Works well | Good tone for the audience. |

### 2.7 Financial Planner (FinancialPlanner.tsx — 711 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Input panel has 7 fields + college selector + cost breakdown + saved college chips — very dense for a 340px column | 🔴 Critical | Split into 2 steps: (1) Pick your school → auto-fills cost. (2) Enter your savings & aid. The "what-if" sliders should be a third expandable section. |
| Cost breakdown box (tuition + living + total + in-state/OOS badge) is excellent | ✅ Works well | This is the most valuable information on the page. Make it more prominent — it currently lives inside a nested card within the input panel. |
| What-if scenario sliders allow powerful exploration | ✅ Works well | Good progressive disclosure pattern. Consider showing delta more visually (e.g., bar chart showing base vs. what-if). |
| "State of residence: not set" warning uses orange text inline — easy to miss | 🟡 Moderate | Make this a dismissible alert banner at the top of the page. |

### 2.8 Profile (ProfilePageClient.tsx — 721 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Page mixes 6 concerns: academic info, achievements, schools, email prefs, referrals, account deletion | 🔴 Critical | Split into tabbed sections or an accordion: Academic Profile, My Schools, Settings (notifications, referrals, account). |
| Achievements grid (earned + locked badges) is fun but takes significant vertical space | 🟡 Moderate | Collapse to a summary line ("5 of 12 unlocked") with expand. The current grid of 12+ badges pushes schools below the fold. |
| Referral system (code generation, link sharing, count) is complex for a profile page | 🟡 Moderate | Move to a dedicated "Refer a Friend" modal or standalone page. |
| Auto-save with 800ms debounce is good UX | ✅ Works well | The "Saved ✓" toast feedback is subtle and appropriate. |
| EC Picker (tiered activities T1–T4 with point values) | 🟡 Moderate | The tier system is powerful but the right sidebar guide explaining T1–T4 may confuse users. Add inline tooltip per tier instead. |

### 2.9 Journey (JourneyClient.tsx — 338 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| 10-milestone vertical list with phase colors + segmented ring + phase bars + "Up Next" card | 🟡 Moderate | This is well-structured but the right panel (ring + bars + next card) has 3 separate visualization widgets that say the same thing. Consolidate to: ring + "Up Next" card. Remove phase breakdown bars — they're redundant with the ring legend. |
| Task list below milestones ("Track every step") is valuable | ✅ Works well | Good that this lives on Journey, not the dashboard. |
| Phase unlock overlay animation (confetti/celebration) | ✅ Works well | Appropriate reward moment. Keep it. |
| Milestone toggle is click-to-mark and click-to-unmark — same button, no confirmation | 🟢 Minor | Add a brief "undo" toast instead of instant toggle. Accidental un-marking loses progress. |

### 2.10 Landing Page (LandingPage.tsx — 725 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Seasonal urgency banner + hero + parent section + gift registry + replace-5-tabs + feature grid + journey hero + connected data + testimonials + pricing + partner CTA + final CTA + footer — 12+ sections | 🔴 Critical | Too many sections. Cut to: Hero with CTA, 3–4 feature highlights, social proof (stats or testimonials), pricing, final CTA. Current page likely has 3000+ words of marketing copy. |
| Two pricing tiers (Free vs. Pro) with monthly/annual toggle | ✅ Works well | Clean pricing presentation. The 34% annual discount is well-highlighted. |
| "College Gift Registry" concept is unique but adds another section to an already long page | 🟡 Moderate | Consider moving to a sub-page or feature detail page. |
| Stats section ("3,000+ Colleges", "74% Discover new schools", "$0 to start") | ✅ Works well | Good trust-building. Keep above the fold or near hero. |

### 2.11 Onboarding (OnboardingClient.tsx — 638 lines)

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| 4-step wizard (About, Academics, Preferences, Target Schools) is well-paced | ✅ Works well | Good step count. Each step has a clear purpose. |
| Multi-select logic with "Any" overriding other selections is smart | ✅ Works well | Prevents conflicting selections. |
| Step 2 (Academics) asks for GPA, SAT, ACT, major, ECs, career interests — potentially overwhelming | 🟡 Moderate | Make SAT/ACT and career interests optional in this step. Say "You can add these later on your profile." Reduce friction to dashboard. |
| Target Schools step limits free users to 4 with a Pro upsell | 🟢 Minor | Fair gate. Consider showing the limit after they add 3 ("1 more on free tier — or upgrade for unlimited"). |

---

## 3. Visual Hierarchy

### What draws the eye first (across the app)
**Emoji icons and colored badges** — not headings, not primary actions, not content. Every page title has an emoji suffix ("Essay Studio ✍️", "Scholarships 🏆", "College Cost 💵", "Your Journey 🗺️"). Every sidebar item has an emoji prefix. Cards have colored tier badges, difficulty pills, stage indicators, and PRO labels.

### Reading flow
The eye bounces between competing elements rather than flowing top-to-bottom or left-to-right. On a typical page:
1. Eye hits the emoji in the page title
2. Jumps to colored badges/pills in cards
3. Bounces to sidebar PRO badges and XP level
4. Finally settles on actual content

### Emphasis problems
- **Over-emphasized:** Gamification (XP, levels, challenges, achievements), monetization (PRO badges, upgrade CTAs, referral links), decorative elements (emoji, colored badges)
- **Under-emphasized:** Primary actions ("Save this school", "Start your essay", "Run financial plan"), data insights ("You match 47 schools", "Your gap is $23k"), navigation wayfinding

### Whitespace
Consistently insufficient. Cards are padded at 14–20px internally, but gaps between cards are only 8–14px. The sidebar is 220px on desktop with 2px gaps between nav items. Content areas max at 900–1200px but fill every pixel with widgets.

---

## 4. Consistency

### Color system
| Role | Light | Dark | Issue |
|------|-------|------|-------|
| Primary | `#2563EB` (blue) | `#5EEAD4` (teal) | Primary completely changes hue between themes — blue → teal. Unusual. |
| Success | `#22C55E` | `#86EFAC` | Used for: tier badges, saved confirmations, difficulty "Easy", scholarship "Won", stretch mode. Overloaded. |
| Warning | `#F59E0B` | `#FDE68A` | Used for: deadline warnings, difficulty "Medium", essay improvements, Apply phase. Overloaded. |
| Danger | `#EF4444` | `#FCA5A5` | Used for: errors, difficulty "Hard", delete buttons. Acceptable. |
| Additional accents | Cyan (`#0891b2`), Violet (`#6366f1`, `#a855f7`), Amber (`#d97706`) | Various | Used ad-hoc for opening/closing feedback, PRO badges, level colors. No system. |

**Core issue:** 4+ accent colors are used without semantic mapping. Green means "good" in tier badges but "easy" in scholarship difficulty. Amber means "warning" in some contexts but "Apply phase" in Journey. There's no color → meaning system documented or enforced.

### Typography
- Page titles: 26px/800 weight — consistent across all pages ✅
- Section headers: 16px/700 — consistent ✅
- Body text: 12–14px — varies by page (13px on Explore, 12px on Essays, 14px on Scholarships)
- Stat labels: **9–11px** — too small in several places (BandCard stats at 9px, MiniStat labels at 9px)
- Label style: 11px/700/uppercase/tracking — used consistently via `labelStyle` objects ✅

### Spacing
- Card padding varies: 14px (ExploreCard), 18px (ScholarshipCard), 20px (JourneyCard), 24px (EssayCard), 28px (ProfileCard)
- Grid gaps vary: 8px, 10px, 12px, 14px, 16px, 24px — no spacing scale
- No consistent spacing tokens used — all hardcoded in inline styles

### Inline styles vs. CSS classes
The codebase is almost entirely **inline styles** with a few CSS classes in globals.css for layout concerns. This makes the design system nearly impossible to maintain or audit. A component like `ExploreCard` has 20+ inline style objects.

---

## 5. Accessibility

| Issue | Severity | Location |
|-------|----------|----------|
| Skip-nav link exists in globals.css | ✅ Good | Properly hidden until focused |
| Stat labels at 9px (`MiniStat`, `BandCard`) are below WCAG AA minimum (12px or 9.6pt for body text) | 🔴 Critical | ExplorePlayground, ScoreBandBrowser |
| Color contrast of muted text (`#64748B` on `#F8FAFC`) = 4.58:1 — barely passes AA for large text, fails for small text at 9–11px | 🟡 Moderate | Global — affects all muted labels |
| Match ring SVGs lack `aria-label` or `role="img"` | 🟡 Moderate | ExplorePlayground, ScoreBandBrowser |
| Native `<input type="range">` sliders have no visible value label for screen readers | 🟡 Moderate | ExplorePlayground (SAT/GPA sliders) |
| Touch targets for tier toggle buttons, save buttons, and sort pills meet 44px minimum | ✅ Good | Buttons are generally well-sized |
| Dark mode colors are well-desaturated for readability | ✅ Good | The warm dark palette is thoughtful |
| Emoji used as icons are not accessible to screen readers | 🟡 Moderate | All page titles, sidebar, milestone icons |
| Kanban cards (scholarships) have no keyboard drag-and-drop | 🟢 Minor | Click-to-edit works, but no stage-change keyboard shortcut |

---

## 6. What Works Well

1. **Data foundation is excellent.** Real College Scorecard data, admission chance calculations, in-state vs. OOS tuition detection, and reciprocity programs. This is a genuinely useful product.

2. **Essay Studio is the best-designed page.** Clean two-tab structure, progressive flow (setup → questions → ideas), side-by-side critique layout. It should be the design template for other pages.

3. **Financial Planner depth is impressive.** 529 projections, compound growth, year-by-year breakdown, what-if scenarios, and automatic tuition lookup. The cost breakdown card is the single most valuable widget in the app.

4. **Dark mode is well-executed.** Warm grays (not cold blue-blacks), desaturated semantic colors, proper `color-mix()` usage for overlays. This is ahead of most apps at this stage.

5. **Onboarding wizard is well-paced.** 4 steps, clear purpose per step, smart multi-select logic. The weakest step is Academics (too many fields), but the structure is sound.

6. **Mobile responsiveness is handled.** The CSS has thorough `@media (max-width: 768px)` rules: sidebar becomes a drawer, grids collapse to single column, forms get collapsible toggles. This isn't an afterthought.

7. **Journey milestone system is motivating.** Phase-colored progress ring, vertical timeline with toggle, "Up Next" card. The celebration overlay on phase completion is a good reward moment.

---

## 7. Priority Recommendations

### P0 — Do These First (High Impact, Moderate Effort)

**1. Implement progressive disclosure across all pages.**
Every page currently shows all information at once. Apply the "2-stat card face / expand for detail" pattern:
- **Explore cards:** Match %, net cost, school name/location on face. Click to expand for SAT range, grad rate, earnings, enrollment.
- **Scholarship cards:** Name, amount, deadline on face. Click for eligibility, why-match, org details.
- **Dashboard:** 3 widgets above fold (Snapshot, Next Task, Quick Stats). Everything else in expandable sections below.

**2. Redesign the sidebar into grouped navigation.**
Replace the flat 11-item list with 3–4 collapsible groups:
```
DISCOVER
  Explore Schools
  Score Bands
  Find Your Major

APPLY
  Essay Studio
  Strategy
  Compare Schools

PLAN
  Financial Planner
  Scholarships
  Journey Tracker

──────
Profile & Settings
```
Remove emoji icons → use a monochrome icon set. Remove XP, AI counter, and referral CTA from sidebar footer.

**3. Establish a semantic color system.**
Define and enforce 5 roles:
- **Brand/Interactive:** Blue (light) / Teal (dark) — links, primary buttons, active states
- **Positive:** Green — saved confirmations, safety tier, "Won" stage, completion states
- **Caution:** Amber — approaching deadlines, target tier, moderate difficulty
- **Negative:** Red — reach tier, errors, hard difficulty, destructive actions
- **Neutral:** Slate — disabled, muted, secondary information

Document this in a `DESIGN_TOKENS.md` and enforce via CSS custom properties.

### P1 — Do These Next (High Impact, Higher Effort)

**4. Extract inline styles into a component token system.**
The entire codebase uses inline `style={{}}` objects. Migrate to:
- CSS custom properties for spacing scale: `--space-1: 4px` through `--space-8: 32px`
- Tailwind utility classes for common patterns (already available via the config)
- Shared component style objects for repeated patterns (card, badge, stat-label)

**5. Reduce the landing page by 40%.**
Cut from 12+ sections to 6:
1. Hero with seasonal urgency + CTA
2. "Replace 5 tabs" comparison (strongest value prop)
3. Feature highlights (4 cards)
4. Social proof (stats strip)
5. Pricing (Free vs. Pro)
6. Final CTA + footer

Remove: Gift Registry section, Connected Data explanation, Journey Tracker hero, Partner CTA. These can live on sub-pages.

**6. Simplify the Profile page.**
Split into tabs:
- **Academic Profile** (current form + EC picker)
- **My Schools** (college list)
- **Settings** (notifications, subscription, referrals, delete account)

Move Achievements to Journey page (natural home for progress tracking).

### P2 — Polish (Lower Impact, Quick Wins)

**7. Replace all emoji icons with a consistent icon library.**
Use Lucide React (already available in the ecosystem). Map each emoji to a semantic icon:
- ⊞ → `LayoutDashboard`, 🗺️ → `Map`, ⚡ → `Zap`, 🎚️ → `SlidersHorizontal`
- ✍️ → `PenTool`, 🏆 → `Trophy`, 💵 → `DollarSign`, 👤 → `User`

**8. Enforce minimum text sizes.**
Set a floor of 11px for all visible text. Current 9px stat labels in MiniStat and BandCard fail readability standards.

**9. Add `aria-label` to all SVG visualizations.**
Match rings, progress rings, and phase segments need screen reader descriptions:
```jsx
<svg aria-label="47% admission chance" role="img">
```

**10. Unify card padding to a 3-step scale.**
- Compact: 16px (school cards, pipeline cards)
- Standard: 24px (form sections, content cards)
- Spacious: 32px (hero cards, empty states)

---

## Appendix: File-Level Complexity Audit

| File | Lines | Inline Style Objects (est.) | Severity |
|------|-------|-----------------------------|----------|
| LandingPage.tsx | 725 | 50+ | High — longest file, most marketing copy |
| ProfilePageClient.tsx | 721 | 40+ | High — 6 concerns in one page |
| FinancialPlanner.tsx | 711 | 45+ | High — complex calculations mixed with UI |
| OnboardingClient.tsx | 638 | 35+ | Moderate — well-structured wizard |
| EssayStudio.tsx | 574 | 30+ | Low — cleanest design |
| ScholarshipsPageClient.tsx | 518 | 35+ | Moderate — two distinct features in tabs |
| ExplorePlayground.tsx | 495 | 25+ | Moderate — card density is the issue |
| ScoreBandBrowser.tsx | 464 | 25+ | Moderate — nested tier/region grouping |
| Sidebar.tsx | 406 | 30+ | High — footer widget density |
| JourneyClient.tsx | 338 | 20+ | Low — well-structured |
| globals.css | 772 | N/A | Moderate — solid responsive rules, but no spacing/color tokens |

---

## Summary: The One-Sentence Redesign Thesis

> **StairwayU has a $50k feature set displayed in a $5k UI — the redesign isn't about adding anything, it's about revealing less at each moment so users can actually use what's already there.**
