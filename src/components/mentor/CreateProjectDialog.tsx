// =========================================
// CREATE PROJECT DIALOG - Mentor Component
// Dialog for creating new projects with key activities
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectData: any) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSubmit }: CreateProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    targetInterns: 1,
    keyActivities: [
      { name: 'Memahami Struktur Project', targetDays: 7 },
      { name: 'Setup Development Environment', targetDays: 3 },
      { name: 'Implementasi Fitur Login', targetDays: 14 },
      { name: 'Integrasi API Backend', targetDays: 14 },
      { name: 'Testing & Bug Fixing', targetDays: 10 },
      { name: 'Code Review dengan Mentor', targetDays: 5 },
      { name: 'Dokumentasi Project', targetDays: 7 },
      { name: 'Deployment ke Production', targetDays: 5 }
    ]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (formData.keyActivities.length === 0) {
      alert('Minimal harus ada 1 key activity');
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      targetInterns: 1,
      keyActivities: [
        { name: 'Memahami Struktur Project', targetDays: 7 },
        { name: 'Setup Development Environment', targetDays: 3 },
        { name: 'Implementasi Fitur Login', targetDays: 14 },
        { name: 'Integrasi API Backend', targetDays: 14 },
        { name: 'Testing & Bug Fixing', targetDays: 10 },
        { name: 'Code Review dengan Mentor', targetDays: 5 },
        { name: 'Dokumentasi Project', targetDays: 7 },
        { name: 'Deployment ke Production', targetDays: 5 }
      ]
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addKeyActivity = () => {
    setFormData(prev => ({
      ...prev,
      keyActivities: [...prev.keyActivities, { name: '', targetDays: 7 }]
    }));
  };

  const updateKeyActivity = (index: number, field: 'name' | 'targetDays', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      keyActivities: prev.keyActivities.map((activity, i) => 
        i === index ? { ...activity, [field]: value } : activity
      )
    }));
  };

  const removeKeyActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyActivities: prev.keyActivities.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Buat project baru dengan key activities untuk intern
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Project Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Project Alpha"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi singkat tentang project ini..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Date Range & Target Interns */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetInterns">
                Target Interns
              </Label>
              <Input
                id="targetInterns"
                type="number"
                min="1"
                value={formData.targetInterns}
                onChange={(e) => handleChange('targetInterns', e.target.value)}
              />
            </div>
          </div>

          {/* Key Activities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Key Activities <span className="text-red-600">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKeyActivity}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Activity
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Daftar key activities dengan target waktu penyelesaian (dalam hari)
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3">
              {formData.keyActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-sm text-gray-500 w-6 mt-2">{index + 1}.</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nama key activity..."
                      value={activity.name}
                      onChange={(e) => updateKeyActivity(index, 'name', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Target Days:</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Days"
                        value={activity.targetDays}
                        onChange={(e) => updateKeyActivity(index, 'targetDays', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <span className="text-xs text-gray-500">hari</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyActivity(index)}
                    disabled={formData.keyActivities.length === 1}
                    className="mt-1"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Total: {formData.keyActivities.length} activities</span>
              <span>Total Days: {formData.keyActivities.reduce((sum, act) => sum + act.targetDays, 0)} hari</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
