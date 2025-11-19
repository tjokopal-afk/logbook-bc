// =========================================
// REVIEW LOGBOOK PAGE - Mentor View
// Review weekly reports submitted by interns
// Uses logbookReviewService for approve/reject workflow
// =========================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  CheckCircle2, 
  Clock,
  Inbox,
  XCircle,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';
import { supabase } from '@/supabase';
import { 
  approveWeeklyLog,
  rejectWeeklyLog
} from '@/services/logbookReviewService';
import { PROJECT_ROLES } from '@/utils/roleConfig';
import type { LogbookEntry } from '@/lib/api/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Extended interface for logbook with user details
interface ExtendedLogbookEntry extends LogbookEntry {
  week_summary?: string;
  challenges?: string;
  learnings?: string;
  week_start?: string;
  week_end?: string;
  daily_entries?: Array<{
    date: string;
    entry_id?: string;
    activities?: Array<{
      id?: string;
      description: string;
      start_time: string;
      end_time: string;
      duration_minutes: number;
    }>;
    notes?: string;
  }>;
  review_comment?: string;
  reviewed_at?: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  project?: {
    name: string;
  };
}

export default function ReviewLogbook() {
  const [reports, setReports] = useState<ExtendedLogbookEntry[]>([]);
  const [filteredReports, setFilteredReports] = useState<ExtendedLogbookEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted');
  const [loading, setLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [reviewingReport, setReviewingReport] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Step 1: Get mentor's projects (where mentor is PIC)
      const { data: mentorProjects, error: projError } = await supabase
        .from('project_participants')
        .select('project_id')
        .eq('user_id', user?.id)
        .eq('role_in_project', PROJECT_ROLES.PIC);  // Only get projects where mentor is PIC

      if (projError) throw projError;

      const mentorProjectIds = (mentorProjects || []).map((p: { project_id: string }) => p.project_id);

      if (mentorProjectIds.length === 0) {
        console.log('No projects assigned to this mentor');
        setReports([]);
        return;
      }

      // Step 2: Get submitted weekly logs only from mentor's projects with user and project info
      const { data, error } = await supabase
        .from('logbook_entries')
        .select(`
          *,
          user:users!logbook_entries_user_id_fkey(full_name, email, avatar_url),
          project:projects!logbook_entries_project_id_fkey(name)
        `)
        .in('project_id', mentorProjectIds)  // Filter by mentor's projects
        .like('category', 'weekly_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports((data as ExtendedLogbookEntry[]) || []);
    } catch (error) {
      console.error('Load reports error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const applyFilters = useCallback(() => {
    let filtered = reports;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'submitted') {
        filtered = filtered.filter(r => r.category.includes('submitted') && !r.category.includes('approved') && !r.category.includes('rejected'));
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(r => r.category.includes('approved'));
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(r => r.category.includes('rejected'));
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.user?.full_name.toLowerCase().includes(query) ||
        r.project?.name.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchQuery, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleApprove = async (report: ExtendedLogbookEntry, weekNumber: number) => {
    if (!window.confirm('Are you sure you want to approve this logbook?')) return;

    try {
      await approveWeeklyLog(
        report.user_id,
        report.project_id || '',
        weekNumber,
        currentUserId,
        reviewComment || 'Approved'
      );
      alert('Logbook approved successfully!');
      setReviewingReport(null);
      setReviewComment('');
      loadReports();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve logbook');
    }
  };

  const handleReject = async (report: ExtendedLogbookEntry, weekNumber: number) => {
    if (!reviewComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this logbook?')) return;

    try {
      await rejectWeeklyLog(
        report.user_id,
        report.project_id || '',
        weekNumber,
        currentUserId,
        reviewComment
      );
      alert('Logbook rejected. Intern can resubmit.');
      setReviewingReport(null);
      setReviewComment('');
      loadReports();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject logbook');
    }
  };

  const getWeekNumber = (category: string): number => {
    const match = category.match(/weekly_(\d+)_/);
    return match ? parseInt(match[1]) : 0;
  };

  const getStatusBadge = (category: string) => {
    if (category.includes('approved')) {
      return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    } else if (category.includes('rejected')) {
      return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    } else if (category.includes('submitted')) {
      return <Badge className="bg-blue-600"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const submittedCount = reports.filter(r => r.category.includes('submitted') && !r.category.includes('approved') && !r.category.includes('rejected')).length;
  const approvedCount = reports.filter(r => r.category.includes('approved')).length;
  const rejectedCount = reports.filter(r => r.category.includes('rejected')).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Logbook</h1>
          <p className="text-muted-foreground mt-2">
            Review weekly reports submitted by interns
          </p>
        </div>
        {submittedCount > 0 && (
          <Badge className="bg-red-600 text-lg px-4 py-2">
            {submittedCount} Pending
          </Badge>
        )}
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by intern name, project, or week..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({reports.length})
              </Button>
              <Button
                variant={statusFilter === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('submitted')}
                className="gap-1"
              >
                <Clock className="w-4 h-4" />
                Pending ({submittedCount})
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
                className="gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approved ({approvedCount})
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
                className="gap-1"
              >
                <XCircle className="w-4 h-4" />
                Rejected ({rejectedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {statusFilter === 'submitted' ? 'No pending reports' : 'No results'}
                </h3>
                <p className="text-sm text-gray-600">
                  {searchQuery
                    ? 'Try a different search term'
                    : statusFilter === 'submitted'
                    ? 'All reports have been reviewed'
                    : 'No reports in this category'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const weekNumber = getWeekNumber(report.category);
            const isExpanded = expandedReport === report.id;
            const isReviewing = reviewingReport === report.id;
            const canReview = report.category.includes('submitted') && !report.category.includes('approved') && !report.category.includes('rejected');

            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {report.user?.full_name?.charAt(0) || 'U'}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <CardTitle className="text-xl">
                          Week {weekNumber} - {report.user?.full_name || 'Unknown User'}
                        </CardTitle>
                        <CardDescription className="mt-1 space-y-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {report.project?.name || 'Unknown Project'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {report.week_start && report.week_end
                                ? `${format(new Date(report.week_start), 'dd MMM', { locale: idLocale })} - ${format(new Date(report.week_end), 'dd MMM yyyy', { locale: idLocale })}`
                                : 'Date not available'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Submitted: {format(new Date(report.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                          </div>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.category)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Week Summary */}
                    <div>
                      <h4 className="font-semibold mb-2">Week Summary</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.week_summary || 'No summary provided'}
                      </p>
                    </div>

                    {/* Challenges */}
                    <div>
                      <h4 className="font-semibold mb-2">Challenges Faced</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.challenges || 'No challenges reported'}
                      </p>
                    </div>

                    {/* Learnings */}
                    <div>
                      <h4 className="font-semibold mb-2">Key Learnings</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {report.learnings || 'No learnings reported'}
                      </p>
                    </div>

                    {/* Daily Entries Summary */}
                    {report.daily_entries && report.daily_entries.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Daily Activities ({report.daily_entries.length} days)</h4>
                        <div className="space-y-2">
                          {report.daily_entries.map((day, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {format(new Date(day.date), 'EEEE, dd MMM yyyy', { locale: idLocale })}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {day.activities?.length || 0} activities
                                </span>
                              </div>
                              {day.notes && (
                                <p className="text-xs text-gray-600 mt-1">{day.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Section */}
                    {canReview && (
                      <div className="pt-4 border-t space-y-4">
                        {!isReviewing ? (
                          <div className="flex gap-3">
                            <Button
                              onClick={() => setReviewingReport(report.id)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Review This Report
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Review Comment (optional for approval, required for rejection)
                              </label>
                              <Textarea
                                placeholder="Provide feedback, suggestions, or reason for rejection..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApprove(report, weekNumber)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(report, weekNumber)}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => {
                                  setReviewingReport(null);
                                  setReviewComment('');
                                }}
                                variant="outline"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show review feedback if already reviewed */}
                    {!canReview && report.review_comment && (
                      <div className={`p-4 rounded-lg ${report.category.includes('approved') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <h4 className="font-semibold mb-2">Review Feedback</h4>
                        <p className="text-sm whitespace-pre-wrap">{report.review_comment}</p>
                        {report.reviewed_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed on {format(new Date(report.reviewed_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
