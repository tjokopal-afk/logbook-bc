// INTERN LOGBOOK - Complete Redesign

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Send, CheckCircle2, XCircle, Calendar, BarChart3 } from 'lucide-react';
import { LogbookDaily } from '@/components/intern/LogbookDaily';
import { LogbookWeekly } from '@/components/intern/LogbookWeekly';
import { supabase } from '@/supabase';

interface LogbookStats {
  draftCount: number;
  compiledWeeks: number;
  submittedWeeks: number;
  approvedWeeks: number;
  rejectedWeeks: number;
  totalHours: number;
}

export default function MyLogbook() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<LogbookStats>({
    draftCount: 0,
    compiledWeeks: 0,
    submittedWeeks: 0,
    approvedWeeks: 0,
    rejectedWeeks: 0,
    totalHours: 0
  });
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [projectId, setProjectId] = useState<string>('');
  const [mentorId, setMentorId] = useState<string>('');
  const [loadingProject, setLoadingProject] = useState(true);

  const loadProjectInfo = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingProject(true);
      const { data: participation, error } = await supabase
        .from('project_participants')
        .select('project_id, projects!inner(id, name)')
        .eq('user_id', user.id)
        .eq('role_in_project', 'member')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Error loading project:', error);
        return;
      }
      if (participation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const project = (participation as any).projects;
        setProjectId(project.id);
        const { data: mentorData } = await supabase
          .from('project_participants')
          .select('user_id')
          .eq('project_id', project.id)
          .eq('role_in_project', 'pic')
          .limit(1)
          .maybeSingle();
        if (mentorData) setMentorId(mentorData.user_id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingProject(false);
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('category, duration_minutes')
        .eq('user_id', user.id);
      if (error) throw error;
      const entries = data || [];
      const draftCount = entries.filter(e => e.category === 'draft').length;
      const compiledWeeks = new Set(entries.filter(e => e.category?.includes('_log_compile')).map(e => e.category?.match(/weekly_(\d+)_/)?.[1]).filter(Boolean)).size;
      const submittedWeeks = new Set(entries.filter(e => e.category?.includes('_log_submitted')).map(e => e.category?.match(/weekly_(\d+)_/)?.[1]).filter(Boolean)).size;
      const approvedWeeks = new Set(entries.filter(e => e.category?.includes('_log_approved')).map(e => e.category?.match(/weekly_(\d+)_/)?.[1]).filter(Boolean)).size;
      const rejectedWeeks = new Set(entries.filter(e => e.category?.includes('_log_rejected_')).map(e => e.category?.match(/weekly_(\d+)_/)?.[1]).filter(Boolean)).size;
      const totalHours = Math.round(entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60);
      setStats({ draftCount, compiledWeeks, submittedWeeks, approvedWeeks, rejectedWeeks, totalHours });
    } catch (error) {
      console.error('Error:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProjectInfo();
      loadStats();
    }
  }, [user, loadProjectInfo, loadStats]);

  useEffect(() => {
    if (user) loadStats();
  }, [activeTab, user, loadStats]);

  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Logbook Magang</h1>
        <p className="text-gray-600 mt-2">Catat aktivitas harian dan susun laporan mingguan</p>
      </div>
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Statistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm"><FileText className="h-8 w-8 text-gray-600 mb-2 mx-auto" /><p className="text-3xl font-bold text-center">{stats.draftCount}</p><p className="text-xs text-gray-600 text-center mt-1">Draft</p></div>
            <div className="bg-white rounded-lg p-4 shadow-sm"><Calendar className="h-8 w-8 text-blue-600 mb-2 mx-auto" /><p className="text-3xl font-bold text-center text-blue-600">{stats.compiledWeeks}</p><p className="text-xs text-gray-600 text-center mt-1">Compiled</p></div>
            <div className="bg-white rounded-lg p-4 shadow-sm"><Send className="h-8 w-8 text-yellow-600 mb-2 mx-auto" /><p className="text-3xl font-bold text-center text-yellow-600">{stats.submittedWeeks}</p><p className="text-xs text-gray-600 text-center mt-1">Submitted</p></div>
            <div className="bg-white rounded-lg p-4 shadow-sm"><CheckCircle2 className="h-8 w-8 text-green-600 mb-2 mx-auto" /><p className="text-3xl font-bold text-center text-green-600">{stats.approvedWeeks}</p><p className="text-xs text-gray-600 text-center mt-1">Approved</p></div>
            <div className="bg-white rounded-lg p-4 shadow-sm"><XCircle className="h-8 w-8 text-red-600 mb-2 mx-auto" /><p className="text-3xl font-bold text-center text-red-600">{stats.rejectedWeeks}</p><p className="text-xs text-gray-600 text-center mt-1">Rejected</p></div>
            <div className="bg-white rounded-lg p-4 shadow-sm"><Clock className="h-8 w-8 text-purple-600 mb-2 mx-auto" /><p className="text-3xl font-bold text-center text-purple-600">{stats.totalHours}</p><p className="text-xs text-gray-600 text-center mt-1">Total Hours</p></div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="daily">
                <FileText className="h-4 w-4 mr-2" />
                Add Draft
              </TabsTrigger>
              <TabsTrigger value="weekly-draft">
                <Calendar className="h-4 w-4 mr-2" />
                Weekly Draft
              </TabsTrigger>
              <TabsTrigger value="submitted">
                <Send className="h-4 w-4 mr-2" />
                Submitted
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Tab 1: Add Draft (Daily Log) */}
            <TabsContent value="daily" className="mt-0">
              {loadingProject ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading project info...</p>
                  </CardContent>
                </Card>
              ) : (
                <LogbookDaily 
                  userId={user.id} 
                  projectId={projectId}
                  startDate={profile?.start_date}
                />
              )}
            </TabsContent>

            {/* Tab 2: Weekly Draft (Editable before submit) */}
            <TabsContent value="weekly-draft" className="mt-0">
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Select Week
                    </span>
                    <Badge className="bg-blue-600">
                      Week {selectedWeek}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-[180px] overflow-y-auto p-2 bg-white rounded-lg">
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(week => (
                      <Button 
                        key={week} 
                        variant={selectedWeek === week ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedWeek(week)}
                        className={`w-full transition-all ${
                          selectedWeek === week 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-md' 
                            : 'hover:bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        {week}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {loadingProject ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading project info...</p>
                  </CardContent>
                </Card>
              ) : !projectId ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No Project Assigned</p>
                  </CardContent>
                </Card>
              ) : !mentorId ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No Mentor Assigned</p>
                  </CardContent>
                </Card>
              ) : (
                <LogbookWeekly 
                  userId={user.id} 
                  projectId={projectId} 
                  weekNumber={selectedWeek} 
                  mentorId={mentorId} 
                  internName={profile?.full_name || user.email || 'Intern'}
                  startDate={profile?.start_date}
                  mode="draft"
                />
              )}
            </TabsContent>

            {/* Tab 3: Submitted (Read-only view) */}
            <TabsContent value="submitted" className="mt-0">
              <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      Select Week
                    </span>
                    <Badge className="bg-green-600">
                      Week {selectedWeek}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-[180px] overflow-y-auto p-2 bg-white rounded-lg">
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(week => (
                      <Button 
                        key={week} 
                        variant={selectedWeek === week ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSelectedWeek(week)}
                        className={`w-full transition-all ${
                          selectedWeek === week 
                            ? 'bg-green-600 hover:bg-green-700 shadow-md' 
                            : 'hover:bg-green-50 hover:border-green-400'
                        }`}
                      >
                        {week}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {loadingProject ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading project info...</p>
                  </CardContent>
                </Card>
              ) : !projectId ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No Project Assigned</p>
                  </CardContent>
                </Card>
              ) : !mentorId ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <XCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No Mentor Assigned</p>
                  </CardContent>
                </Card>
              ) : (
                <LogbookWeekly 
                  userId={user.id} 
                  projectId={projectId} 
                  weekNumber={selectedWeek} 
                  mentorId={mentorId} 
                  internName={profile?.full_name || user.email || 'Intern'}
                  startDate={profile?.start_date}
                  mode="submitted"
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
