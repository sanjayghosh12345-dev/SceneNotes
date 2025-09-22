// Debug script to run in browser console
// Copy and paste this into your browser's console to debug auth issues

console.log('🔍 Starting Auth Debug...');

// Check environment variables (browser-safe)
console.log('Environment check:');
console.log('Note: Environment variables are not accessible in browser console');
console.log('Check your .env.local file for:');
console.log('- NEXT_PUBLIC_SUPABASE_URL');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Check localStorage
console.log('\n📱 LocalStorage check:');
const authToken = localStorage.getItem('supabase.auth.token');
console.log('Auth token in localStorage:', authToken ? 'Present' : 'Missing');
if (authToken) {
  try {
    const parsed = JSON.parse(authToken);
    console.log('Token structure:', Object.keys(parsed));
    console.log('Token expires at:', new Date(parsed.expires_at * 1000));
    console.log('Token is expired:', Date.now() > parsed.expires_at * 1000);
  } catch (e) {
    console.log('Token parse error:', e);
  }
}

// Check all Supabase-related localStorage items
console.log('\n🔍 All Supabase localStorage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.includes('supabase')) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
}

// Test Supabase client
console.log('\n🔧 Supabase client test:');
if (typeof window !== 'undefined' && window.supabase) {
  console.log('Supabase client found');
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Current session:', data.session ? 'Found' : 'None');
    console.log('Session user:', data.session?.user?.email || 'None');
    console.log('Session error:', error);
  });
} else {
  console.log('Supabase client not found on window object');
}

// Check for any errors in console
console.log('\n❌ Check the console above for any red error messages');
console.log('Look for patterns like:');
console.log('- "Missing Supabase environment variables"');
console.log('- "Error getting session"');
console.log('- "Error fetching projects"');
console.log('- Network errors or CORS issues');
