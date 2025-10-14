/**
 * VisualizationDataParser - Extract and organize visualization data from backend responses
 * 
 * This utility parses renewable energy backend responses to extract all available
 * visualizations including wind roses, wake analysis, performance charts, and interactive maps.
 */

export interface VisualizationData {
  // Wind analysis
  wind_rose?: string;
  seasonal_analysis?: string;
  variability_analysis?: string;
  
  // Performance analysis
  performance_charts?: string[];
  monthly_production?: string;
  capacity_factor_analysis?: string;
  
  // Wake analysis
  wake_analysis?: string;
  wake_heat_map?: string;
  wake_deficit_heatmap?: string;
  
  // Terrain analysis
  elevation_profile?: string;
  accessibility_analysis?: string;
  topographic_map?: string;
  slope_analysis?: string;
  
  // Interactive maps
  interactive_map?: string;
  
  // Reports and exports
  complete_report?: string;
  export_package?: string;
}

export interface CategorizedVisualizations {
  wind_analysis: {
    wind_rose?: string;
    seasonal_analysis?: string;
    variability_analysis?: string;
    [key: string]: string | string[] | undefined;
  };
  performance_analysis: {
    performance_charts?: string[];
    monthly_production?: string;
    capacity_factor_analysis?: string;
    [key: string]: string | string[] | undefined;
  };
  wake_analysis: {
    wake_analysis?: string;
    wake_heat_map?: string;
    wake_deficit_heatmap?: string;
    [key: string]: string | string[] | undefined;
  };
  terrain_analysis: {
    elevation_profile?: string;
    accessibility_analysis?: string;
    topographic_map?: string;
    slope_analysis?: string;
    [key: string]: string | string[] | undefined;
  };
  interactive_maps: {
    interactive_map?: string;
    [key: string]: string | string[] | undefined;
  };
  reports: {
    complete_report?: string;
    export_package?: string;
    [key: string]: string | string[] | undefined;
  };
  unknown?: {
    [key: string]: string | string[];
  };
}

export class VisualizationDataParser {
  /**
   * Parse visualization data from backend response
   * Handles both new visualizations object and legacy formats
   */
  static parseVisualizationData(responseData: any): VisualizationData {
    if (!responseData) {
      return {};
    }

    const visualizations = responseData.visualizations || {};
    const result: VisualizationData = {};

    // Extract wind analysis visualizations
    if (visualizations.wind_rose) {
      result.wind_rose = visualizations.wind_rose;
    }
    if (visualizations.seasonal_analysis) {
      result.seasonal_analysis = visualizations.seasonal_analysis;
    }
    if (visualizations.variability_analysis) {
      result.variability_analysis = visualizations.variability_analysis;
    }

    // Extract performance analysis visualizations
    if (visualizations.performance_charts && Array.isArray(visualizations.performance_charts)) {
      result.performance_charts = visualizations.performance_charts.filter(url => url);
    }
    if (visualizations.monthly_production) {
      result.monthly_production = visualizations.monthly_production;
    }
    if (visualizations.capacity_factor_analysis) {
      result.capacity_factor_analysis = visualizations.capacity_factor_analysis;
    }

    // Extract wake analysis visualizations
    if (visualizations.wake_analysis) {
      result.wake_analysis = visualizations.wake_analysis;
    }
    if (visualizations.wake_heat_map) {
      result.wake_heat_map = visualizations.wake_heat_map;
    }
    if (visualizations.wake_deficit_heatmap) {
      result.wake_deficit_heatmap = visualizations.wake_deficit_heatmap;
    }

    // Extract terrain analysis visualizations
    if (visualizations.elevation_profile) {
      result.elevation_profile = visualizations.elevation_profile;
    }
    if (visualizations.accessibility_analysis) {
      result.accessibility_analysis = visualizations.accessibility_analysis;
    }
    if (visualizations.topographic_map) {
      result.topographic_map = visualizations.topographic_map;
    }
    if (visualizations.slope_analysis) {
      result.slope_analysis = visualizations.slope_analysis;
    }

    // Extract interactive maps
    if (visualizations.interactive_map) {
      result.interactive_map = visualizations.interactive_map;
    } else if (responseData.mapUrl) {
      // Fallback to legacy mapUrl
      result.interactive_map = responseData.mapUrl;
    }

    // Extract reports and exports
    if (visualizations.complete_report) {
      result.complete_report = visualizations.complete_report;
    }
    if (visualizations.export_package) {
      result.export_package = visualizations.export_package;
    }

    // Handle legacy chartImages format for backward compatibility
    const chartImages = responseData.chartImages;
    if (chartImages && !result.wake_analysis && chartImages.wakeMap) {
      result.wake_analysis = chartImages.wakeMap;
    }
    if (chartImages && !result.performance_charts?.length && chartImages.performanceChart) {
      result.performance_charts = [chartImages.performanceChart];
    }

    return result;
  }

