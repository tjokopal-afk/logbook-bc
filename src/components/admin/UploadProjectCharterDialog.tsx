// =========================================
// UPLOAD PROJECT CHARTER DIALOG
// Admin interface for uploading project charters for interns
// =========================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { uploadProjectCharter, deleteProjectCharter } from '@/services/projectCharterService';
import { updateProfileProjectCharter, getProfileProjectCharterUrl } from '@/lib/api/profiles';
import { useToast } from '@/hooks/use-toast';

interface UploadProjectCharterDialogProps {
  isOpen: boolean;
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadProjectCharterDialog({
  isOpen,
  user,
  onClose,
  onSuccess,
}: UploadProjectCharterDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentCharterUrl, setCurrentCharterUrl] = useState<string | null>(null);

  // Load current charter URL when dialog opens
  useEffect(() => {
    const loadCurrentCharter = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const url = await getProfileProjectCharterUrl(user.id);
        setCurrentCharterUrl(url);
      } catch (err) {
        console.error('Error loading current charter:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && user) {
      loadCurrentCharter();
    }
  }, [isOpen, user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload file to storage
      const { url } = await uploadProjectCharter(file, user.id);

      // Save URL to user's profile
      await updateProfileProjectCharter(user.id, url);

      // Update local state
      setCurrentCharterUrl(url);
      setSuccess(true);

      toast({
        title: 'Success',
        description: 'Project charter uploaded successfully',
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !currentCharterUrl) return;

    setUploading(true);
    setError(null);

    try {
      // Extract file path from URL
      // Supabase URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
      const urlParts = currentCharterUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid file URL format');
      }

      const pathParts = urlParts[1].split('/');
      if (pathParts.length < 2) {
        throw new Error('Invalid file path');
      }

      // Remove bucket name from path (first element)
      const filePath = pathParts.slice(1).join('/');

      // Delete file from storage
      await deleteProjectCharter(filePath);

      // Clear URL from database
      await updateProfileProjectCharter(user.id, '');

      setCurrentCharterUrl(null);
      setSuccess(true);

      toast({
        title: 'Success',
        description: 'Project charter removed successfully',
      });

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      console.error('Delete error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setCurrentCharterUrl(null);
    onClose();
  };

  if (!user) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Upload Project Charter
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Upload a PDF project charter for {user.full_name} ({user.email})
          </p>

          <div className="space-y-4">
            {/* Current Charter Status */}
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : currentCharterUrl ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Charter Uploaded</span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  A project charter has been uploaded for this intern.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(currentCharterUrl!, '_blank')}
                    className="flex-1"
                  >
                    View PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop a PDF or click to browse
                  </p>
                  <Label htmlFor="charter-file" className="cursor-pointer">
                    <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      {uploading ? 'Uploading...' : 'Select PDF'}
                    </span>
                  </Label>
                  <Input
                    id="charter-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>

                {/* Requirements */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Format: PDF only</p>
                  <p>• Max size: 10 MB</p>
                  <p>• Required for intern project completion</p>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 rounded border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                <span className="text-sm text-green-700">
                  {currentCharterUrl ? 'Charter uploaded successfully!' : 'Charter removed successfully!'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UploadProjectCharterDialog;