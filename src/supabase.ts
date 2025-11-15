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

// Ensure singletons across HMR to avoid multiple GoTrueClient instances
const globalAny = globalThis as unknown as { __supabase?: any; __supabaseAdmin?: any };

function createRegularClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: sessionStorage,
      storageKey: 'logbook-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Regular client for normal users (with RLS)
export const supabase = globalAny.__supabase ?? createRegularClient();
if (!globalAny.__supabase) {
  globalAny.__supabase = supabase;
}

// Admin client with service role key (bypasses RLS)
// ⚠️ WARNING: This should ONLY be used server-side or for admin operations
// Never expose the service role key in production frontend code
function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseAdmin = supabaseServiceRoleKey
  ? (globalAny.__supabaseAdmin ?? createAdminClient())
  : supabase; // Fallback to regular client if service key not configured

if (supabaseServiceRoleKey && !globalAny.__supabaseAdmin) {
  globalAny.__supabaseAdmin = supabaseAdmin;
}

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