import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,

  // Required for source map upload. Read from env so local builds without
  // these vars set fall through gracefully (Sentry plugin skips upload).
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps so production stack traces in Sentry show real
  // function names + line numbers, not minified `chunks/abc.js:1:1234`.
  // Maps are deleted from the client bundle after upload so users never
  // download them.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
