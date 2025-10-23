// Profiles table (extends auth.users)
export interface Profile {
  id: string                          // UUID references auth.users(id)
  username: string                     // Primary login identifier (unique)
  full_name?: string | null
  email?: string | null               // Duplicate for quick joins
  avatar_url?: string | null
  affiliation?: string | null         // University for interns or company
  role: 'intern' | 'mentor' | 'superuser' | 'admin'
  google_connected?: boolean
  google_email?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProjectParticipant {
  project_id: string
  user_id: string
  role_in_project?: string            // e.g., 'lead', 'member'
}

export interface Project {
  id: string                          // UUID
  name: string
  description?: string | null
  charter_url?: string | null         // Link to file in storage
  start_date?: string | null          // Date
  end_date?: string | null            // Date
  deadline?: string | null            // Timestamptz
  created_by?: string | null          // UUID references auth.users(id)
  created_at?: string                 // Timestamptz
}

export interface Task {
  id: string                          // UUID
  project_id?: string | null          // UUID references projects(id)
  title: string
  description?: string | null
  assigned_to?: string | null         // UUID references auth.users(id)
  percent_of_project?: number | null  // 0-100
  deadline?: string | null            // Timestamptz
  created_at?: string                 // Timestamptz
}

export interface LogbookEntry {
  id: string                          // UUID
  user_id: string                     // UUID references auth.users(id) - intern who wrote this
  project_id?: string | null          // UUID references projects(id)
  task_id?: string | null             // UUID references tasks(id)
  entry_date: string                  // Date (YYYY-MM-DD) - required
  start_time?: string | null          // Timestamptz
  end_time?: string | null            // Timestamptz
  duration_minutes?: number | null    // Integer - optional derived field
  content: string                     // Text - what they did (required)
  category?: string | null            // e.g., 'daily task', 'project', 'other'
  attachments?: AttachmentFile[] | null  // Array of storage file objects
  created_at?: string                 // Timestamptz
  updated_at?: string                 // Timestamptz
}

// Attachment file structure for JSONB
export interface AttachmentFile {
  bucket: string
  path: string
  name: string
  size?: number
  type?: string
}

export interface Review {
  id: string                          // UUID
  entry_id?: string | null            // UUID references logbook_entries(id)
  reviewer_id?: string | null         // UUID references auth.users(id) - mentor
  rating?: number | null              // Smallint (1-5)
  comment?: string | null
  created_at?: string                 // Timestamptz
}

export interface ProjectDocument {
  id: string                          // UUID
  project_id?: string | null          // UUID references projects(id)
  uploaded_by?: string | null         // UUID references auth.users(id)
  doc_type?: string | null            // 'charter', 'certificate', etc
  storage_path?: string | null        // bucket/path
  file_name?: string | null
  created_at?: string                 // Timestamptz
}

export interface AuditLog {
  id: string                          // UUID
  user_id?: string | null             // UUID references auth.users(id)
  action?: string | null
  object_type?: string | null
  object_id?: string | null
  meta?: Record<string, unknown> | null  // JSONB
  created_at?: string                 // Timestamptz
}

// ========================================= 
// DTO (Data Transfer Objects) for API calls
// =========================================

export interface CreateLogbookEntryDTO {
  project_id?: string | null
  task_id?: string | null
  entry_date: string                  // YYYY-MM-DD
  start_time?: string | null          // ISO timestamp or time string
  end_time?: string | null            // ISO timestamp or time string
  content: string                     // Required
  category?: string | null
  attachments?: AttachmentFile[] | null
}

export interface UpdateLogbookEntryDTO {
  project_id?: string | null
  task_id?: string | null
  entry_date?: string
  start_time?: string | null
  end_time?: string | null
  duration_minutes?: number | null
  content?: string
  category?: string | null
  attachments?: AttachmentFile[] | null
}
