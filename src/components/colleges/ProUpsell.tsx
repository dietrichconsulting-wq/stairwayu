import Link from 'next/link'

interface Props {
  schoolName?: string
}

/**
 * Sells the $9.99/mo Pro tier on public college pages.
 * Marketing copy mirrors LandingPage pricing section so messaging stays
 * consistent across the site.
 */
export function ProUpsell({ schoolName }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-6 mt-16">
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-amber-400/10 border border-white/10 p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-amber-300/90">
              Stairway U Pro
            </div>
            <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-white">
              {schoolName ? <>Build your full strategy for {schoolName}.</> : <>Get the full toolkit.</>}
            </h2>
            <p className="mt-3 text-white/70 leading-relaxed">
              Free forever covers chancing and your journey milestones. Pro unlocks the rest of the toolkit when you&apos;re ready to apply.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                'Unlimited colleges',
                'Unlimited AI calls',
                'AI Strategy Generator',
                'Full Essay Coaching',
                'College Comparison',
                'Unlimited scholarships',
                'Deadline Radar',
                'Everything in Free',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-white/15 text-[9px] text-white">
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/60">
              Full Access
            </div>
            <div className="mt-3 text-5xl font-black tracking-tight text-white">$9.99</div>
            <div className="mt-1 text-sm text-white/50">per month</div>
            <Link
              href="/signup"
              className="mt-6 block rounded-lg bg-white px-4 py-3 text-center text-[13px] font-extrabold uppercase tracking-[0.05em] text-slate-900 hover:bg-white/90"
            >
              Start 7-Day Pro Trial →
            </Link>
            <p className="mt-3 text-[11px] text-white/40">
              Cancel anytime — no charge during your Pro trial
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
