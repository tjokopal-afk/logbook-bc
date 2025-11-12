import { getSupabaseClient } from '@/supabase'

export interface BatchPayload {
  batch_name: string
  description?: string | null
  start_date?: string | null
  end_date?: string | null
}

/**
 * Create a new batch record.
 * Uses admin client if userRole is 'admin' or 'superuser' to bypass RLS.
 * Returns { data, error } exactly like supabase client so callers can handle both.
 * 
 * @param payload - The batch data to insert
 * @param userRole - The role of the current user (optional, defaults to regular client)
 */
export async function createBatch(payload: BatchPayload, userRole?: string) {
  const client = getSupabaseClient(userRole)
  
  const { data, error } = await client
    .from('batches')
    .insert([payload])
    .select()
    .single()

  return { data, error }
}

export default { createBatch }
