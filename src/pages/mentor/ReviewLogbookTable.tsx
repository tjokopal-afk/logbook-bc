// =========================================
// REVIEW LOGBOOK TABLE - Mentor Main Page
// List all logbook submissions with table view
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  CheckCircle2, 
  XCircle,
  Clock,
  Inbox,
  ChevronLeft,
  Calendar,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/supabase';
import { format } from 'date-fns';
import LogbookReviewWeekly from '@/components/mentor/LogbookReviewWeekly';

interface SubmissionItem {
  id: string;
  user_id: string;
  project_id: string;
  category: string;
  created_at: string;
  submitted_at: string;
  is_submitted: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  user: {
    full_name: string;
    email: string;
  };
  project: {
    name: string;
  };
  profile: {
    start_date: string;
  };
}

export default function ReviewLogbookTable() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Selected submission for review
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      // Get current user (mentor)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      try {
        const { data: baseEntries, error: baseErr } = await supabase
          .from('logbook_entries')
          .select('id, user_id, project_id, category, created_at, submitted_at, is_submitted, is_approved, is_rejected')
          .eq('is_submitted', true)
          .order('submitted_at', { ascending: false });

        if (baseErr) {
          console.error('Submissions base query error:', {
            message: (baseErr as any)?.message,
            details: (baseErr as any)?.details,
            hint: (baseErr as any)?.hint,
            code: (baseErr as any)?.code,
          });
          setSubmissions([]);
        } else {
          const userIds = Array.from(new Set((baseEntries || []).map((e: any) => e.user_id).filter(Boolean)));
          const projectIds = Array.from(new Set((baseEntries || []).map((e: any) => e.project_id).filter(Boolean)));

          // Fetch profiles (for name/email/start_date)
          let profilesMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profilesData, error: profErr } = await supabase
              .from('profiles')
              .select('id, full_name, email, start_date')
              .in('id', userIds);
            if (profErr) {
              console.warn('Profiles query error:', {
                message: (profErr as any)?.message,
                details: (profErr as any)?.details,
                hint: (profErr as any)?.hint,
                code: (profErr as any)?.code,
              });
            } else {
              profilesMap = Object.fromEntries((profilesData || []).map((p: any) => [p.id, p]));
            }
          }

          // Fetch projects (for name)
          let projectsMap: Record<string, any> = {};
          if (projectIds.length > 0) {
            const { data: projectsData, error: projErr } = await supabase
              .from('projects')
              .select('id, name')
              .in('id', projectIds);
            if (projErr) {
              console.warn('Projects query error:', {
                message: (projErr as any)?.message,
                details: (projErr as any)?.details,
                hint: (projErr as any)?.hint,
                code: (projErr as any)?.code,
              });
            } else {
              projectsMap = Object.fromEntries((projectsData || []).map((p: any) => [p.id, p]));
            }
          }

          // Group by user, project, and week - only show latest entry per week
          const grouped = new Map<string, SubmissionItem>();
          (baseEntries || []).forEach((entry: any) => {
            const weekMatch = entry.category?.match(/weekly_(\d+)_/);
            const weekNumber = weekMatch ? weekMatch[1] : '';
            const key = `${entry.user_id}_${entry.project_id}_${weekNumber}`;
            const entryDate = new Date(entry.submitted_at || entry.created_at);
            const existing = grouped.get(key);

            if (!existing || entryDate > new Date(existing.submitted_at || existing.created_at)) {
              const profile = profilesMap[entry.user_id];
              const project = projectsMap[entry.project_id || ''];
              grouped.set(key, {
                ...entry,
                user: profile ? { full_name: profile.full_name, email: profile.email } : undefined,
                project: project ? { name: project.name } : undefined,
                profile: profile ? { start_date: profile.start_date } : undefined,
              } as any);
            }
          });

          const submissionsArray = Array.from(grouped.values());
          console.log('✅ Grouped submissions:', submissionsArray.length);
          setSubmissions(submissionsArray);
        }
      } catch (fallbackError) {
        console.error('Submissions pipeline error:', fallbackError);
        setSubmissions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract week number
  const getWeekNumber = (category: string): number => {
    const match = category.match(/weekly_(\d+)_/);
    return match ? parseInt(match[1]) : 0;
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Apply filters - SIMPLIFIED using boolean flags
  useEffect(() => {
    let filtered = submissions;

    console.log('🔍 Filtering:', submissions.length, 'submissions with status:', statusFilter);

    // Status filter using boolean flags
    if (statusFilter !== 'all') {
      if (statusFilter === 'submitted') {
        // Pending: submitted but not approved/rejected
        filtered = filtered.filter(s => s.is_submitted && !s.is_approved && !s.is_rejected);
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(s => s.is_approved);
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(s => s.is_rejected);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.user?.full_name.toLowerCase().includes(query) ||
        s.project?.name.toLowerCase().includes(query) ||
        getWeekNumber(s.category).toString().includes(query)
      );
    }

    console.log('✅ Final filtered:', filtered.length, 'submissions');
    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, statusFilter]);

  const getStatusBadge = (submission: SubmissionItem) => {
    if (submission.is_approved) {
      return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    } else if (submission.is_rejected) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    } else if (submission.is_submitted) {
      return <Badge className="bg-blue-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const pendingCount = submissions.filter(s => s.is_submitted && !s.is_approved && !s.is_rejected).length;
  const approvedCount = submissions.filter(s => s.is_approved).length;
  const rejectedCount = submissions.filter(s => s.is_rejected).length;

  // If a submission is selected, show the detailed review view
  if (selectedSubmission) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedSubmission(null);
            loadSubmissions(); // Refresh list after review
          }}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>

        <LogbookReviewWeekly
          userId={selectedSubmission.user_id}
          projectId={selectedSubmission.project_id}
          weekNumber={getWeekNumber(selectedSubmission.category)}
          internName={selectedSubmission.user.full_name}
          mentorId={currentUserId}
          startDate={selectedSubmission.profile?.start_date}
          onReviewComplete={() => {
            setSelectedSubmission(null);
            loadSubmissions();
          }}
        />
      </div>
    );
  }

  // Main submissions list view
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
            Review weekly logbook submissions from interns
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-red-600 text-lg px-4 py-2">
            {pendingCount} Pending
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
                placeholder="Search by intern name, project, or week number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={statusFilter === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('submitted')}
                className="gap-1"
              >
                <Clock className="w-4 h-4" />
                Pending ({pendingCount})
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

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logbook Submissions</CardTitle>
          <CardDescription>Click on any submission to review details</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'submitted' ? 'No pending submissions' : 'No results'}
              </h3>
              <p className="text-sm text-gray-600">
                {searchQuery
                  ? 'Try a different search term'
                  : statusFilter === 'submitted'
                  ? 'All submissions have been reviewed'
                  : 'No submissions in this category'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Intern</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">Week</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => {
                    const weekNumber = getWeekNumber(submission.category);
                    const canReview = submission.category.includes('submitted') && 
                                    !submission.category.includes('approved') && 
                                    !submission.category.includes('rejected');

                    return (
                      <tr 
                        key={submission.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        {/* Intern Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {submission.user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{submission.user?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{submission.user?.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Project */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <Briefcase className="h-3 w-3 text-gray-400" />
                            <span>{submission.project?.name || 'Unknown'}</span>
                          </div>
                        </td>

                        {/* Week Number */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-mono">
                            Week {weekNumber}
                          </Badge>
                        </td>

                        {/* Submitted Date */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {submission.submitted_at 
                              ? format(new Date(submission.submitted_at), 'MMM dd, yyyy')
                              : 'N/A'
                            }
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {getStatusBadge(submission)}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant={canReview ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission);
                            }}
                          >
                            {canReview ? 'Review' : 'View'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
