// =========================================
// TASK SUBMISSION COMPONENT - Member View
// Submit task with file attachments and view review status
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Paperclip,
  X
} from 'lucide-react';
import { submitTask } from '@/services/taskService';
import { uploadTaskAttachment } from '@/services/storageService';
import type { Task } from '@/lib/api/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface TaskSubmissionProps {
  task: Task;
  onSubmitSuccess?: () => void;
}

export function TaskSubmission({ task, onSubmitSuccess }: TaskSubmissionProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      setError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload attachments if any
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          await uploadTaskAttachment(task.id, files[i]);
          setUploadProgress(((i + 1) / files.length) * 100);
        }
      }

      // Submit the task
      await submitTask(task.id);

      setFiles([]);
      setUploadProgress(0);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    if (task.is_reviewed && !task.is_rejected) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (task.is_rejected) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (task.is_submitted) {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusBadge = () => {
    if (task.is_reviewed && !task.is_rejected) {
      return <Badge className="bg-green-600">Approved ✓</Badge>;
    } else if (task.is_rejected) {
      return <Badge className="bg-red-600">Rejected - Needs Revision</Badge>;
    } else if (task.is_submitted) {
      return <Badge className="bg-yellow-600">Under Review</Badge>;
    }
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  const canSubmit = !task.is_submitted || task.is_rejected;
  const isApproved = task.is_reviewed && !task.is_rejected;

  return (
    <Card className={`${task.is_rejected ? 'border-red-300' : ''} ${isApproved ? 'border-green-300' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                {getStatusBadge()}
              </div>
              <CardDescription>{task.description}</CardDescription>
              
              {/* Task Weight */}
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Weight: {task.project_weight}/10
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Deadline */}
        {task.deadline && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Clock className="w-4 h-4" />
            <span>
              Deadline: {format(new Date(task.deadline), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Review Status Message */}
        {task.is_rejected && task.review_comment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">Task Rejected - Revision Required</p>
                <p className="text-sm text-red-700 mt-1">{task.review_comment}</p>
                {task.reviewed_at && (
                  <p className="text-xs text-red-600 mt-2">
                    Reviewed on {format(new Date(task.reviewed_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 text-sm">Task Approved!</p>
                {task.review_comment && (
                  <p className="text-sm text-green-700 mt-1">{task.review_comment}</p>
                )}
                {task.reviewed_at && (
                  <p className="text-xs text-green-600 mt-2">
                    Approved on {format(new Date(task.reviewed_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {task.is_submitted && !task.is_reviewed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 text-sm">Waiting for Review</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your task has been submitted and is awaiting review from your mentor.
                </p>
                {task.submitted_at && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Submitted on {format(new Date(task.submitted_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {canSubmit && !isApproved && (
          <>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor={`file-upload-${task.id}`} className="cursor-pointer">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Upload files
                    </span>
                    <input
                      id={`file-upload-${task.id}`}
                      type="file"
                      className="sr-only"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    or drag and drop files here
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, PDF, DOC up to 50MB
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Files ({files.length})</p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading files...</span>
                  <span className="font-medium">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {task.is_rejected ? (
                  <span className="text-red-600">Please revise and resubmit</span>
                ) : (
                  <span>Ready to submit your work?</span>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={uploading || (!files.length && !task.is_rejected)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {uploadProgress < 100 ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {task.is_rejected ? 'Resubmit Task' : 'Submit Task'}
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Already Approved Message */}
        {isApproved && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              This task has been completed and approved. Great work! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
