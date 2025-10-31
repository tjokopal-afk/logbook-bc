// =========================================
// SUPERUSER - SUPER DASHBOARD (ENHANCED)
// God Mode - Complete System Overview
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  BookOpen, 
  Star,
  Activity,
  Server,
  Database,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Loader2
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SystemMetrics {
  totalUsers: number;
  totalProjects: number;
  totalLogbooks: number;
  totalReviews: number;
  activeSessions: number;
  systemUptime: number;
  databaseSize: number;
  failedLogins: number;
}

interface ActiveUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  last_activity: string;
}

interface RecentAction {
  id: string;
  user_name: string;
  action: string;
  resource: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function SuperDashboardEnhanced() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalProjects: 0,
    totalLogbooks: 0,
    totalReviews: 0,
    activeSessions: 0,
    systemUptime: 99.9,
    databaseSize: 0,
    failedLogins: 0,
  });
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadActiveUsers(),
        loadRecentActions(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Total Users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total Projects
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Total Logbooks
      const { count: logbooksCount } = await supabase
        .from('logbook_entries')
        .select('*', { count: 'exact', head: true });

      // Total Reviews
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      // Active Sessions (users active in last 15 min)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', fifteenMinutesAgo);

      setMetrics({
        totalUsers: usersCount || 0,
        totalProjects: projectsCount || 0,
        totalLogbooks: logbooksCount || 0,
        totalReviews: reviewsCount || 0,
        activeSessions: activeCount || 0,
        systemUptime: 99.9, // TODO: Calculate from uptime monitoring
        databaseSize: 0, // TODO: Get from Supabase stats
        failedLogins: 0, // TODO: Get from audit log
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, last_sign_in_at')
        .gte('last_sign_in_at', fifteenMinutesAgo)
        .order('last_sign_in_at', { ascending: false })
        .limit(10);

      setActiveUsers(
        (data || []).map((user) => ({
          id: user.id,
          full_name: user.full_name || 'No Name',
          email: user.email,
          role: user.role,
          last_activity: user.last_sign_in_at || '',
        }))
      );
    } catch (error) {
      console.error('Error loading active users:', error);
    }
  };

  const loadRecentActions = async () => {
    // TODO: Implement audit log table
    // For now, use mock data
    setRecentActions([
      {
        id: '1',
        user_name: 'Admin User',
        action: 'Created new user',
        resource: 'User: john@example.com',
        timestamp: new Date().toISOString(),
        severity: 'info',
      },
      {
        id: '2',
        user_name: 'Mentor User',
        action: 'Reviewed logbook',
        resource: 'Logbook #123',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        severity: 'info',
      },
    ]);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700' },
      superuser: { label: 'Superuser', className: 'bg-red-100 text-red-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      info: { label: 'Info', className: 'bg-blue-100 text-blue-700' },
      warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-700' },
      critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
    };
    return badges[severity as keyof typeof badges] || badges.info;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-600" />
            Super Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete system overview and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700">
            <Activity className="w-3 h-3 mr-1" />
            System Online
          </Badge>
          <span className="text-sm text-gray-500">
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </span>
        </div>
      </div>

      {/* Metrics Cards - 8 Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <span className="ml-2 text-gray-600">Loading metrics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="p-2 bg-red-100 rounded-lg">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">All roles</p>
            </CardContent>
          </Card>

          {/* Total Projects */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalProjects}</p>
              <p className="text-xs text-gray-500 mt-1">Active & completed</p>
            </CardContent>
          </Card>

          {/* Total Logbooks */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Logbooks</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalLogbooks}</p>
              <p className="text-xs text-gray-500 mt-1">All entries</p>
            </CardContent>
          </Card>

          {/* Total Reviews */}
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalReviews}</p>
              <p className="text-xs text-gray-500 mt-1">Mentor feedback</p>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.activeSessions}</p>
              <p className="text-xs text-gray-500 mt-1">Last 15 minutes</p>
            </CardContent>
          </Card>

          {/* System Uptime */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Server className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.systemUptime}%</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          {/* Database Size */}
          <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Database Size</p>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Database className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.databaseSize} MB</p>
              <p className="text-xs text-gray-500 mt-1">Total storage</p>
            </CardContent>
          </Card>

          {/* Failed Logins */}
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.failedLogins}</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Monitoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Active Users
              <Badge className="ml-auto bg-green-100 text-green-700">
                {activeUsers.length} online
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No active users in the last 15 minutes
                </p>
              ) : (
                activeUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleBadge.className}>
                          {roleBadge.label}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(user.last_activity), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent actions
                </p>
              ) : (
                recentActions.map((action) => {
                  const severityBadge = getSeverityBadge(action.severity);
                  return (
                    <div
                      key={action.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {action.user_name}
                        </p>
                        <Badge className={severityBadge.className + ' text-xs'}>
                          {severityBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{action.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{action.resource}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(action.timestamp), 'MMM dd, HH:mm:ss')}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Resource Usage - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            System Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">CPU Usage</p>
              <p className="text-2xl font-bold text-purple-600">--</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">RAM Usage</p>
              <p className="text-2xl font-bold text-blue-600">--</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">API Requests/min</p>
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
