// =========================================
// SESSION DASHBOARD - Admin View
// Real-time monitoring of user session status
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { 
  Users,
  Circle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getActiveSessions, 
  getSessionStats, 
  calculateSessionDuration,
  cleanupStaleSessions 
} from '@/services/sessionService';
import { supabase } from '@/supabase';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { UserSession } from '@/lib/api/types';

interface SessionWithUser extends UserSession {
  user?: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
}

export default function SessionDashboard() {
  const [sessions, setSessions] = useState<SessionWithUser[]>([]);
  const [stats, setStats] = useState({
    totalOnline: 0,
    totalIdle: 0,
    totalOffline: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSessionData();

    // Realtime subscription for session updates
    const sessionChannel = supabase
      .channel('session_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        (payload) => {
          console.log('Session update:', payload);
          loadSessionData();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSessionData();
    }, 30000);

    return () => {
      sessionChannel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadSessionData = async () => {
    try {
      const [sessionsData, statsData] = await Promise.all([
        getActiveSessions(),
        getSessionStats(),
      ]);

      setSessions(sessionsData as SessionWithUser[]);
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      await cleanupStaleSessions();
      await loadSessionData();
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadSessionData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Circle className="w-3 h-3 fill-green-500 text-green-500" />;
      case 'idle':
        return <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />;
      case 'offline':
        return <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />;
      default:
        return <Circle className="w-3 h-3 fill-gray-300 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600">Online</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-600">Idle</Badge>;
      case 'offline':
        return <Badge className="bg-gray-600">Offline</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Real-time user session tracking and monitoring
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {format(lastUpdate, 'HH:mm:ss', { locale: idLocale })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleCleanup}
            variant="outline"
            disabled={loading}
          >
            <Clock className="w-4 h-4 mr-2" />
            Cleanup Stale
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-green-500 text-green-500" />
              Online Users
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalOnline}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Currently active and working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              Idle Users
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalIdle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Inactive for more than 1 minute
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-gray-400 text-gray-400" />
              Offline Users
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalOffline}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Logged out or disconnected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Active Now
            </CardDescription>
            <CardTitle className="text-3xl">{stats.activeUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">
              Online + Idle users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Users currently logged in or recently active</CardDescription>
            </div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const duration = calculateSessionDuration(session);
                const lastActive = session.last_active ? new Date(session.last_active) : null;

                return (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        {session.user?.avatar_url ? (
                          <img 
                            src={session.user.avatar_url} 
                            alt={session.user.full_name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {session.user?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          <p className="font-medium">{session.user?.full_name || 'Unknown User'}</p>
                          <Badge variant="outline" className="text-xs">
                            {session.user?.role || 'user'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{session.user?.email}</p>
                      </div>

                      {/* Session Info */}
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-700">
                          Session: {duration} min
                        </p>
                        <p className="text-xs text-gray-500">
                          Last active: {lastActive ? format(lastActive, 'HH:mm:ss', { locale: idLocale }) : 'N/A'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="hidden sm:block">
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
