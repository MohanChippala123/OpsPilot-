import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().default('./data/ops-assistant.db'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional()
});

export const env = envSchema.parse({
  ...process.env,
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-secret-change-before-production-123')
});

if (env.NODE_ENV === 'production' && env.AI_PROVIDER === 'mock') {
  console.warn('AI_PROVIDER is set to mock. Configure a real provider before inviting public users.');
}

if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
}

if (env.AI_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
}

export function allowedOrigins() {
  return (env.CORS_ORIGINS || env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
