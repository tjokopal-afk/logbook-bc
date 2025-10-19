import { supabase } from '@/supabase'
import type { Task } from '@/lib/api/types'

export async function getTasks(project_id?: string): Promise<Task[]> {
  let q = supabase.from('tasks').select('*')
  if (project_id) q = q.eq('project_id', project_id)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(task).select().single()
  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, changes: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data as Task
}

export default { getTasks, createTask, updateTask }
