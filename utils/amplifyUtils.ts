import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
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
  
  const invokeResponse = await amplifyClient.mutations.invokeLightweightAgent({
    chatSessionId: props.chatSessionId,
    message: (props.newMessage.content as any).text,
    foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
  })

  console.log('=== AMPLIFY UTILS DEBUG: Agent invocation complete ===');
  console.log('Invoke response:', invokeResponse);
  
  if (invokeResponse.data) {
    console.log('Agent response data:', invokeResponse.data);
    
    // If agent was successful, create AI response message
    if (invokeResponse.data.success && invokeResponse.data.message) {
      console.log('Creating AI response message...');
      console.log('Agent artifacts:', invokeResponse.data.artifacts);
      
      const aiMessage: Schema['ChatMessage']['createType'] = {
        role: 'ai' as any,
        content: {
          text: invokeResponse.data.message
        } as any,
        chatSessionId: props.chatSessionId as any,
        responseComplete: true as any,
        // Add artifacts if present
        ...(invokeResponse.data.artifacts && { artifacts: invokeResponse.data.artifacts })
      };
      
      const { data: aiMessageData, errors: aiMessageErrors } = await amplifyClient.models.ChatMessage.create(aiMessage as any);
      
      if (aiMessageErrors) {
        console.error('Error creating AI message:', aiMessageErrors);
      } else {
        console.log('AI message created successfully:', aiMessageData?.id);
      }
    }
  }
  if (invokeResponse.errors) {
    console.error('Agent response errors:', invokeResponse.errors);
  }

  return {
    newMessageData,
    invokeResponse
  }
}
