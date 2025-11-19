// =========================================
// LOGBOOK WEEKLY - Weekly Compilation for Interns
// =========================================
// WORKFLOW:
// 1. View draft entries for the week
// 2. Select entries to compile
// 3. Compile → category changes to 'weekly_N_log_compile'
// 4. Submit → category changes to 'weekly_N_log_submitted'
// 5. Mentor reviews → 'weekly_N_log_approved' OR 'weekly_N_log_rejected_X'
// 6. If rejected, can resubmit
// 7. If approved, entries are locked (cannot edit/delete)
// =========================================

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Checkbox component replaced with HTML input for simplicity
import { 
  Calendar,
  Send,
  Clock,
  CheckCircle2,
  FileText,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { LogbookEntry } from '@/types/logbook.types';
import { 
  submitWeeklyLog,
  resubmitWeeklyLog
} from '@/services/logbookReviewService';
import { getEntriesByDate } from '@/services/logbookService';

interface DailyGroup {
  date: string;
  entries: LogbookEntry[];
  totalMinutes: number;
}

interface LogbookWeeklyProps {
  userId: string;
  projectId?: string | null; // Optional: logbook can exist without project
  weekNumber: number; // 1-12 for 12 weeks of internship
  mentorId: string; // Mentor who will review
  internName: string; // For notifications
  startDate?: string; // Internship start date from profile
  mode?: 'draft' | 'submitted'; // 'draft' = editable, 'submitted' = read-only
}

export function LogbookWeekly({ 
  userId, 
  projectId, 
  weekNumber, 
  mentorId,
  internName,
  startDate,
  mode = 'draft'
}: LogbookWeeklyProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [dailyGroups, setDailyGroups] = useState<DailyGroup[]>([]);
  const [weekStatus, setWeekStatus] = useState<'draft' | 'compiled' | 'submitted' | 'approved' | 'rejected'>('draft');

  // Calculate week date range based on internship start date (memoized to prevent infinite loops)
  const { weekStart, weekEnd } = useMemo(() => {
    // Use actual internship start date from profile or fallback to today
    const internshipStart = startDate ? new Date(startDate) : new Date();
    
    // Calculate week range: Week 1 = day 0-6, Week 2 = day 7-13, etc.
    // This matches the calculateWeekNumber logic in LogbookDaily
    const startDay = (weekNumber - 1) * 7;
    const endDay = startDay + 6;
    
    const start = new Date(internshipStart);
    start.setDate(start.getDate() + startDay);
    
    const end = new Date(internshipStart);
    end.setDate(end.getDate() + endDay);
    
    return { weekStart: start, weekEnd: end };
  }, [startDate, weekNumber]);

  // Load weekly data - SIMPLIFIED VERSION
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setDailyGroups([]);
        
        // Step 1: Get week date range
        const daysInWeek: Date[] = [];
        const current = new Date(weekStart);
        while (current <= weekEnd) {
          daysInWeek.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        // Step 2: Load all entries for each day
        const entriesPromises = daysInWeek.map(date =>
          getEntriesByDate(userId, projectId || null, format(date, 'yyyy-MM-dd'))
        );
        const entriesArrays = await Promise.all(entriesPromises);
        const allEntries = entriesArrays.flat();

        if (!isMounted) return;

        // Step 3: Filter entries based on mode
        let filteredEntries: LogbookEntry[] = [];
        
        if (mode === 'draft') {
          // Draft mode: show draft and compiled entries
          filteredEntries = allEntries.filter(e => {
            const cat = e.category || '';
            return cat === 'draft' || cat.includes(`weekly_${weekNumber}_log_compile`);
          });
          
          // Determine status
          const hasCompiled = filteredEntries.some(e => e.category?.includes('compile'));
          setWeekStatus(hasCompiled ? 'compiled' : 'draft');
        } else {
          // Submitted mode: show submitted and approved entries
          filteredEntries = allEntries.filter(e => {
            const cat = e.category || '';
            return cat.includes(`weekly_${weekNumber}_log_submitted`) || 
                   cat.includes(`weekly_${weekNumber}_log_approved`);
          });
          
          // Determine status
          const hasApproved = filteredEntries.some(e => e.category?.includes('approved'));
          setWeekStatus(hasApproved ? 'approved' : 'submitted');
        }

        // Step 4: Group by date
        const grouped = new Map<string, LogbookEntry[]>();
        filteredEntries.forEach(entry => {
          const date = entry.entry_date;
          if (!grouped.has(date)) {
            grouped.set(date, []);
          }
          grouped.get(date)!.push(entry);
        });

        const groups: DailyGroup[] = [];
        grouped.forEach((dayEntries, date) => {
          const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
          groups.push({
            date,
            entries: dayEntries.sort((a, b) => 
              (a.start_time || '').localeCompare(b.start_time || '')
            ),
            totalMinutes
          });
        });

        groups.sort((a, b) => a.date.localeCompare(b.date));
        
        if (isMounted) {
          setDailyGroups(groups);
        }
      } catch (error) {
        console.error('Load data error:', error);
        if (isMounted) {
          setDailyGroups([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId, projectId, weekNumber, mode, weekStart, weekEnd]);

  // Reload data after actions
  // Calculate total hours for the week
  const totalWeekMinutes = dailyGroups.reduce((sum, g) => sum + g.totalMinutes, 0);
  const totalWeekHours = Math.floor(totalWeekMinutes / 60);
  const remainingMinutes = totalWeekMinutes % 60;

  // Submit weekly log to mentor
  const handleSubmit = async () => {
    if (!confirm(`Submit Week ${weekNumber} log to mentor for review?`)) {
      return;
    }

    try {
      setProcessing(true);
      await submitWeeklyLog(userId, projectId || null, weekNumber, mentorId, internName);
      alert('Weekly log submitted successfully! Waiting for mentor review.');
      window.location.reload();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit weekly log. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Resubmit after rejection
  const handleResubmit = async () => {
    if (!confirm(`Resubmit Week ${weekNumber} log after making corrections?`)) {
      return;
    }

    try {
      setProcessing(true);
      await resubmitWeeklyLog(userId, projectId || null, weekNumber, mentorId, internName);
      alert('Weekly log resubmitted successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Resubmit error:', error);
      alert('Failed to resubmit weekly log. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Week {weekNumber} Logbook
              </CardTitle>
              <CardDescription>
                {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-base">
                <Clock className="h-4 w-4 mr-1" />
                {totalWeekHours}h {remainingMinutes}m
              </Badge>
              {weekStatus === 'draft' && (
                <Badge variant="secondary">
                  <FileText className="h-4 w-4 mr-1" />
                  Draft
                </Badge>
              )}
              {weekStatus === 'compiled' && (
                <Badge variant="default" className="bg-blue-500">
                  <FileText className="h-4 w-4 mr-1" />
                  Compiled
                </Badge>
              )}
              {weekStatus === 'submitted' && (
                <Badge variant="default" className="bg-yellow-500">
                  <Send className="h-4 w-4 mr-1" />
                  Under Review
                </Badge>
              )}
              {weekStatus === 'approved' && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approved
                </Badge>
              )}
              {weekStatus === 'rejected' && (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {mode === 'draft' && (weekStatus === 'draft' || weekStatus === 'compiled') && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Review your entries below, then submit to your mentor for review.
                </p>
                <Button 
                  onClick={handleSubmit} 
                  disabled={processing || dailyGroups.length === 0} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Mentor ({dailyGroups.flatMap(g => g.entries).length} entries)
                </Button>
              </div>
            )}
            {mode === 'draft' && weekStatus === 'rejected' && (
              <div className="space-y-2">
                <p className="text-sm text-red-600">
                  Your submission was rejected. Make corrections in the "Add Draft" tab, then resubmit.
                </p>
                <Button onClick={handleResubmit} disabled={processing} className="bg-orange-600 hover:bg-orange-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resubmit After Corrections
                </Button>
              </div>
            )}
            {mode === 'submitted' && weekStatus === 'submitted' && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 animate-pulse" />
                Waiting for mentor review...
              </div>
            )}
            {mode === 'submitted' && weekStatus === 'approved' && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                This week has been approved and locked
              </div>
            )}
            {mode === 'submitted' && weekStatus === 'rejected' && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                This week was rejected - go to Weekly Draft tab to make corrections
              </div>
            )}
          </div>

          {/* Instructions */}
          {weekStatus === 'draft' && dailyGroups.length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                No draft entries found for this week. Create daily entries first before compiling weekly log.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review History - Temporarily removed for simplification, will be added back */}

      {/* Weekly Logbook Table */}
      <Card>
        <CardHeader>
          <CardTitle>Week {weekNumber} Logbook</CardTitle>
          <CardDescription>
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')} • Total: {totalWeekHours}h {remainingMinutes}m
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No entries for this week yet. Add entries in the "Add Draft" tab.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-28">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-36">Time Period</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Activity Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-28">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyGroups.map((group) => (
                    group.entries.map((entry, idx) => {
                      const entryHours = Math.floor((entry.duration_minutes || 0) / 60);
                      const entryMinutes = (entry.duration_minutes || 0) % 60;
                      const isFirstOfDay = idx === 0;

                      return (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {/* Date Column - Only show for first entry of the day */}
                          {isFirstOfDay ? (
                            <td 
                              className="px-4 py-3 align-top font-medium text-sm bg-gray-50/50" 
                              rowSpan={group.entries.length}
                            >
                              <div className="flex flex-col">
                                <span className="text-gray-900">{format(parseISO(group.date), 'EEE')}</span>
                                <span className="text-gray-600">{format(parseISO(group.date), 'MMM dd')}</span>
                              </div>
                            </td>
                          ) : null}
                          
                          {/* Time Column */}
                            <td className="px-4 py-3 align-top">
                              <span className="text-sm text-gray-700 whitespace-nowrap">
                                {(() => {
                                  const startRaw = entry.start_time ?? null;
                                  const endRaw = entry.end_time ?? null;
                                  const dur = entry.duration_minutes != null ? Number(entry.duration_minutes) : null;

                                  const normalize = (t?: string | null) => {
                                    if (!t) return null;
                                    const raw = t.trim();
                                    if (!raw) return null;
                                    if (!raw.includes(':')) {
                                      return `${String(Number(raw)).padStart(2, '0')}:00`;
                                    }
                                    const parts = raw.split(':');
                                    const hh = parts[0] ? String(Number(parts[0])).padStart(2, '0') : '00';
                                    const mm = parts[1] ? String(Number(parts[1])).padStart(2, '0') : '00';
                                    return `${hh}:${mm}`;
                                  };

                                  const toDate = (dateStr: string, timePart: string | null) => {
                                    if (!timePart) return null;
                                    const iso = `${dateStr}T${timePart}`;
                                    const d = new Date(iso);
                                    return isNaN(d.getTime()) ? null : d;
                                  };

                                  try {
                                    const sNorm = normalize(startRaw);
                                    const eNorm = normalize(endRaw);
                                    const sDate = toDate(group.date, sNorm);
                                    const eDate = toDate(group.date, eNorm);

                                    if (sDate && eDate) {
                                      return `${format(sDate, 'HH:mm')} - ${format(eDate, 'HH:mm')}`;
                                    }

                                    if (sDate && dur != null && !Number.isNaN(dur)) {
                                      const e = new Date(sDate.getTime() + dur * 60000);
                                      return `${format(sDate, 'HH:mm')} - ${format(e, 'HH:mm')}`;
                                    }

                                    if (eDate && dur != null && !Number.isNaN(dur)) {
                                      const s = new Date(eDate.getTime() - dur * 60000);
                                      return `${format(s, 'HH:mm')} - ${format(eDate, 'HH:mm')}`;
                                    }

                                    if (!sDate && !eDate && dur != null && !Number.isNaN(dur)) {
                                      const hh = Math.floor(dur / 60);
                                      const mm = dur % 60;
                                      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
                                    }

                                    if (sNorm && !eNorm) return `${sNorm} - ?`;
                                    if (!sNorm && eNorm) return `? - ${eNorm}`;
                                    return '-';
                                  } catch {
                                    // Safe fallback
                                    const pad = (t?: string | null) => {
                                      if (!t) return null;
                                      const parts = t.split(':').map(p => p.trim());
                                      const hh = parts[0] ? String(Number(parts[0])).padStart(2, '0') : '00';
                                      const mm = parts[1] ? String(Number(parts[1])).padStart(2, '0') : '00';
                                      return `${hh}:${mm}`;
                                    };
                                    const s = pad(startRaw);
                                    const e = pad(endRaw);
                                    if (s && e) return `${s} - ${e}`;
                                    if (s) return `${s} - ?`;
                                    if (e) return `? - ${e}`;
                                    if (dur != null && !Number.isNaN(dur)) {
                                      const hh = Math.floor(dur / 60);
                                      const mm = dur % 60;
                                      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
                                    }
                                    return '-';
                                  }
                                })()}
                              </span>
                            </td>
                          
                          {/* Duration Column */}
                          <td className="px-4 py-3 align-top">
                            <Badge variant="outline" className="text-xs">
                              {entryHours}h {entryMinutes}m
                            </Badge>
                          </td>
                          
                          {/* Activity Column */}
                          <td className="px-4 py-3 align-top">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {entry.content}
                            </p>
                          </td>
                          
                          {/* Attachments Column */}
                          <td className="px-4 py-3 align-top">
                            {entry.attachments && entry.attachments.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {entry.attachments.map((attachment, attachIdx) => (
                                  <a
                                    key={attachIdx}
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title={attachment.file_name}
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="truncate max-w-[80px]">{attachment.file_name}</span>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ))}
                  {/* Total Row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-700" colSpan={2}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {totalWeekHours}h {remainingMinutes}m
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600" colSpan={2}>
                      {dailyGroups.reduce((sum, g) => sum + g.entries.length, 0)} entries
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
