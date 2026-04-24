import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Stairway U',
}

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 36 }}>
          Last updated: April 24, 2026
        </p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using Stairway U (the &ldquo;Service&rdquo;), operated by Dietrich Consulting LLC
              (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms
              of Service. If you are under 18, you represent that your parent or legal guardian has reviewed and
              agreed to these Terms on your behalf.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Stairway U is a college application planning platform that helps students organize their admissions
              journey, compare schools, draft essays, find scholarships, and track progress. The Service provides
              tools and information for educational planning purposes only.
            </p>
            <p>
              <strong>Stairway U does not guarantee admission to any college or university.</strong> All
              admissions estimates, school comparisons, and recommendations are for informational purposes only
              and should not be treated as professional admissions counseling.
            </p>
          </Section>

          <Section title="3. Accounts &amp; Eligibility">
            <p>
              You must provide accurate information when creating an account. You are responsible for maintaining
              the security of your login credentials and for all activity under your account.
            </p>
            <p>
              The Service is intended for high school students, their parents/guardians, and college applicants.
              Users under 13 years of age may not use the Service. Users aged 13&ndash;17 must have parental or
              guardian consent.
            </p>
          </Section>

          <Section title="4. Subscriptions &amp; Payments">
            <p>
              Stairway U offers both free and paid subscription tiers. Paid subscriptions are billed through
              Stripe. By subscribing to a paid plan, you authorize us to charge the payment method on file at
              the applicable rate.
            </p>
            <ul>
              <li><strong>Free trials:</strong> If you sign up for a free trial, you will not be charged until the trial period ends. You may cancel before the trial expires to avoid charges.</li>
              <li><strong>Recurring billing:</strong> Subscriptions automatically renew at the end of each billing period (monthly or annually) unless you cancel beforehand.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your profile settings or the Stripe customer portal. Access continues through the end of the current billing period.</li>
              <li><strong>Refunds:</strong> Payments are generally non-refundable. If you believe you were charged in error, contact us at StairwayUHelp@gmail.com.</li>
            </ul>
          </Section>

          <Section title="5. User Content &amp; Data">
            <p>
              You retain ownership of any content you create within the Service (essays, notes, profile
              information). By using the Service, you grant us a limited license to store, process, and display
              your content solely to provide and improve the Service for you.
            </p>
            <p>
              You may delete your account and all associated data at any time from your profile page. Upon
              deletion, we will permanently remove your data in accordance with our{' '}
              <Link href="/privacy" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Share your account credentials with others</li>
              <li>Attempt to access other users&apos; accounts or data</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Reverse-engineer, scrape, or copy the Service</li>
              <li>Use the Service to generate misleading or fraudulent college applications</li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate these terms without prior notice.
            </p>
          </Section>

          <Section title="7. AI-Generated Content">
            <p>
              Stairway U uses artificial intelligence to provide essay feedback, strategy suggestions, and
              other recommendations. AI-generated content is provided as-is and may contain errors or
              inaccuracies. You are solely responsible for reviewing, editing, and submitting any content
              in your college applications.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              All content, features, and functionality of the Service (excluding user-generated content) are
              owned by Dietrich Consulting LLC and are protected by copyright, trademark, and other intellectual
              property laws.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF
              ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, DIETRICH CONSULTING LLC SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA,
              REVENUE, OR COLLEGE ADMISSION OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL
              LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </Section>

          <Section title="11. Changes to Terms">
            <p>
              We may update these Terms from time to time. If we make material changes, we will notify you
              via email or through the Service. Continued use of the Service after changes take effect
              constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Texas, without regard to conflict of
              law principles.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Questions about these Terms? Contact us at{' '}
              <a href="mailto:StairwayUHelp@gmail.com" style={{ color: 'var(--color-primary)' }}>
                StairwayUHelp@gmail.com
              </a>.
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
