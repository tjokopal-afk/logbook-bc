// =========================================
// PROJECTS HOOKS
// =========================================

import { useState } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectParticipant {
  id: string;
  project_id: string;
  user_id: string;
  role_in_project: string;
  joined_at: string;
  user?: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
}

export const useProjects = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's assigned projects
  const fetchMyProjects = async () => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('project_participants')
        .select(`
          role_in_project,
          joined_at,
          project:projects(*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (queryError) throw queryError;

      // Flatten the structure
      const projects = data?.map((item: any) => ({
        ...(item.project || {}),
        role_in_project: item.role_in_project
      }));

      return { data: projects || [], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all projects (admin/superuser)
  const fetchAllProjects = async () => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('projects')
        .select(`
          *,
          creator:profiles!projects_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fetch project participants
  const fetchProjectParticipants = async (projectId: string) => {
    if (!user) return { data: null, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('project_participants')
        .select(`
          *,
          user:profiles(full_name, email, role, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false });

      if (queryError) throw queryError;

      return { data: data as ProjectParticipant[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch participants';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create new project (admin/superuser)
  const createProject = async (project: {
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    deadline?: string;
  }) => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update project (admin/superuser)
  const updateProject = async (
    projectId: string,
    updates: Partial<Project>
  ) => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete project (admin/superuser)
  const deleteProject = async (projectId: string) => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Assign participant to project (admin/superuser)
  const assignParticipant = async (
    projectId: string,
    userId: string,
    roleInProject: string = 'member'
  ) => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { data: null, error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('project_participants')
        .insert({
          project_id: projectId,
          user_id: userId,
          role_in_project: roleInProject
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign participant';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Remove participant from project (admin/superuser)
  const removeParticipant = async (participantId: string) => {
    if (!user || !['admin', 'superuser'].includes(profile?.role || '')) {
      return { error: 'Unauthorized' };
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('project_participants')
        .delete()
        .eq('id', participantId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchMyProjects,
    fetchAllProjects,
    fetchProjectParticipants,
    createProject,
    updateProject,
    deleteProject,
    assignParticipant,
    removeParticipant
  };
};
