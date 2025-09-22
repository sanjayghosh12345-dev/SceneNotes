// Test script for sign-out/sign-in cycle
// Run this in the browser console to test the complete flow

console.log('🧪 Testing Sign-Out/Sign-In Cycle...');

// Test 1: Check current state
console.log('\n1. Current State:');
console.log('Project ID:', window.projectId || 'Not set');
console.log('Project Name:', window.projectName || 'Not set');
console.log('Content length:', window.text?.length || 0);

// Test 2: Save some test content
console.log('\n2. Saving test content...');
if (typeof window !== 'undefined' && window.setText && window.setProjectName) {
  window.setText('INT. TEST SCENE - DAY\n\nThis is a test screenplay.\n\nCHARACTER\nTest dialogue here.\n');
  window.setProjectName('Test Project');
  console.log('✅ Test content set');
} else {
  console.log('❌ Cannot access setText/setProjectName functions');
}

// Test 3: Test save function
console.log('\n3. Testing save function...');
if (typeof window !== 'undefined' && window.saveNow) {
  window.saveNow();
  console.log('✅ Save function called');
} else {
  console.log('❌ Cannot access saveNow function');
}

// Test 4: Check localStorage
console.log('\n4. Checking localStorage...');
const snProject = localStorage.getItem('sn_project');
if (snProject) {
  const parsed = JSON.parse(snProject);
  console.log('✅ sn_project found:', parsed.name, 'Content length:', parsed.content?.length);
} else {
  console.log('❌ sn_project not found in localStorage');
}

// Test 5: Check Supabase session
console.log('\n5. Checking Supabase session...');
if (typeof window !== 'undefined' && window.supabase) {
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data.session ? 'Found' : 'None');
    console.log('User:', data.session?.user?.email || 'None');
    console.log('Error:', error);
  });
} else {
  console.log('❌ Supabase client not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Sign out using the "Sign out" button');
console.log('2. Sign in again with your email');
console.log('3. Check if your content is restored');
console.log('4. Look for these messages in console:');
console.log('   - "Loaded from Supabase: [project name]"');
console.log('   - "Migrated local data to Supabase"');
console.log('   - "Created new project in Supabase"');

console.log('\n✅ Test setup complete!');
