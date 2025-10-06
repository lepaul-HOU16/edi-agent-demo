import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

async function testArtifactFlow() {
  console.log('🧪 Testing correct artifact flow...');
  
  try {
    const testChatSessionId = `test-session-${Date.now()}`;
    const testMessage = "Perform comprehensive shale analysis for well HUNTON-EAST-1";
    
    console.log('📤 Sending request via invokeLightweightAgent mutation...');
    console.log('Chat Session ID:', testChatSessionId);
    console.log('Message:', testMessage);
    
    const result = await client.mutations.invokeLightweightAgent({
      chatSessionId: testChatSessionId,
      message: testMessage,
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user'
    });

    console.log('\n📥 GraphQL Response Analysis:');
    console.log('Has data:', !!result.data);
    console.log('Has errors:', !!result.errors && result.errors.length > 0);
    
    if (result.errors && result.errors.length > 0) {
      console.log('❌ GraphQL Errors:', result.errors);
      return;
    }
    
    const response = result.data;
    console.log('Success:', response.success);
    console.log('Message length:', response.message?.length || 0);
    console.log('Message preview:', response.message?.substring(0, 100));
    
    // Critical artifact analysis
    console.log('\n🎯 ARTIFACT ANALYSIS:');
    console.log('Artifacts type:', typeof response.artifacts);
    console.log('Is array:', Array.isArray(response.artifacts));
    console.log('Artifacts count:', response.artifacts?.length || 0);
    
    if (response.artifacts && response.artifacts.length > 0) {
      console.log('\n✅ ARTIFACTS FOUND! Count:', response.artifacts.length);
      
      response.artifacts.forEach((artifact, index) => {
        console.log(`\nArtifact ${index + 1}:`);
        console.log('  Type:', typeof artifact);
        
        if (typeof artifact === 'string') {
          try {
            const parsed = JSON.parse(artifact);
            console.log('  Parsed keys:', Object.keys(parsed));
            console.log('  Message content type:', parsed.messageContentType);
          } catch (e) {
            console.log('  String content (first 100):', artifact.substring(0, 100));
          }
        } else if (typeof artifact === 'object' && artifact !== null) {
          console.log('  Object keys:', Object.keys(artifact));
          console.log('  Message content type:', artifact.messageContentType);
          console.log('  Analysis type:', artifact.analysisType);
        }
      });
      
      console.log('\n🎉 ARTIFACT FLOW SUCCESS! The Lambda handler is properly returning artifacts.');
      
    } else {
      console.log('\n❌ NO ARTIFACTS RETURNED');
      console.log('This confirms the artifacts are being lost somewhere in the chain.');
      console.log('Response structure:', {
        success: response.success,
        hasMessage: !!response.message,
        artifactsIsUndefined: response.artifacts === undefined,
        artifactsIsNull: response.artifacts === null,
        artifactsIsEmptyArray: Array.isArray(response.artifacts) && response.artifacts.length === 0
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

testArtifactFlow();
