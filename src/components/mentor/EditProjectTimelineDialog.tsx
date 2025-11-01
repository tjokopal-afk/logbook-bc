// =========================================
// EDIT PROJECT TIMELINE DIALOG - Mentor Component
// Edit project timeline and monthly targets
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Target } from 'lucide-react';

interface KeyActivity {
  name: string;
  targetDays: number;
  completedBy: number;
  avgDaysToComplete: number;
}

interface MonthlyTarget {
  month: string;
  targetActivities: string[];
  completedCount: number;
  totalCount: number;
}

interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetInterns: number;
  keyActivities: KeyActivity[];
  monthlyTargets: MonthlyTarget[];
}

interface EditProjectTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSubmit: (projectId: string, timelineData: any) => void;
}

export function EditProjectTimelineDialog({ open, onOpenChange, project, onSubmit }: EditProjectTimelineDialogProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    targetInterns: 1,
    keyActivities: [] as KeyActivity[]
  });

  useEffect(() => {
    if (project) {
      setFormData({
        startDate: project.startDate,
        endDate: project.endDate,
        targetInterns: project.targetInterns,
        keyActivities: project.keyActivities
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project || !formData.startDate || !formData.endDate) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    onSubmit(project.id, formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateKeyActivityTarget = (index: number, targetDays: number) => {
    setFormData(prev => ({
      ...prev,
      keyActivities: prev.keyActivities.map((activity, i) => 
        i === index ? { ...activity, targetDays } : activity
      )
    }));
  };

  if (!project) return null;

  const totalTargetDays = formData.keyActivities.reduce((sum, act) => sum + act.targetDays, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Timeline</DialogTitle>
          <DialogDescription>
            Update timeline, target interns, dan target days per key activity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name (Read-only) */}
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={project.name}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Timeline */}
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
                onChange={(e) => handleChange('targetInterns', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Key Activities Target Days */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <Label>Key Activities Target Days</Label>
            </div>
            <p className="text-xs text-gray-500">
              Customize target waktu penyelesaian untuk setiap key activity
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-3">
              {formData.keyActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.name}</p>
                    {activity.completedBy > 0 && (
                      <p className="text-xs text-gray-500">
                        Completed by {activity.completedBy} intern(s) • Avg: {activity.avgDaysToComplete} hari
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-600 whitespace-nowrap">Target:</Label>
                    <Input
                      type="number"
                      min="1"
                      value={activity.targetDays}
                      onChange={(e) => updateKeyActivityTarget(index, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    <span className="text-xs text-gray-500">hari</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
              <span>Total Activities: {formData.keyActivities.length}</span>
              <span className="font-semibold">Total Target Days: {totalTargetDays} hari</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Timeline akan otomatis tersimpan untuk intern</p>
                <p>Perubahan timeline akan terlihat oleh semua intern yang tergabung dalam project ini.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Update Timeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
