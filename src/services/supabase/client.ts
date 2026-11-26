import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SensitiveStorage } from '../storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo-knightarena.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key-knightarena';

/**
 * KnightArena Supabase Client
 * Uses SensitiveStorage adapter to persist auth sessions safely across Native and Web.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SensitiveStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
