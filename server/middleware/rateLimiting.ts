import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import Redis from 'ioredis';

// Redis store for distributed rate limiting
let redisClient: Redis | null = null;

// Initialize Redis client for rate limiting (optional - falls back to memory store)
try {
  if (process.env.RATE_LIMIT_REDIS_URL) {
    redisClient = new Redis(process.env.RATE_LIMIT_REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
    });
    
    redisClient.on('error', (err) => {
      console.warn('Redis rate limit store error:', err.message);
      // Fallback to memory store on Redis failure
      redisClient = null;
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis for rate limiting, using memory store');
}

// Custom key generator that includes user identification for HIPAA compliance
const generateKey = (req: Request): string => {
  const userId = req.headers['x-user-id'] || req.ip;
  const endpoint = req.route?.path || req.path;
  return `rate_limit:${userId}:${endpoint}`;
};

// Custom error handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response): void => {
  const retryAfter = Math.round(req.rateLimit?.resetTime ?? Date.now() / 1000);
  
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: retryAfter,
    limit: req.rateLimit?.limit,
    remaining: req.rateLimit?.remaining,
    // HIPAA compliance: Log rate limit violations without exposing PHI
    timestamp: new Date().toISOString(),
  });

  // Audit log for security monitoring (without PHI)
  console.warn('Rate limit exceeded', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    endpoint: req.path,
    method: req.method,
    userId: req.headers['x-user-id'] ? '[PROTECTED]' : 'anonymous',
    timestamp: new Date().toISOString(),
  });
};

// Redis store implementation for distributed rate limiting
class RedisStore {
  constructor(private redis: Redis) {}

  async increment(key: string): Promise<{ totalHits: number; resetTime?: Date }> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      
      const results = await pipeline.exec();
      
      if (!results || results.length !== 2) {
        throw new Error('Redis pipeline failed');
      }

      const totalHits = results[0][1] as number;
      const ttl = results[1][1] as number;
      
      // Set expiration if this is the first increment
      if (totalHits === 1) {
        await this.redis.expire(key, 3600); // 1 hour default
      }

      const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;
      
      return { totalHits, resetTime };
    } catch (error) {
      console.error('Redis store error:', error);
      throw error;
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      await this.redis.decr(key);
    } catch (error) {
      console.error('Redis decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }
}

// Health data endpoints - strictest limits (100 requests/hour)
export const healthDataRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Health data access rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore(redisClient) : undefined,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// OAuth endpoints - moderate limits (10 requests/minute)
export const oauthRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Authentication rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore(redisClient) : undefined,
});

// General API endpoints - higher limits (500 requests/hour)
export const generalRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: 'API rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore(redisClient) : undefined,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Adaptive rate limiting for suspicious behavior
export const adaptiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    // Reduce limits for requests without proper authentication headers
    const hasAuth = req.headers.authorization || req.headers['x-user-id'];
    return hasAuth ? 100 : 20;
  },
  message: 'Suspicious activity detected - rate limited',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  store: redisClient ? new RedisStore(redisClient) : undefined,
});

// Apply rate limits based on endpoint patterns
export const applyRateLimitByEndpoint = (path: string) => {
  // Health data endpoints
  if (path.includes('/health-assessment') || 
      path.includes('/wearable-data') || 
      path.includes('/biological-age') ||
      path.includes('/metrics')) {
    return healthDataRateLimit;
  }
  
  // OAuth endpoints
  if (path.includes('/oauth') || 
      path.includes('/auth') || 
      path.includes('/login') ||
      path.includes('/token')) {
    return oauthRateLimit;
  }
  
  // General endpoints
  return generalRateLimit;
};

// Cleanup function for graceful shutdown
export const cleanupRateLimit = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
};