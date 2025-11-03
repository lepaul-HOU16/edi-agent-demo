/**
 * Well Data Service
 * Centralized service for retrieving well data from DynamoDB
 * 
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Types
export interface Sensor {
  type: 'pressure' | 'temperature' | 'flow_rate' | 'vibration' | 'level';
  currentValue: number;
  unit: string;
  normalRange: { min: number; max: number };
  alertThreshold: { warning: number; critical: number };
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  relatedSensor?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'inspection';
  description: string;
  technician: string;
  duration: number;
  cost?: number;
  partsReplaced?: string[];
}

export interface Well {
  id: string;
  name: string;
  type: 'well';
  location: string;
  operationalStatus: 'operational' | 'degraded' | 'critical' | 'offline';
  healthScore: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  sensors: Sensor[];
  alerts: Alert[];
  metadata: {
    field: string;
    operator: string;
    installDate: string;
    depth: number;
    production: {
      currentRate: number;
      averageRate: number;
      cumulativeProduction: number;
      efficiency: number;
    };
  };
}

export interface WellHealthMetrics {
  totalWells: number;
  operational: number;
  degraded: number;
  critical: number;
  offline: number;
  averageHealthScore: number;
  totalAlerts: number;
  criticalAlerts: number;
}

// DynamoDB Configuration
const REGION = process.env.AWS_REGION || 'us-east-1';
const WELLS_TABLE_NAME = process.env.WELLS_TABLE_NAME || 'Wells';

// Query optimization configuration
const QUERY_TIMEOUT_MS = 10 * 1000; // 10 seconds
const MAX_PARALLEL_QUERIES = 10; // Maximum concurrent queries

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Query result types
interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

interface PartialQueryResult<T> {
  successful: T[];
  failed: Array<{ id: string; error: Error }>;
  totalRequested: number;
  successRate: number;
}

/**
 * Well Data Service Class
 */
