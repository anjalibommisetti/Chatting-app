// ==============================================================================
// VibeConnect — Supabase Client Initializer & Runtime Configurator
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://jfqujqsvivilnwcgtizh.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcXVqcXN2aXZpbG53Y2d0aXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NzUxMDcsImV4cCI6MjEwNzQ1MTEwN30.hWVuE5hGoL4zVE2bnwuSwWb4vkVZT2iiPsnJ4IvVEtc';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('vibe_supabase_url') || FALLBACK_URL;
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('vibe_supabase_anon_key') || FALLBACK_KEY;

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
