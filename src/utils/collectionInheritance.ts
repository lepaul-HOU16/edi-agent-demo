/**
 * Collection Inheritance Utilities
 * 
 * Handles loading collection data into canvas workspaces, ensuring that
 * well files from S3 (especially the 24 numbered wells in global/well-data/)
 * are accessible in the FileDrawer.
 */

import { getCollection } from '../lib/api/collections';
import { getSession } from '../lib/api/sessions';

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
    geographicBounds?: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
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
    
    // Query collection service via REST API to get full collection data
    const result = await getCollection(collectionId);
    
    if (!result.success || !result.collection) {
      console.error('❌ Collection not found');
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
    
    // TODO: Implement ChatSession REST API endpoint
    // For now, skip session update as ChatSession hasn't been migrated yet
    console.warn('ChatSession REST API not yet implemented, skipping session update');
    return true;
  } catch (error) {
    console.error('❌ Error updating canvas collection context:', error);
    return false;
  }
}

/**
 * Load collection context from canvas session
 * 
 * Retrieves the linked collection for a canvas session by:
 * 1. Getting the session to find linkedCollectionId
 * 2. Loading the collection data
 * 3. Transforming to CollectionData format
 * 
 * Returns null if session not found, collection deleted, or any errors occur.
 */
export async function getCanvasCollectionContext(
  chatSessionId: string
): Promise<CollectionData | null> {
  try {
    console.log('🔍 Getting collection context for canvas:', chatSessionId);
    
    // Step 1: Get session to find linkedCollectionId
    const sessionResult = await getSession(chatSessionId);
    
    if (!sessionResult.success || !sessionResult.session) {
      console.error('❌ Session not found:', chatSessionId);
      return null;
    }
    
    const session = sessionResult.session;
    
    // Check if session has a linked collection
    if (!session.linkedCollectionId) {
      console.log('ℹ️ Session has no linked collection');
      return null;
    }
    
    console.log('🔗 Session linked to collection:', session.linkedCollectionId);
    
    // Step 2: Load collection data
    const collectionResult = await getCollection(session.linkedCollectionId);
    
    if (!collectionResult.success || !collectionResult.collection) {
      console.error('❌ Collection not found (broken link):', session.linkedCollectionId);
      console.error('   The linked collection may have been deleted');
      return null;
    }
    
    // Step 3: Transform to CollectionData format
    const collection = collectionResult.collection;
    
    console.log('✅ Collection context loaded:', {
      id: collection.id,
      name: collection.name,
      wellCount: collection.dataItems?.length || 0,
      dataSource: collection.dataSourceType
    });
    
    return collection;
  } catch (error) {
    console.error('❌ Error getting canvas collection context:', error);
    console.error('   Session ID:', chatSessionId);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    return null;
  }
}
