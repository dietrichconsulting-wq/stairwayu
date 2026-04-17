import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology — Stairway U',
  description:
    'How StairwayU calculates admission chances, the Stairway Ranking, and cost estimates — using public federal data from the College Scorecard.',
}

export default function MethodologyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      padding: '48px 24px',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 760, width: '100%' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
          &larr; Back to Stairway U
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', marginTop: 24, marginBottom: 8 }}>
          Methodology
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 36 }}>
          Last updated: April 17, 2026 · Written for counselors, parents, and students who want to know exactly how our numbers work.
        </p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>
          <p style={{ marginBottom: 24 }}>
            StairwayU helps students explore colleges, estimate their admission odds, and plan a strategy.
            This page documents exactly how our numbers are calculated and &mdash; just as importantly &mdash; what
            they do <strong>not</strong> capture.
          </p>

          <Section title="1. Admission Chance">
            <p>
              Every school shows a rounded percentage (the &ldquo;Admit %&rdquo;) estimating how likely this
              student is to be admitted. This number is a <strong>statistical estimate</strong>, not a prediction.
            </p>

            <h3 style={subheadingStyle}>Inputs</h3>
            <ul style={listStyle}>
              <li><strong>Test score.</strong> SAT (400&ndash;1600) used directly; ACT (1&ndash;36) converted via concordance to an SAT-equivalent, then the higher of the two is used.</li>
              <li><strong>GPA.</strong> Unweighted 0.0&ndash;4.0 scale. If a weighted GPA is provided, it is normalized down to the 4.0 scale before scoring.</li>
              <li>
                <strong>Extracurriculars.</strong> Up to 5 activities, each tagged with a tier:
                <ul style={{ ...listStyle, marginTop: 6 }}>
                  <li>Tier 1 &mdash; National / rare distinction, 8 pts <em>(e.g., USAMO qualifier, YoungArts Winner, recruited D1 athlete, founder of a 501(c)(3))</em></li>
                  <li>Tier 2 &mdash; State-level or clear leadership, 5 pts <em>(e.g., state competition winner, Student Body President, all-state athlete, Editor-in-Chief)</em></li>
                  <li>Tier 3 &mdash; Active role with real contribution, 3 pts <em>(e.g., club officer, varsity team member, section leader in band, 1+ year weekly volunteer)</em></li>
                  <li>Tier 4 &mdash; Member / participant, 1 pt <em>(e.g., club member without a role, JV athlete, one-off service hours)</em></li>
                  <li>Top 5 activities counted; total capped at 15 points.</li>
                </ul>
              </li>
              <li><strong>School admission rate.</strong> Pulled from the U.S. Department of Education College Scorecard.</li>
              <li><strong>School 25th/75th SAT percentiles.</strong> Used to locate the student within the school&rsquo;s admitted range.</li>
            </ul>

            <h3 style={subheadingStyle}>Logic</h3>
            <p>A logistic model starts with the school&rsquo;s base admission rate, then adjusts:</p>
            <ul style={listStyle}>
              <li><strong>SAT position</strong> is scored by how many standard deviations above or below the school&rsquo;s midpoint the student sits. Swing: roughly &minus;30 to +25 points.</li>
              <li><strong>GPA</strong> adds between &minus;20 (below 2.7) and +12 (3.9+) points on a step function.</li>
              <li><strong>EC score</strong> adds up to ~15 points, scaled by school selectivity &mdash; ECs matter more at highly selective schools and less at open-access ones.</li>
            </ul>
            <p>
              The SAT and GPA adjustments are dampened at very selective schools (because a strong profile is
              table-stakes, not a differentiator) and amplified at less selective ones. The final chance is
              clamped between 5% and 95% and rounded to the nearest 5%.
            </p>

            <h3 style={subheadingStyle}>Tier boundaries</h3>
            <ul style={listStyle}>
              <li><strong>Safety:</strong> 65%+</li>
              <li><strong>Target:</strong> 35%&ndash;65%</li>
              <li><strong>Reach:</strong> below 35%</li>
            </ul>

            <h3 style={subheadingStyle}>What the model does NOT consider</h3>
            <p>This is the most important section. Our chance estimate <strong>does not account for</strong>:</p>
            <ul style={listStyle}>
              <li>Essays, recommendation letters, or supplemental writing</li>
              <li>Demonstrated interest, campus visits, or interview performance</li>
              <li>Legacy, first-generation, or geographic preferences</li>
              <li>Recruited athletics, arts portfolios, or other talent-based admits</li>
              <li>Early Decision or Early Action bumps</li>
              <li>Course rigor (AP/IB/honors load) beyond the GPA number</li>
              <li>Institutional priorities that shift year-to-year (yield protection, gender balance, program-specific quotas)</li>
              <li>Any holistic-review factor a human reader would weigh</li>
            </ul>
            <p>
              A strong essay can move a Reach into a Target. A weak rec can pull a Target into a Reach.
              <strong> Do not use our number as a go/no-go on applying.</strong> Use it as one data point
              among many, alongside your counselor&rsquo;s judgment.
            </p>
          </Section>

          <Section title="2. Stairway Ranking">
            <p>
              Each school in the search results gets a <strong>Stairway Ranking</strong> &mdash; a letter (A+
              through C) reflecting how strong it is for the selected major, or for overall academic quality
              when no major is selected. The Stairway Ranking is <strong>relative</strong> to the current search
              results, not an absolute benchmark. Change your filters (SAT range, region, budget) and the
              same school may earn a different letter.
            </p>

            <h3 style={subheadingStyle}>How the Stairway Ranking is calculated</h3>
            <p>
              Under the hood, each school is scored 0&ndash;100 on up to six factors, each percentile-ranked
              against the other schools in the current result set. The weighted average becomes a composite
              score, which is then mapped to a letter.
            </p>

            <h3 style={subheadingStyle}>Factors &amp; weights (with a major selected)</h3>
            <div style={{ margin: '12px 0 18px', overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={theadRowStyle}>
                    <th style={thStyle}>Factor</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Weight</th>
                    <th style={thStyle}>What It Measures</th>
                  </tr>
                </thead>
                <tbody>
                  <FactorRow name="Program Share" weight="25%" desc="Percentage of students in that major (completions ÷ enrollment). Higher share = stronger, more established program." />
                  <FactorRow name="Graduation Rate" weight="20%" desc="4-year graduation rate. Reflects institutional quality and student support." />
                  <FactorRow name="Program Earnings" weight="20%" desc="Median earnings 1 year after graduation for that specific major." />
                  <FactorRow name="Selectivity" weight="15%" desc="Inverse of admission rate. Lower acceptance rate = more selective = higher score." />
                  <FactorRow name="Retention Rate" weight="10%" desc="First-year retention rate for full-time students. A proxy for student satisfaction." />
                  <FactorRow name="School Earnings" weight="10%" desc="Median earnings 10 years after enrollment (all majors). A broad quality-of-outcome signal." />
                </tbody>
              </table>
            </div>

            <h3 style={subheadingStyle}>Factors &amp; weights (no major selected)</h3>
            <p>
              When no major is selected, program-specific factors aren&rsquo;t available. The remaining
              school-level factors are reweighted proportionally to produce a pure &ldquo;school quality&rdquo;
              ranking:
            </p>
            <div style={{ margin: '12px 0 18px', overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={theadRowStyle}>
                    <th style={thStyle}>Factor</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Weight</th>
                    <th style={thStyle}>What It Measures</th>
                  </tr>
                </thead>
                <tbody>
                  <FactorRow name="Graduation Rate" weight="36%" desc="4-year graduation rate." />
                  <FactorRow name="Selectivity" weight="27%" desc="Inverse admission rate." />
                  <FactorRow name="School Earnings" weight="19%" desc="Median earnings 10 years post-enrollment." />
                  <FactorRow name="Retention Rate" weight="18%" desc="First-year retention rate." />
                </tbody>
              </table>
            </div>
            <p>
              If a factor is missing data for a given school, it&rsquo;s dropped and remaining weights are
              renormalized. A minimum of two factors with data is required &mdash; otherwise the Stairway
              Ranking shows &ldquo;N/A.&rdquo;
            </p>

            <h3 style={subheadingStyle}>Letter-grade boundaries</h3>
            <div style={{ margin: '12px 0 18px', overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={theadRowStyle}>
                    <th style={thStyle}>Composite Score</th>
                    <th style={thStyle}>Stairway Ranking</th>
                  </tr>
                </thead>
                <tbody>
                  <GradeRow score="90–100" grade="A+" />
                  <GradeRow score="78–89" grade="A" />
                  <GradeRow score="66–77" grade="A-" />
                  <GradeRow score="54–65" grade="B+" />
                  <GradeRow score="40–53" grade="B" />
                  <GradeRow score="25–39" grade="B-" />
                  <GradeRow score="below 25" grade="C" />
                </tbody>
              </table>
            </div>
            <p>
              There is no D or F. Every school in our data is an accredited 4-year program with 500+ enrolled
              students &mdash; a low letter means &ldquo;ranked lower than peers in this major in your current
              search,&rdquo; not &ldquo;failing institution.&rdquo;
            </p>
          </Section>

          <Section title="3. Cost Estimates">
            <p>Two cost numbers appear on school cards:</p>
            <ul style={listStyle}>
              <li>
                <strong>Total Cost</strong> &mdash; sticker price (tuition + fees + room/board + books) from
                Scorecard&rsquo;s <code>cost.attendance.academic_year</code>. For public schools, if the
                student&rsquo;s home state doesn&rsquo;t match the school&rsquo;s state, we add the tuition
                differential to estimate out-of-state cost.
              </li>
              <li>
                <strong>Avg Net Price</strong> &mdash; the average cost students actually pay after grants and
                scholarships. This is an average across all aid recipients, so individual financial aid offers
                will vary substantially.
              </li>
            </ul>
            <p>
              Neither number reflects merit aid specific to the student, outside scholarships, or loan burden.
              They&rsquo;re directional, not a financial plan.
            </p>
          </Section>

          <Section title="4. AI Features">
            <ul style={listStyle}>
              <li>
                <strong>Essay Studio</strong> generates brainstorming questions and gives critique feedback
                on drafts. It does <strong>not</strong> write essays for students. Drafts stay private to the
                student&rsquo;s account.
              </li>
              <li>
                <strong>Strategy Generator</strong> uses the student&rsquo;s profile and preferences to suggest
                a categorized college list (Reach / Target / Safety). Suggestions are starting points for a
                counselor conversation, not final decisions.
              </li>
            </ul>
            <p>
              All AI features use Google Gemini 2.5 Flash with prompt-injection defenses on user input. Free
              tier is limited to 3 AI generations per day.
            </p>
          </Section>

          <Section title="5. Data Sources">
            <ul style={listStyle}>
              <li>
                <strong>College Scorecard</strong> &mdash; U.S. Department of Education (
                <a href="https://collegescorecard.ed.gov" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  collegescorecard.ed.gov
                </a>
                ). Annual data release; most recent figures lag the current academic year by ~1&ndash;2 years.
              </li>
              <li>
                <strong>Internal calculations</strong> &mdash; admission chance and Stairway Rankings are
                computed by StairwayU from Scorecard inputs plus the student&rsquo;s profile.
              </li>
            </ul>
            <p>
              We do not buy, sell, or trade student data. Profile data is stored in Supabase with row-level
              security and is only accessible to the student&rsquo;s account.
            </p>
          </Section>

          <Section title="6. What StairwayU Is Not">
            <ul style={listStyle}>
              <li>Not a replacement for a college counselor.</li>
              <li>Not a guarantor of admission outcomes.</li>
              <li>Not pay-to-play &mdash; no school pays to appear or rank higher in our results.</li>
              <li>Not a data broker &mdash; student profiles are not shared with schools or third parties.</li>
            </ul>
          </Section>

          <Section title="Found an error?">
            <p>
              If a school&rsquo;s data looks wrong, a cost estimate is off, or a chance calculation seems
              clearly miscalibrated, email us at{' '}
              <a href="mailto:support@stairwayu.com" style={linkStyle}>support@stairwayu.com</a>{' '}
              with the school name and what you&rsquo;re seeing. Scorecard data corrections are propagated on
              our next sync; internal model adjustments are versioned and dated at the top of this page.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

const subheadingStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginTop: 18,
  marginBottom: 6,
  color: 'var(--color-text)',
}

const listStyle: React.CSSProperties = {
  margin: '0 0 10px 20px',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: 'color-mix(in srgb, var(--color-text) 85%, transparent)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
}

const theadRowStyle: React.CSSProperties = {
  borderBottom: '2px solid var(--color-border)',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontWeight: 700,
}

const linkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'color-mix(in srgb, var(--color-text) 85%, transparent)' }}>
        {children}
      </div>
    </section>
  )
}

function FactorRow({ name, weight, desc }: { name: string; weight: string; desc: string }) {
  return (
    <tr style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
      <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>{weight}</td>
      <td style={{ padding: '10px 12px', color: 'color-mix(in srgb, var(--color-text) 75%, transparent)' }}>{desc}</td>
    </tr>
  )
}

function GradeRow({ score, grade }: { score: string; grade: string }) {
  return (
    <tr style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
      <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', color: 'color-mix(in srgb, var(--color-text) 80%, transparent)' }}>{score}</td>
      <td style={{ padding: '8px 12px', fontWeight: 800, color: 'var(--color-primary)' }}>{grade}</td>
    </tr>
  )
}
