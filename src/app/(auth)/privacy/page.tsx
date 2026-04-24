import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Stairway U',
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 36 }}>
          Last updated: April 24, 2026
        </p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>
          <Section title="1. Introduction">
            <p>
              Stairway U is operated by Dietrich Consulting LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;). This Privacy Policy explains how we collect, use, disclose, and protect
              your personal information when you use our college planning platform (the &ldquo;Service&rdquo;).
            </p>
            <p>
              We take the privacy of student data seriously. Many of our users are minors (ages 13&ndash;17),
              and we design our data practices with student privacy protections in mind, including compliance
              with applicable federal and state laws.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3 style={subheadStyle}>Information you provide directly</h3>
            <ul>
              <li><strong>Account information:</strong> Name, email address, and password (or Google OAuth credentials)</li>
              <li><strong>Academic profile:</strong> GPA (weighted and unweighted), SAT score, ACT score, intended major, home state</li>
              <li><strong>College list:</strong> Schools you are considering or applying to</li>
              <li><strong>User-generated content:</strong> Essays, notes, scholarship entries, task lists, and other content you create within the Service</li>
              <li><strong>Payment information:</strong> Processed securely by Stripe. We do not store your credit card number, CVC, or full card details on our servers.</li>
            </ul>

            <h3 style={subheadStyle}>Information collected automatically</h3>
            <ul>
              <li><strong>Usage data:</strong> Pages visited, features used, XP earned, and progress milestones</li>
              <li><strong>Device and browser information:</strong> Browser type, operating system, and screen size</li>
              <li><strong>Cookies:</strong> We use essential cookies for authentication and session management. We do not use third-party advertising or tracking cookies.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your personal information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Personalize your experience (admissions estimates, school comparisons, strategy recommendations)</li>
              <li>Process subscription payments through Stripe</li>
              <li>Send account-related communications (confirmation emails, password resets)</li>
              <li>Send weekly progress emails (if opted in; you can disable this anytime)</li>
              <li>Generate AI-powered essay feedback and planning suggestions</li>
              <li>Monitor and prevent abuse of the Service</li>
            </ul>
            <p>
              <strong>We do not sell your personal information.</strong> We do not use student data for
              advertising, marketing to third parties, or building advertising profiles.
            </p>
          </Section>

          <Section title="4. AI Processing">
            <p>
              Stairway U uses third-party AI services (such as Google Gemini) to provide essay feedback,
              strategy suggestions, and other recommendations. When you use AI-powered features, relevant
              portions of your content are sent to these providers for processing. These providers process
              data under their own privacy policies and data processing agreements.
            </p>
            <p>
              We do not use your content to train AI models. AI providers are contractually prohibited
              from using your data for model training.
            </p>
          </Section>

          <Section title="5. How We Share Your Information">
            <p>We share your information only in the following circumstances:</p>
            <ul>
              <li><strong>Service providers:</strong> Supabase (database and authentication), Stripe (payment processing), Google (AI features), and Vercel (hosting). Each provider processes data under contract and only as necessary to provide their services.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law, legal process, or government request.</li>
              <li><strong>Business transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</li>
            </ul>
            <p>
              <strong>We never share your academic profile, essays, or college list with colleges,
              admissions offices, or other students.</strong>
            </p>
          </Section>

          <Section title="6. Data Retention &amp; Deletion">
            <p>
              We retain your data for as long as your account is active. You may delete your account at any
              time from your profile page, which permanently removes:
            </p>
            <ul>
              <li>Your profile and academic information</li>
              <li>All essays, tasks, scholarships, and college lists</li>
              <li>XP records, milestones, and referral history</li>
              <li>Email preferences and notification settings</li>
            </ul>
            <p>
              After account deletion, your data is permanently removed from our databases. Stripe retains
              payment records independently per their own retention policies.
            </p>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul>
              <li>Encryption in transit (HTTPS/TLS) and at rest</li>
              <li>Row-level security (RLS) policies ensuring users can only access their own data</li>
              <li>Secure authentication through Supabase Auth with support for email/password and Google OAuth</li>
              <li>No storage of raw payment credentials (handled entirely by Stripe)</li>
            </ul>
            <p>
              No system is 100% secure. If we become aware of a data breach affecting your information,
              we will notify you promptly in accordance with applicable law.
            </p>
          </Section>

          <Section title="8. Children&rsquo;s Privacy (COPPA)">
            <p>
              Stairway U is not directed at children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and believe your
              child under 13 has provided us with personal information, please contact us at
              StairwayUHelp@gmail.com and we will delete the account and associated data.
            </p>
            <p>
              For users aged 13&ndash;17, we require parental or guardian consent as described in our
              Terms of Service. We limit data collection to what is necessary to provide the Service and
              do not use student data for targeted advertising.
            </p>
          </Section>

          <Section title="9. Student Privacy (FERPA &amp; SOPIPA)">
            <p>
              Stairway U is a direct-to-consumer product and does not contract with schools or districts.
              However, we design our practices to align with the principles of student data privacy laws:
            </p>
            <ul>
              <li>We do not sell student information</li>
              <li>We do not use student data for non-educational advertising or marketing</li>
              <li>We do not build profiles of students for purposes other than providing the Service</li>
              <li>Students (and their parents/guardians) can access and delete all stored data at any time</li>
            </ul>
          </Section>

          <Section title="10. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal information we hold about you</li>
              <li><strong>Correct</strong> inaccurate information via your profile page</li>
              <li><strong>Delete</strong> your account and all associated data</li>
              <li><strong>Export</strong> your data (contact us at StairwayUHelp@gmail.com)</li>
              <li><strong>Opt out</strong> of non-essential communications (weekly emails)</li>
            </ul>
            <p>
              California residents may have additional rights under the CCPA. To exercise any of these
              rights, contact us at StairwayUHelp@gmail.com.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will
              notify you via email or through the Service. The &ldquo;Last updated&rdquo; date at the top
              reflects the most recent revision.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p>
              <strong>Dietrich Consulting LLC</strong><br />
              Email:{' '}
              <a href="mailto:StairwayUHelp@gmail.com" style={{ color: 'var(--color-primary)' }}>
                StairwayUHelp@gmail.com
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

const subheadStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginTop: 12,
  marginBottom: 4,
  color: 'var(--color-text)',
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
