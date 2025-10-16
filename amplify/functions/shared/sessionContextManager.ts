/**
 * SessionContextManager - DynamoDB-based session context tracking
 * 
 * Manages session state for renewable energy projects with:
 * - Active project tracking per session
 * - Project history (recently accessed projects)
 * - DynamoDB persistence with 7-day TTL
 * - In-memory caching with 5-minute TTL
 * - Graceful fallback to session-only context
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  GetCommandInput,
  PutCommandInput,
  UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';

/**
 * Session context structure
 */
export interface SessionContext {
  session_id: string;
  user_id: string;
  active_project?: string;      // Current project name
  project_history: string[];    // Recently accessed projects (max 10)
  last_updated: string;         // ISO timestamp
  ttl?: number;                 // Unix timestamp for DynamoDB TTL
}

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * SessionContextManager class for DynamoDB-based session tracking
 */
export class SessionContextManager {
  private dynamoClient: DynamoDBDocumentClient;
  private tableName: string;
  private cache: Map<string, CacheEntry<SessionContext>> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private sessionTTL: number = 7 * 24 * 60 * 60; // 7 days in seconds
  private maxHistorySize: number = 10;

  constructor(tableName?: string) {
    const client = new DynamoDBClient({});
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName || process.env.SESSION_CONTEXT_TABLE || 'RenewableSessionContext';
    
    if (!this.tableName) {
      console.warn('[SessionContextManager] No DynamoDB table configured. Using in-memory cache only.');
    }
  }

