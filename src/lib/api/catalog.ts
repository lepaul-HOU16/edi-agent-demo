/**
 * Catalog REST API Client
 * 
 * Provides methods to interact with the CDK-deployed catalog API
 */

import { apiGet, apiPost } from './client';

export interface CatalogMapDataResponse {
  wells: {
    type: 'FeatureCollection';
    features: any[];
    metadata?: {
      totalFound: number;
      filtered: number;
      authorized: number;
      returned: number;
    };
  };
  seismic: {
    type: 'FeatureCollection';
    features: any[];
  };
  myWells: {
    type: 'FeatureCollection';
    features: any[];
  };
  metadata?: any;
}

export interface CatalogSearchRequest {
  prompt: string;
  existingContext?: any;
}

export interface CatalogSearchResponse {
  success: boolean;
  data?: any;
  results?: any;
  thoughtSteps?: any[];
  metadata?: any;
  error?: string;
}

/**
 * Get catalog map data (wells and seismic)
 */
export async function getMapData(maxResults: number = 100): Promise<CatalogMapDataResponse> {
  try {
    console.log(`[Catalog API] Fetching map data (maxResults: ${maxResults})`);
    
    const response = await apiGet<CatalogMapDataResponse>(
      `/api/catalog/map-data?maxResults=${maxResults}`
    );
    
    console.log('[Catalog API] Map data received:', {
      wellsCount: response.wells?.features?.length,
      seismicCount: response.seismic?.features?.length,
      myWellsCount: response.myWells?.features?.length,
      metadata: response.metadata,
    });
    
    return response;
  } catch (error: any) {
    console.error('[Catalog API] Get map data error:', error);
    throw error;
  }
}

/**
 * Search catalog with intelligent query processing
 */
export async function searchCatalog(
  prompt: string,
  existingContext?: any
): Promise<CatalogSearchResponse> {
  try {
    console.log('[Catalog API] Searching catalog:', { prompt, hasContext: !!existingContext });
    
    const response = await apiPost<CatalogSearchResponse>('/api/catalog/search', {
      prompt,
      existingContext,
    });
    
    console.log('[Catalog API] Search results received:', {
      hasResults: !!response.results,
      thoughtStepsCount: response.thoughtSteps?.length,
    });
    
    return response;
  } catch (error: any) {
    console.error('[Catalog API] Search catalog error:', error);
    throw error;
  }
}
