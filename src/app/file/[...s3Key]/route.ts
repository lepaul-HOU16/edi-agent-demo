import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface PageProps {
  params: {
    s3Key: string[];
  };
}

// Set cache control headers to prevent caching large files
export const dynamic = 'force-dynamic'; // Disable static optimization

// Function to safely load outputs
const loadOutputs = () => {
  try {
    return require('@/../amplify_outputs.json');
  } catch (error) {
    console.warn('amplify_outputs.json not found - this is expected during initial build');
    return null;
  }
};

// Initialize S3 client with proper credential handling
const getS3Client = () => {
  const outputs = loadOutputs();
  if (!outputs || !outputs.storage) {
    throw new Error('S3 configuration not found in amplify_outputs.json');
  }

  const region = outputs.storage.aws_region;
  
  // Use AWS SDK credential chain which works better in production
  return new S3Client({
    region,
    // The AWS SDK will automatically use:
    // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
    // 2. IAM roles (in production)
    // 3. AWS credentials file
    // 4. Instance profile credentials (EC2, Lambda, etc.)
  });
};

// Function to determine content type from file extension
const getContentType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'htm': 'text/html; charset=utf-8',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'xml': 'application/xml',
    'zip': 'application/zip',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
};

export async function GET(request: Request, { params }: PageProps) {
  const startTime = Date.now();
  
  try {
    const s3Key = params.s3Key.join('/');
    const s3KeyDecoded = s3Key.split('/').map((item: string) => decodeURIComponent(item)).join('/');

    console.log(`[S3 Route] Processing request for: ${s3KeyDecoded}`);

    // Load configuration
    const outputs = loadOutputs();
    if (!outputs || !outputs.storage) {
      console.error('[S3 Route] Missing storage configuration in amplify_outputs.json');
      return NextResponse.json(
        { 
          error: 'Storage configuration not found',
          details: 'amplify_outputs.json is missing or does not contain storage configuration'
        },
        { status: 500 }
      );
    }

    const bucketName = outputs.storage.bucket_name;
    if (!bucketName) {
      console.error('[S3 Route] Bucket name not found in configuration');
      return NextResponse.json(
        { 
          error: 'Bucket configuration missing',
          details: 'Bucket name not found in storage configuration'
        },
        { status: 500 }
      );
    }

    // Initialize S3 client
    let s3Client: S3Client;
    try {
      s3Client = getS3Client();
      console.log(`[S3 Route] S3 client initialized for region: ${outputs.storage.aws_region}`);
    } catch (error) {
      console.error('[S3 Route] Failed to initialize S3 client:', error);
      return NextResponse.json(
        { 
          error: 'S3 client initialization failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Create S3 command to get the object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3KeyDecoded,
    });

    try {
      // Generate a signed URL that's valid for 1 hour
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log(`[S3 Route] Generated signed URL for: ${s3KeyDecoded}`);

      // Fetch the file content using the signed URL
      const fileResponse = await fetch(signedUrl);
      
      if (!fileResponse.ok) {
        console.error(`[S3 Route] Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
        
        if (fileResponse.status === 404) {
          return NextResponse.json(
            { 
              error: 'File not found',
              details: `The file '${s3KeyDecoded}' does not exist in the S3 bucket`,
              s3Key: s3KeyDecoded,
              bucket: bucketName
            },
            { status: 404 }
          );
        } else if (fileResponse.status === 403) {
          return NextResponse.json(
            { 
              error: 'Access denied',
              details: `Permission denied to access file '${s3KeyDecoded}'`,
              s3Key: s3KeyDecoded,
              bucket: bucketName
            },
            { status: 403 }
          );
        } else {
          return NextResponse.json(
            { 
              error: 'S3 fetch failed',
              details: `Failed to fetch file from S3: ${fileResponse.status} ${fileResponse.statusText}`,
              s3Key: s3KeyDecoded
            },
            { status: fileResponse.status }
          );
        }
      }

      // Get the file extension to determine content type
      const contentType = getContentType(s3KeyDecoded);
      
      // Create headers with appropriate content type
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Add CORS headers for cross-origin requests
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      // Copy some headers from the S3 response if they exist
      const s3Headers = ['content-length', 'last-modified', 'etag'];
      s3Headers.forEach(header => {
        const value = fileResponse.headers.get(header);
        if (value) {
          headers[header.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join('-')] = value;
        }
      });
      
      console.log(`[S3 Route] Successfully serving file: ${s3KeyDecoded} (Content-Type: ${contentType})`);
      console.log(`[S3 Route] Request completed in ${Date.now() - startTime}ms`);
      
      // Create a new response with the file content and headers
      const response = new NextResponse(fileResponse.body, {
        status: fileResponse.status,
        statusText: fileResponse.statusText,
        headers: headers,
      });
      
      return response;

    } catch (s3Error) {
      console.error('[S3 Route] S3 operation failed:', s3Error);
      
      // Handle specific AWS SDK errors
      if (s3Error instanceof Error) {
        if (s3Error.name === 'NoSuchKey') {
          return NextResponse.json(
            { 
              error: 'File not found',
              details: `The file '${s3KeyDecoded}' does not exist in the S3 bucket`,
              s3Key: s3KeyDecoded,
              bucket: bucketName
            },
            { status: 404 }
          );
        } else if (s3Error.name === 'AccessDenied') {
          return NextResponse.json(
            { 
              error: 'Access denied',
              details: `Permission denied to access file '${s3KeyDecoded}'. Check IAM permissions and S3 bucket policy.`,
              s3Key: s3KeyDecoded,
              bucket: bucketName
            },
            { status: 403 }
          );
        } else if (s3Error.name === 'CredentialsError' || s3Error.message.includes('credentials')) {
          return NextResponse.json(
            { 
              error: 'Authentication error',
              details: 'AWS credentials not found or invalid. Check environment configuration.',
              s3Key: s3KeyDecoded
            },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          error: 'S3 operation failed',
          details: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error',
          s3Key: s3KeyDecoded
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[S3 Route] Unexpected error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
