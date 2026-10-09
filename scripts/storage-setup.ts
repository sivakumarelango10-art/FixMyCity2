import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.cloud' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
const bucketName = process.env.STORAGE_BUCKET || 'complaint-photos';

async function setupStorage() {
  console.log('--- FixMyCity Supabase Storage Provisioning ---');

  if (!supabaseUrl || !supabaseSecret) {
    console.warn(
      '⚠️  SUPABASE_SECRET_KEY or NEXT_PUBLIC_SUPABASE_URL not configured.\n' +
      '   Skipping remote Supabase storage provisioning. Local storage fallback will be used.'
    );
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    const existing = buckets.find((b) => b.name === bucketName || b.id === bucketName);

    if (existing) {
      console.log(`✅ Bucket "${bucketName}" already exists. Ensuring private settings...`);
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (updateError) {
        console.warn('⚠️ Could not update bucket settings:', updateError.message);
      } else {
        console.log(`✅ Bucket "${bucketName}" verified as private with 5MB limit.`);
      }
    } else {
      console.log(`Creating private bucket "${bucketName}"...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
      } else {
        console.log(`✅ Private bucket "${bucketName}" created successfully.`);
      }
    }
  } catch (err: any) {
    console.error('❌ Unexpected error provisioning storage:', err.message);
  }
}

setupStorage();
