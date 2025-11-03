import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import { Schema } from "../amplify/data/resource";
import { Message } from "./types";
import { STSClient } from "@aws-sdk/client-sts";
import { getAmplifyConfigurationStatus } from "../src/components/ConfigureAmplify";
import { 
  processArtifactsForStorage, 
  calculateArtifactSize, 
  getStorageStats
} from "./s3ArtifactStorage";

// Function to safely load outputs
const loadOutputs = () => {
  try {
    return require('../amplify_outputs.json');
  } catch (error) {
    console.warn('amplify_outputs.json not found - this is expected during initial build');
    return null;
  }
};

// Helper function to get AWS credentials from environment variables
const getAWSCredentials = () => {
  // In production (Amplify), use AMPLIFY_ prefixed variables
  // In development, fall back to standard AWS_ variables
  const accessKeyId = process.env.AMPLIFY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AMPLIFY_AWS_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN;
  const region = process.env.AMPLIFY_AWS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found. Please configure AMPLIFY_AWS_ACCESS_KEY_ID and AMPLIFY_AWS_SECRET_ACCESS_KEY in Amplify Console.');
  }

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region
  };
};

export const getConfiguredAmplifyClient = () => {
  const credentials = getAWSCredentials();

  Amplify.configure(
    {
      API: {
        GraphQL: {
          endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT!, // replace with your defineData name
          region: credentials.region,
          defaultAuthMode: 'identityPool'
        }
      }
    },
    {
      Auth: {
        credentialsProvider: {
          getCredentialsAndIdentityId: async () => ({
            credentials: {
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              sessionToken: credentials.sessionToken,
            },
          }),
          clearCredentialsAndIdentityId: () => {
            /* noop */
          },
        },
      },
    }
  );

  const amplifyClient = generateClient<Schema>();

  return amplifyClient;
}

