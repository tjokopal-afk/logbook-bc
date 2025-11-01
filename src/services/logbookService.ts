// =========================================
// LOGBOOK SERVICE - SUPABASE OPERATIONS
// Optimized with better error handling
// =========================================

import { supabase } from '@/supabase';
import type {
  LogbookEntry,
  CreateLogbookEntryDTO,
  UpdateLogbookEntryDTO,
  WeeklyLogbook,
} from '@/types/logbook.types';
// date utils not needed directly in service (used in components)

// ======================================================
// FEATURE FLAGS
// ======================================================
// Weekly logbook feature - Temporary implementation using localStorage
// Until database schema supports weekly_logbook_name field
export const WEEKLY_FEATURE_ENABLED = true;

// =========================================
// HELPER FUNCTION
// =========================================

/**
 * Calculate duration in minutes from HH:MM time strings
 */
function calculateDurationMinutes(startTime: string, endTime: string): number | null {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    if (
      isNaN(startHour) || isNaN(startMin) ||
      isNaN(endHour) || isNaN(endMin)
    ) {
      return null;
    }

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (totalMinutes <= 0) {
      return null;
    }

    return totalMinutes;
  } catch {
    return null;
  }
}

// =========================================
// ERROR HANDLING HELPER
// =========================================

function handleServiceError(error: unknown, operation: string): never {
  console.error(`${operation} error:`, error);
  
  if (error instanceof Error) {
    throw new Error(`${operation}: ${error.message}`);
  }
  
  throw new Error(`${operation}: Unknown error occurred`);
}

// =========================================
// DRAFT ENTRIES OPERATIONS
// =========================================

/**
 * Get all entries for current user
 * NOTE: weekly_logbook_name field does not exist in database schema
 * Returning all entries instead
 */
export async function getDraftEntries(): Promise<LogbookEntry[]> {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleServiceError(error, 'Get draft entries');
  }
}

/**
 * Get all entries for current user
 */
export async function getAllEntries(): Promise<LogbookEntry[]> {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleServiceError(error, 'Get all entries');
  }
}

/**
 * Create a new logbook entry
 * Optimized with auto-duration calculation and validation
 */
