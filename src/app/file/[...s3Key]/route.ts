import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

interface PageProps {
  params: {
    s3Key: string[];
  };
}

// S3 key normalization function (similar to s3ToolBox.ts)
function normalizeS3Key(filepath: string, sessionId?: string): string {
  console.log(`[S3 Route Key Debug] Input filepath: ${filepath}`);
  
  // Remove any leading slashes
  let normalizedPath = filepath.replace(/^\/+/, '');
  
  // Handle global files
  if (normalizedPath.startsWith('global/')) {
    console.log(`[S3 Route Key Debug] Global file detected: ${normalizedPath}`);
    return normalizedPath;
  }
  
  // Handle files that already have the full chatSessionArtifacts prefix with sessionId
  if (normalizedPath.startsWith('chatSessionArtifacts/') && normalizedPath.includes('/sessionId=')) {
    console.log(`[S3 Route Key Debug] Full path with sessionId already present: ${normalizedPath}`);
    return normalizedPath;
  }
  
  // Handle files that have chatSessionArtifacts prefix but missing sessionId
  if (normalizedPath.startsWith('chatSessionArtifacts/') && !normalizedPath.includes('/sessionId=')) {
    if (!sessionId) {
      throw new Error("Session ID not available for S3 key construction");
    }
    // Extract the path after chatSessionArtifacts/
    const pathAfterPrefix = normalizedPath.replace('chatSessionArtifacts/', '');
    normalizedPath = `chatSessionArtifacts/sessionId=${sessionId}/${pathAfterPrefix}`;
    console.log(`[S3 Route Key Debug] Added sessionId to path: ${normalizedPath}`);
    return normalizedPath;
  }
  
  // For other session-specific files, construct the full path
  if (sessionId) {
    const fullPath = `chatSessionArtifacts/sessionId=${sessionId}/${normalizedPath}`;
    console.log(`[S3 Route Key Debug] Constructed session path: ${fullPath}`);
    return fullPath;
  }
  
  // Fallback - return as-is if no session context
  console.log(`[S3 Route Key Debug] No normalization applied: ${normalizedPath}`);
  return normalizedPath;
}

// Extract session ID from URL path or headers
function extractSessionId(request: Request, s3Key: string): string | undefined {
  // Try to extract from the S3 key path itself
  const sessionIdMatch = s3Key.match(/sessionId=([^\/]+)/);
  if (sessionIdMatch) {
    return sessionIdMatch[1];
  }
  
  // Try to extract from headers (if the frontend sends it)
  const headerSessionId = request.headers.get('x-session-id');
  if (headerSessionId) {
    return headerSessionId;
  }
  
  // Try to extract from URL searchParams
  const url = new URL(request.url);
  const paramSessionId = url.searchParams.get('sessionId');
  if (paramSessionId) {
    return paramSessionId;
  }
  
  return undefined;
}

// Search for a file across all chat sessions
async function findFileAcrossSessions(s3Client: S3Client, bucketName: string, relativeFilePath: string): Promise<string | null> {
  console.log(`[S3 Route] Searching for file across sessions: ${relativeFilePath}`);
  
  try {
    // List all sessionId prefixes under chatSessionArtifacts/
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'chatSessionArtifacts/',
      Delimiter: '/'
    });
    
    const listResponse = await s3Client.send(listCommand);
    const sessionPrefixes = listResponse.CommonPrefixes || [];
    
    console.log(`[S3 Route] Found ${sessionPrefixes.length} session prefixes`);
    
    // Search through each session prefix for the file
    for (const prefixObj of sessionPrefixes) {
      if (!prefixObj.Prefix) continue;
      
      const potentialKey = `${prefixObj.Prefix}${relativeFilePath}`;
      console.log(`[S3 Route] Checking for file: ${potentialKey}`);
      
      try {
        // Try to get object metadata (HEAD operation is cheaper than GET)
        const headCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: potentialKey
        });
        
        // Just check if the file exists by trying to get its metadata
        await s3Client.send(headCommand);
        console.log(`[S3 Route] File found at: ${potentialKey}`);
        return potentialKey;
      } catch (error: any) {
        // If it's a NoSuchKey error, continue searching; otherwise log the error
        if (error.name !== 'NoSuchKey') {
          console.log(`[S3 Route] Error checking ${potentialKey}: ${error.message}`);
        }
      }
    }
    
    console.log(`[S3 Route] File not found in any session: ${relativeFilePath}`);
    return null;
  } catch (error) {
    console.error(`[S3 Route] Error searching across sessions:`, error);
    return null;
  }
}

