/**
 * GraphQL Query Testing Utility
 * 
 * Provides tools for developers to test GraphQL queries, validate schemas,
 * and debug API interactions with detailed logging and error reporting.
 */

import { introspectionEngine } from './graphqlIntrospection';
import { legalTagLogger } from './legalTagLogger';

export interface QueryTestResult {
  success: boolean;
  data?: any;
  errors?: any[];
  duration: number;
  query: string;
  variables?: any;
  endpoint: string;
  timestamp: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  availableFields?: string[];
  requiredArguments?: string[];
}

export class GraphQLQueryTester {
  private testHistory: QueryTestResult[] = [];
  private readonly MAX_HISTORY = 100;

  /**
   * Test a GraphQL query against a specific endpoint
   */
  async testQuery(
    endpoint: string,
    query: string,
    variables: any = {},
    authHeaders: Record<string, string>
  ): Promise<QueryTestResult> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    const operationId = legalTagLogger.startOperation('graphql-query-test', {
      endpoint,
      queryType: this.extractOperationType(query)
    });

    try {
      legalTagLogger.logGraphQLQuery('graphql-query-test', query, variables, endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const duration = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      legalTagLogger.logGraphQLResponse('graphql-query-test', result, duration);

      const testResult: QueryTestResult = {
        success: !result.errors || result.errors.length === 0,
        data: result.data,
        errors: result.errors,
        duration,
        query,
        variables,
        endpoint,
        timestamp
      };

      // Add to history
      this.addToHistory(testResult);

      if (testResult.success) {
        legalTagLogger.endOperation(operationId, result.data);
      } else {
        legalTagLogger.endOperationWithError(operationId, result.errors, 'graphql_errors');
      }

      return testResult;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      const testResult: QueryTestResult = {
        success: false,
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
        duration,
        query,
        variables,
        endpoint,
        timestamp
      };

      this.addToHistory(testResult);
      legalTagLogger.endOperationWithError(operationId, error, 'network_error');

      return testResult;
    }
  }

