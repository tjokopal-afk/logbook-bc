import { supabase } from '@/supabase'
import type { Profile } from './types'

// =========================================
// PROFILES API - Match with database schema
// =========================================

/**
 * Get profile by user ID
 */
export async function getProfileByUserId(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Profile | null
}

/**
 * Get profile by username (used for login)
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  
  if (error) throw error
  return data as Profile | null
}

/**
 * Update profile
 */
export async function updateProfile(id: string, changes: Partial<Profile>): Promise<Profile> {
  const updateData = {
    ...changes,
    updated_at: new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Profile
}

/**
 * Get all profiles (for admin/mentor)
 */
export async function getAllProfiles(role?: Profile['role']): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  
  if (role) {
    query = query.eq('role', role)
  }
  
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Profile[]
}

/**
 * Get interns (users with role='intern')
 */
export async function getInterns(): Promise<Profile[]> {
  return getAllProfiles('intern')
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  
  if (error) throw error
  return data === null
}

export default {
  getProfileByUserId,
  getProfileByUsername,
  updateProfile,
  getAllProfiles,
  getInterns,
  isUsernameAvailable,
}
