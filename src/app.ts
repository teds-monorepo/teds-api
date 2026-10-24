import type { IncomingMessage, ServerResponse } from 'node:http';
import Fastify, { LogController, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './plugins/error-handler.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './modules/health/routes.js';
import { docsRoutes } from './modules/docs/routes.js';
import { gameRoutes } from './modules/games/routes.js';
import { kvRoutes } from './modules/kv/routes.js';
import { timelineRoutes } from './modules/timeline/routes.js';
import { createClient } from '@supabase/supabase-js';
import { SupabaseKvStore, type KvStore } from './lib/kv.js';
import { SupabaseTimelineStore, type TimelineStore } from './lib/timeline.js';
import { loadEnv, type Env } from './config/env.js';

export interface BuiltApp {
  app: FastifyInstance;
  kv: KvStore;
  timeline: TimelineStore;
}

export async function buildApp(env: Env, kv?: KvStore, timeline?: TimelineStore): Promise<BuiltApp> {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    logController: new LogController({ requestIdLogLabel: 'requestId' }),
    genReqId: () =>
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  });

  await errorHandler(app);
  await authPlugin(app, env);

  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const store = kv ?? new SupabaseKvStore(client);
  const timelines = timeline ?? new SupabaseTimelineStore(client);

  await app.register(docsRoutes);
  await app.register((instance) => healthRoutes(instance, store), { prefix: '/api' });
  await app.register(gameRoutes, { prefix: '/api' });
  await app.register((instance) => kvRoutes(instance, store), { prefix: '/api/kv' });
  await app.register((instance) => timelineRoutes(instance, timelines), { prefix: '/api' });

  return { app, kv: store, timeline: timelines };
}

let instance: Promise<FastifyInstance> | undefined;

// Vercel's Fastify runtime imports this module as the entrypoint and requires a
// default export. One instance per lambda container, reused across requests.
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  instance ??= buildApp(loadEnv()).then(({ app }) => app);
  const app = await instance;
  await app.ready();
  app.server.emit('request', req, res);
}
