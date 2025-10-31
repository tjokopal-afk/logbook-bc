// =========================================
// LOGBOOK TYPE DEFINITIONS
// =========================================

export interface LogbookEntry {
  id: string;
  user_id: string;
  project_id?: string | null;
  task_id?: string | null;
  entry_date: string; // Date (YYYY-MM-DD)
  start_time?: string | null; // Timestamptz
  end_time?: string | null; // Timestamptz
  duration_minutes?: number | null; // Integer
  content: string; // Activity description
  category?: string | null; // e.g., 'daily task', 'project', 'other'
  created_at?: string;
  updated_at?: string;
  
  // Legacy fields for backward compatibility
  date?: string;
  activity?: string;
  duration?: string;
  description?: string;
  weekly_logbook_name?: string | null;
}

export interface CreateLogbookEntryDTO {
  date: string;
  activity: string;
  start_time: string;
  end_time: string;
  description?: string;
}

export interface UpdateLogbookEntryDTO {
  date?: string;
  activity?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  duration?: string;
}

export interface WeeklyLogbook {
  name: string;
  startDate: string;
  endDate: string;
  entriesCount: number;
  entries: LogbookEntry[];
}

export type FileType = 'avatar' | 'document' | 'image';
