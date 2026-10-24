import { z } from 'zod';

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 1000;
export const MIN_TTL_SECONDS = 60;

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().default(DEFAULT_LIMIT),
  cursor: z.string().optional(),
  prefix: z.string().optional(),
});

export const writeBodySchema = z.object({
  value: z.unknown(),
  expirationTtl: z.number().int().min(MIN_TTL_SECONDS).optional(),
});

export function clampLimit(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(raw), MAX_LIMIT);
}
