import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkAIRateLimit, getAIRateLimitStatus, aiRequestBucket } from '../rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset bucket
    aiRequestBucket.tokens = aiRequestBucket.maxTokens;
    aiRequestBucket.lastRefillMs = Date.now();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow calls within limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkAIRateLimit()).toBe(true);
    }
    expect(getAIRateLimitStatus().remaining).toBe(0);
  });

  it('should block calls exceeding limit', () => {
    for (let i = 0; i < 10; i++) {
      checkAIRateLimit();
    }
    expect(checkAIRateLimit()).toBe(false);
  });

  it('should refill tokens over time', () => {
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      checkAIRateLimit();
    }
    expect(checkAIRateLimit()).toBe(false);

    // Advance time by 6 seconds. 
    // refillRatePerSecond is 10/60 = 1/6 tokens per second.
    // 6 seconds * 1/6 tokens/sec = 1 token.
    vi.advanceTimersByTime(6000);

    expect(checkAIRateLimit()).toBe(true);
    expect(checkAIRateLimit()).toBe(false);
  });

  it('should not exceed maxTokens on refill', () => {
    vi.advanceTimersByTime(1000000); // Way past refill time
    expect(getAIRateLimitStatus().remaining).toBe(10);
  });
});
