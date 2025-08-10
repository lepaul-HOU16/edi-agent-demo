#!/usr/bin/env node

/**
 * Test to verify if membership data actually exists
 * Run this in browser console to debug membership issues
 */

const testScript = `
// Test membership verification
(async function testMembership() {
  console.log('🔍 Testing membership data...');
  
  const userEmail = 'cmgabri@amazon.com';
  const testGroup = 'service.entitlements.admin@osdu.dataservices.energy';
  const dataPartition = 'osdu';
  
  try {
    // Test 1: Check if initializeAdminUser works
    console.log('1️⃣ Testing initializeAdminUser...');
    const initResult = await fetch('https://ajdiqfmulzdndbqie7dm3tinz4.appsync-api.us-east-1.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.oidcUser?.access_token,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: \`
          mutation InitializeAdminUser($dataPartition: String!) {
            initializeAdminUser(dataPartition: $dataPartition) {
              success
              groupsCreated
              adminUserAdded
              message
            }
          }
        \`,
        variables: { dataPartition }
      })
    });
    
    const initData = await initResult.json();
    console.log('✅ InitializeAdminUser result:', initData);
    
    // Test 2: Try getUserGroups with correct schema
    console.log('2️⃣ Testing getUserGroups...');
    const userGroupsResult = await fetch('https://ajdiqfmulzdndbqie7dm3tinz4.appsync-api.us-east-1.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.oidcUser?.access_token,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: \`
          query GetUserGroups($dataPartition: String!, $memberEmail: String!) {
            getUserGroups(dataPartition: $dataPartition, memberEmail: $memberEmail) {
              items {
                name
                description
                dataPartition
                createdBy
                createdAt
              }
              pagination {
                totalCount
              }
            }
          }
        \`,
        variables: { dataPartition, memberEmail: userEmail }
      })
    });
    
    const userGroupsData = await userGroupsResult.json();
    console.log('👥 User groups result:', userGroupsData);
    
    if (userGroupsData.data?.getUserGroups?.items?.length > 0) {
      console.log(\`✅ Found \${userGroupsData.data.getUserGroups.items.length} groups for user\`);
      userGroupsData.data.getUserGroups.items.forEach(group => {
        console.log(\`   - \${group.name}\`);
      });
    } else {
      console.log('❌ No groups found for user');
    }
    
    // Test 3: Try getGroupMembers for a specific group
    console.log('3️⃣ Testing getGroupMembers...');
    const membersResult = await fetch('https://ajdiqfmulzdndbqie7dm3tinz4.appsync-api.us-east-1.amazonaws.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + window.oidcUser?.access_token,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: \`
          query GetGroupMembers($dataPartition: String!, $groupName: String!) {
            getGroupMembers(dataPartition: $dataPartition, groupName: $groupName) {
              items {
                groupName
                memberEmail
                role
                addedBy
                addedAt
              }
              pagination {
                totalCount
              }
            }
          }
        \`,
        variables: { dataPartition, groupName: testGroup }
      })
    });
    
    const membersData = await membersResult.json();
    console.log(\`📋 Members for \${testGroup}:\`, membersData);
    
    if (membersData.data?.getGroupMembers?.items?.length > 0) {
      console.log(\`✅ Found \${membersData.data.getGroupMembers.items.length} members\`);
      membersData.data.getGroupMembers.items.forEach(member => {
        console.log(\`   - \${member.memberEmail} (\${member.role})\`);
      });
    } else {
      console.log('❌ No members found in group');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();
`;

console.log('🧪 Membership Verification Test');
console.log('===============================');
console.log('Copy and paste this script into your browser console:');
console.log('='.repeat(60));
console.log(testScript);
console.log('='.repeat(60));