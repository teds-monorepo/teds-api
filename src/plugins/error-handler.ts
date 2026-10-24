import type { FastifyInstance } from 'fastify';

interface HttpError {
  statusCode?: number;
  code?: string;
  message: string;
}

export async function errorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((rawErr, request, reply) => {
    const err = rawErr as HttpError;
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    const isProd = process.env.NODE_ENV === 'production';

    request.log.error({ err: rawErr, requestId: request.id }, 'request failed');

    void reply.status(statusCode).send({
      error: {
        code: err.code ?? 'INTERNAL_ERROR',
        message: statusCode >= 500 && isProd ? 'Internal server error' : err.message,
        requestId: request.id,
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send({
      error: { code: 'NOT_FOUND', message: 'Route not found', requestId: request.id },
    });
  });
}
