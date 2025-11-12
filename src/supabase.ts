import {createClient} from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

// Diagnostic logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 SUPABASE NOT CONFIGURED!');
  console.error('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
} else {
  console.log('✅ Supabase client initialized:', supabaseUrl.substring(0, 30) + '...');
}

// Regular client for normal users (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Admin client with service role key (bypasses RLS)
// ⚠️ WARNING: This should ONLY be used server-side or for admin operations
// Never expose the service role key in production frontend code
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // Fallback to regular client if service key not configured

/**
 * Get the appropriate Supabase client based on user role.
 * ONLY admin role gets the service role client (bypasses RLS).
 * All other roles (including superuser) get the regular client (respects RLS).
 * 
 * @param userRole - The role of the current user
 * @returns Supabase client instance
 */
export function getSupabaseClient(userRole?: string) {
  const isAdmin = userRole === 'admin';
  return isAdmin && supabaseServiceRoleKey ? supabaseAdmin : supabase;
}