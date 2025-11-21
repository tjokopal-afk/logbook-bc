// =========================================
// INTERN LOGBOOK DASHBOARD - Main Hub
// Clean interface showing all logbook sections
// =========================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import { LogbookDaily } from '@/components/intern/LogbookDaily';
import { LogbookWeekly } from '@/components/intern/LogbookWeekly';
import { supabase } from '@/supabase';
import { PROJECT_ROLES } from '@/utils/roleConfig';

interface LogbookStats {
  draftCount: number;
  approvedWeeks: number;
  rejectedWeeks: number;
  totalHours: number;
}

export default function InternLogbookDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<LogbookStats>({
    draftCount: 0,
    approvedWeeks: 0,
    rejectedWeeks: 0,
    totalHours: 0
  });
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([1]);

  // Get user's project and mentor info
  const [projectId, setProjectId] = useState<string>('');
  const [mentorId, setMentorId] = useState<string>('');

  // Load project info from database
  useEffect(() => {
    const loadProjectInfo = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('project_participants')
          .select('project_id, projects!inner(id, name)')
          .eq('user_id', user.id)
          .eq('role_in_project', PROJECT_ROLES.MEMBER)
          .limit(1)
          .maybeSingle();

        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const project = (data as any).projects;
          setProjectId(project.id);
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    if (user) loadProjectInfo();
  }, [user]);

  // Load mentor from profile
  useEffect(() => {
    if (profile?.mentor) {
      setMentorId(profile.mentor);
    }
  }, [profile]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get all logbook entries for this user
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('category, duration_minutes')
        .eq('user_id', user.id);

      if (error) throw error;

      const entries = data || [];

      // Count by category - only count truly pending drafts
      const draftCount = entries.filter(e => e.category === 'draft').length;
      
      // Extract week numbers from approved and rejected entries
      const approvedWeeks = new Set(
        entries
          .filter(e => e.category?.includes('_log_approved'))
          .map(e => e.category?.match(/weekly_(\d+)_/)?.[1])
          .filter(Boolean)
      ).size;

      const rejectedWeeks = new Set(
        entries
          .filter(e => e.category?.includes('_log_rejected_'))
          .map(e => e.category?.match(/weekly_(\d+)_/)?.[1])
          .filter(Boolean)
      ).size;

      // Calculate total hours
      const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      const totalHours = Math.round(totalMinutes / 60);

      setStats({
        draftCount,
        approvedWeeks,
        rejectedWeeks,
        totalHours
      });

      // Calculate available weeks dynamically
      const weeksWithData = new Set<number>();
      entries.forEach(e => {
        const match = e.category?.match(/weekly_(\d+)_/);
        if (match) {
          weeksWithData.add(parseInt(match[1]));
        }
      });

      // Calculate current week based on start_date
      if (profile?.start_date) {
        const start = new Date(profile.start_date);
        const today = new Date();
        const startDayOfWeek = start.getDay();
        const daysUntilSunday = (7 - startDayOfWeek) % 7;
        const firstSunday = new Date(start);
        firstSunday.setDate(start.getDate() + daysUntilSunday);

        let currentWeek = 1;
        if (today >= firstSunday) {
          const diffTime = today.getTime() - firstSunday.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          currentWeek = Math.floor(diffDays / 7) + 2;
        }

        // Include current week even if no data yet
        weeksWithData.add(currentWeek);
      }

      // Convert to sorted array
      const weeks = Array.from(weeksWithData).sort((a, b) => a - b);
      setAvailableWeeks(weeks.length > 0 ? weeks : [1]);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats, activeTab]);

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Logbook Magang</h1>
        <p className="text-muted-foreground mt-2">
          Catat aktivitas harian dan susun laporan mingguan Anda
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" key={`stats-${stats.draftCount}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.draftCount}</p>
                <p className="text-xs text-gray-600">Draft Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approvedWeeks}</p>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.rejectedWeeks}</p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalHours}</p>
                <p className="text-xs text-gray-600">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">
            <FileText className="h-4 w-4 mr-2" />
            Daily Log
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly Compilation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <LogbookDaily
            userId={user.id}
            projectId={projectId}
            taskId={undefined}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {/* Week Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Week</CardTitle>
              <CardDescription>
                {availableWeeks.length > 0 
                  ? `Choose which week to compile/view (${availableWeeks.length} weeks available)`
                  : 'No weeks with entries yet. Start by adding daily logs.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableWeeks.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {availableWeeks.map((week) => {
                    // Calculate date range for display
                    const start = profile.start_date ? new Date(profile.start_date) : new Date();
                    const startDayOfWeek = start.getDay();
                    const daysUntilSunday = (7 - startDayOfWeek) % 7;
                    const firstSunday = new Date(start);
                    firstSunday.setDate(start.getDate() + daysUntilSunday);
                    
                    let weekStart, weekEnd;
                    if (week === 1) {
                      weekStart = start;
                      weekEnd = firstSunday;
                    } else {
                      weekStart = new Date(firstSunday);
                      weekStart.setDate(firstSunday.getDate() + (week - 2) * 7 + 1);
                      weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                    }
                    
                    const dateLabel = `${weekStart.getDate()} ${weekStart.toLocaleDateString('en-US', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('en-US', { month: 'short' })}`;
                    
                    return (
                      <Button
                        key={week}
                        variant={selectedWeek === week ? 'default' : 'outline'}
                        onClick={() => setSelectedWeek(week)}
                        className="flex flex-col h-auto py-2"
                      >
                        <span className="font-bold">Week {week}</span>
                        <span className="text-xs opacity-80">{dateLabel}</span>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No weekly data yet. Add some daily log entries first.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <LogbookWeekly
            userId={user.id}
            projectId={projectId}
            weekNumber={selectedWeek}
            mentorId={mentorId}
            internName={profile.full_name || user.email || 'Intern'}
            startDate={profile.start_date || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
