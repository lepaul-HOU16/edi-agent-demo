/**
 * Collection-Driven Context Loading Service
 * Replaces S3tools with intelligent collection-based AI context
 * Phase 3: Advanced enterprise feature
 */

import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { isCollectionStateRestorationEnabled, isCollectionAnalyticsEnabled } from './featureFlags';

const amplifyClient = generateClient<Schema>();

interface CollectionContext {
  collectionId: string;
  name: string;
  dataItems: any[];
  queryMetadata: any;
  savedState: any;
  previewMetadata: any;
  wellData?: any[];
  geographicContext?: {
    bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number };
    center: [number, number];
    zoom: number;
  };
  analyticsContext?: {
    dataQuality: string;
    completeness: number;
    keyMetrics: any;
  };
}

interface ContextLoadResult {
  success: boolean;
  context?: CollectionContext;
  fallbackToS3Tools?: boolean;
  error?: string;
  loadTime?: number;
}

class CollectionContextService {
  private static instance: CollectionContextService;
  private contextCache = new Map<string, CollectionContext>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): CollectionContextService {
    if (!CollectionContextService.instance) {
      CollectionContextService.instance = new CollectionContextService();
    }
    return CollectionContextService.instance;
  }

  /**
   * Load context for chat session - collection-first approach
   */
  async loadContextForChat(chatSessionId: string, userContext: any): Promise<ContextLoadResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Loading context for chat session:', chatSessionId);

      // Check if state restoration is enabled for this user
      const stateRestorationEnabled = isCollectionStateRestorationEnabled(userContext);
      const analyticsEnabled = isCollectionAnalyticsEnabled(userContext);

      // 1. First try to get chat session with collection link
      const chatSession = await this.getChatSession(chatSessionId);
      
      if (chatSession?.linkedCollectionId) {
        console.log('🗂️ Found collection-linked chat session:', chatSession.linkedCollectionId);
        
        // 2. Load collection context
        const collectionContext = await this.loadCollectionContext(
          chatSession.linkedCollectionId, 
          userContext,
          { enableStateRestoration: stateRestorationEnabled, enableAnalytics: analyticsEnabled }
        );
        
        if (collectionContext.success) {
          console.log('✅ Collection context loaded successfully');
          return {
            success: true,
            context: collectionContext.context,
            loadTime: Date.now() - startTime
          };
        }
      }

      console.log('⚠️ No collection context available, checking for fallback...');
      
      // 3. Fallback to S3tools for backwards compatibility
      return {
        success: true,
        fallbackToS3Tools: true,
        loadTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Error loading collection context:', error);
      return {
        success: false,
        fallbackToS3Tools: true, // Always provide fallback
        error: error instanceof Error ? error.message : String(error),
        loadTime: Date.now() - startTime
      };
    }
  }

  /**
   * Load full collection context with caching
   */
  private async loadCollectionContext(
    collectionId: string, 
    userContext: any, 
    options: { enableStateRestoration?: boolean; enableAnalytics?: boolean } = {}
  ): Promise<{ success: boolean; context?: CollectionContext }> {
    
    try {
      // Check cache first
      const cached = this.getCachedContext(collectionId);
      if (cached) {
        console.log('📋 Using cached collection context');
        return { success: true, context: cached };
      }

      // Load from collection service
      const result = await amplifyClient.queries.queryCollections({
        operation: 'getState',
        collectionId: collectionId
      });

      if (result.data) {
        const parsedResult = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        
        if (parsedResult.success) {
          const collection = parsedResult.collection;
          
          // Build enhanced context
          const context: CollectionContext = {
            collectionId,
            name: collection.name,
            dataItems: collection.dataItems || [],
            queryMetadata: collection.queryMetadata || {},
            savedState: collection.savedState || {},
            previewMetadata: collection.previewMetadata || {},
            
            // Phase 3: Enhanced context loading
            wellData: this.transformDataItemsToWellData(collection.dataItems || []),
            geographicContext: this.buildGeographicContext(collection.queryMetadata, collection.savedState),
            analyticsContext: options.enableAnalytics ? await this.buildAnalyticsContext(collection) : undefined
          };

          // Cache the context
          this.setCachedContext(collectionId, context);

          console.log('✅ Collection context built successfully:', {
            collectionName: context.name,
            wellCount: context.dataItems.length,
            hasGeographicContext: !!context.geographicContext,
            hasAnalytics: !!context.analyticsContext
          });

          return { success: true, context };
        }
      }

      return { success: false };

    } catch (error) {
      console.error('Error loading collection context:', error);
      return { success: false };
    }
  }

  /**
   * Transform collection data items to well data format for AI agents
   */
  private transformDataItemsToWellData(dataItems: any[]): any[] {
    return dataItems.map(item => ({
      name: item.name || 'Unknown Well',
      location: item.location || 'Unknown',
      depth: item.depth || 'Unknown',
      operator: item.operator || 'Unknown',
      coordinates: item.coordinates || [0, 0],
      type: item.type || 'Well',
      // Add additional context for AI
      metadata: {
        source: 'collection',
        category: item.category || 'curated_data',
        dataQuality: 'verified' // Collections contain verified, curated data
      }
    }));
  }

  /**
   * Build geographic context from collection metadata
   */
  private buildGeographicContext(queryMetadata: any, savedState: any): any {
    try {
      return {
        bounds: queryMetadata?.bounds || savedState?.geographicBounds,
        center: savedState?.mapCenter || [106.9, 10.2],
        zoom: savedState?.mapZoom || 8,
        region: this.inferRegion(queryMetadata?.bounds),
        spatialAnalysis: {
          wellDensity: this.calculateWellDensity(queryMetadata),
          coverage: this.calculateGeographicCoverage(queryMetadata?.bounds)
        }
      };
    } catch (error) {
      console.warn('Failed to build geographic context:', error);
      return null;
    }
  }

  /**
   * Build analytics context for enhanced AI responses
   */
  private async buildAnalyticsContext(collection: any): Promise<any> {
    try {
      const dataItems = collection.dataItems || [];
      const operators = [...new Set(dataItems.map((item: any) => item.operator).filter(Boolean))];
      const depths = dataItems.map((item: any) => parseFloat(item.depth)).filter(d => !isNaN(d));
      
      return {
        dataQuality: this.assessDataQuality(dataItems),
        completeness: this.calculateCompleteness(dataItems),
        keyMetrics: {
          wellCount: dataItems.length,
          operatorCount: operators.length,
          depthRange: depths.length > 0 ? {
            min: Math.min(...depths),
            max: Math.max(...depths),
            avg: depths.reduce((a, b) => a + b, 0) / depths.length
          } : null,
          dataTypes: this.identifyDataTypes(dataItems),
          lastUpdated: collection.updatedAt
        },
        recommendations: this.generateDataRecommendations(collection)
      };
    } catch (error) {
      console.warn('Failed to build analytics context:', error);
      return null;
    }
  }

  /**
   * Get chat session information
   */
  private async getChatSession(chatSessionId: string): Promise<any> {
    try {
      const result = await amplifyClient.models.ChatSession.get({ id: chatSessionId });
      return result.data;
    } catch (error) {
      console.warn('Could not retrieve chat session:', error);
      return null;
    }
  }

  /**
   * Cache management
   */
  private getCachedContext(collectionId: string): CollectionContext | null {
    const cached = this.contextCache.get(collectionId);
    const expiry = this.cacheExpiry.get(collectionId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Clean up expired cache
    this.contextCache.delete(collectionId);
    this.cacheExpiry.delete(collectionId);
    return null;
  }

  private setCachedContext(collectionId: string, context: CollectionContext): void {
    this.contextCache.set(collectionId, context);
    this.cacheExpiry.set(collectionId, Date.now() + this.CACHE_TTL);
  }

  /**
   * Utility functions for context enhancement
   */
  private inferRegion(bounds: any): string {
    if (!bounds) return 'Unknown Region';
    
    // Simple region inference based on coordinates
    const { minLon, maxLon, minLat, maxLat } = bounds;
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    
    // Vietnam/South China Sea region
    if (centerLon > 105 && centerLon < 115 && centerLat > 8 && centerLat < 15) {
      return 'South China Sea / Cuu Long Basin';
    }
    
    // Add more regions as needed
    return `${centerLat.toFixed(2)}°N, ${centerLon.toFixed(2)}°E`;
  }

  private calculateWellDensity(queryMetadata: any): number {
    if (!queryMetadata?.bounds || !queryMetadata?.wellCount) return 0;
    
    const { minLon, maxLon, minLat, maxLat } = queryMetadata.bounds;
    const area = (maxLon - minLon) * (maxLat - minLat);
    return queryMetadata.wellCount / area;
  }

  private calculateGeographicCoverage(bounds: any): string {
    if (!bounds) return 'Unknown';
    
    const { minLon, maxLon, minLat, maxLat } = bounds;
    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;
    
    if (lonSpan < 0.5 && latSpan < 0.5) return 'Local';
    if (lonSpan < 2 && latSpan < 2) return 'Regional';
    return 'Multi-Regional';
  }

  private assessDataQuality(dataItems: any[]): string {
    const hasCoordinates = dataItems.filter(item => item.coordinates).length;
    const hasDepth = dataItems.filter(item => item.depth && item.depth !== 'Unknown').length;
    const hasOperator = dataItems.filter(item => item.operator && item.operator !== 'Unknown').length;
    
    const totalItems = dataItems.length;
    if (totalItems === 0) return 'No Data';
    
    const completenessScore = ((hasCoordinates + hasDepth + hasOperator) / (totalItems * 3)) * 100;
    
    if (completenessScore > 80) return 'High';
    if (completenessScore > 60) return 'Good';
    if (completenessScore > 40) return 'Fair';
    return 'Poor';
  }

  private calculateCompleteness(dataItems: any[]): number {
    if (dataItems.length === 0) return 0;
    
    const requiredFields = ['name', 'location', 'depth', 'operator'];
    let totalFields = 0;
    let filledFields = 0;
    
    dataItems.forEach(item => {
      requiredFields.forEach(field => {
        totalFields++;
        if (item[field] && item[field] !== 'Unknown') {
          filledFields++;
        }
      });
    });
    
    return Math.round((filledFields / totalFields) * 100);
  }

  private identifyDataTypes(dataItems: any[]): string[] {
    const types = new Set<string>();
    
    dataItems.forEach(item => {
      if (item.type) types.add(item.type);
      if (item.category) types.add(item.category);
    });
    
    return Array.from(types).filter(Boolean);
  }

  private generateDataRecommendations(collection: any): string[] {
    const recommendations: string[] = [];
    const dataItems = collection.dataItems || [];
    
    // Check for missing data
    const missingCoordinates = dataItems.filter((item: any) => !item.coordinates).length;
    if (missingCoordinates > 0) {
      recommendations.push(`Add geographic coordinates for ${missingCoordinates} wells`);
    }
    
    const missingDepth = dataItems.filter((item: any) => !item.depth || item.depth === 'Unknown').length;
    if (missingDepth > 0) {
      recommendations.push(`Complete depth information for ${missingDepth} wells`);
    }
    
    // Check for data enhancement opportunities
    if (dataItems.length < 10) {
      recommendations.push('Consider adding more wells for comprehensive analysis');
    }
    
    if (dataItems.length > 100) {
      recommendations.push('Consider organizing into smaller, focused collections');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const collectionContextLoader = CollectionContextService.getInstance();

// Convenience function for chat context loading
export async function loadChatContext(chatSessionId: string, userContext?: any): Promise<ContextLoadResult> {
  const context = userContext || { userId: 'current-user' };
  return await collectionContextLoader.loadContextForChat(chatSessionId, context);
}
