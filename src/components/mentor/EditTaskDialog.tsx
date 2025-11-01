// =========================================
// EDIT TASK DIALOG - Mentor Component
// Dialog for editing existing tasks
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
}

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (taskId: string, taskData: any) => void;
}

export function EditTaskDialog({ open, onOpenChange, task, onSubmit }: EditTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    progress: 0
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
        deadline: task.deadline,
        priority: task.priority,
        progress: task.progress
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task || !formData.title || !formData.deadline) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    onSubmit(task.id, formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mock data - replace with real data from Supabase
  const projects = [
    { id: 'proj1', name: 'Project Alpha' },
    { id: 'proj2', name: 'Project Beta' },
    { id: 'proj3', name: 'Project Gamma' }
  ];

  const interns = [
    { id: 'intern1', name: 'John Doe' },
    { id: 'intern2', name: 'Jane Smith' },
    { id: 'intern3', name: 'Ahmad Rizki' },
    { id: 'intern4', name: 'Sarah Johnson' }
  ];

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details dan progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Task Title <span className="text-red-600">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Implementasi Login Page"
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
              placeholder="Deskripsi detail tentang task ini..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <select
              id="project"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.projectId}
              onChange={(e) => handleChange('projectId', e.target.value)}
            >
              <option value="">Pilih project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned to</Label>
            <select
              id="assignedTo"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
            >
              <option value="">Pilih intern</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>
                  {intern.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">
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

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label htmlFor="progress">
              Progress: {formData.progress}%
            </Label>
            <input
              id="progress"
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) => handleChange('progress', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Update Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
