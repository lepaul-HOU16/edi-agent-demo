/**
 * Enhanced Schema Service (JavaScript version)
 * 
 * Provides access to enhanced schema operations including validation,
 * search, statistics, and evolution analysis.
 * 
 * Requirements: 1.3, 6.2, 6.3, 6.4
 */

import { queryBuilder } from '../utils/queryBuilder';
import { serviceConfigManager } from './serviceConfigManager';

export class EnhancedSchemaService {
  constructor() {
    this.defaultDataPartition = 'osdu';
  }

  /**
   * Validate data against a schema with enhanced error reporting
   * Requirement: 6.2 - Enhanced validation with detailed error reporting
   */
  async validateData(schemaId, data, dataPartition = this.defaultDataPartition, options = {}) {
    try {
      const template = queryBuilder.getQueryTemplate('validateData');
      if (!template) {
        throw new Error('validateData template not found');
      }

      const variables = {
        schemaId,
        data: JSON.stringify(data),
        dataPartition,
        options
      };

      const result = await this.executeQuery(template.query, variables);
      return result.validateData;
    } catch (error) {
      console.error('Error validating data:', error);
      throw new Error(`Failed to validate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search schemas with advanced filtering and metadata
   * Requirement: 6.3 - Schema search with filtering capabilities
   */
  async searchSchemas(filters, dataPartition = this.defaultDataPartition) {
    try {
      const template = queryBuilder.getQueryTemplate('searchSchemas');
      if (!template) {
        throw new Error('searchSchemas template not found');
      }

      const variables = {
        query: filters.query,
        category: filters.category,
        authority: filters.authority,
        tags: filters.tags,
        dataPartition,
        pagination: filters.pagination || { limit: 20 }
      };

      const result = await this.executeQuery(template.query, variables);
      return result.searchSchemas;
    } catch (error) {
      console.error('Error searching schemas:', error);
      throw new Error(`Failed to search schemas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive schema statistics and usage metrics
   * Requirement: 6.3 - Schema usage analytics and statistics
   */
  async getSchemaStatistics(schemaId, dataPartition = this.defaultDataPartition, timeRange) {
    try {
      const template = queryBuilder.getQueryTemplate('getSchemaStatistics');
      if (!template) {
        throw new Error('getSchemaStatistics template not found');
      }

      const variables = {
        schemaId,
        dataPartition,
        timeRange
      };

      const result = await this.executeQuery(template.query, variables);
      return result.getSchemaStatistics;
    } catch (error) {
      console.error('Error getting schema statistics:', error);
      throw new Error(`Failed to get schema statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate schema evolution and detect breaking changes
   * Requirement: 6.4 - Schema evolution validation and migration analysis
   */
  async validateSchemaEvolution(currentSchemaId, newSchema, dataPartition = this.defaultDataPartition) {
    try {
      const template = queryBuilder.getQueryTemplate('validateSchemaEvolution');
      if (!template) {
        throw new Error('validateSchemaEvolution template not found');
      }

      const variables = {
        currentSchemaId,
        newSchema: JSON.stringify(newSchema),
        dataPartition
      };

      const result = await this.executeQuery(template.query, variables);
      return result.validateSchemaEvolution;
    } catch (error) {
      console.error('Error validating schema evolution:', error);
      throw new Error(`Failed to validate schema evolution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get schema relationships and dependencies
   * Requirement: 6.3 - Schema relationship visualization
   */
  async getSchemaRelationships(schemaId, dataPartition = this.defaultDataPartition, depth = 1) {
    try {
      const template = queryBuilder.getQueryTemplate('getSchemaRelationships');
      if (!template) {
        throw new Error('getSchemaRelationships template not found');
      }

      const variables = {
        schemaId,
        dataPartition,
        depth
      };

      const result = await this.executeQuery(template.query, variables);
      return result.getSchemaRelationships;
    } catch (error) {
      console.error('Error getting schema relationships:', error);
      throw new Error(`Failed to get schema relationships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if enhanced features are available
   */
  async checkEnhancedFeaturesAvailability(dataPartition = this.defaultDataPartition) {
    try {
      const schemaEndpoint = serviceConfigManager.getServiceEndpoint('schema');
      if (!schemaEndpoint) {
        return {
          validation: false,
          search: false,
          statistics: false,
          evolution: false,
          relationships: false
        };
      }

      // Check service features from health check
      const features = schemaEndpoint.features || [];
      
      return {
        validation: features.includes('data-validation'),
        search: features.includes('schema-search'),
        statistics: features.includes('schema-statistics'),
        evolution: features.includes('schema-comparison'),
        relationships: features.includes('schema-relationships')
      };
    } catch (error) {
      console.warn('Failed to check enhanced features availability:', error);
      return {
        validation: false,
        search: false,
        statistics: false,
        evolution: false,
        relationships: false
      };
    }
  }

  /**
   * Execute GraphQL query with proper authentication
   */
  async executeQuery(query, variables) {
    try {
      const schemaEndpoint = serviceConfigManager.getServiceEndpoint('schema');
      if (!schemaEndpoint) {
        throw new Error('Schema service endpoint not configured');
      }

      const headers = await serviceConfigManager.getAuthHeaders(variables.dataPartition);
      
      const response = await fetch(schemaEndpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL request failed:', error);
      throw error;
    }
  }

  /**
   * Utility methods for common operations
   */

  /**
   * Format schema version string
   */
  formatSchemaVersion(schema) {
    const { schemaVersionMajor, schemaVersionMinor, schemaVersionPatch } = schema.schemaIdentity;
    return `${schemaVersionMajor}.${schemaVersionMinor}.${schemaVersionPatch}`;
  }

  /**
   * Format schema identity string
   */
  formatSchemaIdentity(schema) {
    const { authority, source, entityType } = schema.schemaIdentity;
    const version = this.formatSchemaVersion(schema);
    return `${authority}:${source}:${entityType}:${version}`;
  }

  /**
   * Get validation severity color
   */
  getValidationSeverityColor(severity) {
    switch (severity) {
      case 'ERROR':
        return '#dc3545'; // Red
      case 'WARNING':
        return '#ffc107'; // Yellow
      case 'INFO':
        return '#17a2b8'; // Blue
      default:
        return '#6c757d'; // Gray
    }
  }

  /**
   * Get schema status color
   */
  getSchemaStatusColor(status) {
    switch (status) {
      case 'DEVELOPMENT':
        return '#ffc107'; // Yellow
      case 'PUBLISHED':
        return '#28a745'; // Green
      case 'OBSOLETE':
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Gray
    }
  }
}

// Export singleton instance
export const enhancedSchemaService = new EnhancedSchemaService();
export default enhancedSchemaService;