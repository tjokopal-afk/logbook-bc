// =========================================
// MENTOR DASHBOARD
// =========================================

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardStats from '@/components/common/DashboardStats';
import QuickActions from '@/components/common/QuickActions';
import UpcomingDeadlines from '@/components/common/UpcomingDeadlines';
import RecentActivity from '@/components/common/RecentActivity';
import { FileCheck, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MentorDashboard() {
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section - Mentor Specific */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">🎓 Mentor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-green-600">{profile?.full_name}</span>!
            </p>
          </div>
        </div>
        <p className="text-lg font-medium text-green-600 mt-3">
          🎯 Guide and review your interns
        </p>
      </div>

      {/* Stats Grid - Mentor View */}
      <DashboardStats role="mentor" />

      {/* Quick Actions Widget */}
      <QuickActions role="mentor" />

      {/* Widgets Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingDeadlines limit={5} />
        <RecentActivity limit={5} />
      </div>

      {/* Mentoring Actions - Mentor Only */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="bg-green-50">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">📝 Review Logbook</CardTitle>
            </div>
            <CardDescription>Review and rate intern entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Mentoring Actions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ Review intern daily entries</li>
                <li>✓ Provide ratings (1-5 stars)</li>
                <li>✓ Give constructive feedback</li>
                <li>✓ Track entry quality over time</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-teal-500">
          <CardHeader className="bg-teal-50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-teal-900">👥 Intern Progress</CardTitle>
            </div>
            <CardDescription>Monitor intern development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Tracking Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ View intern task completion</li>
                <li>✓ Monitor project progress</li>
                <li>✓ Analyze performance trends</li>
                <li>✓ Identify areas for improvement</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
