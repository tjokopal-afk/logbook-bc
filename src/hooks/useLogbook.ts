// =========================================
// LOGBOOK HOOKS
// =========================================

import { useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';

export interface LogbookEntry {
  id: string;
  user_id: string;
  project_id: string;
  task_id?: string;
  entry_date: string;
  content: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    reviewer: {
      full_name: string;
      avatar_url?: string;
    };
  }>;
}

export interface LogbookFilters {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  taskId?: string;
}

export const useLogbook = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's own logbook entries
  const fetchMyLogbook = async (filters: LogbookFilters = {}) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('logbook_entries')
        .select(`
          *,
          project:projects(id, name),
          task:tasks(id, title),
          reviews(
            id,
            rating,
            comment,
            reviewer:profiles!reviews_reviewer_id_fkey1(full_name, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('entry_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('entry_date', filters.endDate);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.taskId) {
        query = query.eq('task_id', filters.taskId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      return { data: data as LogbookEntry[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logbook';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch logbook entries for review (mentor only)
  const fetchLogbookForReview = async (projectId: string) => {
    if (!user || profile?.role !== 'mentor') {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get project participants (only interns)
      const { data: participants, error: participantsError } = await supabase
        .from('project_participants')
        .select('user_id, profiles!inner(role)')
        .eq('project_id', projectId)
        .eq('profiles.role', 'intern');

      if (participantsError) throw participantsError;

      const internIds = participants?.map(p => p.user_id) || [];

      if (internIds.length === 0) {
        return { data: [], error: null };
      }

      // Step 2: Get logbook entries
      const { data, error: queryError } = await supabase
        .from('logbook_entries')
        .select(`
          *,
          author:profiles!logbook_entries_user_id_fkey(full_name, avatar_url, affiliation),
          project:projects(name),
          task:tasks(title),
          reviews(id, rating, comment, reviewer_id)
        `)
        .eq('project_id', projectId)
        .in('user_id', internIds)
        .order('entry_date', { ascending: false });

      if (queryError) throw queryError;

      return { data: data as LogbookEntry[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logbook';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create new logbook entry
  const createLogbookEntry = async (entry: {
    project_id: string;
    task_id?: string;
    entry_date: string;
    content: string;
    attachments?: any[];
  }) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('logbook_entries')
        .insert({
          user_id: user.id,
          ...entry
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create entry';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update logbook entry
  const updateLogbookEntry = async (
    entryId: string,
    updates: Partial<LogbookEntry>
  ) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('logbook_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', user.id) // Ensure user owns the entry
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update entry';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete logbook entry (admin/superuser only)
  const deleteLogbookEntry = async (entryId: string) => {
    if (!user) return { error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('logbook_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchMyLogbook,
    fetchLogbookForReview,
    createLogbookEntry,
    updateLogbookEntry,
    deleteLogbookEntry
  };
};
