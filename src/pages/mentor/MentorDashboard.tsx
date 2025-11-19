// =========================================
// MENTOR DASHBOARD (Simplified, data-driven)
// =========================================

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import RecentActivity from '@/components/common/RecentActivity';
import { supabase } from '@/supabase';
import { PROJECT_ROLES } from '@/utils/roleConfig';
import { Users, Briefcase, FileCheck, CheckCircle2, XCircle, Send, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MentorDashboard() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [projectStats, setProjectStats] = useState({ total: 0, active: 0, completed: 0, upcoming: 0 }); // PIC projects
  const [globalProjectStats, setGlobalProjectStats] = useState({ total: 0, active: 0, completed: 0 }); // all projects
  const [internsCount, setInternsCount] = useState(0);
  const [reviewedWeeks, setReviewedWeeks] = useState(0);
  const [rejectedWeeks, setRejectedWeeks] = useState(0);
  const [pendingWeeks, setPendingWeeks] = useState(0);

  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;
      try {
        // 1) Projects where I'm PIC
        const { data: picRows } = await supabase
          .from('project_participants')
          .select('project_id, projects!inner(id, status)')
          .eq('user_id', profile.id)
          .eq('role_in_project', PROJECT_ROLES.PIC);

        const projects = (picRows || []).map((r: any) => r.projects).filter(Boolean);
        const uniqueProjects = Array.from(new Map(projects.map((p: any) => [p.id, p])).values());
        const projectIds = uniqueProjects.map((p: any) => p.id);

        const total = uniqueProjects.length;
        const active = uniqueProjects.filter((p: any) => p.status === 'active').length;
        const completed = uniqueProjects.filter((p: any) => p.status === 'completed').length;
        const upcoming = uniqueProjects.filter((p: any) => p.status === 'upcoming').length;
        setProjectStats({ total, active, completed, upcoming });

        // 2) Interns assigned to this mentor (from profiles.mentor field)
        const { data: myInterns } = await supabase
          .from('profiles')
          .select('id')
          .eq('mentor', profile.id)
          .eq('role', 'intern');
        setInternsCount((myInterns || []).length);

        // 3) Weekly logs unique counts by status (submitted/approved/rejected)
        if (projectIds.length > 0) {
          const { data: weeklyEntries } = await supabase
            .from('logbook_entries')
            .select('category, user_id, project_id')
            .in('project_id', projectIds)
            .or('category.like.%_log_submitted,category.like.%_log_approved,category.like.%_log_rejected_%');

          const submittedSet = new Set<string>();
          const approvedSet = new Set<string>();
          const rejectedSet = new Set<string>();
          (weeklyEntries || []).forEach((e: { category?: string; user_id?: string; project_id?: string }) => {
            const wk = e.category?.match(/weekly_(\d+)_/);
            if (!wk) return;
            const key = `${e.user_id}-${e.project_id}-${wk[1]}`;
            if (e.category?.includes('_log_submitted')) submittedSet.add(key);
            else if (e.category?.includes('_log_approved')) approvedSet.add(key);
            else if (e.category?.includes('_log_rejected_')) rejectedSet.add(key);
          });
          setPendingWeeks(submittedSet.size);
          setRejectedWeeks(rejectedSet.size);
          setReviewedWeeks(approvedSet.size + rejectedSet.size);
        } else {
          setPendingWeeks(0);
          setRejectedWeeks(0);
          setReviewedWeeks(0);
        }
      } catch (e) {
        console.error('Load mentor dashboard data error:', e);
      } finally {
        // no-op
      }
    };
    loadData();
  }, [profile?.id]);

  // Global project stats for row 3
  useEffect(() => {
    const loadGlobalProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('status');
        if (error) throw error;
        const list = (data || []) as Array<{ status?: string }>;
        const total = list.length;
        const active = list.filter((p) => p.status === 'active').length;
        const completed = list.filter((p) => p.status === 'completed').length;
        setGlobalProjectStats({ total, active, completed });
      } catch (e) {
        console.error('Load global project stats error:', e);
        setGlobalProjectStats({ total: 0, active: 0, completed: 0 });
      }
    };
    loadGlobalProjects();
  }, []);

  const welcomeName = useMemo(() => profile?.full_name || 'Mentor', [profile?.full_name]);

  return (
    <div className="p-6 space-y-6">
      {/* Row 1: Welcome + Department */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {welcomeName}</CardTitle>
            <CardDescription>Ringkasan mentor: proyek, intern, dan logbook</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5" />Departement</CardTitle>
            <CardDescription>Dari profil Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold">{profile?.affiliation || '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Intern & Logbook summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card onClick={() => navigate('/mentor/intern-saya')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" />Intern</CardTitle>
            <CardDescription>Jumlah intern yang dibawahi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{internsCount}</div>
          </CardContent>
        </Card>
        <Card onClick={() => navigate('/mentor/review-logbook')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FileCheck className="w-5 h-5" />Reviewed</CardTitle>
            <CardDescription>Logbook yang sudah direview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{reviewedWeeks}</div>
          </CardContent>
        </Card>
        <Card onClick={() => navigate('/mentor/review-logbook')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><XCircle className="w-5 h-5" />Rejected</CardTitle>
            <CardDescription>Penolakan logbook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">{rejectedWeeks}</div>
          </CardContent>
        </Card>
        <Card onClick={() => navigate('/mentor/review-logbook')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Send className="w-5 h-5" />Pending</CardTitle>
            <CardDescription>Menunggu review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-600">{pendingWeeks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card onClick={() => navigate('/mentor/review-logbook')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck className="w-5 h-5" />Review Logbook</CardTitle>
            <CardDescription>Nilai & berikan feedback</CardDescription>
          </CardHeader>
        </Card>
        <Card onClick={() => navigate('/mentor/projects')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" />Kelola Proyek</CardTitle>
            <CardDescription>Lihat proyek yang Anda tangani</CardDescription>
          </CardHeader>
        </Card>
        <Card onClick={() => navigate('/mentor/intern-saya')} className="cursor-pointer hover:shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Intern Saya</CardTitle>
            <CardDescription>Daftar intern bimbingan</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Row 4: Recent activity */}
      <div className="grid gap-4 lg:grid-cols-1">
        <RecentActivity role="mentor" userId={profile?.id} limit={8} />
      </div>
    </div>
  );
}
