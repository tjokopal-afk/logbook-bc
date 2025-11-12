import { supabase } from '@/supabase';

export async function getDatabaseSize(): Promise<number> {
  // Estimate total database size in MB based on row counts of key tables.
  // Assumes ~10KB per row (adjust if you have better estimates).
  const tables = [
    'profiles',
    'projects',
    'project_participants',
    'tasks',
    'logbook_entries',
    'reviews',
    'project_documents',
    'audit_log',
  ];

  let totalSizeMB = 0;
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Error fetching count for ${table}:`, error);
      continue;
    }

    // Estimate 10KB per row, convert to MB: (count * 10240 bytes) / (1024 * 1024) = count / 100 MB
    totalSizeMB += (count || 0) / 100;
  }

  return totalSizeMB; // Return raw MB value for display logic
}