// Set cache control headers to prevent caching large files
export const dynamic = 'force-dynamic'; // Disable static optimization

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

    // Extract session ID from the request
    const sessionId = extractSessionId(request, s3KeyDecoded);
    console.log(`[S3 Route] Extracted session ID: ${sessionId}`);

    // Normalize the S3 key to ensure proper path structure
    let normalizedS3Key: string;
    let shouldTryFileSearch = false;
    
    try {
      normalizedS3Key = normalizeS3Key(s3KeyDecoded, sessionId);
      console.log(`[S3 Route] Normalized S3 key: ${normalizedS3Key}`);
    } catch (error) {
      console.warn(`[S3 Route] Error normalizing S3 key: ${error}`);
      
      // If normalization failed due to missing session ID and the path looks like a chatSessionArtifacts file,
      // we'll try searching across sessions as a fallback
      if (s3KeyDecoded.startsWith('chatSessionArtifacts/') && !sessionId) {
        shouldTryFileSearch = true;
        normalizedS3Key = s3KeyDecoded; // Use original path for now
        console.log(`[S3 Route] Will attempt file search across sessions for: ${s3KeyDecoded}`);
      } else {
        return NextResponse.json(
          { 
            error: 'Invalid request',
            details: `Unable to determine correct S3 path for file: ${s3KeyDecoded}. Session ID may be required.`,
            originalKey: s3KeyDecoded
          },
          { status: 400 }
        );
      }
    }

    // Load configuration with proper error handling
    let outputs, bucketName, region;
    try {
      outputs = require('@/../amplify_outputs.json');
      bucketName = outputs.storage?.bucket_name;
      region = outputs.storage?.aws_region;
      
      if (!bucketName || !region) {
        throw new Error('Missing required S3 configuration in amplify_outputs.json');
      }
      
      console.log(`[S3 Route] Configuration loaded: bucket=${bucketName}, region=${region}`);
    } catch (configError) {
      console.error('[S3 Route] Failed to load amplify configuration:', configError);
      return NextResponse.json(
        { 
          error: 'Configuration error',
          details: `Failed to load AWS configuration: ${configError instanceof Error ? configError.message : 'Unknown configuration error'}`,
          s3Key: s3KeyDecoded
        },
        { status: 500 }
      );
    }

    // Initialize S3 client with proper credentials for production vs development
    let s3Client: S3Client;
    try {
      // Check if we're in production (deployed) vs development
      const isProduction = process.env.NODE_ENV === 'production' || !process.env.AWS_ACCESS_KEY_ID;
      
      if (isProduction) {
        // Production: Use Cognito Identity Pool credentials (unauthenticated role)
        console.log(`[S3 Route] Using Cognito Identity Pool credentials for production`);
        
        const cognitoCredentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ 
            region: region 
          }),
          identityPoolId: outputs.auth?.identity_pool_id,
          // Use unauthenticated access for file serving
          // The backend has configured proper IAM permissions for unauthenticated users
        });

        s3Client = new S3Client({ 
          region,
          credentials: cognitoCredentials
        });
        
        console.log(`[S3 Route] S3 client initialized for production with Cognito Identity Pool`);
      } else {
        // Development: Use environment variables (SSO/local credentials)
        console.log(`[S3 Route] Using environment credentials for development`);
        s3Client = new S3Client({ 
          region,
          // Let AWS SDK handle credentials from environment automatically
        });
        
        console.log(`[S3 Route] S3 client initialized for development with environment credentials`);
      }
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

    // If we should try file search, do it first
    if (shouldTryFileSearch) {
      console.log(`[S3 Route] Attempting file search across sessions`);
      const relativePath = s3KeyDecoded.replace('chatSessionArtifacts/', '');
      const foundKey = await findFileAcrossSessions(s3Client, bucketName, relativePath);
      
      if (foundKey) {
        console.log(`[S3 Route] File found via search, using key: ${foundKey}`);
        normalizedS3Key = foundKey;
        shouldTryFileSearch = false; // Don't retry
      } else {
        console.log(`[S3 Route] File not found via search, proceeding with original attempt`);
      }
    }

    // Create S3 command to get the object using normalized key
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: normalizedS3Key,
    });

    try {
      // Generate a signed URL that's valid for 1 hour
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log(`[S3 Route] Generated signed URL for: ${normalizedS3Key}`);

      // Fetch the file content using the signed URL with no-cache to prevent Next.js caching issues for large files
      const fileResponse = await fetch(signedUrl, {
        cache: 'no-store'
      });
      
      if (!fileResponse.ok) {
        console.error(`[S3 Route] Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
        
        // If we get a 404 and we haven't tried file search yet, try it now
        if (fileResponse.status === 404 && !shouldTryFileSearch && s3KeyDecoded.startsWith('chatSessionArtifacts/')) {
          console.log(`[S3 Route] 404 received, attempting file search across sessions`);
          const relativePath = s3KeyDecoded.replace('chatSessionArtifacts/', '');
          const foundKey = await findFileAcrossSessions(s3Client, bucketName, relativePath);
          
          if (foundKey) {
            console.log(`[S3 Route] File found via search after 404, redirecting to: ${foundKey}`);
            // Recursively call the same function with the found key
            const newUrl = new URL(request.url);
            newUrl.pathname = `/file/${foundKey}`;
            return fetch(newUrl.toString());
          }
        }
        
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

      // Check content length to prevent serving empty files
      const contentLengthHeader = fileResponse.headers.get('content-length');
      const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      
      if (contentLength === 0) {
        console.warn(`[S3 Route] Refusing to serve empty file: ${s3KeyDecoded}`);
        return NextResponse.json(
          { 
            error: 'Empty file content',
            details: `The file '${s3KeyDecoded}' exists but contains no content. Empty files are not served to prevent displaying blank content.`,
            s3Key: s3KeyDecoded,
            contentLength: 0,
            suggestion: 'The file may need to be regenerated or may have failed to upload properly.'
          },
          { status: 422 } // Unprocessable Entity - file exists but is invalid
        );
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
          // If we get NoSuchKey and we haven't tried file search yet, try it now
          if (!shouldTryFileSearch && s3KeyDecoded.startsWith('chatSessionArtifacts/')) {
            console.log(`[S3 Route] NoSuchKey error, attempting file search across sessions`);
            const relativePath = s3KeyDecoded.replace('chatSessionArtifacts/', '');
            const foundKey = await findFileAcrossSessions(s3Client, bucketName, relativePath);
            
            if (foundKey) {
              console.log(`[S3 Route] File found via search after NoSuchKey, using key: ${foundKey}`);
              // Create a new command with the found key and retry
              const newCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: foundKey,
              });
              
              const newSignedUrl = await getSignedUrl(s3Client, newCommand, { expiresIn: 3600 });
              const newFileResponse = await fetch(newSignedUrl, { cache: 'no-store' });
              
              if (newFileResponse.ok) {
                const contentType = getContentType(s3KeyDecoded);
                const headers: Record<string, string> = {
                  'Content-Type': contentType,
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET',
                  'Access-Control-Allow-Headers': 'Content-Type',
                };
                
                console.log(`[S3 Route] Successfully serving file via search: ${foundKey} (Content-Type: ${contentType})`);
                console.log(`[S3 Route] Request completed in ${Date.now() - startTime}ms`);
                
                return new NextResponse(newFileResponse.body, {
                  status: newFileResponse.status,
                  statusText: newFileResponse.statusText,
                  headers: headers,
                });
              }
            }
          }
          
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
