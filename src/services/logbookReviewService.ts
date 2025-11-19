import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/lib/api/types';
import { notifyLogbookReview, notifyMentorLogbookSubmission } from './notificationService';

// =========================================
// WEEKLY LOG COMPILATION
// =========================================


export async function compileWeeklyLog(
  userId: string,
  projectId: string | null,
  weekNumber: number,
  dailyEntryIds: string[]
): Promise<LogbookEntry[]> {
  try {
    const newCategory = `weekly_${weekNumber}_log_compile`;

    let query = supabase
      .from('logbook_entries')
      .update({
        category: newCategory,
        updated_at: new Date().toISOString(),
      })
      .in('id', dailyEntryIds)
      .eq('user_id', userId)
      .eq('category', 'draft'); // Only compile draft entries

    // Optional project_id filter
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.select();

    if (error) throw error;
    return (data || []) as LogbookEntry[];
  } catch (error) {
    console.error('Compile weekly log error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to compile weekly log');
  }
}

/**
 * Submit weekly log to mentor for review
 * Changes category from 'weekly_X_log_compile' to 'weekly_X_log_submitted'
 */

export async function submitWeeklyLog(
  userId: string,
  projectId: string | null,
  weekNumber: number,
  mentorId: string,
  internName: string
): Promise<LogbookEntry[]> {
  try {
    // First check if there are compiled entries
    let compiledQuery = supabase
      .from('logbook_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('category', `weekly_${weekNumber}_log_compile`);
    
    if (projectId) {
      compiledQuery = compiledQuery.eq('project_id', projectId);
    } else {
      compiledQuery = compiledQuery.is('project_id', null);
    }

    const { data: compiledEntries } = await compiledQuery;

    // If no compiled entries, look for draft entries and compile them first
    if (!compiledEntries || compiledEntries.length === 0) {
      let draftQuery = supabase
        .from('logbook_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('category', 'draft');
      
      if (projectId) {
        draftQuery = draftQuery.eq('project_id', projectId);
      } else {
        draftQuery = draftQuery.is('project_id', null);
      }

      const { data: draftEntries } = await draftQuery;

      if (draftEntries && draftEntries.length > 0) {
        // Auto-compile draft entries
        const draftIds = draftEntries.map(e => e.id);
        await compileWeeklyLog(userId, projectId, weekNumber, draftIds);
      }
    }

    // Now submit the compiled entries
    const currentCategory = `weekly_${weekNumber}_log_compile`;
    const newCategory = `weekly_${weekNumber}_log_submitted`;

    let submitQuery = supabase
      .from('logbook_entries')
      .update({
        category: newCategory,
        is_submitted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('category', currentCategory);

    if (projectId) {
      submitQuery = submitQuery.eq('project_id', projectId);
    } else {
      submitQuery = submitQuery.is('project_id', null);
    }

    const { data, error } = await submitQuery.select();

    if (error) throw error;

    // Get the first entry ID for notification
    const entries = (data || []) as LogbookEntry[];
    if (entries.length > 0) {
      await notifyMentorLogbookSubmission(mentorId, internName, weekNumber, entries[0].id);
    }

    return entries;
  } catch (error) {
    console.error('Submit weekly log error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to submit weekly log');
  }
}

/**
 * Approve weekly log
 * Changes category from 'weekly_X_log_submitted' to 'weekly_X_log_approved'
 * Locks the entries (is_approved = true)
 * Stores review comment in the reviews table
 */

export async function approveWeeklyLog(
  userId: string,
  projectId: string | null,
  weekNumber: number,
  reviewerId: string,
  comment?: string
): Promise<LogbookEntry[]> {
  try {
    const currentCategory = `weekly_${weekNumber}_log_submitted`;
    const newCategory = `weekly_${weekNumber}_log_approved`;

    let query = supabase
      .from('logbook_entries')
      .update({
        category: newCategory,
        is_approved: true,
        is_rejected: false,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('category', currentCategory);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.select();

    if (error) throw error;

    const entries = (data || []) as LogbookEntry[];
    
    // Store review comment in reviews table if provided
    if (entries.length > 0 && comment) {
      for (const entry of entries) {
        await supabase.from('reviews').insert({
          entry_id: entry.id,
          reviewer_id: reviewerId,
          comment: comment,
        });
      }
      
      await notifyLogbookReview(entries[0].id, userId, true, weekNumber, comment);
    }

    return entries;
  } catch (error) {
    console.error('Approve weekly log error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to approve weekly log');
  }
}

/**
 * Reject weekly log with comment
 * Changes category from 'weekly_X_log_submitted' to 'weekly_X_log_rejected_Y'
 * User can resubmit after making corrections
 * Stores review comment in the reviews table
 */

export async function rejectWeeklyLog(
  userId: string,
  projectId: string | null,
  weekNumber: number,
  reviewerId: string,
  comment: string
): Promise<LogbookEntry[]> {
  try {
    // Get current rejection count for this week
    let rejectionQuery = supabase
      .from('logbook_entries')
      .select('category')
      .eq('user_id', userId)
      .like('category', `weekly_${weekNumber}_log_rejected_%`);

    if (projectId) {
      rejectionQuery = rejectionQuery.eq('project_id', projectId);
    } else {
      rejectionQuery = rejectionQuery.is('project_id', null);
    }

    const { data: existingRejections } = await rejectionQuery;

    const rejectionCount = (existingRejections?.length || 0) + 1;

    const currentCategory = `weekly_${weekNumber}_log_submitted`;
    const newCategory = `weekly_${weekNumber}_log_rejected_${rejectionCount}`;

    let updateQuery = supabase
      .from('logbook_entries')
      .update({
        category: newCategory,
        is_rejected: true,
        is_approved: false,
        is_submitted: false, // Allow resubmission
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('category', currentCategory);

    if (projectId) {
      updateQuery = updateQuery.eq('project_id', projectId);
    } else {
      updateQuery = updateQuery.is('project_id', null);
    }

    const { data, error } = await updateQuery.select();

    if (error) throw error;

    const entries = (data || []) as LogbookEntry[];
    
    // Store review comment in reviews table
    if (entries.length > 0 && comment) {
      for (const entry of entries) {
        await supabase.from('reviews').insert({
          entry_id: entry.id,
          reviewer_id: reviewerId,
          comment: comment,
        });
      }
      
      await notifyLogbookReview(entries[0].id, userId, false, weekNumber, comment);
    }

    return entries;
  } catch (error) {
    console.error('Reject weekly log error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to reject weekly log');
  }
}

/**
 * Resubmit rejected weekly log
 * Changes category from 'weekly_X_log_rejected_Y' back to 'weekly_X_log_submitted'
 */
export async function resubmitWeeklyLog(
  userId: string,
  projectId: string | null,
  weekNumber: number,
  mentorId: string,
  internName: string
): Promise<LogbookEntry[]> {
  try {
    const newCategory = `weekly_${weekNumber}_log_submitted`;

    let query = supabase
      .from('logbook_entries')
      .update({
        category: newCategory,
        is_submitted: true,
        is_rejected: false,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .like('category', `weekly_${weekNumber}_log_rejected_%`);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.select();

    if (error) throw error;

    const entries = (data || []) as LogbookEntry[];
    if (entries.length > 0) {
      await notifyMentorLogbookSubmission(mentorId, internName, weekNumber, entries[0].id);
    }

    return entries;
  } catch (error) {
    console.error('Resubmit weekly log error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to resubmit weekly log');
  }
}

// =========================================
// QUERY OPERATIONS
// =========================================

/**
 * Get all logs for a specific week (any status)
 */
export async function getWeeklyLogs(
  userId: string,
  projectId: string | null,
  weekNumber: number
): Promise<LogbookEntry[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .or(`category.eq.draft,category.like.weekly_${weekNumber}_log_%`)
      .order('created_at', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as LogbookEntry[];
  } catch (error) {
    console.error('Get weekly logs error:', error);
    return [];
  }
}

/**
 * Get submitted logs awaiting review (for mentors)
 */
export async function getSubmittedLogs(
  projectId?: string
): Promise<LogbookEntry[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select(`
        *,
        user:users!logbook_entries_user_id_fkey(full_name, email),
        project:projects!logbook_entries_project_id_fkey(name)
      `)
      .like('category', '%_log_submitted')
      .order('submitted_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as LogbookEntry[];
  } catch (error) {
    console.error('Get submitted logs error:', error);
    return [];
  }
}

/**
 * Get approved logs
 */
export async function getApprovedLogs(
  userId?: string,
  projectId?: string
): Promise<LogbookEntry[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('*')
      .eq('is_approved', true)
      .like('category', '%_log_approved')
      .order('reviewed_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as LogbookEntry[];
  } catch (error) {
    console.error('Get approved logs error:', error);
    return [];
  }
}

/**
 * Get rejected logs
 */
export async function getRejectedLogs(
  userId?: string,
  projectId?: string
): Promise<LogbookEntry[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('*')
      .eq('is_rejected', true)
      .like('category', '%_log_rejected_%')
      .order('reviewed_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as LogbookEntry[];
  } catch (error) {
    console.error('Get rejected logs error:', error);
    return [];
  }
}

/**
 * Get review history for a specific week
 */
export async function getWeekReviewHistory(
  userId: string,
  projectId: string | null,
  weekNumber: number
): Promise<{
  submitted: LogbookEntry[];
  approved: LogbookEntry[];
  rejected: LogbookEntry[];
  rejectionCount: number;
}> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .like('category', `weekly_${weekNumber}_log_%`)
      .order('updated_at', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    const entries = (data || []) as LogbookEntry[];

    const submitted = entries.filter(e => e.category === `weekly_${weekNumber}_log_submitted`);
    const approved = entries.filter(e => e.category === `weekly_${weekNumber}_log_approved`);
    const rejected = entries.filter(e => e.category.includes('_log_rejected_'));

    return {
      submitted,
      approved,
      rejected,
      rejectionCount: rejected.length,
    };
  } catch (error) {
    console.error('Get week review history error:', error);
    return {
      submitted: [],
      approved: [],
      rejected: [],
      rejectionCount: 0,
    };
  }
}

/**
 * Get logbook statistics for a user
 */
export async function getUserLogbookStats(userId: string): Promise<{
  totalWeeksSubmitted: number;
  totalWeeksApproved: number;
  totalWeeksRejected: number;
  pendingReview: number;
  approvalRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select('category, is_approved, is_submitted')
      .eq('user_id', userId)
      .like('category', 'weekly_%_log_%');

    if (error) throw error;

    const entries = (data || []) as LogbookEntry[];

    // Count unique weeks for each status
    const submittedWeeks = new Set(
      entries
        .filter(e => e.category.includes('_log_submitted'))
        .map(e => e.category.match(/weekly_(\d+)_/)?.[1])
        .filter(Boolean)
    );

    const approvedWeeks = new Set(
      entries
        .filter(e => e.category.includes('_log_approved'))
        .map(e => e.category.match(/weekly_(\d+)_/)?.[1])
        .filter(Boolean)
    );

    const rejectedWeeks = new Set(
      entries
        .filter(e => e.category.includes('_log_rejected_'))
        .map(e => e.category.match(/weekly_(\d+)_/)?.[1])
        .filter(Boolean)
    );

    const totalWeeksSubmitted = submittedWeeks.size;
    const totalWeeksApproved = approvedWeeks.size;
    const totalWeeksRejected = rejectedWeeks.size;
    const pendingReview = entries.filter(e => e.is_submitted && !e.is_approved && !e.is_rejected).length;

    const approvalRate = totalWeeksSubmitted > 0
      ? (totalWeeksApproved / totalWeeksSubmitted) * 100
      : 0;

    return {
      totalWeeksSubmitted,
      totalWeeksApproved,
      totalWeeksRejected,
      pendingReview,
      approvalRate: Math.round(approvalRate * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Get user logbook stats error:', error);
    return {
      totalWeeksSubmitted: 0,
      totalWeeksApproved: 0,
      totalWeeksRejected: 0,
      pendingReview: 0,
      approvalRate: 0,
    };
  }
}

/**
 * Check if a weekly log is locked (approved or currently submitted)
 */
export async function isWeekLocked(
  userId: string,
  projectId: string | null,
  weekNumber: number
): Promise<boolean> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('is_approved, is_submitted')
      .eq('user_id', userId)
      .like('category', `weekly_${weekNumber}_log_%`)
      .limit(1);

    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.is('project_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('isWeekLocked query error:', error);
      return false;
    }

    if (!data) return false;

    // Locked if approved or currently submitted for review
    return data.is_approved || (data.is_submitted && !data.is_approved);
  } catch (error) {
    console.error('Check week locked error:', error);
    return false;
  }
}

/**
 * Get all reviews for a logbook entry
 */
export async function getEntryReviews(entryId: string): Promise<{
  id: string;
  entry_id: string;
  reviewer_id: string;
  comment: string;
  created_at: string;
  reviewer?: { full_name: string; email: string };
}[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey1(full_name, email)
      `)
      .eq('entry_id', entryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get entry reviews error:', error);
    return [];
  }
}

/**
 * Get all reviews for a week's entries
 */
export async function getWeekReviews(
  userId: string,
  projectId: string | null,
  weekNumber: number
): Promise<{
  id: string;
  entry_id: string;
  reviewer_id: string;
  comment: string;
  created_at: string;
  reviewer?: { full_name: string; email: string };
}[]> {
  try {
    // First get all entry IDs for this week
    let entriesQuery = supabase
      .from('logbook_entries')
      .select('id')
      .eq('user_id', userId)
      .like('category', `weekly_${weekNumber}_log_%`);

    if (projectId) {
      entriesQuery = entriesQuery.eq('project_id', projectId);
    } else {
      entriesQuery = entriesQuery.is('project_id', null);
    }

    const { data: entries } = await entriesQuery;

    if (!entries || entries.length === 0) return [];

    const entryIds = entries.map(e => e.id);

    // Get all reviews for these entries
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey1(full_name, email)
      `)
      .in('entry_id', entryIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get week reviews error:', error);
    return [];
  }
}

export default {
  compileWeeklyLog,
  submitWeeklyLog,
  approveWeeklyLog,
  rejectWeeklyLog,
  resubmitWeeklyLog,
  getWeeklyLogs,
  getSubmittedLogs,
  getApprovedLogs,
  getRejectedLogs,
  getWeekReviewHistory,
  getUserLogbookStats,
  isWeekLocked,
  getEntryReviews,
  getWeekReviews,
};
