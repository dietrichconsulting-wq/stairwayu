'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CollegeSelect } from '@/components/CollegeSelect'
import type { CollegeResult } from '@/components/CollegeSelect'

interface FinancialPlannerProps {
  savedColleges?: string[]
}

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt$(n: number) {
  return '$' + Math.round(n).toLocaleString()
}
function fmtK(n: number) {
  return '$' + (n / 1000).toFixed(0) + 'k'
}

/** Compound-grow a 529 balance with monthly contributions over `months`. */
function grow529(balance: number, monthlyContrib: number, months: number, annualReturn = 0.07) {
  const r = annualReturn / 12
  // FV of lump sum
  const fvLump = balance * Math.pow(1 + r, months)
  // FV of annuity
  const fvContribs = r > 0 ? monthlyContrib * ((Math.pow(1 + r, months) - 1) / r) : monthlyContrib * months
  return fvLump + fvContribs
}

/** Inflate tuition annually and sum all 4 years. */
function totalTuition(annualCost: number, inflationRate: number, yearsUntil: number) {
  let total = 0
  for (let y = 0; y < 4; y++) {
    total += annualCost * Math.pow(1 + inflationRate, yearsUntil + y)
  }
  return total
}

/** Monthly payment on a loan (standard repayment). */
function monthlyPayment(principal: number, annualRate = 0.065, years = 10) {
  if (principal <= 0) return 0
  const r = annualRate / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ── types ────────────────────────────────────────────────────────────────────
interface Inputs {
  currentTuition: string   // annual all-in cost today
  inflationRate: string    // % e.g. "5"
  yearsUntilEnroll: string
  savings529: string       // current balance
  monthlyContrib: string   // monthly contribution
  annualAid: string        // scholarships + grants per year
  annualIncome: string     // family income (for context)
}

// ── component ────────────────────────────────────────────────────────────────
export function FinancialPlanner({ savedColleges = [] }: FinancialPlannerProps) {
  const [selectedCollege, setSelectedCollege] = useState('')
  const [loadingCost, setLoadingCost] = useState(false)
  const [inputs, setInputs] = useState<Inputs>({
    currentTuition: '45000',
    inflationRate: '4',
    yearsUntilEnroll: '2',
    savings529: '30000',
    monthlyContrib: '300',
    annualAid: '10000',
    annualIncome: '120000',
  })

  function applyCost(result?: CollegeResult) {
    if (result?.costAttendance) {
      set('currentTuition', String(Math.round(result.costAttendance)))
    } else if (result?.tuitionOutOfState) {
      set('currentTuition', String(Math.round(result.tuitionOutOfState)))
    } else if (result?.tuitionInState) {
      set('currentTuition', String(Math.round(result.tuitionInState)))
    }
  }

  function handleCollegeSelect(name: string, result?: CollegeResult) {
    setSelectedCollege(name)
    applyCost(result)
  }

  const handleSavedCollegeSelect = useCallback(async (name: string) => {
    setSelectedCollege(name)
    setLoadingCost(true)
    try {
      const res = await fetch(`/api/colleges/search?q=${encodeURIComponent(name)}`)
      const data: CollegeResult[] = await res.json()
      const match = data.find(r => r.name.toLowerCase() === name.toLowerCase()) ?? data[0]
      if (match) applyCost(match)
    } catch { /* keep manual input */ }
    finally { setLoadingCost(false) }
  }, [])

  // What-if sliders
  const [whatIfContrib, setWhatIfContrib] = useState<number | null>(null)
  const [whatIfInflation, setWhatIfInflation] = useState<number | null>(null)
  const [whatIfScholarship, setWhatIfScholarship] = useState<number>(0)

  function set(key: keyof Inputs, val: string) {
    setInputs(prev => ({ ...prev, [key]: val }))
  }

  // Core numbers
  const calc = useMemo(() => {
    const tuition    = parseFloat(inputs.currentTuition) || 0
    const inflation  = (parseFloat(inputs.inflationRate) || 0) / 100
    const years      = parseFloat(inputs.yearsUntilEnroll) || 0
    const balance    = parseFloat(inputs.savings529) || 0
    const contrib    = parseFloat(inputs.monthlyContrib) || 0
    const aid        = parseFloat(inputs.annualAid) || 0
    const months     = Math.round(years * 12)

    const totalCost  = totalTuition(tuition, inflation, years)
    const totalAid   = aid * 4
    const projected529 = grow529(balance, contrib, months)
    const gap        = Math.max(0, totalCost - totalAid - projected529)
    const payment    = monthlyPayment(gap)

    // Year-by-year cost breakdown
    const yearlyBreakdown = Array.from({ length: 4 }, (_, i) => ({
      year: i + 1,
      cost: tuition * Math.pow(1 + inflation, years + i),
      aid,
    }))

    return { totalCost, totalAid, projected529, gap, payment, yearlyBreakdown }
  }, [inputs])

  // What-if scenario
  const whatIf = useMemo(() => {
    const tuition    = parseFloat(inputs.currentTuition) || 0
    const inflation  = (whatIfInflation !== null ? whatIfInflation : parseFloat(inputs.inflationRate) || 0) / 100
    const years      = parseFloat(inputs.yearsUntilEnroll) || 0
    const balance    = parseFloat(inputs.savings529) || 0
    const contrib    = whatIfContrib !== null ? whatIfContrib : (parseFloat(inputs.monthlyContrib) || 0)
    const aid        = (parseFloat(inputs.annualAid) || 0) + whatIfScholarship
    const months     = Math.round(years * 12)

    const totalCost    = totalTuition(tuition, inflation, years)
    const totalAid     = aid * 4
    const projected529 = grow529(balance, contrib, months)
    const gap          = Math.max(0, totalCost - totalAid - projected529)
    const payment      = monthlyPayment(gap)

    return { totalCost, totalAid, projected529, gap, payment }
  }, [inputs, whatIfContrib, whatIfInflation, whatIfScholarship])

  const hasWhatIf = whatIfContrib !== null || whatIfInflation !== null || whatIfScholarship !== 0

  const loanDelta = whatIf.gap - calc.gap
  const paymentDelta = whatIf.payment - calc.payment

  // Collapsible form on mobile (same pattern as Strategy)
  const [formOpen, setFormOpen] = useState(true)
  const resultsRef = useRef<HTMLDivElement>(null)
  const hasResults = calc.totalCost > 0

  // Auto-collapse form on mobile after first meaningful interaction
  useEffect(() => {
    if (hasResults && window.innerWidth <= 768) {
      setFormOpen(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [selectedCollege])

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Finance Plan 💵</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 32 }}>
        See what college will really cost and how savings, aid, and loans cover the gap.
      </p>

      <div className="finance-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Inputs ── */}
        <div className="finance-form-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mobile toggle header */}
          <button
            className="finance-form-toggle"
            onClick={() => setFormOpen(o => !o)}
            style={{ display: 'none', width: '100%', background: 'var(--color-column)', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', color: 'var(--color-text)', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {selectedCollege ? 'Edit Inputs' : 'Your Inputs'}
            </span>
            <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: formOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          </button>
          <div className={formOpen ? 'finance-form-body' : 'finance-form-body finance-form-collapsed'} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated" style={{ padding: '22px 24px' }}>
            <SectionHeader>College Costs</SectionHeader>
            <div style={{ marginBottom: 14 }}>
              {savedColleges.length > 0 ? (
                <>
                  <label style={labelStyle}>Your colleges</label>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Auto-fills cost from U.S. Dept of Education data</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {savedColleges.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSavedCollegeSelect(name)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 99,
                          border: selectedCollege === name ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          background: selectedCollege === name ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--color-column)',
                          color: selectedCollege === name ? 'var(--color-primary)' : 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {name}
                        {loadingCost && selectedCollege === name && ' …'}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Or search for another college</div>
                  <CollegeSelect
                    value={selectedCollege}
                    onChange={handleCollegeSelect}
                    placeholder="Search for a different college…"
                    showCost
                    inputStyle={{ padding: '7px 10px', fontSize: 12, borderRadius: 8 }}
                  />
                </>
              ) : (
                <>
                  <label style={labelStyle}>Select a college</label>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>Auto-fills cost from U.S. Dept of Education data</div>
                  <CollegeSelect
                    value={selectedCollege}
                    onChange={handleCollegeSelect}
                    placeholder="Search for a college…"
                    showCost
                    inputStyle={{ padding: '9px 12px', fontSize: 13, borderRadius: 8 }}
                  />
                </>
              )}
              {selectedCollege && (
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                  {selectedCollege}
                </div>
              )}
            </div>
            <Field label="Annual all-in cost today" prefix="$" value={inputs.currentTuition} onChange={v => set('currentTuition', v)} placeholder="45000" hint="Tuition + room + board + fees" />
            <Field label="Tuition inflation rate" suffix="%" value={inputs.inflationRate} onChange={v => set('inflationRate', v)} placeholder="4" hint="Avg ~4–6% per year" />
            <Field label="Years until enrollment" value={inputs.yearsUntilEnroll} onChange={v => set('yearsUntilEnroll', v)} placeholder="2" hint="Years until freshman year starts" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="card-elevated" style={{ padding: '22px 24px' }}>
            <SectionHeader>529 Savings</SectionHeader>
            <Field label="Current 529 balance" prefix="$" value={inputs.savings529} onChange={v => set('savings529', v)} placeholder="30000" />
            <Field label="Monthly contribution" prefix="$" value={inputs.monthlyContrib} onChange={v => set('monthlyContrib', v)} placeholder="300" hint="Assumes 7% avg annual return" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card-elevated" style={{ padding: '22px 24px' }}>
            <SectionHeader>Aid & Income</SectionHeader>
            <Field label="Expected aid / scholarships / year" prefix="$" value={inputs.annualAid} onChange={v => set('annualAid', v)} placeholder="10000" hint="Grants, merit aid, scholarships" />
            <Field label="Household income" prefix="$" value={inputs.annualIncome} onChange={v => set('annualIncome', v)} placeholder="120000" hint="Used for context only" />
          </motion.div>
          </div>{/* /finance-form-body */}
        </div>

        {/* ── Results + What-if ── */}
        <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary cards */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <SummaryCard label="4-Year College Cost" value={fmt$(calc.totalCost)} sub="inflation-adjusted" color="var(--color-text)" />
              <SummaryCard label="529 at Enrollment" value={fmt$(calc.projected529)} sub={`from ${fmt$(parseFloat(inputs.savings529) || 0)} today`} color="#2563eb" />
              <SummaryCard label="Total Aid / Scholarships" value={fmt$(calc.totalAid)} sub="4-year total" color="#059669" />
              <SummaryCard
                label="Expected Loan Burden"
                value={calc.gap > 0 ? fmt$(calc.gap) : '✓ Covered'}
                sub={calc.gap > 0 ? `≈ ${fmt$(calc.payment)}/mo for 10 yrs` : 'No loans needed!'}
                color={calc.gap > 0 ? '#dc2626' : '#059669'}
                highlight={calc.gap > 0}
              />
            </div>

            {/* Year-by-year cost bar chart */}
            <div className="card-elevated" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Year-by-Year Cost Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {calc.yearlyBreakdown.map((row, i) => {
                  const net = row.cost - row.aid
                  const maxCost = calc.yearlyBreakdown[calc.yearlyBreakdown.length - 1].cost
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>Year {row.year}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {fmt$(row.cost)} total · <span style={{ color: '#059669' }}>−{fmt$(row.aid)} aid</span> = <span style={{ fontWeight: 700, color: net > 0 ? '#dc2626' : '#059669' }}>{fmt$(Math.max(0, net))} out-of-pocket</span>
                        </span>
                      </div>
                      <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                        {/* full cost bar */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(row.cost / maxCost) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                          style={{ position: 'absolute', height: '100%', background: 'rgba(220,38,38,0.2)', borderRadius: 99 }}
                        />
                        {/* aid overlay */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(Math.min(row.aid, row.cost) / maxCost) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                          style={{ position: 'absolute', height: '100%', background: '#059669', borderRadius: 99 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(220,38,38,0.2)' }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total cost</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#059669' }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Aid / scholarships</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Funding stack */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="card-elevated" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              How It Gets Funded
            </div>
            <FundingStack total={calc.totalCost} savings={calc.projected529} aid={calc.totalAid} loans={calc.gap} />
          </motion.div>

          {/* What-if scenarios */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="card-elevated" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              What If?
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Drag the sliders to see how changes affect your loan burden.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Monthly 529 contribution slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={labelStyle}>Monthly 529 contribution</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {fmt$((whatIfContrib ?? parseFloat(inputs.monthlyContrib)) || 0)}/mo
                  </span>
                </div>
                <input
                  type="range" min={0} max={2000} step={50}
                  value={(whatIfContrib ?? parseFloat(inputs.monthlyContrib)) || 0}
                  onChange={e => setWhatIfContrib(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>$0</span><span>$1,000</span><span>$2,000</span>
                </div>
              </div>

              {/* Tuition inflation slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={labelStyle}>Annual tuition inflation</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                    {((whatIfInflation ?? parseFloat(inputs.inflationRate)) || 0).toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range" min={0} max={10} step={0.5}
                  value={(whatIfInflation ?? parseFloat(inputs.inflationRate)) || 0}
                  onChange={e => setWhatIfInflation(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#d97706' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>0%</span><span>5%</span><span>10%</span>
                </div>
              </div>

              {/* Additional scholarship */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={labelStyle}>Additional scholarship (per year)</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>+{fmt$(whatIfScholarship)}/yr</span>
                </div>
                <input
                  type="range" min={0} max={30000} step={500}
                  value={whatIfScholarship}
                  onChange={e => setWhatIfScholarship(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#059669' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)' }}>
                  <span>$0</span><span>$15k</span><span>$30k</span>
                </div>
              </div>
            </div>

            {/* What-if result */}
            {hasWhatIf && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  marginTop: 20, padding: '14px 16px', borderRadius: 12,
                  background: loanDelta <= 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.06)',
                  border: `1.5px solid ${loanDelta <= 0 ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.2)'}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
                  With these changes:
                </div>
                <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <WhatIfStat label="New loan burden" value={whatIf.gap > 0 ? fmt$(whatIf.gap) : '✓ $0'} delta={loanDelta} invert />
                  <WhatIfStat label="Monthly payment" value={whatIf.payment > 0 ? `${fmt$(whatIf.payment)}/mo` : '✓ None'} delta={paymentDelta} invert />
                  <WhatIfStat label="529 at enrollment" value={fmt$(whatIf.projected529)} delta={whatIf.projected529 - calc.projected529} />
                  <WhatIfStat label="Total cost" value={fmt$(whatIf.totalCost)} delta={whatIf.totalCost - calc.totalCost} invert />
                </div>
                <button
                  onClick={() => { setWhatIfContrib(null); setWhatIfInflation(null); setWhatIfScholarship(0) }}
                  style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset to baseline
                </button>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text)', marginBottom: 14, letterSpacing: '-0.01em' }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, prefix, suffix, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; prefix?: string; suffix?: string; hint?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {hint && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3 }}>{hint}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {prefix && <span style={{ fontSize: 13, color: 'var(--color-text-muted)', background: 'var(--color-border)', padding: '9px 10px', borderRadius: '8px 0 0 8px', border: '1.5px solid var(--color-border)', borderRight: 'none' }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: '9px 12px',
            borderRadius: prefix ? '0 8px 8px 0' : suffix ? '8px 0 0 8px' : '8px',
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-column)', color: 'var(--color-text)',
            fontSize: 13, outline: 'none',
          }}
        />
        {suffix && <span style={{ fontSize: 13, color: 'var(--color-text-muted)', background: 'var(--color-border)', padding: '9px 10px', borderRadius: '0 8px 8px 0', border: '1.5px solid var(--color-border)', borderLeft: 'none' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color, highlight }: {
  label: string; value: string; sub: string; color: string; highlight?: boolean
}) {
  return (
    <div className="card-elevated" style={{
      padding: '16px 18px',
      borderLeft: `3px solid ${color}`,
      background: highlight ? 'rgba(220,38,38,0.03)' : undefined,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</div>
    </div>
  )
}

function FundingStack({ total, savings, aid, loans }: { total: number; savings: number; aid: number; loans: number }) {
  const covered = Math.min(savings + aid, total)
  const segments = [
    { label: '529 Savings', value: Math.min(savings, total), color: '#2563eb' },
    { label: 'Aid / Scholarships', value: Math.min(aid, Math.max(0, total - savings)), color: '#059669' },
    { label: 'Loans Needed', value: loans, color: '#dc2626' },
  ].filter(s => s.value > 0)

  return (
    <div>
      {/* Stacked bar */}
      <div style={{ height: 28, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.value / total) * 100}%` }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: 'easeOut' }}
            style={{ background: seg.color, height: '100%' }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{seg.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: seg.color }}>{fmt$(seg.value)}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {Math.round((seg.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
        {/* Total */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Total 4-Year Cost</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{fmt$(total)}</span>
        </div>
      </div>
    </div>
  )
}

function WhatIfStat({ label, value, delta, invert }: { label: string; value: string; delta: number; invert?: boolean }) {
  const isGood = invert ? delta < 0 : delta > 0
  const isBad = invert ? delta > 0 : delta < 0
  const deltaColor = delta === 0 ? 'var(--color-text-muted)' : isGood ? '#059669' : '#dc2626'
  const deltaStr = delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${fmt$(Math.abs(delta))}`

  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{value}</div>
      {delta !== 0 && (
        <div style={{ fontSize: 11, fontWeight: 700, color: deltaColor }}>
          {isGood ? '↓' : '↑'} {deltaStr}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 5,
}
