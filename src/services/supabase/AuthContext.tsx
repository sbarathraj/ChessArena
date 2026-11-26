import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { GeneralStorage } from '../storage';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country_code: string | null;
  is_online: boolean;
  rating?: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  setCustomUsername: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'knightarena_custom_user';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        fetchProfile(session.user.id);
      } else {
        GeneralStorage.getItem(USER_STORAGE_KEY).then(async (data) => {
          if (data) {
            try {
              const parsed = JSON.parse(data);
              // Query Supabase for canonical profile matching username or id
              let canonicalProfile: Profile | null = null;
              if (parsed?.username) {
                const { data: dbProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .ilike('username', parsed.username)
                  .limit(1)
                  .maybeSingle();

                if (dbProfile) {
                  canonicalProfile = {
                    id: dbProfile.id,
                    username: dbProfile.username,
                    display_name: dbProfile.display_name || dbProfile.username,
                    avatar_url: dbProfile.avatar_url,
                    bio: dbProfile.bio,
                    country_code: dbProfile.country_code,
                    is_online: true,
                  };
                }
              }

              const finalProfile = canonicalProfile || {
                ...parsed,
                id: isValidUUID(parsed.id) ? parsed.id : generateUUID(),
                is_online: true,
              };

              setProfile(finalProfile);
              await GeneralStorage.setItem(USER_STORAGE_KEY, JSON.stringify(finalProfile));
              // Mark online in Supabase
              await supabase.from('profiles').upsert({
                id: finalProfile.id,
                username: finalProfile.username,
                display_name: finalProfile.display_name,
                is_online: true,
              });
            } catch {}
          }
        });
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        fetchProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setCustomUsername = async (chosenUsername: string) => {
    const cleanUsername = chosenUsername.trim();
    if (!cleanUsername) return;

    // 1. Check if profile with this username already exists -> SIGN IN!
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', cleanUsername)
        .limit(1)
        .maybeSingle();

      if (existingProfile) {
        // Reuse existing profile (Sign In without creating duplicate)
        const loggedInProfile: Profile = {
          id: existingProfile.id,
          username: existingProfile.username,
          display_name: existingProfile.display_name || existingProfile.username,
          avatar_url: existingProfile.avatar_url,
          bio: existingProfile.bio,
          country_code: existingProfile.country_code,
          is_online: true,
        };

        await GeneralStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInProfile));
        await supabase
          .from('profiles')
          .update({ is_online: true, updated_at: new Date().toISOString() })
          .eq('id', loggedInProfile.id);

        setProfile(loggedInProfile);
        return;
      }
    } catch {
      // Offline fallback
    }

    // 2. Genuinely new user -> create profile
    const userId = (profile?.id && isValidUUID(profile.id)) ? profile.id : generateUUID();

    const newProfile: Profile = {
      id: userId,
      username: cleanUsername,
      display_name: cleanUsername,
      avatar_url: null,
      bio: 'KnightArena Challenger',
      country_code: 'WLD',
      is_online: true,
    };

    // Save to local storage for persistent browser session
    await GeneralStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));

    // Upsert into public profiles in Supabase
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        username: cleanUsername,
        display_name: cleanUsername,
        is_online: true,
      });
    } catch {
      // Offline fallback
    }

    setProfile(newProfile);
  };

  const signOut = async () => {
    if (profile?.id) {
      try {
        await supabase.from('profiles').update({ is_online: false }).eq('id', profile.id);
      } catch {}
    }
    await GeneralStorage.removeItem(USER_STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isLoading,
      isGuest,
      setCustomUsername,
      signOut,
      refreshProfile,
    }),
    [user, profile, session, isLoading, isGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
