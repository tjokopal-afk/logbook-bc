// =========================================
// QUICK ACTIONS WIDGET
// Role-based quick action buttons for common tasks
// =========================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Users,
  FileText,
  ListChecks,
  UserPlus,
  Calendar,
  BarChart3,
  FolderPlus
} from 'lucide-react';

// =========================================
// INTERFACES
// =========================================

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  path: string;
  colorClass: string;
}

interface QuickActionsProps {
  role: Profile['role'];
}

// =========================================
// MAIN COMPONENT
// =========================================

const QuickActions: React.FC<QuickActionsProps> = ({ role }) => {
  const navigate = useNavigate();

  // Define quick actions based on role
  const getActionsForRole = (): QuickAction[] => {
    switch (role) {
      case 'admin':
      case 'superuser':
        return [
          {
            icon: <UserPlus className="w-5 h-5" />,
            label: 'Add User',
            description: 'Create new user account',
            path: '/admin/kelola-user',
            colorClass: 'bg-purple-500 hover:bg-purple-600',
          },
          {
            icon: <FolderPlus className="w-5 h-5" />,
            label: 'New Project',
            description: 'Create new project',
            path: '/admin/kelola-project',
            colorClass: 'bg-blue-500 hover:bg-blue-600',
          },
          {
            icon: <Users className="w-5 h-5" />,
            label: 'Manage Users',
            description: 'View and edit users',
            path: '/admin/kelola-user',
            colorClass: 'bg-green-500 hover:bg-green-600',
          },
          {
            icon: <BarChart3 className="w-5 h-5" />,
            label: 'View Reports',
            description: 'System analytics',
            path: '/admin/monitoring',
            colorClass: 'bg-orange-500 hover:bg-orange-600',
          },
        ];

      case 'mentor':
        return [
          {
            icon: <ListChecks className="w-5 h-5" />,
            label: 'My Projects',
            description: 'View your projects',
            path: '/mentor/my-projects',
            colorClass: 'bg-blue-500 hover:bg-blue-600',
          },
          {
            icon: <FileText className="w-5 h-5" />,
            label: 'Review Logbook',
            description: 'Review intern entries',
            path: '/mentor/review-logbook',
            colorClass: 'bg-purple-500 hover:bg-purple-600',
          },
          {
            icon: <Users className="w-5 h-5" />,
            label: 'My Interns',
            description: 'View intern progress',
            path: '/mentor/intern-saya',
            colorClass: 'bg-teal-500 hover:bg-teal-600',
          },
          {
            icon: <BarChart3 className="w-5 h-5" />,
            label: 'Progress Report',
            description: 'Track intern performance',
            path: '/mentor/progress-intern',
            colorClass: 'bg-green-500 hover:bg-green-600',
          },
        ];

      case 'intern':
        return [
          {
            icon: <Plus className="w-5 h-5" />,
            label: 'New Entry',
            description: 'Add logbook entry',
            path: '/intern/laporan',
            colorClass: 'bg-green-500 hover:bg-green-600',
          },
          {
            icon: <FileText className="w-5 h-5" />,
            label: 'My Logbook',
            description: 'View my entries',
            path: '/intern/laporan',
            colorClass: 'bg-blue-500 hover:bg-blue-600',
          },
          {
            icon: <ListChecks className="w-5 h-5" />,
            label: 'My Tasks',
            description: 'View assigned tasks',
            path: '/intern/status-dan-review',
            colorClass: 'bg-purple-500 hover:bg-purple-600',
          },
          {
            icon: <Calendar className="w-5 h-5" />,
            label: 'My Projects',
            description: 'View project details',
            path: '/intern/project-saya',
            colorClass: 'bg-orange-500 hover:bg-orange-600',
          },
        ];

      default:
        return [];
    }
  };

  const actions = getActionsForRole();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="w-5 h-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Common tasks for quick access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => navigate(action.path)}
              className={`${action.colorClass} text-white h-auto py-4 flex-col gap-2 items-start`}
              variant="default"
            >
              <div className="flex items-center gap-2 w-full">
                {action.icon}
                <span className="font-semibold">{action.label}</span>
              </div>
              <span className="text-xs opacity-90 text-left">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
