import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import { Schema } from "../amplify/data/resource";
import { Message } from "./types";
import { STSClient } from "@aws-sdk/client-sts";

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
    if (!a.createdAt || !b.createdAt) throw new Error("createdAt is missing")
    return (a.createdAt as any).localeCompare(b.createdAt as any)
  });
})

export const sendMessage = async (props: {
  chatSessionId: string,
  newMessage: Schema['ChatMessage']['createType']
}) => {
  console.log('=== AMPLIFY UTILS DEBUG: sendMessage called ===');
  console.log('Props:', props);
  console.log('Chat session ID:', props.chatSessionId);
  console.log('Message content:', props.newMessage.content);
  
  const amplifyClient = generateClient<Schema>();
  
  console.log('Creating new message in database...');
  const { data: newMessageData, errors: newMessageErrors } = await amplifyClient.models.ChatMessage.create(props.newMessage)
  
  if (newMessageErrors) {
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
    userId: userId
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
      
      const aiMessage: Schema['ChatMessage']['createType'] = {
        role: 'ai' as any,
        content: {
          text: invokeResponse.data.message
        } as any,
        chatSessionId: props.chatSessionId as any,
        responseComplete: true as any
      };
      
      // Add artifacts if present with enhanced debugging
      if (invokeResponse.data.artifacts && invokeResponse.data.artifacts.length > 0) {
        console.log('✅ FRONTEND: Adding artifacts to AI message');
        (aiMessage as any).artifacts = invokeResponse.data.artifacts;
        console.log('🔍 FRONTEND: AI message with artifacts:', aiMessage);
        console.log('🔍 FRONTEND: AI message artifacts count:', (aiMessage as any).artifacts?.length || 0);
        
        // Test serialization before sending to database
        try {
          const testSerialization = JSON.stringify(aiMessage);
          const testDeserialization = JSON.parse(testSerialization);
          console.log('✅ FRONTEND: AI message serializes correctly');
          console.log('🎯 FRONTEND: Serialized artifacts count:', testDeserialization.artifacts?.length || 0);
          if (testDeserialization.artifacts && testDeserialization.artifacts.length > 0) {
            console.log('🎉 FRONTEND: Artifacts preserved in frontend serialization!');
          } else {
            console.log('💥 FRONTEND: ARTIFACTS LOST IN FRONTEND SERIALIZATION!');
          }
        } catch (frontendSerializationError) {
          console.error('❌ FRONTEND: Frontend serialization failed:', frontendSerializationError);
        }
      } else {
        console.log('⚠️ FRONTEND: No artifacts to add to AI message');
      }
      
      const { data: aiMessageData, errors: aiMessageErrors } = await amplifyClient.models.ChatMessage.create(aiMessage as any);
      
      if (aiMessageErrors) {
        console.error('Error creating AI message:', aiMessageErrors);
      } else {
        console.log('AI message created successfully:', aiMessageData?.id);
      }
    } else if (!invokeResponse.data.success) {
      // Agent failed - create enhanced user-friendly error message
      console.error('Agent failed:', invokeResponse.data.message);
      
      // Parse the error to provide better user guidance
      let userFriendlyMessage = 'I encountered an issue while processing your request. ';
      const originalError = invokeResponse.data.message || 'Unknown error';
      
      if (originalError.toLowerCase().includes('tool') && originalError.toLowerCase().includes('not found')) {
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
      
      const errorMessage: Schema['ChatMessage']['createType'] = {
        role: 'ai' as any,
        content: {
          text: userFriendlyMessage
        } as any,
        chatSessionId: props.chatSessionId as any,
        responseComplete: true as any
      };
      
      const { data: errorMessageData, errors: errorMessageErrors } = await amplifyClient.models.ChatMessage.create(errorMessage as any);
      
      if (errorMessageErrors) {
        console.error('Error creating error message:', errorMessageErrors);
      }
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
      await amplifyClient.models.ChatMessage.create(errorMessage as any);
    } catch (createErrorMessageError) {
      console.error('Failed to create error message for user:', createErrorMessageError);
    }
  }

  return {
    newMessageData,
    invokeResponse
  }
}
