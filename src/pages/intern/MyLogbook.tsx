// INTERN LOGBOOK - Complete Redesign

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, XCircle, Calendar } from 'lucide-react';
import { LogbookDaily } from '@/components/intern/LogbookDaily';
import { LogbookWeekly } from '@/components/intern/LogbookWeekly';
import { supabase } from '@/supabase';

export default function MyLogbook() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [projectId, setProjectId] = useState<string>('');
  const [mentorId, setMentorId] = useState<string>('');
  const [loadingProject, setLoadingProject] = useState(true);
  const [submittedWeeks, setSubmittedWeeks] = useState<number[]>([]);

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

  const loadSubmittedWeeks = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('category')
        .eq('user_id', user.id)
        .or('category.like.weekly_%_log_submitted,category.like.weekly_%_log_approved,category.like.weekly_%_log_rejected_%');
      if (error) return;
      const weeksSet = new Set<number>(
        (data || []).map((e: { category: string }) => {
          const m = e.category?.match(/weekly_(\d+)_/);
          return m ? parseInt(m[1]) : 0;
        }).filter((n: number) => !!n)
      );
      const weeks: number[] = Array.from(weeksSet).sort((a: number, b: number) => a - b);
      setSubmittedWeeks(weeks as number[]);
    } catch {}
  }, [user]);


  useEffect(() => {
    if (user) {
      loadProjectInfo();
      loadSubmittedWeeks();
    }
  }, [user, loadProjectInfo, loadSubmittedWeeks]);

  // Removed statistics section; stats are now shown on dashboard

  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Logbook Magang</h1>
        <p className="text-gray-600 mt-2">Catat aktivitas harian dan susun laporan mingguan</p>
      </div>
      <Card className="shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="daily">
                <FileText className="h-4 w-4 mr-2" />
                Add Draft
              </TabsTrigger>
              <TabsTrigger value="weekly-draft">
                <Calendar className="h-4 w-4 mr-2" />
                Weekly Draft
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
                        className={`w-full transition-all relative ${
                          selectedWeek === week 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-md' 
                            : 'hover:bg-blue-50 hover:border-blue-400'
                        }`}
                      >
                        {week}
                        {submittedWeeks.includes(week) && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="Submitted" />
                        )}
                      </Button>
                    ))}
                  </div>
                  {/* Keterangan status minggu terpilih */}
                  <div className="mt-3">
                    {submittedWeeks.includes(selectedWeek) ? (
                      <p className="text-sm text-green-700">Week {selectedWeek} sudah disubmit.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Pilih minggu untuk melihat dan submit draft mingguan.</p>
                    )}
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
                  mode={submittedWeeks.includes(selectedWeek) ? 'submitted' : 'draft'}
                />
              )}
            </TabsContent>

            
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
