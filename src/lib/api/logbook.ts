import { supabase } from '@/supabase'
import type { LogbookEntry, CreateLogbookEntryDTO, UpdateLogbookEntryDTO } from './types'

// =========================================
// LOGBOOK ENTRIES API - Match with database schema
// =========================================

/**
 * Calculate duration in minutes from start and end time
 */
function calculateDurationMinutes(startTime: string, endTime: string): number | null {
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null
    }
    
    const diffMs = end.getTime() - start.getTime()
    if (diffMs <= 0) return null
    
    return Math.floor(diffMs / 60000) // Convert to minutes
  } catch {
    return null
  }
}

/**
 * Create a new logbook entry
 */
export async function createLogbookEntry(dto: CreateLogbookEntryDTO): Promise<LogbookEntry> {
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('User not authenticated')
  }

  // Calculate duration if times are provided
  let duration_minutes: number | null = null
  if (dto.start_time && dto.end_time) {
    duration_minutes = calculateDurationMinutes(dto.start_time, dto.end_time)
  }

  const insertData = {
    user_id: userData.user.id,
    project_id: dto.project_id || null,
    task_id: dto.task_id || null,
    entry_date: dto.entry_date,
    start_time: dto.start_time || null,
    end_time: dto.end_time || null,
    duration_minutes,
    content: dto.content,
    category: dto.category || null,
    attachments: dto.attachments || null,
  }

  const { data, error } = await supabase
    .from('logbook_entries')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to create logbook entry')
  
  return data as LogbookEntry
}

/**
 * Get logbook entries with filters
 */
export async function getLogbookEntries(filters?: {
  user_id?: string
  project_id?: string
  task_id?: string
  category?: string
  start_date?: string
  end_date?: string
}): Promise<LogbookEntry[]> {
  let query = supabase
    .from('logbook_entries')
    .select('*')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id)
  }
  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters?.task_id) {
    query = query.eq('task_id', filters.task_id)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.start_date) {
    query = query.gte('entry_date', filters.start_date)
  }
  if (filters?.end_date) {
    query = query.lte('entry_date', filters.end_date)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LogbookEntry[]
}

/**
 * Get current user's logbook entries
 */
export async function getMyLogbookEntries(filters?: {
  project_id?: string
  start_date?: string
  end_date?: string
}): Promise<LogbookEntry[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('User not authenticated')
  }

  return getLogbookEntries({
    user_id: userData.user.id,
    ...filters,
  })
}

/**
 * Get a single logbook entry by ID
 */
export async function getLogbookEntryById(id: string): Promise<LogbookEntry | null> {
  const { data, error } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as LogbookEntry | null
}

/**
 * Update a logbook entry
 */
export async function updateLogbookEntry(
  id: string,
  updates: UpdateLogbookEntryDTO
): Promise<LogbookEntry> {
  // Recalculate duration if times are updated
  let duration_minutes: number | null | undefined = updates.duration_minutes
  
  if (updates.start_time || updates.end_time) {
    // Get current entry to merge times
    const current = await getLogbookEntryById(id)
    if (!current) throw new Error('Logbook entry not found')

    const startTime = updates.start_time || current.start_time
    const endTime = updates.end_time || current.end_time

    if (startTime && endTime) {
      duration_minutes = calculateDurationMinutes(startTime, endTime)
    }
  }

  const updateData = {
    ...updates,
    duration_minutes,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('logbook_entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Failed to update logbook entry')
  
  return data as LogbookEntry
}

/**
 * Delete a logbook entry
 */
export async function deleteLogbookEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('logbook_entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get logbook entries grouped by date
 */
export async function getLogbookEntriesByDateRange(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<Map<string, LogbookEntry[]>> {
  const entries = await getLogbookEntries({
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
  })

  const grouped = new Map<string, LogbookEntry[]>()
  
  for (const entry of entries) {
    const date = entry.entry_date
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date)!.push(entry)
  }

  return grouped
}

/**
 * Get total duration for a user in a date range
 */
export async function getTotalDurationMinutes(
  userId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const entries = await getLogbookEntries({
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
  })

  return entries.reduce((total, entry) => {
    return total + (entry.duration_minutes || 0)
  }, 0)
}

export default {
  createLogbookEntry,
  getLogbookEntries,
  getMyLogbookEntries,
  getLogbookEntryById,
  updateLogbookEntry,
  deleteLogbookEntry,
  getLogbookEntriesByDateRange,
  getTotalDurationMinutes,
}
