// =========================================
// ADMIN DASHBOARD
// =========================================

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardStats from '@/components/common/DashboardStats';
import QuickActions from '@/components/common/QuickActions';
import UpcomingDeadlines from '@/components/common/UpcomingDeadlines';
import RecentActivity from '@/components/common/RecentActivity';
import { Users, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section - Admin Specific */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">👑 Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-purple-600">{profile?.full_name}</span>! 
            </p>
          </div>
        </div>
        <p className="text-lg font-medium text-purple-600 mt-3">
          🎯 Manage the entire system
        </p>
      </div>

      {/* Stats Grid - Admin View */}
      <DashboardStats role="admin" />

      {/* Quick Actions Widget */}
      <QuickActions role="admin" />

      {/* Widgets Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingDeadlines limit={5} />
        <RecentActivity limit={5} />
      </div>

      {/* Management Sections - Admin Only */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="bg-purple-50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">👥 User Management</CardTitle>
            </div>
            <CardDescription>Manage system users and roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Actions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ Create and manage user accounts</li>
                <li>✓ Assign roles and permissions</li>
                <li>✓ View user activity logs</li>
                <li>✓ Manage user profiles & settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">💼 Project Management</CardTitle>
            </div>
            <CardDescription>Oversee all projects in system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Available Actions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ Create and edit projects</li>
                <li>✓ Assign participants to projects</li>
                <li>✓ Manage project documents</li>
                <li>✓ Monitor project progress & status</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
