import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Role } from '@/utils/roleConfig';

interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  affiliation?: string;
  avatar_url?: string;
  signature_url?: string;
  phone?: string;
  company?: string;
  project_charter_url?: string;
  start_date?: string;
  end_date?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
  jurusan?: string;
  divisi?: string | number;
  batch?: number;
  nomor_induk?: number;
  mentor?: string;
  google_connected?: boolean;
  google_email?: string | null;
  affiliation_id?: string | null;
  isActive?: boolean | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  // returns Supabase session data on success
  signInWithUsername: (username: string, password: string) => Promise<Session | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    // Prevent duplicate fetches
    if (isFetchingProfile) {
      console.log('⏭️ Skipping duplicate profile fetch');
      return;
    }

    setIsFetchingProfile(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error.message);
        console.error('🚨 No profile in database - user must be registered first');
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
        setIsFetchingProfile(false);
        return;
      }
      
      if (data) {
        setProfile(data as Profile);
        console.log('✅ Profile loaded:', {
          id: data.id,
          email: data.email,
          company: data.company,
          divisi: data.divisi,
          start_date: data.start_date,
          end_date: data.end_date,
          phone: data.phone,
          username: data.username,
          full_name: data.full_name,
        });
        setLoading(false);
      } else {
        console.error('🚨 No profile data - signing out');
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 Profile fetch failed:', error);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
    } finally {
      setIsFetchingProfile(false);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;

    // Get current session on mount ONCE
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
      
      initialLoadDone = true;
    }).catch((err) => {
      console.error('❌ Session error:', err);
      setLoading(false);
      initialLoadDone = true;
    });

    // Listen for auth state changes - ONLY for actual sign in/out
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted || !initialLoadDone) return;
      
      // ONLY handle explicit SIGNED_IN and SIGNED_OUT events
      // Ignore TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED, etc.
      if (_event === 'SIGNED_IN') {
        const currentUser = session?.user ?? null;
        if (currentUser && currentUser.id !== user?.id) {
          // Only fetch if it's a different user
          setUser(currentUser);
          setLoading(true);
          await fetchProfile(currentUser.id);
        }
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
      // Ignore all other events (TOKEN_REFRESHED, INITIAL_SESSION, etc.)
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, [user?.id]);

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signInWithUsername = async (username: string, password: string): Promise<Session | null> => {
    // Step 1: Look up the user's email based on username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single()

    if (profileError) {
      console.error('Profile lookup error:', profileError)
      throw new Error('User not found')
    }

    if (!profile?.email) {
      throw new Error('Email not found for this username')
    }

    // Step 2: Sign in using the email and password
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(authError.message)
    }

    // Step 3: Return session
    return data.session ?? null
  }

  const signOut = async () => {
    // Reset state FIRST to prevent race conditions
    setUser(null);
    setProfile(null);
    setLoading(false);
    setIsFetchingProfile(false);
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('❌ Logout error:', err);
    }

    // Clear ALL storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }

    // Force immediate redirect
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      role: profile?.role ?? null, 
      loading, 
      signInWithGithub, 
      signInWithGoogle, 
      signInWithUsername, 
      signOut,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};