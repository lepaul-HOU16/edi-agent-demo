import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { fromEnv, fromInstanceMetadata, fromWebToken } from '@aws-sdk/credential-providers';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('[S3 Health Check] Starting S3 connectivity check...');

    // Load configuration
    const outputs = require('@/../amplify_outputs.json');
    const bucketName = outputs.storage.bucket_name;
    const region = outputs.storage.aws_region;

    // Initialize S3 client with proper credential handling
    let s3Client: S3Client;
    let credentialSource = 'unknown';
    
    // Check if we're in production Amplify hosting environment
    const isProduction = process.env.NODE_ENV === 'production';
    const hasEnvCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    
    try {
      if (isProduction) {
        console.log('[S3 Health Check] Production environment detected');
        
        if (hasEnvCredentials) {
          console.log('[S3 Health Check] Using environment credentials in production');
          s3Client = new S3Client({ 
            region,
            credentials: fromEnv()
          });
          credentialSource = 'production-env';
        } else {
          console.log('[S3 Health Check] No environment credentials in production, this indicates a deployment configuration issue');
          
          // For production without credentials, we'll return a specific error
          return NextResponse.json({
            status: 'configuration_error',
            error: 'AWS credentials not configured for production deployment',
            details: 'Amplify hosting requires AWS credentials to be set as environment variables',
            config: { bucketName, region },
            troubleshooting: [
              'Configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Amplify Console Environment Variables',
              'Or set up an IAM role for the Amplify service',
              'Ensure the credentials have S3 read permissions'
            ],
            responseTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString()
          }, { status: 503 });
        }
      } else {
        console.log('[S3 Health Check] Development environment detected');
        
        if (hasEnvCredentials) {
          s3Client = new S3Client({ 
            region,
            credentials: fromEnv()
          });
          credentialSource = 'development-env';
        } else {
          // In development, try the AWS credential chain
          s3Client = new S3Client({ region });
          credentialSource = 'default-chain';
        }
      }
    } catch (credError) {
      console.log('[S3 Health Check] Credential initialization failed:', credError);
      
      return NextResponse.json({
        status: 'credential_error',
        error: 'Failed to initialize AWS credentials',
        details: credError instanceof Error ? credError.message : 'Unknown credential error',
        config: { bucketName, region },
        troubleshooting: [
          'Verify AWS credentials are properly configured',
          'Check environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY',
          'Ensure credentials have not expired',
          'Verify IAM permissions for S3 access'
        ],
        responseTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log(`[S3 Health Check] S3 client initialized for region: ${region}, credentials: ${credentialSource}`);

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
