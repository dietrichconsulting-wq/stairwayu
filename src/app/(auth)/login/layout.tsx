import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/siteConfig'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to Stairway U to see your admission chances, college list, and essay tools.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
