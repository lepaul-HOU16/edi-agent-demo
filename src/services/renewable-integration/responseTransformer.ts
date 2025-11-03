/**
 * ResponseTransformer - Transforms AgentCore responses to EDI Platform artifacts
 * 
 * This transformer converts responses from the Python renewable energy backend
 * into artifact formats that the EDI Platform UI can render. It handles:
 * - Folium HTML map extraction and sanitization
 * - Matplotlib chart image extraction (base64)
 * - GeoJSON data mapping
 * - Graceful handling of missing/malformed data
 */

import {
  AgentCoreResponse,
  AgentCoreArtifact,
  TerrainArtifact,
  LayoutArtifact,
  SimulationArtifact,
  ReportArtifact,
  BaseArtifact,
  EnhancedWakeArtifact,
  EnhancedWindRoseArtifact,
} from './types';

/**
 * Transforms AgentCore responses to EDI Platform artifacts
 */
export class ResponseTransformer {
  /**
   * Transform AgentCore response to EDI Platform artifacts
   * 
   * @param response - Response from AgentCore
   * @returns Array of EDI Platform artifacts
   */
  static transformToEDIArtifacts(response: AgentCoreResponse): BaseArtifact[] {
    console.log('ResponseTransformer: Transforming response with', response.artifacts?.length || 0, 'artifacts');

    if (!response.artifacts || response.artifacts.length === 0) {
      console.log('ResponseTransformer: No artifacts to transform');
      return [];
    }

    const transformed: BaseArtifact[] = [];

    for (const artifact of response.artifacts) {
      try {
        const transformedArtifact = this.transformArtifact(artifact, response.projectId);
        if (transformedArtifact) {
          transformed.push(transformedArtifact);
        }
      } catch (error) {
        console.error('ResponseTransformer: Error transforming artifact:', error);
        // Continue with other artifacts
      }
    }

    console.log('ResponseTransformer: Transformed', transformed.length, 'artifacts');
    return transformed;
  }

  /**
   * Transform a single artifact based on its type
   * 
   * @param artifact - AgentCore artifact
   * @param projectId - Project ID from response
   * @returns Transformed EDI Platform artifact
   */
  private static transformArtifact(
    artifact: AgentCoreArtifact,
    projectId: string
  ): BaseArtifact | null {
    switch (artifact.type) {
      case 'terrain':
        return this.transformTerrainArtifact(artifact, projectId);
      case 'layout':
        return this.transformLayoutArtifact(artifact, projectId);
      case 'simulation':
        return this.transformSimulationArtifact(artifact, projectId);
      case 'report':
        return this.transformReportArtifact(artifact, projectId);
      default:
        console.warn('ResponseTransformer: Unknown artifact type:', artifact.type);
        return null;
    }
  }

  /**
   * Transform terrain analysis artifact
   * 
   * Extracts Folium HTML map and terrain metrics from AgentCore response.
   * Handles missing data gracefully with fallback values.
   * 
   * @param artifact - AgentCore terrain artifact
   * @param projectId - Project ID
   * @returns Terrain artifact for EDI Platform
   */
  static transformTerrainArtifact(
    artifact: AgentCoreArtifact,
    projectId: string
  ): TerrainArtifact {
    console.log('ResponseTransformer: Transforming terrain artifact');

    const data = artifact.data;
    const metadata = artifact.metadata;

    // Extract and sanitize Folium HTML
    const mapHtml = this.extractFoliumHtml(data.mapHtml);

    // Extract coordinates with validation
    const coordinates = this.extractCoordinates(data.metrics?.coordinates);

    // Extract suitability score (0-100)
    const suitabilityScore = this.extractNumericValue(
      data.metrics?.suitabilityScore,
      0,
      100,
      0
    );

    // Extract exclusion zones
    const exclusionZones = Array.isArray(data.metrics?.exclusionZones)
      ? data.metrics.exclusionZones
      : [];

    return {
      messageContentType: 'wind_farm_terrain_analysis',
      title: artifact.title || 'Wind Farm Terrain Analysis',
      subtitle: artifact.subtitle || `Site analysis for project ${projectId}`,
      projectId: projectId,
      coordinates: coordinates,
      suitabilityScore: suitabilityScore,
      exclusionZones: exclusionZones,
      mapHtml: mapHtml,
      riskAssessment: data.metrics?.riskAssessment,
      s3Url: metadata?.s3Url,
    };
  }

