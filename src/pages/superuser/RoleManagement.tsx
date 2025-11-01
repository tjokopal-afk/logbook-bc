// =========================================
// SUPERUSER - ROLE MANAGEMENT
// Advanced permission matrix and role editor
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Plus,
  Eye,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  permissions: string[]; // permission IDs
}

const PERMISSIONS: Permission[] = [
  // User Management
  { id: 'user.view', name: 'View Users', description: 'View user list and profiles', category: 'User Management' },
  { id: 'user.create', name: 'Create Users', description: 'Create new users', category: 'User Management' },
  { id: 'user.edit', name: 'Edit Users', description: 'Edit user information', category: 'User Management' },
  { id: 'user.delete', name: 'Delete Users', description: 'Delete users from system', category: 'User Management' },
  
  // Project Management
  { id: 'project.view', name: 'View Projects', description: 'View project list', category: 'Project Management' },
  { id: 'project.create', name: 'Create Projects', description: 'Create new projects', category: 'Project Management' },
  { id: 'project.edit', name: 'Edit Projects', description: 'Edit project details', category: 'Project Management' },
  { id: 'project.delete', name: 'Delete Projects', description: 'Delete projects', category: 'Project Management' },
  
  // Logbook
  { id: 'logbook.view', name: 'View Logbooks', description: 'View logbook entries', category: 'Logbook' },
  { id: 'logbook.create', name: 'Create Logbooks', description: 'Create logbook entries', category: 'Logbook' },
  { id: 'logbook.edit', name: 'Edit Logbooks', description: 'Edit own logbook entries', category: 'Logbook' },
  { id: 'logbook.delete', name: 'Delete Logbooks', description: 'Delete logbook entries', category: 'Logbook' },
  { id: 'logbook.viewAll', name: 'View All Logbooks', description: 'View all users logbooks', category: 'Logbook' },
  
  // Reviews
  { id: 'review.view', name: 'View Reviews', description: 'View reviews', category: 'Reviews' },
  { id: 'review.create', name: 'Create Reviews', description: 'Create reviews', category: 'Reviews' },
  { id: 'review.edit', name: 'Edit Reviews', description: 'Edit reviews', category: 'Reviews' },
  { id: 'review.delete', name: 'Delete Reviews', description: 'Delete reviews', category: 'Reviews' },
  
  // System
  { id: 'system.settings', name: 'System Settings', description: 'Access system settings', category: 'System' },
  { id: 'system.audit', name: 'Audit Log', description: 'View audit logs', category: 'System' },
  { id: 'system.backup', name: 'Database Backup', description: 'Create and restore backups', category: 'System' },
  { id: 'system.roles', name: 'Role Management', description: 'Manage roles and permissions', category: 'System' },
];

export default function RoleManagement() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'intern',
      name: 'Intern',
      description: 'Intern/Peserta Magang',
      color: 'green',
      userCount: 45,
      permissions: [
        'logbook.view',
        'logbook.create',
        'logbook.edit',
        'project.view',
        'review.view',
      ],
    },
    {
      id: 'mentor',
      name: 'Mentor',
      description: 'Mentor/Pembimbing',
      color: 'blue',
      userCount: 12,
      permissions: [
        'logbook.view',
        'logbook.create',
        'logbook.edit',
        'logbook.viewAll',
        'project.view',
        'project.create',
        'project.edit',
        'review.view',
        'review.create',
        'review.edit',
        'user.view',
      ],
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Administrator',
      color: 'purple',
      userCount: 3,
      permissions: [
        'user.view',
        'user.create',
        'user.edit',
        'user.delete',
        'project.view',
        'project.create',
        'project.edit',
        'project.delete',
        'logbook.view',
        'logbook.viewAll',
        'review.view',
        'system.audit',
      ],
    },
    {
      id: 'superuser',
      name: 'Superuser',
      description: 'Super Administrator',
      color: 'red',
      userCount: 1,
      permissions: PERMISSIONS.map((p) => p.id), // All permissions
    },
  ]);

  const handleTogglePermission = (roleId: string, permissionId: string) => {
    setRoles(
      roles.map((role) => {
        if (role.id === roleId) {
          const hasPermission = role.permissions.includes(permissionId);
          return {
            ...role,
            permissions: hasPermission
              ? role.permissions.filter((p) => p !== permissionId)
              : [...role.permissions, permissionId],
          };
        }
        return role;
      })
    );
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // TODO: Save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success!',
        description: 'Role permissions updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (color: string) => {
    const colors = {
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
      red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' },
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            Role Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage roles and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
          <Button onClick={handleSaveChanges} disabled={saving} className="bg-red-600 hover:bg-red-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => {
          const colors = getRoleColor(role.color);
          const permissionCount = role.permissions.length;
          const totalPermissions = PERMISSIONS.length;
          const percentage = Math.round((permissionCount / totalPermissions) * 100);

          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${
                selectedRole === role.id ? `border-2 ${colors.border}` : ''
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`${colors.bg} ${colors.text}`}>
                    {role.name}
                  </Badge>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Users</span>
                    <span className="font-semibold">{role.userCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Permissions</span>
                    <span className="font-semibold">{permissionCount}/{totalPermissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors.bg.replace('100', '500')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Permission Matrix - {roles.find((r) => r.id === selectedRole)?.name}
                </CardTitle>
                <CardDescription>
                  Toggle permissions for this role
                </CardDescription>
              </div>
              {selectedRole === 'superuser' && (
                <Badge className="bg-red-100 text-red-700">
                  Full Access - Cannot Edit
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-1 h-5 bg-red-500 rounded" />
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((permission) => {
                      const role = roles.find((r) => r.id === selectedRole);
                      const hasPermission = role?.permissions.includes(permission.id) || false;
                      const isLocked = selectedRole === 'superuser';

                      return (
                        <div
                          key={permission.id}
                          className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all ${
                            hasPermission
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                          onClick={() => !isLocked && handleTogglePermission(selectedRole, permission.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{permission.name}</p>
                              {hasPermission ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{permission.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" disabled className="justify-start">
              <Edit className="w-4 h-4 mr-2" />
              Clone Role
            </Button>
            <Button variant="outline" disabled className="justify-start">
              <Users className="w-4 h-4 mr-2" />
              Bulk Assign Users
            </Button>
            <Button variant="outline" disabled className="justify-start">
              <Eye className="w-4 h-4 mr-2" />
              Preview as Role
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
