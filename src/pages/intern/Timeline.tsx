// =========================================
// TIMELINE PAGE (Intern)
// Shows internship timeline progress (start_date -> end_date) and project deadlines calendar
// =========================================

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { differenceInDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, eachDayOfInterval } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DeadlineEvent {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  title: string;
  type: 'task' | 'project';
}

export default function Timeline() {
  const { profile, user } = useAuth();
  const [events, setEvents] = useState<DeadlineEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const start = profile?.start_date ? new Date(profile.start_date) : undefined;
  const end = profile?.end_date ? new Date(profile.end_date) : undefined;

  const totalDays = useMemo(() => {
    if (!start || !end) return 0;
    return Math.max(1, differenceInDays(end, start) + 1);
  }, [start, end]);

  const elapsedDays = useMemo(() => {
    if (!start || !end) return 0;
    const raw = differenceInDays(new Date(), start) + 1;
    return Math.min(Math.max(0, raw), totalDays);
  }, [start, end, totalDays]);

  const progressPct = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;

  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.id) return;

      // Task deadlines (assigned to me)
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, deadline')
        .eq('assigned_to', user.id)
        .not('deadline', 'is', null);

      const taskEvents: DeadlineEvent[] = (tasks || [])
        .filter((t: any) => !!t.deadline)
        .map((t: any) => ({
          id: t.id,
          date: String(t.deadline).slice(0, 10),
          title: t.title,
          type: 'task',
        }));

      // Project deadlines (where I am participant)
      const { data: parts } = await supabase
        .from('project_participants')
        .select('project_id, projects!inner(id, name, deadline)')
        .eq('user_id', user.id);

      const projEvents: DeadlineEvent[] = ((parts || []) as any[])
        .map((p) => p.projects)
        .filter((p: any) => p?.deadline)
        .map((p: any) => ({
          id: p.id,
          date: String(p.deadline).slice(0, 10),
          title: p.name,
          type: 'project',
        }));

      const all = [...taskEvents, ...projEvents];
      all.sort((a, b) => a.date.localeCompare(b.date));
      setEvents(all);
    };

    loadEvents();
  }, [user?.id]);

  // Map events by yyyy-MM-dd for quick lookup in calendar cells
  const eventsByDate = useMemo(() => {
    const map: Record<string, DeadlineEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  // Build month calendar grid (Mon-Sun)
  const weekStartsOn = 1; // Monday
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { locale: idLocale, weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { locale: idLocale, weekStartsOn });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekDayLabels = useMemo(() => {
    const ws = startOfWeek(new Date(), { locale: idLocale, weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => format(addDays(ws, i), 'EEE', { locale: idLocale }));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Timeline</h1>
        <p className="text-muted-foreground mt-2">Progres hari magang dan kalender deadline tugas/proyek</p>
      </div>

      {/* Internship Timeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Progres Magang</CardTitle>
          <CardDescription>
            {start && end ? (
              <>
                {format(start, 'dd MMM yyyy', { locale: idLocale })} — {format(end, 'dd MMM yyyy', { locale: idLocale })}
              </>
            ) : (
              'Lengkapi start_date dan end_date di profil'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalDays > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{elapsedDays}/{totalDays} hari</span>
                <span className="font-semibold">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada rentang tanggal magang.</p>
          )}
        </CardContent>
      </Card>

      {/* Deadlines Calendar (monthly grid with tags) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />Kalender Deadline
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md border hover:bg-gray-50"
                onClick={() => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="min-w-[160px] text-center font-medium">
                {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
              </div>
              <button
                className="p-2 rounded-md border hover:bg-gray-50"
                onClick={() => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))}
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <CardDescription>Tag deadline task dan project per tanggal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Weekday headers */}
            {weekDayLabels.map((label) => (
              <div key={label} className="text-xs font-semibold text-gray-500 text-center py-2">
                {label}
              </div>
            ))}

            {/* Month days */}
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const items = eventsByDate[dayStr] || [];
              const notInMonth = !isSameMonth(day, currentMonth);
              const today = isToday(day);
              return (
                <div
                  key={dayStr}
                  className={`min-h-[110px] p-2 rounded-md border relative overflow-hidden ${
                    notInMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  } ${today ? 'ring-1 ring-[#6B8E23] border-[#6B8E23]' : ''}`}
                >
                  {/* Date number */}
                  <div className="text-xs font-semibold absolute top-1 right-2">
                    {format(day, 'd', { locale: idLocale })}
                  </div>
                  {/* Event tags */}
                  <div className="mt-4 space-y-1">
                    {items.slice(0, 3).map((ev) => (
                      <div
                        key={`${ev.type}-${ev.id}`}
                        className={`text-[11px] px-2 py-1 rounded border truncate ${
                          ev.type === 'task'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                        title={`${ev.type === 'task' ? 'Task' : 'Project'} • ${ev.title}`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[11px] text-gray-500">+{items.length - 3} lainnya</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
