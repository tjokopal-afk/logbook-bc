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
  MessageSquare,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
}

export default function StatusDanReview() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'revision'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery, statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    // TODO: Replace with real Supabase query
    const mockReports: Report[] = [
      {
        id: '1',
        weekNumber: 12,
        startDate: '2025-10-21',
        endDate: '2025-10-27',
        submittedAt: '2025-10-27T16:30:00',
        status: 'reviewed',
        rating: 5,
        mentorComment: 'Excellent work! Your implementation of the login feature is very clean and well-documented. Keep up the great work!',
        mentorName: 'John Smith',
        reviewedAt: '2025-10-28T09:15:00',
        completedActivities: ['Implementasi Fitur Login', 'Testing & Bug Fixing'],
        totalHours: 42
      },
      {
        id: '2',
        weekNumber: 11,
        startDate: '2025-10-14',
        endDate: '2025-10-20',
        submittedAt: '2025-10-20T17:00:00',
        status: 'reviewed',
        rating: 4,
        mentorComment: 'Good progress on the API integration. However, please add more error handling for edge cases.',
        mentorName: 'John Smith',
        reviewedAt: '2025-10-21T10:30:00',
        completedActivities: ['Integrasi API Backend'],
        totalHours: 40
      },
      {
        id: '3',
        weekNumber: 13,
        startDate: '2025-10-28',
        endDate: '2025-11-03',
        submittedAt: '2025-10-30T14:20:00',
        status: 'pending',
        completedActivities: ['Code Review dengan Mentor'],
        totalHours: 35
      },
      {
        id: '4',
        weekNumber: 10,
        startDate: '2025-10-07',
        endDate: '2025-10-13',
        submittedAt: '2025-10-13T16:45:00',
        status: 'revision',
        rating: 2,
        mentorComment: 'Please revise your code. The implementation needs improvement in terms of code structure and best practices. Schedule a meeting with me to discuss.',
        mentorName: 'John Smith',
        reviewedAt: '2025-10-14T11:00:00',
        completedActivities: ['Setup Development Environment'],
        totalHours: 38
      }
    ];

    setReports(mockReports);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = reports;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

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

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const reviewedCount = reports.filter(r => r.status === 'reviewed').length;
  const revisionCount = reports.filter(r => r.status === 'revision').length;

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
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({reports.length})
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({pendingCount})
              </Button>
              <Button
                variant={statusFilter === 'reviewed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('reviewed')}
              >
                Reviewed ({reviewedCount})
              </Button>
              <Button
                variant={statusFilter === 'revision' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('revision')}
              >
                Revision ({revisionCount})
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
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak ada laporan</h3>
                <p className="text-sm text-gray-600">
                  {searchQuery ? 'Coba kata kunci lain' : 'Belum ada laporan yang disubmit'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => {
            const ratingInfo = report.rating ? getRatingLabel(report.rating) : null;

            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">Week {report.weekNumber}</CardTitle>
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
                  {/* Report Info */}
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

                  {/* Completed Activities */}
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

                  {/* Review Section */}
                  {report.status === 'reviewed' || report.status === 'revision' ? (
                    <div className={`border-t pt-4 ${
                      report.status === 'revision' ? 'bg-red-50 -mx-6 px-6 -mb-6 pb-6' : ''
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold">Mentor Review</h4>
                      </div>

                      {/* Rating */}
                      {report.rating && (
                        <div className="mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {renderStars(report.rating)}
                            </div>
                            <span className="text-2xl font-bold">{report.rating.toFixed(1)}</span>
                            {ratingInfo && (
                              <Badge variant="outline" className={ratingInfo.color}>
                                {ratingInfo.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comment */}
                      {report.mentorComment && (
                        <div className="bg-white border rounded-lg p-4">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {report.mentorComment}
                          </p>
                        </div>
                      )}

                      {/* Review Info */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                        <span>Reviewed by: <span className="font-semibold">{report.mentorName}</span></span>
                        <span>•</span>
                        <span>
                          {report.reviewedAt && format(new Date(report.reviewedAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4 bg-yellow-50 -mx-6 px-6 -mb-6 pb-6">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <Clock className="w-4 h-4" />
                        <p className="text-sm font-medium">Menunggu review dari mentor...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
