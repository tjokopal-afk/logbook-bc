// =========================================
// REVIEWS HOOKS
// =========================================

import { useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Review {
  id: string;
  entry_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  reviewer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  entry?: {
    id: string;
    entry_date: string;
    activity_description: string;
    user_id: string;
  };
}

export const useReviews = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews for user's entries (intern view)
  const fetchMyReviews = async () => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, email, avatar_url, role),
          entry:logbook_entries!reviews_entry_id_fkey(
            id,
            entry_date,
            activity_description,
            user_id
          )
        `)
        .eq('entry.user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return { data: data as Review[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews given by current user (mentor view)
  const fetchMyGivenReviews = async () => {
    if (!user || profile?.role !== 'mentor') {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select(`
          *,
          entry:logbook_entries!reviews_entry_id_fkey(
            id,
            entry_date,
            activity_description,
            user_id,
            author:profiles!logbook_entries_user_id_fkey(full_name, email, avatar_url)
          )
        `)
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return { data: data as Review[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all reviews (admin/superuser)
  const fetchAllReviews = async () => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, email, avatar_url, role),
          entry:logbook_entries!reviews_entry_id_fkey(
            id,
            entry_date,
            activity_description,
            user_id,
            author:profiles!logbook_entries_user_id_fkey(full_name, email, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return { data: data as Review[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create review (mentor only)
  const createReview = async (review: {
    entry_id: string;
    rating: number;
    comment?: string;
  }) => {
    if (!user || profile?.role !== 'mentor') {
      return { data: null, error: 'Unauthorized - Only mentors can create reviews' };
    }

    // Validate rating
    if (review.rating < 1 || review.rating > 5) {
      return { data: null, error: 'Rating must be between 1 and 5' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          ...review,
          reviewer_id: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update review (only own reviews)
  const updateReview = async (
    reviewId: string,
    updates: { rating?: number; comment?: string }
  ) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    // Validate rating if provided
    if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
      return { data: null, error: 'Rating must be between 1 and 5' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .eq('reviewer_id', user.id) // Ensure user owns the review
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete review (admin/superuser only)
  const deleteReview = async (reviewId: string) => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete review';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Check if entry has been reviewed by current user
  const hasReviewed = async (entryId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select('id')
        .eq('entry_id', entryId)
        .eq('reviewer_id', user.id)
        .single();

      if (queryError && queryError.code !== 'PGRST116') throw queryError;

      return !!data;
    } catch (err) {
      console.error('Error checking review status:', err);
      return false;
    }
  };

  return {
    loading,
    error,
    fetchMyReviews,
    fetchMyGivenReviews,
    fetchAllReviews,
    createReview,
    updateReview,
    deleteReview,
    hasReviewed
  };
};
