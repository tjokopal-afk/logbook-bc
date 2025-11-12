// =========================================
// DOCUMENT SERVICE - Project Document Management
// Handle project documents with storage integration
// =========================================

import { supabase } from '@/supabase';
import type { ProjectDocument } from '@/lib/api/types';
import { uploadProjectDocument, deleteFile, BUCKETS } from './storageService';

// =========================================
// DOCUMENT CRUD OPERATIONS
// =========================================

/**
 * Create a project document
 * Uploads file to storage and creates database record
 */
export async function createProjectDocument(
  projectId: string,
  file: File,
  docType: 'charter' | 'report' | 'presentation' | 'other',
  uploadedBy: string,
  description?: string
): Promise<ProjectDocument> {
  try {
    // Map docType to storage type
    const storageType: 'charter' | 'image' | 'file' = 
      docType === 'charter' ? 'charter' : 'file';

    // Upload file to storage
    const { path, url } = await uploadProjectDocument(projectId, file, storageType);

    // Create database record
    const { data, error } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_path: path,
        file_url: url,
        file_size: file.size,
        file_type: file.type,
        doc_type: docType,
        uploaded_by: uploadedBy,
        description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProjectDocument;
  } catch (error) {
    console.error('Create project document error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create document');
  }
}

/**
 * Get all documents for a project
 */
export async function getProjectDocuments(
  projectId: string,
  docType?: ProjectDocument['doc_type']
): Promise<ProjectDocument[]> {
  try {
    let query = supabase
      .from('project_documents')
      .select(`
        *,
        uploader:users!project_documents_uploaded_by_fkey(full_name, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (docType) {
      query = query.eq('doc_type', docType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ProjectDocument[];
  } catch (error) {
    console.error('Get project documents error:', error);
    return [];
  }
}

/**
 * Get a specific document by ID
 */
export async function getDocumentById(documentId: string): Promise<ProjectDocument | null> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select(`
        *,
        uploader:users!project_documents_uploaded_by_fkey(full_name, email),
        project:projects!project_documents_project_id_fkey(name)
      `)
      .eq('id', documentId)
      .single();

    if (error) throw error;
    return data as ProjectDocument;
  } catch (error) {
    console.error('Get document by id error:', error);
    return null;
  }
}

/**
 * Update document metadata
 */
export async function updateDocumentMetadata(
  documentId: string,
  updates: {
    doc_type?: ProjectDocument['doc_type'];
    description?: string;
  }
): Promise<ProjectDocument> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectDocument;
  } catch (error) {
    console.error('Update document metadata error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update document');
  }
}

/**
 * Delete a document (removes from storage and database)
 */
export async function deleteProjectDocument(documentId: string): Promise<void> {
  try {
    // Get document info first
    const { data: doc, error: fetchError } = await supabase
      .from('project_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!doc) throw new Error('Document not found');

    // Delete from storage
    await deleteFile(BUCKETS.PROJECT_DOCUMENTS, doc.file_path);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Delete project document error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete document');
  }
}

/**
 * Replace an existing document with a new file
 */
export async function replaceProjectDocument(
  documentId: string,
  newFile: File,
  uploadedBy: string
): Promise<ProjectDocument> {
  try {
    // Get existing document
    const { data: existingDoc, error: fetchError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;
    if (!existingDoc) throw new Error('Document not found');

    // Delete old file from storage
    await deleteFile(BUCKETS.PROJECT_DOCUMENTS, existingDoc.file_path);

    // Map docType to storage type
    const storageType: 'charter' | 'image' | 'file' = 
      existingDoc.doc_type === 'charter' ? 'charter' : 'file';

    // Upload new file
    const { path, url } = await uploadProjectDocument(
      existingDoc.project_id,
      newFile,
      storageType
    );

    // Update database record
    const { data, error } = await supabase
      .from('project_documents')
      .update({
        file_name: newFile.name,
        file_path: path,
        file_url: url,
        file_size: newFile.size,
        file_type: newFile.type,
        uploaded_by: uploadedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectDocument;
  } catch (error) {
    console.error('Replace project document error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to replace document');
  }
}

// =========================================
// SPECIALIZED QUERIES
// =========================================

/**
 * Get project charter document
 */
export async function getProjectCharter(projectId: string): Promise<ProjectDocument | null> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('doc_type', 'charter')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data as ProjectDocument | null;
  } catch (error) {
    console.error('Get project charter error:', error);
    return null;
  }
}

/**
 * Get recent documents across all projects (for dashboard)
 */
export async function getRecentDocuments(limit: number = 10): Promise<ProjectDocument[]> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select(`
        *,
        uploader:users!project_documents_uploaded_by_fkey(full_name, email),
        project:projects!project_documents_project_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ProjectDocument[];
  } catch (error) {
    console.error('Get recent documents error:', error);
    return [];
  }
}

/**
 * Get documents uploaded by a specific user
 */
export async function getUserDocuments(userId: string): Promise<ProjectDocument[]> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select(`
        *,
        project:projects!project_documents_project_id_fkey(name)
      `)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProjectDocument[];
  } catch (error) {
    console.error('Get user documents error:', error);
    return [];
  }
}

