import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 60, // 60 requests
  windowMs: 60 * 1000 // per minute
}

export function rateLimit(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {}
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Get client identifier (IP or custom header)
  // @ts-expect-error - NextRequest has ip property in newer versions
  const ip = request.ip
  const identifier = ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') ||
    'anonymous'
  
  const key = `${request.nextUrl.pathname}:${identifier}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + opts.windowMs
    })
    
    return {
      success: true,
      limit: opts.maxRequests,
      remaining: opts.maxRequests - 1,
      resetTime: now + opts.windowMs
    }
  }
  
  if (entry.count >= opts.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: opts.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    limit: opts.maxRequests,
    remaining: opts.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

export function applyRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: { limit: number; remaining: number; resetTime: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
  return response
}
