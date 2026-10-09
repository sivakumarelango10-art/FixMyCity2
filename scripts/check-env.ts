import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.cloud' });
dotenv.config();

console.log('--- FixMyCity Environment Check ---');

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

const REQUIRED_SERVER = [
  'DATABASE_URL',
  'STORAGE_BUCKET',
];

const OPTIONAL_CONFIG = [
  'SUPABASE_SECRET_KEY',
  'DIRECT_URL',
  'GEMINI_API_KEY',
  'DEMO_PASSWORD',
  'DEMO_MODE',
  'DEMO_PROJECT_ISOLATED',
  'APP_ENV',
];

let allOk = true;

console.log('\nChecking Public Client Variables:');
for (const key of REQUIRED_PUBLIC) {
  const val = process.env[key];
  if (!val) {
    console.log(`  ❌ MISSING: ${key}`);
    allOk = false;
  } else {
    console.log(`  ✅ SET:     ${key}`);
  }
}

console.log('\nChecking Core Server Variables:');
for (const key of REQUIRED_SERVER) {
  const val = process.env[key];
  if (!val) {
    console.log(`  ❌ MISSING: ${key}`);
    allOk = false;
  } else {
    console.log(`  ✅ SET:     ${key}`);
  }
}

console.log('\nChecking Optional / Cloud Variables:');
for (const key of OPTIONAL_CONFIG) {
  const val = process.env[key];
  if (!val) {
    console.log(`  ℹ️  UNSET:   ${key} (using fallback or optional)`);
  } else {
    console.log(`  ✅ SET:     ${key}`);
  }
}

console.log('\n-----------------------------------');
if (allOk) {
  console.log('✅ All required environment variables are configured.');
} else {
  console.log('⚠️ Some required environment variables are missing.');
  process.exit(1);
}
