// =========================================
// INTERN DASHBOARD
// =========================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLogbook } from '@/hooks/useLogbook';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Briefcase, CheckSquare, TrendingUp } from 'lucide-react';

export default function InternDashboard() {
  const { profile, refreshProfile } = useAuth();
  const { fetchMyLogbook } = useLogbook();
  const { fetchMyProjects } = useProjects();
  const { fetchMyTasks } = useTasks();

  const [stats, setStats] = useState({
    totalEntries: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  useEffect(() => {
    // Refresh profile to ensure latest data
    refreshProfile();
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [logbookResult, projectsResult, tasksResult] = await Promise.all([
      fetchMyLogbook(),
      fetchMyProjects(),
      fetchMyTasks()
    ]);

    setStats({
      totalEntries: logbookResult.data?.length || 0,
      totalProjects: projectsResult.data?.length || 0,
      totalTasks: tasksResult.data?.length || 0,
      completedTasks: tasksResult.data?.filter(t => t.percent_of_project === 100).length || 0
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your internship progress
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logbook Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">Total entries recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Projects assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTasks > 0 
                ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Task completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Create a new logbook entry<br />
            • View your assigned tasks<br />
            • Check your project progress<br />
            • Review feedback from mentors
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
