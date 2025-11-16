/**
 * Project Management Lambda Function
 * 
 * Handles renewable energy project operations:
 * - Delete project and all S3 artifacts
 * - Rename project
 * - Export project
 * - Get project details
 */

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, ScanCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import {
  getUserContext,
  successResponse,
  errorResponse,
  parseBody,
  validateRequired,
} from '../shared/types';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const bucketName = process.env.STORAGE_BUCKET || '';
const sessionContextTable = process.env.SESSION_CONTEXT_TABLE || 'RenewableSessionContext';
const agentProgressTable = process.env.AGENT_PROGRESS_TABLE || 'AgentProgress';

/**
 * Delete renewable project and all S3 artifacts AND DynamoDB references
 */
async function deleteProject(projectId: string, userId: string): Promise<any> {
  console.log(`🗑️  COMPREHENSIVE DELETE: ${projectId} for user: ${userId}`);

  if (!bucketName) {
    throw new Error('Storage bucket not configured');
  }

  const deletionSummary = {
    projectId,
    s3FilesDeleted: 0,
    sessionContextUpdates: 0,
    agentProgressDeleted: 0,
    errors: [] as string[],
  };

  try {
    // ============================================
    // STEP 1: Delete S3 Artifacts
    // ============================================
    console.log('📦 Step 1: Deleting S3 artifacts...');
    
    // Delete all artifact files in the project directory (renewable/{projectId}/*)
    const projectPrefix = `renewable/${projectId}/`;
    console.log(`   Listing objects with prefix: ${projectPrefix}`);

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: projectPrefix,
    });

    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log(`   Found ${listResponse.Contents.length} objects to delete`);

      // Delete all objects in batch
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key! })),
        },
      });

      await s3Client.send(deleteCommand);
      deletionSummary.s3FilesDeleted += listResponse.Contents.length;
      console.log(`   ✅ Deleted ${deletionSummary.s3FilesDeleted} artifact files`);
    } else {
      console.log(`   ℹ️  No artifacts found in S3`);
    }

    // Delete project metadata file
    const projectMetadataKey = `renewable/projects/${projectId}/project.json`;
    try {
      const deleteMetadataCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: [{ Key: projectMetadataKey }],
        },
      });
      await s3Client.send(deleteMetadataCommand);
      deletionSummary.s3FilesDeleted++;
      console.log(`   ✅ Deleted project metadata: ${projectMetadataKey}`);
    } catch (error) {
      console.warn(`   ⚠️  Project metadata not found: ${projectMetadataKey}`);
    }

    // ============================================
    // STEP 2: Clean SessionContext Table
    // ============================================
    console.log('📋 Step 2: Cleaning SessionContext table...');
    
    try {
      // Scan for all sessions that reference this project
      const scanCommand = new ScanCommand({
        TableName: sessionContextTable,
        FilterExpression: 'contains(project_history, :projectId) OR active_project = :projectId',
        ExpressionAttributeValues: {
          ':projectId': { S: projectId },
        },
      });

      const scanResponse = await dynamoClient.send(scanCommand);

      if (scanResponse.Items && scanResponse.Items.length > 0) {
        console.log(`   Found ${scanResponse.Items.length} sessions referencing project`);

        // Update each session to remove project references
        for (const item of scanResponse.Items) {
          const sessionId = item.session_id.S!;
          
          try {
            // Get current project_history
            const projectHistory = item.project_history?.L || [];
            const filteredHistory = projectHistory
              .filter((p: any) => p.S !== projectId)
              .map((p: any) => p.S);

            // Update the session
            const updateCommand = new UpdateItemCommand({
              TableName: sessionContextTable,
              Key: {
                session_id: { S: sessionId },
              },
              UpdateExpression: 'SET project_history = :history, last_updated = :timestamp REMOVE active_project',
              ExpressionAttributeValues: {
                ':history': { L: filteredHistory.map((p: string) => ({ S: p })) },
                ':timestamp': { S: new Date().toISOString() },
              },
            });

            await dynamoClient.send(updateCommand);
            deletionSummary.sessionContextUpdates++;
            console.log(`   ✅ Updated session: ${sessionId}`);
          } catch (error: any) {
            console.error(`   ❌ Failed to update session ${sessionId}:`, error.message);
            deletionSummary.errors.push(`Session ${sessionId}: ${error.message}`);
          }
        }

        console.log(`   ✅ Updated ${deletionSummary.sessionContextUpdates} sessions`);
      } else {
        console.log(`   ℹ️  No sessions found referencing this project`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error scanning SessionContext:`, error.message);
      deletionSummary.errors.push(`SessionContext scan: ${error.message}`);
    }

    // ============================================
    // STEP 3: Clean AgentProgress Table
    // ============================================
    console.log('⚙️  Step 3: Cleaning AgentProgress table...');
    
    try {
      // Scan for agent progress entries related to this project
      const scanProgressCommand = new ScanCommand({
        TableName: agentProgressTable,
        FilterExpression: 'contains(#data, :projectId)',
        ExpressionAttributeNames: {
          '#data': 'data',
        },
        ExpressionAttributeValues: {
          ':projectId': { S: projectId },
        },
      });

      const progressResponse = await dynamoClient.send(scanProgressCommand);

      if (progressResponse.Items && progressResponse.Items.length > 0) {
        console.log(`   Found ${progressResponse.Items.length} agent progress entries`);

        // Delete each progress entry
        for (const item of progressResponse.Items) {
          const requestId = item.requestId.S!;
          
          try {
            const deleteProgressCommand = new DeleteItemCommand({
              TableName: agentProgressTable,
              Key: {
                requestId: { S: requestId },
              },
            });

            await dynamoClient.send(deleteProgressCommand);
            deletionSummary.agentProgressDeleted++;
            console.log(`   ✅ Deleted progress entry: ${requestId}`);
          } catch (error: any) {
            console.error(`   ❌ Failed to delete progress ${requestId}:`, error.message);
            deletionSummary.errors.push(`AgentProgress ${requestId}: ${error.message}`);
          }
        }

        console.log(`   ✅ Deleted ${deletionSummary.agentProgressDeleted} progress entries`);
      } else {
        console.log(`   ℹ️  No agent progress entries found`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error scanning AgentProgress:`, error.message);
      deletionSummary.errors.push(`AgentProgress scan: ${error.message}`);
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n✅ DELETION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Project ID: ${projectId}`);
    console.log(`S3 Files Deleted: ${deletionSummary.s3FilesDeleted}`);
    console.log(`Session Contexts Updated: ${deletionSummary.sessionContextUpdates}`);
    console.log(`Agent Progress Deleted: ${deletionSummary.agentProgressDeleted}`);
    console.log(`Errors: ${deletionSummary.errors.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      ...deletionSummary,
      success: true,
      message: `Successfully deleted project ${projectId} from all systems`,
    };
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR during deletion:', error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

/**
 * Rename renewable project
 */
async function renameProject(projectId: string, newName: string, userId: string): Promise<any> {
  console.log(`Renaming project ${projectId} to ${newName} for user: ${userId}`);

  if (!bucketName) {
    throw new Error('Storage bucket not configured');
  }

  try {
    // Get current project metadata
    const projectMetadataKey = `renewable/projects/${projectId}/project.json`;
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: projectMetadataKey,
    });

    let projectData: any = {};

    try {
      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();
      if (body) {
        projectData = JSON.parse(body);
      }
    } catch (error) {
      console.warn(`Project metadata not found, creating new: ${projectMetadataKey}`);
    }

    // Update project name
    projectData.project_name = newName;
    projectData.updated_at = new Date().toISOString();

    // Save updated metadata
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: projectMetadataKey,
      Body: JSON.stringify(projectData, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    console.log(`Successfully renamed project ${projectId} to ${newName}`);

    return {
      projectId,
      newName,
      message: `Project renamed to ${newName}`,
    };
  } catch (error: any) {
    console.error('Error renaming project:', error);
    throw new Error(`Failed to rename project: ${error.message}`);
  }
}

/**
 * Get renewable project details
 */
async function getProjectDetails(projectId: string, userId: string): Promise<any> {
  console.log(`Getting details for project: ${projectId} for user: ${userId}`);

  if (!bucketName) {
    throw new Error('Storage bucket not configured');
  }

  try {
    // List all objects for this project
    const prefix = `renewable/${projectId}/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Organize artifacts by type
    const artifacts = listResponse.Contents.map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      url: `https://${bucketName}.s3.amazonaws.com/${obj.Key}`,
    }));

    // Determine completion status based on artifacts
    const hasTerrain = artifacts.some((a) => a.key?.includes('/terrain/'));
    const hasLayout = artifacts.some((a) => a.key?.includes('/layout/'));
    const hasSimulation = artifacts.some((a) => a.key?.includes('/simulation/'));
    const hasReport = artifacts.some((a) => a.key?.includes('/report/'));

    let completionStatus = 'incomplete';
    if (hasTerrain && hasLayout && hasSimulation && hasReport) {
      completionStatus = 'complete';
    } else if (hasTerrain || hasLayout) {
      completionStatus = 'in_progress';
    }

    // Try to get project metadata
    let projectName = projectId;
    try {
      const projectMetadataKey = `renewable/projects/${projectId}/project.json`;
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: projectMetadataKey,
      });
      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();
      if (body) {
        const metadata = JSON.parse(body);
        projectName = metadata.project_name || projectId;
      }
    } catch (error) {
      console.warn(`Project metadata not found: ${projectId}`);
    }

    return {
      projectId,
      projectName,
      artifacts,
      metadata: {
        totalFiles: artifacts.length,
        hasTerrain,
        hasLayout,
        hasSimulation,
        hasReport,
      },
      completionStatus,
      createdAt: artifacts[0]?.lastModified,
      updatedAt: artifacts[artifacts.length - 1]?.lastModified,
    };
  } catch (error: any) {
    console.error('Error getting project details:', error);
    throw new Error(`Failed to get project details: ${error.message}`);
  }
}

