"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda-functions/projects/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");

// lambda-functions/shared/types.ts
function getUserContext(event) {
  try {
    const authorizer = event.requestContext.authorizer;
    if (authorizer?.lambda) {
      const context = authorizer.lambda;
      return {
        sub: context.userId || context.sub,
        email: context.email,
        username: context.username,
        groups: context.groups ? Array.isArray(context.groups) ? context.groups : [context.groups] : []
      };
    }
    const claims = authorizer?.jwt?.claims;
    if (claims) {
      return {
        sub: claims.sub,
        email: claims.email,
        username: claims["cognito:username"],
        groups: claims["cognito:groups"] || []
      };
    }
    console.warn("No user context found in authorizer");
    return null;
  } catch (error) {
    console.error("Error extracting user context:", error);
    return null;
  }
}
function successResponse(data, message) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      success: true,
      message,
      data
    })
  };
}
function errorResponse(error, code = "INTERNAL_ERROR", statusCode = 500) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      success: false,
      error,
      code
    })
  };
}
function parseBody(event) {
  try {
    if (!event.body) {
      return null;
    }
    return JSON.parse(event.body);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return null;
  }
}
function validateRequired(body, requiredFields) {
  if (!body) {
    return "Request body is required";
  }
  for (const field of requiredFields) {
    if (body[field] === void 0 || body[field] === null) {
      return `Missing required field: ${String(field)}`;
    }
  }
  return null;
}

