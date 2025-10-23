// =========================================
// LOGBOOK TYPE DEFINITIONS
// =========================================

export interface LogbookEntry {
  id: string;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  activity: string;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  duration: string; // e.g., "2h 30m"
  description?: string;
  weekly_logbook_name?: string | null;
  created_at?: string;
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
