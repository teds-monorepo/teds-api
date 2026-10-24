import type { FastifyInstance } from 'fastify';
import { fetchFreeGames } from './free-games.js';

export async function gameRoutes(app: FastifyInstance): Promise<void> {
  app.get('/fetch-free-games', async (_request, reply) => {
    try {
      return await fetchFreeGames();
    } catch (err) {
      app.log.error({ err }, 'fetch-free-games failed');
      return reply.status(502).send({
        error: {
          code: 'upstream_failed',
          message: 'Could not fetch data from Epic or Steam.',
        },
      });
    }
  });
}
