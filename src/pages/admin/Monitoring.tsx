// =========================================
// ADMIN - MONITORING PAGE
// View all logbooks and reviews
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Search, 
  BookOpen,
  Star,
  Calendar,
  User,
  Loader2,
  Download,
  Filter
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LogbookEntry {
  id: string;
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  activity_date: string;
  activity_description: string;
  duration_minutes: number;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  logbook_id: string;
  reviewer_id: string;
  reviewer_name: string;
  intern_id: string;
  intern_name: string;
  rating: number;
  feedback: string;
  created_at: string;
}

export default function Monitoring() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('logbooks');
  
  // Logbook state
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
  const [filteredLogbooks, setFilteredLogbooks] = useState<LogbookEntry[]>([]);
  const [logbookSearch, setLogbookSearch] = useState('');
  const [logbookStatusFilter, setLogbookStatusFilter] = useState('all');
  const [loadingLogbooks, setLoadingLogbooks] = useState(true);
  
  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    loadLogbooks();
    loadReviews();
  }, []);

  useEffect(() => {
    applyLogbookFilters();
  }, [logbooks, logbookSearch, logbookStatusFilter]);

  useEffect(() => {
    applyReviewFilters();
  }, [reviews, reviewSearch, reviewRatingFilter]);

  const loadLogbooks = async () => {
    setLoadingLogbooks(true);
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select(`
          *,
          profiles:user_id (full_name),
          projects:project_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const formatted = (data || []).map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        user_name: entry.profiles?.full_name || 'Unknown',
        project_id: entry.project_id,
        project_name: entry.projects?.name || 'No Project',
        activity_date: entry.activity_date,
        activity_description: entry.activity_description,
        duration_minutes: entry.duration_minutes,
        status: entry.status || 'draft',
        created_at: entry.created_at,
      }));

      setLogbooks(formatted);
    } catch (error) {
      console.error('Error loading logbooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load logbooks',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogbooks(false);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id (full_name),
          logbook_entries!inner (
            user_id,
            profiles:user_id (full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const formatted = (data || []).map((review: any) => ({
        id: review.id,
        logbook_id: review.logbook_id,
        reviewer_id: review.reviewer_id,
        reviewer_name: review.reviewer?.full_name || 'Unknown',
        intern_id: review.logbook_entries?.user_id || '',
        intern_name: review.logbook_entries?.profiles?.full_name || 'Unknown',
        rating: review.rating,
        feedback: review.feedback,
        created_at: review.created_at,
      }));

      setReviews(formatted);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const applyLogbookFilters = () => {
    let filtered = [...logbooks];

    if (logbookSearch.trim()) {
      const query = logbookSearch.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.user_name.toLowerCase().includes(query) ||
          entry.project_name.toLowerCase().includes(query) ||
          entry.activity_description.toLowerCase().includes(query)
      );
    }

    if (logbookStatusFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.status === logbookStatusFilter);
    }

    setFilteredLogbooks(filtered);
  };

  const applyReviewFilters = () => {
    let filtered = [...reviews];

    if (reviewSearch.trim()) {
      const query = reviewSearch.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.intern_name.toLowerCase().includes(query) ||
          review.reviewer_name.toLowerCase().includes(query) ||
          review.feedback.toLowerCase().includes(query)
      );
    }

    if (reviewRatingFilter !== 'all') {
      const rating = parseInt(reviewRatingFilter);
      filtered = filtered.filter((review) => Math.floor(review.rating) === rating);
    }

    setFilteredReviews(filtered);
  };

  const exportLogbooksCSV = () => {
    const csv = [
      ['Date', 'Intern', 'Project', 'Activity', 'Duration (min)', 'Status'].join(','),
      ...filteredLogbooks.map((entry) =>
        [
          entry.activity_date,
          entry.user_name,
          entry.project_name,
          `"${entry.activity_description.replace(/"/g, '""')}"`,
          entry.duration_minutes,
          entry.status,
        ].join(',')
      ),
    ].join('\n');

    downloadCSV(csv, 'logbooks');
  };

  const exportReviewsCSV = () => {
    const csv = [
      ['Date', 'Intern', 'Reviewer', 'Rating', 'Feedback'].join(','),
      ...filteredReviews.map((review) =>
        [
          format(new Date(review.created_at), 'yyyy-MM-dd'),
          review.intern_name,
          review.reviewer_name,
          review.rating,
          `"${review.feedback.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    downloadCSV(csv, 'reviews');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `${filename} exported to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
      reviewed: { label: 'Reviewed', className: 'bg-green-100 text-green-700' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Eye className="w-8 h-8 text-purple-600" />
          Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          View all logbooks and reviews across the system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{logbooks.length}</div>
            <p className="text-xs text-muted-foreground">Total Logbooks</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {logbooks.filter((l) => l.status === 'reviewed').length}
            </div>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logbooks" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Logbooks ({logbooks.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* LOGBOOKS TAB */}
        <TabsContent value="logbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Logbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by intern, project, or activity..."
                      value={logbookSearch}
                      onChange={(e) => setLogbookSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={logbookStatusFilter}
                    onChange={(e) => setLogbookStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </div>
                <Button variant="outline" onClick={exportLogbooksCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredLogbooks.length} of {logbooks.length} entries
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logbook Entries</CardTitle>
              <CardDescription>All logbook entries from interns</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogbooks ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading logbooks...</span>
                </div>
              ) : filteredLogbooks.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No logbooks found</h3>
                  <p className="text-sm text-gray-600">
                    {logbookSearch || logbookStatusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No logbook entries yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogbooks.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{entry.user_name}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{entry.project_name}</span>
                            <Badge className={getStatusBadge(entry.status).className}>
                              {getStatusBadge(entry.status).label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{entry.activity_description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(entry.activity_date), 'dd MMM yyyy')}
                            </span>
                            <span>Duration: {entry.duration_minutes} min</span>
                            <span>
                              Submitted: {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVIEWS TAB */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by intern, reviewer, or feedback..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <Button variant="outline" onClick={exportReviewsCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredReviews.length} of {reviews.length} reviews
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>All reviews from mentors</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReviews ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading reviews...</span>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                  <p className="text-sm text-gray-600">
                    {reviewSearch || reviewRatingFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No reviews yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{review.intern_name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            Reviewed by {review.reviewer_name}
                          </span>
                        </div>
                        <div className="text-yellow-500 text-lg">
                          {getRatingStars(review.rating)} {review.rating.toFixed(1)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{review.feedback}</p>
                      <div className="text-xs text-gray-500">
                        {format(new Date(review.created_at), 'dd MMM yyyy HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
