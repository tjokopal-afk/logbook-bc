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

    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

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
 * Get all entries for a specific date
 * projectId is optional - if provided, filters by project; if null, gets all entries for user on that date
 */
export async function getEntriesByDate(
  userId: string,
  projectId: string | null,
  entryDate: string
): Promise<LogbookEntry[]> {
  try {
    let query = supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', entryDate);
    
    // Only filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleServiceError(error, 'Get entries by date');
  }
}

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
 * Upload logbook attachment to storage
 */
async function uploadLogbookAttachment(
  file: File,
  userId: string,
  date: string
): Promise<{ id: string; file_name: string; file_url: string; file_size: number; mime_type: string; uploaded_at: string }> {
  try {
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${date}/${timestamp}-${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('logbook-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('logbook-attachments')
      .getPublicUrl(filePath);

    return {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      uploaded_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Upload attachment error:', error);
    throw new Error(`Failed to upload ${file.name}`);
  }
}

/**
 * Create a new logbook entry
 * With attachment support and proper category workflow
 * Supports both new (direct DB fields) and old (activity/description) formats
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

    // Determine if using new format or old format
    const isNewFormat = entryData.content !== undefined;
    const userId = entryData.user_id || userData.user.id;
    
    let content: string;
    let startTime: string;
    let endTime: string;
    let date: string;
    let durationMinutes: number;

    if (isNewFormat) {
      // New format: direct DB fields
      content = entryData.content || '';
      startTime = entryData.start_time || '';
      endTime = entryData.end_time || '';
      date = entryData.entry_date || '';
      durationMinutes = entryData.duration_minutes || 0;
      
      if (!durationMinutes || durationMinutes <= 0) {
        durationMinutes = calculateDurationMinutes(startTime, endTime) || 0;
      }
      // If times are provided in HH:MM form, convert to full ISO timestamp
      // DB expects timestamptz; detect user's local timezone offset dynamically
      if (!date) {
        // fallback to today if entry_date not provided
        date = new Date().toISOString().slice(0, 10);
      }
      const hhmmRegex = /^\d{1,2}:\d{2}$/;
      // Helper to format a Date object's offset as +HH:MM or -HH:MM
      const formatOffset = (d: Date) => {
        const offsetMin = -d.getTimezoneOffset(); // minutes offset from UTC (e.g. +420)
        const sign = offsetMin >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMin);
        const hh = String(Math.floor(abs / 60)).padStart(2, '0');
        const mm = String(abs % 60).padStart(2, '0');
        return `${sign}${hh}:${mm}`;
      };
      if (startTime && hhmmRegex.test(startTime)) {
        // create a Date in the host timezone so we can compute its offset
        const dt = new Date(`${date}T${startTime}`);
        const offset = formatOffset(dt);
        startTime = `${date}T${startTime}:00${offset}`;
      }
      if (endTime && hhmmRegex.test(endTime)) {
        const dt = new Date(`${date}T${endTime}`);
        const offset = formatOffset(dt);
        endTime = `${date}T${endTime}:00${offset}`;
      }
    } else {
      // Old format: activity/description fields
      const activityText = entryData.activity || '';
      const description = entryData.description || '';
      content = description ? `${activityText}: ${description}` : activityText;
      
      startTime = entryData.start_time || '';
      endTime = entryData.end_time || '';
      date = entryData.date || entryData.entry_date || '';
      
      durationMinutes = calculateDurationMinutes(startTime, endTime) || 0;
      
      if (!durationMinutes || durationMinutes <= 0) {
        throw new Error('Invalid time range: end time must be after start time');
      }
      
      // Convert HH:MM to ISO timestamp
      startTime = `${date}T${startTime}:00+07:00`;
      endTime = `${date}T${endTime}:00+07:00`;
    }

    // Upload attachments if any
    let attachments: Array<{ id: string; file_name: string; file_url: string; file_size: number; mime_type: string; uploaded_at: string }> | null = null;
    if (entryData.files && entryData.files.length > 0) {
      const uploadPromises = entryData.files.map(file => 
        uploadLogbookAttachment(file, userId, date)
      );
      attachments = await Promise.all(uploadPromises);
    }

    // Insert entry with correct field names
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert({
        user_id: userId,
        project_id: entryData.project_id || null,
        task_id: entryData.task_id || null,
        entry_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        content,
        category: entryData.category || 'draft', // Default to draft
        attachments: attachments ? JSON.stringify(attachments) : null,
        is_submitted: false,
        is_approved: false,
        is_rejected: false,
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
    // Update logbook entry with provided fields
    const updateData: Partial<LogbookEntry> = { 
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
      const dates = entries.map(e => e.entry_date).sort();
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
