import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://e9203eeac630f3ca54b1ffab0d004049@o4511254017933312.ingest.us.sentry.io/4511254026387456',
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
