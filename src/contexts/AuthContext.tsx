import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AppRole, Profile } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (supabaseUser: SupabaseUser, retries = 2): Promise<User | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Get profile and role in parallel for faster loading
        const [profileResult, roleResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', supabaseUser.id).single(),
          supabase.from('user_roles').select('role').eq('user_id', supabaseUser.id).single(),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (roleResult.error) throw roleResult.error;

        const profile = profileResult.data;
        const roleData = roleResult.data;

        // Check if user is active
        if (profile && !profile.is_active) {
          await supabase.auth.signOut();
          return null;
        }

        return {
          id: supabaseUser.id,
          name: profile?.name || supabaseUser.email || 'User',
          email: supabaseUser.email || '',
          role: roleData?.role as AppRole || 'employee',
          employee_id: profile?.employee_id,
          is_active: profile?.is_active,
        };
      } catch (error: any) {
        if (attempt < retries && (error.message?.includes('fetch') || error.message?.includes('Failed') || error.code === 'PGRST301')) {
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        if (import.meta.env.DEV) {
          console.error('[DEV] Error fetching user data:', error);
        }
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    let initialSessionHandled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        setSession(session);
        
        if (session?.user) {
          // Defer fetching user data to avoid deadlock with Supabase internals
          setTimeout(async () => {
            if (!isMounted) return;
            const userData = await fetchUserData(session.user);
            if (!isMounted) return;
            setUser(userData);
            setIsLoading(false);
            initialSessionHandled = true;
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
          initialSessionHandled = true;
        }
      }
    );

    // Fallback: if onAuthStateChange hasn't fired within 1s, use getSession
    const fallbackTimer = setTimeout(async () => {
      if (!isMounted || initialSessionHandled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted || initialSessionHandled) return;
      setSession(session);
      if (session?.user) {
        const userData = await fetchUserData(session.user);
        if (!isMounted) return;
        setUser(userData);
      }
      setIsLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          // Don't retry auth errors (wrong credentials)
          if (error.message.includes('Invalid') || error.message.includes('credentials')) {
            return { success: false, error: error.message };
          }
          // Retry on network/rate limit errors
          if (attempt < maxRetries && (error.message.includes('fetch') || error.message.includes('rate') || error.message.includes('network'))) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          const userData = await fetchUserData(data.user);
          if (!userData) {
            return { success: false, error: 'Account is deactivated or not found' };
          }
          setUser(userData);
        }

        return { success: true };
      } catch (error: any) {
        if (attempt < maxRetries && (error.message?.includes('fetch') || error.message?.includes('Failed'))) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return { success: false, error: error.message?.includes('fetch') ? 'Network error. Please check your connection and try again.' : error.message };
      }
    }
    return { success: false, error: 'Unable to connect. Please try again.' };
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please login instead.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
