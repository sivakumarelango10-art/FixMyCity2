import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// Load .env, .env.local, .env.cloud
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.cloud' });
dotenv.config();

const migrationUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5433/fixmycity?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: migrationUrl,
  },
});
