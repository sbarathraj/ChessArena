import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SensitiveStorage } from '../storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fraqqpkxpycerejkctyy.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyYXFxcGt4cHljZXJlamtjdHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NzE4MzcsImV4cCI6MjExMTI0NzgzN30.oFodUjJw_fNJoa4AEQl25zNTZuP7bFd4N-VGS02-VsI';

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
