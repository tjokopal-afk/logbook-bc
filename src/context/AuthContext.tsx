import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  // returns Supabase session data on success
  signInWithUsername: (username: string, password: string) => Promise<Session | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    });

    // Listen for auth state changes (SIGNED_IN / SIGNED_OUT)
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      console.log('auth event', _event, session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signInWithUsername = async (username: string, password: string): Promise<Session | null> => {
    // lookup email for username
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();

    if (error || !profile || !profile.email) throw new Error('User not found');

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (authError) throw authError;
    // supabase client will trigger onAuthStateChange and update user
    // data contains session and user information
    return (data.session as Session) ?? null;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out from supabase', err);
    }

    // Remove common Supabase auth/session keys from localStorage to avoid stale sessions
    try {
      Object.keys(localStorage).forEach((k) => {
        const lk = k.toLowerCase();
        if (lk.includes('supabase') || lk.includes('sb:') || lk.includes('auth') || lk.includes('session')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore (e.g., if localStorage isn't available)
    }

    setUser(null);

    // Redirect to root (login) to ensure UI resets. Use location.replace so back button won't return to protected route.
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGithub, signInWithGoogle, signInWithUsername, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};