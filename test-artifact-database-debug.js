const { getConfiguredAmplifyClient } = require('./utils/amplifyUtils');

// Set up environment variables
async function setupEnvironment() {
  const { setAmplifyEnvVars } = require('./utils/amplifyUtils');
  const result = await setAmplifyEnvVars();
  
  if (!result.success) {
    console.error('Failed to set up Amplify environment variables:', result.error?.message);
    process.exit(1);
  }
  
  return result;
}

// Test artifact database storage and retrieval
async function testArtifactDatabasePipeline() {
    console.log('🔍 ARTIFACT DATABASE DEBUG: Starting comprehensive database artifact test');
    
    try {
        // Set up environment first
        console.log('\n0. Setting up environment...');
        await setupEnvironment();
        console.log('✅ Environment configured');
        
        const client = getConfiguredAmplifyClient();
        
        // Test chat session ID (use existing one)
        const testChatSessionId = 'test-artifact-debug-session';
        
        console.log('📋 STEP 1: Create test chat session');
        try {
            await client.models.ChatSession.create({
                id: testChatSessionId,
                name: 'Artifact Database Debug Session'
            });
            console.log('✅ Test chat session created');
        } catch (e) {
            console.log('ℹ️ Test chat session already exists, proceeding...');
        }

        console.log('📋 STEP 2: Create AI message with artifacts');
        
        // Create test artifacts similar to what Lambda generates
        const testArtifacts = [
            {
                messageContentType: 'comprehensive_well_data_discovery',
                title: 'Well Data Discovery Test',
                summary: 'Test artifact for database debugging',
                wellCount: 24,
                totalDepth: 1000,
                logCurveTypes: ['GR', 'RHOB', 'NPHI', 'DTC'],
                wellsData: [
                    {
                        wellName: 'WELL-001',
                        depth: { min: 100, max: 500 },
                        curves: ['GR', 'RHOB', 'NPHI']
                    }
                ]
            }
        ];
        
        console.log('🎯 Test artifacts to save:', JSON.stringify(testArtifacts, null, 2));
        
        const testMessage = {
            role: 'ai',
            content: {
                text: 'Test message with artifacts for database debugging'
            },
            chatSessionId: testChatSessionId,
            responseComplete: true,
            artifacts: testArtifacts
        };
        
        console.log('💾 Creating message with artifacts...');
        const { data: savedMessage, errors: saveErrors } = await client.models.ChatMessage.create(testMessage);
        
        if (saveErrors) {
            console.error('❌ SAVE ERRORS:', saveErrors);
            return;
        }
        
        console.log('✅ Message saved successfully');
        console.log('🔍 Saved message ID:', savedMessage.id);
        console.log('🔍 Saved message artifacts field:', savedMessage.artifacts);
        console.log('🔍 Artifacts type:', typeof savedMessage.artifacts);
        console.log('🔍 Artifacts is array:', Array.isArray(savedMessage.artifacts));
        console.log('🔍 Artifacts length:', savedMessage.artifacts?.length || 0);
        
        if (savedMessage.artifacts && savedMessage.artifacts.length > 0) {
            console.log('🎉 ARTIFACTS SAVED TO DATABASE!');
            console.log('🔍 First artifact:', savedMessage.artifacts[0]);
            console.log('🔍 First artifact type:', typeof savedMessage.artifacts[0]);
        } else {
            console.log('💥 ARTIFACTS LOST DURING DATABASE SAVE!');
        }

        console.log('📋 STEP 3: Retrieve message from database');
        
        // Test individual message retrieval
        const { data: retrievedMessage, errors: getErrors } = await client.models.ChatMessage.get({
            id: savedMessage.id
        });
        
        if (getErrors) {
            console.error('❌ GET ERRORS:', getErrors);
            return;
        }
        
        console.log('✅ Message retrieved successfully');
        console.log('🔍 Retrieved message artifacts field:', retrievedMessage.artifacts);
        console.log('🔍 Retrieved artifacts type:', typeof retrievedMessage.artifacts);
        console.log('🔍 Retrieved artifacts is array:', Array.isArray(retrievedMessage.artifacts));
        console.log('🔍 Retrieved artifacts length:', retrievedMessage.artifacts?.length || 0);
        
        if (retrievedMessage.artifacts && retrievedMessage.artifacts.length > 0) {
            console.log('🎉 ARTIFACTS RETRIEVED FROM DATABASE!');
            console.log('🔍 Retrieved first artifact:', retrievedMessage.artifacts[0]);
            console.log('🔍 Retrieved first artifact type:', typeof retrievedMessage.artifacts[0]);
            
            // Test artifact content
            const artifact = retrievedMessage.artifacts[0];
            if (typeof artifact === 'string') {
                try {
                    const parsed = JSON.parse(artifact);
                    console.log('🔍 Artifact stored as JSON string, parsed:', parsed);
                } catch (e) {
                    console.log('❌ Artifact is string but not valid JSON');
                }
            } else if (artifact && typeof artifact === 'object') {
                console.log('🔍 Artifact stored as object:', artifact);
            }
        } else {
            console.log('💥 ARTIFACTS LOST DURING DATABASE RETRIEVAL!');
        }

        console.log('📋 STEP 4: Query messages by chat session (like ChatBox does)');
        
        // Test observeQuery-like retrieval
        const { data: sessionMessages, errors: listErrors } = await client.models.ChatMessage.list({
            filter: {
                chatSessionId: { eq: testChatSessionId }
            }
        });
        
        if (listErrors) {
            console.error('❌ LIST ERRORS:', listErrors);
            return;
        }
        
        console.log('✅ Session messages retrieved successfully');
        console.log('🔍 Total messages found:', sessionMessages.length);
        
        const messageWithArtifacts = sessionMessages.find(msg => msg.artifacts && msg.artifacts.length > 0);
        
        if (messageWithArtifacts) {
            console.log('🎉 FOUND MESSAGE WITH ARTIFACTS IN SESSION QUERY!');
            console.log('🔍 Session query artifacts:', messageWithArtifacts.artifacts);
            console.log('🔍 Session query artifacts length:', messageWithArtifacts.artifacts.length);
        } else {
            console.log('💥 NO ARTIFACTS FOUND IN SESSION QUERY!');
            console.log('🔍 Checking all messages for artifacts field...');
            sessionMessages.forEach((msg, index) => {
                console.log(`Message ${index + 1}:`, {
                    id: msg.id,
                    role: msg.role,
                    hasArtifacts: !!msg.artifacts,
                    artifactsLength: msg.artifacts?.length || 0,
                    artifactsType: typeof msg.artifacts
                });
            });
        }

        console.log('📋 STEP 5: Test JSON serialization/deserialization');
        
        // Test if the issue is in serialization
        const testSerialize = JSON.stringify(testArtifacts);
        const testDeserialize = JSON.parse(testSerialize);
        
        console.log('✅ Test serialization successful');
        console.log('🔍 Serialized length:', testSerialize.length);
        console.log('🔍 Deserialized matches original:', JSON.stringify(testDeserialize) === JSON.stringify(testArtifacts));

        console.log('📋 STEP 6: Summary');
        console.log('🎯 DATABASE ARTIFACT PIPELINE TEST RESULTS:');
        console.log(`✅ Message creation: ${savedMessage ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Artifacts in saved message: ${savedMessage?.artifacts?.length > 0 ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Message retrieval: ${retrievedMessage ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Artifacts in retrieved message: ${retrievedMessage?.artifacts?.length > 0 ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Session query: ${sessionMessages?.length > 0 ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Artifacts in session query: ${messageWithArtifacts ? 'SUCCESS' : 'FAILED'}`);

        // Clean up
        console.log('🧹 Cleaning up test data...');
        try {
            await client.models.ChatMessage.delete({ id: savedMessage.id });
            await client.models.ChatSession.delete({ id: testChatSessionId });
            console.log('✅ Test data cleaned up');
        } catch (e) {
            console.log('⚠️ Cleanup failed, but test completed');
        }

    } catch (error) {
        console.error('❌ ARTIFACT DATABASE DEBUG ERROR:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack?.substring(0, 500)
        });
    }
}

// Run the test
testArtifactDatabasePipeline();
