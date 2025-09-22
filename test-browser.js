// Browser-compatible test script
// Copy and paste this into your browser console

console.log('🧪 Testing SceneNotes in Browser...');

// Test 1: Check if components are rendering
console.log('\n1. Component Status:');
console.log('Home component rendered:', document.querySelector('.app') ? 'Yes' : 'No');
console.log('AuthMini component rendered:', document.querySelector('.mini-auth') ? 'Yes' : 'No');

// Test 2: Check localStorage
console.log('\n2. LocalStorage Status:');
const snProject = localStorage.getItem('sn_project');
const testContent = localStorage.getItem('test_content');
console.log('sn_project:', snProject ? 'Found' : 'Empty');
console.log('test_content:', testContent ? 'Found' : 'Empty');

// Test 3: Check Supabase client
console.log('\n3. Supabase Client:');
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client found');
  
  // Test auth
  window.supabase.auth.getUser().then(({ data, error }) => {
    console.log('User:', data.user ? 'Found (' + data.user.email + ')' : 'None');
    console.log('Error:', error);
  });
} else {
  console.log('❌ Supabase client not found');
}

// Test 4: Check for infinite loops
console.log('\n4. Checking for infinite loops:');
console.log('Look for repeated messages in console above');
console.log('If you see the same message many times, there\'s a loop');

// Test 5: Manual save test
console.log('\n5. Manual Save Test:');
console.log('Click "Save Project" button and watch console for:');
console.log('- "💾 Save button clicked!"');
console.log('- "✅ Content saved to localStorage backup"');
console.log('- Either "Saved locally (not signed in)" or Supabase messages');
console.log('- Should NOT see "⏰ Save operation timed out"');

console.log('\n✅ Test complete!');
console.log('If you see infinite loops, refresh the page and try again.');
