'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  token: string
  studentName: string
}

const RELATIONS = ['Grandparent', 'Aunt / Uncle', 'Parent', 'Family friend', 'Other']
const AMOUNTS = [50, 100, 250, 500, 1000]

export function PledgeForm({ token, studentName }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [relation, setRelation] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const effectiveAmount = typeof amount === 'number' ? amount : parseInt(customAmount, 10) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || effectiveAmount < 1) return
    setStatus('sending')
    try {
      const res = await fetch('/api/pledge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
          email: email.trim() || undefined,
          relation: relation || undefined,
          amount: effectiveAmount,
          message: message.trim() || undefined,
        }),
      })
      if (res.ok) setStatus('done')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/15 to-teal-500/10 p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-white">Thank you, {name}!</h3>
        <p className="mt-2 text-white/60">
          Your pledge of <b>${effectiveAmount.toLocaleString()}</b> toward {studentName}&apos;s college fund has been recorded.
          {studentName} and their family will see your generous commitment.
        </p>
        <p className="mt-4 text-sm text-white/40">
          This is a non-binding pledge. When you&apos;re ready to contribute, visit the{' '}
          <Link href="/gift" className="text-teal-400 hover:text-teal-300">529 gifting guide</Link>{' '}
          for step-by-step instructions.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="text-xs font-extrabold uppercase tracking-[0.15em] text-amber-300/80 mb-1">
        College Gift Pledge
      </div>
      <h3 className="text-xl font-bold text-white mb-1">
        Pledge toward {studentName}&apos;s college fund
      </h3>
      <p className="text-sm text-white/50 mb-6">
        Non-binding — let {studentName}&apos;s family know you&apos;d like to contribute.
        You&apos;ll get instructions on how to send funds to their 529 plan.
      </p>

      {/* Amount selection */}
      <div className="mb-5">
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Amount
        </label>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustomAmount('') }}
              className={`rounded-lg border px-4 py-2 text-sm font-bold cursor-pointer ${
                amount === a
                  ? 'border-teal-400 bg-teal-400/15 text-teal-300'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
              }`}
            >
              ${a.toLocaleString()}
            </button>
          ))}
          <input
            type="number"
            min="1"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setAmount('') }}
            placeholder="Other"
            className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
          />
        </div>
      </div>

      {/* Name + email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Your name *
          </span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grandma Betty"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Email (optional)
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For confirmation"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
          />
        </label>
      </div>

      {/* Relation */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Relationship (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRelation(relation === r ? '' : r)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
                relation === r
                  ? 'border-teal-400 bg-teal-400/15 text-teal-300'
                  : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div className="mb-5">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`"For your first semester!" or "So proud of you!"`}
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || effectiveAmount < 1 || status === 'sending'}
        className="w-full rounded-lg bg-white py-3 text-center text-[13px] font-extrabold uppercase tracking-[0.03em] text-slate-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-white/90 border-none"
      >
        {status === 'sending'
          ? 'Sending…'
          : effectiveAmount > 0
            ? `Pledge $${effectiveAmount.toLocaleString()} →`
            : 'Select an amount'}
      </button>

      {status === 'error' && (
        <p className="mt-3 text-sm text-red-400 text-center">Something went wrong. Please try again.</p>
      )}

      <p className="mt-3 text-center text-[10px] text-white/30">
        Non-binding pledge. No payment is processed. You&apos;ll find 529 contribution instructions on the next page.
      </p>
    </form>
  )
}
