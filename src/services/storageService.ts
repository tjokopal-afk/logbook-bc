// =========================================
// STORAGE SERVICE - FILE UPLOAD
// Optimized with better validation and error handling
// =========================================

import { supabase } from '@/supabase';
import type { FileType, FileUploadResult } from '@/types/logbook.types';

// =========================================
// CONSTANTS
// =========================================

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = 'user-media';

// =========================================
// FILE VALIDATION
// =========================================

/**
 * Validate file before upload
 * Returns validation result with detailed error messages
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format file tidak didukung. Gunakan JPG, PNG, atau WebP.\nFile type: ${file.type}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Ukuran file terlalu besar (${sizeMB}MB). Maksimal ${maxSizeMB}MB.`,
    };
  }

  // Check file name
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'Nama file terlalu panjang. Maksimal 255 karakter.',
    };
  }

  return { valid: true };
}

// =========================================
// FILE UPLOAD
// =========================================

/**
 * Upload file to Supabase Storage
 * @param file - File to upload
 * @param type - Type of file ('photo' or 'signature')
 * @returns Public URL and path of uploaded file
 */
export async function uploadFile(
  file: File,
  type: FileType
): Promise<FileUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    // Generate unique filename with timestamp
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${userData.user.id}/${type}-${timestamp}-${randomStr}.${fileExt}`;

    // Upload to Supabase Storage with retry logic
    let uploadError: Error | null = null;
    let uploadData = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true, // Replace if file exists
        });

      if (!error) {
        uploadData = data;
        uploadError = null;
        break;
      }

      uploadError = error;
      console.warn(`Upload attempt ${attempt + 1} failed:`, error);

      // Wait before retry (exponential backoff)
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    if (uploadError || !uploadData) {
      throw new Error(`Upload failed after 3 attempts: ${uploadError?.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
    };
  } catch (error) {
    console.error('Upload file error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Upload failed: Unknown error');
  }
}

/**
 * Delete file from Supabase Storage
 * @param path - File path to delete
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    if (!path) {
      throw new Error('File path is required');
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Delete file error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Delete failed: Unknown error');
  }
}

/**
 * Get public URL for a file path
 * @param path - File path
 * @returns Public URL
 */
export function getPublicUrl(path: string): string {
  if (!path) {
    return '';
  }

  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Get public URL error:', error);
    return '';
  }
}

/**
 * List files for current user
 * @param folder - Folder name (e.g., 'photo' or 'signature')
 * @returns Array of file metadata
 */
export async function listUserFiles(folder?: string): Promise<Array<{ name: string; size: number; url: string }>> {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const prefix = folder ? `${userData.user.id}/${folder}` : userData.user.id;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(prefix);

    if (error) {
      throw error;
    }

    if (!data) return [];

    return data.map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      url: getPublicUrl(`${prefix}/${file.name}`),
    }));
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}
