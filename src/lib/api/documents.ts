import { supabase } from '@/supabase'
import type { ProjectDocument } from '@/lib/api/types'

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

export default { createProjectDocument, getProjectDocuments }