  /**
   * Transform layout artifact
   * 
   * Extracts Folium HTML map, GeoJSON data, and layout metrics from AgentCore response.
   * Validates turbine positions and capacity calculations.
   * 
   * @param artifact - AgentCore layout artifact
   * @param projectId - Project ID
   * @returns Layout artifact for EDI Platform
   */
  static transformLayoutArtifact(
    artifact: AgentCoreArtifact,
    projectId: string
  ): LayoutArtifact {
    console.log('ResponseTransformer: Transforming layout artifact');

    const data = artifact.data;
    const metadata = artifact.metadata;

    // Extract and sanitize Folium HTML
    const mapHtml = this.extractFoliumHtml(data.mapHtml);

    // Extract GeoJSON with validation
    const geojson = this.extractGeoJSON(data.geojson);

    // Extract turbine count
    const turbineCount = this.extractNumericValue(
      data.metrics?.turbineCount,
      0,
      1000,
      0
    );

    // Extract total capacity (MW)
    const totalCapacity = this.extractNumericValue(
      data.metrics?.totalCapacity,
      0,
      10000,
      0
    );

    // Extract turbine positions
    const turbinePositions = Array.isArray(data.metrics?.turbinePositions)
      ? data.metrics.turbinePositions.filter(this.isValidPosition)
      : [];

    return {
      messageContentType: 'wind_farm_layout',
      title: artifact.title || 'Wind Farm Layout Design',
      subtitle: artifact.subtitle || `${turbineCount} turbines, ${totalCapacity}MW`,
      projectId: projectId,
      turbineCount: turbineCount,
      totalCapacity: totalCapacity,
      turbinePositions: turbinePositions,
      mapHtml: mapHtml,
      geojson: geojson,
      layoutType: data.metrics?.layoutType,
      windAngle: data.metrics?.windAngle,
      spacing: data.metrics?.spacing,
      s3Url: metadata?.s3Url,
    };
  }

  /**
   * Transform simulation artifact
   * 
   * Extracts matplotlib chart images (base64) and performance metrics from AgentCore response.
   * Validates energy production calculations and capacity factors.
   * 
   * @param artifact - AgentCore simulation artifact
   * @param projectId - Project ID
   * @returns Simulation artifact for EDI Platform
   */
  static transformSimulationArtifact(
    artifact: AgentCoreArtifact,
    projectId: string
  ): SimulationArtifact {
    console.log('ResponseTransformer: Transforming simulation artifact');

    const data = artifact.data;
    const metadata = artifact.metadata;

    // Extract performance metrics with validation
    const annualEnergyProduction = this.extractNumericValue(
      data.metrics?.annualEnergyProduction,
      0,
      1000000,
      0
    );

    const capacityFactor = this.extractNumericValue(
      data.metrics?.capacityFactor,
      0,
      1,
      0
    );

    const wakeLosses = this.extractNumericValue(
      data.metrics?.wakeLosses,
      0,
      1,
      0
    );

    // Extract chart images (base64 encoded)
    const chartImages = {
      wakeMap: this.extractBase64Image(data.chartImage),
      performanceChart: this.extractBase64Image(data.metrics?.performanceChart),
    };

    return {
      messageContentType: 'wind_farm_simulation',
      title: artifact.title || 'Wind Farm Performance Simulation',
      subtitle: artifact.subtitle || `AEP: ${annualEnergyProduction.toFixed(0)} MWh/year`,
      projectId: projectId,
      performanceMetrics: {
        annualEnergyProduction: annualEnergyProduction,
        capacityFactor: capacityFactor,
        wakeLosses: wakeLosses,
        wakeEfficiency: data.metrics?.wakeEfficiency,
        grossAEP: data.metrics?.grossAEP,
        netAEP: data.metrics?.netAEP,
      },
      chartImages: chartImages,
      performanceByDirection: data.metrics?.performanceByDirection,
      optimizationRecommendations: Array.isArray(data.metrics?.optimizationRecommendations)
        ? data.metrics.optimizationRecommendations
        : [],
      s3Url: metadata?.s3Url,
    };
  }

