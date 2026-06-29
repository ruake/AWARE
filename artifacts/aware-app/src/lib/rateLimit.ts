interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRatePerSecond: number;
  lastRefillMs: number;
}

function createBucket(maxTokens: number, refillRatePerSecond: number): TokenBucket {
  return {
    tokens: maxTokens,
    maxTokens,
    refillRatePerSecond,
    lastRefillMs: Date.now(),
  };
}

function consume(bucket: TokenBucket): boolean {
  const now = Date.now();
  const elapsedSec = (now - bucket.lastRefillMs) / 1000;
  bucket.tokens = Math.min(
    bucket.maxTokens,
    bucket.tokens + elapsedSec * bucket.refillRatePerSecond,
  );
  bucket.lastRefillMs = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

export const aiRequestBucket = createBucket(10, 10 / 60);

export function checkAIRateLimit(): boolean {
  return consume(aiRequestBucket);
}

export function getAIRateLimitStatus(): { remaining: number; max: number } {
  return {
    remaining: Math.floor(aiRequestBucket.tokens),
    max: aiRequestBucket.maxTokens,
  };
}
