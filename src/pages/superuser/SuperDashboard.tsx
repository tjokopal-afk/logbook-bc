// =========================================
// SUPERUSER DASHBOARD
// =========================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Shield, Activity, Settings, Users, Briefcase, BookOpen, Star } from 'lucide-react';

export default function SuperDashboard() {
  const { profile, refreshProfile } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalLogbooks: 0,
    totalReviews: 0,
    systemHealth: 'Optimal',
    storageUsed: '0 MB'
  });

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // TODO: Implement superuser statistics fetching from all tables
    setStats({
      totalUsers: 0,
      totalProjects: 0,
      totalLogbooks: 0,
      totalReviews: 0,
      systemHealth: 'Optimal',
      storageUsed: '0 MB'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section - Superuser Specific */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 p-3 rounded-lg shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">👑 Super Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-red-600">{profile?.full_name}</span>!
            </p>
          </div>
        </div>
        <p className="text-lg font-medium text-red-600 mt-3">
          🚀 Full system access and control
        </p>
      </div>

      {/* Stats Grid - Superuser View (All System Data) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">👥 All Users</CardTitle>
            <Users className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Total users in system</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">💼 All Projects</CardTitle>
            <Briefcase className="h-5 w-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Total projects created</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">📖 All Logbooks</CardTitle>
            <BookOpen className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalLogbooks}</div>
            <p className="text-xs text-muted-foreground mt-1">Total entries in system</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">⭐ All Reviews</CardTitle>
            <Star className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Total reviews given</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">⚡ System Health</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.systemHealth}</div>
            <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">💾 Storage Used</CardTitle>
            <Database className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.storageUsed}</div>
            <p className="text-xs text-muted-foreground mt-1">Database storage</p>
          </CardContent>
        </Card>
      </div>

      {/* System Management - Superuser Only */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-red-500">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">🔐 Full System Access</CardTitle>
            </div>
            <CardDescription>Unrestricted admin rights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">System Control:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ View all users & data</li>
                <li>✓ Manage all projects</li>
                <li>✓ Access all logbooks</li>
                <li>✓ View all reviews</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-orange-500">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">📊 System Monitoring</CardTitle>
            </div>
            <CardDescription>Track system activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Monitoring Tools:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ Audit log access</li>
                <li>✓ User activity tracking</li>
                <li>✓ System health metrics</li>
                <li>✓ Performance analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="bg-purple-50">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-900">⚙️ Advanced Operations</CardTitle>
            </div>
            <CardDescription>Critical system functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Admin Actions:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>✓ Delete any data</li>
                <li>✓ Modify settings</li>
                <li>✓ Database management</li>
                <li>✓ Backup & restore</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
