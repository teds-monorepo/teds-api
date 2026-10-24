import type { FastifyInstance } from 'fastify';
import type { KvStore } from '../../lib/kv.js';
import { clampLimit, listQuerySchema, writeBodySchema } from './schemas.js';

export async function kvRoutes(app: FastifyInstance, kv: KvStore): Promise<void> {
  app.get('/', async (request) => {
    const query = listQuerySchema.parse(request.query);
    const result = await kv.list(query.prefix, clampLimit(query.limit), query.cursor);
    return result;
  });

  app.get('/*', async (request, reply) => {
    const key = (request.params as { '*': string })['*'];
    if (!key) {
      return reply
        .status(400)
        .send({ error: { code: 'missing_key', message: 'Missing key in path.' } });
    }
    const value = await kv.get(key);
    if (value === undefined) {
      return reply
        .status(404)
        .send({ error: { code: 'not_found', message: `No value stored for key "${key}".` } });
    }
    return { key, value };
  });

  app.put('/*', async (request, reply) => {
    const key = (request.params as { '*': string })['*'];
    if (!key) {
      return reply
        .status(400)
        .send({ error: { code: 'missing_key', message: 'Missing key in path.' } });
    }
    const parsed = writeBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'invalid_body',
          message: 'Body must be {"value": <anything>, "expirationTtl"?: <seconds >= 60>}.',
        },
      });
    }
    await kv.put(key, parsed.data.value, parsed.data.expirationTtl);
    return { key, stored: true, expirationTtl: parsed.data.expirationTtl ?? null };
  });

  app.delete('/*', async (request, reply) => {
    const key = (request.params as { '*': string })['*'];
    if (!key) {
      return reply
        .status(400)
        .send({ error: { code: 'missing_key', message: 'Missing key in path.' } });
    }
    await kv.delete(key);
    return reply.status(204).send();
  });
}
