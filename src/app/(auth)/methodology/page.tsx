import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stairway Ranking Methodology — Stairway U',
  description:
    'How StairwayU calculates its college ranking score using public federal data from the College Scorecard.',
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
      <div style={{ maxWidth: 720, width: '100%' }}>
        <Link href="/" style={{ fontSize: 14, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
          &larr; Back to Stairway U
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', marginTop: 24, marginBottom: 8 }}>
          The Stairway Ranking
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 36 }}>
          Our methodology for ranking colleges — transparent, data-driven, and personalized to your search.
        </p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>
          <Section title="Overview">
            <p>
              The <strong>Stairway Ranking</strong> is a composite score from 0 to 100 that measures how
              strong a school is for a given major — or overall academic quality when no major is selected.
              Every score is calculated in real time using public federal data from the{' '}
              <a href="https://collegescorecard.ed.gov" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                U.S. Department of Education&rsquo;s College Scorecard
              </a>.
            </p>
            <p>
              Unlike static annual rankings, the Stairway Ranking is <strong>contextual</strong>: scores are
              relative to the schools in your current search results. This means the ranking adapts to your
              SAT range, budget, region filters, and major — giving you a personalized comparison, not a
              one-size-fits-all list.
            </p>
          </Section>

          <Section title="How It Works">
            <p>
              Each school in your results is evaluated on multiple factors. For each factor, the school is
              assigned a <strong>percentile rank</strong> (0–100) relative to the other schools in the same
              result set. These percentile scores are then combined using a weighted average to produce the
              final Stairway Ranking.
            </p>
            <p>
              If a school is missing data for a particular factor, that factor is skipped and its weight is
              redistributed proportionally across the remaining factors. A school needs data on at least
              two factors to receive a score — otherwise it shows &ldquo;N/A.&rdquo;
            </p>
          </Section>

          <Section title="Factors &amp; Weights (With a Major Selected)">
            <p>
              When you select a major on the Explore page, the ranking blends school-level quality indicators
              with program-specific data for that major:
            </p>
            <div style={{ margin: '16px 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border, rgba(255,255,255,0.1))' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Factor</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700 }}>Weight</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>What It Measures</th>
                  </tr>
                </thead>
                <tbody>
                  <FactorRow name="Program Share" weight="25%" desc="Percentage of students in that major (completions ÷ enrollment). Higher share = stronger, more established program." />
                  <FactorRow name="Graduation Rate" weight="20%" desc="4-year graduation rate. Reflects institutional quality and student support." />
                  <FactorRow name="Program Earnings" weight="20%" desc="Median earnings 1 year after graduation for that specific major. The direct ROI signal." />
                  <FactorRow name="Selectivity" weight="15%" desc="Inverse of admission rate. Lower acceptance rate = more selective = higher score." />
                  <FactorRow name="Retention Rate" weight="10%" desc="First-year retention rate for full-time students. A proxy for student satisfaction." />
                  <FactorRow name="School Earnings" weight="10%" desc="Median earnings 10 years after enrollment (all majors). A broad quality-of-outcome signal." />
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Factors &amp; Weights (No Major Selected)">
            <p>
              When no major is selected, program-specific factors aren&rsquo;t available. The remaining
              school-level factors are reweighted proportionally to produce a pure &ldquo;school quality&rdquo;
              ranking:
            </p>
            <div style={{ margin: '16px 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border, rgba(255,255,255,0.1))' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>Factor</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700 }}>Weight</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700 }}>What It Measures</th>
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
          </Section>

          <Section title="Percentile Ranking">
            <p>
              Raw values aren&rsquo;t directly comparable across factors (a 90% graduation rate and $65,000
              median earnings are different scales). To normalize them, we rank every school against the
              others in your search results using percentiles.
            </p>
            <p>
              For example, if a school&rsquo;s graduation rate is higher than 80% of the other schools in
              your results, it receives a percentile score of 80 for that factor. For selectivity, the
              percentile is inverted — a <em>lower</em> admission rate yields a <em>higher</em> score.
            </p>
          </Section>

          <Section title="Why Contextual Rankings?">
            <p>
              Static &ldquo;top 100&rdquo; lists compare Harvard to community colleges — which isn&rsquo;t
              useful if your SAT is 1200 and your budget is $30k. The Stairway Ranking only compares schools
              that match your actual filters, so you always see meaningful relative differences.
            </p>
            <p>
              This also means the same school can score differently in different searches. A mid-tier state
              school might score 85 when compared to schools in its region, but 55 when compared to the
              entire country. Both are valid — the score tells you where it stands <em>among your options</em>.
            </p>
          </Section>

          <Section title="Data Source">
            <p>
              All data comes from the{' '}
              <a href="https://collegescorecard.ed.gov" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                College Scorecard
              </a>, maintained by the U.S. Department of Education. This dataset covers over 6,000
              degree-granting institutions and is updated annually. Program-level data (completions and
              earnings by major) uses the Classification of Instructional Programs (CIP) code system.
            </p>
            <p>
              Not every school reports every data point. When program-level earnings or completions data is
              unavailable (common for smaller programs), those factors are excluded and the remaining weights
              are adjusted. Schools with fewer than two available factors show &ldquo;N/A&rdquo; instead of
              a potentially misleading score.
            </p>
          </Section>

          <Section title="Limitations">
            <p>
              No ranking captures everything. The Stairway Ranking does <strong>not</strong> account for
              campus culture, class sizes, research opportunities, extracurricular programs, financial aid
              generosity, or geographic fit — all of which matter. Use it as one input alongside your own
              research, campus visits, and gut feeling.
            </p>
            <p>
              Earnings data reflects outcomes for past graduates and may not predict future job markets.
              Program-level earnings data is only available for roughly 16–55% of programs depending on the
              field, so coverage varies by major.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: 'color-mix(in srgb, var(--color-text) 85%, transparent)' }}>
        {children}
      </div>
    </section>
  )
}

function FactorRow({ name, weight, desc }: { name: string; weight: string; desc: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))' }}>
      <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)' }}>{weight}</td>
      <td style={{ padding: '10px 12px', color: 'color-mix(in srgb, var(--color-text) 75%, transparent)' }}>{desc}</td>
    </tr>
  )
}
