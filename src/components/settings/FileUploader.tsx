// =========================================
// FILE UPLOADER COMPONENT
// Optimized with better validation and preview
// =========================================

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/services/storageService';
import type { FileType } from '@/types/logbook.types';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';

interface FileUploaderProps {
  type: FileType;
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
}

export function FileUploader({ type, currentUrl, onUploadSuccess }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const result = await uploadFile(file, type);
      onUploadSuccess(result.url);
      setError('');
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Gagal mengupload file';
      setError(errorMessage);
      setPreview(currentUrl); // Revert to previous preview
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    setError('');
    onUploadSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-2 text-xs">
          {error}
        </div>
      )}

      {preview ? (
        <div className="relative inline-block">
          <div className="w-40 h-40 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={preview}
              alt={`Preview ${type}`}
              className="w-full h-full object-cover"
            />
          </div>
          {!isUploading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full bg-white shadow-md hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={handleClick}
          >
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengupload...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {preview ? 'Ganti' : 'Upload'} {type === 'photo' ? 'Foto' : 'Tanda Tangan'}
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500">
        Format: JPG, PNG, WebP. Maksimal 5MB.
      </p>
    </div>
  );
}