  /**
   * Get session context
   * @param sessionId - Chat session ID
   * @returns Session context
   */
  async getContext(sessionId: string): Promise<SessionContext> {
    try {
      // Check cache first
      const cached = this.cache.get(sessionId);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        console.log(`[SessionContextManager] Cache hit for session: ${sessionId}`);
        return cached.data;
      }

      // Query DynamoDB
      if (!this.tableName) {
        console.warn(`[SessionContextManager] No table configured, creating new context for ${sessionId}`);
        return this.createNewContext(sessionId);
      }

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          session_id: sessionId,
        },
      };

      const result = await this.dynamoClient.send(new GetCommand(params));

      if (result.Item) {
        const context = result.Item as SessionContext;
        
        // Update cache
        this.cache.set(sessionId, {
          data: context,
          timestamp: Date.now(),
        });

        console.log(`[SessionContextManager] Loaded context from DynamoDB for session: ${sessionId}`);
        return context;
      }

      // Create new context if not found
      const newContext = this.createNewContext(sessionId);
      await this.saveContext(newContext);
      return newContext;

    } catch (error) {
      this.handleDynamoDBError(error, 'GetContext', sessionId);
      
      // Fallback to cache even if expired
      const cached = this.cache.get(sessionId);
      if (cached) {
        console.warn(`[SessionContextManager] Using ${Date.now() - cached.timestamp > this.cacheTTL ? 'expired' : 'valid'} cache for ${sessionId} due to DynamoDB error`);
        return cached.data;
      }

      // Last resort: create new session-only context
      console.warn(`[SessionContextManager] Creating session-only context for ${sessionId} due to DynamoDB error`);
      return this.createNewContext(sessionId);
    }
  }

  /**
   * Set active project for session
   * @param sessionId - Chat session ID
   * @param projectName - Project name to set as active
   */
  async setActiveProject(sessionId: string, projectName: string): Promise<void> {
    const now = new Date().toISOString();
    
    try {
      const ttl = Math.floor(Date.now() / 1000) + this.sessionTTL;

      if (!this.tableName) {
        console.warn(`[SessionContextManager] No table configured, updating cache only for ${sessionId}`);
        const cached = this.cache.get(sessionId);
        if (cached) {
          cached.data.active_project = projectName;
          cached.data.last_updated = now;
          cached.timestamp = Date.now();
        }
        return;
      }

      // Update DynamoDB
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          session_id: sessionId,
        },
        UpdateExpression: 'SET active_project = :project, last_updated = :updated, #ttl = :ttl',
        ExpressionAttributeNames: {
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':project': projectName,
          ':updated': now,
          ':ttl': ttl,
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamoClient.send(new UpdateCommand(params));

      if (result.Attributes) {
        const context = result.Attributes as SessionContext;
        
        // Update cache
        this.cache.set(sessionId, {
          data: context,
          timestamp: Date.now(),
        });

        console.log(`[SessionContextManager] Set active project for ${sessionId}: ${projectName}`);
      }

    } catch (error) {
      this.handleDynamoDBError(error, 'SetActiveProject', sessionId);
      
      // Fallback: update cache only
      console.warn(`[SessionContextManager] Falling back to cache-only update for ${sessionId}`);
      const cached = this.cache.get(sessionId);
      if (cached) {
        cached.data.active_project = projectName;
        cached.data.last_updated = now;
        cached.timestamp = Date.now();
      } else {
        // Create new cache entry
        const newContext = this.createNewContext(sessionId);
        newContext.active_project = projectName;
        this.cache.set(sessionId, {
          data: newContext,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Get active project for session
   * @param sessionId - Chat session ID
   * @returns Active project name or null
   */
  async getActiveProject(sessionId: string): Promise<string | null> {
    try {
      const context = await this.getContext(sessionId);
      return context.active_project || null;
    } catch (error) {
      console.error(`[SessionContextManager] Error getting active project for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Add project to history
   * @param sessionId - Chat session ID
   * @param projectName - Project name to add
   */
  async addToHistory(sessionId: string, projectName: string): Promise<void> {
    const now = new Date().toISOString();
    
    try {
      const context = await this.getContext(sessionId);
      
      // Remove project if already in history
      const history = context.project_history.filter(p => p !== projectName);
      
      // Add to front of history
      history.unshift(projectName);
      
      // Limit history size
      const trimmedHistory = history.slice(0, this.maxHistorySize);
      
      const ttl = Math.floor(Date.now() / 1000) + this.sessionTTL;

      if (!this.tableName) {
        console.warn(`[SessionContextManager] No table configured, updating cache only for ${sessionId}`);
        const cached = this.cache.get(sessionId);
        if (cached) {
          cached.data.project_history = trimmedHistory;
          cached.data.last_updated = now;
          cached.timestamp = Date.now();
        }
        return;
      }

      // Update DynamoDB
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          session_id: sessionId,
        },
        UpdateExpression: 'SET project_history = :history, last_updated = :updated, #ttl = :ttl',
        ExpressionAttributeNames: {
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':history': trimmedHistory,
          ':updated': now,
          ':ttl': ttl,
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamoClient.send(new UpdateCommand(params));

      if (result.Attributes) {
        const updatedContext = result.Attributes as SessionContext;
        
        // Update cache
        this.cache.set(sessionId, {
          data: updatedContext,
          timestamp: Date.now(),
        });

        console.log(`[SessionContextManager] Added ${projectName} to history for ${sessionId}`);
      }

    } catch (error) {
      this.handleDynamoDBError(error, 'AddToHistory', sessionId);
      
      // Fallback: update cache only
      console.warn(`[SessionContextManager] Falling back to cache-only update for ${sessionId}`);
      const cached = this.cache.get(sessionId);
      if (cached) {
        const history = cached.data.project_history.filter(p => p !== projectName);
        history.unshift(projectName);
        cached.data.project_history = history.slice(0, this.maxHistorySize);
        cached.data.last_updated = now; // now is defined at function start
        cached.timestamp = Date.now();
      }
    }
  }

  /**
   * Create new session context
   */
  private createNewContext(sessionId: string, userId: string = 'default'): SessionContext {
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + this.sessionTTL;

    return {
      session_id: sessionId,
      user_id: userId,
      project_history: [],
      last_updated: now,
      ttl,
    };
  }

  /**
   * Save context to DynamoDB
   */
  private async saveContext(context: SessionContext): Promise<void> {
    try {
      if (!this.tableName) {
        console.warn(`[SessionContextManager] No table configured, saving to cache only`);
        this.cache.set(context.session_id, {
          data: context,
          timestamp: Date.now(),
        });
        return;
      }

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: context,
      };

      await this.dynamoClient.send(new PutCommand(params));

      // Update cache
      this.cache.set(context.session_id, {
        data: context,
        timestamp: Date.now(),
      });

      console.log(`[SessionContextManager] Saved new context for session: ${context.session_id}`);

    } catch (error) {
      this.handleDynamoDBError(error, 'SaveContext', context.session_id);
      
      // Fallback: save to cache only
      console.warn(`[SessionContextManager] Falling back to cache-only storage for ${context.session_id}`);
      this.cache.set(context.session_id, {
        data: context,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle DynamoDB error with appropriate logging
   */
  private handleDynamoDBError(error: any, operation: string, sessionId?: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';

    if (errorName === 'ResourceNotFoundException') {
      console.error(`[SessionContextManager] ${operation}: DynamoDB table does not exist: ${this.tableName}`);
    } else if (errorName === 'AccessDeniedException') {
      console.error(`[SessionContextManager] ${operation}: Access denied to DynamoDB table: ${this.tableName}`);
    } else if (errorName === 'ProvisionedThroughputExceededException') {
      console.warn(`[SessionContextManager] ${operation}: Throughput exceeded for table: ${this.tableName}`);
    } else {
      console.error(`[SessionContextManager] ${operation}: Unexpected error: ${errorName} - ${errorMessage}${sessionId ? ` (session: ${sessionId})` : ''}`);
    }
  }

  /**
   * Invalidate cache for session
   * @param sessionId - Chat session ID
   */
  invalidateCache(sessionId: string): void {
    this.cache.delete(sessionId);
    console.log(`[SessionContextManager] Cache invalidated for session: ${sessionId}`);
  }

  /**
   * Clear all caches (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[SessionContextManager] All caches cleared');
  }

  /**
   * Get cache statistics (useful for monitoring)
   */
  getCacheStats(): {
    cacheSize: number;
    cacheTTL: number;
    sessionTTL: number;
  } {
    return {
      cacheSize: this.cache.size,
      cacheTTL: this.cacheTTL,
      sessionTTL: this.sessionTTL,
    };
  }
}
