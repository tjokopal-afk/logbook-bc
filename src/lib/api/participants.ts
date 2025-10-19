import { supabase } from '@/supabase'
import type { ProjectParticipant } from '@/lib/api/types'

export async function addProjectParticipant(p: Partial<ProjectParticipant>): Promise<ProjectParticipant> {
  const { data, error } = await supabase.from('project_participants').insert(p).select().single()
  if (error) throw error
  return data as ProjectParticipant
}

export async function removeProjectParticipant(project_id: string, user_id: string): Promise<boolean> {
  const { error } = await supabase.from('project_participants').delete().match({ project_id, user_id })
  if (error) throw error
  return true
}

export async function listProjectParticipants(project_id: string): Promise<ProjectParticipant[]> {
  const { data, error } = await supabase.from('project_participants').select('*').eq('project_id', project_id)
  if (error) throw error
  return (data ?? []) as ProjectParticipant[]
}

export default { addProjectParticipant, removeProjectParticipant, listProjectParticipants }
