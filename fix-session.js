// Fix for session restoration issues
// Copy and paste this into your browser console to test

console.log('🔧 Testing Session Restoration...');

// Test 1: Check current session state
console.log('\n1. Current Session State:');
if (window.supabase) {
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data.session ? 'Found' : 'None');
    console.log('User:', data.session?.user?.email || 'None');
    console.log('Error:', error);
  });
} else {
  console.log('❌ Supabase client not found');
}

// Test 2: Check localStorage
console.log('\n2. LocalStorage Check:');
const snProject = localStorage.getItem('sn_project');
const authToken = localStorage.getItem('supabase.auth.token');
console.log('sn_project:', snProject ? 'Found' : 'Empty');
console.log('auth_token:', authToken ? 'Found' : 'Empty');

if (snProject) {
  try {
    const parsed = JSON.parse(snProject);
    console.log('Project name:', parsed.name);
    console.log('Content length:', parsed.content?.length || 0);
    console.log('Has full content:', parsed.content && parsed.content.length > 100);
  } catch (e) {
    console.log('Parse error:', e);
  }
}

// Test 3: Manual session restoration
console.log('\n3. Manual Session Restoration:');
if (window.supabase && authToken) {
  console.log('Attempting to restore session...');
  
  // Try to refresh the session
  window.supabase.auth.refreshSession().then(({ data, error }) => {
    console.log('Refresh result:', data.session ? 'Success' : 'Failed');
    console.log('User:', data.session?.user?.email || 'None');
    console.log('Error:', error);
    
    if (data.session) {
      console.log('✅ Session restored successfully!');
      console.log('Now try refreshing the page to see if data persists');
    }
  });
} else {
  console.log('❌ Cannot restore session - missing client or token');
}

console.log('\n✅ Session restoration test complete!');
