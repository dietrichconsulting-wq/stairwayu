import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/siteConfig'

export const metadata: Metadata = {
  title: 'Sign Up — Free 7-Day Trial',
  description: 'Create your Stairway U account. Free 7-day Pro trial. See your real chances at every college using U.S. Dept of Education data.',
  alternates: { canonical: `${SITE_URL}/signup` },
  openGraph: {
    title: 'Sign Up for Stairway U',
    description: 'Free 7-day Pro trial. See your real chances at every college.',
    url: `${SITE_URL}/signup`,
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
