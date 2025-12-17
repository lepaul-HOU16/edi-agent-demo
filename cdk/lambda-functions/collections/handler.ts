import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

interface Collection {
  id: string;
  name: string;
  description: string;
  dataSourceType: string;
  previewMetadata: any;
  dataItems: any[];
  createdAt: string;
  lastAccessedAt: string;
  owner: string;
}

// DynamoDB setup
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COLLECTIONS_TABLE_NAME || 'Collections-development';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log('🗂️ Collections API Handler:', JSON.stringify(event, null, 2));
  
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;
  
  try {
    // POST /api/collections/create
    if (path === '/api/collections/create' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, description, dataSourceType, previewMetadata, dataItems } = body;
      
      console.log('📁 Creating collection:', { name, dataSourceType, itemCount: dataItems?.length });
      
      // Parse previewMetadata if it's a string, otherwise use as object
      let parsedMetadata = previewMetadata || {};
      if (typeof previewMetadata === 'string') {
        try {
          parsedMetadata = JSON.parse(previewMetadata);
        } catch (e) {
          console.warn('Failed to parse previewMetadata string, using empty object');
          parsedMetadata = {};
        }
      }
      
      // Ensure wellCount is set from dataItems length
      parsedMetadata.wellCount = dataItems?.length || 0;
      parsedMetadata.dataPointCount = dataItems?.length || 0;
      
      const newCollection: Collection = {
        id: `collection_${Date.now()}`,
        name,
        description: description || '',
        dataSourceType,
        previewMetadata: parsedMetadata,
        dataItems: dataItems || [],
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        owner: 'current-user'
      };
      
      // Store in DynamoDB
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          collectionId: newCollection.id,
          ...newCollection
        }
      }));
      
      console.log('✅ Collection created in DynamoDB:', newCollection.id);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          collection: newCollection,
          collectionId: newCollection.id,
          message: 'Collection created successfully'
        }),
      };
    }
    
    // GET /api/collections/list
    if (path === '/api/collections/list' && method === 'GET') {
      // Query DynamoDB using owner GSI
      const result = await docClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'owner-createdAt-index',
        KeyConditionExpression: '#owner = :owner',
        ExpressionAttributeNames: {
          '#owner': 'owner'
        },
        ExpressionAttributeValues: {
          ':owner': 'current-user'
        },
        ScanIndexForward: false // Most recent first
      }));
      
      const collections = result.Items || [];
      console.log('📋 Listing collections from DynamoDB, count:', collections.length);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collections,
          count: collections.length
        }),
      };
    }
    
    // GET /api/collections/{id}
    if (path.startsWith('/api/collections/') && method === 'GET' && path !== '/api/collections/list') {
      const collectionId = path.split('/').pop();
      console.log('🔍 Getting collection from DynamoDB:', collectionId);
      
      // Get from DynamoDB
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        }
      }));
      
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          }),
        };
      }
      
      const collection = result.Item;
      
      // Update last accessed time
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        },
        UpdateExpression: 'SET lastAccessedAt = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString()
        }
      }));
      
      collection.lastAccessedAt = new Date().toISOString();
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          collection
        }),
      };
    }
    
    // PUT /api/collections/{id}
    if (path.startsWith('/api/collections/') && method === 'PUT') {
      const collectionId = path.split('/').pop();
      const body = JSON.parse(event.body || '{}');
      console.log('✏️ Updating collection in DynamoDB:', collectionId);
      
      // First check if collection exists
      const getResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        }
      }));
      
      if (!getResult.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          }),
        };
      }
      
      // Build update expression
      const updateParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};
      
      if (body.name) {
        updateParts.push('#name = :name');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = body.name;
      }
      if (body.description !== undefined) {
        updateParts.push('description = :description');
        expressionAttributeValues[':description'] = body.description;
      }
      if (body.dataSourceType) {
        updateParts.push('dataSourceType = :dataSourceType');
        expressionAttributeValues[':dataSourceType'] = body.dataSourceType;
      }
      if (body.previewMetadata) {
        updateParts.push('previewMetadata = :previewMetadata');
        expressionAttributeValues[':previewMetadata'] = body.previewMetadata;
      }
      if (body.dataItems) {
        updateParts.push('dataItems = :dataItems');
        expressionAttributeValues[':dataItems'] = body.dataItems;
      }
      
      // Always update lastAccessedAt
      updateParts.push('lastAccessedAt = :now');
      expressionAttributeValues[':now'] = new Date().toISOString();
      
      // Update in DynamoDB
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: expressionAttributeValues
      }));
      
      // Get updated collection
      const updatedResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        }
      }));
      
      console.log('✅ Collection updated in DynamoDB:', collectionId);
      
      // Note: Cache invalidation happens on frontend when it receives this response
      // Frontend will call collectionContextLoader.invalidateCache(collectionId)
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          collection: updatedResult.Item,
          message: 'Collection updated successfully',
          cacheInvalidated: true // Signal to frontend to invalidate cache
        }),
      };
    }
    
    // DELETE /api/collections/{id}
    if (path.startsWith('/api/collections/') && method === 'DELETE') {
      const collectionId = path.split('/').pop();
      console.log('🗑️ Deleting collection from DynamoDB:', collectionId);
      
      // Check if collection exists first
      const getResult = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        }
      }));
      
      if (!getResult.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          }),
        };
      }
      
      // Delete from DynamoDB
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        }
      }));
      
      console.log('✅ Collection deleted from DynamoDB:', collectionId);
      
      // Note: Cache invalidation happens on frontend when it receives this response
      // Frontend will call collectionContextLoader.invalidateCache(collectionId)
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Collection deleted successfully',
          collectionId, // Include ID so frontend knows which cache to invalidate
          cacheInvalidated: true
        }),
      };
    }
    
    // POST /api/collections/{id}/query
    if (path.includes('/query') && method === 'POST') {
      const collectionId = path.split('/')[3]; // /api/collections/{id}/query
      const body = JSON.parse(event.body || '{}');
      console.log('🔍 Querying collection from DynamoDB:', collectionId, body);
      
      // Get from DynamoDB
      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        }
      }));
      
      if (!result.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          }),
        };
      }
      
      const collection = result.Item;
      
      // Update last accessed time
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          collectionId
        },
        UpdateExpression: 'SET lastAccessedAt = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString()
        }
      }));
      
      // Return wells from data items
      const wells = (collection.dataItems || [])
        .filter((item: any) => item.type === 'wellbore' || item.type === 'trajectory')
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          s3Key: item.s3Key,
          osduId: item.osduId,
          type: item.type
        }));
      
      console.log(`✅ Found ${wells.length} wells in collection from DynamoDB`);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          wells,
          count: wells.length
        }),
      };
    }
    
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' }),
    };
    
  } catch (error) {
    console.error('❌ Collections API error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
