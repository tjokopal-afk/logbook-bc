// =========================================
// STORAGE SERVICE - File Upload & Management
// Handle uploads to Supabase Storage buckets
// =========================================

import { supabase } from '@/supabase';
import type { FileType } from '@/lib/api/types';

// =========================================
// BUCKET CONFIGURATION
// =========================================

export const BUCKETS = {
  PROJECT_DOCUMENTS: 'project-documents', // Public
  USER_MEDIA: 'user-media', // Public (avatars, logbook attachments)
  TASK_ATTACHMENTS: 'task-attachments', // Private
  USER_SIGNATURES: 'user-signatures', // Public
  LOGBOOK_PDFS: 'logbook-pdfs', // Public
} as const;

// File size limits (in bytes)
export const MAX_FILE_SIZE = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  SIGNATURE: 2 * 1024 * 1024, // 2MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  PDF: 20 * 1024 * 1024, // 20MB
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SIGNATURE: ['image/png'], // Only PNG for transparency
} as const;

// =========================================
// CORE UPLOAD FUNCTION
// =========================================

/**
 * Generic file upload function
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    upsert?: boolean;
  }
): Promise<{ path: string; url: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload file error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload file');
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete file');
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// =========================================
// FILE VALIDATION
// =========================================

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    };
  }
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: readonly string[]): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate image has transparency (for signatures)
 */
export async function validateImageTransparency(file: File): Promise<{ hasTransparency: boolean }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve({ hasTransparency: false });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Check if any pixel has alpha < 255 (transparent)
        let hasTransparency = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            hasTransparency = true;
            break;
          }
        }

        resolve({ hasTransparency });
      };
      img.onerror = () => resolve({ hasTransparency: false });
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// =========================================
// SPECIALIZED UPLOAD FUNCTIONS
// =========================================

/**
 * Upload user avatar
 * Bucket: user-media/avatars/
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Validate
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZE.AVATAR);
  if (!sizeValidation.valid) throw new Error(sizeValidation.error);

  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.IMAGE);
  if (!typeValidation.valid) throw new Error(typeValidation.error);

  // Generate unique filename
  const extension = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${extension}`;
  const path = `avatars/${fileName}`;

  // Upload
  const result = await uploadFile(BUCKETS.USER_MEDIA, path, file, { upsert: true });
  return result.url;
}

/**
 * Upload user signature (PNG with transparency)
 * Bucket: user-signatures/
 */
export async function uploadSignature(userId: string, file: File): Promise<string> {
  // Validate PNG only
  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.SIGNATURE);
  if (!typeValidation.valid) {
    throw new Error('Signature must be PNG format for transparency support');
  }

  const sizeValidation = validateFileSize(file, MAX_FILE_SIZE.SIGNATURE);
  if (!sizeValidation.valid) throw new Error(sizeValidation.error);

  // Generate filename
  const fileName = `${userId}-signature.png`;

  // Upload (upsert to replace existing)
  const result = await uploadFile(BUCKETS.USER_SIGNATURES, fileName, file, { upsert: true });
  return result.url;
}

/**
 * Upload project document
 * Bucket: project-documents/
 */
export async function uploadProjectDocument(
  projectId: string,
  file: File,
  docType: 'charter' | 'image' | 'file'
): Promise<{ url: string; path: string }> {
  // Validate size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZE.DOCUMENT);
  if (!sizeValidation.valid) throw new Error(sizeValidation.error);

  // Generate path
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `${projectId}/${fileName}`;

  // Upload
  return await uploadFile(BUCKETS.PROJECT_DOCUMENTS, path, file);
}

/**
 * Upload task attachment
 * Bucket: task-attachments/
 */
export async function uploadTaskAttachment(
  taskId: string,
  file: File
): Promise<{ url: string; path: string }> {
  // Validate size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZE.DOCUMENT);
  if (!sizeValidation.valid) throw new Error(sizeValidation.error);

  // Generate path
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `${taskId}/${fileName}`;

  // Upload
  return await uploadFile(BUCKETS.TASK_ATTACHMENTS, path, file);
}

