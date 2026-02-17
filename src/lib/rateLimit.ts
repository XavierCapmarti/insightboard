/**
 * Rate Limiting Middleware
 * ========================
 * Prevents API abuse by limiting requests per IP address
 * 
 * Uses in-memory storage for MVP (simple, no external dependencies)
 * For production scale, consider Redis-based solution (e.g., @upstash/ratelimit)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (clears on server restart)
// For production, use Redis or similar persistent store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (works with proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip.trim();
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or error response if rate limited
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const clientId = getClientId(request);
  const now = Date.now();
  
  // Get or create entry for this client
  let entry = rateLimitStore.get(clientId);
  
  // If entry doesn't exist or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(clientId, entry);
  }
  
  // Increment request count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
        limit: config.maxRequests,
        window: Math.ceil(config.windowMs / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(entry.resetTime),
        },
      }
    );
  }
  
  // Request allowed
  return null;
}

/**
 * Rate limit wrapper for API routes
 * Returns error response if rate limited, null if allowed
 */
export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  return rateLimit(request, config);
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limiter for data ingestion
   * 10 requests per minute
   */
  ingest: (request: NextRequest) =>
    rateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      message: 'Too many data uploads. Please wait before uploading again.',
    }),

  /**
   * Moderate rate limiter for metrics computation
   * 30 requests per minute
   */
  metrics: (request: NextRequest) =>
    rateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Too many metric requests. Please wait before requesting metrics again.',
    }),

  /**
   * Lenient rate limiter for general API endpoints
   * 60 requests per minute
   */
  general: (request: NextRequest) =>
    rateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      message: 'Too many requests. Please slow down.',
    }),

  /**
   * Strict rate limiter for authentication endpoints
   * 5 requests per minute (prevents brute force)
   */
  auth: (request: NextRequest) =>
    rateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
      message: 'Too many authentication attempts. Please wait before trying again.',
    }),
};
