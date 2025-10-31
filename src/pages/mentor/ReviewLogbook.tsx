// =========================================
// REVIEW LOGBOOK PAGE - Mentor View
// Review weekly reports submitted by interns
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  CheckCircle2, 
  Clock,
  Inbox
} from 'lucide-react';
import { PendingReportCard } from '@/components/mentor/PendingReportCard';

// Mock data - replace with real Supabase data
interface WeeklyReport {
  id: string;
  weekName: string;
  startDate: string;
  endDate: string;
  submittedAt: string;
  internId: string;
  internName: string;
  internAvatar?: string;
  affiliation: string;
  projectName: string;
  totalActivities: number;
  totalHours: number;
  keyActivitiesCompleted: string[];
  status: 'pending' | 'reviewed';
  rating?: number;
  comment?: string;
  reviewedAt?: string;
}

export default function ReviewLogbook() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WeeklyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery, statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    // TODO: Replace with real Supabase query
    const mockReports: WeeklyReport[] = [
      {
        id: '1',
        weekName: 'Minggu 1',
        startDate: '2025-10-01',
        endDate: '2025-10-07',
        submittedAt: '2025-10-08T10:30:00',
        internId: 'intern1',
        internName: 'John Doe',
        affiliation: 'PT Telkom Indonesia',
        projectName: 'Project Alpha',
        totalActivities: 12,
        totalHours: 38.5,
        keyActivitiesCompleted: [
          'Memahami Struktur Project',
          'Setup Development Environment',
          'Implementasi Fitur Login'
        ],
        status: 'pending'
      },
      {
        id: '2',
        weekName: 'Minggu 2',
        startDate: '2025-10-08',
        endDate: '2025-10-14',
        submittedAt: '2025-10-15T09:15:00',
        internId: 'intern2',
        internName: 'Jane Smith',
        affiliation: 'Universitas Indonesia',
        projectName: 'Project Beta',
        totalActivities: 15,
        totalHours: 42.0,
        keyActivitiesCompleted: [
          'Memahami Struktur Project',
          'Setup Development Environment',
          'Implementasi Fitur Login',
          'Integrasi API Backend'
        ],
        status: 'pending'
      },
      {
        id: '3',
        weekName: 'Minggu 1',
        startDate: '2025-10-01',
        endDate: '2025-10-07',
        submittedAt: '2025-10-08T11:00:00',
        internId: 'intern3',
        internName: 'Ahmad Rizki',
        affiliation: 'Institut Teknologi Bandung',
        projectName: 'Project Alpha',
        totalActivities: 10,
        totalHours: 35.0,
        keyActivitiesCompleted: [
          'Memahami Struktur Project',
          'Setup Development Environment'
        ],
        status: 'reviewed',
        rating: 4,
        comment: 'Good progress! Keep up the good work.',
        reviewedAt: '2025-10-09T14:30:00'
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
        r.internName.toLowerCase().includes(query) ||
        r.weekName.toLowerCase().includes(query) ||
        r.projectName.toLowerCase().includes(query)
      );
    }

    setFilteredReports(filtered);
  };

  const handleReviewSubmit = (reportId: string, rating: number, comment: string) => {
    console.log('Submitting review:', { reportId, rating, comment });
    // TODO: Send to Supabase
    
    // Update local state
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, status: 'reviewed' as const, rating, comment, reviewedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const reviewedCount = reports.filter(r => r.status === 'reviewed').length;

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
            Review laporan mingguan dari intern
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
                placeholder="Cari nama intern, minggu, atau project..."
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
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="gap-1"
              >
                <Clock className="w-4 h-4" />
                Pending ({pendingCount})
              </Button>
              <Button
                variant={statusFilter === 'reviewed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('reviewed')}
                className="gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Reviewed ({reviewedCount})
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
                  {statusFilter === 'pending' ? 'Tidak ada laporan pending' : 'Tidak ada hasil'}
                </h3>
                <p className="text-sm text-gray-600">
                  {searchQuery
                    ? 'Coba kata kunci lain'
                    : statusFilter === 'pending'
                    ? 'Semua laporan sudah direview'
                    : 'Belum ada laporan yang direview'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <PendingReportCard
              key={report.id}
              report={report}
              onReviewSubmit={handleReviewSubmit}
            />
          ))
        )}
      </div>
    </div>
  );
}
