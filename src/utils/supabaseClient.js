import { createClient } from '@supabase/supabase-js';

// Use environment variables - checking both Vite-prefixed and standard names
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 
                     (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) : '');

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                          (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'undefined' || SUPABASE_ANON_KEY === 'undefined') {
  console.error('Supabase configuration missing!', { url: !!SUPABASE_URL, key: !!SUPABASE_ANON_KEY });
  // Don't throw a hard error in production to avoid total white screen if possible,
  // but we still need the values for it to actually work.
}

// Validate URL format
if (!SUPABASE_URL.startsWith('https://')) {
  throw new Error('Invalid Supabase URL. Must start with https://');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);