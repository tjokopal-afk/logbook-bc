// =========================================
// REVIEW & RATING PAGE - Enhanced
// View feedback from mentors with filters and analytics
// =========================================

import { useEffect, useState } from 'react';
import { useReviews } from '@/hooks/useReviews';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Filter,
  FileText,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

export default function MyReviews() {
  const { fetchMyReviews, loading } = useReviews();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, reviews]);

  const loadReviews = async () => {
    const result = await fetchMyReviews();
    if (result.data) {
      setReviews(result.data);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredReviews(reviews);
    } else {
      const ratingFilter = parseInt(filter);
      setFilteredReviews(reviews.filter((r) => r.rating === ratingFilter));
    }
  };

  const getRatingLabel = (rating: number): { label: string; description: string; color: string } => {
    const ratings = {
      5: { 
        label: 'Sudah Baik, Lanjutkan', 
        description: 'Logbook sangat rapi, lengkap, dan relevan. Tidak perlu revisi. Teruskan gaya kerja ini.',
        color: 'text-green-700'
      },
      4: { 
        label: 'Baik, Perbaiki Sedikit', 
        description: 'Sudah cukup baik, tapi ada bagian yang bisa lebih jelas atau lebih terstruktur. Revisi opsional.',
        color: 'text-blue-700'
      },
      3: { 
        label: 'Perlu Perbaikan Minor', 
        description: 'Beberapa bagian kurang lengkap atau kurang fokus. Perlu revisi ringan agar lebih informatif.',
        color: 'text-yellow-700'
      },
      2: { 
        label: 'Kurang, Perlu Revisi', 
        description: 'Banyak bagian tidak sesuai atau tidak mencerminkan kegiatan dengan baik. Revisi disarankan.',
        color: 'text-orange-700'
      },
      1: { 
        label: 'Tidak Memadai', 
        description: 'Logbook tidak memenuhi standar minimum. Harus direvisi secara menyeluruh.',
        color: 'text-red-700'
      }
    };
    return ratings[rating as keyof typeof ratings] || ratings[3];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = (): string => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

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
        <h1 className="text-3xl font-bold">Review & Rating</h1>
        <p className="text-muted-foreground mt-2">
          Lihat feedback dan rating dari mentor Anda
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600 mr-2">Filter by rating:</span>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({reviews.length})
        </Button>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviews.filter((r) => r.rating === rating).length;
          return (
            <Button
              key={rating}
              variant={filter === rating.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(rating.toString() as FilterType)}
              className="gap-1"
            >
              {rating} <Star className="w-3 h-3 fill-current" /> ({count})
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Reviews Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'all' ? 'Belum ada review' : `Tidak ada review ${filter} bintang`}
                </h3>
                <p className="text-sm text-gray-600 text-center">
                  {filter === 'all'
                    ? 'Review dari mentor akan muncul di sini'
                    : 'Coba filter lain untuk melihat review'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.reviewer?.avatar_url} />
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {review.reviewer?.full_name?.charAt(0) || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {review.reviewer?.full_name || 'Mentor'}
                          <Badge variant="outline" className="font-normal">
                            {review.reviewer?.role || 'Mentor'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: idLocale })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">{review.rating}/5</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rating Evaluation */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⭐</div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm mb-1 ${getRatingLabel(review.rating).color}`}>
                          {getRatingLabel(review.rating).label}
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {getRatingLabel(review.rating).description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comment from Mentor */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">Komentar dari Mentor:</span>
                    </div>
                    {review.comment ? (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 italic">Tidak ada komentar</p>
                      </div>
                    )}
                  </div>

                  {/* Linked Entry */}
                  {review.entry && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700">
                          Aktivitas yang direview:
                        </span>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Tanggal:</span>{' '}
                          {format(new Date(review.entry.entry_date), 'dd MMM yyyy', { locale: idLocale })}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {review.entry.activity_description}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-4">
          {/* Average Rating */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-600" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-yellow-600 mb-2">
                  {getAverageRating()}
                </div>
                {renderStars(Math.round(parseFloat(getAverageRating())))}
                <p className="text-xs text-gray-600 mt-2">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Rating Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as keyof typeof distribution];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        {rating} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Total Reviews */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-green-600">{reviews.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
