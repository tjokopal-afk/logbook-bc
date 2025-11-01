// =========================================
// SUPERUSER - ALL REVIEWS (Enhanced)
// Complete reviews overview
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Search, 
  Eye,
  Download,
  Loader2,
  Calendar
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Review {
  id: string;
  entry_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
  logbook_entries?: {
    activity: string;
    profiles?: {
      full_name: string;
    };
  };
}

export default function AllReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, searchQuery, ratingFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (full_name, role),
          logbook_entries:entry_id (
            activity,
            profiles:user_id (full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.comment?.toLowerCase().includes(query) ||
          review.profiles?.full_name?.toLowerCase().includes(query) ||
          review.logbook_entries?.activity?.toLowerCase().includes(query)
      );
    }

    if (ratingFilter !== 'all') {
      filtered = filtered.filter((review) => review.rating === parseInt(ratingFilter));
    }

    setFilteredReviews(filtered);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const stats = {
    total: reviews.length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
    fiveStar: reviews.filter((r) => r.rating === 5).length,
    oneStar: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="w-8 h-8 text-red-600" />
            All Reviews
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete reviews and ratings overview
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.avgRating}</div>
            <p className="text-xs text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.fiveStar}</div>
            <p className="text-xs text-muted-foreground">5-Star Reviews</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.oneStar}</div>
            <p className="text-xs text-muted-foreground">1-Star Reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Review List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-sm text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      <Badge className="bg-blue-100 text-blue-700">
                        By {review.profiles?.full_name || 'Unknown'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{review.comment}</p>
                    {review.logbook_entries && (
                      <p className="text-xs text-gray-600 mb-2">
                        For: {review.logbook_entries.activity}
                        {review.logbook_entries.profiles && (
                          <span> by {review.logbook_entries.profiles.full_name}</span>
                        )}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(review.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
