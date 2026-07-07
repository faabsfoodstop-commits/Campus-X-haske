import { createContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(data);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, fullName) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email,
          full_name: fullName,
        }]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }
    }

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