  /**
   * Transform wake analysis artifact
   * 
   * Extracts wake analysis data including turbine wake losses and GeoJSON.
   * 
   * @param artifact - Wake analysis artifact
   * @returns Wake artifact for EDI Platform
   */
  private transformWakeArtifact(artifact: any): EnhancedWakeArtifact {
    console.log('🌪️ Transforming wake analysis artifact:', artifact);

    const data = artifact.data || {};
    const metrics = data.metrics || {};
    
    // Extract wake analysis metrics
    const annualEnergyLoss = metrics.annualEnergyLoss || 0;
    const affectedTurbines = metrics.affectedTurbines || 0;
    const totalTurbines = metrics.totalTurbines || 0;
    
    // Process GeoJSON data
    const geojson = data.geojson || { type: 'FeatureCollection', features: [] };
    
    return {
      messageContentType: 'wake_analysis',
      projectId: data.projectId,
      title: data.title || 'Wake Analysis',
      subtitle: data.subtitle || `${annualEnergyLoss.toFixed(1)}% energy loss`,
      coordinates: data.coordinates,
      metrics: {
        annualEnergyLoss,
        affectedTurbines,
        totalTurbines,
        wakeLosses: metrics.wakeLosses || []
      },
      geojson: geojson,
      message: data.message,
      visualization_available: data.visualization_available || false
    };
  }

  /**
   * Transform wind rose artifact
   * 
   * Extracts wind rose analysis data including wind directions and speeds.
   * 
   * @param artifact - Wind rose artifact
   * @returns Wind rose artifact for EDI Platform
   */
  private transformWindRoseArtifact(artifact: any): EnhancedWindRoseArtifact {
    console.log('🌹 Transforming wind rose artifact:', artifact);

    const data = artifact.data || {};
    const metrics = data.metrics || {};
    const windData = data.windData || { directions: [], chartData: {} };
    
    return {
      messageContentType: 'wind_rose',
      projectId: data.projectId,
      title: data.title || 'Wind Rose Analysis',
      subtitle: data.subtitle || `${metrics.avgWindSpeed?.toFixed(1)} m/s average`,
      coordinates: data.coordinates,
      metrics: {
        avgWindSpeed: metrics.avgWindSpeed || 0,
        maxWindSpeed: metrics.maxWindSpeed || 0,
        prevailingDirection: metrics.prevailingDirection || 'N',
        totalObservations: metrics.totalObservations || 0
      },
      windData: {
        directions: windData.directions || [],
        chartData: windData.chartData || {
          directions: [],
          frequencies: [],
          speeds: [],
          speed_distributions: []
        }
      },
      geojson: data.geojson || { type: 'FeatureCollection', features: [] },
      message: data.message || '',
      visualization_available: data.visualization_available || false
    };
  }

  /**
   * Transform report artifact
   * 
   * Extracts HTML report content and executive summary from AgentCore response.
   * Sanitizes HTML content for safe rendering.
   * 
   * @param artifact - AgentCore report artifact
   * @param projectId - Project ID
   * @returns Report artifact for EDI Platform
   */
  static transformReportArtifact(
    artifact: AgentCoreArtifact,
    projectId: string
  ): ReportArtifact {
    console.log('ResponseTransformer: Transforming report artifact');

    const data = artifact.data;
    const metadata = artifact.metadata;

    // Extract report HTML (could be from mapHtml or reportHtml field)
    const reportHtml = this.extractHtmlContent(
      data.mapHtml || data.metrics?.reportHtml
    );

    // Extract executive summary
    const executiveSummary = typeof data.metrics?.executiveSummary === 'string'
      ? data.metrics.executiveSummary
      : '';

    // Extract recommendations
    const recommendations = Array.isArray(data.metrics?.recommendations)
      ? data.metrics.recommendations
      : [];

    return {
      messageContentType: 'wind_farm_report',
      title: artifact.title || 'Wind Farm Executive Report',
      subtitle: artifact.subtitle || `Comprehensive analysis for project ${projectId}`,
      projectId: projectId,
      executiveSummary: executiveSummary,
      recommendations: recommendations,
      reportHtml: reportHtml,
      s3Url: metadata?.s3Url,
    };
  }

