#!/usr/bin/env node

/**
 * Test group membership to debug why members aren't showing up
 */

console.log('🧪 Testing Group Membership');
console.log('============================');

// This should be run in the browser console where osduApi is available
const testScript = `
// Test script to run in browser console
(async function testGroupMembership() {
  console.log('🔍 Testing group membership for created groups...');
  
  const testGroupName = 'service.entitlements.admin@osdu.dataservices.energy';
  const dataPartition = 'osdu';
  
  try {
    // Test 1: Check if group exists
    console.log('1️⃣ Checking if group exists...');
    const group = await osduApi.getGroup(testGroupName, dataPartition);
    console.log('✅ Group exists:', group);
    
    // Test 2: Try to get group members
    console.log('2️⃣ Getting group members...');
    const members = await osduApi.getGroupMembers(testGroupName, dataPartition);
    console.log('📋 Group members result:', members);
    
    if (members && members.items) {
      console.log(\`👥 Found \${members.items.length} members:\`);
      members.items.forEach(member => {
        console.log(\`   - \${member.memberEmail} (\${member.role})\`);
      });
    } else {
      console.log('❌ No members found or invalid response structure');
    }
    
    // Test 3: Try to list all groups to see what we have
    console.log('3️⃣ Listing all groups...');
    const allGroups = await osduApi.listGroups(dataPartition);
    console.log('📋 All groups:', allGroups);
    
    // Test 4: Try to get user groups for the current user
    console.log('4️⃣ Getting user groups for cmgabri@amazon.com...');
    const userGroups = await osduApi.getUserGroups('cmgabri@amazon.com', dataPartition);
    console.log('👤 User groups:', userGroups);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();
`;

console.log('Copy and paste this script into your browser console:');
console.log('='.repeat(60));
console.log(testScript);
console.log('='.repeat(60));