#!/usr/bin/env node

/**
 * Test deleteRenewableProject mutation directly
 * This bypasses the UI and calls the GraphQL API directly
 */

const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const outputs = require('../amplify_outputs.json');

Amplify.configure(outputs);

async function testDeleteMutation() {
  console.log('========================================');
  console.log('Testing deleteRenewableProject Mutation');
  console.log('========================================\n');

  try {
    const client = generateClient();
    
    // Test with a known project name
    const testProjectName = 'claude-texas-wind-farm-26';
    
    console.log(`Attempting to delete project: ${testProjectName}`);
    console.log('');
    
    const result = await client.graphql({
      query: `
        mutation DeleteProject($projectId: String!) {
          deleteRenewableProject(projectId: $projectId) {
            success
            message
            projectId
          }
        }
      `,
      variables: {
        projectId: testProjectName
      }
    });
    
    console.log('Mutation result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    if (result.data?.deleteRenewableProject?.success) {
      console.log('✅ Mutation returned success');
      console.log(`Message: ${result.data.deleteRenewableProject.message}`);
      
      // Now check if the file actually exists in S3
      console.log('');
      console.log('Checking S3...');
      const { execSync } = require('child_process');
      
      try {
        const s3Check = execSync(
          `aws s3 ls "s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/renewable/projects/${testProjectName}/project.json"`,
          { encoding: 'utf-8' }
        );
        
        if (s3Check.trim()) {
          console.log('❌ FILE STILL EXISTS IN S3!');
          console.log('The mutation returned success but the file was not deleted.');
          console.log('');
          console.log('This means:');
          console.log('1. The Lambda is not being invoked, OR');
          console.log('2. The Lambda is failing silently, OR');
          console.log('3. The deletion code has a bug');
        } else {
          console.log('✅ File deleted from S3');
        }
      } catch (error) {
        if (error.message.includes('NoSuchKey') || error.status === 1) {
          console.log('✅ File deleted from S3 (or never existed)');
        } else {
          console.log('⚠️  Could not check S3:', error.message);
        }
      }
      
    } else {
      console.log('❌ Mutation returned failure');
      console.log(`Message: ${result.data?.deleteRenewableProject?.message || 'No message'}`);
    }
    
  } catch (error) {
    console.error('❌ Error calling mutation:');
    console.error(error);
    
    if (error.errors) {
      console.error('');
      console.error('GraphQL Errors:');
      error.errors.forEach((err, i) => {
        console.error(`${i + 1}. ${err.message}`);
        if (err.path) console.error(`   Path: ${err.path.join('.')}`);
        if (err.extensions) console.error(`   Extensions:`, err.extensions);
      });
    }
  }
  
  console.log('');
}

testDeleteMutation().catch(console.error);
