/**
 * ProjectStore - S3-based persistence for renewable energy project data
 * 
 * Manages project data storage, retrieval, and caching with:
 * - S3 storage at renewable/projects/{project-name}/project.json
 * - In-memory caching with 5-minute TTL
 * - Merge logic for updates (no overwrites)
 * - Fuzzy matching for partial name searches
 * - Error handling with fallback to cache
 */

import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration with exponential backoff
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Project data structure
 */
export interface ProjectData {
  project_id: string;           // Unique ID (UUID)
  project_name: string;          // Human-friendly name (kebab-case)
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;         // From terrain analysis
  layout_results?: any;          // From layout optimization
  simulation_results?: any;      // From wake simulation
  report_results?: any;          // From report generation
  metadata?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };
}

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * ProjectStore class for S3-based project persistence
 */
export class ProjectStore {
  private s3Client: S3Client;
  private bucketName: string;
  private projectPrefix: string = 'renewable/projects';
  private cache: Map<string, CacheEntry<ProjectData>> = new Map();
  private listCache: CacheEntry<ProjectData[]> | null = null;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private retryConfig: RetryConfig;

  constructor(bucketName?: string, retryConfig?: Partial<RetryConfig>) {
    this.s3Client = new S3Client({});
    this.bucketName = bucketName || process.env.RENEWABLE_S3_BUCKET || '';
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    if (!this.bucketName) {
      console.warn('[ProjectStore] No S3 bucket configured. Using in-memory cache only.');
    }
  }

