// =========================================
// MENTOR DASHBOARD
// =========================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, ListChecks, FileCheck, Users } from 'lucide-react';

export default function MentorDashboard() {
  const { profile, refreshProfile } = useAuth();
  const { fetchMyProjects } = useProjects();

  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingReviews: 0,
    activeInterns: 0
  });

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const projectsResult = await fetchMyProjects();
    
    setStats({
      totalProjects: projectsResult.data?.length || 0,
      totalTasks: 0, // Will be calculated from projects
      pendingReviews: 0, // TODO: Implement pending reviews count
      activeInterns: 0 // TODO: Implement active interns count
    });
  };

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">💼 My Projects</CardTitle>
            <Briefcase className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Projects I'm mentoring</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">👥 Interns Under Me</CardTitle>
            <Users className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{stats.activeInterns}</div>
            <p className="text-xs text-muted-foreground mt-1">Active interns mentored</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📋 Pending Reviews</CardTitle>
            <FileCheck className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Entries awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">✅ Tasks Created</CardTitle>
            <ListChecks className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks assigned to interns</p>
          </CardContent>
        </Card>
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
