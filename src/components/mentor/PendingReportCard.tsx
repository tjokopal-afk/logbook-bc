// =========================================
// PENDING REPORT CARD - Mentor Component
// Display weekly report with review form
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Star,
  Send,
  Eye,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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

interface PendingReportCardProps {
  report: WeeklyReport;
  onReviewSubmit: (reportId: string, rating: number, comment: string) => void;
}

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

export function PendingReportCard({ report, onReviewSubmit }: PendingReportCardProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Silakan pilih rating terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    await onReviewSubmit(report.id, rating, comment);
    setIsSubmitting(false);
    
    // Reset form
    setRating(0);
    setComment('');
  };

  const isReviewed = report.status === 'reviewed';

  return (
    <Card className={`${isReviewed ? 'bg-gray-50' : 'bg-white'} hover:shadow-md transition-shadow`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          {/* Intern Info */}
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage src={report.internAvatar} />
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {report.internName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{report.internName}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {report.affiliation}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {report.projectName}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {isReviewed ? (
            <Badge className="bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Reviewed
            </Badge>
          ) : (
            <Badge className="bg-orange-600">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Report Summary */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">{report.weekName}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Periode</p>
                <p className="font-medium">
                  {format(new Date(report.startDate), 'dd MMM', { locale: idLocale })} - 
                  {format(new Date(report.endDate), 'dd MMM', { locale: idLocale })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Aktivitas</p>
                <p className="font-medium">{report.totalActivities}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total Jam</p>
                <p className="font-medium">{report.totalHours}h</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600">Submitted</p>
              <p className="font-medium text-xs">
                {formatDistanceToNow(new Date(report.submittedAt), { addSuffix: true, locale: idLocale })}
              </p>
            </div>
          </div>
        </div>

        {/* Key Activities Completed */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Key Activities Diselesaikan ({report.keyActivitiesCompleted.length}/8)
          </h4>
          <div className="space-y-1">
            {report.keyActivitiesCompleted.length > 0 ? (
              report.keyActivitiesCompleted.map((activity, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{activity}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Tidak ada key activities yang diselesaikan</p>
            )}
          </div>
        </div>

        {/* Review Section */}
        {isReviewed ? (
          // Show existing review
          <div className="space-y-3 pt-3 border-t">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⭐</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (report.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{report.rating}/5</span>
                  </div>
                  <h4 className={`font-bold text-sm mb-1 ${getRatingLabel(report.rating || 3).color}`}>
                    {getRatingLabel(report.rating || 3).label}
                  </h4>
                  <p className="text-xs text-gray-700">
                    {getRatingLabel(report.rating || 3).description}
                  </p>
                </div>
              </div>
            </div>
            {report.comment && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">{report.comment}</p>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Reviewed {formatDistanceToNow(new Date(report.reviewedAt!), { addSuffix: true, locale: idLocale })}
            </p>
          </div>
        ) : (
          // Show review form
          <div className="space-y-4 pt-3 border-t">
            {/* Rating Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Rating Logbook:
              </label>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 cursor-pointer ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="text-sm font-semibold text-gray-700">{rating}/5</span>
                )}
              </div>
              {rating > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className={`text-sm font-semibold ${getRatingLabel(rating).color}`}>
                    {getRatingLabel(rating).label}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {getRatingLabel(rating).description}
                  </p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Komentar untuk Intern:
              </label>
              <Textarea
                placeholder="Berikan feedback konstruktif untuk membantu intern berkembang..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length} karakter
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Mengirim...' : 'Submit Review'}
              </Button>
              <Button variant="outline" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
