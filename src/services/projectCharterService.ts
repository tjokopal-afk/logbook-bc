// =========================================
// PROJECT CHARTER SERVICE - PDF UPLOAD
// Handles project charter PDF uploads and management
// =========================================

import { supabase } from '@/supabase';

// =========================================
// CONSTANTS
// =========================================

const BUCKET_NAME = 'project-documents';
const FOLDER_NAME = 'project-charters';
const ALLOWED_FILE_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for PDFs

// =========================================
// FILE VALIDATION
// =========================================

/**
 * Validate project charter PDF before upload
 * Returns validation result with detailed error messages
 */
export function validateProjectCharter(file: File): { valid: boolean; error?: string } {
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
      error: `Format file tidak didukung. Hanya PDF yang diizinkan.\nFile type: ${file.type}`,
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
 * Upload project charter PDF to Supabase Storage
 * @param file - PDF file to upload
 * @param projectId - ID of the project
 * @returns Public URL and path of uploaded file
 */
export async function uploadProjectCharter(
  file: File,
  projectId: string
): Promise<{ url: string; path: string }> {
  try {
    // Validate file
    const validation = validateProjectCharter(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if current user is admin
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can upload project charters');
    }

    // Generate unique filename with timestamp
    const fileExt = 'pdf';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${FOLDER_NAME}/${projectId}/charter-${timestamp}-${randomStr}.${fileExt}`;

    // Upload to Supabase Storage with retry logic
    let uploadError: Error | null = null;
    let uploadData = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
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
    console.error('Upload project charter error:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Upload failed: Unknown error');
  }
}

// =========================================
// FILE DELETION
// =========================================

/**
 * Delete project charter PDF from Supabase Storage
 * @param path - File path to delete
 */
export async function deleteProjectCharter(path: string): Promise<void> {
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
    console.error('Delete project charter error:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Delete failed: Unknown error');
  }
}

// =========================================
// FILE URL RETRIEVAL
// =========================================

/**
 * Get public URL for a project charter
 * @param path - File path
 * @returns Public URL
 */
export function getProjectCharterUrl(path: string): string {
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
 * List project charters for a specific project
 * @param projectId - Project ID
 * @returns Array of file metadata
 */
export async function listProjectCharters(projectId: string): Promise<Array<{ name: string; size: number; url: string }>> {
  try {
    const prefix = `${FOLDER_NAME}/${projectId}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(prefix);

    if (error) {
      throw error;
    }

    if (!data) return [];

    return data
      .filter(file => file.name.endsWith('.pdf'))
      .map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        url: getProjectCharterUrl(`${prefix}/${file.name}`),
      }));
  } catch (error) {
    console.error('List project charters error:', error);
    return [];
  }
}
