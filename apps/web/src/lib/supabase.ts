import { createClient } from "@supabase/supabase-js";

// Get Supabase URL and anon key from environment variables.
// The anon key is safe to expose in the browser — it's the public key
// designed for client-side use. Row Level Security (RLS) policies on
// the database/storage side enforce what each user can access.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create Supabase client for Realtime subscriptions and Storage access.
// Auth is handled by our own server (cookie-based), so we disable
// Supabase's own session management here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle auth via httpOnly cookies through our server
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