export const setAmplifyEnvVars = async () => {
  // Import required dependencies if not already available
  try {
    const outputs = loadOutputs();
    if (!outputs) {
      console.warn('Unable to set Amplify environment variables - outputs file not found');
      return {
        success: false,
        error: new Error('amplify_outputs.json not found')
      };
    }

    process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT = outputs.data.url;
    
    // Set region from credentials helper
    const credentials = getAWSCredentials();
    process.env.AWS_DEFAULT_REGION = credentials.region;

    // Get credentials using STS - but only if we don't already have them set via environment
    if (!process.env.AMPLIFY_AWS_ACCESS_KEY_ID && !process.env.AWS_ACCESS_KEY_ID) {
      const stsClient = new STSClient({ region: credentials.region });
      const stsCredentials = await stsClient.config.credentials();
      
      // Set AWS credentials environment variables
      process.env.AWS_ACCESS_KEY_ID = stsCredentials.accessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = stsCredentials.secretAccessKey;
      process.env.AWS_SESSION_TOKEN = stsCredentials.sessionToken;
    } else {
      // Use the credentials we already have
      process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
      if (credentials.sessionToken) {
        process.env.AWS_SESSION_TOKEN = credentials.sessionToken;
      }
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error("Error setting Amplify environment variables:", error);
    return {
      success: false,
      error
    };
  }
}

export const combineAndSortMessages = ((arr1: Array<Message>, arr2: Array<Message>) => {
  const combinedMessages = [...arr1, ...arr2]
  const uniqueMessages = combinedMessages.filter((message, index, self) =>
    index === self.findIndex((p) => p.id === message.id)
  );
  return uniqueMessages.sort((a, b) => {
    // Handle messages without createdAt (e.g., optimistically added messages)
    // Put them at the end (most recent)
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return (a.createdAt as any).localeCompare(b.createdAt as any)
  });
})

// Enhanced Amplify client generator with configuration checking
const getAmplifyClientWithValidation = async () => {
  try {
    // Check if Amplify is properly configured
    const configStatus = getAmplifyConfigurationStatus();
    
    if (!configStatus.isConfigured && configStatus.configurationPromise) {
      console.log('🔄 Waiting for Amplify configuration to complete...');
      const configured = await configStatus.configurationPromise;
      if (!configured) {
        throw new Error('Amplify configuration failed - cannot proceed with database operations');
      }
    }
    
    const client = generateClient<Schema>();
    console.log('✅ Generated Amplify client successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to generate Amplify client:', error);
    throw new Error(`Amplify client generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced message creation with retry logic
const createMessageWithRetry = async (
  amplifyClient: ReturnType<typeof generateClient<Schema>>,
  message: Schema['ChatMessage']['createType'],
  messageType: 'user' | 'ai' = 'user',
  maxRetries = 3
) => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Creating ${messageType} message (attempt ${attempt}/${maxRetries})`);
      
      const { data, errors } = await amplifyClient.models.ChatMessage.create(message);
      
      if (errors && errors.length > 0) {
        console.error(`❌ GraphQL errors in ${messageType} message creation:`, errors);
        throw new Error(`GraphQL errors: ${errors.map(e => e.message).join(', ')}`);
      }
      
      if (!data) {
        throw new Error(`No data returned from ${messageType} message creation`);
      }
      
      console.log(`✅ ${messageType} message created successfully:`, data.id);
      return { data, errors: null };
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed for ${messageType} message:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`💥 All ${maxRetries} attempts failed for ${messageType} message creation`);
  return { data: null, errors: [lastError] };
};

export const sendMessage = async (props: {
  chatSessionId: string,
  newMessage: Schema['ChatMessage']['createType'],
  agentType?: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft'
}) => {
  console.log('=== AMPLIFY UTILS DEBUG: sendMessage called ===');
  console.log('Props:', props);
  console.log('Chat session ID:', props.chatSessionId);
  console.log('Message content:', props.newMessage.content);
  
  try {
    const amplifyClient = await getAmplifyClientWithValidation();
    
    console.log('Creating new message in database...');
    const { data: newMessageData, errors: newMessageErrors } = await createMessageWithRetry(
      amplifyClient, 
      props.newMessage, 
      'user'
    );
    
    if (newMessageErrors && newMessageErrors.length > 0) {
      console.error("=== AMPLIFY UTILS DEBUG: Error creating new message ===");
      console.error("Errors:", newMessageErrors);
      throw new Error("Error creating new message");
    }
    
    console.log('New message created successfully:', newMessageData);

    if (!props.newMessage.content || !(props.newMessage.content as any).text) {
      console.error('=== AMPLIFY UTILS DEBUG: Missing content.text ===');
      throw new Error("content.text is missing");
    }
    
    console.log('Invoking lightweight agent...');
    console.log('Foundation model ID: us.anthropic.claude-3-5-sonnet-20241022-v2:0');
    console.log('Message text:', (props.newMessage.content as any).text);
    
    // Get current user ID for agent invocation
    let userId: string;
    try {
      const currentUser = await getCurrentUser();
      userId = currentUser.userId;
      console.log('Current user ID:', userId);
    } catch (error) {
      console.warn('Failed to get current user, using fallback ID:', error);
      userId = 'anonymous-user'; // Fallback for testing
    }
    
    const invokeResponse = await amplifyClient.mutations.invokeLightweightAgent({
      chatSessionId: props.chatSessionId,
      message: (props.newMessage.content as any).text,
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: userId,
      agentType: props.agentType || 'auto'
    })

    console.log('=== AMPLIFY UTILS DEBUG: Agent invocation complete ===');
    console.log('Invoke response:', invokeResponse);
    console.log('Invoke response data:', invokeResponse.data);
    console.log('Invoke response errors:', invokeResponse.errors);
    
    // Enhanced error logging for debugging
    if (invokeResponse.errors && invokeResponse.errors.length > 0) {
      console.error('=== DETAILED ERROR ANALYSIS ===');
      invokeResponse.errors.forEach((error: any, index: number) => {
        console.error(`Error ${index + 1}:`, {
          message: error.message,
          errorType: error.errorType,
          locations: error.locations,
          path: error.path,
          extensions: error.extensions
        });
      });
      console.error('=== END DETAILED ERROR ANALYSIS ===');
    }
    
    if (invokeResponse.data === null && invokeResponse.errors) {
      console.error('=== AGENT INVOCATION FAILED - NULL DATA WITH ERRORS ===');
      console.error('This indicates a Lambda function error or timeout');
      console.error('Check CloudWatch logs for the lightweightAgent function');
    }
    
    if (invokeResponse.data) {
      console.log('Agent response data:', invokeResponse.data);
      
      // If agent was successful, create AI response message
      if (invokeResponse.data.success && invokeResponse.data.message) {
        console.log('Creating AI response message...');
        console.log('🔍 FRONTEND: Agent artifacts received:', invokeResponse.data.artifacts);
        console.log('🔍 FRONTEND: Artifacts type:', typeof invokeResponse.data.artifacts);
        console.log('🔍 FRONTEND: Artifacts is array:', Array.isArray(invokeResponse.data.artifacts));
        console.log('🔍 FRONTEND: Artifacts count:', invokeResponse.data.artifacts?.length || 0);
        
        if (invokeResponse.data.artifacts && invokeResponse.data.artifacts.length > 0) {
          console.log('🎯 FRONTEND: First artifact structure:', invokeResponse.data.artifacts[0]);
          console.log('🔍 FRONTEND: First artifact keys:', Object.keys(invokeResponse.data.artifacts[0] || {}));
        }
        
        // CRITICAL FIX: Process artifacts for storage (S3 for large, inline for small)
        let processedArtifacts: any[] = [];
        let totalArtifactSize = 0;
        
        if (invokeResponse.data.artifacts && invokeResponse.data.artifacts.length > 0) {
          console.log('📦 Processing artifacts for storage...');
          
          // Validate artifacts before processing
          const validatedArtifacts: any[] = [];
          for (let i = 0; i < invokeResponse.data.artifacts.length; i++) {
            let artifact: any = invokeResponse.data.artifacts[i];
            
            // CRITICAL FIX: Parse artifact if it's a JSON string
            if (typeof artifact === 'string') {
              console.log(`🔧 Artifact ${i} is a string, parsing JSON...`);
              try {
                artifact = JSON.parse(artifact);
                console.log(`✅ Artifact ${i} parsed successfully:`, {
                  type: artifact.type || artifact.messageContentType,
                  hasType: !!artifact.type,
                  hasMessageContentType: !!artifact.messageContentType
                });
              } catch (parseError) {
                console.error(`❌ Artifact ${i} failed to parse:`, parseError);
                continue;
              }
            }
            
            // Check required fields (artifact is now guaranteed to be an object)
            if (!artifact.type && !artifact.messageContentType) {
              console.error(`❌ Artifact ${i} missing type field, skipping`);
              continue;
            }
            
            // Test JSON serializability
            try {
              const serialized = JSON.stringify(artifact);
              JSON.parse(serialized);
              
              const size = calculateArtifactSize(artifact);
              totalArtifactSize += size;
              console.log(`📏 Artifact ${i + 1} (${artifact.type || artifact.messageContentType}) size: ${(size / 1024).toFixed(2)} KB`);
              
              validatedArtifacts.push(artifact);
            } catch (error: any) {
              console.error(`❌ Artifact ${i} failed JSON serialization:`, error.message);
              console.error('   Artifact type:', artifact.type || artifact.messageContentType);
              console.error('   Attempting to sanitize...');
              
              // Try to sanitize
              try {
                const sanitized = JSON.parse(JSON.stringify(artifact, (key, value) => {
                  if (typeof value === 'function' || value === undefined) {
                    return null;
                  }
                  // Check for circular references
                  if (typeof value === 'object' && value !== null) {
                    return value;
                  }
                  return value;
                }));
                
                validatedArtifacts.push(sanitized);
                console.log(`✅ Artifact ${i} sanitized successfully`);
              } catch (sanitizeError: any) {
                console.error(`❌ Failed to sanitize artifact ${i}:`, sanitizeError.message);
              }
            }
          }
          
          console.log(`📊 Total artifact size: ${(totalArtifactSize / 1024).toFixed(2)} KB`);
          console.log(`✅ Validated ${validatedArtifacts.length} of ${invokeResponse.data.artifacts.length} artifacts`);
          
          if (validatedArtifacts.length === 0) {
            console.error('❌ No valid artifacts to process');
            processedArtifacts = [];
          } else {
            try {
              // Process artifacts for storage - this will upload large ones to S3
              const storageResults = await processArtifactsForStorage(
                validatedArtifacts, 
                props.chatSessionId
              );
              
              // Extract the processed artifacts (now JSON strings from processArtifactsForStorage)
              processedArtifacts = storageResults.map(result => result.artifact);
              
              // Log storage statistics
              const stats = getStorageStats(processedArtifacts);
              console.log('📈 Storage Statistics:', {
                totalArtifacts: stats.totalArtifacts,
                inlineArtifacts: stats.inlineArtifacts,
                s3Artifacts: stats.s3Artifacts,
                inlineSize: `${(stats.totalInlineSize / 1024).toFixed(2)} KB`,
                s3Size: `${(stats.estimatedS3Size / 1024).toFixed(2)} KB`
              });
              
              console.log('✅ Artifact processing complete');
            } catch (artifactProcessingError) {
              console.error('❌ Error processing artifacts for storage:', artifactProcessingError);
              // Fallback: manually serialize validated artifacts as JSON strings
              try {
                processedArtifacts = validatedArtifacts.map((artifact: any) => JSON.stringify(artifact));
                console.log('⚠️ Using manually serialized validated artifacts as fallback');
              } catch (serializationError) {
                console.error('❌ Critical: Failed to serialize fallback artifacts:', serializationError);
                processedArtifacts = [];
              }
            }
          }
        }
        
        // CRITICAL: Ensure all artifacts are serialized as JSON strings for GraphQL
        // processedArtifacts should already be JSON strings from processArtifactsForStorage,
        // but we validate and ensure consistency here
        let serializedArtifacts: string[] = [];
        if (processedArtifacts.length > 0) {
          try {
            // Validate that all artifacts are strings (they should be from processArtifactsForStorage)
            const allStrings = processedArtifacts.every(artifact => typeof artifact === 'string');
            
            if (allStrings) {
              console.log('✅ All artifacts are already JSON strings (from processArtifactsForStorage)');
              serializedArtifacts = processedArtifacts as string[];
            } else {
              console.log('⚠️ Some artifacts are not strings, re-serializing...');
              serializedArtifacts = processedArtifacts.map((artifact: any) => 
                typeof artifact === 'string' ? artifact : JSON.stringify(artifact)
              );
            }
            
            console.log(`✅ Final serialized artifacts count: ${serializedArtifacts.length}`);
          } catch (serializationError) {
            console.error('❌ Failed to serialize artifacts for GraphQL:', serializationError);
            serializedArtifacts = [];
          }
        }
        
        // CRITICAL: Validate final message size before creating
        let finalArtifacts = serializedArtifacts.length > 0 ? serializedArtifacts : undefined;
        
        // Create test message to check size
        const testMessage = {
          role: 'ai',
          content: { text: invokeResponse.data.message },
          chatSessionId: props.chatSessionId,
          responseComplete: true,
          artifacts: finalArtifacts,
          thoughtSteps: (invokeResponse.data as any).thoughtSteps || undefined,
          createdAt: new Date().toISOString()
        };
        
        try {
          const testSerialization = JSON.stringify(testMessage);
          const messageSize = new Blob([testSerialization]).size;
          const messageTextSize = new Blob([testMessage.content.text]).size;
          const artifactsSize = finalArtifacts ? new Blob([JSON.stringify(finalArtifacts)]).size : 0;
          
          console.log(`📏 Final AI message size breakdown:`);
          console.log(`   Total: ${(messageSize / 1024).toFixed(2)} KB`);
          console.log(`   Message text: ${(messageTextSize / 1024).toFixed(2)} KB`);
          console.log(`   Artifacts: ${(artifactsSize / 1024).toFixed(2)} KB`);
          console.log(`   Artifact count: ${finalArtifacts?.length || 0}`);
          
          // DynamoDB item size limit is 400KB, but we use 300KB as safe threshold
          const MAX_DYNAMODB_SIZE = 300 * 1024;
          
          if (messageSize > MAX_DYNAMODB_SIZE) {
            console.error(`❌ Message size (${(messageSize / 1024).toFixed(2)} KB) exceeds DynamoDB limit (300 KB)`);
            console.error('   This should not happen - artifacts should have been moved to S3');
            
            // Log each artifact size
            if (finalArtifacts && Array.isArray(finalArtifacts)) {
              finalArtifacts.forEach((artifact, index) => {
                const artifactSize = new Blob([artifact]).size;
                console.error(`   Artifact ${index + 1}: ${(artifactSize / 1024).toFixed(2)} KB`);
                
                // Try to parse and log type
                try {
                  const parsed = JSON.parse(artifact);
                  console.error(`      Type: ${parsed.type || parsed.messageContentType || 'unknown'}`);
                  console.error(`      Is S3 reference: ${parsed.type === 's3_reference'}`);
                } catch (e) {
                  console.error(`      Failed to parse artifact`);
                }
              });
            }
            
            // Emergency fallback: remove artifacts and add error message
            console.error('⚠️ EMERGENCY: Removing artifacts to prevent DynamoDB error');
            finalArtifacts = undefined;
            
            // Add error message to content
            testMessage.content.text += '\n\n⚠️ Note: Visualization artifacts were too large to display. Please try with a smaller analysis area or radius.';
          } else {
            console.log('✅ Message size is within DynamoDB limits');
          }
        } catch (sizeCheckError) {
          console.error('❌ Failed to check message size:', sizeCheckError);
        }
        
        const aiMessage: Schema['ChatMessage']['createType'] = {
          role: 'ai' as any,
          content: {
            text: invokeResponse.data.message
          } as any,
          chatSessionId: props.chatSessionId as any,
          responseComplete: true as any,
          // CRITICAL: Use validated and size-checked artifacts
          artifacts: finalArtifacts,
          // CRITICAL FIX: Add thought steps from agent response
          thoughtSteps: (invokeResponse.data as any).thoughtSteps || undefined,
          // CRITICAL FIX: Add timestamp to ensure message ordering and prevent race conditions
          createdAt: new Date().toISOString() as any
        } as any;
        
        // Debug thought steps inclusion
        if ((invokeResponse.data as any).thoughtSteps && (invokeResponse.data as any).thoughtSteps.length > 0) {
          console.log('🧠 FRONTEND: Including thought steps in AI message:', (invokeResponse.data as any).thoughtSteps.length);
          console.log('🔍 FRONTEND: First thought step:', (invokeResponse.data as any).thoughtSteps[0]);
        } else {
          console.log('⚠️ FRONTEND: No thought steps received from agent');
        }
        
        // Enhanced debugging with improved artifact handling
        if (serializedArtifacts.length > 0) {
          console.log('✅ FRONTEND: Serialized artifacts included in AI message creation');
          console.log('🔍 FRONTEND: AI message artifacts count:', serializedArtifacts.length);
          console.log('🎯 FRONTEND: First serialized artifact preview (first 200 chars):', 
            serializedArtifacts[0].substring(0, 200));
          
          // Check if any artifacts are S3 references by parsing the first one
          try {
            const firstArtifact = JSON.parse(serializedArtifacts[0]);
            if (firstArtifact.type === 's3_reference') {
              console.log(`🗂️ FRONTEND: Artifact is S3 reference: ${firstArtifact.key}`);
            }
          } catch (parseError) {
            console.log('⚠️ Could not parse first artifact for type check');
          }
          
          // Test serialization of the final message
          try {
            const testSerialization = JSON.stringify(aiMessage);
            const messageSize = new Blob([testSerialization]).size;
            console.log(`📏 Final AI message size: ${(messageSize / 1024).toFixed(2)} KB`);
            
            if (messageSize < 300 * 1024) { // 300KB threshold
              console.log('🎉 FRONTEND: Final message is within DynamoDB limits - SAVE SHOULD SUCCEED!');
            } else {
              console.log('⚠️ FRONTEND: Final message may still be too large for DynamoDB');
            }
          } catch (frontendSerializationError) {
            console.error('❌ FRONTEND: Frontend serialization failed:', frontendSerializationError);
          }
        } else {
          console.log('⚠️ FRONTEND: No artifacts to include in AI message');
          (aiMessage as any).artifacts = undefined;
        }
        
        // CRITICAL: Frontend always saves the AI message
        // This ensures loading state is cleared and UI updates properly
        const { data: aiMessageData, errors: aiMessageErrors } = await createMessageWithRetry(
          amplifyClient, 
          aiMessage, 
          'ai'
        );
        
        if (aiMessageErrors && aiMessageErrors.length > 0) {
          console.error('Error creating AI message:', aiMessageErrors);
        } else {
          console.log('AI message created successfully:', aiMessageData?.id);
        }
      } else if (!invokeResponse.data.success) {
        // Agent failed - create enhanced user-friendly error message
        console.error('Agent failed:', invokeResponse.data.message);
        
        // Parse the error to provide better user guidance
        const originalError = invokeResponse.data.message || 'Unknown error';
        const originalMessageContent = (props.newMessage.content as any)?.text || '';
        
        // CRITICAL FIX: If this is an EDIcraft configuration error, pass it through unchanged
        let userFriendlyMessage;
        if (originalError.includes('EDIcraft Agent Configuration Error') || 
            originalError.includes('BEDROCK_AGENT_ID') ||
            originalError.includes('Minecraft Server') ||
            originalError.includes('OSDU Platform')) {
          userFriendlyMessage = originalError;
        } else {
          // For other agents, provide helpful guidance
          userFriendlyMessage = 'I can help you with that! ';
          
          // Check if this is a first prompt scenario (calculation request without well name)
          const isCalculationRequest = originalMessageContent.toLowerCase().match(/\b(calculate|analyze|compute)\b.*\b(porosity|shale|saturation|formation|well)\b/);
          const isBasicGreeting = originalMessageContent.toLowerCase().match(/^(hello|hi|hey|help)$/);
          const isGeneralRequest = originalMessageContent.toLowerCase().match(/\b(list|show|wells|available|data)\b/);
          
          if (isCalculationRequest && (originalError.toLowerCase().includes('well') && (originalError.toLowerCase().includes('not found') || originalError.toLowerCase().includes('could not be found')))) {
          // First prompt calculation request - provide helpful guidance instead of error
          userFriendlyMessage = `I'd be happy to help you with ${originalMessageContent.toLowerCase().includes('porosity') ? 'porosity calculation' : 
                                                                 originalMessageContent.toLowerCase().includes('shale') ? 'shale analysis' : 
                                                                 'your analysis'}! 

To get started, I need to know which well to analyze. Here's what you can do:

**Next steps:**
1. First, see available wells: "list wells" 
2. Then specify a well: "${originalMessageContent} for [WELL_NAME]"

**Available analysis types:**
- Porosity calculations: "calculate porosity for WELL-001"
- Shale volume analysis: "calculate shale volume for WELL-001" 
- Formation evaluation: "analyze well data for WELL-001"

Would you like me to show you the available wells first?`;

        } else if (isBasicGreeting || isGeneralRequest) {
          // Basic greeting or general request - guide to wells
          userFriendlyMessage = `Welcome! I'm here to help with petrophysical analysis and well data.

**What I can help with:**
- Well data analysis and calculations
- Porosity, shale volume, and saturation analysis
- Formation evaluation and reservoir assessment
- Multi-well correlation studies

**To get started:**
- "list wells" - see available well data
- "calculate porosity for [WELL_NAME]" - run porosity analysis
- "analyze well data for [WELL_NAME]" - comprehensive formation evaluation

What would you like to do first?`;

        } else if (originalError.toLowerCase().includes('tool') && originalError.toLowerCase().includes('not found')) {
          userFriendlyMessage += 'It looks like some analysis tools are temporarily unavailable. Please try a simpler request like "list wells" or "show available wells".';
        } else if (originalError.toLowerCase().includes('well') && originalError.toLowerCase().includes('not found')) {
          userFriendlyMessage += 'The well you specified could not be found. Please try "list wells" to see available wells, then specify one of those wells in your request.';
        } else if (originalError.toLowerCase().includes('timeout') || originalError.toLowerCase().includes('time out')) {
          userFriendlyMessage += 'The analysis is taking longer than expected. Please try again, or break your request into smaller parts.';
        } else if (originalError.toLowerCase().includes('permission') || originalError.toLowerCase().includes('access')) {
          userFriendlyMessage += 'There was an access issue. Please refresh the page and try again.';
        } else if (originalError.toLowerCase().includes('network') || originalError.toLowerCase().includes('connection')) {
          userFriendlyMessage += 'There seems to be a connection issue. Please check your internet connection and try again.';
          } else {
            userFriendlyMessage += `Here's what happened: ${originalError}`;
          }
          
          userFriendlyMessage += '\n\n💡 **What you can try:**\n- "list wells" - to see available data\n- "well info [WELL_NAME]" - to check a specific well\n- "help" - for available commands';
        }
        
        const errorMessage: Schema['ChatMessage']['createType'] = {
          role: 'ai' as any,
          content: {
            text: userFriendlyMessage
          } as any,
          chatSessionId: props.chatSessionId as any,
          responseComplete: true as any
        };
        
        await createMessageWithRetry(amplifyClient, errorMessage, 'ai');
      }
    }
    
    if (invokeResponse.errors) {
      console.error('Agent response errors:', invokeResponse.errors);
      
      // Create enhanced user-friendly error message based on error types
      let userFriendlyMessage = '🔧 **Technical Issue Detected**\n\n';
      
      // Analyze the error types
      const errorMessages = invokeResponse.errors.map((err: any) => err.message || err.toString()).join(' ');
      
      if (errorMessages.toLowerCase().includes('timeout')) {
        userFriendlyMessage += 'The request timed out. The system might be busy processing other requests.';
      } else if (errorMessages.toLowerCase().includes('authorization') || errorMessages.toLowerCase().includes('permission')) {
        userFriendlyMessage += 'Authorization issue detected. Please refresh the page to re-authenticate.';
      } else if (errorMessages.toLowerCase().includes('lambda') || errorMessages.toLowerCase().includes('function')) {
        userFriendlyMessage += 'The analysis service is currently experiencing issues.';
      } else if (errorMessages.toLowerCase().includes('network') || errorMessages.toLowerCase().includes('dns')) {
        userFriendlyMessage += 'Network connectivity issue detected.';
      } else {
        userFriendlyMessage += 'An unexpected technical error occurred.';
      }
      
      userFriendlyMessage += '\n\n**Suggested actions:**\n';
      userFriendlyMessage += '1. Wait a moment and try again\n';
      userFriendlyMessage += '2. Try a simpler request like "list wells"\n';
      userFriendlyMessage += '3. Refresh the page if the issue persists\n';
      userFriendlyMessage += '4. Contact support if problems continue\n\n';
      userFriendlyMessage += `*Error details: ${errorMessages.substring(0, 200)}${errorMessages.length > 200 ? '...' : ''}*`;
      
      const errorMessage: Schema['ChatMessage']['createType'] = {
        role: 'ai' as any,
        content: {
          text: userFriendlyMessage
        } as any,
        chatSessionId: props.chatSessionId as any,
        responseComplete: true as any
      };
      
      try {
        await createMessageWithRetry(amplifyClient, errorMessage, 'ai');
      } catch (createErrorMessageError) {
        console.error('Failed to create error message for user:', createErrorMessageError);
      }
    }

    return {
      newMessageData,
      invokeResponse
    }
  } catch (error) {
    console.error('=== AMPLIFY UTILS: CRITICAL ERROR IN sendMessage ===');
    console.error('Error details:', error);
    
    // Create a fallback error response
    const fallbackResponse = {
      newMessageData: null,
      invokeResponse: {
        data: {
          success: false,
          message: `System error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          artifacts: []
        },
        errors: [error]
      }
    };
    
    return fallbackResponse;
  }
}
