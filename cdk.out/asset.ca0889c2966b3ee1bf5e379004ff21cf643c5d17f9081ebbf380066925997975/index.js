"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda-functions/chat-sessions/handler.ts
var handler_exports = {};
__export(handler_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(handler_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_crypto = require("crypto");
var client = new import_client_dynamodb.DynamoDBClient({});
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
var CHAT_SESSION_TABLE = process.env.CHAT_SESSION_TABLE;
var CHAT_MESSAGE_TABLE = process.env.CHAT_MESSAGE_TABLE;
function getUserId(event) {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  if (claims && claims.sub) {
    return claims.sub;
  }
  const authContext = event.requestContext.authorizer;
  if (authContext && authContext.lambda) {
    if (authContext.lambda.userId) {
      return authContext.lambda.userId;
    }
  }
  if (authContext && authContext.userId) {
    return authContext.userId;
  }
  throw new Error("Unauthorized: No user ID in token");
}
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  };
}
function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify(data)
  };
}
function errorResponse(message, statusCode = 500) {
  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message })
  };
}
async function createSession(event) {
  try {
    const userId = getUserId(event);
    const body = event.body ? JSON.parse(event.body) : {};
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const session = {
      id: (0, import_crypto.randomUUID)(),
      owner: userId,
      name: body.name,
      workSteps: body.workSteps,
      linkedCollectionId: body.linkedCollectionId,
      collectionContext: body.collectionContext,
      dataAccessLog: body.dataAccessLog,
      createdAt: now,
      updatedAt: now
    };
    await docClient.send(
      new import_lib_dynamodb.PutCommand({
        TableName: CHAT_SESSION_TABLE,
        Item: session
      })
    );
    return successResponse({ data: session }, 201);
  } catch (error) {
    console.error("Error creating session:", error);
    return errorResponse(error.message || "Failed to create session", 500);
  }
}
async function listSessions(event) {
  try {
    const userId = getUserId(event);
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 50;
    const nextToken = queryParams.nextToken;
    const result = await docClient.send(
      new import_lib_dynamodb.QueryCommand({
        TableName: CHAT_SESSION_TABLE,
        IndexName: "byOwner",
        // GSI on owner field
        KeyConditionExpression: "#owner = :owner",
        ExpressionAttributeNames: {
          "#owner": "owner"
        },
        ExpressionAttributeValues: {
          ":owner": userId
        },
        Limit: limit,
        ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, "base64").toString()) : void 0,
        ScanIndexForward: false
        // Most recent first
      })
    );
    const response = {
      data: result.Items || []
    };
    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64");
    }
    return successResponse(response);
  } catch (error) {
    console.error("Error listing sessions:", error);
    return errorResponse(error.message || "Failed to list sessions", 500);
  }
}
async function getSession(event) {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;
    if (!sessionId) {
      return errorResponse("Session ID is required", 400);
    }
    const result = await docClient.send(
      new import_lib_dynamodb.GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId }
      })
    );
    if (!result.Item) {
      return errorResponse("Session not found", 404);
    }
    if (result.Item.owner !== userId) {
      return errorResponse("Unauthorized: You do not own this session", 403);
    }
    return successResponse({ data: result.Item });
  } catch (error) {
    console.error("Error getting session:", error);
    return errorResponse(error.message || "Failed to get session", 500);
  }
}
async function updateSession(event) {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : {};
    if (!sessionId) {
      return errorResponse("Session ID is required", 400);
    }
    const existing = await docClient.send(
      new import_lib_dynamodb.GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId }
      })
    );
    if (!existing.Item) {
      return errorResponse("Session not found", 404);
    }
    if (existing.Item.owner !== userId) {
      return errorResponse("Unauthorized: You do not own this session", 403);
    }
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    const updatableFields = ["name", "workSteps", "linkedCollectionId", "collectionContext", "dataAccessLog"];
    updatableFields.forEach((field) => {
      if (body[field] !== void 0) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
      }
    });
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = (/* @__PURE__ */ new Date()).toISOString();
    if (updateExpressions.length === 1) {
      return successResponse({ data: existing.Item });
    }
    const result = await docClient.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );
    return successResponse({ data: result.Attributes });
  } catch (error) {
    console.error("Error updating session:", error);
    return errorResponse(error.message || "Failed to update session", 500);
  }
}
async function deleteSession(event) {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;
    if (!sessionId) {
      return errorResponse("Session ID is required", 400);
    }
    const existing = await docClient.send(
      new import_lib_dynamodb.GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId }
      })
    );
    if (!existing.Item) {
      return errorResponse("Session not found", 404);
    }
    if (existing.Item.owner !== userId) {
      return errorResponse("Unauthorized: You do not own this session", 403);
    }
    await docClient.send(
      new import_lib_dynamodb.DeleteCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId }
      })
    );
    return successResponse({ data: { id: sessionId, deleted: true } });
  } catch (error) {
    console.error("Error deleting session:", error);
    return errorResponse(error.message || "Failed to delete session", 500);
  }
}
async function getSessionMessages(event) {
  try {
    const userId = getUserId(event);
    const sessionId = event.pathParameters?.id;
    const queryParams = event.queryStringParameters || {};
    if (!sessionId) {
      return errorResponse("Session ID is required", 400);
    }
    const session = await docClient.send(
      new import_lib_dynamodb.GetCommand({
        TableName: CHAT_SESSION_TABLE,
        Key: { id: sessionId }
      })
    );
    if (!session.Item) {
      return errorResponse("Session not found", 404);
    }
    if (session.Item.owner !== userId) {
      return errorResponse("Unauthorized: You do not own this session", 403);
    }
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 100;
    const nextToken = queryParams.nextToken;
    const result = await docClient.send(
      new import_lib_dynamodb.QueryCommand({
        TableName: CHAT_MESSAGE_TABLE,
        IndexName: "chatMessagesByChatSessionIdAndCreatedAt",
        // Actual GSI name from Amplify
        KeyConditionExpression: "chatSessionId = :sessionId",
        ExpressionAttributeValues: {
          ":sessionId": sessionId
        },
        Limit: limit,
        ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, "base64").toString()) : void 0,
        ScanIndexForward: true
        // Chronological order
      })
    );
    const response = {
      data: result.Items || []
    };
    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64");
    }
    return successResponse(response);
  } catch (error) {
    console.error("Error getting session messages:", error);
    return errorResponse(error.message || "Failed to get session messages", 500);
  }
}
async function handler(event) {
  console.log("ChatSession handler invoked:", JSON.stringify(event, null, 2));
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: ""
    };
  }
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    if (method === "POST" && path === "/api/chat/sessions") {
      return await createSession(event);
    } else if (method === "GET" && path === "/api/chat/sessions") {
      return await listSessions(event);
    } else if (method === "GET" && path.match(/^\/api\/chat\/sessions\/[^/]+$/)) {
      return await getSession(event);
    } else if (method === "PATCH" && path.match(/^\/api\/chat\/sessions\/[^/]+$/)) {
      return await updateSession(event);
    } else if (method === "DELETE" && path.match(/^\/api\/chat\/sessions\/[^/]+$/)) {
      return await deleteSession(event);
    } else if (method === "GET" && path.match(/^\/api\/chat\/sessions\/[^/]+\/messages$/)) {
      return await getSessionMessages(event);
    } else {
      return errorResponse("Not found", 404);
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
