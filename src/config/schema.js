import { z } from 'zod';

const envValueSchema = z.union([
  z.string(),
  z.array(z.string()),
]);

const envSchema = z.object({
  shells: z.array(z.enum(['bash', 'zsh', 'fish'])),
  values: z.record(z.string(), envValueSchema).optional().default({}),
}).strict();

const symlinksSchema = z.record(z.string(), z.string());

export const configSchema = z.object({
  env: envSchema.optional(),
  symlinks: symlinksSchema.optional(),
}).strict();
