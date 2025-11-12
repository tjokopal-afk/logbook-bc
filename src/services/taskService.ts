// =========================================
// TASK SERVICE - Task Management Operations
// Handle task CRUD, assignment, submission, and review workflow
// =========================================

import { supabase } from '@/supabase';
import type { Task, CreateTaskDTO, TaskReviewDTO, TaskWithDetails } from '@/lib/api/types';

// =========================================
// TASK CRUD OPERATIONS
// =========================================

/**
 * Create a new task
 * Only PIC (Person In Charge) can create tasks
 */
export async function createTask(taskData: CreateTaskDTO): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        is_submitted: false,
        is_reviewed: false,
        is_rejected: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Create task error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create task');
  }
}

/**
 * Get all tasks for a project
 */
export async function getTasksByProject(projectId: string): Promise<TaskWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!assigned_to(id, full_name, email, avatar_url),
        reviewer:profiles!reviewer_id(id, full_name, email),
        project:projects(id, name, description)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TaskWithDetails[];
  } catch (error) {
    console.error('Get tasks by project error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tasks');
  }
}

/**
 * Get tasks assigned to a specific user
 */
export async function getMyTasks(userId: string): Promise<TaskWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, name, description, start_date, end_date),
        reviewer:profiles!reviewer_id(id, full_name, email)
      `)
      .eq('assigned_to', userId)
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data || []) as TaskWithDetails[];
  } catch (error) {
    console.error('Get my tasks error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch my tasks');
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(taskId: string): Promise<TaskWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!assigned_to(id, full_name, email, avatar_url),
        reviewer:profiles!reviewer_id(id, full_name, email),
        project:projects(id, name, description)
      `)
      .eq('id', taskId)
      .maybeSingle();

    if (error) throw error;
    return data as TaskWithDetails | null;
  } catch (error) {
    console.error('Get task by ID error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch task');
  }
}

/**
 * Update task details
 * Only PIC can update
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Update task error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update task');
  }
}

/**
 * Delete a task
 * Only PIC or admin can delete
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete task error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete task');
  }
}

// =========================================
// TASK WORKFLOW OPERATIONS
// =========================================

/**
 * Assign task to a user
 * Only PIC can assign
 */
export async function assignTask(taskId: string, userId: string): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Assign task error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to assign task');
  }
}

/**
 * Submit task as done
 * Only assigned user can submit
 */
export async function submitTask(
  taskId: string,
  submissionData?: {
    comment?: string;
    fileUrl?: string;
  }
): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        // Reset review flags when resubmitting after rejection
        is_reviewed: false,
        is_rejected: false,
        // Add submission data if provided
        ...(submissionData?.comment && { submission_comment: submissionData.comment }),
        ...(submissionData?.fileUrl && { submission_bucket_url: submissionData.fileUrl }),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Submit task error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to submit task');
  }
}

/**
 * Review task (approve or reject)
 * Only PIC can review
 */
export async function reviewTask(
  taskId: string,
  reviewData: TaskReviewDTO
): Promise<Task> {
  try {
    const { approved, reviewer_id, comment } = reviewData;

    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_reviewed: approved, // Set to false if rejected, so task appears as pending
        is_rejected: !approved,
        is_submitted: approved, // Set to false if rejected, allowing resubmission
        reviewer_id,
        review_comment: comment,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  } catch (error) {
    console.error('Review task error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to review task');
  }
}

// =========================================
// PROGRESS CALCULATION
// =========================================

/**
 * Calculate project completion percentage
 * Based on sum of completed task weights
 */
export async function calculateProjectProgress(projectId: string): Promise<number> {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('project_weight, is_reviewed, is_rejected')
      .eq('project_id', projectId);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return 0;

    const totalWeight = tasks.reduce((sum, task) => sum + (task.project_weight || 0), 0);
    const completedWeight = tasks
      .filter(task => task.is_reviewed && !task.is_rejected)
      .reduce((sum, task) => sum + (task.project_weight || 0), 0);

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  } catch (error) {
    console.error('Calculate progress error:', error);
    return 0;
  }
}

/**
 * Get project progress details
 */
export async function getProjectProgressDetails(projectId: string): Promise<{
  totalWeight: number;
  completedWeight: number;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  rejectedTasks: number;
}> {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('project_weight, is_reviewed, is_rejected, is_submitted')
      .eq('project_id', projectId);

    if (error) throw error;
    if (!tasks || tasks.length === 0) {
      return {
        totalWeight: 0,
        completedWeight: 0,
        progressPercentage: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        rejectedTasks: 0,
      };
    }

    const totalWeight = tasks.reduce((sum, task) => sum + (task.project_weight || 0), 0);
    const completedWeight = tasks
      .filter(task => task.is_reviewed && !task.is_rejected)
      .reduce((sum, task) => sum + (task.project_weight || 0), 0);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.is_reviewed && !task.is_rejected).length;
    const rejectedTasks = tasks.filter(task => task.is_rejected).length;
  // Pending = tasks that are not reviewed and not currently rejected
  const pendingTasks = tasks.filter(task => !task.is_reviewed && !task.is_rejected).length;

    return {
      totalWeight,
      completedWeight,
      progressPercentage: totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0,
      totalTasks,
      completedTasks,
      pendingTasks,
      rejectedTasks,
    };
  } catch (error) {
    console.error('Get progress details error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get progress details');
  }
}

// =========================================
// TASK STATISTICS
// =========================================

/**
 * Get task statistics for a user
 */
export async function getUserTaskStats(userId: string): Promise<{
  total: number;
  pending: number;
  submitted: number;
  completed: number;
  rejected: number;
}> {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('is_submitted, is_reviewed, is_rejected')
      .eq('assigned_to', userId);

    if (error) throw error;
    if (!tasks || tasks.length === 0) {
      return { total: 0, pending: 0, submitted: 0, completed: 0, rejected: 0 };
    }

    return {
      total: tasks.length,
      pending: tasks.filter(t => !t.is_submitted && !t.is_reviewed).length,
      submitted: tasks.filter(t => t.is_submitted && !t.is_reviewed).length,
      completed: tasks.filter(t => t.is_reviewed && !t.is_rejected).length,
      rejected: tasks.filter(t => t.is_rejected).length,
    };
  } catch (error) {
    console.error('Get user task stats error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get task statistics');
  }
}

export default {
  createTask,
  getTasksByProject,
  getMyTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  submitTask,
  reviewTask,
  calculateProjectProgress,
  getProjectProgressDetails,
  getUserTaskStats,
};
