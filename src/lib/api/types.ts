export interface ProjectParticipant {
  id?: string
  project_id: string
  user_id: string
  role_in_project?: string
  joined_at?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  charter_url?: string
  start_date?: string
  end_date?: string
  deadline?: string
  created_by?: string
  created_at?: string
}

export interface Task {
  id?: string
  project_id?: string
  title?: string
  description?: string
  assigned_to?: string
  percent_of_project?: number
  deadline?: string
  created_at?: string
}

export interface LogbookEntry {
  id?: string
  user_id: string
  project_id?: string
  task_id?: string
  entry_date?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  content?: string
  category?: string
  attachments?: unknown[]
  created_at?: string
}

export interface Review {
  id?: string
  entry_id?: string
  reviewer_id?: string
  rating?: number
  comment?: string
  created_at?: string
}

export interface ProjectDocument {
  id?: string
  project_id?: string
  uploaded_by?: string
  doc_type?: string
  storage_path?: string
  file_name?: string
  created_at?: string
}

export interface AuditLog {
  id?: string
  user_id?: string
  action?: string
  object_type?: string
  object_id?: string
  meta?: Record<string, unknown> | null
  created_at?: string
}
