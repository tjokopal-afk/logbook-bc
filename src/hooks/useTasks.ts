// =========================================
// TASKS HOOKS
// =========================================

import { useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  percent_of_project: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useTasks = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's assigned tasks
  const fetchMyTasks = async () => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, name)
        `)
        .eq('assigned_to', user.id)
        .order('deadline', { ascending: true, nullsFirst: false });

      if (queryError) throw queryError;

      return { data: data as Task[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tasks for a project
  const fetchProjectTasks = async (projectId: string) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles(full_name, email, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return { data: data as Task[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create new task (mentor/admin/superuser)
  const createTask = async (task: {
    project_id: string;
    title: string;
    description?: string;
    assigned_to?: string;
    percent_of_project: number;
    deadline?: string;
  }) => {
    if (!user || !['mentor', 'admin', 'superuser'].includes(profile?.role || '')) {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const updateTask = async (
    taskId: string,
    updates: Partial<Task>
  ) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update task progress (intern can update their own tasks)
  const updateTaskProgress = async (taskId: string, percentOfProject: number) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({ percent_of_project: percentOfProject })
        .eq('id', taskId)
        .eq('assigned_to', user.id) // Ensure user is assigned to this task
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update progress';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete task (mentor/admin/superuser)
  const deleteTask = async (taskId: string) => {
    if (!user || !['mentor', 'admin', 'superuser'].includes(profile?.role || '')) {
      return { error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchMyTasks,
    fetchProjectTasks,
    createTask,
    updateTask,
    updateTaskProgress,
    deleteTask
  };
};
