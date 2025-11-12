// =========================================
// NOTIFICATION SERVICE - Notification Management
// Handle notification creation, delivery, and management
// =========================================

import { supabase } from '@/supabase';
import type { Notification } from '@/lib/api/types';

// =========================================
// NOTIFICATION CRUD OPERATIONS
// =========================================

/**
 * Create a notification
 */
export async function createNotification(
  notificationData: Partial<Notification>
): Promise<Notification> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create notification');
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Notification[];
  } catch (error) {
    console.error('Get user notifications error:', error);
    return [];
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Notification[];
  } catch (error) {
    console.error('Get unread notifications error:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to mark as read');
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Mark all as read error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to mark all as read');
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete notification error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete notification');
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Delete all notifications error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete all notifications');
  }
}

// =========================================
// SPECIALIZED NOTIFICATION FUNCTIONS
// =========================================

/**
 * Notify user about task assignment
 */
export async function notifyTaskAssignment(
  taskId: string,
  userId: string,
  taskTitle: string,
  assignedBy: string
): Promise<void> {
  try {
    await createNotification({
      user_id: userId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to: "${taskTitle}"`,
      related_id: taskId,
      related_type: 'task',
    });
  } catch (error) {
    console.error('Notify task assignment error:', error);
    // Don't throw, notification failure shouldn't break the main flow
  }
}

/**
 * Notify user about task review
 */
export async function notifyTaskReview(
  taskId: string,
  userId: string,
  approved: boolean,
  taskTitle: string,
  comment?: string
): Promise<void> {
  try {
    await createNotification({
      user_id: userId,
      type: 'task_reviewed',
      title: approved ? 'Task Approved ✓' : 'Task Rejected',
      message: approved
        ? `Your task "${taskTitle}" has been approved!`
        : `Your task "${taskTitle}" needs revision. ${comment || ''}`,
      related_id: taskId,
      related_type: 'task',
    });
  } catch (error) {
    console.error('Notify task review error:', error);
  }
}

/**
 * Notify user about logbook review
 */
export async function notifyLogbookReview(
  entryId: string,
  userId: string,
  approved: boolean,
  weekNumber: number,
  comment?: string
): Promise<void> {
  try {
    await createNotification({
      user_id: userId,
      type: 'logbook_reviewed',
      title: approved ? 'Logbook Approved ✓' : 'Logbook Needs Revision',
      message: approved
        ? `Your Week ${weekNumber} logbook has been approved!`
        : `Your Week ${weekNumber} logbook needs revision. ${comment || ''}`,
      related_id: entryId,
      related_type: 'logbook',
    });
  } catch (error) {
    console.error('Notify logbook review error:', error);
  }
}

/**
 * Notify user about project update
 */
export async function notifyProjectUpdate(
  projectId: string,
  userId: string,
  projectName: string,
  updateMessage: string
): Promise<void> {
  try {
    await createNotification({
      user_id: userId,
      type: 'project_update',
      title: 'Project Update',
      message: `${projectName}: ${updateMessage}`,
      related_id: projectId,
      related_type: 'project',
    });
  } catch (error) {
    console.error('Notify project update error:', error);
  }
}

/**
 * Notify multiple users (batch)
 */
export async function notifyMultipleUsers(
  userIds: string[],
  notification: {
    type: Notification['type'];
    title: string;
    message: string;
    related_id?: string;
    related_type?: 'task' | 'logbook' | 'project';
  }
): Promise<void> {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: notification.related_id,
      related_type: notification.related_type,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  } catch (error) {
    console.error('Notify multiple users error:', error);
  }
}

/**
 * Notify project team about task creation
 */
export async function notifyProjectTeamTaskCreated(
  projectId: string,
  taskTitle: string,
  taskId: string,
  excludeUserId?: string
): Promise<void> {
  try {
    // Get project participants
    const { data: participants } = await supabase
      .from('project_participants')
      .select('user_id')
      .eq('project_id', projectId);

    if (!participants || participants.length === 0) return;

    // Filter out the excluded user (usually the creator)
    const userIds = participants
      .map(p => p.user_id)
      .filter(id => id !== excludeUserId);

    if (userIds.length === 0) return;

    await notifyMultipleUsers(userIds, {
      type: 'project_update',
      title: 'New Task Created',
      message: `A new task "${taskTitle}" has been created in your project`,
      related_id: taskId,
      related_type: 'task',
    });
  } catch (error) {
    console.error('Notify project team error:', error);
  }
}

/**
 * Notify mentor about logbook submission
 */
export async function notifyMentorLogbookSubmission(
  mentorId: string,
  internName: string,
  weekNumber: number,
  entryId: string
): Promise<void> {
  try {
    await createNotification({
      user_id: mentorId,
      type: 'logbook_reviewed',
      title: 'New Logbook Submission',
      message: `${internName} submitted Week ${weekNumber} logbook for review`,
      related_id: entryId,
      related_type: 'logbook',
    });
  } catch (error) {
    console.error('Notify mentor logbook submission error:', error);
  }
}

// =========================================
// CLEANUP OPERATIONS
// =========================================

/**
 * Delete old read notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo)
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Cleanup old notifications error:', error);
    return 0;
  }
}

export default {
  createNotification,
  getUserNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  notifyTaskAssignment,
  notifyTaskReview,
  notifyLogbookReview,
  notifyProjectUpdate,
  notifyMultipleUsers,
  notifyProjectTeamTaskCreated,
  notifyMentorLogbookSubmission,
  cleanupOldNotifications,
};
