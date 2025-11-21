// =========================================
// INTERN DASHBOARD
// =========================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import UpcomingDeadlines from '@/components/common/UpcomingDeadlines';
import RecentActivity from '@/components/common/RecentActivity';
import { supabase } from '@/supabase';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Send, CheckCircle2, XCircle, Clock, Briefcase } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function InternDashboard() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [weeklySubmitted, setWeeklySubmitted] = useState<boolean>(false);

  // Logbook stats (moved here)
  const [logStats, setLogStats] = useState({
    draftCount: 0,
    submittedWeeks: 0,
    approvedWeeks: 0,
    rejectedWeeks: 0,
    totalHoursSubmitted: 0,
  });

  // Project counts for quick action card
  const [projectCounts, setProjectCounts] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // removed dueSoon/overdue badges; summary now shows elapsed/total days

  // Helper: current internship week number based on profile.start_date
  const currentWeek = useMemo(() => {
    if (!profile?.start_date) return undefined;
    const base = new Date(profile.start_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor(diffDays / 7) + 1);
  }, [profile?.start_date]);

  // Check if this week's logbook has been submitted
  useEffect(() => {
    const checkWeeklySubmission = async () => {
      if (!profile?.id || !currentWeek) return;
      const likePattern = `weekly_${currentWeek}_log_%`;
      const { data } = await supabase
        .from('logbook_entries')
        .select('id, category')
        .eq('user_id', profile.id)
        .like('category', likePattern)
        .limit(1);
      const found = (data || []).some((row: any) => (row as any).category?.includes('submitted'));
      setWeeklySubmitted(found);
    };
    checkWeeklySubmission();
  }, [profile?.id, currentWeek]);

  // Load logbook summary stats
  useEffect(() => {
    const loadLogStats = async () => {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('category, duration_minutes')
        .eq('user_id', profile.id);
      if (error) return;
      const entries = (data || []) as Array<{ category?: string; duration_minutes?: number }>;
      const draftCount = entries.filter(e => e.category === 'draft').length;
      const submittedWeeks = new Set(
        entries.filter(e => (e.category || '').includes('_log_submitted') && !(e.category || '').includes('_log_approved') && !(e.category || '').includes('_log_rejected'))
               .map(e => e.category?.match(/weekly_(\d+)_/)?.[1])
               .filter(Boolean as unknown as (x: unknown) => x is string)
      ).size;
      const approvedWeeks = new Set(
        entries.filter(e => (e.category || '').includes('_log_approved'))
               .map(e => e.category?.match(/weekly_(\d+)_/)?.[1])
               .filter(Boolean as unknown as (x: unknown) => x is string)
      ).size;
      const rejectedWeeks = new Set(
        entries.filter(e => (e.category || '').includes('_log_rejected_'))
               .map(e => e.category?.match(/weekly_(\d+)_/)?.[1])
               .filter(Boolean as unknown as (x: unknown) => x is string)
      ).size;
      // Total hours from all daily durations (one decimal precision)
      const totalHoursSubmitted = parseFloat(
        (
          entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60
        ).toFixed(1)
      );
      setLogStats({ draftCount, submittedWeeks, approvedWeeks, rejectedWeeks, totalHoursSubmitted });
    };
    loadLogStats();
  }, [profile?.id]);

  // Load project counts for intern
  useEffect(() => {
    const loadProjectCounts = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('project_participants')
        .select('project_id, projects!inner(id, status)')
        .eq('user_id', profile.id);
      const items = (data || []) as Array<any>;
      const projects = items.map(it => it.projects).filter(Boolean);
      const ids = new Set(projects.map((p: any) => p.id));
      const uniqueProjects = Array.from(ids).map(id => projects.find((p: any) => p.id === id));
      const total = uniqueProjects.length;
      const completed = uniqueProjects.filter((p: any) => p.status === 'completed').length;
      setProjectCounts({ total, completed });
    };
    loadProjectCounts();
  }, [profile?.id]);

  return (
    <div className="p-6 space-y-6">
      {/* Row 1: Welcome + Logbook minggu ini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {profile?.full_name || 'Intern'}</CardTitle>
            <CardDescription>Ringkasan cepat aktivitas dan tugas Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {profile?.start_date && profile?.end_date ? (
                (() => {
                  const start = new Date(profile.start_date!);
                  const end = new Date(profile.end_date!);
                  const total = Math.max(1, differenceInDays(end, start) + 1);
                  const elapsedRaw = differenceInDays(new Date(), start) + 1;
                  const elapsed = Math.min(Math.max(0, elapsedRaw), total);
                  return (
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {elapsed}/{total} hari
                    </Badge>
                  );
                })()
              ) : (
                <span className="text-sm text-muted-foreground">Lengkapi start dan end date di profil untuk melihat progres hari</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-4 h-4" />Logbook Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {currentWeek ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Week {currentWeek}</p>
                  <p className="text-sm">Status: {weeklySubmitted ? 'Submitted' : 'Belum Submit'}</p>
                </div>
                <Button onClick={() => navigate('/intern/laporan')} variant="outline">Open</Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Set your internship start date to track weekly logbook.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Ringkasan Statistik (moved from logbook) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Ringkasan Logbook</CardTitle>
          <CardDescription>Statistik dari logbook mingguan. Klik untuk membuka detail.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div onClick={() => navigate('/intern/laporan')} className="bg-white rounded-lg p-4 border hover:shadow cursor-pointer text-center">
              <FileText className="h-6 w-6 text-gray-600 mb-2 mx-auto" />
              <p className="text-2xl font-bold">{logStats.draftCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Draft</p>
            </div>
            <div onClick={() => navigate('/intern/status-dan-review')} className="bg-white rounded-lg p-4 border hover:shadow cursor-pointer text-center">
              <Send className="h-6 w-6 text-yellow-600 mb-2 mx-auto" />
              <p className="text-2xl font-bold text-yellow-600">{logStats.submittedWeeks}</p>
              <p className="text-xs text-muted-foreground mt-1">Under Review</p>
            </div>
            <div onClick={() => navigate('/intern/status-dan-review')} className="bg-white rounded-lg p-4 border hover:shadow cursor-pointer text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mb-2 mx-auto" />
              <p className="text-2xl font-bold text-green-600">{logStats.approvedWeeks}</p>
              <p className="text-xs text-muted-foreground mt-1">Approved</p>
            </div>
            <div onClick={() => navigate('/intern/status-dan-review')} className="bg-white rounded-lg p-4 border hover:shadow cursor-pointer text-center">
              <XCircle className="h-6 w-6 text-red-600 mb-2 mx-auto" />
              <p className="text-2xl font-bold text-red-600">{logStats.rejectedWeeks}</p>
              <p className="text-xs text-muted-foreground mt-1">Rejected</p>
            </div>
            <div onClick={() => navigate('/intern/status-dan-review')} className="bg-white rounded-lg p-4 border hover:shadow cursor-pointer text-center">
              <Clock className="h-6 w-6 text-purple-600 mb-2 mx-auto" />
              <p className="text-2xl font-bold text-purple-600">{logStats.totalHoursSubmitted}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Quick actions row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card onClick={() => navigate('/intern/laporan')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />New draft</CardTitle>
            <CardDescription>Tambahkan entri logbook harian</CardDescription>
          </CardHeader>
        </Card>
        <Card onClick={() => navigate('/intern/status-dan-review')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />Task</CardTitle>
            <CardDescription>Lihat status tugas dan review</CardDescription>
          </CardHeader>
        </Card>
        <Card onClick={() => navigate('/intern/project-saya')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" />Project</CardTitle>
            <CardDescription>
              {projectCounts.total}/{projectCounts.completed} (total/selesai)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Row 4: Upcoming deadlines and recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingDeadlines limit={5} userId={profile?.id} />
        <RecentActivity role="intern" limit={5} userId={profile?.id} />
      </div>
    </div>
  );
}
