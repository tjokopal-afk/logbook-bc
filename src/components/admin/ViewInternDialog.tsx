// =========================================
// VIEW INTERN DIALOG
// Detailed view of intern profile and stats
// =========================================

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Building, 
  Calendar, 
  Briefcase,
  BookOpen,
  Clock,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

interface InternData {
  id: string;
  email: string;
  full_name: string;
  affiliation: string;
  department: string;
  start_date?: string;
  end_date?: string;
  mentor_name?: string;
  project_name?: string;
  status: 'active' | 'completed' | 'upcoming';
  total_entries?: number;
  total_hours?: number;
}

interface ViewInternDialogProps {
  isOpen: boolean;
  intern: InternData;
  onClose: () => void;
}

export function ViewInternDialog({ isOpen, intern, onClose }: ViewInternDialogProps) {
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
            <User className="w-5 h-5 text-purple-600" />
            Intern Profile
          </DialogTitle>
          <DialogDescription>
            Detailed information and statistics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{intern.full_name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Mail className="w-4 h-4" />
                {intern.email}
              </p>
            </div>
            <Badge className={getStatusBadge(intern.status).className}>
              {getStatusBadge(intern.status).label}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Affiliation */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Building className="w-4 h-4" />
                Affiliation
              </div>
              <p className="font-semibold">{intern.affiliation}</p>
              {intern.department !== '-' && (
                <p className="text-xs text-gray-600 mt-1">{intern.department}</p>
              )}
            </div>

            {/* Mentor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Star className="w-4 h-4" />
                Mentor
              </div>
              <p className="font-semibold">{intern.mentor_name || 'Not assigned'}</p>
            </div>

            {/* Project */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Briefcase className="w-4 h-4" />
                Project
              </div>
              <p className="font-semibold">{intern.project_name || 'Not assigned'}</p>
            </div>

            {/* Period */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                Internship Period
              </div>
              <p className="text-sm font-semibold">
                {intern.start_date
                  ? format(new Date(intern.start_date), 'dd MMM yyyy')
                  : 'Not set'}
                {' - '}
                {intern.end_date
                  ? format(new Date(intern.end_date), 'dd MMM yyyy')
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h4 className="font-semibold mb-3">Activity Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                  <BookOpen className="w-4 h-4" />
                  Logbook Entries
                </div>
                <p className="text-2xl font-bold text-green-600">{intern.total_entries || 0}</p>
                <p className="text-xs text-green-600 mt-1">Total entries submitted</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                  <Clock className="w-4 h-4" />
                  Hours Logged
                </div>
                <p className="text-2xl font-bold text-blue-600">{intern.total_hours || 0}h</p>
                <p className="text-xs text-blue-600 mt-1">Total work hours</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
