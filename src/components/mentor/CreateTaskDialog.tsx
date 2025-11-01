// =========================================
// CREATE TASK DIALOG - Mentor Component
// Dialog for creating new tasks
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (taskData: any) => void;
}

export function CreateTaskDialog({ open, onOpenChange, onSubmit }: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium',
    estimatedHours: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.projectId || !formData.assignedTo || !formData.deadline) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      projectId: '',
      assignedTo: '',
      deadline: '',
      priority: 'medium',
      estimatedHours: ''
    });
  };

  const handleChange = (field: string, value: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Buat task baru dan assign ke intern
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
            <Label htmlFor="project">
              Project <span className="text-red-600">*</span>
            </Label>
            <select
              id="project"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.projectId}
              onChange={(e) => handleChange('projectId', e.target.value)}
              required
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
            <Label htmlFor="assignedTo">
              Assign to Intern <span className="text-red-600">*</span>
            </Label>
            <select
              id="assignedTo"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              required
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

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours (optional)</Label>
            <Input
              id="estimatedHours"
              type="number"
              placeholder="e.g., 8"
              value={formData.estimatedHours}
              onChange={(e) => handleChange('estimatedHours', e.target.value)}
              min="0"
              step="0.5"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
