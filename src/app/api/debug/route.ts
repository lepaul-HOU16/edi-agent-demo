import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Debug API] Starting configuration check...');
    
    // Test configuration loading
    let configResult: any = 'Failed to load';
    let configError = null;
    
    try {
      const outputs = require('@/../amplify_outputs.json');
      configResult = {
        hasStorage: !!outputs.storage,
        bucketName: outputs.storage?.bucket_name,
        region: outputs.storage?.aws_region,
        hasAuth: !!outputs.auth,
        hasData: !!outputs.data
      };
      console.log('[Debug API] Configuration loaded successfully:', configResult);
    } catch (error) {
      configError = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Debug API] Configuration load failed:', configError);
    }

    // Test AWS SDK import
    let s3ClientResult = 'Failed to create';
    let s3Error = null;
    
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const client = new S3Client({ 
        region: 'us-east-1'
      });
      s3ClientResult = 'Successfully created S3Client';
      console.log('[Debug API] S3Client created successfully');
    } catch (error) {
      s3Error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Debug API] S3Client creation failed:', s3Error);
    }

    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '***SET***' : 'NOT SET',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '***SET***' : 'NOT SET',
      AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN ? '***SET***' : 'NOT SET',
      AWS_PROFILE: process.env.AWS_PROFILE
    };

    console.log('[Debug API] Environment check:', envCheck);

    const debugInfo = {
      timestamp: new Date().toISOString(),
      configuration: {
        result: configResult,
        error: configError
      },
      s3Client: {
        result: s3ClientResult,
        error: s3Error
      },
      environment: envCheck,
      process: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd()
      }
    };

    return NextResponse.json(debugInfo, { status: 200 });

  } catch (error) {
    console.error('[Debug API] Unexpected error:', error);
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
