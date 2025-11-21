// =========================================
// LOGBOOK TYPE DEFINITIONS
// Aligned with database schema
// =========================================

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string; // Public URL from Supabase Storage
  file_size: number; // Bytes
  mime_type: string;
  uploaded_at: string;
}

export interface LogbookEntry {
  id: string;
  user_id: string;
  project_id?: string | null;
  task_id?: string | null;
  entry_date: string; // Date (YYYY-MM-DD)
  start_time?: string | null; // Timestamptz
  end_time?: string | null; // Timestamptz
  duration_minutes?: number | null; // Integer
  content: string; // Activity description and details
  
  /**
   * Category workflow:
   * - 'draft' = Daily log not yet compiled
   * - 'weekly_{weeknumber}_log_compile' = Compiled but not submitted
   * - 'weekly_{weeknumber}_log_submitted' = Submitted to mentor
   * - 'weekly_{weeknumber}_log_approved' = Approved by mentor (locked)
   * - 'weekly_{weeknumber}_log_rejected_{x}' = Rejected, needs revision
   */
  category: string;
  
  // File attachments (stored as JSONB)
  attachments?: Attachment[] | null;
  
  // Review workflow
  is_submitted?: boolean;
  is_approved?: boolean;
  is_rejected?: boolean;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewer_id?: string | null;
  review_comment?: string | null;
  
  created_at?: string;
  updated_at?: string;

  // ----------------------------------------
  // Backward compatibility alias fields (legacy components still reference these names)
  // They map to canonical fields as follows:
  // date -> entry_date
  // activity -> content
  // description -> content (full text)
  // duration -> duration_minutes
  // weekly_logbook_name -> derived from category pattern
  date?: string;
  activity?: string;
  description?: string;
  duration?: number | null;
  weekly_logbook_name?: string;
}

export interface Review {
  id: string;
  entry_id: string; // References logbook_entries(id)
  reviewer_id: string; // UUID
  comment: string;
  created_at: string;
  
  // Populated from joins
  reviewer?: {
    full_name: string;
    email: string;
  };
}

export interface CreateLogbookEntryDTO {
  // New simplified format (matches DB schema)
  user_id?: string; // Optional - will use authenticated user if not provided
  project_id?: string;
  task_id?: string;
  entry_date?: string;
  content?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  category?: string;
  files?: File[]; // Optional file attachments
  
  // Old format (backward compatibility)
  date?: string;
  activity?: string;
  description?: string;
}

export interface UpdateLogbookEntryDTO {
  entry_date?: string;
  content?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  project_id?: string;
  task_id?: string;
  category?: string;

  // Backward compatibility optional fields (not persisted as separate columns)
  date?: string;
  activity?: string;
  description?: string;
  duration?: number;
}

export interface WeeklyLogbook {
  name: string;
  startDate: string;
  endDate: string;
  entriesCount: number;
  entries: LogbookEntry[];
}

export type FileType = 'avatar' | 'document' | 'image';
