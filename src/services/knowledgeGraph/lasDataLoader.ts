/**
 * LAS File Data Loading Service
 * 
 * Loads and parses LAS (Log ASCII Standard) files from S3 for the Knowledge Graph Explorer.
 * Extracts well metadata including curves, data points, well info, and geographic coordinates.
 * Implements caching to avoid re-parsing the same files.
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Parsed LAS file metadata
 */
export interface LASFileMetadata {
  filename: string;
  wellName: string;
  operator: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startDepth?: number;
  stopDepth?: number;
  step?: number;
  curves: string[];
  dataPoints: number;
  size?: number;
  lastModified?: string;
  s3Key: string;
  depthRange: string;
  error?: string;
}

/**
 * Cache entry for parsed LAS metadata
 */
interface CacheEntry {
  metadata: LASFileMetadata;
  timestamp: number;
}

/**
 * LAS Data Loader Service
 * 
 * Handles async loading of LAS files from S3, parsing metadata,
 * and caching results to improve performance.
 */
export class LASDataLoader {
  private s3Client: S3Client;
  private bucketName: string;
  private prefix: string = 'global/well-data/';
  private cache: Map<string, CacheEntry> = new Map();
  private cacheExpiryMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(bucketName: string) {
    this.s3Client = new S3Client({ region: 'us-east-1' });
    this.bucketName = bucketName;
  }

