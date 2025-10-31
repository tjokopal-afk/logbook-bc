// =========================================
// VIEW PROJECT DIALOG
// Detailed view of project information
// =========================================

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Briefcase, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by_name?: string;
  participant_count?: number;
  task_count?: number;
  completion_rate?: number;
}

interface ViewProjectDialogProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
}

export function ViewProjectDialog({ isOpen, project, onClose }: ViewProjectDialogProps) {
  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      upcoming: { label: 'Upcoming', className: 'bg-yellow-100 text-yellow-700' },
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            Project Details
          </DialogTitle>
          <DialogDescription>
            Complete project information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{project.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>
            <Badge className={getStatusBadge(project.status).className}>
              {getStatusBadge(project.status).label}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Timeline */}
            <div className="bg-gray-50 p-4 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                Project Timeline
              </div>
              <p className="text-sm font-semibold">
                {format(new Date(project.start_date), 'dd MMM yyyy')}
                {' - '}
                {format(new Date(project.end_date), 'dd MMM yyyy')}
              </p>
            </div>

            {/* Participants */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                <Users className="w-4 h-4" />
                Participants
              </div>
              <p className="text-2xl font-bold text-blue-600">{project.participant_count || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Team members</p>
            </div>

            {/* Tasks */}
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-purple-700 mb-1">
                <Briefcase className="w-4 h-4" />
                Tasks
              </div>
              <p className="text-2xl font-bold text-purple-600">{project.task_count || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Total tasks</p>
            </div>

            {/* Completion */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg col-span-2">
              <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                <TrendingUp className="w-4 h-4" />
                Completion Rate
              </div>
              <p className="text-2xl font-bold text-green-600">{project.completion_rate || 0}%</p>
              <p className="text-xs text-green-600 mt-1">Average task completion</p>
            </div>
          </div>

          {/* Creator */}
          <div className="text-sm text-gray-600 pt-4 border-t">
            <strong>Created by:</strong> {project.created_by_name || 'Unknown'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