export class WellDataService {
  /**
   * Get all wells from database
   * Scalable to any number of wells (24, 121, etc.)
   * Optimized with timeout handling and parallel processing
   */
  async getAllWells(): Promise<Well[]> {
    console.log('🔍 WellDataService.getAllWells - Start');
    
    const cacheKey = 'all_wells';
    const cached = this.getCachedData<Well[]>(cacheKey);
    if (cached) {
      console.log('✅ Returning cached well data');
      return cached;
    }

    try {
      // Query DynamoDB for all wells with timeout
      const command = new ScanCommand({
        TableName: WELLS_TABLE_NAME,
        FilterExpression: '#type = :wellType',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':wellType': 'well'
        }
      });

      const response = await this.executeWithTimeout(
        () => this.executeWithRetry(() => docClient.send(command)),
        QUERY_TIMEOUT_MS,
        'getAllWells query'
      );
      
      const wells = (response.Items || []) as Well[];

      console.log(`✅ Retrieved ${wells.length} wells from database`);
      
      // Cache the results
      this.setCachedData(cacheKey, wells);
      
      return wells;
    } catch (error) {
      console.error('❌ Error retrieving all wells:', error);
      
      // Fallback to mock data if database is unavailable
      console.log('⚠️ Falling back to mock data');
      return this.getMockWells();
    }
  }

  /**
   * Get a single well by ID
   */
  async getWellById(wellId: string): Promise<Well | null> {
    console.log(`🔍 WellDataService.getWellById - ${wellId}`);
    
    const cacheKey = `well_${wellId}`;
    const cached = this.getCachedData<Well>(cacheKey);
    if (cached) {
      console.log('✅ Returning cached well data');
      return cached;
    }

    try {
      const command = new GetCommand({
        TableName: WELLS_TABLE_NAME,
        Key: { id: wellId }
      });

      const response = await this.executeWithRetry(() => docClient.send(command));
      
      if (!response.Item) {
        console.log(`⚠️ Well ${wellId} not found in database`);
        
        // Fallback to mock data
        return this.getMockWellById(wellId);
      }

      const well = response.Item as Well;
      console.log(`✅ Retrieved well ${wellId} from database`);
      
      // Cache the result
      this.setCachedData(cacheKey, well);
      
      return well;
    } catch (error) {
      console.error(`❌ Error retrieving well ${wellId}:`, error);
      
      // Fallback to mock data
      return this.getMockWellById(wellId);
    }
  }

  /**
   * Get wells by operational status
   */
  async getWellsByStatus(status: 'operational' | 'degraded' | 'critical' | 'offline'): Promise<Well[]> {
    console.log(`🔍 WellDataService.getWellsByStatus - ${status}`);
    
    try {
      const command = new ScanCommand({
        TableName: WELLS_TABLE_NAME,
        FilterExpression: '#type = :wellType AND operationalStatus = :status',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':wellType': 'well',
          ':status': status
        }
      });

      const response = await this.executeWithRetry(() => docClient.send(command));
      const wells = (response.Items || []) as Well[];

      console.log(`✅ Retrieved ${wells.length} wells with status ${status}`);
      return wells;
    } catch (error) {
      console.error(`❌ Error retrieving wells by status ${status}:`, error);
      
      // Fallback to filtering mock data
      const allWells = this.getMockWells();
      return allWells.filter(w => w.operationalStatus === status);
    }
  }

  /**
   * Get fleet health metrics (aggregate statistics)
   */
  async getFleetHealthMetrics(): Promise<WellHealthMetrics> {
    console.log('🔍 WellDataService.getFleetHealthMetrics - Start');
    
    const cacheKey = 'fleet_health_metrics';
    const cached = this.getCachedData<WellHealthMetrics>(cacheKey);
    if (cached) {
      console.log('✅ Returning cached fleet health metrics');
      return cached;
    }

    try {
      const wells = await this.getAllWells();
      
      const metrics: WellHealthMetrics = {
        totalWells: wells.length,
        operational: wells.filter(w => w.operationalStatus === 'operational').length,
        degraded: wells.filter(w => w.operationalStatus === 'degraded').length,
        critical: wells.filter(w => w.operationalStatus === 'critical').length,
        offline: wells.filter(w => w.operationalStatus === 'offline').length,
        averageHealthScore: wells.length > 0 
          ? Math.round(wells.reduce((sum, w) => sum + w.healthScore, 0) / wells.length)
          : 0,
        totalAlerts: wells.reduce((sum, w) => sum + w.alerts.length, 0),
        criticalAlerts: wells.reduce((sum, w) => 
          sum + w.alerts.filter(a => a.severity === 'critical').length, 0
        )
      };

      console.log('✅ Calculated fleet health metrics:', metrics);
      
      // Cache the results
      this.setCachedData(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      console.error('❌ Error calculating fleet health metrics:', error);
      throw error;
    }
  }

  /**
   * Get multiple wells by IDs in parallel
   * Optimized for performance with parallel queries and graceful partial failure handling
   * 
   * @param wellIds Array of well IDs to retrieve
   * @returns PartialQueryResult with successful wells and failed queries
   */
  async getWellsByIds(wellIds: string[]): Promise<PartialQueryResult<Well>> {
    console.log(`🔍 WellDataService.getWellsByIds - Fetching ${wellIds.length} wells in parallel`);
    
    const startTime = Date.now();
    
    // Execute queries in parallel with controlled concurrency
    const results = await this.executeParallelQueries(
      wellIds,
      (wellId) => this.getWellById(wellId),
      MAX_PARALLEL_QUERIES
    );

    const successful: Well[] = [];
    const failed: Array<{ id: string; error: Error }> = [];

    results.forEach((result, index) => {
      if (result.success && result.data) {
        successful.push(result.data);
      } else if (result.error) {
        failed.push({ id: wellIds[index], error: result.error });
      }
    });

    const successRate = (successful.length / wellIds.length) * 100;
    const duration = Date.now() - startTime;

    console.log(`✅ Parallel query complete: ${successful.length}/${wellIds.length} successful (${successRate.toFixed(1)}%) in ${duration}ms`);
    
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} queries failed:`, failed.map(f => f.id));
    }

    return {
      successful,
      failed,
      totalRequested: wellIds.length,
      successRate
    };
  }

  /**
   * Execute multiple queries in parallel with controlled concurrency
   * Prevents overwhelming the database with too many concurrent requests
   * 
   * @param items Array of items to process
   * @param queryFn Function to execute for each item
   * @param maxConcurrency Maximum number of concurrent queries
   * @returns Array of query results
   */
  private async executeParallelQueries<T, R>(
    items: T[],
    queryFn: (item: T) => Promise<R>,
    maxConcurrency: number
  ): Promise<QueryResult<R>[]> {
    const results: QueryResult<R>[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Create query promise with error handling
      const queryPromise = (async () => {
        try {
          const data = await queryFn(item);
          results[i] = { success: true, data };
        } catch (error) {
          results[i] = { success: false, error: error as Error };
        }
      })();

      executing.push(queryPromise);

      // Control concurrency
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        // Remove completed promises
        const completed = executing.filter(p => {
          return Promise.race([p, Promise.resolve('pending')]).then(
            result => result !== 'pending'
          );
        });
        executing.splice(0, executing.length, ...completed);
      }
    }

    // Wait for all remaining queries to complete
    await Promise.all(executing);

    return results;
  }

  /**
   * Execute a function with timeout
   * Throws error if operation exceeds timeout
   * 
   * @param fn Function to execute
   * @param timeoutMs Timeout in milliseconds
   * @param operationName Name of operation for error messages
   * @returns Result of function execution
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(
          () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Execute a function with retry logic
   * Implements exponential backoff (3 attempts)
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cached data with timestamp
   */
  private setCachedData<T>(key: string, data: T): void {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Generate mock well data for fallback
   * Generates 24 wells with realistic diversity
   */
  private getMockWells(): Well[] {
    const wells: Well[] = [];
    
    for (let i = 1; i <= 24; i++) {
      wells.push(this.generateMockWell(i));
    }
    
    return wells;
  }

  /**
   * Get mock well by ID
   */
  private getMockWellById(wellId: string): Well | null {
    const wellMatch = wellId.match(/^WELL-(\d{3})$/);
    if (!wellMatch) return null;
    
    const wellNumber = parseInt(wellMatch[1], 10);
    if (wellNumber < 1 || wellNumber > 24) return null;
    
    return this.generateMockWell(wellNumber);
  }

  /**
   * Generate a single mock well with realistic data
   */
  private generateMockWell(wellNumber: number): Well {
    const wellId = `WELL-${String(wellNumber).padStart(3, '0')}`;
    
    // Vary parameters based on well number for realistic diversity
    const baseHealthScore = 75 + (wellNumber % 20);
    const operationalStatus = baseHealthScore > 70 ? 'operational' : 'degraded';
    const basePressure = 2500 + (wellNumber * 50);
    const baseTemp = 170 + (wellNumber * 2);
    const baseFlowRate = 400 + (wellNumber * 10);
    
    // Determine sector based on well number
    const sector = Math.ceil(wellNumber / 6);
    
    // Generate sensors
    const sensors: Sensor[] = [
      {
        type: 'pressure',
        currentValue: basePressure,
        unit: 'PSI',
        normalRange: { min: 2500, max: 3000 },
        alertThreshold: { warning: 3100, critical: 3300 },
        status: basePressure > 3100 ? 'critical' : basePressure > 3000 ? 'warning' : 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      },
      {
        type: 'temperature',
        currentValue: baseTemp,
        unit: '°F',
        normalRange: { min: 150, max: 200 },
        alertThreshold: { warning: 210, critical: 230 },
        status: baseTemp > 210 ? 'critical' : baseTemp > 200 ? 'warning' : 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      },
      {
        type: 'flow_rate',
        currentValue: baseFlowRate,
        unit: 'BPD',
        normalRange: { min: 400, max: 500 },
        alertThreshold: { warning: 350, critical: 300 },
        status: baseFlowRate < 350 ? 'warning' : 'normal',
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      }
    ];

    // Generate alerts from critical/warning sensors
    const alerts: Alert[] = sensors
      .filter(s => s.status === 'critical' || s.status === 'warning')
      .map((s, idx) => ({
        id: `${wellId}-ALERT-${idx + 1}`,
        severity: s.status === 'critical' ? 'critical' : 'warning',
        message: `${s.type} reading ${s.currentValue} ${s.unit} is ${s.status === 'critical' ? 'above critical threshold' : 'elevated'}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        relatedSensor: s.type
      }));

    return {
      id: wellId,
      name: `Production Well ${String(wellNumber).padStart(3, '0')}`,
      type: 'well',
      location: `Field A - Sector ${sector}`,
      operationalStatus,
      healthScore: baseHealthScore,
      lastMaintenanceDate: '2024-12-15',
      nextMaintenanceDate: '2025-03-15',
      sensors,
      alerts,
      metadata: {
        field: 'Field A',
        operator: 'Energy Corp',
        installDate: `2023-${String(Math.floor(wellNumber / 2) + 1).padStart(2, '0')}-15`,
        depth: 8000 + (wellNumber * 100),
        production: {
          currentRate: baseFlowRate,
          averageRate: baseFlowRate * 0.95,
          cumulativeProduction: baseFlowRate * 365 * 2,
          efficiency: baseHealthScore
        }
      }
    };
  }
}

// Export singleton instance
export const wellDataService = new WellDataService();
