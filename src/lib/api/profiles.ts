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

/**
 * Update profile with project charter URL
 */
export async function updateProfileProjectCharter(id: string, projectCharterUrl: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      project_charter_url: projectCharterUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Profile
}

/**
 * Get profile project charter URL
 */
export async function getProfileProjectCharterUrl(id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('project_charter_url')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data?.project_charter_url || null
}

export default {
  getProfileByUserId,
  getProfileByUsername,
  updateProfile,
  updateProfileProjectCharter,
  getProfileProjectCharterUrl,
  getAllProfiles,
  getInterns,
  isUsernameAvailable,
}
