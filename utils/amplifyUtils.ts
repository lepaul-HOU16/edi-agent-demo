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
  const amplifyClient = generateClient<Schema>();
  const { data: newMessageData, errors: newMessageErrors } = await amplifyClient.models.ChatMessage.create(props.newMessage)
  if (newMessageErrors) {
    console.error("Error creating new message:", newMessageErrors);
    throw new Error("Error creating new message");
  }

  if (!props.newMessage.content || !(props.newMessage.content as any).text) throw new Error("content.text is missing")
  const invokeResponse = await amplifyClient.queries.invokeReActAgent({
    chatSessionId: props.chatSessionId,
    // userInput: props.newMessage.content.text
  })

  console.log('invokeResponse: ', invokeResponse)

  return {
    newMessageData,
    invokeResponse
  }
}
