// Debug script for save function issues
// Run this in the browser console to test the save function

console.log('🔧 Debug Save Function...');

// Test 1: Check if saveNow function exists
console.log('\n1. Checking saveNow function:');
if (typeof window !== 'undefined' && window.saveNow) {
  console.log('✅ saveNow function found');
} else {
  console.log('❌ saveNow function not found');
}

// Test 2: Check Supabase connection
console.log('\n2. Checking Supabase connection:');
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client found');
  
  // Test auth
  window.supabase.auth.getUser().then(({ data, error }) => {
    console.log('User:', data.user ? 'Found' : 'None', data.user?.email);
    console.log('Error:', error);
  });
  
  // Test database connection
  window.supabase.from('projects').select('count').then(({ data, error }) => {
    console.log('Database connection:', error ? 'Failed' : 'Success');
    if (error) console.log('Error:', error.message);
  });
} else {
  console.log('❌ Supabase client not found');
}

// Test 3: Check localStorage
console.log('\n3. Checking localStorage:');
try {
  const testData = { test: 'save', timestamp: Date.now() };
  localStorage.setItem('test_save_debug', JSON.stringify(testData));
  const retrieved = localStorage.getItem('test_save_debug');
  if (retrieved) {
    console.log('✅ localStorage working');
    localStorage.removeItem('test_save_debug');
  } else {
    console.log('❌ localStorage not working');
  }
} catch (e) {
  console.log('❌ localStorage error:', e);
}

// Test 4: Check current state
console.log('\n4. Current app state:');
console.log('Project ID:', window.projectId || 'Not set');
console.log('Project Name:', window.projectName || 'Not set');
console.log('Content length:', window.text?.length || 0);
console.log('Profile:', window.profile || 'Not set');
console.log('Tone:', window.tone || 'Not set');

// Test 5: Manual save test
console.log('\n5. Testing manual save...');
console.log('Click the "Save Project" button and watch for:');
console.log('- "💾 Save button clicked!"');
console.log('- "✅ Content saved to localStorage backup"');
console.log('- Either "Saved locally (not signed in)" or Supabase save messages');
console.log('- If it hangs, look for error messages in console');

console.log('\n✅ Debug setup complete!');
console.log('Now try clicking "Save Project" and tell me what you see in the console.');
