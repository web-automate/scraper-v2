import { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
  whitelist?: string[];        
  skip?: (req: Request) => boolean;
};

const DEFAULT_WINDOW = 60_000;
const DEFAULT_MAX = 10;

export function rateLimit(options?: RateLimitOptions) {
  const { 
    windowMs = DEFAULT_WINDOW, 
    max = DEFAULT_MAX, 
    keyGenerator,
    whitelist = [],
    skip
  } = options || {};

  const hits: Map<string, { count: number; resetAt: number }> = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits) {
      if (now > record.resetAt) hits.delete(key);
    }
  }, Math.max(1000, windowMs));

  cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (skip && skip(req)) return next();

      const origin = req.headers.origin as string;
      const referer = req.headers.referer as string;
      const currentPath = req.path;

      const isWhitelisted = whitelist.some((item) => {
        if (item.startsWith('/')) {
          return currentPath === item;
        }
        return (origin && origin.startsWith(item)) || (referer && referer.startsWith(item));
      });

      if (isWhitelisted) return next();

      const key = keyGenerator 
        ? keyGenerator(req) 
        : (req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown');
      
      const now = Date.now();
      const current = hits.get(key);

      if (!current || now > current.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        current.count += 1;
        hits.set(key, current);
      }

      const record = hits.get(key)!;

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

      if (record.count > max) {
        return res.status(429).json({ 
          success: false, 
          error: 'Too many requests, please try again later.',
          retryAfter: `${Math.ceil((record.resetAt - now) / 1000)}s`
        });
      }

      next();
    } catch (err) {
      next();
    }
  };
}