// =========================================
// TASK SUBMISSION DIALOG
// Allow members to submit tasks with comment and document
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileText, X } from 'lucide-react';
import { supabase } from '@/supabase';

interface TaskSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  onSuccess: () => void;
}

export function TaskSubmissionDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  onSuccess,
}: TaskSubmissionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    // Reset file input
    const fileInput = document.getElementById('submission-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}_${Date.now()}.${fileExt}`;
      // Use user-specific folder structure
      const filePath = `task-submissions/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting if needed
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert('Please add a comment about your submission');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl: string | null = null;

      // Upload file if provided
      if (file) {
        try {
          setUploadProgress(30);
          fileUrl = await uploadFileToSupabase(file);
          setUploadProgress(60);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          // Continue with submission even if file upload fails
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          
          if (errorMessage.includes('row-level security') || errorMessage.includes('RLS')) {
            alert('⚠️ File upload failed due to storage permissions.\n\nThe task will be submitted with your comment only. Please contact your administrator to enable file uploads.\n\nTechnical details: The user-media bucket needs RLS policies to allow authenticated users to upload files.');
          } else {
            alert(`⚠️ File upload failed: ${errorMessage}\n\nThe task will be submitted with your comment only.`);
          }
          fileUrl = null; // Continue without file
        }
      }

      // Update task with submission data
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          submission_comment: comment,
          submission_bucket_url: fileUrl,
          // Reset review flags when resubmitting
          is_reviewed: false,
          is_rejected: false,
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      setUploadProgress(100);
      
      // Reset form
      setComment('');
      setFile(null);
      setUploadProgress(0);
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to submit task: ${errorMessage}\n\nPlease try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      setComment('');
      setFile(null);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Task</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {taskTitle}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="submission-comment">
              Submission Comment <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="submission-comment"
              placeholder="Describe what you've completed, any challenges faced, or additional notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              This comment will be visible to the PIC when they review your submission.
            </p>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="submission-file">
              Supporting Document (Optional)
            </Label>
            
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  id="submission-file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={submitting}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                />
                <label
                  htmlFor="submission-file"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG, ZIP (max 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!submitting && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {submitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !comment.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
