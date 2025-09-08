import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Function to safely load outputs
const loadOutputs = () => {
  try {
    return require('@/../amplify_outputs.json');
  } catch (error) {
    console.warn('amplify_outputs.json not found - this is expected during initial build');
    return null;
  }
};

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('[S3 Health Check] Starting S3 connectivity check...');

    // Load configuration
    const outputs = loadOutputs();
    if (!outputs || !outputs.storage) {
      return NextResponse.json({
        status: 'error',
        error: 'Configuration missing',
        details: 'amplify_outputs.json is missing or does not contain storage configuration',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const bucketName = outputs.storage.bucket_name;
    const region = outputs.storage.aws_region;

    if (!bucketName) {
      return NextResponse.json({
        status: 'error',
        error: 'Bucket configuration missing',
        details: 'Bucket name not found in storage configuration',
        config: outputs.storage,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Check environment variables
    const envCheck = {
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_SESSION_TOKEN: !!process.env.AWS_SESSION_TOKEN,
      AWS_REGION: process.env.AWS_REGION || 'not set',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    };

    // Initialize S3 client
    let s3Client: S3Client;
    try {
      s3Client = new S3Client({ region });
      console.log(`[S3 Health Check] S3 client initialized for region: ${region}`);
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        error: 'S3 client initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        config: { bucketName, region },
        environment: envCheck,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test S3 connectivity by listing objects (limit to 1 to minimize cost)
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1
      });

      const listResponse = await s3Client.send(listCommand);
      const duration = Date.now() - startTime;

      console.log(`[S3 Health Check] Successfully connected to S3 bucket in ${duration}ms`);

      return NextResponse.json({
        status: 'healthy',
        message: 'S3 connectivity verified',
        details: {
          bucketName,
          region,
          objectCount: listResponse.KeyCount || 0,
          isTruncated: listResponse.IsTruncated || false,
          responseTime: `${duration}ms`
        },
        environment: envCheck,
        timestamp: new Date().toISOString()
      });

    } catch (s3Error) {
      const duration = Date.now() - startTime;
      
      console.error(`[S3 Health Check] S3 operation failed after ${duration}ms:`, s3Error);
      
      let errorType = 'unknown';
      let troubleshooting: string[] = [];
      
      if (s3Error instanceof Error) {
        if (s3Error.name === 'AccessDenied') {
          errorType = 'access_denied';
          troubleshooting = [
            'Check IAM permissions for the current AWS credentials',
            'Verify S3 bucket policy allows list operations',
            'Ensure the bucket exists and is accessible'
          ];
        } else if (s3Error.name === 'CredentialsError' || s3Error.message.includes('credentials')) {
          errorType = 'credentials_error';
          troubleshooting = [
            'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables',
            'Check if IAM role is properly configured (for production)',
            'Verify AWS credentials are not expired'
          ];
        } else if (s3Error.name === 'NoSuchBucket') {
          errorType = 'bucket_not_found';
          troubleshooting = [
            'Verify the bucket name in amplify_outputs.json is correct',
            'Check if the bucket exists in the specified region',
            'Ensure the bucket was created during Amplify deployment'
          ];
        } else if (s3Error.name === 'NetworkingError' || s3Error.message.includes('network')) {
          errorType = 'network_error';
          troubleshooting = [
            'Check internet connectivity',
            'Verify firewall settings allow outbound HTTPS connections',
            'Check if VPC/security groups allow S3 access (for EC2/Lambda)'
          ];
        }
      }

      return NextResponse.json({
        status: 'unhealthy',
        error: 'S3 connectivity failed',
        errorType,
        details: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error',
        config: { bucketName, region },
        environment: envCheck,
        troubleshooting,
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[S3 Health Check] Unexpected error after ${duration}ms:`, error);
    
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
