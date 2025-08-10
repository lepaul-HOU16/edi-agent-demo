/**
 * GraphQL Query Builder
 * 
 * This module provides utilities for building correct GraphQL queries
 * based on introspected schemas and service requirements.
 */

import { GraphQLSchema, GraphQLField, GraphQLType } from './types/graphql';
import { introspectionEngine } from './graphqlIntrospection';

export interface QueryBuilderOptions {
  includeTypename?: boolean;
  maxDepth?: number;
  defaultDataPartition?: string;
}

export interface QueryTemplate {
  name: string;
  query: string;
  variables: Record<string, any>;
  description?: string;
}

export class QueryBuilder {
  private defaultOptions: QueryBuilderOptions = {
    includeTypename: false,
    maxDepth: 3,
    defaultDataPartition: 'osdu'
  };

  private queryTemplates: Map<string, QueryTemplate> = new Map();

  constructor(private options: QueryBuilderOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
    
    // Initialize query templates directly in constructor
    this.queryTemplates.set('listSchemas', {
      name: 'listSchemas',
      query: `
        query ListSchemas($dataPartition: String!, $pagination: PaginationInput) {
          listSchemas(dataPartition: $dataPartition, pagination: $pagination) {
            items {
              id
              schemaIdentity {
                authority
                source
                entityType
                schemaVersionMajor
                schemaVersionMinor
                schemaVersionPatch
                id
              }
              status
              createdAt
            }
            pagination {
              nextToken
            }
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'List all schemas with pagination'
    });

    this.queryTemplates.set('validateData', {
      name: 'validateData',
      query: `
        query ValidateData($schemaId: ID!, $data: AWSJSON!, $dataPartition: String, $options: ValidationOptionsInput) {
          validateData(schemaId: $schemaId, data: $data, dataPartition: $dataPartition, options: $options) {
            valid
            schemaId
            validatedAt
            errors {
              code
              message
              path
              value
              schemaRule
              severity
            }
            warnings {
              code
              message
              path
              value
              schemaRule
              severity
            }
            info {
              code
              message
              path
              value
              schemaRule
              severity
            }
            validationTime
            rulesEvaluated
            dataPath
            schemaVersion
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'Validate data against a schema with enhanced error reporting'
    });

    this.queryTemplates.set('searchSchemas', {
      name: 'searchSchemas',
      query: `
        query SearchSchemas($query: String, $category: String, $authority: String, $dataPartition: String, $tags: [String!], $pagination: PaginationInput) {
          searchSchemas(query: $query, category: $category, authority: $authority, dataPartition: $dataPartition, tags: $tags, pagination: $pagination) {
            items {
              id
              schemaIdentity {
                authority
                source
                entityType
                schemaVersionMajor
                schemaVersionMinor
                schemaVersionPatch
                id
              }
              status
              scope
              createdBy
              createdAt
              updatedBy
              updatedAt
              uiMetadata {
                displayName
                description
                category
                tags
                icon
                color
              }
              usageStats {
                validationCount
                lastUsed
                errorRate
                avgValidationTime
              }
            }
            pagination {
              nextToken
            }
            totalCount
            categories
            authorities
            tags
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'Search schemas with advanced filtering and metadata'
    });

    this.queryTemplates.set('getSchemaStatistics', {
      name: 'getSchemaStatistics',
      query: `
        query GetSchemaStatistics($schemaId: ID, $dataPartition: String, $timeRange: String) {
          getSchemaStatistics(schemaId: $schemaId, dataPartition: $dataPartition, timeRange: $timeRange) {
            schemaId
            totalSchemas
            totalValidations
            avgErrorRate
            usageStats {
              validationCount
              lastUsed
              errorRate
              avgValidationTime
            }
            schemasByStatus {
              DEVELOPMENT
              PUBLISHED
              OBSOLETE
            }
            schemasByAuthority
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'Get comprehensive schema statistics and usage metrics'
    });

    this.queryTemplates.set('validateSchemaEvolution', {
      name: 'validateSchemaEvolution',
      query: `
        query ValidateSchemaEvolution($currentSchemaId: ID!, $newSchema: AWSJSON!, $dataPartition: String) {
          validateSchemaEvolution(currentSchemaId: $currentSchemaId, newSchema: $newSchema, dataPartition: $dataPartition) {
            compatible
            breakingChanges
            warnings
            migrationRequired
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'Validate schema evolution and detect breaking changes'
    });

    this.queryTemplates.set('getSchemaRelationships', {
      name: 'getSchemaRelationships',
      query: `
        query GetSchemaRelationships($schemaId: ID!, $dataPartition: String, $depth: Int) {
          getSchemaRelationships(schemaId: $schemaId, dataPartition: $dataPartition, depth: $depth) {
            schemaId
            relationship {
              type
              targetSchemaId
              propertyPath
              cardinality
            }
            schema {
              id
              schemaIdentity {
                authority
                source
                entityType
                schemaVersionMajor
                schemaVersionMinor
                schemaVersionPatch
                id
              }
              status
              uiMetadata {
                displayName
                description
                category
              }
            }
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'Get schema relationships and dependencies'
    });

    // Legal Tagging Service Query Templates (based on actual deployed schema)
    this.queryTemplates.set('listLegalTags', {
      name: 'listLegalTags',
      query: `
        query ListLegalTags($dataPartition: String!, $filter: LegalTagFilterInput) {
          listLegalTags(dataPartition: $dataPartition, filter: $filter) {
            items {
              id
              name
              description
              properties
            }
            pagination {
              nextToken
            }
          }
        }
      `,
      variables: { dataPartition: 'osdu', filter: {} },
      description: 'List legal tags with filter and pagination'
    });

    this.queryTemplates.set('getLegalTag', {
      name: 'getLegalTag',
      query: `
        query GetLegalTag($dataPartition: String!, $id: ID!) {
          getLegalTag(dataPartition: $dataPartition, id: $id) {
            id
            name
            description
            properties
          }
        }
      `,
      variables: { dataPartition: 'osdu' },
      description: 'Get a specific legal tag by ID with proper sub-selections'
    });

    this.queryTemplates.set('getLegalTags', {
      name: 'getLegalTags',
      query: `
        query GetLegalTags($dataPartition: String!, $filter: LegalTagFilterInput) {
          getLegalTags(dataPartition: $dataPartition, filter: $filter) {
            items {
              id
              name
              description
              properties
            }
            pagination {
              nextToken
            }
          }
        }
      `,
      variables: { dataPartition: 'osdu', filter: {} },
      description: 'Get all legal tags for a data partition'
    });
  }

  /**
   * Build a schema service query with proper arguments and field selections
   */
  async buildSchemaQuery(
    schema: GraphQLSchema,
    operation: string,
    args: Record<string, any> = {}
  ): Promise<string> {
    const field = this.findField(schema, operation);
    if (!field) {
      throw new Error(`Operation '${operation}' not found in schema`);
    }

    // Add required arguments
    const queryArgs = this.addRequiredArguments(field, args);
    
    // Build field selections based on return type
    const selections = await this.buildFieldSelections(schema, field, 0);

    return this.formatQuery(operation, queryArgs, selections);
  }

  /**
   * Build a legal tagging service query
   */
  async buildLegalTagQuery(
    schema: GraphQLSchema,
    operation: string,
    args: Record<string, any> = {}
  ): Promise<string> {
    // Check if we have a pre-built template for this operation
    const template = this.queryTemplates.get(operation);
    if (template) {
      console.log(`Using pre-built template for ${operation}`);
      return template.query;
    }

    const field = this.findField(schema, operation);
    if (!field) {
      throw new Error(`Operation '${operation}' not found in schema`);
    }

    // Handle special cases for legal tagging service
    let queryArgs = { ...args };
    
    if (operation === 'listLegalTags') {
      // listLegalTags requires dataPartition as direct argument
      if (!queryArgs.dataPartition) {
        queryArgs.dataPartition = this.options.defaultDataPartition;
      }
    } else if (operation === 'getLegalTag') {
      // getLegalTag requires both dataPartition and id arguments
      if (!queryArgs.dataPartition) {
        queryArgs.dataPartition = this.options.defaultDataPartition;
      }
      if (!queryArgs.id) {
        console.warn('getLegalTag requires an id argument');
      }
    }

    queryArgs = this.addRequiredArguments(field, queryArgs);
    const selections = await this.buildFieldSelections(schema, field, 0);

    return this.formatQuery(operation, queryArgs, selections);
  }

  /**
   * Build an entitlements service query
   */
  async buildEntitlementQuery(
    schema: GraphQLSchema,
    operation: string,
    args: Record<string, any> = {}
  ): Promise<string> {
    const field = this.findField(schema, operation);
    if (!field) {
      throw new Error(`Operation '${operation}' not found in schema`);
    }

    const queryArgs = this.addRequiredArguments(field, args);
    const selections = await this.buildFieldSelections(schema, field, 0);

    return this.formatQuery(operation, queryArgs, selections);
  }

  /**
   * Build a search service query
   */
  async buildSearchQuery(
    schema: GraphQLSchema,
    operation: string,
    args: Record<string, any> = {}
  ): Promise<string> {
    const field = this.findField(schema, operation);
    if (!field) {
      throw new Error(`Operation '${operation}' not found in schema`);
    }

    const queryArgs = this.addRequiredArguments(field, args);
    const selections = await this.buildFieldSelections(schema, field, 0);

    return this.formatQuery(operation, queryArgs, selections);
  }

  /**
   * Build a storage service query
   */
  async buildStorageQuery(
    schema: GraphQLSchema,
    operation: string,
    args: Record<string, any> = {}
  ): Promise<string> {
    const field = this.findField(schema, operation);
    if (!field) {
      throw new Error(`Operation '${operation}' not found in schema`);
    }

    const queryArgs = this.addRequiredArguments(field, args);
    const selections = await this.buildFieldSelections(schema, field, 0);

    return this.formatQuery(operation, queryArgs, selections);
  }

  /**
   * Add required arguments to a query based on schema requirements
   */
  addRequiredArguments(field: GraphQLField, providedArgs: Record<string, any>): Record<string, any> {
    const args = { ...providedArgs };

    // Add required arguments that are missing
    for (const arg of field.args) {
      if (this.isRequiredType(arg.type) && !(arg.name in args)) {
        // Add default values for common required arguments
        if (arg.name === 'dataPartition') {
          args.dataPartition = this.options.defaultDataPartition;
        } else if (arg.name === 'dataPartition' && field.name === 'listLegalTags') {
          // Special handling for listLegalTags dataPartition argument
          args.dataPartition = this.options.defaultDataPartition;
        } else if (arg.name === 'id' && !args.id) {
          // For operations that require an ID but none provided, throw an error
          throw new Error(`Required argument '${arg.name}' not provided for field '${field.name}'. Cannot build query without required parameters.`);
        } else {
          // For any other required argument, throw an error
          throw new Error(`Required argument '${arg.name}' not provided for field '${field.name}'. Cannot build query without required parameters.`);
        }
      }
    }

    return args;
  }

  /**
   * Build field selections for a GraphQL type
   */
  private async buildFieldSelections(
    schema: GraphQLSchema,
    field: GraphQLField,
    depth: number
  ): Promise<string[]> {
    if (depth >= (this.options.maxDepth || 3)) {
      return [];
    }

    const returnType = this.unwrapType(field.type);
    
    // If it's a scalar type, no sub-selections needed
    if (this.isScalarType(returnType)) {
      return [];
    }

    // Find the type definition in the schema
    const typeDefinition = schema.types.find(t => t.name === returnType.name);
    if (!typeDefinition || !typeDefinition.fields) {
      return [];
    }

    const selections: string[] = [];

    // Add basic scalar fields
    for (const typeField of typeDefinition.fields) {
      const fieldType = this.unwrapType(typeField.type);
      
      if (this.isScalarType(fieldType)) {
        selections.push(typeField.name);
      } else if (depth < (this.options.maxDepth || 3) - 1) {
        // Add nested object fields with sub-selections
        const subSelections = await this.buildFieldSelections(schema, typeField, depth + 1);
        if (subSelections.length > 0) {
          selections.push(`${typeField.name} { ${subSelections.join(' ')} }`);
        } else {
          // For objects without sub-selections, add common fields
          selections.push(`${typeField.name} { id name }`);
        }
      }
    }

    // Add __typename if requested
    if (this.options.includeTypename) {
      selections.push('__typename');
    }

    return selections;
  }

  /**
   * Format a complete GraphQL query
   */
  private formatQuery(
    operation: string,
    args: Record<string, any>,
    selections: string[]
  ): string {
    const argString = this.formatArguments(args);
    const selectionString = selections.length > 0 ? `{ ${selections.join(' ')} }` : '';

    return `
      query ${this.capitalize(operation)}${argString ? `(${argString})` : ''} {
        ${operation}${argString ? `(${this.formatVariableArguments(args)})` : ''} ${selectionString}
      }
    `.trim();
  }

  /**
   * Format GraphQL arguments for the query signature
   */
  private formatArguments(args: Record<string, any>): string {
    const argPairs: string[] = [];
    
    for (const [key, value] of Object.entries(args)) {
      const type = this.inferGraphQLType(value);
      argPairs.push(`$${key}: ${type}`);
    }

    return argPairs.join(', ');
  }

  /**
   * Format variable arguments for the query body
   */
  private formatVariableArguments(args: Record<string, any>): string {
    const argPairs: string[] = [];
    
    for (const key of Object.keys(args)) {
      argPairs.push(`${key}: $${key}`);
    }

    return argPairs.join(', ');
  }

  /**
   * Infer GraphQL type from JavaScript value
   */
  private inferGraphQLType(value: any): string {
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float';
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) return '[String]';
    if (typeof value === 'object') return 'AWSJSON';
    return 'String';
  }

  // Helper methods

  private findField(schema: GraphQLSchema, fieldName: string): GraphQLField | undefined {
    return schema.queryType.fields.find(field => field.name === fieldName) ||
           schema.mutationType?.fields.find(field => field.name === fieldName);
  }

  private isRequiredType(type: any): boolean {
    return type.kind === 'NON_NULL';
  }

  private unwrapType(type: any): any {
    if (type.ofType) {
      return this.unwrapType(type.ofType);
    }
    return type;
  }

  private isScalarType(type: any): boolean {
    const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'ID', 'AWSJSON'];
    return scalarTypes.includes(type.name) || type.kind === 'SCALAR';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }



  /**
   * Get a pre-built query template
   */
  getQueryTemplate(templateName: string): QueryTemplate | undefined {
    return this.queryTemplates.get(templateName);
  }

  /**
   * Get all available query templates
   */
  getAllQueryTemplates(): QueryTemplate[] {
    return Array.from(this.queryTemplates.values());
  }
}

// Export singleton instance
export const queryBuilder = new QueryBuilder();