/**
 * Lambda handler
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Projects Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    // Get user context from JWT
    const user = getUserContext(event);
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Determine operation from path
    const path = event.requestContext.http.path;
    const method = event.requestContext.http.method;

    // POST /api/projects/delete
    if (path === '/api/projects/delete' && method === 'POST') {
      const body = parseBody<{ projectId: string }>(event);
      const validationError = validateRequired(body, ['projectId']);
      if (validationError) {
        return errorResponse(validationError, 'INVALID_INPUT', 400);
      }

      const result = await deleteProject(body!.projectId, user.sub);
      return successResponse(result, 'Project deleted successfully');
    }

    // POST /api/projects/rename
    if (path === '/api/projects/rename' && method === 'POST') {
      const body = parseBody<{ projectId: string; newName: string }>(event);
      const validationError = validateRequired(body, ['projectId', 'newName']);
      if (validationError) {
        return errorResponse(validationError, 'INVALID_INPUT', 400);
      }

      const result = await renameProject(body!.projectId, body!.newName, user.sub);
      return successResponse(result, 'Project renamed successfully');
    }

    // GET /api/projects/{projectId}
    if (path.startsWith('/api/projects/') && method === 'GET') {
      const projectId = path.split('/').pop();
      if (!projectId) {
        return errorResponse('Project ID is required', 'INVALID_INPUT', 400);
      }

      const result = await getProjectDetails(projectId, user.sub);
      return successResponse(result);
    }

    // Unknown route
    return errorResponse('Not found', 'NOT_FOUND', 404);
  } catch (error: any) {
    console.error('Error in projects handler:', error);
    return errorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};
