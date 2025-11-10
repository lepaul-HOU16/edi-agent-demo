/**
 * Query History Storage Utility
 * 
 * Manages localStorage-based storage for OSDU query builder history.
 * Stores the last 20 queries with timestamps and result counts.
 * 
 * Requirements: 10.1, 10.2, 10.4
 */

export interface QueryCriterion {
  id: string;
  field: string;
  operator: string;
  value: string | number | string[];
  logic: 'AND' | 'OR';
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  dataType: string;
  criteria: QueryCriterion[];
  timestamp: string;
  resultCount?: number;
}

export class QueryHistory {
  private static readonly STORAGE_KEY = 'osdu_query_history';
  private static readonly MAX_ITEMS = 20;

  /**
   * Save a query to history
   * Requirement 10.1: Store the last 20 query builder queries in browser local storage
   * Requirement 10.4: Include query parameters and result counts
   */
  static save(item: Omit<QueryHistoryItem, 'id' | 'timestamp'>): void {
    try {
      const history = this.getAll();
      const newItem: QueryHistoryItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };

      // Add to beginning of array
      history.unshift(newItem);

      // Keep only last 20 items
      const trimmed = history.slice(0, this.MAX_ITEMS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
      
      console.log('✅ Query saved to history:', newItem.id);
    } catch (error) {
      console.error('❌ Failed to save query to history:', error);
    }
  }

  /**
   * Retrieve all queries from history
   * Requirement 10.2: Display previous queries with timestamps
   */
  static getAll(): QueryHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        console.warn('⚠️ Invalid query history format, resetting');
        return [];
      }

      return parsed;
    } catch (error) {
      console.error('❌ Failed to retrieve query history:', error);
      return [];
    }
  }

  /**
   * Get a specific query by ID
   */
  static getById(id: string): QueryHistoryItem | undefined {
    const history = this.getAll();
    return history.find(item => item.id === id);
  }

  /**
   * Delete a specific query from history
   * Requirement 10.4: Allow users to delete queries from history
   */
  static delete(id: string): void {
    try {
      const history = this.getAll();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      
      console.log('✅ Query deleted from history:', id);
    } catch (error) {
      console.error('❌ Failed to delete query from history:', error);
    }
  }

  /**
   * Clear all query history
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Query history cleared');
    } catch (error) {
      console.error('❌ Failed to clear query history:', error);
    }
  }

  /**
   * Get recent queries (last N items)
   */
  static getRecent(count: number = 5): QueryHistoryItem[] {
    const history = this.getAll();
    return history.slice(0, count);
  }

  /**
   * Search query history by query text
   */
  static search(searchTerm: string): QueryHistoryItem[] {
    const history = this.getAll();
    const lowerSearch = searchTerm.toLowerCase();
    
    return history.filter(item => 
      item.query.toLowerCase().includes(lowerSearch) ||
      item.dataType.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Get statistics about query history
   */
  static getStats(): {
    totalQueries: number;
    dataTypeBreakdown: Record<string, number>;
    averageResultCount: number;
  } {
    const history = this.getAll();
    
    const dataTypeBreakdown: Record<string, number> = {};
    let totalResults = 0;
    let queriesWithResults = 0;

    history.forEach(item => {
      // Count by data type
      dataTypeBreakdown[item.dataType] = (dataTypeBreakdown[item.dataType] || 0) + 1;
      
      // Calculate average results
      if (item.resultCount !== undefined) {
        totalResults += item.resultCount;
        queriesWithResults++;
      }
    });

    return {
      totalQueries: history.length,
      dataTypeBreakdown,
      averageResultCount: queriesWithResults > 0 ? totalResults / queriesWithResults : 0
    };
  }
}