  // ============================================================================
  // Helper Methods for Data Extraction and Validation
  // ============================================================================

  /**
   * Extract and sanitize Folium HTML content
   * 
   * @param html - Raw HTML string from AgentCore
   * @returns Sanitized HTML or fallback message
   */
  private static extractFoliumHtml(html: any): string {
    if (typeof html !== 'string' || html.trim().length === 0) {
      console.warn('ResponseTransformer: No valid HTML content found');
      return '<div style="padding: 20px; text-align: center; color: #666;">Map visualization not available</div>';
    }

    // Basic sanitization - remove script tags for security
    const sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    return sanitized;
  }

  /**
   * Extract and sanitize generic HTML content
   * 
   * @param html - Raw HTML string
   * @returns Sanitized HTML or fallback message
   */
  private static extractHtmlContent(html: any): string {
    if (typeof html !== 'string' || html.trim().length === 0) {
      console.warn('ResponseTransformer: No valid HTML content found');
      return '<div style="padding: 20px; text-align: center; color: #666;">Content not available</div>';
    }

    // Basic sanitization
    const sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    return sanitized;
  }

  /**
   * Extract base64 encoded image
   * 
   * @param imageData - Base64 string or data URL
   * @returns Base64 data URL or undefined
   */
  private static extractBase64Image(imageData: any): string | undefined {
    if (typeof imageData !== 'string' || imageData.trim().length === 0) {
      return undefined;
    }

    // If already a data URL, return as-is
    if (imageData.startsWith('data:image/')) {
      return imageData;
    }

    // If raw base64, wrap in data URL
    if (this.isBase64(imageData)) {
      return `data:image/png;base64,${imageData}`;
    }

    console.warn('ResponseTransformer: Invalid image data format');
    return undefined;
  }

  /**
   * Check if string is valid base64
   * 
   * @param str - String to check
   * @returns True if valid base64
   */
  private static isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  /**
   * Extract and validate GeoJSON data
   * 
   * @param geojson - GeoJSON object from AgentCore
   * @returns Valid GeoJSON or empty FeatureCollection
   */
  private static extractGeoJSON(geojson: any): any {
    if (!geojson || typeof geojson !== 'object') {
      return { type: 'FeatureCollection', features: [] };
    }

    // Validate GeoJSON structure
    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      return geojson;
    }

    if (geojson.type === 'Feature') {
      return { type: 'FeatureCollection', features: [geojson] };
    }

    console.warn('ResponseTransformer: Invalid GeoJSON structure');
    return { type: 'FeatureCollection', features: [] };
  }

  /**
   * Extract and validate coordinates
   * 
   * @param coords - Coordinates object with lat/lng
   * @returns Valid coordinates or default (0, 0)
   */
  private static extractCoordinates(coords: any): { lat: number; lng: number } {
    if (!coords || typeof coords !== 'object') {
      return { lat: 0, lng: 0 };
    }

    const lat = this.extractNumericValue(coords.lat, -90, 90, 0);
    const lng = this.extractNumericValue(coords.lng, -180, 180, 0);

    return { lat, lng };
  }

  /**
   * Extract and validate numeric value with bounds
   * 
   * @param value - Value to extract
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @param defaultValue - Default value if invalid
   * @returns Validated numeric value
   */
  private static extractNumericValue(
    value: any,
    min: number,
    max: number,
    defaultValue: number
  ): number {
    const num = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(num) || !isFinite(num)) {
      return defaultValue;
    }

    // Clamp to bounds
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Validate turbine position object
   * 
   * @param position - Position object to validate
   * @returns True if valid position
   */
  private static isValidPosition(position: any): boolean {
    if (!position || typeof position !== 'object') {
      return false;
    }

    const hasLat = typeof position.lat === 'number' && isFinite(position.lat);
    const hasLng = typeof position.lng === 'number' && isFinite(position.lng);

    return hasLat && hasLng;
  }
}
