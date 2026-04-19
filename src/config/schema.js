import { z } from 'zod';

const envValuesSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())])).superRefine((values, ctx) => {
  for (const [key, val] of Object.entries(values)) {
    if (Array.isArray(val) && key !== 'PATH') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `只有 PATH 支持数组值，"${key}" 必须是字符串`,
      });
    }
  }
});

const envSchema = z.object({
  shells: z.array(z.enum(['bash', 'zsh', 'fish'])),
  values: envValuesSchema.optional().default({}),
}).strict();

const symlinksSchema = z.record(z.string(), z.string());

export const configSchema = z.object({
  env: envSchema.optional(),
  symlinks: symlinksSchema.optional(),
}).strict();
