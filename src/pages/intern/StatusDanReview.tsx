// =========================================
// STATUS DAN REVIEW PAGE - Intern View
// Combined view of report status and mentor reviews
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { resubmitWeeklyLog } from '@/services/logbookReviewService';
import { updateEntry } from '@/services/logbookService';
import EditLogbookEntryDialog from '@/components/intern/EditLogbookEntryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Mock data - replace with real Supabase data
interface Report {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'revision';
  rating?: number;
  mentorComment?: string;
  mentorName?: string;
  reviewedAt?: string;
  completedActivities: string[];
  totalHours: number;
  projectId?: string | null;
  reviewerId?: string | null;
  hasSubmitted?: boolean;
}

export default function StatusDanReview() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  
  const { user, profile } = useAuth();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [weekEntries, setWeekEntries] = useState<Record<number, any[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<Record<number, boolean>>({});
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery]);

  const loadReports = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setReports([]);
        setLoading(false);
        return;
      }
      const { data: entries, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .like('category', 'weekly_%')
        .order('updated_at', { ascending: false });
      if (error) {
        setReports([]);
        setLoading(false);
        return;
      }
      const groups = new Map<number, any[]>();
      (entries || []).forEach((e: any) => {
        const m = e.category?.match(/weekly_(\d+)_/);
        const wn = m ? parseInt(m[1]) : 0;
        if (!wn) return;
        if (!groups.has(wn)) groups.set(wn, []);
        groups.get(wn)!.push(e);
      });
      const weekReports: Report[] = [];
      for (const [weekNumber, list] of groups.entries()) {
        const hasApproved = list.some((e: any) => (e.category || '').includes('approved'));
        const hasRejected = list.some((e: any) => (e.category || '').includes('rejected'));
        const hasSubmitted = list.some((e: any) => (e.category || '').includes('submitted'));
        const includeWeek = hasApproved || hasRejected || hasSubmitted;
        if (!includeWeek) {
          continue;
        }
        const status: Report['status'] = hasApproved ? 'reviewed' : hasRejected ? 'revision' : 'pending';
        const submittedAt = list.map((e: any) => e.submitted_at || e.created_at).sort().pop() || list[0].created_at;
        const totalHours = list.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0) / 60;
        const contents = Array.from(new Set(list.map((e: any) => e.content).filter(Boolean))).slice(0, 3);
        let startDate = '';
        let endDate = '';
        if (profile?.start_date) {
          const base = new Date(profile.start_date);
          const start = new Date(base);
          start.setDate(start.getDate() + (weekNumber - 1) * 7);
          const end = new Date(base);
          end.setDate(end.getDate() + (weekNumber - 1) * 7 + 6);
          startDate = start.toISOString().slice(0, 10);
          endDate = end.toISOString().slice(0, 10);
        } else {
          const dates = list.map((e: any) => e.entry_date).sort();
          startDate = dates[0];
          endDate = dates[dates.length - 1];
        }
        let mentorComment: string | undefined;
        let mentorName: string | undefined;
        let reviewedAt: string | undefined;
        let reviewerId: string | undefined;
        const ids = list.map((e: any) => e.id).filter(Boolean);
        if (ids.length > 0) {
          try {
            // Get most recent review for any of the entries in this week
            const { data: revs, error: revError } = await supabase
              .from('reviews')
              .select(`
                comment,
                reviewer_id,
                created_at,
                reviewer:profiles!reviews_reviewer_id_fkey1(full_name)
              `)
              .in('entry_id', ids)
              .order('created_at', { ascending: false });
            
            if (revError) {
              console.warn('Error fetching reviews for week', weekNumber, ':', revError);
            } else if (revs && revs.length > 0) {
              // Use the most recent review
              const latestReview = revs[0] as any;
              mentorComment = latestReview.comment || undefined;
              mentorName = latestReview.reviewer?.full_name || undefined;
              reviewedAt = latestReview.created_at || undefined;
              reviewerId = latestReview.reviewer_id || undefined;
            }
          } catch (err) {
            console.error('Exception fetching reviews:', err);
          }
        }
        const projectId = list[0]?.project_id ?? null;
        weekReports.push({
          id: String(weekNumber),
          weekNumber,
          startDate,
          endDate,
          submittedAt,
          status,
          mentorComment,
          mentorName,
          reviewedAt,
          completedActivities: contents,
          totalHours: Math.round(totalHours),
          projectId,
          reviewerId: reviewerId || null,
          hasSubmitted,
        });
      }
      weekReports.sort((a, b) => a.weekNumber - b.weekNumber);
      setReports(weekReports);
    } finally {
      setLoading(false);
    }
  };

  const toHHMM = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const offsetForDate = (d: Date) => {
    const offsetMin = -d.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `${sign}${hh}:${mm}`;
  };

  const toISOWithOffset = (dateStr: string, hhmm: string) => {
    const base = new Date(`${dateStr}T${hhmm}`);
    const offset = offsetForDate(base);
    return `${dateStr}T${hhmm}:00${offset}`;
  };

  const loadWeekEntries = async (weekNumber: number, projectId?: string | null) => {
    if (!user?.id) return;
    
    try {
      setLoadingEntries(prev => ({ ...prev, [weekNumber]: true }));
      
      let query = supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .like('category', `weekly_${weekNumber}_log_%`)
        .order('entry_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }
      
      const { data } = await query;
      setWeekEntries(prev => ({ ...prev, [weekNumber]: data || [] }));
    } catch (error) {
      console.error('Error loading week entries:', error);
    } finally {
      setLoadingEntries(prev => ({ ...prev, [weekNumber]: false }));
    }
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry);
    setEditDialogOpen(true);
  };

  const handleSaveEntry = async (entryId: string, updates: Partial<any>) => {
    try {
      await updateEntry(entryId, updates as any);
      
      // Reload the entries for this week
      const entry = editingEntry;
      if (entry) {
        // Find which week this entry belongs to
        const weekMatch = entry.category?.match(/weekly_(\d+)_/);
        if (weekMatch) {
          const weekNumber = parseInt(weekMatch[1]);
          const report = reports.find(r => r.weekNumber === weekNumber);
          if (report) {
            await loadWeekEntries(weekNumber, report.projectId);
          }
        }
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  };

  const applyFilters = () => {
    let filtered = reports;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        `week ${r.weekNumber}`.toLowerCase().includes(query) ||
        r.completedActivities.some(a => a.toLowerCase().includes(query))
      );
    }

    setFilteredReports(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <Badge className="bg-green-600">Reviewed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">Pending Review</Badge>;
      case 'revision':
        return <Badge className="bg-red-600">Need Revision</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', color: 'text-green-600' };
    if (rating >= 3.5) return { label: 'Good', color: 'text-blue-600' };
    if (rating >= 2.5) return { label: 'Fair', color: 'text-yellow-600' };
    if (rating >= 1.5) return { label: 'Need Improvement', color: 'text-orange-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  

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
      <div>
        <h1 className="text-3xl font-bold">Status dan Review</h1>
        <p className="text-muted-foreground mt-2">
          Lihat status laporan dan review dari mentor
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari minggu atau aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Reports */}
      <div className="space-y-8">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak ada laporan</h3>
                <p className="text-sm text-gray-600">
                  {searchQuery ? 'Coba kata kunci lain' : 'Belum ada laporan yang disubmit'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Submitted */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Submitted</h2>
              {filteredReports.filter(r => r.status === 'pending').length === 0 ? (
                <Card><CardContent className="py-6 text-sm text-gray-500">Belum ada yang Submitted</CardContent></Card>
              ) : (
                filteredReports.filter(r => r.status === 'pending').map((report) => {
                  const ratingInfo = report.rating ? getRatingLabel(report.rating) : null;
                  return (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                Week {report.weekNumber}
                                {report.hasSubmitted && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Submitted" />
                                )}
                              </CardTitle>
                              {getStatusBadge(report.status)}
                            </div>
                            <CardDescription>
                              {format(new Date(report.startDate), 'dd MMM', { locale: idLocale })} - 
                              {format(new Date(report.endDate), 'dd MMM yyyy', { locale: idLocale })}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Submitted</p>
                              <p className="font-medium">
                                {format(new Date(report.submittedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Total Hours</p>
                              <p className="font-medium">{report.totalHours} jam</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Activities</p>
                              <p className="font-medium">{report.completedActivities.length} completed</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Completed Activities:</p>
                          <div className="flex flex-wrap gap-2">
                            {report.completedActivities.map((activity, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="border-t pt-4 bg-yellow-50 -mx-6 px-6 -mb-6 pb-6">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <Clock className="w-4 h-4" />
                            <p className="text-sm font-medium">Menunggu review dari mentor...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Approved */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Approved</h2>
              {filteredReports.filter(r => r.status === 'reviewed').length === 0 ? (
                <Card><CardContent className="py-6 text-sm text-gray-500">Belum ada yang Approved</CardContent></Card>
              ) : (
                filteredReports.filter(r => r.status === 'reviewed').map((report) => {
                  const ratingInfo = report.rating ? getRatingLabel(report.rating) : null;
                  return (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                Week {report.weekNumber}
                                {report.hasSubmitted && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Submitted" />
                                )}
                              </CardTitle>
                              {getStatusBadge(report.status)}
                            </div>
                            <CardDescription>
                              {format(new Date(report.startDate), 'dd MMM', { locale: idLocale })} - 
                              {format(new Date(report.endDate), 'dd MMM yyyy', { locale: idLocale })}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Submitted</p>
                              <p className="font-medium">
                                {format(new Date(report.submittedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Total Hours</p>
                              <p className="font-medium">{report.totalHours} jam</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Activities</p>
                              <p className="font-medium">{report.completedActivities.length} completed</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Completed Activities:</p>
                          <div className="flex flex-wrap gap-2">
                            {report.completedActivities.map((activity, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {report.mentorComment && (
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold">Mentor Review</h4>
                            </div>
                            <div className="bg-white border rounded-lg p-4">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {report.mentorComment}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                              <span>Reviewed by: <span className="font-semibold">{report.mentorName}</span></span>
                              <span>•</span>
                              <span>
                                {report.reviewedAt && format(new Date(report.reviewedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Rejected */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Rejected</h2>
              {filteredReports.filter(r => r.status === 'revision').length === 0 ? (
                <Card><CardContent className="py-6 text-sm text-gray-500">Belum ada yang Rejected</CardContent></Card>
              ) : (
                filteredReports.filter(r => r.status === 'revision').map((report) => {
                  const ratingInfo = report.rating ? getRatingLabel(report.rating) : null;
                  return (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                Week {report.weekNumber}
                                {report.hasSubmitted && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Submitted" />
                                )}
                              </CardTitle>
                              {getStatusBadge(report.status)}
                            </div>
                            <CardDescription>
                              {format(new Date(report.startDate), 'dd MMM', { locale: idLocale })} - 
                              {format(new Date(report.endDate), 'dd MMM yyyy', { locale: idLocale })}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Submitted</p>
                              <p className="font-medium">
                                {format(new Date(report.submittedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Total Hours</p>
                              <p className="font-medium">{report.totalHours} jam</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Activities</p>
                              <p className="font-medium">{report.completedActivities.length} completed</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-2">Completed Activities:</p>
                          <div className="flex flex-wrap gap-2">
                            {report.completedActivities.map((activity, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {/* Review & Edit/Resubmit */}
                        <div className={`border-t pt-4 bg-red-50 -mx-6 px-6 -mb-6 pb-6`}>
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold">Mentor Review</h4>
                          </div>
                          {report.mentorComment && (
                            <div className="bg-white border rounded-lg p-4">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {report.mentorComment}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                            <span>Reviewed by: <span className="font-semibold">{report.mentorName}</span></span>
                            <span>•</span>
                            <span>
                              {report.reviewedAt && format(new Date(report.reviewedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  const isCurrentlyExpanded = expandedWeek === report.weekNumber;
                                  
                                  if (isCurrentlyExpanded) {
                                    // Collapse
                                    setExpandedWeek(null);
                                  } else {
                                    // Expand and load entries
                                    setExpandedWeek(report.weekNumber);
                                    await loadWeekEntries(report.weekNumber, report.projectId);
                                  }
                                }}
                                disabled={loadingEntries[report.weekNumber]}
                              >
                                {loadingEntries[report.weekNumber] ? 'Loading...' : 
                                 expandedWeek === report.weekNumber ? 'Tutup Edit' : 'Edit Logbook'}
                              </Button>
                            </div>
                            <Button
                              onClick={() => {
                                if (!user?.id || !profile?.full_name) {
                                  setConfirmDialog({
                                    open: true,
                                    title: 'Informasi Tidak Lengkap',
                                    description: 'User information tidak lengkap. Silakan lengkapi profil Anda terlebih dahulu.',
                                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                                  });
                                  return;
                                }
                                
                                if (!report.reviewerId) {
                                  setConfirmDialog({
                                    open: true,
                                    title: 'Reviewer Tidak Ditemukan',
                                    description: 'Reviewer ID tidak ditemukan. Tidak dapat melakukan resubmit.',
                                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                                  });
                                  return;
                                }
                                
                                // Load entries first if not loaded
                                const entries = weekEntries[report.weekNumber] || [];
                                if (entries.length === 0) {
                                  loadWeekEntries(report.weekNumber, report.projectId).then(() => {
                                    const loadedEntries = weekEntries[report.weekNumber] || [];
                                    if (loadedEntries.length === 0) {
                                      setConfirmDialog({
                                        open: true,
                                        title: 'Tidak Ada Entry',
                                        description: 'Tidak ada entry untuk minggu ini. Silakan tambahkan entry terlebih dahulu di halaman logbook.',
                                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                                      });
                                    }
                                  });
                                  return;
                                }
                                
                                // Validate all entries have required data
                                const invalidEntries = entries.filter(e => 
                                  !e.start_time || !e.end_time || !e.content?.trim() || (e.duration_minutes || 0) <= 0
                                );
                                
                                if (invalidEntries.length > 0) {
                                  setConfirmDialog({
                                    open: true,
                                    title: 'Entry Tidak Lengkap',
                                    description: `Ada ${invalidEntries.length} entry yang belum lengkap. Pastikan semua entry memiliki waktu dan aktivitas yang valid.`,
                                    onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                                  });
                                  return;
                                }
                                
                                // Show confirmation dialog
                                setConfirmDialog({
                                  open: true,
                                  title: `Submit Ulang Week ${report.weekNumber}`,
                                  description: `Apakah Anda yakin ingin submit ulang Week ${report.weekNumber}?\n\nTotal entries: ${entries.length}\nTotal hours: ${report.totalHours} jam\n\nPastikan semua perubahan sudah disimpan.`,
                                  onConfirm: async () => {
                                    try {
                                      await resubmitWeeklyLog(
                                        user.id!,
                                        report.projectId || null,
                                        report.weekNumber,
                                        report.reviewerId!,
                                        profile.full_name!
                                      );
                                      setConfirmDialog({
                                        open: true,
                                        title: 'Berhasil!',
                                        description: 'Logbook berhasil disubmit ulang! Menunggu review dari mentor.',
                                        onConfirm: () => {
                                          setConfirmDialog(prev => ({ ...prev, open: false }));
                                          loadReports();
                                        },
                                      });
                                    } catch (e) {
                                      console.error('Resubmit error:', e);
                                      setConfirmDialog({
                                        open: true,
                                        title: 'Gagal',
                                        description: 'Gagal submit ulang. Silakan coba lagi.',
                                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, open: false })),
                                      });
                                    }
                                  },
                                });
                              }}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Submit Ulang
                            </Button>
                          </div>

                          {expandedWeek === report.weekNumber && (
                            <div className="space-y-3">
                              {loadingEntries[report.weekNumber] ? (
                                <div className="border rounded-lg p-8">
                                  <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                  </div>
                                </div>
                              ) : (weekEntries[report.weekNumber] || []).length === 0 ? (
                                <div className="border rounded-lg p-8 text-center">
                                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-sm text-gray-500">Tidak ada entry untuk minggu ini</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {(weekEntries[report.weekNumber] || []).map((entry: any) => {
                                    const startHH = toHHMM(entry.start_time);
                                    const endHH = toHHMM(entry.end_time);
                                    const durationHours = Math.floor((entry.duration_minutes || 0) / 60);
                                    const durationMins = (entry.duration_minutes || 0) % 60;
                                    
                                    return (
                                      <div 
                                        key={entry.id} 
                                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                              <Badge variant="outline" className="font-mono">
                                                {entry.entry_date}
                                              </Badge>
                                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Clock className="w-3 h-3" />
                                                <span>{startHH} - {endHH}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="font-medium">
                                                  {durationHours}h {durationMins}m
                                                </span>
                                              </div>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-3">
                                              {entry.content || '-'}
                                            </p>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEditEntry(entry)}
                                          >
                                            Edit
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Entry Dialog */}
      <EditLogbookEntryDialog
        entry={editingEntry}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEntry}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              {confirmDialog.title.includes('Submit Ulang') ? 'Batal' : 'OK'}
            </AlertDialogCancel>
            {confirmDialog.title.includes('Submit Ulang') && (
              <AlertDialogAction onClick={confirmDialog.onConfirm} className="bg-orange-600 hover:bg-orange-700">
                Ya, Submit Ulang
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
