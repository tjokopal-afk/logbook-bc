// =========================================
// DASHBOARD STATS WIDGET
// Key metrics and statistics for different user roles
// =========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase';
import type { Profile } from '@/lib/api/types';
import { ROLES, PROJECT_ROLES } from '@/utils/roleConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Award,
} from 'lucide-react';

// =========================================
// INTERFACES
// =========================================

interface DashboardStats {
  // Universal stats
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;

  // Task stats
  totalTasks: number;
  pendingTasks: number;
  submittedTasks: number;
  approvedTasks: number;
  rejectedTasks: number;

  // User-specific stats
  myTasks?: number;
  myCompletedTasks?: number;
  tasksToReview?: number;

  // Admin stats
  totalUsers?: number;
  activeUsers?: number;
  totalLogbookEntries?: number;
  pendingReviews?: number;
  approvedLogbooks?: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  onClick?: () => void;
}

interface DashboardStatsProps {
  userId?: string;
  role?: 'admin' | 'mentor' | 'intern' | 'superuser';
  mode?: 'default' | 'intern';
  linkMap?: Record<string, string>;
}

// =========================================
// STAT CARD COMPONENT
// =========================================

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  colorClass = 'bg-blue-500',
  onClick,
}) => {
  return (
    <Card onClick={onClick} className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${colorClass} p-2 rounded-lg text-white`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp
              className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`}
            />
            <span>
              {trend.isPositive ? '+' : ''}
              {trend.value}% dari minggu lalu
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// =========================================
// MAIN COMPONENT
// =========================================

const DashboardStats: React.FC<DashboardStatsProps> = ({ userId, role, mode = 'default', linkMap }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    submittedTasks: 0,
    approvedTasks: 0,
    rejectedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const navigate = useNavigate();

  // =========================================
  // FETCH CURRENT USER
  // =========================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCurrentUser(profile as Profile);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    if (!userId) {
      fetchCurrentUser();
    }
  }, [userId]);

  // =========================================
  // FETCH STATS
  // =========================================

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveUserId = userId || currentUser?.id;
      const effectiveRole = role || currentUser?.role;

      // Force fresh data - no cache
      const timestamp = Date.now();
      console.log(`[DashboardStats] Fetching fresh stats at ${timestamp} for role: ${effectiveRole}`);

      const newStats: DashboardStats = {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        pendingTasks: 0,
        submittedTasks: 0,
        approvedTasks: 0,
        rejectedTasks: 0,
      };

      // Fetch project stats
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: completedProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      newStats.totalProjects = totalProjects || 0;
      newStats.activeProjects = activeProjects || 0;
      newStats.completedProjects = completedProjects || 0;

      // Fetch task stats
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const { count: pendingTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_submitted', false);

      const { count: submittedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_submitted', true)
        .eq('is_reviewed', false);

      const { count: approvedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_reviewed', true)
        .eq('is_rejected', false);

      const { count: rejectedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_rejected', true);

      newStats.totalTasks = totalTasks || 0;
      newStats.pendingTasks = pendingTasks || 0;
      newStats.submittedTasks = submittedTasks || 0;
      newStats.approvedTasks = approvedTasks || 0;
      newStats.rejectedTasks = rejectedTasks || 0;

      // Role-specific stats
      if (effectiveRole === ROLES.ADMIN || effectiveRole === ROLES.SUPERUSER) {
        // Admin stats
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: totalLogbookEntries } = await supabase
          .from('logbook_entries')
          .select('*', { count: 'exact', head: true });

        // Count pending weekly submissions (category contains '_log_submitted' but not approved/rejected)
        const { data: allSubmitted } = await supabase
          .from('logbook_entries')
          .select('category')
          .like('category', '%_log_submitted');
        
        const pendingReviews = (allSubmitted || []).filter(e => 
          !e.category.includes('approved') && !e.category.includes('rejected')
        ).length;

        // Count approved logbooks for admin
        const { data: approvedEntries } = await supabase
          .from('logbook_entries')
          .select('id')
          .like('category', '%_log_approved');

        newStats.totalUsers = totalUsers || 0;
        newStats.totalLogbookEntries = totalLogbookEntries || 0;
        newStats.pendingReviews = pendingReviews || 0;
        newStats.approvedLogbooks = (approvedEntries || []).length;
      } else if (effectiveRole === ROLES.MENTOR && effectiveUserId) {
        // Mentor stats - tasks to review
        const { count: tasksToReview } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('is_submitted', true)
          .eq('is_reviewed', false);

        newStats.tasksToReview = tasksToReview || 0;

        // Get mentor's projects (where mentor is PIC)
        const { data: mentorProjects } = await supabase
          .from('project_participants')
          .select('project_id')
          .eq('user_id', effectiveUserId)
          .eq('role_in_project', PROJECT_ROLES.PIC);

        const mentorProjectIds = (mentorProjects || []).map(p => p.project_id);

        if (mentorProjectIds.length > 0) {
          // Logbook weekly submissions pending review from mentor's projects only
          const { data: allSubmitted } = await supabase
            .from('logbook_entries')
            .select('category, project_id')
            .in('project_id', mentorProjectIds)
            .like('category', '%_log_submitted');
          
          const pendingReviews = (allSubmitted || []).filter(e => 
            !e.category.includes('approved') && !e.category.includes('rejected')
          ).length;

          newStats.pendingReviews = pendingReviews;
          
          // Count approved logbooks from mentor's projects only
          const { data: approvedEntries } = await supabase
            .from('logbook_entries')
            .select('id')
            .in('project_id', mentorProjectIds)
            .like('category', '%_log_approved');
          
          newStats.approvedLogbooks = (approvedEntries || []).length;
        } else {
          newStats.pendingReviews = 0;
          newStats.approvedLogbooks = 0;
        }
      } else if (effectiveRole === ROLES.INTERN && effectiveUserId) {
        // Intern stats - my tasks
        const { count: myTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', effectiveUserId);

        const { count: myCompletedTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', effectiveUserId)
          .eq('is_reviewed', true)
          .eq('is_rejected', false);

        newStats.myTasks = myTasks || 0;
        newStats.myCompletedTasks = myCompletedTasks || 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, role, currentUser]);

  useEffect(() => {
    if (currentUser || userId) {
      fetchStats();
    }
  }, [currentUser, userId, fetchStats]);

  // =========================================
  // RENDER
  // =========================================

  const effectiveRole = role || currentUser?.role;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const renderUniversalAndTaskStats = () => (
    <>
      <div>
        <h3 className="text-lg font-semibold mb-4">Ringkasan Proyek</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Proyek"
            value={stats.totalProjects}
            icon={<FolderKanban className="w-4 h-4" />}
            description="Semua proyek dalam sistem"
            colorClass="bg-blue-500"
          />
          <StatCard
            title="Proyek Aktif"
            value={stats.activeProjects}
            icon={<Clock className="w-4 h-4" />}
            description="Proyek yang sedang berjalan"
            colorClass="bg-green-500"
          />
          <StatCard
            title="Proyek Selesai"
            value={stats.completedProjects}
            icon={<CheckCircle2 className="w-4 h-4" />}
            description="Proyek yang telah diselesaikan"
            colorClass="bg-purple-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Ringkasan Tugas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tugas"
            value={stats.totalTasks}
            icon={<ListTodo className="w-4 h-4" />}
            description="Semua tugas"
            colorClass="bg-slate-500"
            onClick={linkMap?.totalTasks ? (() => navigate(linkMap.totalTasks)) : undefined}
          />
          <StatCard
            title="Pending"
            value={stats.pendingTasks}
            icon={<AlertTriangle className="w-4 h-4" />}
            description="Belum dikerjakan"
            colorClass="bg-yellow-500"
            onClick={linkMap?.pendingTasks ? (() => navigate(linkMap.pendingTasks)) : undefined}
          />
          <StatCard
            title="Direview"
            value={stats.submittedTasks}
            icon={<Clock className="w-4 h-4" />}
            description="Menunggu review"
            colorClass="bg-blue-500"
            onClick={linkMap?.submittedTasks ? (() => navigate(linkMap.submittedTasks)) : undefined}
          />
          <StatCard
            title="Disetujui"
            value={stats.approvedTasks}
            icon={<CheckCircle2 className="w-4 h-4" />}
            description="Tugas selesai"
            colorClass="bg-green-500"
            onClick={linkMap?.approvedTasks ? (() => navigate(linkMap.approvedTasks)) : undefined}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {mode !== 'intern' && renderUniversalAndTaskStats()}

      {/* Role-Specific Stats */}
      {effectiveRole === ROLES.ADMIN || effectiveRole === ROLES.SUPERUSER ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Statistik Admin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Pengguna"
              value={stats.totalUsers || 0}
              icon={<Users className="w-4 h-4" />}
              description="Semua pengguna terdaftar"
              colorClass="bg-indigo-500"
            />
            <StatCard
              title="Entri Logbook"
              value={stats.totalLogbookEntries || 0}
              icon={<FileText className="w-4 h-4" />}
              description="Total entri logbook harian"
              colorClass="bg-cyan-500"
            />
            <StatCard
              title="Pending Review"
              value={stats.pendingReviews || 0}
              icon={<AlertTriangle className="w-4 h-4" />}
              description="Logbook mingguan perlu review"
              colorClass="bg-yellow-500"
            />
            <StatCard
              title="Approved"
              value={stats.approvedLogbooks || 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
              description="Logbook yang disetujui"
              colorClass="bg-green-500"
            />
          </div>
        </div>
      ) : effectiveRole === ROLES.MENTOR ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Tugas Mentor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Tugas Perlu Review"
              value={stats.tasksToReview || 0}
              icon={<ListTodo className="w-4 h-4" />}
              description="Tugas menunggu review Anda"
              colorClass="bg-orange-500"
            />
            <StatCard
              title="Pending Review"
              value={stats.pendingReviews || 0}
              icon={<Clock className="w-4 h-4" />}
              description="Logbook perlu review"
              colorClass="bg-yellow-500"
            />
            <StatCard
              title="Approved"
              value={stats.approvedLogbooks || 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
              description="Logbook yang disetujui"
              colorClass="bg-green-500"
            />
          </div>
        </div>
      ) : effectiveRole === ROLES.INTERN ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">Tugas Saya</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Tugas Saya"
              value={stats.myTasks || 0}
              icon={<ListTodo className="w-4 h-4" />}
              description="Total tugas yang diberikan"
              colorClass="bg-blue-500"
              onClick={linkMap?.myTasks ? (() => navigate(linkMap.myTasks)) : undefined}
            />
            <StatCard
              title="Tugas Selesai"
              value={stats.myCompletedTasks || 0}
              icon={<Award className="w-4 h-4" />}
              description="Tugas yang telah diselesaikan"
              colorClass="bg-green-500"
              onClick={linkMap?.myCompletedTasks ? (() => navigate(linkMap.myCompletedTasks)) : undefined}
            />
          </div>
        </div>
      ) : null}

      {/* Completion Rate */}
      {(effectiveRole === ROLES.INTERN ? (stats.myTasks || 0) > 0 : stats.totalTasks > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Tingkat Penyelesaian Tugas</CardTitle>
            <CardDescription>
              {effectiveRole === ROLES.INTERN ? 'Progress tugas pribadi' : 'Persentase tugas yang telah diselesaikan'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">
                  {effectiveRole === ROLES.INTERN
                    ? Math.round(((stats.myCompletedTasks || 0) / (stats.myTasks || 1)) * 100)
                    : Math.round((stats.approvedTasks / stats.totalTasks) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{
                    width: `${effectiveRole === ROLES.INTERN
                      ? (((stats.myCompletedTasks || 0) / (stats.myTasks || 1)) * 100)
                      : ((stats.approvedTasks / stats.totalTasks) * 100)}%`,
                  }}
                >
                  <span className="text-xs text-white font-semibold">
                    {effectiveRole === ROLES.INTERN
                      ? `${stats.myCompletedTasks || 0}/${stats.myTasks || 0}`
                      : `${stats.approvedTasks}/${stats.totalTasks}`}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                {effectiveRole === ROLES.INTERN ? (
                  <>
                    <span>Total: {stats.myTasks || 0}</span>
                    <span>Selesai: {stats.myCompletedTasks || 0}</span>
                  </>
                ) : (
                  <>
                    <span>Pending: {stats.pendingTasks}</span>
                    <span>Direview: {stats.submittedTasks}</span>
                    <span>Selesai: {stats.approvedTasks}</span>
                    <span>Ditolak: {stats.rejectedTasks}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardStats;
