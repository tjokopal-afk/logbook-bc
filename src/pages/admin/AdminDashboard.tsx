// =========================================
// ADMIN DASHBOARD
// =========================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, BookOpen, Star, TrendingUp, UserCheck } from 'lucide-react';
import { supabase } from '@/supabase';

export default function AdminDashboard() {
  const { profile, refreshProfile } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    usersByRole: { intern: 0, mentor: 0, admin: 0, superuser: 0 },
    activeInterns: 0,
    activeMentors: 0,
    totalProjects: 0,
    projectsByStatus: { active: 0, completed: 0 },
    totalLogbooks: 0,
    logbooksThisMonth: 0,
    overallCompletionRate: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch users by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');
      
      const usersByRole = {
        intern: profiles?.filter(p => p.role === 'intern').length || 0,
        mentor: profiles?.filter(p => p.role === 'mentor').length || 0,
        admin: profiles?.filter(p => p.role === 'admin').length || 0,
        superuser: profiles?.filter(p => p.role === 'superuser').length || 0
      };

      // Fetch active interns (those with recent activity)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeInternData } = await supabase
        .from('logbook_entries')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      const activeInterns = new Set(activeInternData?.map(e => e.user_id)).size || 0;

      // Fetch active mentors
      const { data: activeMentorData } = await supabase
        .from('reviews')
        .select('reviewer_id')
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      const activeMentors = new Set(activeMentorData?.map(r => r.reviewer_id)).size || 0;

      // Fetch total projects
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch projects by status
      const { data: projectsData } = await supabase
        .from('projects')
        .select('status');
      
      const projectsByStatus = {
        active: projectsData?.filter(p => p.status === 'active').length || 0,
        completed: projectsData?.filter(p => p.status === 'completed').length || 0
      };

      // Fetch total logbook entries
      const { count: totalLogbooks } = await supabase
        .from('logbook_entries')
        .select('*', { count: 'exact', head: true });

      // Fetch logbooks this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: logbooksThisMonth } = await supabase
        .from('logbook_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Calculate overall completion rate
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('percent_of_project');
      
      const completedTasks = tasksData?.filter(t => t.percent_of_project === 100).length || 0;
      const totalTasks = tasksData?.length || 1;
      const overallCompletionRate = Math.round((completedTasks / totalTasks) * 100);

      setStats({
        totalUsers: totalUsers || 0,
        usersByRole,
        activeInterns,
        activeMentors,
        totalProjects: totalProjects || 0,
        projectsByStatus,
        totalLogbooks: totalLogbooks || 0,
        logbooksThisMonth: logbooksThisMonth || 0,
        overallCompletionRate
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Stats Grid - Admin View (6 cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Users */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {loading ? '...' : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All registered users</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Intern:</span>
                  <span className="ml-1 font-semibold text-green-600">{stats.usersByRole.intern}</span>
                </div>
                <div>
                  <span className="text-gray-500">Mentor:</span>
                  <span className="ml-1 font-semibold text-blue-600">{stats.usersByRole.mentor}</span>
                </div>
                <div>
                  <span className="text-gray-500">Admin:</span>
                  <span className="ml-1 font-semibold text-purple-600">{stats.usersByRole.admin}</span>
                </div>
                <div>
                  <span className="text-gray-500">Super:</span>
                  <span className="ml-1 font-semibold text-red-600">{stats.usersByRole.superuser}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Interns */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interns</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {loading ? '...' : stats.activeInterns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently interning</p>
            <p className="text-xs text-green-600 mt-2">Active in last 30 days</p>
          </CardContent>
        </Card>

        {/* Card 3: Active Mentors */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? '...' : stats.activeMentors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Actively mentoring</p>
            <p className="text-xs text-blue-600 mt-2">Reviewed in last 30 days</p>
          </CardContent>
        </Card>

        {/* Card 4: Total Projects */}
        <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">
              {loading ? '...' : stats.totalProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All projects</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <div>
                  <span className="text-gray-500">Active:</span>
                  <span className="ml-1 font-semibold text-green-600">{stats.projectsByStatus.active}</span>
                </div>
                <div>
                  <span className="text-gray-500">Completed:</span>
                  <span className="ml-1 font-semibold text-blue-600">{stats.projectsByStatus.completed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Logbook Entries */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logbook Entries</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {loading ? '...' : stats.totalLogbooks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total entries</p>
            <p className="text-xs text-orange-600 mt-2">
              +{stats.logbooksThisMonth} this month
            </p>
          </CardContent>
        </Card>

        {/* Card 6: Overall Completion Rate */}
        <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <div className="p-2 bg-teal-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">
              {loading ? '...' : `${stats.overallCompletionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall progress</p>
            <p className="text-xs text-teal-600 mt-2">Across all projects</p>
          </CardContent>
        </Card>
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
