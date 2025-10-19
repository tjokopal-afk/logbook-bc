import { supabase } from '@/supabase'


  // Profiles
  export interface Profile {
    id: string
    username: string
    email?: string
    full_name?: string
    avatar_url?: string
    affiliation?: string
  }

  export async function getProfileByUserId(id: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) throw error
    return data as Profile | null
  }

  export async function getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single()
    if (error) throw error
    return data as Profile | null
  }

  export async function updateProfile(id: string, changes: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase.from('profiles').update(changes).eq('id', id).select().single()
    if (error) throw error
    return data as Profile
  }

  // Domain types
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

  export interface ProjectParticipant {
    id?: string
    project_id: string
    user_id: string
    role_in_project?: string
    joined_at?: string
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

  // Projects
  export async function getProjects(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*')
    if (error) throw error
    return (data ?? []) as Project[]
  }

  export async function createProject(project: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase.from('projects').insert(project).select().single()
    if (error) throw error
    return data as Project
  }

  export async function updateProject(id: string, changes: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase.from('projects').update(changes).eq('id', id).select().single()
    if (error) throw error
    return data as Project
  }

  // Participants
  export async function addProjectParticipant(p: Partial<ProjectParticipant>): Promise<ProjectParticipant> {
    const { data, error } = await supabase.from('project_participants').insert(p).select().single()
    if (error) throw error
    return data as ProjectParticipant
  }

  export async function removeProjectParticipant(project_id: string, user_id: string): Promise<boolean> {
    const { error } = await supabase.from('project_participants').delete().match({ project_id, user_id })
    if (error) throw error
    return true
  }

  export async function listProjectParticipants(project_id: string): Promise<ProjectParticipant[]> {
    const { data, error } = await supabase.from('project_participants').select('*').eq('project_id', project_id)
    if (error) throw error
    return (data ?? []) as ProjectParticipant[]
  }

  // Tasks
  export async function getTasks(project_id?: string): Promise<Task[]> {
    let q = supabase.from('tasks').select('*')
    if (project_id) q = q.eq('project_id', project_id)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Task[]
  }

  export async function createTask(task: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase.from('tasks').insert(task).select().single()
    if (error) throw error
    return data as Task
  }

  export async function updateTask(id: string, changes: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase.from('tasks').update(changes).eq('id', id).select().single()
    if (error) throw error
    return data as Task
  }

  // Logbook
  export async function createLogbookEntry(entry: Partial<LogbookEntry>): Promise<LogbookEntry> {
    const { data, error } = await supabase.from('logbook_entries').insert(entry).select().single()
    if (error) throw error
    return data as LogbookEntry
  }

  export async function getLogbookEntries(user_id?: string, project_id?: string): Promise<LogbookEntry[]> {
    let q = supabase.from('logbook_entries').select('*')
    if (user_id) q = q.eq('user_id', user_id)
    if (project_id) q = q.eq('project_id', project_id)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as LogbookEntry[]
  }

  // Reviews
  export async function createReview(review: Partial<Review>): Promise<Review> {
    const { data, error } = await supabase.from('reviews').insert(review).select().single()
    if (error) throw error
    return data as Review
  }

  export async function getReviews(entry_id?: string): Promise<Review[]> {
    let q = supabase.from('reviews').select('*')
    if (entry_id) q = q.eq('entry_id', entry_id)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Review[]
  }

  // Project documents
  export async function createProjectDocument(doc: Partial<ProjectDocument>): Promise<ProjectDocument> {
    const { data, error } = await supabase.from('project_documents').insert(doc).select().single()
    if (error) throw error
    return data as ProjectDocument
  }

  export async function getProjectDocuments(project_id: string): Promise<ProjectDocument[]> {
    const { data, error } = await supabase.from('project_documents').select('*').eq('project_id', project_id)
    if (error) throw error
    return (data ?? []) as ProjectDocument[]
  }

  // Audit
  export async function logAudit(audit: Partial<AuditLog>): Promise<AuditLog> {
    const { data, error } = await supabase.from('audit_log').insert(audit).select().single()
    if (error) throw error
    return data as AuditLog
  }

  export const api = {
    // profiles
    getProfileByUserId,
    getProfileByUsername,
    updateProfile,
    // projects
    getProjects,
    createProject,
    updateProject,
    // participants
    addProjectParticipant,
    removeProjectParticipant,
    listProjectParticipants,
    // tasks
    getTasks,
    createTask,
    updateTask,
    // logbook
    createLogbookEntry,
    getLogbookEntries,
    // reviews
    createReview,
    getReviews,
    // docs
    createProjectDocument,
    getProjectDocuments,
    // audit
    logAudit,
  }

  export default api
