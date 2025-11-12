// =========================================
// TASK REVIEW COMPONENT - Mentor/PIC View
// Review submitted tasks: approve/reject with comments
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Paperclip,
  MessageSquare,
  Download
} from 'lucide-react';
import { reviewTask } from '@/services/taskService';
import type { Task } from '@/lib/api/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

interface TaskReviewProps {
  task: Task & {
    assigned_user?: {
      full_name: string;
      email: string;
      avatar_url?: string;
    };
    attachments?: Array<{
      id: string;
      file_name: string;
      file_url: string;
      file_size: number;
      uploaded_at: string;
    }>;
  };
  reviewerId: string;
  onReviewComplete?: () => void;
}

export function TaskReview({ task, reviewerId, onReviewComplete }: TaskReviewProps) {
  const [comment, setComment] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setReviewing(true);
    setError(null);

    try {
      await reviewTask(task.id, {
        approved: true,
        reviewer_id: reviewerId,
        comment: comment.trim() || undefined,
      });

      setComment('');
      setShowReviewForm(false);
      
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (err) {
      console.error('Approve error:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve task');
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setReviewing(true);
    setError(null);

    try {
      await reviewTask(task.id, {
        approved: false,
        reviewer_id: reviewerId,
        comment: comment.trim(),
      });

      setComment('');
      setShowReviewForm(false);
      
      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (err) {
      console.error('Reject error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject task');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = () => {
    if (task.is_reviewed && !task.is_rejected) {
      return <Badge className="bg-green-600">Approved ✓</Badge>;
    } else if (task.is_rejected) {
      return <Badge className="bg-red-600">Rejected</Badge>;
    } else if (task.is_submitted) {
      return <Badge className="bg-yellow-600">Pending Review</Badge>;
    }
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  const isAwaitingReview = task.is_submitted && !task.is_reviewed;
  const isReviewed = task.is_reviewed;

  return (
    <Card className={`${isAwaitingReview ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              {getStatusBadge()}
              <Badge variant="outline" className="text-xs">
                Weight: {task.project_weight}/10
              </Badge>
            </div>
            <CardDescription>{task.description}</CardDescription>
          </div>
        </div>

        {/* Task Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Assigned to</p>
              <p className="font-medium">{task.assigned_user?.full_name || 'Unknown'}</p>
            </div>
          </div>
          {task.deadline && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="font-medium">
                  {format(new Date(task.deadline), 'dd MMM yyyy', { locale: idLocale })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submission Info */}
        {task.submitted_at && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-900">
                Submitted on {format(new Date(task.submitted_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="w-4 h-4 text-gray-600" />
              <h4 className="font-semibold text-sm">Attachments ({task.attachments.length})</h4>
            </div>
            <div className="space-y-2">
              {task.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • 
                        Uploaded {format(new Date(attachment.uploaded_at), 'dd MMM yyyy', { locale: idLocale })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Review */}
        {isReviewed && task.review_comment && (
          <div className={`p-4 rounded-lg border ${
            task.is_rejected 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-2">
              {task.is_rejected ? (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  task.is_rejected ? 'text-red-900' : 'text-green-900'
                }`}>
                  {task.is_rejected ? 'Rejection Reason:' : 'Review Comment:'}
                </p>
                <p className={`text-sm mt-1 ${
                  task.is_rejected ? 'text-red-700' : 'text-green-700'
                }`}>
                  {task.review_comment}
                </p>
                {task.reviewed_at && (
                  <p className={`text-xs mt-2 ${
                    task.is_rejected ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Reviewed on {format(new Date(task.reviewed_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        {isAwaitingReview && !showReviewForm && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => setShowReviewForm(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Review Task
            </Button>
          </div>
        )}

        {showReviewForm && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium">Review Comment</label>
                <span className="text-xs text-gray-500">(optional for approval, required for rejection)</span>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Provide feedback on the task submission..."
                rows={4}
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={reviewing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {reviewing ? 'Approving...' : 'Approve'}
              </Button>
              <Button
                onClick={handleReject}
                disabled={reviewing}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {reviewing ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button
                onClick={() => {
                  setShowReviewForm(false);
                  setComment('');
                  setError(null);
                }}
                disabled={reviewing}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Already Reviewed Message */}
        {isReviewed && (
          <div className="text-center py-4 border-t">
            {task.is_rejected ? (
              <>
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  This task was rejected and needs revision from the assignee.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  This task has been reviewed and approved.
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
