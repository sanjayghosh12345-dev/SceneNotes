// Debug script for current issues
// Copy and paste this into your browser console

console.log('🔍 Debugging Current Issues...');

// Test 1: Check Supabase client
console.log('\n1. Supabase Client Check:');
if (window.supabase) {
  console.log('✅ Supabase client found on window');
  
  // Test getUser with timeout
  console.log('Testing getUser...');
  const startTime = Date.now();
  
  Promise.race([
    window.supabase.auth.getUser(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
  ]).then(({ data, error }) => {
    const duration = Date.now() - startTime;
    console.log(`getUser completed in ${duration}ms`);
    console.log('User:', data.user ? 'Found (' + data.user.email + ')' : 'None');
    console.log('Error:', error);
  }).catch(err => {
    const duration = Date.now() - startTime;
    console.log(`getUser failed after ${duration}ms:`, err.message);
  });
} else {
  console.log('❌ Supabase client not found on window');
}

// Test 2: Check localStorage
console.log('\n2. LocalStorage Check:');
const authToken = localStorage.getItem('supabase.auth.token');
console.log('Auth token:', authToken ? 'Found' : 'Missing');
if (authToken) {
  try {
    const parsed = JSON.parse(authToken);
    console.log('Token expires at:', new Date(parsed.expires_at * 1000));
    console.log('Token is expired:', Date.now() > parsed.expires_at * 1000);
  } catch (e) {
    console.log('Token parse error:', e);
  }
}

// Test 3: Check for infinite loops
console.log('\n3. Loop Check:');
console.log('Count the number of times you see these messages:');
console.log('- "🏠 Home component rendered"');
console.log('- "🔄 AuthMini component rendered"');
console.log('- "🔄 loadLatest called"');
console.log('If you see more than 5-10 of each, there\'s still a loop');

// Test 4: Manual save test
console.log('\n4. Save Test:');
console.log('Click "Save Project" and watch for:');
console.log('- "💾 Save button clicked!"');
console.log('- "✅ Content saved to localStorage backup"');
console.log('- "🔍 Checking user authentication..."');
console.log('- "🔧 Supabase client: Found"');
console.log('- Either success or timeout after 5 seconds');

console.log('\n✅ Debug complete!');
