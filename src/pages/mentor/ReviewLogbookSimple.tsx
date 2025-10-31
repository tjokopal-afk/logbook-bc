// =========================================
// MENTOR - REVIEW LOGBOOK PAGE (SIMPLIFIED)
// =========================================

import { useEffect, useState } from 'react';
import { useLogbook } from '@/hooks/useLogbook';
import { useReviews } from '@/hooks/useReviews';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Send } from 'lucide-react';

export default function ReviewLogbookSimple() {
  const { fetchMyProjects } = useProjects();
  const { fetchLogbookForReview } = useLogbook();
  const { createReview, hasReviewed } = useReviews();

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewingEntryId, setReviewingEntryId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadEntries();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    const result = await fetchMyProjects();
    if (result.data && result.data.length > 0) {
      const projectsList = result.data as any[];
      setProjects(projectsList);
      setSelectedProjectId(projectsList[0].id);
    }
  };

  const loadEntries = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    const result = await fetchLogbookForReview(selectedProjectId);
    if (result.data) {
      const entriesWithReviewStatus = await Promise.all(
        result.data.map(async (entry) => ({
          ...entry,
          hasMyReview: await hasReviewed(entry.id)
        }))
      );
      setEntries(entriesWithReviewStatus);
    }
    setLoading(false);
  };

  const handleSubmitReview = async (entryId: string) => {
    if (!reviewData.rating) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    const result = await createReview({
      entry_id: entryId,
      rating: reviewData.rating,
      comment: reviewData.comment
    });

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Review submitted successfully' });
      setReviewingEntryId(null);
      setReviewData({ rating: 5, comment: '' });
      loadEntries();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const renderStarRating = (currentRating: number, onChange: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 cursor-pointer transition-colors ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Logbook Entries</h1>
        <p className="text-muted-foreground mt-2">
          Provide feedback and ratings for intern entries
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <Card className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="p-4">
            <p className={message.type === 'success' ? 'text-green-600' : 'text-red-600'}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Project Selector - Simple Dropdown */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to review entries</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Entries List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading entries...</p>
          </CardContent>
        </Card>
      ) : !selectedProjectId ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please select a project to view entries
            </p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No logbook entries found for this project
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={entry.author?.avatar_url} />
                      <AvatarFallback>
                        {entry.author?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {entry.author?.full_name || 'Intern'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(entry.entry_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {entry.author?.affiliation && ` • ${entry.author.affiliation}`}
                      </CardDescription>
                    </div>
                  </div>
                  {entry.hasMyReview && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Reviewed
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Entry Content */}
                <div>
                  <p className="text-sm font-medium mb-2">Activity Description:</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.activity_description}
                  </p>
                </div>

                {entry.task && (
                  <div className="text-sm">
                    <span className="font-medium">Task:</span> {entry.task.title}
                  </div>
                )}

                {/* Existing Reviews */}
                {entry.reviews && entry.reviews.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Previous Reviews:</p>
                    <div className="space-y-2">
                      {entry.reviews.map((review: any) => (
                        <div key={review.id} className="text-sm bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.rating}/5</span>
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {!entry.hasMyReview && (
                  <>
                    {reviewingEntryId === entry.id ? (
                      <div className="pt-3 border-t space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Your Rating
                          </label>
                          {renderStarRating(reviewData.rating, (rating) =>
                            setReviewData({ ...reviewData, rating })
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Comment (Optional)
                          </label>
                          <Textarea
                            placeholder="Provide feedback for the intern..."
                            value={reviewData.comment}
                            onChange={(e) =>
                              setReviewData({ ...reviewData, comment: e.target.value })
                            }
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSubmitReview(entry.id)}
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Review
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setReviewingEntryId(null);
                              setReviewData({ rating: 5, comment: '' });
                            }}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setReviewingEntryId(entry.id)}
                        variant="outline"
                        size="sm"
                      >
                        Add Review
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
