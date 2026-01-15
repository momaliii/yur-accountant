import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
let supabaseClient = null;

export const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Set auth token for Supabase
export const setSupabaseAuth = async (token) => {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // If using Supabase Auth, you would set the session here
    // For now, we'll use RLS policies based on user_id
    // This requires the user_id to be stored in Supabase tables
    return true;
  } catch (error) {
    console.error('Error setting Supabase auth:', error);
    return false;
  }
};

export default getSupabaseClient;
