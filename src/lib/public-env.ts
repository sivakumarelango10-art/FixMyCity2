import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

const rawPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder_pub_key',
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

export const publicEnv = publicEnvSchema.parse(rawPublicEnv);
