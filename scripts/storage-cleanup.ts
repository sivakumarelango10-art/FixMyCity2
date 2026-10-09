import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.cloud' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
const bucketName = process.env.STORAGE_BUCKET || 'complaint-photos';

async function cleanupStorage() {
  console.log('--- FixMyCity Storage Staging Cleanup ---');

  if (!supabaseUrl || !supabaseSecret) {
    console.log('ℹ️ Remote Supabase credentials not set. Nothing to clean.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: files, error } = await supabase.storage.from(bucketName).list('staging', {
      limit: 100,
    });

    if (error) {
      console.warn('⚠️ Staging list error:', error.message);
      return;
    }

    const now = Date.now();
    const expiryAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    const stalePaths: string[] = [];

    for (const file of files || []) {
      if (file.created_at) {
        const fileAge = now - new Date(file.created_at).getTime();
        if (fileAge > expiryAgeMs) {
          stalePaths.push(`staging/${file.name}`);
        }
      }
    }

    if (stalePaths.length > 0) {
      console.log(`Found ${stalePaths.length} stale staging files. Deleting...`);
      const { error: delErr } = await supabase.storage.from(bucketName).remove(stalePaths);
      if (delErr) {
        console.error('❌ Failed to delete stale files:', delErr.message);
      } else {
        console.log(`✅ Deleted ${stalePaths.length} stale staging files.`);
      }
    } else {
      console.log('✅ No stale staging files found.');
    }
  } catch (err: any) {
    console.error('❌ Cleanup error:', err.message);
  }
}

cleanupStorage();
