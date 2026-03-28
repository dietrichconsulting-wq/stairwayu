import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 AI requests per 60-second sliding window per user
const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: 'ratelimit:ai',
})

/**
 * Check rate limit for an authenticated user on an AI route.
 * Returns null if allowed, or a NextResponse 429 if blocked.
 */
export async function checkAiRateLimit(
  userId: string,
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await aiLimiter.limit(userId)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute before trying again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      },
    )
  }

  return null
}