  /**
   * Get list of available visualization types
   */
  static getAvailableVisualizations(data: VisualizationData): string[] {
    const available: string[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          available.push(key);
        } else if (typeof value === 'string' && value.trim() !== '') {
          available.push(key);
        }
      }
    });

    return available;
  }

  /**
   * Organize visualizations by category for better UI organization
   */
  static organizeVisualizationsByCategory(data: VisualizationData): CategorizedVisualizations {
    return {
      wind_analysis: {
        wind_rose: data.wind_rose,
        seasonal_analysis: data.seasonal_analysis,
        variability_analysis: data.variability_analysis
      },
      performance_analysis: {
        performance_charts: data.performance_charts,
        monthly_production: data.monthly_production,
        capacity_factor_analysis: data.capacity_factor_analysis
      },
      wake_analysis: {
        wake_analysis: data.wake_analysis,
        wake_heat_map: data.wake_heat_map,
        wake_deficit_heatmap: data.wake_deficit_heatmap
      },
      terrain_analysis: {
        elevation_profile: data.elevation_profile,
        accessibility_analysis: data.accessibility_analysis,
        topographic_map: data.topographic_map,
        slope_analysis: data.slope_analysis
      },
      interactive_maps: {
        interactive_map: data.interactive_map
      },
      reports: {
        complete_report: data.complete_report,
        export_package: data.export_package
      }
    };
  }

  /**
   * Enhanced categorization that includes unknown visualization types
   * Automatically categorizes unknown visualizations based on naming patterns
   */
  static organizeVisualizationsWithUnknown(responseData: any): CategorizedVisualizations & { unknown?: Record<string, any> } {
    const data = this.parseVisualizationDataWithUnknown(responseData);
    const knownCategories = this.organizeVisualizationsByCategory(data);
    const unknownData = this.detectUnknownVisualizations(responseData);
    
    if (Object.keys(unknownData).length === 0) {
      return knownCategories;
    }

    // Categorize unknown visualizations based on naming patterns
    const categorizedUnknown: Record<string, Record<string, any>> = {
      wind_analysis: {},
      performance_analysis: {},
      wake_analysis: {},
      terrain_analysis: {},
      interactive_maps: {},
      reports: {},
      unknown: {}
    };

    Object.entries(unknownData).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      
      if (lowerKey.includes('wind') || lowerKey.includes('rose') || lowerKey.includes('seasonal')) {
        categorizedUnknown.wind_analysis[key] = value;
      } else if (lowerKey.includes('performance') || lowerKey.includes('production') || lowerKey.includes('capacity')) {
        categorizedUnknown.performance_analysis[key] = value;
      } else if (lowerKey.includes('wake') || lowerKey.includes('deficit')) {
        categorizedUnknown.wake_analysis[key] = value;
      } else if (lowerKey.includes('terrain') || lowerKey.includes('elevation') || lowerKey.includes('slope') || lowerKey.includes('topographic')) {
        categorizedUnknown.terrain_analysis[key] = value;
      } else if (lowerKey.includes('map') || lowerKey.includes('interactive')) {
        categorizedUnknown.interactive_maps[key] = value;
      } else if (lowerKey.includes('report') || lowerKey.includes('export') || lowerKey.includes('summary')) {
        categorizedUnknown.reports[key] = value;
      } else {
        categorizedUnknown.unknown[key] = value;
      }
    });

    // Merge with known categories
    const result = { ...knownCategories };
    Object.entries(categorizedUnknown).forEach(([category, items]) => {
      if (Object.keys(items).length > 0) {
        if (category === 'unknown') {
          result.unknown = items;
        } else {
          result[category as keyof CategorizedVisualizations] = {
            ...result[category as keyof CategorizedVisualizations],
            ...items
          };
        }
      }
    });

    return result;
  }

  /**
   * Check if any visualizations are available in a category
   */
  static hasVisualizationsInCategory(categorized: CategorizedVisualizations, category: keyof CategorizedVisualizations): boolean {
    const categoryData = categorized[category];
    
    return Object.values(categoryData).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }

  /**
   * Get visualization count for display purposes
   */
  static getVisualizationCount(data: VisualizationData): number {
    let count = 0;
    
    Object.values(data).forEach(value => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          count += value.length;
        } else if (typeof value === 'string' && value.trim() !== '') {
          count += 1;
        }
      }
    });

    return count;
  }

  /**
   * Dynamically detect new visualization types from backend response
   * This allows the frontend to automatically handle new visualization types
   * without requiring code changes
   */
  static detectUnknownVisualizations(responseData: any): Record<string, string | string[]> {
    const unknownVisualizations: Record<string, string | string[]> = {};
    const visualizations = responseData.visualizations || {};
    
    // Get all known visualization keys
    const knownKeys = new Set([
      'wind_rose', 'seasonal_analysis', 'variability_analysis',
      'performance_charts', 'monthly_production', 'capacity_factor_analysis',
      'wake_analysis', 'wake_heat_map', 'wake_deficit_heatmap',
      'elevation_profile', 'accessibility_analysis', 'topographic_map', 'slope_analysis',
      'interactive_map', 'complete_report', 'export_package'
    ]);

    // Find any visualization keys that aren't in our known set
    Object.entries(visualizations).forEach(([key, value]) => {
      if (!knownKeys.has(key) && value) {
        if (typeof value === 'string' && value.trim() !== '') {
          unknownVisualizations[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          unknownVisualizations[key] = value.filter(v => typeof v === 'string' && v.trim() !== '');
        }
      }
    });

    return unknownVisualizations;
  }

  /**
   * Enhanced parsing that includes unknown visualization types
   */
  static parseVisualizationDataWithUnknown(responseData: any): VisualizationData & Record<string, any> {
    const knownData = this.parseVisualizationData(responseData);
    const unknownData = this.detectUnknownVisualizations(responseData);
    
    return {
      ...knownData,
      ...unknownData
    };
  }

  /**
   * Graceful fallback for responses without visualizations object
   * Ensures compatibility with older backend versions
   */
  static handleLegacyResponse(responseData: any): VisualizationData {
    const result: VisualizationData = {};
    
    // Handle legacy chartImages format
    if (responseData.chartImages) {
      const chartImages = responseData.chartImages;
      if (chartImages.wakeMap) {
        result.wake_analysis = chartImages.wakeMap;
      }
      if (chartImages.performanceChart) {
        result.performance_charts = [chartImages.performanceChart];
      }
    }
    
    // Handle legacy mapUrl
    if (responseData.mapUrl) {
      result.interactive_map = responseData.mapUrl;
    }
    
    // Handle legacy s3Url as fallback visualization
    if (responseData.s3Url && !Object.keys(result).length) {
      result.complete_report = responseData.s3Url;
    }
    
    return result;
  }

  /**
   * Safe parsing that handles both new and legacy response formats
   */
  static safeParseVisualizationData(responseData: any): VisualizationData {
    if (!responseData) {
      return {};
    }
    
    // Try new format first
    if (responseData.visualizations && typeof responseData.visualizations === 'object') {
      return this.parseVisualizationData(responseData);
    }
    
    // Fall back to legacy format
    return this.handleLegacyResponse(responseData);
  }

  /**
   * Detect response format version
   */
  static detectResponseVersion(responseData: any): 'v1' | 'v2' | 'unknown' {
    if (!responseData || typeof responseData !== 'object') {
      return 'unknown';
    }
    
    // v2 format has visualizations object
    if (responseData.visualizations && typeof responseData.visualizations === 'object') {
      return 'v2';
    }
    
    // v1 format has chartImages or mapUrl
    if (responseData.chartImages || responseData.mapUrl) {
      return 'v1';
    }
    
    return 'unknown';
  }

  /**
   * Convert legacy response format to new format
   */
  static migrateLegacyResponse(legacyResponse: any): any {
    if (!legacyResponse || typeof legacyResponse !== 'object') {
      return legacyResponse;
    }
    
    const version = this.detectResponseVersion(legacyResponse);
    if (version === 'v2') {
      return legacyResponse; // Already in new format
    }
    
    // Create migrated response
    const migratedResponse = { ...legacyResponse };
    
    // Convert chartImages to visualizations object
    if (legacyResponse.chartImages) {
      migratedResponse.visualizations = {};
      
      if (legacyResponse.chartImages.wakeMap) {
        migratedResponse.visualizations.wake_analysis = legacyResponse.chartImages.wakeMap;
      }
      if (legacyResponse.chartImages.performanceChart) {
        migratedResponse.visualizations.performance_charts = [legacyResponse.chartImages.performanceChart];
      }
      
      // Keep legacy format for backward compatibility
      // delete migratedResponse.chartImages;
    }
    
    // Convert mapUrl to visualizations
    if (legacyResponse.mapUrl && !migratedResponse.visualizations?.interactive_map) {
      if (!migratedResponse.visualizations) {
        migratedResponse.visualizations = {};
      }
      migratedResponse.visualizations.interactive_map = legacyResponse.mapUrl;
    }
    
    return migratedResponse;
  }

  /**
   * Batch migrate multiple responses
   */
  static migrateMultipleResponses(responses: any[]): any[] {
    if (!Array.isArray(responses)) {
      return responses;
    }
    
    return responses.map(response => this.migrateLegacyResponse(response));
  }

  /**
   * Extract HTML content for maps (prioritize mapHtml over URLs)
   */
  static getMapHtmlContent(responseData: any): string | undefined {
    // Prioritize inline HTML content over URLs for better performance
    if (responseData.mapHtml && typeof responseData.mapHtml === 'string') {
      return responseData.mapHtml;
    }
    
    // No inline HTML available
    return undefined;
  }

  /**
   * Validate visualization URL format
   */
  static isValidVisualizationUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      // Check for common visualization file extensions
      const validExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.html'];
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      );
      
      // Check for S3 URLs or other valid domains
      const isS3Url = urlObj.hostname.includes('s3') || urlObj.hostname.includes('amazonaws.com');
      const isValidDomain = isS3Url || urlObj.hostname.includes('localhost') || urlObj.hostname.includes('127.0.0.1');
      
      return hasValidExtension && isValidDomain;
    } catch {
      return false;
    }
  }

  /**
   * Clean and validate visualization data
   */
  static cleanVisualizationData(data: VisualizationData): VisualizationData {
    const cleaned: VisualizationData = {};

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const validUrls = value.filter(url => this.isValidVisualizationUrl(url));
        if (validUrls.length > 0) {
          (cleaned as any)[key] = validUrls;
        }
      } else if (typeof value === 'string' && this.isValidVisualizationUrl(value)) {
        (cleaned as any)[key] = value;
      }
    });

    return cleaned;
  }
}