import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET() {
  const startTime = Date.now();
  
  try {
    console.log('[S3 Health Check] Starting S3 connectivity check...');

    // Load configuration
    const outputs = require('@/../amplify_outputs.json');
    const bucketName = outputs.storage.bucket_name;
    const region = outputs.storage.aws_region;

    // Initialize S3 client
    const s3Client = new S3Client({ region });
    console.log(`[S3 Health Check] S3 client initialized for region: ${region}`);

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