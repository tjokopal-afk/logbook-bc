import { supabase } from '@/supabase'
import type { Project } from './types'

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*')
  if (error) throw error
  return (data ?? []) as Project[]
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase.from('projects').insert(project).select().single()
  if (error) throw error
  return data as Project
}

export async function updateProject(id: string, changes: Partial<Project>): Promise<Project> {
  const { data, error } = await supabase.from('projects').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data as Project
}

export default { getProjects, createProject, updateProject }