  /**
   * Save or update project data with merge logic
   * @param projectName - Human-friendly project name (kebab-case)
   * @param data - Partial project data to save/merge
   */
  async save(projectName: string, data: Partial<ProjectData>): Promise<void> {
    try {
      // Load existing data if it exists
      const existing = await this.load(projectName);
      
      // Merge with existing data
      const merged: ProjectData = existing 
        ? {
            ...existing,
            ...data,
            updated_at: new Date().toISOString(),
            // Deep merge for nested objects
            coordinates: data.coordinates || existing.coordinates,
            metadata: { ...existing.metadata, ...data.metadata },
          }
        : {
            project_id: data.project_id || this.generateProjectId(),
            project_name: projectName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...data,
          };

      // Save to S3 with retry logic
      if (this.bucketName) {
        const key = this.getProjectKey(projectName);
        await this.executeWithRetry(
          async () => {
            await this.s3Client.send(new PutObjectCommand({
              Bucket: this.bucketName,
              Key: key,
              Body: JSON.stringify(merged, null, 2),
              ContentType: 'application/json',
            }));
          },
          `Save project ${projectName}`
        );
        
        console.log(`[ProjectStore] Saved project: ${projectName} to S3`);
      }

      // Update cache
      this.cache.set(projectName, {
        data: merged,
        timestamp: Date.now(),
      });

      // Invalidate list cache
      this.listCache = null;

    } catch (error) {
      this.handleS3Error(error, 'Save', projectName);
      
      // On error, still update cache so we have something
      if (data.project_id && data.project_name) {
        console.warn(`[ProjectStore] Falling back to cache-only storage for ${projectName}`);
        this.cache.set(projectName, {
          data: data as ProjectData,
          timestamp: Date.now(),
        });
      }
      
      throw new Error(`Failed to save project ${projectName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load project data by name
   * @param projectName - Human-friendly project name
   * @returns Project data or null if not found
   */
  async load(projectName: string): Promise<ProjectData | null> {
    try {
      // Check cache first
      const cached = this.cache.get(projectName);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        console.log(`[ProjectStore] Cache hit for project: ${projectName}`);
        return cached.data;
      }

      // Load from S3
      if (!this.bucketName) {
        console.warn(`[ProjectStore] No S3 bucket configured, returning null for ${projectName}`);
        return null;
      }

      const key = this.getProjectKey(projectName);
      
      // Load from S3 with retry logic
      const projectData = await this.executeWithRetry(
        async () => {
          const response = await this.s3Client.send(new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }));

          if (!response.Body) {
            throw new Error('Empty response body from S3');
          }

          // Read stream to string
          const bodyString = await this.streamToString(response.Body as Readable);
          return JSON.parse(bodyString) as ProjectData;
        },
        `Load project ${projectName}`
      );

      // Update cache
      this.cache.set(projectName, {
        data: projectData,
        timestamp: Date.now(),
      });

      console.log(`[ProjectStore] Loaded project from S3: ${projectName}`);
      return projectData;

    } catch (error) {
      // NoSuchKey is expected for non-existent projects
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return null;
      }

      this.handleS3Error(error, 'Load', projectName);
      
      // Fallback to cache even if expired on S3 errors
      const cached = this.cache.get(projectName);
      if (cached) {
        console.warn(`[ProjectStore] Using ${Date.now() - cached.timestamp > this.cacheTTL ? 'expired' : 'valid'} cache for ${projectName} due to S3 error`);
        return cached.data;
      }

      console.warn(`[ProjectStore] No cache available for ${projectName}, returning null`);
      return null;
    }
  }

  /**
   * List all projects
   * @returns Array of project data
   */
  async list(): Promise<ProjectData[]> {
    try {
      // Check list cache
      if (this.listCache && (Date.now() - this.listCache.timestamp) < this.cacheTTL) {
        console.log('[ProjectStore] List cache hit');
        return this.listCache.data;
      }

      if (!this.bucketName) {
        console.warn('[ProjectStore] No S3 bucket configured, returning empty list');
        return [];
      }

      const projects: ProjectData[] = [];
      let continuationToken: string | undefined;

      // List all project.json files
      do {
        const response = await this.s3Client.send(new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: `${this.projectPrefix}/`,
          ContinuationToken: continuationToken,
        }));

        if (response.Contents) {
          for (const object of response.Contents) {
            if (object.Key?.endsWith('/project.json')) {
              // Extract project name from key
              const projectName = this.extractProjectNameFromKey(object.Key);
              if (projectName) {
                const projectData = await this.load(projectName);
                if (projectData) {
                  projects.push(projectData);
                }
              }
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      // Update list cache
      this.listCache = {
        data: projects,
        timestamp: Date.now(),
      };

      console.log(`[ProjectStore] Listed ${projects.length} projects`);
      return projects;

    } catch (error) {
      this.handleS3Error(error, 'List');
      
      // Fallback to cached list if available
      if (this.listCache) {
        const age = Date.now() - this.listCache.timestamp;
        console.warn(`[ProjectStore] Using ${age > this.cacheTTL ? 'expired' : 'valid'} list cache due to S3 error (age: ${Math.round(age / 1000)}s)`);
        return this.listCache.data;
      }

      console.warn('[ProjectStore] No list cache available, returning empty array');
      return [];
    }
  }

  /**
   * Find projects by partial name match using fuzzy matching
   * @param partialName - Partial project name
   * @returns Array of matching projects
   */
  async findByPartialName(partialName: string): Promise<ProjectData[]> {
    try {
      const allProjects = await this.list();
      const normalizedSearch = partialName.toLowerCase().trim();

      // Score each project by match quality
      const scored = allProjects.map(project => ({
        project,
        score: this.calculateMatchScore(project.project_name, normalizedSearch),
      }));

      // Filter and sort by score
      const matches = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.project);

      console.log(`[ProjectStore] Found ${matches.length} matches for "${partialName}"`);
      return matches;

    } catch (error) {
      console.error(`[ProjectStore] Error finding projects by partial name "${partialName}":`, error);
      return [];
    }
  }

  /**
   * Delete project
   * @param projectName - Human-friendly project name
   */
  async delete(projectName: string): Promise<void> {
    try {
      if (!this.bucketName) {
        console.warn(`[ProjectStore] No S3 bucket configured, cannot delete ${projectName}`);
        return;
      }

      const key = this.getProjectKey(projectName);
      
      // Delete from S3 with retry logic
      await this.executeWithRetry(
        async () => {
          await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }));
        },
        `Delete project ${projectName}`
      );

      // Remove from cache
      this.cache.delete(projectName);
      this.listCache = null;

      console.log(`[ProjectStore] Deleted project: ${projectName}`);

    } catch (error) {
      this.handleS3Error(error, 'Delete', projectName);
      throw new Error(`Failed to delete project ${projectName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate match score for fuzzy matching
   * Higher score = better match
   */
  private calculateMatchScore(projectName: string, search: string): number {
    const name = projectName.toLowerCase();
    
    // Exact match
    if (name === search) {
      return 100;
    }

    // Starts with search
    if (name.startsWith(search)) {
      return 90;
    }

    // Contains search as whole word
    if (name.includes(` ${search} `) || name.includes(`-${search}-`)) {
      return 80;
    }

    // Contains search
    if (name.includes(search)) {
      return 70;
    }

    // Check for word matches
    const nameWords = name.split(/[-\s]+/);
    const searchWords = search.split(/[-\s]+/);
    
    let wordMatches = 0;
    for (const searchWord of searchWords) {
      for (const nameWord of nameWords) {
        if (nameWord.startsWith(searchWord)) {
          wordMatches++;
          break;
        }
      }
    }

    if (wordMatches > 0) {
      return 50 + (wordMatches / searchWords.length) * 20;
    }

    // Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(name, search);
    const maxLength = Math.max(name.length, search.length);
    const similarity = 1 - (distance / maxLength);

    if (similarity > 0.6) {
      return similarity * 50;
    }

    return 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get S3 key for project
   */
  private getProjectKey(projectName: string): string {
    return `${this.projectPrefix}/${projectName}/project.json`;
  }

  /**
   * Extract project name from S3 key
   */
  private extractProjectNameFromKey(key: string): string | null {
    const match = key.match(/renewable\/projects\/([^/]+)\/project\.json/);
    return match ? match[1] : null;
  }

  /**
   * Generate unique project ID
   */
  private generateProjectId(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Convert stream to string
   */
  private async streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }

  /**
   * Clear all caches (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.listCache = null;
    console.log('[ProjectStore] Cache cleared');
  }

  /**
   * Execute S3 operation with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on NoSuchKey errors
        if (error instanceof Error && error.name === 'NoSuchKey') {
          throw error;
        }

        // Don't retry on validation errors
        if (error instanceof Error && error.message.includes('validation')) {
          throw error;
        }

        if (attempt < this.retryConfig.maxRetries) {
          console.warn(
            `[ProjectStore] ${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${lastError.message}. Retrying in ${delay}ms...`
          );
          
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
        }
      }
    }

    console.error(
      `[ProjectStore] ${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`
    );
    throw lastError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    // Network errors are retryable
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // AWS SDK throttling errors are retryable
    if (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException') {
      return true;
    }

    // AWS SDK service errors are retryable
    if (error.name === 'ServiceUnavailable' || error.name === 'InternalError') {
      return true;
    }

    // Timeout errors are retryable
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Handle S3 error with appropriate logging and fallback
   */
  private handleS3Error(error: any, operation: string, projectName?: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';

    if (errorName === 'NoSuchKey') {
      console.log(`[ProjectStore] ${operation}: Project not found${projectName ? `: ${projectName}` : ''}`);
    } else if (errorName === 'NoSuchBucket') {
      console.error(`[ProjectStore] ${operation}: S3 bucket does not exist: ${this.bucketName}`);
    } else if (errorName === 'AccessDenied') {
      console.error(`[ProjectStore] ${operation}: Access denied to S3 bucket: ${this.bucketName}`);
    } else if (this.isRetryableError(error)) {
      console.warn(`[ProjectStore] ${operation}: Retryable error: ${errorMessage}`);
    } else {
      console.error(`[ProjectStore] ${operation}: Unexpected error: ${errorName} - ${errorMessage}`);
    }
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getCacheStats(): {
    projectCacheSize: number;
    listCacheExists: boolean;
    cacheTTL: number;
  } {
    return {
      projectCacheSize: this.cache.size,
      listCacheExists: this.listCache !== null,
      cacheTTL: this.cacheTTL,
    };
  }
}