/**
 * Upload logbook attachment
 * Bucket: user-media/logbook/
 */
export async function uploadLogbookAttachment(
  userId: string,
  entryId: string,
  file: File
): Promise<{ url: string; path: string; file_name: string; file_size: number; mime_type: string }> {
  // Validate size
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZE.DOCUMENT);
  if (!sizeValidation.valid) throw new Error(sizeValidation.error);

  // Generate path
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `logbook/${userId}/${entryId}/${fileName}`;

  // Upload
  const result = await uploadFile(BUCKETS.USER_MEDIA, path, file);

  return {
    url: result.url,
    path: result.path,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
  };
}

/**
 * Upload logbook PDF
 * Bucket: logbook-pdfs/
 */
export async function uploadLogbookPDF(
  userId: string,
  weekNumber: number,
  pdfBlob: Blob
): Promise<{ url: string; path: string }> {
  // Generate path
  const fileName = `week-${weekNumber}-${Date.now()}.pdf`;
  const path = `${userId}/${fileName}`;

  // Convert blob to file
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  // Upload
  return await uploadFile(BUCKETS.LOGBOOK_PDFS, path, file, { upsert: true });
}

// =========================================
// BATCH OPERATIONS
// =========================================

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  bucket: string,
  basePath: string,
  files: File[]
): Promise<{ url: string; path: string; file_name: string }[]> {
  const results = await Promise.all(
    files.map(async (file, index) => {
      const fileName = `${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `${basePath}/${fileName}`;
      const result = await uploadFile(bucket, path, file);
      return {
        ...result,
        file_name: file.name,
      };
    })
  );
  return results;
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) throw error;
  } catch (error) {
    console.error('Delete multiple files error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete files');
  }
}

export default {
  uploadFile,
  deleteFile,
  getPublicUrl,
  validateFileSize,
  validateFileType,
  validateImageTransparency,
  uploadAvatar,
  uploadSignature,
  uploadProjectDocument,
  uploadTaskAttachment,
  uploadLogbookAttachment,
  uploadLogbookPDF,
  uploadMultipleFiles,
  deleteMultipleFiles,
  BUCKETS,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};

// -----------------------------------------------------------------------------
// Compatibility helper for legacy callers
// Some components in the app (older FileUploader) expect a simple uploadFile(file, type)
// signature. Provide a small helper `uploadClientFile` that maps a friendly type to
// a bucket/path and uses the core `uploadFile` implementation.
// -----------------------------------------------------------------------------

/**
 * Convenience wrapper used by UI file uploaders.
 * @param file - File to upload
 * @param storageType - One of 'avatar'|'photo'|'signature'|'document'|'image'
 */
export async function uploadClientFile(
  file: File,
  storageType: 'avatar' | 'photo' | 'signature' | 'document' | 'image'
): Promise<{ url: string; path: string }> {
  // sanitize original name
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const timestamp = Date.now();

  switch (storageType) {
    case 'avatar':
    case 'photo': {
      const path = `avatars/${timestamp}-${safeName}`;
      return await uploadFile(BUCKETS.USER_MEDIA, path, file, { upsert: true });
    }
    case 'signature': {
      const path = `signatures/${timestamp}-${safeName}`;
      return await uploadFile(BUCKETS.USER_SIGNATURES, path, file, { upsert: true });
    }
    case 'document': {
      const path = `misc/${timestamp}-${safeName}`;
      return await uploadFile(BUCKETS.PROJECT_DOCUMENTS, path, file);
    }
    case 'image': {
      const path = `images/${timestamp}-${safeName}`;
      return await uploadFile(BUCKETS.USER_MEDIA, path, file);
    }
    default:
      throw new Error('Unknown storage type');
  }
}
