import { supabase } from '@/supabase'
import type { Review } from '@/lib/api/types'

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

export default { createReview, getReviews }
