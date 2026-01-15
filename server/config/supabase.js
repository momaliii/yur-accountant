import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Create Supabase client with service role key (for server-side operations)
// Service role key bypasses RLS (Row Level Security) - use carefully!
let supabaseClient = null;

export const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
};

// Create a Supabase client with anon key (for signInWithPassword)
export const getSupabaseAnonClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Create a Supabase client for a specific user (with their access token)
export const createUserClient = (accessToken) => {
  if (!SUPABASE_URL) {
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default getSupabaseClient;
