import { supabase } from '@/lib/supabase/client';

export interface UploadResult {
    url: string | null;
    error: Error | null;
}

/**
 * Upload a file to Supabase Storage
 * @param file The file object to upload
 * @param bucket The storage bucket name (default: 'uploads')
 * @param path Optional path within the bucket (e.g., 'avatars/user-123.png')
 */
export async function uploadFile(
    file: File,
    bucket: string = 'uploads',
    path?: string
): Promise<UploadResult> {
    try {
        // Generate a unique path if not provided
        const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false // Don't overwrite by default
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return { url: publicUrlData.publicUrl, error: null };

    } catch (err) {
        console.error('Upload failed:', err);
        return { url: null, error: err as Error };
    }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
    files: File[],
    bucket: string = 'uploads'
): Promise<UploadResult[]> {
    const results = await Promise.all(
        files.map(file => uploadFile(file, bucket))
    );
    return results;
}
