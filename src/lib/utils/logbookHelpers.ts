// =========================================
// LOGBOOK HELPER UTILITIES
// Conversion between old format and new database schema
// =========================================

import type { LogbookEntry, CreateLogbookEntryDTO } from '@/lib/api/types'

// =========================================
// TIME CONVERSION
// =========================================

/**
 * Convert HH:MM time string to ISO timestamp
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param timezone - Timezone offset (default: +07:00 for WIB)
 * @returns ISO timestamp string
 */
export function timeToISO(date: string, time: string, timezone: string = '+07:00'): string {
  return `${date}T${time}:00${timezone}`
}

/**
 * Extract HH:MM time from ISO timestamp
 * @param isoTimestamp - ISO timestamp string
 * @returns Time in HH:MM format
 */
export function isoToTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return ''
  
  try {
    const date = new Date(isoTimestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return ''
  }
}

/**
 * Extract YYYY-MM-DD date from ISO timestamp
 * @param isoTimestamp - ISO timestamp string
 * @returns Date in YYYY-MM-DD format
 */
export function isoToDate(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return ''
  
  try {
    return new Date(isoTimestamp).toISOString().split('T')[0]
  } catch {
    return ''
  }
}

// =========================================
// DURATION CONVERSION
// =========================================

/**
 * Format duration minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m", "45m", "1h")
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '-'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Calculate duration in minutes from HH:MM time strings
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Duration in minutes or null if invalid
 */
export function calculateDurationFromTime(startTime: string, endTime: string): number | null {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    if (
      isNaN(startHour) || isNaN(startMin) ||
      isNaN(endHour) || isNaN(endMin)
    ) {
      return null
    }

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

    // Handle negative duration (invalid time range)
    if (totalMinutes <= 0) {
      return null
    }

    return totalMinutes
  } catch {
    return null
  }
}

/**
 * Calculate duration in minutes from ISO timestamps
 * @param startTime - Start timestamp (ISO)
 * @param endTime - End timestamp (ISO)
 * @returns Duration in minutes or null if invalid
 */
export function calculateDurationFromISO(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number | null {
  if (!startTime || !endTime) return null
  
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

// =========================================
// LEGACY ADAPTER (for backwards compatibility)
// =========================================

/**
 * Legacy format (old implementation - DO NOT USE for new code)
 */
export interface LegacyLogbookEntry {
  id: string
  user_id: string
  date: string              // YYYY-MM-DD
  activity: string
  start_time: string        // HH:MM
  end_time: string          // HH:MM
  duration: string          // "2h 30m"
  description?: string
  weekly_logbook_name?: string | null
  created_at?: string
}

/**
 * Convert new LogbookEntry to legacy format (for display in old components)
 * @param entry - New format entry
 * @returns Legacy format entry
 */
export function toLegacyFormat(entry: LogbookEntry): LegacyLogbookEntry {
  return {
    id: entry.id,
    user_id: entry.user_id,
    date: entry.entry_date,
    activity: entry.content.split(':')[0] || entry.content.substring(0, 50),
    start_time: isoToTime(entry.start_time),
    end_time: isoToTime(entry.end_time),
    duration: formatDuration(entry.duration_minutes),
    description: entry.content,
    weekly_logbook_name: null, // Not supported in new schema
    created_at: entry.created_at,
  }
}

/**
 * Convert legacy format to new CreateLogbookEntryDTO
 * @param legacy - Legacy format data
 * @param timezone - Timezone (default: +07:00)
 * @returns New format DTO
 */
export function fromLegacyFormat(
  legacy: Partial<LegacyLogbookEntry>,
  timezone: string = '+07:00'
): CreateLogbookEntryDTO {
  const date = legacy.date || new Date().toISOString().split('T')[0]
  
  return {
    entry_date: date,
    start_time: legacy.start_time ? timeToISO(date, legacy.start_time, timezone) : null,
    end_time: legacy.end_time ? timeToISO(date, legacy.end_time, timezone) : null,
    content: legacy.description || legacy.activity || '',
    category: 'daily task',
    project_id: null,
    task_id: null,
  }
}

// =========================================
// DISPLAY HELPERS
// =========================================

/**
 * Format entry date to Indonesian format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date (e.g., "22 Jan 2025")
 */
export function formatEntryDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return dateString
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ]

    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year}`
  } catch {
    return dateString
  }
}

/**
 * Get activity title from content (first part before colon or first 50 chars)
 * @param content - Full content text
 * @returns Activity title
 */
export function getActivityTitle(content: string): string {
  if (!content) return ''
  
  // Split by colon if exists
  const parts = content.split(':')
  if (parts.length > 1) {
    return parts[0].trim()
  }
  
  // Otherwise return first 50 characters
  return content.length > 50 ? content.substring(0, 50) + '...' : content
}

/**
 * Calculate total duration from multiple entries
 * @param entries - Array of logbook entries
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(entries: LogbookEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + (entry.duration_minutes || 0)
  }, 0)
}

/**
 * Group entries by date
 * @param entries - Array of logbook entries
 * @returns Map of date to entries
 */
export function groupEntriesByDate(entries: LogbookEntry[]): Map<string, LogbookEntry[]> {
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
 * Get category display name (Indonesian)
 */
export function getCategoryDisplayName(category: string | null | undefined): string {
  if (!category) return 'Umum'
  
  const names: Record<string, string> = {
    'daily task': 'Tugas Harian',
    'project': 'Proyek',
    'meeting': 'Rapat',
    'learning': 'Pembelajaran',
    'other': 'Lainnya',
  }
  
  return names[category.toLowerCase()] || category
}

// =========================================
// VALIDATION
// =========================================

/**
 * Validate time format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(time)
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false
  
  const d = new Date(date)
  return !isNaN(d.getTime())
}

/**
 * Validate entry data before submission
 */
export function validateEntryData(data: Partial<CreateLogbookEntryDTO>): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  
  if (!data.entry_date) {
    errors.entry_date = 'Tanggal harus diisi'
  } else if (!isValidDateFormat(data.entry_date)) {
    errors.entry_date = 'Format tanggal tidak valid'
  }
  
  if (!data.content || data.content.trim().length === 0) {
    errors.content = 'Konten aktivitas harus diisi'
  }
  
  if (data.start_time && data.end_time) {
    const duration = calculateDurationFromISO(data.start_time, data.end_time)
    if (!duration || duration <= 0) {
      errors.time = 'Waktu selesai harus lebih besar dari waktu mulai'
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
