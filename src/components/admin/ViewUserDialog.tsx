// =========================================
// VIEW USER DIALOG
// Detailed view of user profile
// =========================================

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  affiliation?: string;
  department?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface ViewUserDialogProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export function ViewUserDialog({ isOpen, user, onClose }: ViewUserDialogProps) {
  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700' },
      superuser: { label: 'Superuser', className: 'bg-red-100 text-red-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            User Profile
          </DialogTitle>
          <DialogDescription>
            Detailed user information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-lg">
              {getInitials(user.full_name || 'User')}
            </div>
            <h3 className="text-xl font-bold">{user.full_name || 'No name'}</h3>
            <Badge className={`${getRoleBadge(user.role).className} mt-2`}>
              {getRoleBadge(user.role).label}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="space-y-3">
            {/* Email */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Mail className="w-4 h-4" />
                Email
              </div>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>

            {/* Affiliation */}
            {user.affiliation && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Building className="w-4 h-4" />
                  Affiliation
                </div>
                <p className="font-medium text-gray-900">{user.affiliation}</p>
                {user.department && (
                  <p className="text-sm text-gray-600 mt-1">{user.department}</p>
                )}
              </div>
            )}

            {/* Role */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Shield className="w-4 h-4" />
                Role
              </div>
              <p className="font-medium text-gray-900">{getRoleBadge(user.role).label}</p>
            </div>

            {/* Created Date */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                Member Since
              </div>
              <p className="font-medium text-gray-900">
                {format(new Date(user.created_at), 'dd MMMM yyyy')}
              </p>
            </div>

            {/* Last Sign In */}
            {user.last_sign_in_at && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Last Sign In
                </div>
                <p className="font-medium text-gray-900">
                  {format(new Date(user.last_sign_in_at), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
