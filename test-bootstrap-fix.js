#!/usr/bin/env node

// Test script to verify the bootstrap fix works
const https = require('https');
const { URL } = require('url');

const API_URL = 'https://ucbxezqhn5gjdcfak4ffsn65da.appsync-api.us-east-1.amazonaws.com/graphql';
const API_KEY = 'da2-ctlrmykumbcatcmqi3xykhohcy';

async function testGraphQLRequest(query, variables = {}) {
  const requestBody = JSON.stringify({
    query,
    variables
  });

  const url = new URL(API_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'x-api-key': API_KEY,
      'Authorization': 'Bearer mock-token-for-cmgabri@amazon.com'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

async function testBootstrapFix() {
  console.log('🧪 Testing Bootstrap Fix - Create Group + Add Member');
  
  const testGroupName = `test.bootstrap.fix.${Date.now()}@osdu.dataservices.energy`;
  const testUser = 'cmgabri@amazon.com';
  
  try {
    // Step 1: Create a group (this should now automatically add creator as OWNER)
    console.log(`\n1️⃣ Creating test group: ${testGroupName}`);
    const createGroupMutation = `
      mutation CreateGroup($input: CreateGroupInput!) {
        createGroup(input: $input) {
          name
          description
          dataPartition
          createdBy
          createdAt
        }
      }
    `;

    const createGroupResponse = await testGraphQLRequest(createGroupMutation, {
      input: {
        dataPartition: 'osdu',
        name: testGroupName,
        description: 'Test group for bootstrap fix verification'
      }
    });
    
    if (createGroupResponse.errors) {
      console.error('❌ CreateGroup failed:', createGroupResponse.errors);
      return false;
    }
    
    console.log('✅ Group created successfully:', createGroupResponse.data.createGroup);
    
    // Step 2: Try to add another member to the group (should work now since creator is OWNER)
    console.log(`\n2️⃣ Adding member to group: ${testGroupName}`);
    const addMemberMutation = `
      mutation AddMemberToGroup($input: AddMemberToGroupInput!) {
        addMemberToGroup(input: $input) {
          groupName
          memberEmail
          role
          dataPartition
          addedBy
          addedAt
        }
      }
    `;

    const addMemberResponse = await testGraphQLRequest(addMemberMutation, {
      input: {
        groupName: testGroupName,
        memberEmail: 'test.user@example.com',
        role: 'MEMBER',
        dataPartition: 'osdu'
      }
    });
    
    if (addMemberResponse.errors) {
      console.error('❌ AddMember failed:', addMemberResponse.errors);
      return false;
    }
    
    console.log('✅ Member added successfully:', addMemberResponse.data.addMemberToGroup);
    
    // Step 3: Verify group members
    console.log(`\n3️⃣ Verifying group members: ${testGroupName}`);
    const getMembersQuery = `
      query GetGroupMembers($dataPartition: String!, $groupName: String!) {
        getGroupMembers(dataPartition: $dataPartition, groupName: $groupName) {
          items {
            memberEmail
            role
            addedBy
            addedAt
          }
        }
      }
    `;

    const getMembersResponse = await testGraphQLRequest(getMembersQuery, {
      dataPartition: 'osdu',
      groupName: testGroupName
    });
    
    if (getMembersResponse.errors) {
      console.error('❌ GetMembers failed:', getMembersResponse.errors);
      return false;
    }
    
    console.log('✅ Group members:', getMembersResponse.data.getGroupMembers);
    
    // Verify that the creator is an OWNER
    const members = getMembersResponse.data.getGroupMembers.items;
    const creatorMember = members.find(m => m.memberEmail === testUser && m.role === 'OWNER');
    
    if (creatorMember) {
      console.log('🎉 SUCCESS: Creator is automatically an OWNER of the group!');
      return true;
    } else {
      console.error('❌ FAILURE: Creator is not an OWNER of the group');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testBootstrapFix()
  .then(success => {
    if (success) {
      console.log('\n🎉 Bootstrap fix test PASSED! The issue is resolved.');
    } else {
      console.log('\n❌ Bootstrap fix test FAILED. The issue persists.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });