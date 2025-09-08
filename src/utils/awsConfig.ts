import { S3Client } from '@aws-sdk/client-s3';

// Function to safely load outputs
const loadOutputs = () => {
  try {
    return require('@/../amplify_outputs.json');
  } catch (error) {
    console.warn('amplify_outputs.json not found - this is expected during initial build');
    return null;
  }
};

// Get AWS configuration based on environment
export const getAWSConfig = () => {
  const outputs = loadOutputs();
  if (!outputs || !outputs.storage) {
    throw new Error('S3 configuration not found in amplify_outputs.json');
  }

  const region = outputs.storage.aws_region;
  const bucketName = outputs.storage.bucket_name;

  // Base configuration
  const config: any = {
    region,
    forcePathStyle: false,
  };

  // In development, use environment variables if available
  if (process.env.NODE_ENV === 'development') {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      };
    }
  }
  // In production, rely on IAM roles (Amplify app execution role)
  // The AWS SDK will automatically use the instance profile credentials

  return { config, bucketName, region };
};

// Create S3 client with proper configuration
export const createS3Client = (): { client: S3Client; bucketName: string; region: string } => {
  const { config, bucketName, region } = getAWSConfig();
  const client = new S3Client(config);
  return { client, bucketName, region };
};

// Environment check utility
export const getEnvironmentInfo = () => {
  return {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    AWS_REGION: process.env.AWS_REGION || 'not set',
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  };
};