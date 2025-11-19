// =========================================
// PROJECT CHARTER MANAGEMENT COMPONENT
// Upload, view, and manage project charter PDFs
// =========================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import type { Profile } from '@/lib/api/types';
import { ROLES } from '@/utils/roleConfig';
import {
  uploadProjectCharter,
  deleteProjectCharter,
  listProjectCharters,
  validateProjectCharter,
} from '@/services/projectCharterService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// =========================================
// INTERFACES
// =========================================

interface ProjectCharterFile {
  name: string;
  size: number;
  url: string;
  uploadedAt?: Date;
}

interface ProjectCharterProps {
  projectId: string;
  projectName?: string;
  editable?: boolean; // Allow upload/delete
}

// =========================================
// MAIN COMPONENT
// =========================================

const ProjectCharter: React.FC<ProjectCharterProps> = ({
  projectId,
  projectName = 'Proyek',
  editable = false,
}) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [charters, setCharters] = useState<ProjectCharterFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // =========================================
  // FETCH CURRENT USER
  // =========================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUser(profile as Profile);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // =========================================
  // FETCH CHARTERS
  // =========================================

  const fetchCharters = useCallback(async () => {
    try {
      setLoading(true);
      const charterFiles = await listProjectCharters(projectId);
      setCharters(charterFiles.map(file => ({
        ...file,
        uploadedAt: new Date(), // You could extract this from file metadata
      })));
    } catch (error) {
      console.error('Error fetching charters:', error);
      alert('Gagal memuat project charter');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCharters();
  }, [fetchCharters]);

  // =========================================
  // FILE UPLOAD
  // =========================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateProjectCharter(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'File tidak valid');
      setSelectedFile(null);
      return;
    }

    setValidationError('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Pilih file PDF terlebih dahulu');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress (since we don't have real progress from Supabase)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await uploadProjectCharter(selectedFile, projectId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      alert('Project charter berhasil diupload');
      setSelectedFile(null);
      setValidationError('');
      
      // Reset file input
      const fileInput = document.getElementById('charter-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh charter list
      fetchCharters();
    } catch (error) {
      console.error('Error uploading charter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupload charter';
      alert(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (charter: ProjectCharterFile) => {
    if (!confirm(`Hapus file "${charter.name}"?\n\nFile yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }

    try {
      // Extract path from URL
      const urlParts = charter.url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'project-documents');
      const path = urlParts.slice(bucketIndex + 1).join('/');

      await deleteProjectCharter(path);
      alert('Charter berhasil dihapus');
      fetchCharters();
    } catch (error) {
      console.error('Error deleting charter:', error);
      alert('Gagal menghapus charter');
    }
  };

  const handleDownload = (charter: ProjectCharterFile) => {
    window.open(charter.url, '_blank');
  };

  const handleView = (charter: ProjectCharterFile) => {
    window.open(charter.url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // =========================================
  // PERMISSIONS CHECK
  // =========================================

  const canEdit = editable && currentUser?.role === ROLES.ADMIN;

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Charter - {projectName}
          </CardTitle>
          <CardDescription>
            Dokumen project charter berisi ruang lingkup, tujuan, dan detail proyek
          </CardDescription>
        </CardHeader>

        {/* Upload Section */}
        {canEdit && (
          <CardContent className="border-t pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="charter-file-input" className="text-base font-semibold">
                  Upload Project Charter
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload file PDF (maksimal 10MB)
                </p>
              </div>

              {/* File Input */}
              <div className="flex items-center gap-4">
                <input
                  id="charter-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50"
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">Error Validasi:</p>
                    <p>{validationError}</p>
                  </div>
                </div>
              )}

              {/* Selected File Info */}
              {selectedFile && !validationError && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-green-800">{selectedFile.name}</p>
                      <p className="text-green-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('charter-file-input') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Charter List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Project Charter</CardTitle>
          <CardDescription>
            {charters.length} file tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat charter...
            </div>
          ) : charters.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada charter</h3>
              <p className="text-muted-foreground">
                {canEdit
                  ? 'Upload file PDF project charter untuk memulai'
                  : 'Belum ada project charter yang diupload'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {charters.map((charter, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{charter.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(charter.size)}</span>
                          {charter.uploadedAt && (
                            <>
                              <span>•</span>
                              <span>
                                {format(charter.uploadedAt, 'dd MMM yyyy', { locale: idLocale })}
                              </span>
                            </>
                          )}
                          <Badge variant="outline" className="ml-2">PDF</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(charter)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(charter)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {canEdit && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(charter)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCharter;
