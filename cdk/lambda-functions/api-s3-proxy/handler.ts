/**
 * S3 Proxy API Lambda Handler
 * Handles /api/s3-proxy route
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Parse multipart form data from API Gateway event
 */
function parseMultipartFormData(body: string, contentType: string): Map<string, any> {
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No boundary found in Content-Type');
  }

  const parts = body.split(`--${boundary}`);
  const formData = new Map<string, any>();

  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        const contentStart = part.indexOf('\r\n\r\n') + 4;
        const contentEnd = part.lastIndexOf('\r\n');
        const value = part.substring(contentStart, contentEnd);
        
        if (name === 'file') {
          // For file data, we need to handle it as binary
          formData.set(name, value);
        } else {
          formData.set(name, value);
        }
      }
    }
  }

  return formData;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log(`[S3 Proxy API] ${event.requestContext.http.method} ${event.requestContext.http.path}`);

  const bucketName = process.env.STORAGE_BUCKET_NAME;
  
  if (!bucketName) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'S3 bucket not configured',
      }),
    };
  }

  try {
    const method = event.requestContext.http.method;

    // Handle GET request - return signed URL for file or list files
    if (method === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const key = queryParams.key;
      const action = queryParams.action;

      if (!key) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Missing required parameter: key',
          }),
        };
      }

      // Handle list action
      if (action === 'list') {
        const subpathStrategy = queryParams.subpathStrategy || 'include';
        
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: key,
          Delimiter: subpathStrategy === 'exclude' ? '/' : undefined,
        });

        const response = await s3Client.send(command);
        
        const items = (response.Contents || []).map(item => ({
          path: item.Key || '',
          eTag: item.ETag,
          lastModified: item.LastModified,
          size: item.Size,
        }));

        const excludedSubpaths = subpathStrategy === 'exclude' 
          ? (response.CommonPrefixes || []).map(prefix => prefix.Prefix || '')
          : [];

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            items,
            excludedSubpaths,
          }),
        };
      }

      // For porosity-data requests, return JSON directly instead of signed URL
      if (key.startsWith('porosity-data/')) {
        console.log(`[S3 Proxy API] Fetching porosity data directly: ${key}`);
        
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        const response = await s3Client.send(command);
        const content = await response.Body?.transformToString();

        if (!content) {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: 'Porosity data not found',
              key,
            }),
          };
        }

        // Return JSON data directly with cache headers
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
          body: content,
        };
      }

      // For other requests, generate a signed URL that expires in 1 hour
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          url: signedUrl,
          key,
          bucket: bucketName,
        }),
      };
    }

    // Handle POST request - upload file
    if (method === 'POST') {
      const contentType = event.headers['content-type'] || '';
      
      if (!contentType.includes('multipart/form-data')) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Content-Type must be multipart/form-data',
          }),
        };
      }

      const body = event.isBase64Encoded 
        ? Buffer.from(event.body || '', 'base64').toString('utf-8')
        : event.body || '';

      const formData = parseMultipartFormData(body, contentType);
      const key = formData.get('key');
      const fileData = formData.get('file');
      const fileContentType = formData.get('contentType') || 'application/octet-stream';

      if (!key || !fileData) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Missing required fields: key and file',
          }),
        };
      }

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: Buffer.from(fileData, 'utf-8'),
        ContentType: fileContentType,
      });

      await s3Client.send(command);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          key,
          bucket: bucketName,
        }),
      };
    }

    // Handle DELETE request - delete file
    if (method === 'DELETE') {
      const queryParams = event.queryStringParameters || {};
      const key = queryParams.key;

      if (!key) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Missing required parameter: key',
          }),
        };
      }

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await s3Client.send(command);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          key,
          bucket: bucketName,
        }),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Method not allowed',
      }),
    };
  } catch (error) {
    console.error('[S3 Proxy API] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
