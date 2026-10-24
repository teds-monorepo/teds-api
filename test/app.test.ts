import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import type { KvStore } from '../src/lib/kv.js';
import type { TimelineEvent, TimelineStore } from '../src/lib/timeline.js';

function testEnv(extra: Record<string, string> = {}) {
  return loadEnv({
    NODE_ENV: 'test',
    PORT: '3001',
    HOST: '127.0.0.1',
    CORS_ORIGINS: 'http://localhost:5173',
    LOG_LEVEL: 'error',
    API_KEY: 'test-key',
    SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    ...extra,
  } as unknown as NodeJS.ProcessEnv);
}

class MemoryKvStore implements KvStore {
  private data = new Map<string, { value: unknown; expiresAt: number | null }>();

  async get(key: string): Promise<unknown> {
    const entry = this.data.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.data.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async put(key: string, value: unknown, expirationTtl?: number): Promise<void> {
    this.data.set(key, {
      value,
      expiresAt: expirationTtl === undefined ? null : Date.now() + expirationTtl * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async list(prefix?: string, limit = 100, cursor?: string) {
    const names = [...this.data.keys()]
      .filter((k) => (!prefix || k.startsWith(prefix)) && (!cursor || k > cursor))
      .sort()
      .slice(0, limit + 1);
    const page = names.slice(0, limit);
    return {
      keys: page.map((name) => ({ name, expiration: null })),
      cursor: names.length > limit ? page[page.length - 1] : null,
    };
  }
}

class MemoryTimelineStore implements TimelineStore {
  private events: TimelineEvent[] = [
    {
      id: '1',
      name: 'Ngày Quốc Khánh',
      solar_date: '2026-09-02',
      lunar_date: '',
      type: 'solar',
      icon: '🎗️',
      note: 'National Day',
      category: 'public-holiday',
    },
    {
      id: '2',
      name: 'Sinh nhật mẹ',
      solar_date: '2026-10-20',
      lunar_date: '',
      type: 'solar',
      icon: '🎂',
      note: 'Family birthday',
      category: 'family',
    },
  ];

  async list(category?: string): Promise<TimelineEvent[]> {
    return category ? this.events.filter((e) => e.category === category) : [...this.events];
  }
}

function buildTestApp(timeline?: TimelineStore) {
  return buildApp(testEnv(), new MemoryKvStore(), timeline ?? new MemoryTimelineStore());
}

describe('timeline endpoints', () => {
  const headers = { 'x-api-key': 'test-key' };

  it('requires API key', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/timeline' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('lists all events without filter', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/timeline', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().events).toHaveLength(2);
    await app.close();
  });

  it('filters by category', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/timeline?category=family', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().events.map((e: TimelineEvent) => e.name)).toEqual(['Sinh nhật mẹ']);
    await app.close();
  });

  it('rejects unknown category', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/timeline?category=party', headers });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toHaveProperty('error.code', 'invalid_query');
    await app.close();
  });
});

describe('health endpoints', () => {
  it('GET /api/health is public', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
    await app.close();
  });
});

describe('auth', () => {
  it('rejects protected routes without API key', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/kv' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error.code', 'unauthorized');
    await app.close();
  });

  it('rejects wrong API key', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/kv',
      headers: { 'x-api-key': 'wrong' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('unknown route returns NOT_FOUND envelope', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toHaveProperty('error.code', 'NOT_FOUND');
    await app.close();
  });
});

describe('kv endpoints', () => {
  const headers = { 'x-api-key': 'test-key' };

  it('PUT then GET then DELETE round-trips', async () => {
    const { app } = await buildTestApp();
    const put = await app.inject({
      method: 'PUT',
      url: '/api/kv/jobs/42',
      headers,
      payload: { value: { status: 'done' } },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json()).toMatchObject({ key: 'jobs/42', stored: true });

    const get = await app.inject({ method: 'GET', url: '/api/kv/jobs/42', headers });
    expect(get.statusCode).toBe(200);
    expect(get.json()).toEqual({ key: 'jobs/42', value: { status: 'done' } });

    const del = await app.inject({ method: 'DELETE', url: '/api/kv/jobs/42', headers });
    expect(del.statusCode).toBe(204);

    const missing = await app.inject({ method: 'GET', url: '/api/kv/jobs/42', headers });
    expect(missing.statusCode).toBe(404);
    await app.close();
  });

  it('rejects TTL below minimum', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({
      method: 'PUT',
      url: '/api/kv/a',
      headers,
      payload: { value: 1, expirationTtl: 10 },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('lists keys with prefix', async () => {
    const { app } = await buildTestApp();
    await app.inject({ method: 'PUT', url: '/api/kv/jobs/1', headers, payload: { value: 1 } });
    await app.inject({ method: 'PUT', url: '/api/kv/other/2', headers, payload: { value: 2 } });
    const res = await app.inject({ method: 'GET', url: '/api/kv?prefix=jobs/', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().keys.map((k: { name: string }) => k.name)).toEqual(['jobs/1']);
    await app.close();
  });
});