/**
 * Get document statistics for a project
 */
export async function getProjectDocumentStats(projectId: string): Promise<{
  totalDocuments: number;
  totalSize: number;
  documentsByType: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select('doc_type, file_size')
      .eq('project_id', projectId);

    if (error) throw error;

    const documents = (data || []) as ProjectDocument[];

    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

    const documentsByType: Record<string, number> = {};
    documents.forEach(doc => {
      documentsByType[doc.doc_type] = (documentsByType[doc.doc_type] || 0) + 1;
    });

    return {
      totalDocuments,
      totalSize,
      documentsByType,
    };
  } catch (error) {
    console.error('Get project document stats error:', error);
    return {
      totalDocuments: 0,
      totalSize: 0,
      documentsByType: {},
    };
  }
}

/**
 * Search documents by file name
 */
export async function searchDocuments(
  searchTerm: string,
  projectId?: string
): Promise<ProjectDocument[]> {
  try {
    let query = supabase
      .from('project_documents')
      .select(`
        *,
        uploader:users!project_documents_uploaded_by_fkey(full_name, email),
        project:projects!project_documents_project_id_fkey(name)
      `)
      .ilike('file_name', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ProjectDocument[];
  } catch (error) {
    console.error('Search documents error:', error);
    return [];
  }
}

// =========================================
// BATCH OPERATIONS
// =========================================

/**
 * Delete all documents for a project
 * Used when deleting a project
 */
export async function deleteAllProjectDocuments(projectId: string): Promise<number> {
  try {
    // Get all documents for the project
    const { data: documents, error: fetchError } = await supabase
      .from('project_documents')
      .select('id, file_path')
      .eq('project_id', projectId);

    if (fetchError) throw fetchError;
    if (!documents || documents.length === 0) return 0;

    // Delete files from storage
    for (const doc of documents) {
      try {
        await deleteFile(BUCKETS.PROJECT_DOCUMENTS, doc.file_path);
      } catch (error) {
        console.error(`Failed to delete file ${doc.file_path}:`, error);
        // Continue with other deletions
      }
    }

    // Delete all records from database
    const { error: deleteError } = await supabase
      .from('project_documents')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) throw deleteError;

    return documents.length;
  } catch (error) {
    console.error('Delete all project documents error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete documents');
  }
}

/**
 * Get storage usage for a project
 */
export async function getProjectStorageUsage(projectId: string): Promise<{
  totalBytes: number;
  totalMB: number;
  totalGB: number;
  documentCount: number;
}> {
  try {
    const { data, error } = await supabase
      .from('project_documents')
      .select('file_size')
      .eq('project_id', projectId);

    if (error) throw error;

    const documents = (data || []) as ProjectDocument[];
    const totalBytes = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

    return {
      totalBytes,
      totalMB: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
      totalGB: Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100,
      documentCount: documents.length,
    };
  } catch (error) {
    console.error('Get project storage usage error:', error);
    return {
      totalBytes: 0,
      totalMB: 0,
      totalGB: 0,
      documentCount: 0,
    };
  }
}

export default {
  createProjectDocument,
  getProjectDocuments,
  getDocumentById,
  updateDocumentMetadata,
  deleteProjectDocument,
  replaceProjectDocument,
  getProjectCharter,
  getRecentDocuments,
  getUserDocuments,
  getProjectDocumentStats,
  searchDocuments,
  deleteAllProjectDocuments,
  getProjectStorageUsage,
};
