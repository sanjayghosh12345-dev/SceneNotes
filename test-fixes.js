// Test script to verify the fixes
// Run this in the browser console after refreshing the page

console.log('🧪 Testing SceneNotes Fixes...');

// Test 1: Check if loadLatest is being called
console.log('\n1. Checking if loadLatest is called on page load...');
console.log('Look for "🔄 loadLatest called" in the console above');

// Test 2: Test localStorage save/load
console.log('\n2. Testing localStorage save/load...');
try {
  const testData = { 
    content: 'Test screenplay content', 
    projectName: 'Test Project', 
    timestamp: Date.now() 
  };
  localStorage.setItem('test_content', JSON.stringify(testData));
  console.log('✅ Test data saved to localStorage');
  
  const loaded = localStorage.getItem('test_content');
  if (loaded) {
    const parsed = JSON.parse(loaded);
    console.log('✅ Test data loaded from localStorage:', parsed);
  }
} catch (e) {
  console.error('❌ localStorage test failed:', e);
}

// Test 3: Check auth state
console.log('\n3. Checking authentication state...');
if (typeof window !== 'undefined' && window.supabase) {
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data.session ? 'Found' : 'None');
    console.log('User:', data.session?.user?.email || 'None');
    console.log('Error:', error);
  });
} else {
  console.log('❌ Supabase client not found');
}

// Test 4: Check for errors
console.log('\n4. Checking for errors...');
console.log('Look for any red error messages in the console above');
console.log('Common issues to check:');
console.log('- "Missing Supabase environment variables"');
console.log('- "Error getting session"');
console.log('- "Error fetching projects"');
console.log('- Network errors or CORS issues');

console.log('\n✅ Test complete! Check the results above.');
