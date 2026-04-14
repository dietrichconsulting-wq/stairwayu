import type { Metadata, Viewport } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#121318',
}

const SITE_URL = 'https://stairwayu.com'
const SITE_TITLE = 'Stairway U: College Chances, Scholarships & Essay Coach'
const SITE_DESC =
  'See how your academic profile compares at every college, get AI-matched scholarships, essay coaching, and a financial planner — one dashboard powered by U.S. Dept of Education data. Works on any device. $9.99/mo, 7-day free trial.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · Stairway U',
  },
  description: SITE_DESC,
  applicationName: 'Stairway U',
  keywords: [
    'college admissions calculator',
    'chancing calculator',
    'college acceptance odds',
    'scholarship finder',
    'college planning app',
    'high school college planner',
    'college search',
    'FAFSA financial aid planner',
    'college essay coach',
    'College Scorecard',
  ],
  authors: [{ name: 'Stairway U' }],
  creator: 'Stairway U',
  publisher: 'Stairway U',
  manifest: '/manifest.json',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Stairway U',
    title: SITE_TITLE,
    description: SITE_DESC,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stairway U',
  },
}

const JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}#org`,
      name: 'Stairway U',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: 'Stairway U',
      publisher: { '@id': `${SITE_URL}#org` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}#app`,
      name: 'Stairway U',
      url: SITE_URL,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: SITE_DESC,
      offers: {
        '@type': 'Offer',
        name: 'Stairway U Membership',
        price: '9.99',
        priceCurrency: 'USD',
        category: 'subscription',
        description: '$9.99/month with a 7-day free trial. Includes all features.',
      },
      featureList: [
        'Admission chancing powered by College Scorecard',
        'AI-matched scholarship finder',
        'Essay brainstorming and critique',
        'Financial planner with 529 and loan estimates',
        'Deadline tracking and journey milestones',
      ],
      publisher: { '@id': `${SITE_URL}#org` },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
        />
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
