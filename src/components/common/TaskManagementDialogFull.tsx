// =========================================
// TASK MANAGEMENT DIALOG - Create & Edit Tasks with File Uploads
// Full-featured task dialog for PICs to create/edit tasks
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image as ImageIcon, Loader2, Calendar, Users, Target } from 'lucide-react';
import { MAX_FILE_SIZE } from '@/services/storageService';
import { createTask, updateTask } from '@/services/taskService';

interface TaskAttachment {
  id?: string;
  file_name: string;
  storage_path: string;
  file_size?: number;
  url?: string;
  file?: File; // For new uploads
}

interface TaskData {
  id?: string;
  title: string;
  description?: string;
  project_id: string;
  assigned_to?: string;
  deadline?: string;
  project_weight: number; // 1-10 weight
  attachments?: TaskAttachment[];
}

interface TaskManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId: string;
  projectName: string;
  existingTask?: TaskData | null;
  mode: 'create' | 'edit';
}

export function TaskManagementDialogFull({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  projectName,
  existingTask,
  mode,
}: TaskManagementDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Project participants (members)
  const [members, setMembers] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TaskData>({
    title: '',
    description: '',
    project_id: projectId,
    assigned_to: '',
    deadline: '',
    project_weight: 5, // Default weight
    attachments: [],
  });

  // File state
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Load project members
  useEffect(() => {
    if (open && projectId) {
      loadProjectMembers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  // Populate form if editing
  useEffect(() => {
    if (mode === 'edit' && existingTask) {
      setFormData({
        id: existingTask.id,
        title: existingTask.title || '',
        description: existingTask.description || '',
        project_id: existingTask.project_id,
        assigned_to: existingTask.assigned_to || '',
        deadline: existingTask.deadline ? existingTask.deadline.split('T')[0] : '',
        project_weight: existingTask.project_weight || 5,
        attachments: existingTask.attachments || [],
      });
    } else {
      // Reset for create mode
      setFormData({
        title: '',
        description: '',
        project_id: projectId,
        assigned_to: '',
        deadline: '',
        project_weight: 5,
        attachments: [],
      });
      setNewFiles([]);
    }
  }, [mode, existingTask, projectId, open]);

  const loadProjectMembers = async () => {
    setLoadingMembers(true);
    try {
      // Get participants for this project
      const { data: participants, error: participantsError } = await supabase
        .from('project_participants')
        .select('user_id')
        .eq('project_id', projectId);

      if (participantsError) throw participantsError;

      if (!participants || participants.length === 0) {
        setMembers([]);
        return;
      }

      const userIds = participants.map(p => p.user_id);

      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      setMembers(profiles || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project members',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (field: keyof TaskData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE.DOCUMENT);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: `Some files exceed the ${MAX_FILE_SIZE.DOCUMENT / 1024 / 1024}MB limit`,
        variant: 'destructive',
      });
      return;
    }

    setNewFiles(prev => [...prev, ...files]);
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.assigned_to || !formData.deadline) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.project_weight < 1 || formData.project_weight > 10) {
      toast({
        title: 'Invalid Weight',
        description: 'Task weight must be between 1 and 10',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let taskId = formData.id;

      // Create or update task
      if (mode === 'create') {
        const taskPayload = {
          project_id: formData.project_id,
          title: formData.title,
          description: formData.description || undefined,
          assigned_to: formData.assigned_to,
          deadline: formData.deadline,
          project_weight: formData.project_weight,
        };

        const createdTask = await createTask(taskPayload);
        taskId = createdTask.id;

        toast({
          title: 'Success',
          description: 'Task created successfully',
        });
      } else if (mode === 'edit' && taskId) {
        const updatePayload = {
          title: formData.title,
          description: formData.description || undefined,
          assigned_to: formData.assigned_to,
          deadline: formData.deadline,
          project_weight: formData.project_weight,
        };

        await updateTask(taskId, updatePayload);

        toast({
          title: 'Success',
          description: 'Task updated successfully',
        });
      }

      // Upload new files if any (use user-media bucket for consistency)
      if (newFiles.length > 0 && taskId) {
        setUploadingFiles(true);
        
        for (const file of newFiles) {
          try {
            // Get current user
            const userResult = await supabase.auth.getUser();
            const user = userResult.data?.user;

            if (!user) {
              throw new Error('User not authenticated');
            }

            // Upload to user-media bucket (same as submissions)
            const timestamp = Date.now();
            const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const storagePath = `task-attachments/${taskId}/${fileName}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('user-media')
              .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error('Storage upload error:', uploadError);
              throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('user-media')
              .getPublicUrl(uploadData.path);

            // Note: Task attachments are uploaded to storage
            // The file URL can be shared or stored as needed
            // Currently, submission_bucket_url in tasks table is used for member submissions
            // For PIC task attachments, they could be stored in project_documents or a similar mechanism
            console.log(`Task attachment uploaded: ${file.name} at ${urlData.publicUrl}`);
            
            // Optionally store as a project document instead
            // This makes task attachments visible in the project documents section
            try {
              await supabase.from('project_documents').insert({
                project_id: formData.project_id,
                uploaded_by: user.id,
                doc_type: 'task_reference',
                storage_path: urlData.publicUrl,
                file_name: file.name,
              });
            } catch (docError) {
              console.warn('Could not save as project document:', docError);
              // Non-critical - file is still uploaded to storage
            }
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            toast({
              title: 'Warning',
              description: `Failed to upload ${file.name}`,
              variant: 'destructive',
            });
          }
        }
        
        setUploadingFiles(false);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save task',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? `Create a new task for ${projectName}` 
              : `Update task details for ${projectName}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Task Title <span className="text-red-600">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Implement Login Page"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the task..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Assign To & Deadline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assign To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assign to Member <span className="text-red-600">*</span>
              </Label>
              {loadingMembers ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <select
                  id="assignedTo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.assigned_to}
                  onChange={(e) => handleChange('assigned_to', e.target.value)}
                  required
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Deadline <span className="text-red-600">*</span>
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Task Weight (1-10) */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center justify-between">
              <span>Task Weight (Contribution to Project)</span>
              <Badge variant="outline">{formData.project_weight} / 10</Badge>
            </Label>
            <div className="flex items-center gap-4">
              <input
                id="weight"
                type="range"
                min="1"
                max="10"
                value={formData.project_weight}
                onChange={(e) => handleChange('project_weight', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.project_weight}
                onChange={(e) => handleChange('project_weight', Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Set the weight (1-10) representing how much this task contributes to the overall project progress.
            </p>
          </div>

          {/* File Attachments */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Attachments (Images, Documents)
            </Label>

            {/* Existing Attachments */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Existing Files:</p>
                {formData.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{attachment.file_name}</span>
                      {attachment.file_size && (
                        <span className="text-xs text-gray-500">
                          ({(attachment.file_size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExistingAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* New Files */}
            {newFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">New Files to Upload:</p>
                {newFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md bg-blue-50"
                  >
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNewFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div>
              <input
                type="file"
                id="task-files"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('task-files')?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Files
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Supports images, PDFs, and documents (max {MAX_FILE_SIZE.DOCUMENT / 1024 / 1024}MB each)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || uploadingFiles}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingFiles}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading || uploadingFiles ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingFiles ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                mode === 'create' ? 'Create Task' : 'Update Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
