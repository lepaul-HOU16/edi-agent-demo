/**
 * GraphQL Introspection Engine
 * 
 * This module provides utilities for GraphQL schema introspection,
 * query validation, and automatic query building based on discovered schemas.
 */

import { GraphQLField, GraphQLArgument, GraphQLType, GraphQLSchema, ValidationResult } from './types/graphql';

export class GraphQLIntrospectionEngine {
  private schemaCache: Map<string, GraphQLSchema> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Perform GraphQL introspection on a service endpoint using API key
   */
  async introspectService(endpoint: string, apiKey: string): Promise<GraphQLSchema> {
    const cacheKey = `${endpoint}:${apiKey}`;
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.schemaCache.get(cacheKey)!;
    }

    try {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType {
              name
              fields {
                name
                description
                args {
                  name
                  description
                  type {
                    ...TypeRef
                  }
                  defaultValue
                }
                type {
                  ...TypeRef
                }
              }
            }
            mutationType {
              name
              fields {
                name
                description
                args {
                  name
                  description
                  type {
                    ...TypeRef
                  }
                  defaultValue
                }
                type {
                  ...TypeRef
                }
              }
            }
            types {
              ...FullType
            }
          }
        }

        fragment FullType on __Type {
          kind
          name
          description
          fields(includeDeprecated: true) {
            name
            description
            args {
              name
              description
              type {
                ...TypeRef
              }
              defaultValue
            }
            type {
              ...TypeRef
            }
          }
        }

        fragment TypeRef on __Type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          query: introspectionQuery
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL introspection errors: ${JSON.stringify(result.errors)}`);
      }

      const schema = result.data.__schema;
      
      // Cache the result
      this.schemaCache.set(cacheKey, schema);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return schema;
    } catch (error) {
      console.error('GraphQL introspection failed:', error);
      throw new Error(`Failed to introspect GraphQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform GraphQL introspection on a service endpoint using authentication headers
   * For OSDU compliance with Cognito tokens
   */
  async introspectServiceWithAuth(endpoint: string, authHeaders: Record<string, string>): Promise<GraphQLSchema> {
    const cacheKey = `${endpoint}:auth`;
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      return this.schemaCache.get(cacheKey)!;
    }

    try {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType {
              name
              fields {
                name
                description
                args {
                  name
                  description
                  type {
                    ...TypeRef
                  }
                  defaultValue
                }
                type {
                  ...TypeRef
                }
              }
            }
            mutationType {
              name
              fields {
                name
                description
                args {
                  name
                  description
                  type {
                    ...TypeRef
                  }
                  defaultValue
                }
                type {
                  ...TypeRef
                }
              }
            }
            types {
              ...FullType
            }
          }
        }

        fragment FullType on __Type {
          kind
          name
          description
          fields(includeDeprecated: true) {
            name
            description
            args {
              name
              description
              type {
                ...TypeRef
              }
              defaultValue
            }
            type {
              ...TypeRef
            }
          }
        }

        fragment TypeRef on __Type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      let response;
      let lastError;
      
      // Retry logic for network issues
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`GraphQL introspection attempt ${attempt}/3 for endpoint: ${endpoint}`);
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              query: introspectionQuery
            })
          });
          
          if (response.ok) {
            break; // Success, exit retry loop
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          lastError = error;
          console.warn(`GraphQL introspection attempt ${attempt} failed:`, error.message);
          
          if (attempt < 3) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to introspect GraphQL schema after 3 attempts: ${lastError?.message || 'Unknown error'}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL introspection errors: ${JSON.stringify(result.errors)}`);
      }

      const schema = result.data.__schema;
      
      // Cache the result
      this.schemaCache.set(cacheKey, schema);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return schema;
    } catch (error) {
      console.error('GraphQL introspection with auth failed:', error);
      throw new Error(`Failed to introspect GraphQL schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a GraphQL query against an introspected schema
   */
  validateQuery(schema: GraphQLSchema, query: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Basic query parsing and validation
      const queryMatch = query.match(/(?:query|mutation)\s+(\w+)?\s*(?:\([^)]*\))?\s*\{([^}]+)\}/);
      if (!queryMatch) {
        result.valid = false;
        result.errors.push('Invalid query format');
        return result;
      }

      const queryBody = queryMatch[2];
      const fields = this.parseQueryFields(queryBody);

      // Validate each field against the schema
      for (const field of fields) {
        const schemaField = this.findSchemaField(schema, field.name);
        if (!schemaField) {
          result.valid = false;
          result.errors.push(`Field '${field.name}' not found in schema`);
          result.suggestions.push(`Available fields: ${schema.queryType.fields.map(f => f.name).join(', ')}`);
          continue;
        }

        // Validate arguments
        const missingArgs = this.validateArguments(schemaField, field.args);
        if (missingArgs.length > 0) {
          result.valid = false;
          result.errors.push(`Missing required arguments for '${field.name}': ${missingArgs.join(', ')}`);
        }

        // Validate field selections
        const fieldValidation = this.validateFieldSelections(schema, schemaField, field.selections);
        if (!fieldValidation.valid) {
          result.valid = false;
          result.errors.push(...fieldValidation.errors);
          result.suggestions.push(...fieldValidation.suggestions);
        }
      }

    } catch (error) {
      result.valid = false;
      result.errors.push(`Query validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get required arguments for a specific operation
   */
  getRequiredArguments(schema: GraphQLSchema, operationName: string): GraphQLArgument[] {
    const field = this.findSchemaField(schema, operationName);
    if (!field) {
      return [];
    }

    return field.args.filter(arg => this.isRequiredType(arg.type));
  }

  /**
   * Get available fields for a specific type
   */
  getAvailableFields(schema: GraphQLSchema, typeName: string): GraphQLField[] {
    const type = schema.types.find(t => t.name === typeName);
    if (!type || !type.fields) {
      return [];
    }

    return type.fields;
  }

  /**
   * Clear the schema cache
   */
  clearCache(): void {
    this.schemaCache.clear();
    this.cacheExpiry.clear();
  }

  // Private helper methods

  private isValidCache(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry !== undefined && Date.now() < expiry && this.schemaCache.has(cacheKey);
  }

  private parseQueryFields(queryBody: string): any[] {
    // Simple field parsing - in a real implementation, you'd use a proper GraphQL parser
    const fields: any[] = [];
    const fieldMatches = queryBody.match(/(\w+)(?:\s*\([^)]*\))?\s*(?:\{[^}]*\})?/g);
    
    if (fieldMatches) {
      for (const match of fieldMatches) {
        const fieldName = match.match(/(\w+)/)?.[1];
        if (fieldName) {
          fields.push({
            name: fieldName,
            args: this.parseArguments(match),
            selections: this.parseSelections(match)
          });
        }
      }
    }

    return fields;
  }

  private parseArguments(fieldString: string): Record<string, any> {
    const argsMatch = fieldString.match(/\(([^)]*)\)/);
    if (!argsMatch) return {};

    const args: Record<string, any> = {};
    const argPairs = argsMatch[1].split(',');
    
    for (const pair of argPairs) {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) {
        args[key] = value;
      }
    }

    return args;
  }

  private parseSelections(fieldString: string): string[] {
    const selectionsMatch = fieldString.match(/\{([^}]*)\}/);
    if (!selectionsMatch) return [];

    return selectionsMatch[1]
      .split(/\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private findSchemaField(schema: GraphQLSchema, fieldName: string): GraphQLField | undefined {
    return schema.queryType.fields.find(field => field.name === fieldName) ||
           schema.mutationType?.fields.find(field => field.name === fieldName);
  }

  private validateArguments(schemaField: GraphQLField, providedArgs: Record<string, any>): string[] {
    const missingArgs: string[] = [];
    
    for (const arg of schemaField.args) {
      if (this.isRequiredType(arg.type) && !(arg.name in providedArgs)) {
        missingArgs.push(arg.name);
      }
    }

    return missingArgs;
  }

  private validateFieldSelections(schema: GraphQLSchema, field: GraphQLField, selections: string[]): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check if field requires sub-selections
    if (this.requiresSubSelection(field.type) && selections.length === 0) {
      result.valid = false;
      result.errors.push(`Field '${field.name}' requires sub-selection`);
      
      const availableFields = this.getFieldsForType(schema, field.type);
      if (availableFields.length > 0) {
        result.suggestions.push(`Available fields: ${availableFields.map(f => f.name).join(', ')}`);
      }
    }

    return result;
  }

  private isRequiredType(type: GraphQLType): boolean {
    return type.kind === 'NON_NULL';
  }

  private requiresSubSelection(type: GraphQLType): boolean {
    const actualType = this.unwrapType(type);
    return actualType.kind === 'OBJECT' || actualType.kind === 'INTERFACE';
  }

  private unwrapType(type: GraphQLType): GraphQLType {
    if (type.ofType) {
      return this.unwrapType(type.ofType);
    }
    return type;
  }

  private getFieldsForType(schema: GraphQLSchema, type: GraphQLType): GraphQLField[] {
    const actualType = this.unwrapType(type);
    const schemaType = schema.types.find(t => t.name === actualType.name);
    return schemaType?.fields || [];
  }
}

// Export singleton instance
export const introspectionEngine = new GraphQLIntrospectionEngine();