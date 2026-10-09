import 'server-only';
import { z } from 'zod';
import { publicEnv } from './public-env';

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  SUPABASE_SECRET_KEY: z.string().optional(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // AI
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Storage
  STORAGE_BUCKET: z.string().default('complaint-photos'),

  // Demo Environment & Showcase
  DEMO_PASSWORD: z.string().optional(),
  DEMO_MODE: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  DEMO_PROJECT_ISOLATED: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((val) => val === 'true' || val === '1'),

  // App Environment
  APP_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const rawServerEnv = {
  ...publicEnv,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/fixmycity?schema=public',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/fixmycity?schema=public',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'complaint-photos',
  DEMO_PASSWORD: process.env.DEMO_PASSWORD,
  DEMO_MODE: process.env.DEMO_MODE || 'true',
  DEMO_PROJECT_ISOLATED: process.env.DEMO_PROJECT_ISOLATED || 'false',
  APP_ENV: (process.env.APP_ENV as 'development' | 'staging' | 'production' | 'test') || 'development',
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
};

const parsed = serverEnvSchema.safeParse(rawServerEnv);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Environment validation failed:\n${issues}`);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDemoAllowed:
    parsed.data.DEMO_MODE &&
    (parsed.data.NODE_ENV !== 'production' || parsed.data.DEMO_PROJECT_ISOLATED),
};