// lambda-functions/projects/handler.ts
var s3Client = new import_client_s3.S3Client({});
var dynamoClient = new import_client_dynamodb.DynamoDBClient({});
var bucketName = process.env.STORAGE_BUCKET || "";
var sessionContextTable = process.env.SESSION_CONTEXT_TABLE || "RenewableSessionContext";
var agentProgressTable = process.env.AGENT_PROGRESS_TABLE || "AgentProgress";
async function deleteProject(projectId, userId) {
  console.log(`\u{1F5D1}\uFE0F  COMPREHENSIVE DELETE: ${projectId} for user: ${userId}`);
  if (!bucketName) {
    throw new Error("Storage bucket not configured");
  }
  const deletionSummary = {
    projectId,
    s3FilesDeleted: 0,
    sessionContextUpdates: 0,
    agentProgressDeleted: 0,
    errors: []
  };
  try {
    console.log("\u{1F4E6} Step 1: Deleting S3 artifacts...");
    const projectPrefix = `renewable/${projectId}/`;
    console.log(`   Listing objects with prefix: ${projectPrefix}`);
    const listCommand = new import_client_s3.ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: projectPrefix
    });
    const listResponse = await s3Client.send(listCommand);
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      console.log(`   Found ${listResponse.Contents.length} objects to delete`);
      const deleteCommand = new import_client_s3.DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key }))
        }
      });
      await s3Client.send(deleteCommand);
      deletionSummary.s3FilesDeleted += listResponse.Contents.length;
      console.log(`   \u2705 Deleted ${deletionSummary.s3FilesDeleted} artifact files`);
    } else {
      console.log(`   \u2139\uFE0F  No artifacts found in S3`);
    }
    const projectMetadataKey = `renewable/projects/${projectId}/project.json`;
    try {
      const deleteMetadataCommand = new import_client_s3.DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: [{ Key: projectMetadataKey }]
        }
      });
      await s3Client.send(deleteMetadataCommand);
      deletionSummary.s3FilesDeleted++;
      console.log(`   \u2705 Deleted project metadata: ${projectMetadataKey}`);
    } catch (error) {
      console.warn(`   \u26A0\uFE0F  Project metadata not found: ${projectMetadataKey}`);
    }
    console.log("\u{1F4CB} Step 2: Cleaning SessionContext table...");
    try {
      const scanCommand = new import_client_dynamodb.ScanCommand({
        TableName: sessionContextTable,
        FilterExpression: "contains(project_history, :projectId) OR active_project = :projectId",
        ExpressionAttributeValues: {
          ":projectId": { S: projectId }
        }
      });
      const scanResponse = await dynamoClient.send(scanCommand);
      if (scanResponse.Items && scanResponse.Items.length > 0) {
        console.log(`   Found ${scanResponse.Items.length} sessions referencing project`);
        for (const item of scanResponse.Items) {
          const sessionId = item.session_id.S;
          try {
            const projectHistory = item.project_history?.L || [];
            const filteredHistory = projectHistory.filter((p) => p.S !== projectId).map((p) => p.S);
            const updateCommand = new import_client_dynamodb.UpdateItemCommand({
              TableName: sessionContextTable,
              Key: {
                session_id: { S: sessionId }
              },
              UpdateExpression: "SET project_history = :history, last_updated = :timestamp REMOVE active_project",
              ExpressionAttributeValues: {
                ":history": { L: filteredHistory.map((p) => ({ S: p })) },
                ":timestamp": { S: (/* @__PURE__ */ new Date()).toISOString() }
              }
            });
            await dynamoClient.send(updateCommand);
            deletionSummary.sessionContextUpdates++;
            console.log(`   \u2705 Updated session: ${sessionId}`);
          } catch (error) {
            console.error(`   \u274C Failed to update session ${sessionId}:`, error.message);
            deletionSummary.errors.push(`Session ${sessionId}: ${error.message}`);
          }
        }
        console.log(`   \u2705 Updated ${deletionSummary.sessionContextUpdates} sessions`);
      } else {
        console.log(`   \u2139\uFE0F  No sessions found referencing this project`);
      }
    } catch (error) {
      console.error(`   \u274C Error scanning SessionContext:`, error.message);
      deletionSummary.errors.push(`SessionContext scan: ${error.message}`);
    }
    console.log("\u2699\uFE0F  Step 3: Cleaning AgentProgress table...");
    try {
      const scanProgressCommand = new import_client_dynamodb.ScanCommand({
        TableName: agentProgressTable,
        FilterExpression: "contains(#data, :projectId)",
        ExpressionAttributeNames: {
          "#data": "data"
        },
        ExpressionAttributeValues: {
          ":projectId": { S: projectId }
        }
      });
      const progressResponse = await dynamoClient.send(scanProgressCommand);
      if (progressResponse.Items && progressResponse.Items.length > 0) {
        console.log(`   Found ${progressResponse.Items.length} agent progress entries`);
        for (const item of progressResponse.Items) {
          const requestId = item.requestId.S;
          try {
            const deleteProgressCommand = new import_client_dynamodb.DeleteItemCommand({
              TableName: agentProgressTable,
              Key: {
                requestId: { S: requestId }
              }
            });
            await dynamoClient.send(deleteProgressCommand);
            deletionSummary.agentProgressDeleted++;
            console.log(`   \u2705 Deleted progress entry: ${requestId}`);
          } catch (error) {
            console.error(`   \u274C Failed to delete progress ${requestId}:`, error.message);
            deletionSummary.errors.push(`AgentProgress ${requestId}: ${error.message}`);
          }
        }
        console.log(`   \u2705 Deleted ${deletionSummary.agentProgressDeleted} progress entries`);
      } else {
        console.log(`   \u2139\uFE0F  No agent progress entries found`);
      }
    } catch (error) {
      console.error(`   \u274C Error scanning AgentProgress:`, error.message);
      deletionSummary.errors.push(`AgentProgress scan: ${error.message}`);
    }
    console.log("\n\u2705 DELETION COMPLETE");
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    console.log(`Project ID: ${projectId}`);
    console.log(`S3 Files Deleted: ${deletionSummary.s3FilesDeleted}`);
    console.log(`Session Contexts Updated: ${deletionSummary.sessionContextUpdates}`);
    console.log(`Agent Progress Deleted: ${deletionSummary.agentProgressDeleted}`);
    console.log(`Errors: ${deletionSummary.errors.length}`);
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n");
    return {
      ...deletionSummary,
      success: true,
      message: `Successfully deleted project ${projectId} from all systems`
    };
  } catch (error) {
    console.error("\u274C CRITICAL ERROR during deletion:", error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}
async function renameProject(projectId, newName, userId) {
  console.log(`Renaming project ${projectId} to ${newName} for user: ${userId}`);
  if (!bucketName) {
    throw new Error("Storage bucket not configured");
  }
  try {
    const projectMetadataKey = `renewable/projects/${projectId}/project.json`;
    const getCommand = new import_client_s3.GetObjectCommand({
      Bucket: bucketName,
      Key: projectMetadataKey
    });
    let projectData = {};
    try {
      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();
      if (body) {
        projectData = JSON.parse(body);
      }
    } catch (error) {
      console.warn(`Project metadata not found, creating new: ${projectMetadataKey}`);
    }
    projectData.project_name = newName;
    projectData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: projectMetadataKey,
      Body: JSON.stringify(projectData, null, 2),
      ContentType: "application/json"
    });
    await s3Client.send(putCommand);
    console.log(`Successfully renamed project ${projectId} to ${newName}`);
    return {
      projectId,
      newName,
      message: `Project renamed to ${newName}`
    };
  } catch (error) {
    console.error("Error renaming project:", error);
    throw new Error(`Failed to rename project: ${error.message}`);
  }
}
async function getProjectDetails(projectId, userId) {
  console.log(`Getting details for project: ${projectId} for user: ${userId}`);
  if (!bucketName) {
    throw new Error("Storage bucket not configured");
  }
  try {
    const prefix = `renewable/${projectId}/`;
    const listCommand = new import_client_s3.ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    });
    const listResponse = await s3Client.send(listCommand);
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      throw new Error(`Project ${projectId} not found`);
    }
    const artifacts = listResponse.Contents.map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      url: `https://${bucketName}.s3.amazonaws.com/${obj.Key}`
    }));
    const hasTerrain = artifacts.some((a) => a.key?.includes("/terrain/"));
    const hasLayout = artifacts.some((a) => a.key?.includes("/layout/"));
    const hasSimulation = artifacts.some((a) => a.key?.includes("/simulation/"));
    const hasReport = artifacts.some((a) => a.key?.includes("/report/"));
    let completionStatus = "incomplete";
    if (hasTerrain && hasLayout && hasSimulation && hasReport) {
      completionStatus = "complete";
    } else if (hasTerrain || hasLayout) {
      completionStatus = "in_progress";
    }
    let projectName = projectId;
    try {
      const projectMetadataKey = `renewable/projects/${projectId}/project.json`;
      const getCommand = new import_client_s3.GetObjectCommand({
        Bucket: bucketName,
        Key: projectMetadataKey
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
        hasReport
      },
      completionStatus,
      createdAt: artifacts[0]?.lastModified,
      updatedAt: artifacts[artifacts.length - 1]?.lastModified
    };
  } catch (error) {
    console.error("Error getting project details:", error);
    throw new Error(`Failed to get project details: ${error.message}`);
  }
}
var handler = async (event) => {
  console.log("Projects Lambda invoked:", JSON.stringify(event, null, 2));
  try {
    const user = getUserContext(event);
    if (!user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }
    const path = event.requestContext.http.path;
    const method = event.requestContext.http.method;
    if (path === "/api/projects/delete" && method === "POST") {
      const body = parseBody(event);
      const validationError = validateRequired(body, ["projectId"]);
      if (validationError) {
        return errorResponse(validationError, "INVALID_INPUT", 400);
      }
      const result = await deleteProject(body.projectId, user.sub);
      return successResponse(result, "Project deleted successfully");
    }
    if (path === "/api/projects/rename" && method === "POST") {
      const body = parseBody(event);
      const validationError = validateRequired(body, ["projectId", "newName"]);
      if (validationError) {
        return errorResponse(validationError, "INVALID_INPUT", 400);
      }
      const result = await renameProject(body.projectId, body.newName, user.sub);
      return successResponse(result, "Project renamed successfully");
    }
    if (path.startsWith("/api/projects/") && method === "GET") {
      const projectId = path.split("/").pop();
      if (!projectId) {
        return errorResponse("Project ID is required", "INVALID_INPUT", 400);
      }
      const result = await getProjectDetails(projectId, user.sub);
      return successResponse(result);
    }
    return errorResponse("Not found", "NOT_FOUND", 404);
  } catch (error) {
    console.error("Error in projects handler:", error);
    return errorResponse(error.message || "Internal server error", "INTERNAL_ERROR", 500);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
