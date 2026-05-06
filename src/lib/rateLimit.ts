import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

let aiLimiter: Ratelimit | null | undefined

function getAiLimiter(): Ratelimit | null {
  if (aiLimiter !== undefined) return aiLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    aiLimiter = null
    return aiLimiter
  }

  const redis = new Redis({ url, token })
  aiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'ratelimit:ai',
  })

  return aiLimiter
}

/**
 * Check rate limit for an authenticated user on an AI route.
 * Returns null if allowed, or a NextResponse 429 if blocked.
 */
export async function checkAiRateLimit(
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getAiLimiter()
  if (!limiter) {
    return NextResponse.json(
      { error: 'AI rate limiting is not configured.' },
      { status: 503 },
    )
  }

  const { success, limit, remaining, reset } = await limiter.limit(userId)

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
