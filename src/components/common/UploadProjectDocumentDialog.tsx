// =========================================
// UPLOAD PROJECT DOCUMENT DIALOG
// Allows PIC to upload project-related documents
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MAX_FILE_SIZE } from '@/services/storageService';
import { supabase } from '@/supabase';

interface UploadProjectDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
}

export function UploadProjectDocumentDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  projectName,
}: UploadProjectDocumentDialogProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<'charter' | 'image' | 'file'>('file');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE.DOCUMENT) {
      toast({
        title: 'File too large',
        description: `File must be less than ${MAX_FILE_SIZE.DOCUMENT / 1024 / 1024}MB`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Get current user
      const userResult = await supabase.auth.getUser();
      const user = userResult.data?.user;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload file to user-media bucket (same as intern submissions for consistency)
      const timestamp = Date.now();
      const fileName = `${timestamp}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `project-documents/${projectId}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-media')
        .getPublicUrl(uploadData.path);

      // Save document metadata to database
      // Use exact schema: project_id, uploaded_by, doc_type, storage_path, file_name, created_at
      const { error: insertError } = await supabase.from('project_documents').insert({
        project_id: projectId,
        uploaded_by: user.id,
        doc_type: docType,
        storage_path: urlData.publicUrl, // Store the public URL in storage_path
        file_name: selectedFile.name,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Document insert error:', insertError);
        throw new Error('Failed to save document metadata');
      }

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });

      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Project Document</DialogTitle>
          <DialogDescription>
            Upload a document for {projectName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <select
              id="docType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={docType}
              onChange={(e) => setDocType(e.target.value as 'charter' | 'image' | 'file')}
            >
              <option value="file">General File</option>
              <option value="charter">Project Charter</option>
              <option value="image">Image</option>
            </select>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Select File</Label>

            {selectedFile ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-blue-50">
                <div className="flex items-center gap-2">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                  <div>
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="project-doc"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('project-doc')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports images, PDFs, and documents (max {MAX_FILE_SIZE.DOCUMENT / 1024 / 1024}MB)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !selectedFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
