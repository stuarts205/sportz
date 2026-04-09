import { z } from "zod";

const nonNegativeInt = z.coerce.number().int().nonnegative();

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: nonNegativeInt,
  sequence: nonNegativeInt,
  period: z.string().min(1),
  eventType: z.string().min(1),
  actor: z.string().min(1).optional(),
  team: z.string().min(1).optional(),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});