  /**
   * Validate a query against an introspected schema
   */
  async validateQuery(
    endpoint: string,
    query: string,
    authHeaders: Record<string, string>
  ): Promise<SchemaValidationResult> {
    try {
      legalTagLogger.info('query-validation', 'Starting query validation', {
        endpoint,
        queryLength: query.length
      });

      // Get schema
      const schema = await introspectionEngine.introspectServiceWithAuth(endpoint, authHeaders);
      
      // Validate query
      const validation = introspectionEngine.validateQuery(schema, query);
      
      // Extract operation name and get additional info
      const operationName = this.extractOperationName(query);
      let availableFields: string[] = [];
      let requiredArguments: string[] = [];

      if (operationName) {
        const requiredArgs = introspectionEngine.getRequiredArguments(schema, operationName);
        requiredArguments = requiredArgs.map(arg => `${arg.name}: ${arg.type.name || arg.type.ofType?.name}`);
        
        // Get available fields for the return type
        const operation = schema.queryType.fields.find((f: any) => f.name === operationName) ||
                         schema.mutationType?.fields.find((f: any) => f.name === operationName);
        
        if (operation) {
          const returnTypeName = operation.type.name || operation.type.ofType?.name;
          if (returnTypeName) {
            const fields = introspectionEngine.getAvailableFields(schema, returnTypeName);
            availableFields = fields.map(f => f.name);
          }
        }
      }

      const result: SchemaValidationResult = {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
        availableFields,
        requiredArguments
      };

      legalTagLogger.info('query-validation', 'Query validation completed', {
        valid: result.valid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;

    } catch (error) {
      legalTagLogger.error('query-validation', 'Query validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: ['Ensure the endpoint is accessible and supports introspection']
      };
    }
  }

  /**
   * Generate a query template for a specific operation
   */
  async generateQueryTemplate(
    endpoint: string,
    operationName: string,
    authHeaders: Record<string, string>
  ): Promise<{ query: string; variables: any; description: string }> {
    try {
      const schema = await introspectionEngine.introspectServiceWithAuth(endpoint, authHeaders);
      
      // Find the operation
      const operation = schema.queryType.fields.find((f: any) => f.name === operationName) ||
                       schema.mutationType?.fields.find((f: any) => f.name === operationName);
      
      if (!operation) {
        throw new Error(`Operation '${operationName}' not found in schema`);
      }

      const isQuery = schema.queryType.fields.some((f: any) => f.name === operationName);
      const operationType = isQuery ? 'query' : 'mutation';

      // Build arguments
      const args = operation.args || [];
      const requiredArgs = args.filter((arg: any) => arg.type.kind === 'NON_NULL');
      const optionalArgs = args.filter((arg: any) => arg.type.kind !== 'NON_NULL');

      // Build variable definitions
      const variableDefinitions = args.map((arg: any) => {
        const typeName = arg.type.name || arg.type.ofType?.name || 'String';
        const isRequired = arg.type.kind === 'NON_NULL';
        return `$${arg.name}: ${typeName}${isRequired ? '!' : ''}`;
      }).join(', ');

      // Build argument list
      const argumentList = args.map((arg: any) => `${arg.name}: $${arg.name}`).join(', ');

      // Build field selection based on return type
      let fieldSelection = '';
      const returnType = operation.type.ofType || operation.type;
      
      if (returnType.kind === 'OBJECT') {
        // Get fields for the return type
        const typeFields = introspectionEngine.getAvailableFields(schema, returnType.name);
        const scalarFields = typeFields
          .filter(f => f.type.kind === 'SCALAR' || f.type.ofType?.kind === 'SCALAR')
          .slice(0, 5) // Limit to first 5 scalar fields
          .map(f => f.name);
        
        if (scalarFields.length > 0) {
          fieldSelection = `{\n    ${scalarFields.join('\n    ')}\n  }`;
        }
      } else if (returnType.kind === 'LIST') {
        const itemType = returnType.ofType;
        if (itemType && itemType.kind === 'OBJECT') {
          const typeFields = introspectionEngine.getAvailableFields(schema, itemType.name);
          const scalarFields = typeFields
            .filter(f => f.type.kind === 'SCALAR' || f.type.ofType?.kind === 'SCALAR')
            .slice(0, 5)
            .map(f => f.name);
          
          if (scalarFields.length > 0) {
            fieldSelection = `{\n    ${scalarFields.join('\n    ')}\n  }`;
          }
        }
      }

      // Build the complete query
      const queryName = `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}${operationName.charAt(0).toUpperCase() + operationName.slice(1)}`;
      
      const query = `${operationType} ${queryName}${variableDefinitions ? `(${variableDefinitions})` : ''} {
  ${operationName}${argumentList ? `(${argumentList})` : ''} ${fieldSelection}
}`;

      // Build default variables
      const variables: any = {};
      args.forEach((arg: any) => {
        const typeName = arg.type.name || arg.type.ofType?.name;
        
        if (arg.name === 'dataPartition') {
          variables[arg.name] = 'osdu';
        } else if (typeName === 'String') {
          variables[arg.name] = requiredArgs.includes(arg) ? '' : null;
        } else if (typeName === 'Int') {
          variables[arg.name] = requiredArgs.includes(arg) ? 0 : null;
        } else if (typeName === 'Boolean') {
          variables[arg.name] = false;
        } else {
          variables[arg.name] = null;
        }
      });

      // Build description
      const description = `${operationType.toUpperCase()} ${operationName}
${operation.description || 'No description available'}

Required Arguments: ${requiredArgs.map(arg => arg.name).join(', ') || 'None'}
Optional Arguments: ${optionalArgs.map(arg => arg.name).join(', ') || 'None'}
Return Type: ${returnType.name || returnType.kind}`;

      legalTagLogger.info('query-template-generation', 'Generated query template', {
        operationName,
        operationType,
        argumentCount: args.length,
        requiredArgumentCount: requiredArgs.length
      });

      return { query, variables, description };

    } catch (error) {
      legalTagLogger.error('query-template-generation', 'Failed to generate query template', {
        operationName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Get test history
   */
  getTestHistory(): QueryTestResult[] {
    return [...this.testHistory];
  }

  /**
   * Get successful tests only
   */
  getSuccessfulTests(): QueryTestResult[] {
    return this.testHistory.filter(test => test.success);
  }

  /**
   * Get failed tests only
   */
  getFailedTests(): QueryTestResult[] {
    return this.testHistory.filter(test => !test.success);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalTests: number;
    successRate: number;
    averageDuration: number;
    fastestQuery: number;
    slowestQuery: number;
  } {
    if (this.testHistory.length === 0) {
      return {
        totalTests: 0,
        successRate: 0,
        averageDuration: 0,
        fastestQuery: 0,
        slowestQuery: 0
      };
    }

    const totalTests = this.testHistory.length;
    const successfulTests = this.testHistory.filter(test => test.success).length;
    const successRate = (successfulTests / totalTests) * 100;
    
    const durations = this.testHistory.map(test => test.duration);
    const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    const fastestQuery = Math.min(...durations);
    const slowestQuery = Math.max(...durations);

    return {
      totalTests,
      successRate,
      averageDuration,
      fastestQuery,
      slowestQuery
    };
  }

  /**
   * Clear test history
   */
  clearHistory(): void {
    this.testHistory = [];
    legalTagLogger.info('query-tester', 'Test history cleared');
  }

  /**
   * Export test history
   */
  exportHistory(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'success', 'duration', 'endpoint', 'query', 'errors'];
      const rows = this.testHistory.map(test => [
        test.timestamp,
        test.success.toString(),
        test.duration.toString(),
        test.endpoint,
        test.query.replace(/\n/g, ' ').replace(/,/g, ';'),
        test.errors ? JSON.stringify(test.errors).replace(/,/g, ';') : ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify({
      testHistory: this.testHistory,
      performanceStats: this.getPerformanceStats(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Private helper methods

  private addToHistory(result: QueryTestResult): void {
    this.testHistory.push(result);
    
    // Keep only the most recent tests
    if (this.testHistory.length > this.MAX_HISTORY) {
      this.testHistory.shift();
    }
  }

  private extractOperationType(query: string): string {
    const match = query.trim().match(/^(query|mutation|subscription)/i);
    return match ? match[1].toLowerCase() : 'query';
  }

  private extractOperationName(query: string): string | null {
    // Extract the operation name from the query
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/i);
    if (match) return match[1];

    // If no named operation, try to extract the field name
    const fieldMatch = query.match(/{\s*(\w+)/);
    return fieldMatch ? fieldMatch[1] : null;
  }
}

// Export singleton instance
export const graphqlQueryTester = new GraphQLQueryTester();

// Export types
export type { QueryTestResult, SchemaValidationResult };