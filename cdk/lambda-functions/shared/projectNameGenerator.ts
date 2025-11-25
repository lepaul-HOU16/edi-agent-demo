/**
 * ProjectNameGenerator
 * 
 * Generates human-friendly project names from location context.
 * Supports:
 * - Location extraction from natural language queries
 * - Reverse geocoding using AWS Location Service
 * - Name normalization to kebab-case
 * - Uniqueness checking against existing projects
 */

import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';
import { ProjectStore } from './projectStore';

export interface Coordinates {
  lat: number;
  lon: number;
}

export class ProjectNameGenerator {
  private locationClient: LocationClient;
  private projectStore: ProjectStore;
  private placeIndexName: string;
  private geocodingCache: Map<string, { name: string; timestamp: number }>;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(projectStore: ProjectStore, placeIndexName?: string) {
    this.locationClient = new LocationClient({});
    this.projectStore = projectStore;
    this.placeIndexName = placeIndexName || process.env.AWS_LOCATION_PLACE_INDEX || 'RenewableProjectPlaceIndex';
    this.geocodingCache = new Map();
  }

  /**
   * Generate project name from query and optional coordinates
   * 
   * Extraction patterns:
   * - "analyze terrain in West Texas" → "west-texas-wind-farm"
   * - "wind farm at Amarillo" → "amarillo-wind-farm"
   * - "create project Panhandle Wind" → "panhandle-wind"
   * 
   * @param query - User query text
   * @param coordinates - Optional coordinates for reverse geocoding
   * @returns Human-friendly project name (kebab-case)
   */
  async generateFromQuery(query: string, coordinates?: Coordinates): Promise<string> {
    // Try to extract location from query
    const extractedLocation = this.extractLocationFromQuery(query);
    
    if (extractedLocation) {
      const normalized = this.normalize(extractedLocation);
      return await this.ensureUnique(normalized);
    }

    // If coordinates provided but no location in query, use reverse geocoding
    if (coordinates) {
      return await this.generateFromCoordinates(coordinates.lat, coordinates.lon);
    }

    // Fallback: generate generic name with timestamp
    const timestamp = Date.now().toString(36);
    return await this.ensureUnique(`wind-farm-${timestamp}`);
  }

