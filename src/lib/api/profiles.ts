import { supabase } from '@/supabase'

export interface Profile {
  id: string
  username: string
  email?: string
  full_name?: string
  avatar_url?: string
  affiliation?: string
}

export async function getProfileByUserId(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Profile | null
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfile(id: string, changes: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}

export default {
  getProfileByUserId,
  getProfileByUsername,
  updateProfile,
}