  /**
   * List all LAS files in the S3 bucket
   */
  async listLASFiles(): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: this.prefix,
        MaxKeys: 100
      });

      const response = await this.s3Client.send(command);
      const files = response.Contents?.map(obj => obj.Key?.replace(this.prefix, '') || '')
        .filter(key => key.endsWith('.las')) || [];
      
      console.log(`Found ${files.length} LAS files in S3`);
      return files;
    } catch (error) {
      console.error('Error listing LAS files:', error);
      throw new Error(`Failed to list LAS files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load and parse a single LAS file
   * Uses cache if available and not expired
   */
  async loadLASFile(filename: string): Promise<LASFileMetadata> {
    // Check cache first
    const cached = this.getCachedMetadata(filename);
    if (cached) {
      console.log(`Using cached metadata for ${filename}`);
      return cached;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: `${this.prefix}${filename}`
      });

      const response = await this.s3Client.send(command);
      const content = await response.Body?.transformToString();
      
      if (!content) {
        throw new Error(`No content found for ${filename}`);
      }

      const metadata = this.parseLASFile(content, filename);
      metadata.size = response.ContentLength;
      metadata.lastModified = response.LastModified?.toISOString();
      metadata.s3Key = `${this.prefix}${filename}`;

      // Cache the result
      this.cacheMetadata(filename, metadata);

      return metadata;
    } catch (error) {
      console.error(`Error loading LAS file ${filename}:`, error);
      
      // Return error metadata instead of throwing
      const errorMetadata: LASFileMetadata = {
        filename,
        wellName: filename.replace('.las', ''),
        operator: 'Unknown',
        location: 'Unknown',
        curves: [],
        dataPoints: 0,
        s3Key: `${this.prefix}${filename}`,
        depthRange: 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      return errorMetadata;
    }
  }

  /**
   * Load all LAS files from S3
   * Returns array of metadata for all files
   */
  async loadAllLASFiles(): Promise<LASFileMetadata[]> {
    const filenames = await this.listLASFiles();
    
    console.log(`Loading ${filenames.length} LAS files...`);
    
    // Load files in parallel for better performance
    const promises = filenames.map(filename => this.loadLASFile(filename));
    const results = await Promise.all(promises);
    
    const successful = results.filter(r => !r.error).length;
    console.log(`Successfully loaded ${successful}/${results.length} LAS files`);
    
    return results;
  }

  /**
   * Parse LAS file content and extract metadata
   */
  private parseLASFile(content: string, filename: string): LASFileMetadata {
    const lines = content.split('\n');
    
    const metadata: LASFileMetadata = {
      filename,
      wellName: this.extractWellName(filename, lines),
      operator: this.extractOperator(lines),
      location: this.extractLocation(lines),
      latitude: this.extractLatitude(lines),
      longitude: this.extractLongitude(lines),
      startDepth: this.extractStartDepth(lines),
      stopDepth: this.extractStopDepth(lines),
      step: this.extractStep(lines),
      curves: this.extractCurves(lines),
      dataPoints: this.countDataPoints(lines),
      s3Key: `${this.prefix}${filename}`,
      depthRange: ''
    };

    // Format depth range
    if (metadata.startDepth !== undefined && metadata.stopDepth !== undefined) {
      metadata.depthRange = `${metadata.startDepth}m - ${metadata.stopDepth}m`;
    } else {
      metadata.depthRange = 'Unknown';
    }

    return metadata;
  }

  /**
   * Extract well name from LAS file
   * Looks for WELL field in ~W section, falls back to filename
   */
  private extractWellName(filename: string, lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith('WELL') || line.includes('WELL.')) {
        const match = line.match(/WELL[.\s]+[^:]*:\s*(.+)/i);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      }
    }
    
    // Fallback: clean up filename
    return filename.replace('.las', '').replace(/^\d+_/, '').replace(/_/g, ' ');
  }

  /**
   * Extract operator/company from LAS file
   * Looks for COMP field in ~W section
   */
  private extractOperator(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith('COMP') || line.includes('COMP.')) {
        const match = line.match(/COMP[.\s]+[^:]*:\s*(.+)/i);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      }
    }
    return 'S&P Global / TGS';
  }

  /**
   * Extract location from LAS file
   * Looks for LOC field in ~W section
   */
  private extractLocation(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith('LOC') || line.includes('LOC.')) {
        const match = line.match(/LOC[.\s]+[^:]*:\s*(.+)/i);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      }
    }
    return 'Gulf of Mexico';
  }

  /**
   * Extract latitude from LAS file
   * Looks for LAT field in ~W section
   */
  private extractLatitude(lines: string[]): number | undefined {
    for (const line of lines) {
      if (line.startsWith('LAT') || line.includes('LAT.')) {
        const match = line.match(/LAT[.\s]+[^:]*:\s*([-\d.]+)/i);
        if (match) {
          const lat = parseFloat(match[1]);
          if (!isNaN(lat)) return lat;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract longitude from LAS file
   * Looks for LON or LONG field in ~W section
   */
  private extractLongitude(lines: string[]): number | undefined {
    for (const line of lines) {
      if (line.startsWith('LON') || line.includes('LON.') || line.includes('LONG.')) {
        const match = line.match(/LON[G]?[.\s]+[^:]*:\s*([-\d.]+)/i);
        if (match) {
          const lng = parseFloat(match[1]);
          if (!isNaN(lng)) return lng;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract start depth from LAS file
   * Looks for STRT field in ~W section
   */
  private extractStartDepth(lines: string[]): number | undefined {
    for (const line of lines) {
      if (line.startsWith('STRT') || line.includes('STRT.')) {
        const match = line.match(/STRT[.\s]+[^:]*:\s*([-\d.]+)/i);
        if (match) {
          const depth = parseFloat(match[1]);
          if (!isNaN(depth)) return depth;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract stop depth from LAS file
   * Looks for STOP field in ~W section
   */
  private extractStopDepth(lines: string[]): number | undefined {
    for (const line of lines) {
      if (line.startsWith('STOP') || line.includes('STOP.')) {
        const match = line.match(/STOP[.\s]+[^:]*:\s*([-\d.]+)/i);
        if (match) {
          const depth = parseFloat(match[1]);
          if (!isNaN(depth)) return depth;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract step/increment from LAS file
   * Looks for STEP field in ~W section
   */
  private extractStep(lines: string[]): number | undefined {
    for (const line of lines) {
      if (line.startsWith('STEP') || line.includes('STEP.')) {
        const match = line.match(/STEP[.\s]+[^:]*:\s*([-\d.]+)/i);
        if (match) {
          const step = parseFloat(match[1]);
          if (!isNaN(step)) return step;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract curve names from LAS file
   * Looks for curve definitions in ~C section
   */
  private extractCurves(lines: string[]): string[] {
    const curves: string[] = [];
    let inCurveSection = false;

    for (const line of lines) {
      if (line.startsWith('~C')) {
        inCurveSection = true;
        continue;
      }
      
      if (line.startsWith('~') && !line.startsWith('~C')) {
        inCurveSection = false;
      }

      if (inCurveSection && line.trim() && !line.startsWith('#')) {
        // Parse curve line: CURVENAME.UNIT description : value
        const match = line.match(/^(\w+)\s*\./);
        if (match) {
          curves.push(match[1]);
        }
      }
    }

    return curves;
  }

  /**
   * Count data points in LAS file
   * Counts lines in ~A section
   */
  private countDataPoints(lines: string[]): number {
    let inDataSection = false;
    let count = 0;

    for (const line of lines) {
      if (line.startsWith('~A')) {
        inDataSection = true;
        continue;
      }

      if (inDataSection && line.trim() && !line.startsWith('~') && !line.startsWith('#')) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get cached metadata if available and not expired
   */
  private getCachedMetadata(filename: string): LASFileMetadata | null {
    const entry = this.cache.get(filename);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheExpiryMs) {
      // Cache expired
      this.cache.delete(filename);
      return null;
    }

    return entry.metadata;
  }

  /**
   * Cache metadata for a file
   */
  private cacheMetadata(filename: string, metadata: LASFileMetadata): void {
    this.cache.set(filename, {
      metadata,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * Convenience function to load all LAS files
 * Uses environment variable for bucket name
 */
export async function loadLASFiles(): Promise<LASFileMetadata[]> {
  const bucketName = import.meta.env.VITE_STORAGE_BUCKET_NAME || 'edi-platform-storage-dev';
  const loader = new LASDataLoader(bucketName);
  return loader.loadAllLASFiles();
}

/**
 * Load LAS files from collection data items
 * Converts collection dataItems to LASFileMetadata format
 */
export async function loadLASFilesFromCollection(dataItems: any[]): Promise<LASFileMetadata[]> {
  console.log(`📊 Loading ${dataItems.length} LAS files from collection data items`);
  
  const lasFiles: LASFileMetadata[] = dataItems.map((item, index) => {
    // Extract coordinates from coordinates object or direct lat/lng fields
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    if (item.coordinates) {
      // Handle coordinates object format: { lat: number, lng: number }
      latitude = item.coordinates.lat;
      longitude = item.coordinates.lng;
      console.log(`📍 Item ${index} (${item.name}): coordinates object found`, { lat: latitude, lng: longitude });
    } else if (item.latitude !== undefined && item.longitude !== undefined) {
      // Handle direct lat/lng fields
      latitude = item.latitude;
      longitude = item.longitude;
      console.log(`📍 Item ${index} (${item.name}): direct lat/lng found`, { lat: latitude, lng: longitude });
    } else {
      console.log(`⚠️ Item ${index} (${item.name}): NO coordinates found`, { item });
    }
    
    // Convert collection dataItem to LASFileMetadata format
    const metadata: LASFileMetadata = {
      filename: item.name || 'Unknown',
      wellName: item.name || 'Unknown',
      operator: item.operator || 'Unknown',
      location: item.location || 'Unknown',
      latitude,
      longitude,
      startDepth: item.startDepth,
      stopDepth: item.stopDepth,
      step: item.step,
      curves: item.curves || [],
      dataPoints: item.dataPoints || 0,
      s3Key: item.s3Key || `global/well-data/${item.name}`,
      depthRange: item.depth || 'Unknown',
      size: item.size,
      lastModified: item.lastModified || new Date().toISOString()
    };
    
    return metadata;
  });
  
  const withCoords = lasFiles.filter(f => f.latitude !== undefined && f.longitude !== undefined).length;
  console.log(`✅ Converted ${lasFiles.length} collection items to LAS metadata (${withCoords} with coordinates)`);
  return lasFiles;
}