export async function createEntry(
  entryData: CreateLogbookEntryDTO
): Promise<LogbookEntry> {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    // Calculate duration in minutes
    const durationMinutes = calculateDurationMinutes(entryData.start_time, entryData.end_time);
    
    if (!durationMinutes || durationMinutes <= 0) {
      throw new Error('Invalid time range: end time must be after start time');
    }

    // Combine activity and description into content
    const content = entryData.description 
      ? `${entryData.activity}: ${entryData.description}` 
      : entryData.activity;

    // Convert HH:MM to ISO timestamp
    const date = entryData.date;
    const start_time = `${date}T${entryData.start_time}:00+07:00`;
    const end_time = `${date}T${entryData.end_time}:00+07:00`;

    // Insert entry with correct field names
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert({
        user_id: userData.user.id,
        entry_date: date,
        start_time,
        end_time,
        duration_minutes: durationMinutes,
        content,
        category: 'daily task',
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create entry');
    
    return data;
  } catch (error) {
    return handleServiceError(error, 'Create entry');
  }
}

/**
 * Update an existing logbook entry
 * Optimized with conditional duration recalculation
 */
export async function updateEntry(
  id: string,
  updates: UpdateLogbookEntryDTO
): Promise<LogbookEntry> {
  try {
    // Note: Update function needs to be adapted to new schema
    // For now, just update with provided data
    const updateData: any = { 
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('logbook_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update entry');
    
    return data;
  } catch (error) {
    return handleServiceError(error, 'Update entry');
  }
}

/**
 * Delete a logbook entry
 */
export async function deleteEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('logbook_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    return handleServiceError(error, 'Delete entry');
  }
}

// =========================================
// WEEKLY LOGBOOK OPERATIONS (TEMPORARY IMPLEMENTATION)
// =========================================
// NOTE: Using localStorage as temporary solution until database schema supports weekly_logbook_name
// Data stored in browser localStorage with key 'weeklyLogbooks'

const WEEKLY_STORAGE_KEY = 'weeklyLogbooks';

interface StoredWeeklyLogbook {
  name: string;
  entryIds: string[];
  createdAt: string;
}

/**
 * Get stored weekly logbooks from localStorage
 */
function getStoredWeeklyLogbooks(): StoredWeeklyLogbook[] {
  try {
    const stored = localStorage.getItem(WEEKLY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading weekly logbooks from localStorage:', error);
    return [];
  }
}

/**
 * Save weekly logbooks to localStorage
 */
function saveStoredWeeklyLogbooks(logbooks: StoredWeeklyLogbook[]): void {
  try {
    localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(logbooks));
  } catch (error) {
    console.error('Error saving weekly logbooks to localStorage:', error);
    throw new Error('Failed to save weekly logbook data');
  }
}

/**
 * TEMPORARY: Save draft entries as a weekly logbook using localStorage
 * This is a client-side only solution until database schema is updated
 */
export async function saveWeeklyLogbook(
  weekName: string,
  entryIds: string[]
): Promise<void> {
  try {
    if (!weekName || weekName.trim().length === 0) {
      throw new Error('Week name is required');
    }

    if (!entryIds || entryIds.length === 0) {
      throw new Error('No entries to save');
    }

    // Get existing weekly logbooks
    const stored = getStoredWeeklyLogbooks();

    // Check if week name already exists
    const existingIndex = stored.findIndex(w => w.name === weekName);
    if (existingIndex >= 0) {
      throw new Error(`Logbook dengan nama "${weekName}" sudah ada. Gunakan nama lain.`);
    }

    // Add new weekly logbook
    stored.push({
      name: weekName,
      entryIds,
      createdAt: new Date().toISOString(),
    });

    // Save to localStorage
    saveStoredWeeklyLogbooks(stored);

    console.log(`✅ Weekly logbook "${weekName}" saved with ${entryIds.length} entries (localStorage)`);
  } catch (error) {
    return handleServiceError(error, 'Save weekly logbook');
  }
}

/**
 * TEMPORARY: Get all weekly logbooks from localStorage and fetch their entries
 */
export async function getWeeklyLogbooks(): Promise<WeeklyLogbook[]> {
  try {
    const stored = getStoredWeeklyLogbooks();
    
    if (stored.length === 0) {
      return [];
    }

    // Fetch all entries from database
    const allEntries = await getAllEntries();

    // Build weekly logbooks with their entries
    const weeklyLogbooks: WeeklyLogbook[] = stored.map(weekly => {
      // Filter entries that belong to this weekly logbook
      const entries = allEntries.filter(entry => 
        weekly.entryIds.includes(entry.id)
      );

      // Calculate date range
      const dates = entries.map(e => e.date).sort();
      const startDate = dates[0] || '';
      const endDate = dates[dates.length - 1] || '';

      return {
        name: weekly.name,
        startDate,
        endDate,
        entriesCount: entries.length,
        entries,
      };
    });

    // Sort by creation date (newest first)
    return weeklyLogbooks.sort((a, b) => {
      const aStored = stored.find(s => s.name === a.name);
      const bStored = stored.find(s => s.name === b.name);
      return new Date(bStored?.createdAt || 0).getTime() - new Date(aStored?.createdAt || 0).getTime();
    });
  } catch (error) {
    console.error('Error getting weekly logbooks:', error);
    return [];
  }
}

/**
 * TEMPORARY: Delete a weekly logbook from localStorage
 * Note: This does NOT delete the actual entries from database
 */
export async function deleteWeeklyLogbook(weekName: string): Promise<number> {
  try {
    const stored = getStoredWeeklyLogbooks();
    const logbook = stored.find(w => w.name === weekName);

    if (!logbook) {
      throw new Error(`Logbook "${weekName}" tidak ditemukan`);
    }

    // Remove from localStorage
    const filtered = stored.filter(w => w.name !== weekName);
    saveStoredWeeklyLogbooks(filtered);

    console.log(`✅ Weekly logbook "${weekName}" deleted from localStorage`);
    return logbook.entryIds.length;
  } catch (error) {
    return handleServiceError(error, 'Delete weekly logbook');
  }
}

/**
 * TEMPORARY: Get entries for a specific weekly logbook
 */
export async function getWeeklyLogbookEntries(
  weekName: string
): Promise<LogbookEntry[]> {
  try {
    const stored = getStoredWeeklyLogbooks();
    const logbook = stored.find(w => w.name === weekName);

    if (!logbook) {
      throw new Error(`Logbook "${weekName}" tidak ditemukan`);
    }

    // Fetch all entries and filter
    const allEntries = await getAllEntries();
    return allEntries.filter(entry => logbook.entryIds.includes(entry.id));
  } catch (error) {
    return handleServiceError(error, 'Get weekly logbook entries');
  }
}
