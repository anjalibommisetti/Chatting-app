// ==============================================================================
// VibeConnect — Supabase Client Initializer & Runtime Configurator
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('vibe_supabase_url') || '';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('vibe_supabase_anon_key') || '';

let supabaseClient = null;

if (DEFAULT_URL && DEFAULT_KEY && DEFAULT_URL !== 'https://your-project-id.supabase.co') {
  try {
    supabaseClient = createClient(DEFAULT_URL, DEFAULT_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export function getSupabase() {
  return supabaseClient;
}

export function isSupabaseConfigured() {
  return !!(supabaseClient && DEFAULT_URL && DEFAULT_KEY && DEFAULT_URL !== 'https://your-project-id.supabase.co');
}

export function setSupabaseConfig(url, key) {
  if (!url || !key) {
    localStorage.removeItem('vibe_supabase_url');
    localStorage.removeItem('vibe_supabase_anon_key');
    supabaseClient = null;
    return false;
  }

  localStorage.setItem('vibe_supabase_url', url);
  localStorage.setItem('vibe_supabase_anon_key', key);

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return true;
  } catch (e) {
    console.error('Error configuring Supabase:', e);
    return false;
  }
}
