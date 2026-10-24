import type { FastifyInstance, FastifyRequest } from 'fastify';
import { isValidApiKey } from '../lib/auth.js';
import type { Env } from '../config/env.js';

const PUBLIC_ROUTES = new Set(['/api/health']);

export async function authPlugin(app: FastifyInstance, env: Env): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest, reply) => {
    if (request.method === 'OPTIONS') return;
    const pathname = request.url.split('?')[0];
    if (!pathname.startsWith('/api/')) return;

    const known =
      PUBLIC_ROUTES.has(pathname) ||
      pathname === '/api/fetch-free-games' ||
      pathname === '/api/timeline' ||
      pathname === '/api/kv' ||
      pathname.startsWith('/api/kv/');
    if (!known) return;

    if (PUBLIC_ROUTES.has(pathname)) return;

    const apiKey = request.headers['x-api-key'];
    const provided = Array.isArray(apiKey) ? apiKey[0] : apiKey;
    if (!isValidApiKey(provided ?? null, env.API_KEY)) {
      void reply
        .status(401)
        .send({ error: { code: 'unauthorized', message: 'Missing or invalid X-API-Key.' } });
    }
  });
}
