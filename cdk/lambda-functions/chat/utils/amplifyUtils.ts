/**
 * Simplified amplifyUtils for CDK Lambda
 * 
 * This file provides stub implementations for utilities that were
 * originally designed for Amplify but are not needed in the CDK Lambda environment.
 * 
 * The actual functionality is handled directly by the Lambda using AWS SDK.
 */

// Export empty functions to satisfy imports
export const getConfiguredAmplifyClient = () => {
  throw new Error('Amplify client not available in CDK Lambda environment');
};

export const getAWSCredentials = () => {
  // In Lambda, credentials are automatically provided by the execution role
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.AWS_REGION || 'us-east-1'
  };
};

// Re-export s3ArtifactStorage functions if they exist
export { 
  processArtifactsForStorage, 
  calculateArtifactSize, 
  getStorageStats
} from './s3ArtifactStorage';
