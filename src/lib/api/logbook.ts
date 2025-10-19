import { supabase } from '@/supabase'
import type { LogbookEntry } from '@/lib/api/types'

export async function createLogbookEntry(entry: Partial<LogbookEntry>): Promise<LogbookEntry> {
  const { data, error } = await supabase.from('logbook_entries').insert(entry).select().single()
  if (error) throw error
  return data as LogbookEntry
}

export async function getLogbookEntries(user_id?: string, project_id?: string): Promise<LogbookEntry[]> {
  let q = supabase.from('logbook_entries').select('*')
  if (user_id) q = q.eq('user_id', user_id)
  if (project_id) q = q.eq('project_id', project_id)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as LogbookEntry[]
}

export default { createLogbookEntry, getLogbookEntries }
