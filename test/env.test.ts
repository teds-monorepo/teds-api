import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { isValidApiKey } from '../src/lib/auth.js';

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({
      SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    } as NodeJS.ProcessEnv);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
  });

  it('throws a readable error on invalid input', () => {
    expect(() => loadEnv({ PORT: '-1' } as unknown as NodeJS.ProcessEnv)).toThrow(
      /Invalid environment variables/
    );
  });

  it('requires API_KEY in production', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        SUPABASE_URL: 'http://127.0.0.1:54321',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      } as NodeJS.ProcessEnv)
    ).toThrow(/API_KEY/);
  });
});

describe('isValidApiKey', () => {
  it('rejects when not configured (fail closed)', () => {
    expect(isValidApiKey('anything', undefined)).toBe(false);
  });

  it('accepts exact match, rejects mismatch', () => {
    expect(isValidApiKey('secret', 'secret')).toBe(true);
    expect(isValidApiKey('secret', 'other')).toBe(false);
    expect(isValidApiKey('short', 'much-longer-expected')).toBe(false);
  });
});
