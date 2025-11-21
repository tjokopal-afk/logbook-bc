// =========================================
// API TYPES - Database Schema Types
// Complete type definitions matching migration schema
// =========================================

// ========================================
// USER & PROFILE TYPES
// ========================================

export interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'intern' | 'mentor' | 'admin' | 'superuser';
  avatar_url?: string;
  signature_url?: string; // For logbook PDFs
  phone?: string;
  company?: string;
  division?: string;
  // Added for backward compatibility with existing components
  affiliation?: string; // Optional organization / university affiliation
  project_charter_url?: string;
  start_date?: string; // Internship start date
  end_date?: string; // Internship end date
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// PROJECT TYPES
// ========================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  charter_url?: string; // Project charter document
  start_date?: string;
  end_date?: string;
  deadline?: string; // Timestamptz
  created_by: string; // UUID references auth.users(id)
  created_at: string;
  updated_at?: string;
  status?: 'active' | 'completed' | 'upcoming';
}

export interface ProjectParticipant {
  project_id: string;
  user_id: string;
  role_in_project: 'pic' | 'member'; // PIC = Person In Charge (mentor only)
  joined_at?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  uploaded_by: string; // UUID references auth.users(id)
  doc_type: string; // 'charter' | 'image' | 'file' | 'attachment'
  storage_path: string; // Path in Supabase Storage
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

// ========================================
// TASK TYPES
// ========================================

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to: string; // UUID references auth.users(id)
  project_weight: number; // 1-10 weight for progress calculation
  deadline?: string; // Timestamptz
  created_at: string;
  updated_at?: string;
  
  // Task status workflow
  is_submitted: boolean;
  is_reviewed: boolean;
  is_rejected: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_id?: string;
  review_comment?: string;
  
  // Member submission data
  submission_comment?: string;
  submission_bucket_url?: string;
}

// ========================================
// LOGBOOK TYPES
// ========================================

export interface LogbookEntry {
  id: string;
  user_id: string;
  project_id?: string; // Optional: relate to project
  task_id?: string; // Optional: relate to task
  entry_date: string; // Date (YYYY-MM-DD)
  start_time?: string; // Timestamptz
  end_time?: string; // Timestamptz
  duration_minutes?: number; // Auto-calculated or manual
  content: string; // Activity description
  
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
  attachments?: Attachment[];
  
  // Review workflow
  is_submitted: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  reviewed_at?: string;
  reviewer_id?: string;
  
  created_at: string;
  updated_at: string;

  // ----------------------------------------
  // Backward compatibility alias fields
  // Several legacy components still access these names.
  // They are optional and mapped from canonical fields:
  // date -> entry_date
  // activity -> content
  // description -> content (extended description)
  // duration -> duration_minutes
  // weekly_logbook_name -> derived from category (e.g. Week N)
  date?: string;
  activity?: string;
  description?: string;
  duration?: number;
  weekly_logbook_name?: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string; // Public URL from Supabase Storage
  file_size: number; // Bytes
  mime_type: string;
  uploaded_at: string;
}

export interface Review {
  id: string;
  entry_id: string; // References logbook_entries(id)
  reviewer_id: string; // UUID
  comment: string;
  created_at: string;
}

// ========================================
// SESSION TYPES
// ========================================

export interface UserSession {
  id: string;
  user_id: string;
  session_start: string; // Timestamptz
  session_end?: string; // Timestamptz
  status: 'online' | 'offline' | 'idle';
  last_active: string; // Timestamptz
  created_at: string;
  updated_at: string;
}

// ========================================
// NOTIFICATION TYPES
// ========================================

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_reviewed' | 'logbook_reviewed' | 'project_update' | 'general';
  title: string;
  message: string;
  related_id?: string; // ID of related task/logbook/project
  related_type?: 'task' | 'logbook' | 'project';
  is_read: boolean;
  created_at: string;
}

// ========================================
// DATA TRANSFER OBJECTS (DTOs)
// ========================================

export interface CreateProjectDTO {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_by: string;
}

export interface CreateTaskDTO {
  project_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  project_weight: number; // 1-10
  deadline?: string;
}

export interface CreateLogbookEntryDTO {
  entry_date: string;
  start_time?: string;
  end_time?: string;
  content: string;
  project_id?: string;
  task_id?: string;
  category?: string;
  attachments?: Attachment[];
}

export interface UpdateLogbookEntryDTO {
  entry_date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  content?: string;
  project_id?: string;
  task_id?: string;
  category?: string;
  attachments?: Attachment[];
  // Backward compatibility optional fields
  date?: string;
  activity?: string;
  description?: string;
  duration?: number;
}

export interface TaskReviewDTO {
  approved: boolean;
  reviewer_id: string;
  comment?: string;
}

export interface LogbookReviewDTO {
  approved: boolean;
  reviewer_id: string;
  comment: string;
}

// ========================================
// RESPONSE TYPES
// ========================================

export interface ProjectWithDetails extends Project {
  created_by_name?: string;
  participant_count?: number;
  task_count?: number;
  completion_rate?: number; // 0-100
  participants?: (ProjectParticipant & { user?: Profile })[];
  tasks?: Task[];
}

export interface TaskWithDetails extends Task {
  assigned_user?: Profile;
  reviewer?: Profile;
  project?: Project;
}

export interface LogbookWithDetails extends LogbookEntry {
  user?: Profile;
  project?: Project;
  task?: Task;
  reviewer?: Profile;
  reviews?: Review[];
}

export interface SessionWithUser extends UserSession {
  user?: Profile;
}

// ========================================
// UTILITY TYPES
// ========================================

export type FileType = 'avatar' | 'signature' | 'project_document' | 'task_attachment' | 'logbook_attachment' | 'logbook_pdf';

export type ProjectStatus = 'active' | 'completed' | 'upcoming';
export type SessionStatus = 'online' | 'offline' | 'idle';
export type UserRole = 'intern' | 'mentor' | 'admin' | 'superuser';
export type ProjectRole = 'pic' | 'member';

// ========================================
// AUDIT LOG TYPE (added to fix missing export)
// ========================================
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string; // e.g. 'create_logbook', 'approve_weekly_log'
  entity_type?: string; // 'logbook' | 'task' | 'project' | etc
  entity_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
