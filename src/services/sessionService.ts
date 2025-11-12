// =========================================
// SESSION SERVICE - User Session Tracking
// Handle online/idle/offline status management
// =========================================

import { supabase } from '@/supabase';
import type { UserSession, SessionWithUser } from '@/lib/api/types';

// =========================================
// SESSION CRUD OPERATIONS
// =========================================

/**
 * Create a new session for user
 * Called on login
 */
export async function createSession(userId: string): Promise<UserSession> {
  try {
    // End any existing active sessions for this user
    await endExistingSessions(userId);

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        status: 'online',
        session_start: new Date().toISOString(),
        last_active: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserSession;
  } catch (error) {
    console.error('Create session error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create session');
  }
}

/**
 * Update session status (online/idle/offline)
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'online' | 'idle' | 'offline'
): Promise<void> {
  try {
    const updates: any = {
      status,
      last_active: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Set session_end if going offline
    if (status === 'offline') {
      updates.session_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Update session status error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update session status');
  }
}

/**
 * Update last_active timestamp (for activity tracking)
 */
export async function updateLastActive(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        last_active: new Date().toISOString(),
        status: 'online', // Reset to online on activity
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('Update last active error:', error);
    // Don't throw, this is called frequently
  }
}

/**
 * End a session (logout)
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        status: 'offline',
        session_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  } catch (error) {
    console.error('End session error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to end session');
  }
}

/**
 * End all existing active sessions for a user
 * Called before creating a new session
 */
async function endExistingSessions(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        status: 'offline',
        session_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .in('status', ['online', 'idle']);

    if (error) throw error;
  } catch (error) {
    console.error('End existing sessions error:', error);
    // Don't throw, this is cleanup
  }
}

// =========================================
// SESSION QUERIES
// =========================================

/**
 * Get current active session for user
 */
export async function getUserSession(userId: string): Promise<UserSession | null> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['online', 'idle'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as UserSession | null;
  } catch (error) {
    console.error('Get user session error:', error);
    return null;
  }
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<UserSession | null> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) throw error;
    return data as UserSession | null;
  } catch (error) {
    console.error('Get session by ID error:', error);
    return null;
  }
}

/**
 * Get all active sessions
 * For admin dashboard
 */
export async function getActiveSessions(): Promise<SessionWithUser[]> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        user:profiles!user_id(
          id,
          full_name,
          email,
          role,
          avatar_url
        )
      `)
      .in('status', ['online', 'idle'])
      .order('last_active', { ascending: false });

    if (error) throw error;
    return (data || []) as SessionWithUser[];
  } catch (error) {
    console.error('Get active sessions error:', error);
    return [];
  }
}

/**
 * Get all sessions for a user (history)
 */
export async function getUserSessionHistory(
  userId: string,
  limit: number = 50
): Promise<UserSession[]> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as UserSession[];
  } catch (error) {
    console.error('Get user session history error:', error);
    return [];
  }
}

// =========================================
// SESSION STATISTICS
// =========================================

/**
 * Get session statistics for admin dashboard
 */
export async function getSessionStats(): Promise<{
  totalOnline: number;
  totalIdle: number;
  totalOffline: number;
  activeUsers: number;
}> {
  try {
    // Count online sessions
    const { count: onlineCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'online');

    // Count idle sessions
    const { count: idleCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'idle');

    // Count offline sessions (recent)
    const { count: offlineCount } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'offline');

    // Active users = online + idle
    const activeUsers = (onlineCount || 0) + (idleCount || 0);

    return {
      totalOnline: onlineCount || 0,
      totalIdle: idleCount || 0,
      totalOffline: offlineCount || 0,
      activeUsers,
    };
  } catch (error) {
    console.error('Get session stats error:', error);
    return {
      totalOnline: 0,
      totalIdle: 0,
      totalOffline: 0,
      activeUsers: 0,
    };
  }
}

/**
 * Calculate session duration in minutes
 */
export function calculateSessionDuration(session: UserSession): number {
  const start = new Date(session.session_start).getTime();
  const end = session.session_end 
    ? new Date(session.session_end).getTime()
    : new Date().getTime();
  
  return Math.round((end - start) / 1000 / 60); // Minutes
}

/**
 * Check if user is currently active (online or idle in last 15 min)
 */
export async function isUserActive(userId: string): Promise<boolean> {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['online', 'idle'])
      .gte('last_active', fifteenMinutesAgo)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Is user active error:', error);
    return false;
  }
}

// =========================================
// CLEANUP OPERATIONS
// =========================================

/**
 * Mark stale sessions as offline
 * Sessions with no activity for 30+ minutes
 * Should be called periodically (e.g., cron job)
 */
export async function cleanupStaleSessions(): Promise<number> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        status: 'offline',
        session_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('status', ['online', 'idle'])
      .lt('last_active', thirtyMinutesAgo)
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Cleanup stale sessions error:', error);
    return 0;
  }
}

export default {
  createSession,
  updateSessionStatus,
  updateLastActive,
  endSession,
  getUserSession,
  getSessionById,
  getActiveSessions,
  getUserSessionHistory,
  getSessionStats,
  calculateSessionDuration,
  isUserActive,
  cleanupStaleSessions,
};
