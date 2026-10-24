import type { FastifyInstance } from 'fastify';
import type { KvStore } from '../../lib/kv.js';

export async function healthRoutes(app: FastifyInstance, kv: KvStore): Promise<void> {
  app.get('/health', async () => {
    let kvStatus: 'ok' | 'unavailable' = 'ok';
    try {
      await kv.list(undefined, 1);
    } catch (err) {
      app.log.error({ err }, 'KV healthcheck failed');
      kvStatus = 'unavailable';
    }
    return { status: 'ok', kv: kvStatus, time: new Date().toISOString() };
  });
}