  /**
   * Extract location name from query using regex patterns
   * 
   * Patterns:
   * - "in {location}" → extract location
   * - "at {location}" → extract location  
   * - "{location} wind farm" → extract location
   * - "for {location}" → extract location
   * - "near {location}" → extract location
   * 
   * @param query - User query text
   * @returns Extracted location or null
   */
  private extractLocationFromQuery(query: string): string | null {
    // Pattern 1: "in {location}" or "at {location}"
    const inAtPattern = /(?:in|at)\s+([A-Z][a-zA-Z\s]+?)(?:\s+wind\s+farm|\s+area|\s*$|,|\s+for|\s+with)/i;
    let match = query.match(inAtPattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Pattern 2: "{location} wind farm"
    const windFarmPattern = /([A-Z][a-zA-Z\s]+?)\s+wind\s+farm/i;
    match = query.match(windFarmPattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Pattern 3: "near {location}" (removed "for" to avoid matching "for wind farm")
    const nearPattern = /near\s+([A-Z][a-zA-Z\s]+?)(?:\s+wind\s+farm|\s+area|\s*$|,|\s+project)/i;
    match = query.match(nearPattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Pattern 4: "create project {name}"
    const projectPattern = /(?:create|new)\s+project\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\s+at|\s+in)/i;
    match = query.match(projectPattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Pattern 5: Multi-word location at start of query
    const startPattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:terrain|wind|analysis|site)/i;
    match = query.match(startPattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Generate project name from coordinates using reverse geocoding
   * 
   * Uses AWS Location Service to convert coordinates to city/state.
   * Falls back to coordinate-based name if geocoding fails.
   * 
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns Location-based project name (e.g., "amarillo-tx-wind-farm")
   */
  async generateFromCoordinates(latitude: number, longitude: number): Promise<string> {
    // Check cache first
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = this.geocodingCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL_MS) {
      return await this.ensureUnique(cached.name);
    }

    try {
      // Call AWS Location Service for reverse geocoding
      const command = new SearchPlaceIndexForPositionCommand({
        IndexName: this.placeIndexName,
        Position: [longitude, latitude], // AWS Location uses [lon, lat] order
        MaxResults: 1,
      });

      const response = await this.locationClient.send(command);

      if (response.Results && response.Results.length > 0) {
        const place = response.Results[0].Place;
        
        // Build location name from place components
        const locationParts: string[] = [];
        
        if (place?.Municipality) {
          locationParts.push(place.Municipality);
        } else if (place?.Neighborhood) {
          locationParts.push(place.Neighborhood);
        }
        
        if (place?.Region) {
          // Use state abbreviation if available, otherwise full name
          const region = place.Region.length <= 2 ? place.Region : place.Region;
          locationParts.push(region);
        }

        if (locationParts.length > 0) {
          const locationName = this.normalize(locationParts.join(' '));
          
          // Cache the result
          this.geocodingCache.set(cacheKey, {
            name: locationName,
            timestamp: Date.now(),
          });
          
          return await this.ensureUnique(locationName);
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinate-based name:', error);
    }

    // Fallback: coordinate-based name
    const latStr = latitude.toFixed(2).replace('.', '-').replace('-', latitude >= 0 ? 'n' : 's');
    const lonStr = Math.abs(longitude).toFixed(2).replace('.', '-') + (longitude >= 0 ? 'e' : 'w');
    const fallbackName = `site-${latStr}-${lonStr}`;
    
    return await this.ensureUnique(fallbackName);
  }

  /**
   * Normalize project name to kebab-case
   * 
   * Rules:
   * - Convert to lowercase
   * - Replace spaces with hyphens
   * - Remove special characters except hyphens
   * - Remove multiple consecutive hyphens
   * - Trim leading/trailing hyphens
   * - Append "-wind-farm" if not already present
   * 
   * @param name - Raw project name
   * @returns Normalized kebab-case name
   */
  normalize(name: string): string {
    let normalized = name
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove special characters except hyphens and alphanumeric
      .replace(/[^a-z0-9-]/g, '')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Trim leading/trailing hyphens
      .replace(/^-+|-+$/g, '');

    // Append "-wind-farm" if not already present
    if (!normalized.includes('wind-farm') && !normalized.includes('wind') && !normalized.includes('farm')) {
      normalized = `${normalized}-wind-farm`;
    }

    return normalized;
  }

  /**
   * Ensure project name is unique by checking existing projects
   * 
   * If name exists, appends number: "west-texas-wind-farm-2"
   * Increments until unique name found.
   * 
   * @param baseName - Base project name
   * @returns Unique name
   */
  async ensureUnique(baseName: string): Promise<string> {
    try {
      // Get all existing projects
      const existingProjects = await this.projectStore.list();
      const existingNames = new Set(existingProjects.map(p => p.project_name));

      // If base name is unique, return it
      if (!existingNames.has(baseName)) {
        return baseName;
      }

      // Find unique name by appending number
      let counter = 2;
      let uniqueName = `${baseName}-${counter}`;
      
      while (existingNames.has(uniqueName)) {
        counter++;
        uniqueName = `${baseName}-${counter}`;
        
        // Safety check to prevent infinite loop
        if (counter > 1000) {
          // Append timestamp as last resort
          const timestamp = Date.now().toString(36);
          return `${baseName}-${timestamp}`;
        }
      }

      return uniqueName;
    } catch (error) {
      console.error('Error checking project uniqueness:', error);
      // If we can't check uniqueness, append timestamp
      const timestamp = Date.now().toString(36);
      return `${baseName}-${timestamp}`;
    }
  }

  /**
   * Clear the geocoding cache (useful for testing)
   */
  clearCache(): void {
    this.geocodingCache.clear();
  }
}
