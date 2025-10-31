import {createClient} from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Diagnostic logging
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 SUPABASE NOT CONFIGURED!');
  console.error('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
} else {
  console.log('✅ Supabase client initialized:', supabaseUrl.substring(0, 30) + '...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});