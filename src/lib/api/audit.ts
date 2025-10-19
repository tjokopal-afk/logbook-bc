import { supabase } from '@/supabase'
import type { AuditLog } from '@/lib/api/types'

export async function logAudit(audit: Partial<AuditLog>): Promise<AuditLog> {
  const { data, error } = await supabase.from('audit_log').insert(audit).select().single()
  if (error) throw error
  return data as AuditLog
}

export default { logAudit }
