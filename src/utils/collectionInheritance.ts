/**
 * Collection Inheritance Utilities
 * 
 * Handles loading collection data into canvas workspaces, ensuring that
 * well files from S3 (especially the 24 numbered wells in global/well-data/)
 * are accessible in the FileDrawer.
 */

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";

const amplifyClient = generateClient<Schema>();

export interface CollectionData {
  id: string;
  name: string;
  description?: string;
  dataSourceType: string;
  dataItems: WellDataItem[];
  previewMetadata?: {
    wellCount?: number;
    dataPointCount?: number;
    dataSources?: string[];
    location?: string;
    wellRange?: string;
  };
}

export interface WellDataItem {
  id: string;
  name: string;
  type: string;
  dataSource: string;
  s3Key: string;
  osduId?: string;
  location?: string;
  operator?: string;
  depth?: string;
  curves?: string[];
}

/**
 * Load collection data for a canvas session
 * 
 * This function retrieves collection data and ensures that all well files
 * are accessible in the canvas workspace, particularly the 24 numbered wells
 * from global/well-data/ directory.
 */
export async function loadCollectionForCanvas(
  collectionId: string
): Promise<CollectionData | null> {
  try {
    console.log('🔍 Loading collection data for canvas:', collectionId);
    
    // Query collection service to get full collection data
    const response = await amplifyClient.queries.collectionQuery({
      operation: 'getCollection',
      collectionId: collectionId
    });
    
    if (!response.data) {
      console.error('❌ No data returned from collection query');
      return null;
    }
    
    const result = typeof response.data === 'string' 
      ? JSON.parse(response.data) 
      : response.data;
    
    if (!result.success || !result.collection) {
      console.error('❌ Collection not found:', result.error);
      return null;
    }
    
    const collection = result.collection;
    console.log('✅ Collection loaded:', {
      id: collection.id,
      name: collection.name,
      wellCount: collection.dataItems?.length || 0,
      dataSource: collection.dataSourceType
    });
    
    return collection;
  } catch (error) {
    console.error('❌ Error loading collection for canvas:', error);
    return null;
  }
}

/**
 * Get well file paths from collection data
 * 
 * Returns an array of S3 keys for all well files in the collection.
 * These paths can be used to verify file access in the FileDrawer.
 */
export function getWellFilePaths(collection: CollectionData): string[] {
  if (!collection.dataItems) {
    return [];
  }
  
  return collection.dataItems
    .filter(item => item.s3Key)
    .map(item => item.s3Key);
}

/**
 * Check if collection contains the 24 numbered wells from S3
 */
export function hasNumberedWells(collection: CollectionData): boolean {
  if (!collection.dataItems) {
    return false;
  }
  
  const numberedWellPattern = /WELL-\d{3}/;
  const numberedWells = collection.dataItems.filter(item => 
    numberedWellPattern.test(item.name)
  );
  
  return numberedWells.length >= 24;
}

/**
 * Get collection context summary for display
 */
export function getCollectionSummary(collection: CollectionData): string {
  const wellCount = collection.dataItems?.length || 0;
  const dataSource = collection.dataSourceType;
  const location = collection.previewMetadata?.location || 'Unknown';
  
  if (hasNumberedWells(collection)) {
    return `${wellCount} production wells from ${location} with complete LAS files in global/well-data/`;
  }
  
  return `${wellCount} wells from ${dataSource} data source`;
}

/**
 * Update canvas session with collection context
 * 
 * Stores collection data in the ChatSession for quick access and
 * ensures the linkedCollectionId is set.
 */
export async function updateCanvasCollectionContext(
  chatSessionId: string,
  collectionId: string,
  collectionData: CollectionData
): Promise<boolean> {
  try {
    console.log('🔗 Updating canvas with collection context:', {
      chatSessionId,
      collectionId,
      wellCount: collectionData.dataItems?.length || 0
    });
    
    const { data: updatedSession } = await amplifyClient.models.ChatSession.update({
      id: chatSessionId,
      linkedCollectionId: collectionId,
      collectionContext: collectionData as any
    } as any);
    
    if (updatedSession) {
      console.log('✅ Canvas updated with collection context');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error updating canvas collection context:', error);
    return false;
  }
}

/**
 * Load collection context from canvas session
 * 
 * Retrieves cached collection data from the ChatSession if available,
 * otherwise loads it fresh from the collection service.
 */
export async function getCanvasCollectionContext(
  chatSessionId: string
): Promise<CollectionData | null> {
  try {
    console.log('🔍 Getting collection context for canvas:', chatSessionId);
    
    // Get chat session
    const { data: session } = await amplifyClient.models.ChatSession.get({
      id: chatSessionId
    });
    
    if (!session) {
      console.log('⚠️ Chat session not found');
      return null;
    }
    
    // Check if session has linked collection
    if (!session.linkedCollectionId) {
      console.log('ℹ️ Canvas has no linked collection');
      return null;
    }
    
    // Check if we have cached collection context
    if (session.collectionContext) {
      console.log('✅ Using cached collection context');
      return session.collectionContext as CollectionData;
    }
    
    // Load fresh collection data
    console.log('🔄 Loading fresh collection data');
    const collectionData = await loadCollectionForCanvas(session.linkedCollectionId);
    
    if (collectionData) {
      // Cache it in the session
      await updateCanvasCollectionContext(
        chatSessionId,
        session.linkedCollectionId,
        collectionData
      );
    }
    
    return collectionData;
  } catch (error) {
    console.error('❌ Error getting canvas collection context:', error);
    return null;
  }
}
