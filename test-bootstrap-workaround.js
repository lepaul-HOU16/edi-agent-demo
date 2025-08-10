#!/usr/bin/env node

/**
 * Test the bootstrap workaround using working resolvers
 */

const config = {
  entitlementsApiUrl: 'https://ajdiqfmulzdndbqie7dm3tinz4.appsync-api.us-east-1.amazonaws.com/graphql',
  // Test JWT token - replace with a valid one
  testToken: 'eyJraWQiOiJcL3ByaXZhdGVcL3RtcFwvZGVwbG95bWVudC1hc3NldHNcL2I4ZjU4YzNmNzY4ZjQzNzI4ZjU4YzNmNzY4ZjQzNzI4XC9Db2duaXRvVXNlclBvb2xDbGllbnQuanNvbiIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI5ZjQzNzI4Zi01OGMzLTQ3NjgtOGY1OC1jM2Y3NjhmNDM3MjgiLCJhdWQiOiI3YmFzeGtnamtaZGF6YmxwZjdzbnY2Znc0IiwiY29nbml0bzp1c2VybmFtZSI6ImNtZ2FicmlAYW1hem9uLmNvbSIsImV2ZW50X2lkIjoiZjU4YzNmNzYtOGY0My03Mjg4LWY1OGMtM2Y3NjhmNDM3Mjg4IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzY3MjgwMDAsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX1pHVkJOUUhYViIsImNvZ25pdG86dXNlcm5hbWUiOiJjbWdhYnJpQGFtYXpvbi5jb20iLCJleHAiOjE3MzY4MTQ0MDAsImlhdCI6MTczNjcyODAwMCwiZW1haWwiOiJjbWdhYnJpQGFtYXpvbi5jb20ifQ.example-signature'
};

async function testBootstrapWorkaround() {
  console.log('🧪 Testing Bootstrap Workaround');
  console.log('================================');

  const testGroup = {
    name: 'service.test.admin@osdu.dataservices.energy',
    description: 'Test Admin Group for Bootstrap Workaround'
  };

  try {
    // Test 1: List existing groups to verify API connectivity
    console.log('\n1️⃣ Testing API connectivity with listGroups...');
    const listGroupsQuery = `
      query ListGroups($dataPartition: String!) {
        listGroups(dataPartition: $dataPartition) {
          totalCount
          items {
            name
            description
          }
        }
      }
    `;

    const listResponse = await fetch(config.entitlementsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.testToken}`,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: listGroupsQuery,
        variables: { dataPartition: 'osdu' }
      })
    });

    const listResult = await listResponse.json();
    if (listResult.errors) {
      console.error('❌ ListGroups failed:', listResult.errors);
      return;
    }
    console.log(`✅ API connectivity OK - Found ${listResult.data.listGroups.totalCount} groups`);

    // Test 2: Try to get the test group (should fail if it doesn't exist)
    console.log('\n2️⃣ Checking if test group exists...');
    const getGroupQuery = `
      query GetGroup($dataPartition: String!, $groupName: String!) {
        getGroup(dataPartition: $dataPartition, groupName: $groupName) {
          name
          description
          createdBy
        }
      }
    `;

    const getResponse = await fetch(config.entitlementsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.testToken}`,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: getGroupQuery,
        variables: { 
          dataPartition: 'osdu',
          groupName: testGroup.name
        }
      })
    });

    const getResult = await getResponse.json();
    let groupExists = false;
    if (getResult.errors) {
      console.log('✅ Test group does not exist (expected)');
    } else {
      console.log('ℹ️ Test group already exists');
      groupExists = true;
    }

    // Test 3: Create the group if it doesn't exist
    if (!groupExists) {
      console.log('\n3️⃣ Creating test group...');
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

      const createResponse = await fetch(config.entitlementsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.testToken}`,
          'data-partition-id': 'osdu'
        },
        body: JSON.stringify({
          query: createGroupMutation,
          variables: { 
            input: {
              name: testGroup.name,
              description: testGroup.description,
              dataPartition: 'osdu'
            }
          }
        })
      });

      const createResult = await createResponse.json();
      if (createResult.errors) {
        console.error('❌ CreateGroup failed:', createResult.errors);
        return;
      }
      console.log('✅ Test group created successfully:', createResult.data.createGroup.name);
    }

    // Test 4: Add member to group
    console.log('\n4️⃣ Adding admin user to test group...');
    const addMemberMutation = `
      mutation AddMemberToGroup($input: AddMemberInput!) {
        addMemberToGroup(input: $input) {
          success
          groupName
          memberEmail
          role
          message
        }
      }
    `;

    const addMemberResponse = await fetch(config.entitlementsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.testToken}`,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: addMemberMutation,
        variables: { 
          input: {
            groupName: testGroup.name,
            memberEmail: 'cmgabri@amazon.com',
            role: 'OWNER',
            dataPartition: 'osdu'
          }
        }
      })
    });

    const addMemberResult = await addMemberResponse.json();
    if (addMemberResult.errors) {
      console.error('❌ AddMemberToGroup failed:', addMemberResult.errors);
      return;
    }
    console.log('✅ Admin user added successfully:', addMemberResult.data.addMemberToGroup.message);

    // Test 5: Verify group members
    console.log('\n5️⃣ Verifying group membership...');
    const getMembersQuery = `
      query GetGroupMembers($dataPartition: String!, $groupName: String!) {
        getGroupMembers(dataPartition: $dataPartition, groupName: $groupName) {
          totalCount
          items {
            groupName
            memberEmail
            role
            addedBy
            addedAt
          }
        }
      }
    `;

    const getMembersResponse = await fetch(config.entitlementsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.testToken}`,
        'data-partition-id': 'osdu'
      },
      body: JSON.stringify({
        query: getMembersQuery,
        variables: { 
          dataPartition: 'osdu',
          groupName: testGroup.name
        }
      })
    });

    const getMembersResult = await getMembersResponse.json();
    if (getMembersResult.errors) {
      console.error('❌ GetGroupMembers failed:', getMembersResult.errors);
      return;
    }

    const members = getMembersResult.data.getGroupMembers.items;
    console.log(`✅ Group has ${members.length} members:`);
    members.forEach(member => {
      console.log(`   - ${member.memberEmail} (${member.role})`);
    });

    console.log('\n🎉 Bootstrap workaround test completed successfully!');
    console.log('✅ All working resolvers (createGroup, addMemberToGroup, getGroupMembers) function correctly');
    console.log('✅ The workaround approach should work for the bootstrap functionality');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBootstrapWorkaround();