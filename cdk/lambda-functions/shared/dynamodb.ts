/**
 * DynamoDB helper utilities
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

// Create DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Get item from DynamoDB
 */
export async function getItem<T>(tableName: string, key: Record<string, any>): Promise<T | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: key,
      })
    );

    return (result.Item as T) || null;
  } catch (error) {
    console.error('DynamoDB getItem error:', error);
    throw error;
  }
}

/**
 * Put item into DynamoDB
 */
export async function putItem<T>(tableName: string, item: T): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item as Record<string, any>,
      })
    );
  } catch (error) {
    console.error('DynamoDB putItem error:', error);
    throw error;
  }
}

/**
 * Update item in DynamoDB
 */
export async function updateItem(
  tableName: string,
  key: Record<string, any>,
  updates: Record<string, any>
): Promise<void> {
  try {
    const updateExpression = Object.keys(updates)
      .map((k, i) => `#attr${i} = :val${i}`)
      .join(', ');

    const expressionAttributeNames = Object.keys(updates).reduce(
      (acc, k, i) => ({ ...acc, [`#attr${i}`]: k }),
      {}
    );

    const expressionAttributeValues = Object.values(updates).reduce(
      (acc, v, i) => ({ ...acc, [`:val${i}`]: v }),
      {}
    );

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );
  } catch (error) {
    console.error('DynamoDB updateItem error:', error);
    throw error;
  }
}

/**
 * Delete item from DynamoDB
 */
export async function deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: key,
      })
    );
  } catch (error) {
    console.error('DynamoDB deleteItem error:', error);
    throw error;
  }
}

/**
 * Query items from DynamoDB
 */
export async function queryItems<T>(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>,
  indexName?: string
): Promise<T[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        IndexName: indexName,
      })
    );

    return (result.Items as T[]) || [];
  } catch (error) {
    console.error('DynamoDB queryItems error:', error);
    throw error;
  }
}

/**
 * Scan items from DynamoDB (use sparingly)
 */
export async function scanItems<T>(tableName: string, limit?: number): Promise<T[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        Limit: limit,
      })
    );

    return (result.Items as T[]) || [];
  } catch (error) {
    console.error('DynamoDB scanItems error:', error);
    throw error;
  }
}
