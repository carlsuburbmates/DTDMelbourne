// ============================================================================
// DTD Phase 2: API Contract - Rate Limiting
// File: src/lib/rate-limit.ts
// Description: Rate limiting strategies
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number; // Seconds until retry
}

/**
 * Rate limit store entry
 */
interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

/**
 * Rate limit store
 */
interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  delete(key: string): void;
  clear(): void;
}

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

/**
 * In-memory rate limit store
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

/**
 * Rate limiter class
 */
export class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = config;
    this.store = store || new MemoryRateLimitStore();
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string): RateLimitResult {
    const now = new Date();
    const entry = this.store.get(identifier);

    // If no entry exists, create new one
    if (!entry) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: new Date(now.getTime() + this.config.windowMs),
      };
      this.store.set(identifier, newEntry);

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        reset: newEntry.resetAt,
      };
    }

    // Check if window has expired
    if (entry.resetAt <= now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: new Date(now.getTime() + this.config.windowMs),
      };
      this.store.set(identifier, newEntry);

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        reset: newEntry.resetAt,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: entry.resetAt,
        retryAfter,
      };
    }

    // Increment count
    entry.count += 1;
    this.store.set(identifier, entry);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      reset: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear();
  }
}

// ============================================================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================================================

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Public endpoints (100 requests per minute)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  // Search endpoints (30 requests per minute)
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },

  // Authentication endpoints (5 requests per minute)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },

  // Trainer endpoints (60 requests per minute)
  trainer: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Admin endpoints (120 requests per minute)
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
  },

  // Emergency endpoints (10 requests per minute)
  emergency: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // Webhook endpoints (100 requests per minute)
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const;

/**
 * Create rate limiters for different endpoint types
 */
export const RateLimiters = {
  public: new RateLimiter(RateLimitConfigs.public),
  search: new RateLimiter(RateLimitConfigs.search),
  auth: new RateLimiter(RateLimitConfigs.auth),
  trainer: new RateLimiter(RateLimitConfigs.trainer),
  admin: new RateLimiter(RateLimitConfigs.admin),
  emergency: new RateLimiter(RateLimitConfigs.emergency),
  webhook: new RateLimiter(RateLimitConfigs.webhook),
};

// ============================================================================
// IDENTIFIER GENERATORS
// ============================================================================

/**
 * Generate identifier from IP address
 */
export function generateIpIdentifier(ip: string): string {
  return `ip:${ip}`;
}

/**
 * Generate identifier from user ID
 */
export function generateUserIdIdentifier(userId: string): string {
  return `user:${userId}`;
}

/**
 * Generate identifier from API key
 */
export function generateApiKeyIdentifier(apiKey: string): string {
  return `apikey:${apiKey}`;
}

/**
 * Generate identifier from IP and user ID
 */
export function generateCombinedIdentifier(ip: string, userId?: string): string {
  return userId ? `ip:${ip}:user:${userId}` : `ip:${ip}`;
}

/**
 * Generate identifier from request
 */
export function generateRequestIdentifier(
  ip: string,
  userId?: string,
  endpoint?: string
): string {
  const parts = [`ip:${ip}`];
  if (userId) parts.push(`user:${userId}`);
  if (endpoint) parts.push(`endpoint:${endpoint}`);
  return parts.join(':');
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Try various headers for IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default IP (should not happen in production)
  return 'unknown';
}

/**
 * Check rate limit and throw error if exceeded
 */
export function checkRateLimitOrThrow(
  limiter: RateLimiter,
  identifier: string
): RateLimitResult {
  const result = limiter.check(identifier);

  if (!result.success) {
    const error = new RateLimitExceededError(
      'Rate limit exceeded',
      result.retryAfter
    );
    throw error;
  }

  return result;
}

/**
 * Rate limit exceeded error
 */
export class RateLimitExceededError extends Error {
  public readonly retryAfter?: number;
  public readonly statusCode = 429;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'RateLimitExceededError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Format rate limit headers
 */
export function formatRateLimitHeaders(result: RateLimitResult): {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
} {
  const headers: {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'Retry-After'?: string;
  } = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.reset.getTime() / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  identifierGenerator: (request: Request) => string
) {
  return async (request: Request): Promise<RateLimitResult> => {
    const identifier = identifierGenerator(request);
    return checkRateLimitOrThrow(limiter, identifier);
  };
}

// ============================================================================
// SLIDING WINDOW RATE LIMITER
// ============================================================================

/**
 * Sliding window rate limiter (more accurate than fixed window)
 */
export class SlidingWindowRateLimiter {
  private store: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed using sliding window
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing timestamps
    let timestamps = this.store.get(identifier) || [];

    // Remove timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      const oldestTimestamp = timestamps[0];
      const retryAfter = Math.ceil((oldestTimestamp + this.config.windowMs - now) / 1000);

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: new Date(oldestTimestamp + this.config.windowMs),
        retryAfter,
      };
    }

    // Add current timestamp
    timestamps.push(now);
    this.store.set(identifier, timestamps);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - timestamps.length,
      reset: new Date(now + this.config.windowMs),
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear();
  }
}

// ============================================================================
// TOKEN BUCKET RATE LIMITER
// ============================================================================

/**
 * Token bucket rate limiter (allows bursts)
 */
export class TokenBucketRateLimiter {
  private store: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private config: RateLimitConfig;
  private refillRate: number; // Tokens per millisecond

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.refillRate = config.maxRequests / config.windowMs;
  }

  /**
   * Check if request is allowed using token bucket
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry) {
      // Create new bucket
      this.store.set(identifier, {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
      });

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        reset: new Date(now + this.config.windowMs),
      };
    }

    // Refill tokens
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    entry.tokens = Math.min(
      this.config.maxRequests,
      entry.tokens + tokensToAdd
    );
    entry.lastRefill = now;

    // Check if tokens available
    if (entry.tokens < 1) {
      const retryAfter = Math.ceil((1 - entry.tokens) / this.refillRate);

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: new Date(now + retryAfter),
        retryAfter,
      };
    }

    // Consume token
    entry.tokens -= 1;
    this.store.set(identifier, entry);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: Math.floor(entry.tokens),
      reset: new Date(now + this.config.windowMs),
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear();
  }
}

// ============================================================================
// EXPORT ALL CLASSES AND FUNCTIONS
// ============================================================================

export {
  RateLimiter,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  MemoryRateLimitStore,
  RateLimitExceededError,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Rate limiter class with in-memory store
// 2. Pre-configured rate limiters for different endpoint types
// 3. Identifier generators for IP, user ID, API key
// 4. Middleware helpers for Next.js API routes
// 5. Sliding window rate limiter for more accurate limiting
// 6. Token bucket rate limiter for burst handling
// 7. Based on DOCS/05_DATA_AND_API_CONTRACTS.md
// ============================================================================
