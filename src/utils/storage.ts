// =========================================
// FILE STORAGE UTILITIES
// =========================================

import { supabase } from '@/supabase';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  name?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name (default: 'attachments')
 * @param folder - Optional folder path within bucket
 * @returns Upload result with path and public URL
 */
export const uploadFile = async (
  file: File,
  bucket: string = 'attachments',
  folder: string = ''
): Promise<UploadResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      url: publicUrl,
      name: file.name
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Upload multiple files
 * @param files - Array of files to upload
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @returns Array of upload results
 */
export const uploadMultipleFiles = async (
  files: File[],
  bucket: string = 'attachments',
  folder: string = ''
): Promise<UploadResult[]> => {
  const uploads = await Promise.all(
    files.map(file => uploadFile(file, bucket, folder))
  );
  return uploads;
};

/**
 * Delete a file from storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Success status
 */
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

/**
 * Get public URL for a file
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return publicUrl;
};

/**
 * Handle logbook attachments upload
 * @param files - Files to upload
 * @param userId - User ID for folder organization
 * @returns Array of attachment objects ready for database
 */
export const handleLogbookAttachments = async (
  files: File[],
  userId: string
): Promise<Array<{ bucket: string; path: string; name: string; url: string }>> => {
  const uploads = await uploadMultipleFiles(
    files,
    'attachments',
    `logbook/${userId}`
  );

  return uploads
    .filter(u => u.success)
    .map(u => ({
      bucket: 'attachments',
      path: u.path!,
      name: u.name!,
      url: u.url!
    }));
};

/**
 * Handle project document upload
 * @param file - Document file
 * @param projectId - Project ID
 * @param docType - Document type (charter, certificate, etc)
 * @returns Upload result
 */
export const handleProjectDocument = async (
  file: File,
  projectId: string,
  docType: string
): Promise<UploadResult> => {
  return uploadFile(file, 'documents', `projects/${projectId}/${docType}`);
};

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  return { valid: true };
};

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns Validation result
 */
export const validateFileSize = (
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`
    };
  }
  return { valid: true };
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
