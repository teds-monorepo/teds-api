import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { TimelineStore } from '../../lib/timeline.js';

const listQuerySchema = z.object({
  category: z.enum(['public-holiday', 'family', 'due-dates']).optional(),
});

export async function timelineRoutes(app: FastifyInstance, store: TimelineStore): Promise<void> {
  app.get('/timeline', async (request, reply) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'invalid_query',
          message: 'Query "category" must be "public-holiday", "family" or "due-dates".',
        },
      });
    }
    const events = await store.list(parsed.data.category);
    return { events };
  });
}
