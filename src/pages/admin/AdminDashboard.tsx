// =========================================
// ADMIN DASHBOARD
// =========================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Users, User, Briefcase, BookOpen, Activity, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase';

export default function AdminDashboard() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [projStats, setProjStats] = useState({ total: 0, active: 0, completed: 0, upcoming: 0 });
  const [userStats, setUserStats] = useState({ total: 0, interns: 0, mentors: 0, admins: 0 });
  const [logbookStats, setLogbookStats] = useState({ daily: 0, weeklyPending: 0 });

  useEffect(() => {
    refreshProfile(); // Ensure current user profile
  }, []);

  useEffect(() => {
    const loadProjectStats = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('status');
        if (error) throw error;
        const list = data || [];
        const total = list.length;
        const active = list.filter((p: { status?: string }) => p.status === 'active').length;
        const completed = list.filter((p: { status?: string }) => p.status === 'completed').length;
        const upcoming = list.filter((p: { status?: string }) => p.status === 'upcoming').length;
        setProjStats({ total, active, completed, upcoming });
      } catch (e) {
        console.error('Load admin project stats error:', e);
        setProjStats({ total: 0, active: 0, completed: 0, upcoming: 0 });
      }
    };
    loadProjectStats();
  }, []);

  useEffect(() => {
    const loadUserAndLogbookStats = async () => {
      try {
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: interns } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'intern');

        const { count: mentors } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'mentor');

        const { count: admins } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        setUserStats({
          total: totalUsers || 0,
          interns: interns || 0,
          mentors: mentors || 0,
          admins: admins || 0,
        });

        const { count: daily } = await supabase
          .from('logbook_entries')
          .select('*', { count: 'exact', head: true });

        const { count: weeklyPending } = await supabase
          .from('logbook_weekly')
          .select('*', { count: 'exact', head: true })
          .eq('reviewed', false);

        setLogbookStats({ daily: daily || 0, weeklyPending: weeklyPending || 0 });
      } catch (e) {
        console.error('Load admin user/logbook stats error:', e);
        setUserStats({ total: 0, interns: 0, mentors: 0, admins: 0 });
        setLogbookStats({ daily: 0, weeklyPending: 0 });
      }
    };
    loadUserAndLogbookStats();
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg border">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Admin Dashboard
              <Badge variant="secondary">Admin</Badge>
            </h1>
            {/* Removed duplicate admin info line to avoid redundancy */}
          </div>
        </div>
      </div>

      {/* Quick Actions with real counts */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Akses cepat dengan ringkasan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => navigate('/admin/data-intern')} className="p-4 border rounded-lg cursor-pointer hover:shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-blue-50 border border-blue-100"><User className="w-4 h-4 text-blue-600" /></div>
                <div className="text-2xl font-bold text-blue-700">{userStats.interns}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Interns</div>
            </div>
            <div onClick={() => navigate('/admin/kelola-user')} className="p-4 border rounded-lg cursor-pointer hover:shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-teal-50 border border-teal-100"><Users className="w-4 h-4 text-teal-600" /></div>
                <div className="text-2xl font-bold text-teal-700">{userStats.mentors}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mentors</div>
            </div>
            <div onClick={() => navigate('/admin/kelola-project')} className="p-4 border rounded-lg cursor-pointer hover:shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-purple-50 border border-purple-100"><Briefcase className="w-4 h-4 text-purple-600" /></div>
                <div className="text-2xl font-bold text-purple-700">{projStats.total}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Projects</div>
            </div>
            <div onClick={() => navigate('/admin/monitoring')} className="p-4 border rounded-lg cursor-pointer hover:shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-cyan-50 border border-cyan-100"><BookOpen className="w-4 h-4 text-cyan-600" /></div>
                <div className="text-2xl font-bold text-cyan-700">{logbookStats.daily}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Logbooks</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" onClick={() => navigate('/admin/kelola-user')}>Kelola User</Button>
            <Button variant="outline" onClick={() => navigate('/admin/data-intern')}>Data Intern</Button>
            <Button variant="outline" onClick={() => navigate('/admin/kelola-project')}>Kelola Project</Button>
            <Button variant="outline" onClick={() => navigate('/admin/monitoring')}>Monitoring</Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Info</CardTitle>
          <CardDescription>Status ringkas proyek</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => navigate('/admin/kelola-project')} className="p-4 border rounded-lg cursor-pointer hover:shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-green-50 border border-green-100"><Activity className="w-4 h-4 text-green-600" /></div>
                <div className="text-2xl font-bold text-green-700">{projStats.active}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Active</div>
            </div>
            <div onClick={() => navigate('/admin/kelola-project')} className="p-4 border rounded-lg cursor-pointer hover:shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-md bg-blue-50 border border-blue-100"><CheckCircle2 className="w-4 h-4 text-blue-600" /></div>
                <div className="text-2xl font-bold text-blue-700">{projStats.completed}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
