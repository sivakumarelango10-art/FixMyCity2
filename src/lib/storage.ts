import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

const BUCKET = env.STORAGE_BUCKET || 'complaint-photos';

/**
 * Generates a short-lived signed URL for reading a private complaint photo.
 * Defaults to 1 hour (3600 seconds) expiration.
 */
export async function getSignedPhotoUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  if (!storagePath) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      console.warn('Failed to generate signed photo URL:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed photo URL:', err);
    return null;
  }
}

/**
 * Creates a signed upload URL for client direct upload to the private staging path.
 */
export async function createStagingUploadUrl(stagingPath: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(stagingPath);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message}`);
  }

  return data;
}

/**
 * Downloads a staged file from Supabase Storage into a Node.js Buffer.
 */
export async function downloadStagedBuffer(stagingPath: string): Promise<Buffer> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(stagingPath);

  if (error || !data) {
    throw new Error(`Failed to download staged file from storage: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Uploads processed WebP buffer to the final complaints/<complaintId>/<photoId>.webp path.
 */
export async function uploadFinalPhoto(
  destinationPath: string,
  buffer: Buffer,
  contentType: string = 'image/webp'
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(destinationPath, buffer, {
      contentType,
      upsert: false,
    });

  if (error || !data) {
    throw new Error(`Failed to upload finalized photo: ${error?.message}`);
  }

  return data;
}

/**
 * Deletes objects from storage
 */
export async function deleteStorageObjects(paths: string[]) {
  if (!paths.length) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.warn('Failed to delete storage objects:', error.message);
  }
}
