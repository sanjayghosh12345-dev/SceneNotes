// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Supabase Key present:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: process.env.NODE_ENV === 'development',
  },
});

// Add session debugging and expose to window for debugging
if (typeof window !== 'undefined') {
  // Check what's in localStorage
  console.log('🔍 LocalStorage auth token:', localStorage.getItem('supabase.auth.token'));
  
  // Expose to window for debugging
  (window as any).supabase = supabase;
  console.log('🔧 Supabase client exposed to window.supabase');
  
  // Listen for storage changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'supabase.auth.token') {
      console.log('🔄 Auth token changed in localStorage:', e.newValue ? 'Present' : 'Removed');
    }
  });
}
