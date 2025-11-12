// =========================================
// LOGBOOK REVIEW WEEKLY - Mentor View
// Review weekly logbook submissions in table format
// =========================================

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle,
  FileText,
  Calendar,
  User,
  Clock,
  Send
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { LogbookEntry } from '@/types/logbook.types';
import { 
  approveWeeklyLog,
  rejectWeeklyLog
} from '@/services/logbookReviewService';
import { getEntriesByDate } from '@/services/logbookService';

interface DailyGroup {
  date: string;
  entries: LogbookEntry[];
  totalMinutes: number;
}

interface LogbookReviewWeeklyProps {
  userId: string;
  projectId: string;
  weekNumber: number;
  internName: string;
  mentorId: string;
  startDate?: string;
  onReviewComplete?: () => void;
}

export default function LogbookReviewWeekly({
  userId,
  projectId,
  weekNumber,
  internName,
  mentorId,
  startDate,
  onReviewComplete
}: LogbookReviewWeeklyProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [dailyGroups, setDailyGroups] = useState<DailyGroup[]>([]);
  const [weekStatus, setWeekStatus] = useState<'submitted' | 'approved' | 'rejected'>('submitted');
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Calculate week date range (same as intern view)
  const { weekStart, weekEnd } = useMemo(() => {
    const internshipStart = startDate ? new Date(startDate) : new Date();
    const startDay = (weekNumber - 1) * 7;
    const endDay = startDay + 6;
    
    const start = new Date(internshipStart);
    start.setDate(start.getDate() + startDay);
    
    const end = new Date(internshipStart);
    end.setDate(end.getDate() + endDay);
    
    return { weekStart: start, weekEnd: end };
  }, [startDate, weekNumber]);

  // Calculate total hours
  const totalWeekMinutes = dailyGroups.reduce((sum, g) => sum + g.totalMinutes, 0);
  const totalWeekHours = Math.floor(totalWeekMinutes / 60);
  const remainingMinutes = totalWeekMinutes % 60;

  // Load weekly data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setDailyGroups([]);
        
        // Get week date range
        const daysInWeek: Date[] = [];
        const current = new Date(weekStart);
        while (current <= weekEnd) {
          daysInWeek.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        // Load all entries for each day
        const entriesPromises = daysInWeek.map(date =>
          getEntriesByDate(userId, projectId, format(date, 'yyyy-MM-dd'))
        );
        const entriesArrays = await Promise.all(entriesPromises);
        const allEntries = entriesArrays.flat();

        if (!isMounted) return;

        // Filter submitted/approved entries for this week
        const filteredEntries = allEntries.filter(e => {
          const cat = e.category || '';
          return cat.includes(`weekly_${weekNumber}_log_submitted`) || 
                 cat.includes(`weekly_${weekNumber}_log_approved`) ||
                 cat.includes(`weekly_${weekNumber}_log_rejected`);
        });

        // Determine status
        const hasApproved = filteredEntries.some(e => e.category?.includes('approved'));
        const hasRejected = filteredEntries.some(e => e.category?.includes('rejected'));
        setWeekStatus(hasApproved ? 'approved' : hasRejected ? 'rejected' : 'submitted');

        // Group by date
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
          setLoading(false);
        }
      } catch (error) {
        console.error('Load error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [userId, projectId, weekNumber, weekStart, weekEnd]);

  // Handle approve
  const handleApprove = async () => {
    if (!confirm(`Approve Week ${weekNumber} logbook for ${internName}?`)) {
      return;
    }

    try {
      setProcessing(true);
      await approveWeeklyLog(userId, projectId, weekNumber, mentorId, reviewComment || 'Approved');
      alert('Logbook approved successfully!');
      setShowReviewForm(false);
      setReviewComment('');
      if (onReviewComplete) onReviewComplete();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve logbook. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!reviewComment.trim()) {
      alert('Please provide feedback for rejection');
      return;
    }

    if (!confirm(`Reject Week ${weekNumber} logbook for ${internName}? They will be able to resubmit.`)) {
      return;
    }

    try {
      setProcessing(true);
      await rejectWeeklyLog(userId, projectId, weekNumber, mentorId, reviewComment);
      alert('Logbook rejected. Intern can make corrections and resubmit.');
      setShowReviewForm(false);
      setReviewComment('');
      if (onReviewComplete) onReviewComplete();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject logbook. Please try again.');
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
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {internName} - Week {weekNumber}
              </CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3" />
                  Total Hours: {totalWeekHours}h {remainingMinutes}m
                </div>
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {weekStatus === 'submitted' && (
                <Badge className="bg-blue-600">
                  <Send className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              )}
              {weekStatus === 'approved' && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {weekStatus === 'rejected' && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Review Actions */}
        {weekStatus === 'submitted' && (
          <CardContent>
            {!showReviewForm ? (
              <Button 
                onClick={() => setShowReviewForm(true)} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Review This Logbook
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Review Feedback (optional for approval, required for rejection)
                  </label>
                  <Textarea
                    placeholder="Provide feedback, suggestions, or reason for rejection..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewComment('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Weekly Logbook Table */}
      <Card>
        <CardHeader>
          <CardTitle>Week {weekNumber} Activities</CardTitle>
          <CardDescription>
            Detailed log of activities from {format(weekStart, 'MMM dd')} to {format(weekEnd, 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No entries found for this week.
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
                              {entry.start_time?.substring(0, 5)} - {entry.end_time?.substring(0, 5)}
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
