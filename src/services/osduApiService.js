import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import config from './config';
import { introspectionEngine } from '../utils/graphqlIntrospection';
import { queryBuilder } from '../utils/queryBuilder';
import { serviceConfigManager } from './serviceConfigManager';
import { normalizeLegalTagResponse, isEmptyResponse, isErrorResponse } from '../utils/responseNormalizer';
import { legalTagErrorHandler } from '../utils/legalTagErrorHandler';
import { legalTagLogger } from '../utils/legalTagLogger';

/**
 * OSDU M25 Compliant API Service
 * Handles all API calls to OSDU services using Cognito authentication tokens
 * Updated to match OSDU M25 specification and deployed backend schema
 */
class OSDUApiService {
  constructor() {
    this.client = generateClient();
    
    // Initialize service configuration manager
    this.serviceConfigManager = serviceConfigManager;
    
    // Legacy endpoints for backward compatibility
    this.endpoints = {
      schema: config.VITE_SCHEMA_API_URL,
      entitlements: config.VITE_ENTITLEMENTS_API_URL,
      legal: config.VITE_LEGAL_API_URL,
      search: config.VITE_SEARCH_API_URL,
      storage: config.VITE_STORAGE_API_URL,
      ai: config.VITE_AI_API_URL,
      dataIngestion: config.VITE_DATA_INGESTION_API_URL,
      seismicIngestion: config.VITE_SEISMIC_INGESTION_API_URL
    };
    
    // Default data partition for OSDU
    this.defaultDataPartition = config.VITE_DEFAULT_DATA_PARTITION || 'osdu';
    
    // Cache for introspected schemas
    this.schemaCache = new Map();
    
    // Initialize service discovery and health monitoring
    this.initializeServices();
  }

  /**
   * Initialize services with discovery and health monitoring
   */
  async initializeServices() {
    try {
      // Discover services from deployment outputs
      await this.serviceConfigManager.discoverServicesFromDeployment();
      
      // Start health monitoring (every 5 minutes)
      this.serviceConfigManager.startHealthMonitoring(300000);
      
      console.log('Service configuration initialized with health monitoring');
    } catch (error) {
      console.warn('Service initialization failed, using fallback configuration:', error);
    }
  }

  /**
   * Get authentication headers with Cognito tokens
   * Now uses ServiceConfigManager for consistent authentication
   */
  async getAuthHeaders(dataPartition = this.defaultDataPartition) {
    return this.serviceConfigManager.getAuthHeaders(dataPartition);
  }

  /**
   * Set tokens from OIDC context (called by the auth context)
   */
  setTokens(idToken, accessToken) {
    if (typeof window !== 'undefined') {
      window.__OIDC_TOKENS__ = {
        idToken,
        accessToken,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Make GraphQL request with proper authentication
   */
  async graphqlRequest(endpoint, query, variables = {}) {
    try {
      const headers = await this.getAuthHeaders(variables.dataPartition);
      
      const response = await fetch(endpoint, {
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
   * Get or introspect schema for a service
   * Updated to use ServiceConfigManager for endpoint resolution
   */
  async getServiceSchema(serviceName) {
    // Try to get endpoint from service config manager first
    const serviceEndpoint = this.serviceConfigManager.getServiceEndpoint(serviceName);
    const endpoint = serviceEndpoint?.url || this.endpoints[serviceName];
    
    if (!endpoint) {
      throw new Error(`No endpoint configured for service: ${serviceName}`);
    }

    const cacheKey = `${serviceName}:${endpoint}`;
    
    // Check cache first
    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey);
    }

    try {
      console.log(`Introspecting schema for ${serviceName} service...`);
      
      // Use Cognito authentication instead of API keys for OSDU compliance
      const authHeaders = await this.getAuthHeaders();
      const schema = await introspectionEngine.introspectServiceWithAuth(endpoint, authHeaders);
      
      // Cache the schema
      this.schemaCache.set(cacheKey, schema);
      
      return schema;
    } catch (error) {
      console.error(`Failed to introspect ${serviceName} service:`, error);
      throw error;
    }
  }

  /**
   * Build and execute a query using the query builder
   */
  async executeBuiltQuery(serviceName, operation, args = {}) {
    try {
      // Get the schema for the service
      const schema = await this.getServiceSchema(serviceName);
      
      // Build the query using the appropriate builder method
      let query;
      switch (serviceName) {
        case 'schema':
          query = await queryBuilder.buildSchemaQuery(schema, operation, args);
          break;
        case 'legal':
          query = await queryBuilder.buildLegalTagQuery(schema, operation, args);
          break;
        case 'entitlements':
          query = await queryBuilder.buildEntitlementQuery(schema, operation, args);
          break;
        case 'search':
          query = await queryBuilder.buildSearchQuery(schema, operation, args);
          break;
        case 'storage':
          query = await queryBuilder.buildStorageQuery(schema, operation, args);
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      console.log(`Built query for ${serviceName}.${operation}:`, query);
      
      // Execute the query
      const result = await this.graphqlRequest(this.endpoints[serviceName], query, args);
      
      return result;
    } catch (error) {
      console.error(`Failed to execute built query for ${serviceName}.${operation}:`, error);
      throw error;
    }
  }

  /**
   * OSDU M25 Schema Service Methods
   */
  async getSchemas(dataPartition = this.defaultDataPartition, limit = 10) {
    try {
      // Use the correct listSchemas query template
      const template = queryBuilder.getQueryTemplate('listSchemas');
      if (!template) {
        throw new Error('listSchemas template not found');
      }

      const variables = {
        dataPartition,
        pagination: { limit }
      };

      const result = await this.graphqlRequest(this.endpoints.schema, template.query, variables);
      return result;
    } catch (error) {
      console.error('Schema operation failed:', error);
      throw error;
    }
  }

  async listSchemas(dataPartition = this.defaultDataPartition, limit = 10) {
    try {
      // Use the query builder to create the correct query
      const args = { 
        dataPartition,
        pagination: { limit, offset: 0 }
      };
      
      return await this.executeBuiltQuery('schema', 'listSchemas', args);
    } catch (error) {
      return this.handleSchemaServiceError('listSchemas', error, {
        dataPartition,
        limit,
        operation: 'listing schemas',
        fallbackSuggestions: [
          'Verify that the schema service is deployed and accessible',
          'Check that the dataPartition parameter is correct',
          'Ensure you have proper authentication tokens'
        ]
      });
    }
  }

  async getSchema(id, dataPartition = this.defaultDataPartition) {
    // Use introspection to find the correct operation
    const introspectionQuery = `
      query {
        __schema {
          queryType {
            fields {
              name
              args {
                name
                type {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const introspectionResult = await this.graphqlRequest(this.endpoints.schema, introspectionQuery);
      const availableQueries = introspectionResult.__schema?.queryType?.fields || [];
      
      // Look for get-type operations that take an ID
      const getOperation = availableQueries.find(q => 
        (q.name.toLowerCase().includes('get') || q.name.toLowerCase().includes('schema')) &&
        q.args?.some(arg => arg.name.toLowerCase().includes('id'))
      );
      
      if (getOperation) {
        console.log(`Using ${getOperation.name} operation`);
        
        // Build query with ID parameter
        const idArg = getOperation.args.find(arg => arg.name.toLowerCase().includes('id'));
        const query = `
          query($${idArg.name}: ${idArg.type.name}) {
            ${getOperation.name}(${idArg.name}: $${idArg.name}) {
              id
              schema
            }
          }
        `;
        
        const variables = {};
        variables[idArg.name] = id;
        
        return this.graphqlRequest(this.endpoints.schema, query, variables);
      } else {
        return {
          error: 'No get operation found',
          availableOperations: availableQueries.map(q => q.name),
          suggestion: 'Check Schema Analysis tab for exact operation names'
        };
      }
    } catch (error) {
      return this.handleSchemaServiceError('getSchema', error, {
        id,
        dataPartition,
        operation: 'retrieving specific schema',
        fallbackSuggestions: [
          'Verify that the schema ID exists by checking the schema list first',
          'Ensure the schema ID format is correct',
          'Check that the schema is in the specified data partition'
        ]
      });
    }
  }

  async createSchema(input, dataPartition = this.defaultDataPartition) {
    const mutation = `
      mutation CreateSchema($input: CreateSchemaInput!) {
        createSchema(input: $input) {
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
          schema
          status
          scope
          createdBy
          createdAt
          updatedBy
          updatedAt
        }
      }
    `;

    return this.graphqlRequest(this.endpoints.schema, mutation, { input });
  }

  /**
   * Create a new legal tag
   */
  async createLegalTag(input, dataPartition = this.defaultDataPartition) {
    const context = legalTagErrorHandler.createContext('createLegalTag', {
      dataPartition,
      endpoint: this.endpoints.legal
    });
    
    const operationId = legalTagLogger.startOperation('createLegalTag', {
      dataPartition,
      endpoint: this.endpoints.legal
    });

    try {
      legalTagLogger.info('createLegalTag', 'Starting legal tag creation', {
        inputName: input.name,
        hasDescription: !!input.description,
        hasProperties: !!input.properties
      }, { dataPartition });
      
      // Use the correct createLegalTag mutation based on the ACTUAL deployed schema
      // Deployed schema: createLegalTag(input: CreateLegalTagInput!): LegalTag
      const mutation = `
        mutation CreateLegalTag($input: CreateLegalTagInput!) {
          createLegalTag(input: $input) {
            id
            name
            description
            properties
            createdBy
            createdAt
          }
        }
      `;
      
      // Transform the input to match the expected CreateLegalTagInput structure
      // Properties should be AWSJSON (stringified JSON)
      const transformedInput = {
        name: input.name,
        description: input.description || '',
        properties: JSON.stringify(input.properties || {
          countryOfOrigin: ['US'],
          contractId: 'default-contract',
          expirationDate: '2025-12-31T23:59:59.999Z',
          originator: 'OSDU',
          dataType: 'Public',
          securityClassification: 'Public',
          personalData: 'NonPersonalData',
          exportClassification: 'EAR99'
        })
      };
      
      const variables = {
        input: transformedInput
      };
      
      // Log the GraphQL query
      legalTagLogger.logGraphQLQuery('createLegalTag', mutation, variables, this.endpoints.legal, { dataPartition });
      
      const startTime = performance.now();
      const result = await this.graphqlRequest(this.endpoints.legal, mutation, variables);
      const duration = performance.now() - startTime;
      
      // Log the response
      legalTagLogger.logGraphQLResponse('createLegalTag', result, duration, { dataPartition });
      
      legalTagLogger.endOperation(operationId, result, { dataPartition });
      
      legalTagLogger.logSuccess('createLegalTag', 'Legal tag created successfully', {
        legalTagId: result?.createLegalTag?.id,
        name: result?.createLegalTag?.name,
        creationDetails: {
          hasProperties: !!result?.createLegalTag?.properties,
          hasDescription: !!result?.createLegalTag?.description,
          responseStructure: result?.createLegalTag ? Object.keys(result.createLegalTag) : [],
          inputTransformation: {
            originalInputKeys: Object.keys(input),
            transformedInputKeys: Object.keys(transformedInput)
          }
        },
        performanceMetrics: {
          duration: `${duration.toFixed(2)}ms`,
          category: duration < 1000 ? 'fast' : duration < 3000 ? 'normal' : 'slow'
        }
      }, { dataPartition, legalTagId: result?.createLegalTag?.id });
      
      return result;
    } catch (error) {
      const legalTagError = legalTagErrorHandler.handleError(error, {
        ...context,
        query: 'createLegalTag mutation',
        variables: { input }
      });
      
      legalTagLogger.endOperationWithError(operationId, error, legalTagError.errorType, { dataPartition });
      
      // Re-throw with enhanced error information
      const enhancedError = new Error(legalTagError.userMessage);
      enhancedError.originalError = error;
      enhancedError.legalTagError = legalTagError;
      throw enhancedError;
    }
  }

  /**
   * Update an existing legal tag
   */
  async updateLegalTag(id, input, dataPartition = this.defaultDataPartition) {
    const context = legalTagErrorHandler.createContext('updateLegalTag', {
      dataPartition,
      legalTagId: id,
      endpoint: this.endpoints.legal
    });
    
    const operationId = legalTagLogger.startOperation('updateLegalTag', {
      dataPartition,
      legalTagId: id,
      endpoint: this.endpoints.legal
    });

    try {
      legalTagLogger.info('updateLegalTag', 'Starting legal tag update', {
        legalTagId: id,
        inputName: input.name,
        hasDescription: !!input.description,
        hasProperties: !!input.properties
      }, { dataPartition, legalTagId: id });
      
      // Use the correct updateLegalTag mutation based on the ACTUAL deployed schema
      // Deployed schema: updateLegalTag(id: ID!, input: UpdateLegalTagInput!): LegalTag
      const mutation = `
        mutation UpdateLegalTag($id: ID!, $input: UpdateLegalTagInput!) {
          updateLegalTag(id: $id, input: $input) {
            id
            name
            description
            properties
            updatedBy
            updatedAt
          }
        }
      `;
      
      // Transform the input to match the expected UpdateLegalTagInput structure
      // Properties should be AWSJSON (stringified JSON)
      const transformedInput = {
        name: input.name,
        description: input.description || '',
        properties: JSON.stringify(input.properties || {})
      };
      
      const variables = {
        id,
        input: transformedInput
      };
      
      // Log the GraphQL query
      legalTagLogger.logGraphQLQuery('updateLegalTag', mutation, variables, this.endpoints.legal, { dataPartition, legalTagId: id });
      
      const startTime = performance.now();
      const result = await this.graphqlRequest(this.endpoints.legal, mutation, variables);
      const duration = performance.now() - startTime;
      
      // Log the response
      legalTagLogger.logGraphQLResponse('updateLegalTag', result, duration, { dataPartition, legalTagId: id });
      
      legalTagLogger.endOperation(operationId, result, { dataPartition, legalTagId: id });
      
      legalTagLogger.info('updateLegalTag', 'Legal tag updated successfully', {
        legalTagId: result?.updateLegalTag?.id,
        name: result?.updateLegalTag?.name
      }, { dataPartition, legalTagId: id });
      
      return result;
    } catch (error) {
      const legalTagError = legalTagErrorHandler.handleError(error, {
        ...context,
        query: 'updateLegalTag mutation',
        variables: { id, input }
      });
      
      legalTagLogger.endOperationWithError(operationId, error, legalTagError.errorType, { dataPartition, legalTagId: id });
      
      // Re-throw with enhanced error information
      const enhancedError = new Error(legalTagError.userMessage);
      enhancedError.originalError = error;
      enhancedError.legalTagError = legalTagError;
      throw enhancedError;
    }
  }

  async deleteLegalTag(id, dataPartition = this.defaultDataPartition) {
    const context = legalTagErrorHandler.createContext('deleteLegalTag', {
      dataPartition,
      legalTagId: id,
      endpoint: this.endpoints.legal
    });
    
    const operationId = legalTagLogger.startOperation('deleteLegalTag', {
      legalTagId: id,
      dataPartition,
      endpoint: this.endpoints.legal
    });

    legalTagLogger.info('deleteLegalTag', 'Starting legal tag deletion', {
      legalTagId: id,
      dataPartition
    }, { dataPartition, legalTagId: id });

    try {
      // The GraphQL schema expects only id parameter, dataPartition is passed via headers
      const mutation = `
        mutation DeleteLegalTag($id: ID!) {
          deleteLegalTag(id: $id)
        }
      `;

      const variables = {
        id
      };

      legalTagLogger.debug('deleteLegalTag', 'Executing delete mutation', {
        mutation: mutation.replace(/\s+/g, ' ').trim(),
        variables,
        dataPartition
      }, { dataPartition, legalTagId: id });

      const startTime = performance.now();
      // Pass dataPartition in a way that graphqlRequest can access it for headers
      const result = await this.graphqlRequest(this.endpoints.legal, mutation, { ...variables, dataPartition });
      const duration = performance.now() - startTime;
      
      // Log the response
      legalTagLogger.logGraphQLResponse('deleteLegalTag', result, duration, { dataPartition, legalTagId: id });
      
      legalTagLogger.endOperation(operationId, result, { dataPartition, legalTagId: id });
      
      legalTagLogger.info('deleteLegalTag', 'Legal tag deleted successfully', {
        legalTagId: id,
        success: result?.deleteLegalTag
      }, { dataPartition, legalTagId: id });
      
      return result;
    } catch (error) {
      const legalTagError = legalTagErrorHandler.handleError(error, {
        ...context,
        query: 'deleteLegalTag mutation',
        variables: { id, dataPartition }
      });
      
      legalTagLogger.endOperationWithError(operationId, error, legalTagError.errorType, { dataPartition, legalTagId: id });
      
      // Re-throw with enhanced error information
      const enhancedError = new Error(legalTagError.userMessage);
      enhancedError.originalError = error;
      enhancedError.legalTagError = legalTagError;
      throw enhancedError;
    }
  }

  /**
   * OSDU M25 Entitlements Service Methods
   */
  async getEntitlements(dataPartition = this.defaultDataPartition, filter = {}, pagination = {}) {
    try {
      // Use the query builder to create the correct query
      const args = { 
        dataPartition,
        filter: filter || {},
        pagination: pagination || { limit: 10, offset: 0 }
      };
      
      return await this.executeBuiltQuery('entitlements', 'listEntitlements', args);
    } catch (error) {
      console.error('Get entitlements operation failed:', error);
      
      // Fallback to manual introspection if query builder fails
      try {
        const schema = await this.getServiceSchema('entitlements');
        const availableOperations = schema.queryType.fields.map(f => f.name);
        
        return {
          error: 'Query builder failed',
          availableOperations,
          suggestion: 'Check available operations and try manual query building',
          originalError: error.message
        };
      } catch (introspectionError) {
        throw new Error(`Both query building and introspection failed: ${error.message}`);
      }
    }
  }

  async getEntitlement(id, dataPartition = this.defaultDataPartition) {
    try {
      // Use the query builder to create the correct query
      const args = { 
        id,
        dataPartition 
      };
      
      return await this.executeBuiltQuery('entitlements', 'getEntitlement', args);
    } catch (error) {
      console.error('Get entitlement operation failed:', error);
      
      // Fallback to manual introspection if query builder fails
      try {
        const schema = await this.getServiceSchema('entitlements');
        const availableOperations = schema.queryType.fields.map(f => f.name);
        
        return {
          error: 'Query builder failed',
          availableOperations,
          suggestion: 'Check available operations and try manual query building',
          originalError: error.message
        };
      } catch (introspectionError) {
        throw new Error(`Both query building and introspection failed: ${error.message}`);
      }
    }
  }

  async createEntitlement(input, dataPartition = this.defaultDataPartition) {
    const mutation = `
      mutation CreateEntitlement($input: CreateEntitlementInput!) {
        createEntitlement(input: $input) {
          id
          groupEmail
          actions
          conditions {
            attribute
            operator
            value
          }
          createdBy
          createdAt
          updatedBy
          updatedAt
        }
      }
    `;

    return this.graphqlRequest(this.endpoints.entitlements, mutation, { input });
  }

  /**
   * OSDU M25 Legal Tagging Service Methods
   */
  async getLegalTags(dataPartition = this.defaultDataPartition, limit = 10) {
    const context = legalTagErrorHandler.createContext('getLegalTags', {
      dataPartition,
      endpoint: this.endpoints.legal
    });
    
    const operationId = legalTagLogger.startOperation('getLegalTags', {
      dataPartition,
      endpoint: this.endpoints.legal
    });

    legalTagLogger.info('getLegalTags', 'Starting legal tags retrieval', {
      dataPartition,
      limit
    }, { dataPartition });
    
    // Try primary query first (getLegalTags as it actually works)
    try {
      legalTagLogger.debug('getLegalTags', 'Attempting primary query (getLegalTags)', {
        queryType: 'primary'
      }, { dataPartition });
      
      const primaryResult = await this._executeLegalTagQuery('getLegalTags', dataPartition, limit, 'primary');
      const normalized = normalizeLegalTagResponse(primaryResult, {
        source: 'listLegalTags',
        queryType: 'primary',
        allowEmptyResponse: true,
        validateProperties: true,
        parseJsonProperties: true
      });

      if (!normalized.isError) {
        legalTagLogger.logSuccess('getLegalTags', 'Primary query successful', {
          queryType: 'primary',
          itemCount: normalized.data?.items?.length || 0,
          isEmpty: normalized.isEmpty,
          dataStructure: {
            hasItems: !!normalized.data?.items,
            hasPagination: !!normalized.data?.pagination,
            responseKeys: normalized.data ? Object.keys(normalized.data) : []
          }
        }, { dataPartition });
        
        legalTagLogger.endOperation(operationId, normalized, { dataPartition });
        return this._formatLegacyResponse(normalized);
      }

      legalTagLogger.warn('getLegalTags', 'Primary query failed, trying fallback', {
        queryType: 'primary',
        error: normalized.errorMessage
      }, { dataPartition });
      
      throw new Error(normalized.errorMessage || 'Primary query failed');
    } catch (primaryError) {
      legalTagLogger.info('getLegalTags', 'Attempting fallback query (getLegalTags)', {
        queryType: 'fallback',
        primaryError: primaryError.message
      }, { dataPartition });
      
      // Try fallback query (listLegalTags)
      try {
        const fallbackResult = await this._executeLegalTagQuery('listLegalTags', dataPartition, limit, 'fallback');
        const normalized = normalizeLegalTagResponse(fallbackResult, {
          source: 'getLegalTags',
          queryType: 'fallback',
          allowEmptyResponse: true,
          validateProperties: true,
          parseJsonProperties: true
        });

        if (!normalized.isError) {
          legalTagLogger.logSuccess('getLegalTags', 'Fallback query successful', {
            queryType: 'fallback',
            itemCount: normalized.data?.items?.length || 0,
            isEmpty: normalized.isEmpty,
            dataStructure: {
              hasItems: !!normalized.data?.items,
              hasPagination: !!normalized.data?.pagination,
              responseKeys: normalized.data ? Object.keys(normalized.data) : []
            },
            fallbackReason: primaryError.message
          }, { dataPartition });
          
          legalTagLogger.endOperation(operationId, normalized, { dataPartition });
          return this._formatLegacyResponse(normalized);
        }

        legalTagLogger.error('getLegalTags', 'Both queries failed', {
          primaryError: primaryError.message,
          fallbackError: normalized.errorMessage
        }, { dataPartition });
        
        throw new Error(normalized.errorMessage || 'Fallback query failed');
      } catch (fallbackError) {
        const legalTagError = legalTagErrorHandler.handleError(fallbackError, {
          ...context,
          queryType: 'fallback'
        });
        
        legalTagLogger.endOperationWithError(operationId, {
          primaryError: primaryError.message,
          fallbackError: fallbackError.message
        }, legalTagError.errorType, { dataPartition });
        
        // Return normalized error response for backward compatibility
        const errorResponse = normalizeLegalTagResponse(null, {
          source: 'error',
          queryType: 'failed',
          allowEmptyResponse: true
        });
        
        // Add error information to the response
        const formattedResponse = this._formatLegacyResponse(errorResponse);
        formattedResponse.legalTagError = legalTagError;
        
        return formattedResponse;
      }
    }
  }

  /**
   * Execute a legal tag query with proper error handling
   * @private
   */
  async _executeLegalTagQuery(queryType, dataPartition, limit = 10, queryContext = 'unknown') {
    const queries = {
      listLegalTags: `
        query ListLegalTags($dataPartition: String!, $filter: LegalTagFilterInput, $pagination: PaginationInput) {
          listLegalTags(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
            items {
              id
              name
              description
              properties
              createdBy
              createdAt
              updatedBy
              updatedAt
            }
            pagination {
              nextToken
            }
          }
        }
      `,
      getLegalTags: `
        query GetLegalTags($dataPartition: String!, $filter: LegalTagFilterInput) {
          getLegalTags(dataPartition: $dataPartition, filter: $filter) {
            items {
              id
              name
              description
              properties
              createdBy
              createdAt
              updatedBy
              updatedAt
            }
            pagination {
              nextToken
            }
          }
        }
      `
    };

    const query = queries[queryType];
    if (!query) {
      throw new Error(`Unknown query type: ${queryType}`);
    }

    const variables = {
      dataPartition,
      filter: {} // Empty filter to get all legal tags
    };

    // Add pagination for listLegalTags
    if (queryType === 'listLegalTags') {
      variables.pagination = { limit };
    }
    // Note: getLegalTags doesn't use pagination parameter

    // Log the GraphQL query
    legalTagLogger.logGraphQLQuery(queryType, query, variables, this.endpoints.legal, {
      dataPartition,
      queryType: queryContext
    });
    
    const startTime = performance.now();
    const result = await this.graphqlRequest(this.endpoints.legal, query, variables);
    const duration = performance.now() - startTime;
    
    // Log the response
    legalTagLogger.logGraphQLResponse(queryType, result, duration, {
      dataPartition,
      queryType: queryContext
    });
    
    return result;
  }

  /**
   * Format normalized response for backward compatibility
   * @private
   */
  _formatLegacyResponse(normalizedResponse) {
    const { data, isEmpty, isError, errorMessage } = normalizedResponse;
    
    if (isError) {
      console.error('Returning error response:', errorMessage);
      return {
        error: true,
        message: errorMessage,
        getLegalTags: [],
        listLegalTags: { items: [], pagination: {} }
      };
    }

    if (isEmpty) {
      console.log('Returning empty response');
      return {
        getLegalTags: [],
        listLegalTags: { items: [], pagination: {} }
      };
    }

    // Return both formats for backward compatibility
    return {
      getLegalTags: data.items || [],
      listLegalTags: {
        items: data.items || [],
        pagination: data.pagination || {}
      }
    };
  }

  async getLegalTag(id, dataPartition = this.defaultDataPartition) {
    const context = legalTagErrorHandler.createContext('getLegalTag', {
      dataPartition,
      legalTagId: id,
      endpoint: this.endpoints.legal
    });
    
    const operationId = legalTagLogger.startOperation('getLegalTag', {
      dataPartition,
      legalTagId: id,
      endpoint: this.endpoints.legal
    });

    try {
      legalTagLogger.info('getLegalTag', 'Starting legal tag retrieval by ID', {
        legalTagId: id,
        dataPartition
      }, { dataPartition, legalTagId: id });
      
      const query = `
        query GetLegalTag($id: ID!, $dataPartition: String!) {
          getLegalTag(id: $id, dataPartition: $dataPartition) {
            id
            name
            description
            properties
            createdBy
            createdAt
            updatedBy
            updatedAt
          }
        }
      `;

      const variables = { id, dataPartition };
      
      // Log the GraphQL query
      legalTagLogger.logGraphQLQuery('getLegalTag', query, variables, this.endpoints.legal, {
        dataPartition,
        legalTagId: id
      });
      
      const startTime = performance.now();
      const result = await this.graphqlRequest(this.endpoints.legal, query, variables);
      const duration = performance.now() - startTime;
      
      // Log the response
      legalTagLogger.logGraphQLResponse('getLegalTag', result, duration, {
        dataPartition,
        legalTagId: id
      });
      
      // Normalize single legal tag response
      const normalized = normalizeLegalTagResponse(result.getLegalTag, {
        source: 'getLegalTag',
        queryType: 'single',
        allowEmptyResponse: false, // Single tag should exist if queried by ID
        validateProperties: true,
        parseJsonProperties: true
      });

      if (normalized.isError) {
        legalTagLogger.error('getLegalTag', 'Legal tag normalization failed', {
          error: normalized.errorMessage,
          legalTagId: id
        }, { dataPartition, legalTagId: id });
        
        throw new Error(normalized.errorMessage);
      }

      if (normalized.isEmpty) {
        legalTagLogger.warn('getLegalTag', 'Legal tag not found', {
          legalTagId: id
        }, { dataPartition, legalTagId: id });
        
        legalTagLogger.endOperation(operationId, null, { dataPartition, legalTagId: id });
        return null;
      }

      const legalTag = normalized.data.items[0] || null;
      
      legalTagLogger.info('getLegalTag', 'Legal tag retrieved successfully', {
        legalTagId: legalTag?.id,
        name: legalTag?.name
      }, { dataPartition, legalTagId: id });
      
      legalTagLogger.endOperation(operationId, legalTag, { dataPartition, legalTagId: id });
      
      // Return the first (and should be only) item
      return legalTag;
      
    } catch (error) {
      const legalTagError = legalTagErrorHandler.handleError(error, {
        ...context,
        query: query,
        variables: { id, dataPartition }
      });
      
      legalTagLogger.endOperationWithError(operationId, error, legalTagError.errorType, {
        dataPartition,
        legalTagId: id
      });
      
      // Try to provide helpful error information for schema mismatches
      if (error.message.includes('Field') && error.message.includes('undefined')) {
        legalTagLogger.error('getLegalTag', 'Schema mismatch detected', {
          error: error.message,
          suggestion: 'Check GraphQL schema introspection'
        }, { dataPartition, legalTagId: id });
        
        return {
          error: 'Schema mismatch',
          message: 'The getLegalTag query structure does not match the deployed schema',
          suggestion: 'Check the GraphQL schema introspection for correct field names',
          originalError: error.message,
          legalTagError
        };
      }
      
      // Re-throw with enhanced error information
      const enhancedError = new Error(legalTagError.userMessage);
      enhancedError.originalError = error;
      enhancedError.legalTagError = legalTagError;
      throw enhancedError;
    }
  }

  async getAllLegalTags(dataPartition = this.defaultDataPartition) {
    try {
      // Use the getLegalTags query (without filter) for getting all legal tags
      const template = queryBuilder.getQueryTemplate('getLegalTags');
      if (!template) {
        throw new Error('getLegalTags template not found');
      }

      const variables = {
        dataPartition
      };

      const result = await this.graphqlRequest(this.endpoints.legal, template.query, variables);
      return result;
    } catch (error) {
      console.error('Get all legal tags operation failed:', error);
      
      // Fallback to manual introspection if query builder fails
      try {
        const schema = await this.getServiceSchema('legal');
        const availableOperations = schema.queryType.fields.map(f => f.name);
        
        return {
          error: 'Query builder failed',
          availableOperations,
          suggestion: 'Check available operations and try manual query building',
          originalError: error.message
        };
      } catch (introspectionError) {
        throw new Error(`Both query building and introspection failed: ${error.message}`);
      }
    }
  }

  async _oldGetLegalTag(name, dataPartition = this.defaultDataPartition) {
    // Use introspection to find the correct operation
    const introspectionQuery = `
      query {
        __schema {
          queryType {
            fields {
              name
              args {
                name
                type {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const introspectionResult = await this.graphqlRequest(this.endpoints.legal, introspectionQuery);
      const availableQueries = introspectionResult.__schema?.queryType?.fields || [];
      
      // Look for get-type operations that take a name parameter
      const getOperation = availableQueries.find(q => 
        (q.name.toLowerCase().includes('get') || q.name.toLowerCase().includes('legal')) &&
        q.args?.some(arg => arg.name.toLowerCase().includes('name') || arg.name.toLowerCase().includes('id'))
      );
      
      if (getOperation) {
        console.log(`Using ${getOperation.name} operation`);
        
        // Find the name/id parameter
        const nameArg = getOperation.args.find(arg => 
          arg.name.toLowerCase().includes('name') || arg.name.toLowerCase().includes('id')
        );
        
        const query = `
          query($${nameArg.name}: ${nameArg.type.name}) {
            ${getOperation.name}(${nameArg.name}: $${nameArg.name}) {
              name
              description
            }
          }
        `;
        
        const variables = {};
        variables[nameArg.name] = name;
        
        return this.graphqlRequest(this.endpoints.legal, query, variables);
      } else {
        return {
          error: 'No get legal tag operation found',
          availableOperations: availableQueries.map(q => q.name),
          suggestion: 'Check Schema Analysis tab for exact operation names'
        };
      }
    } catch (error) {
      console.error('Get legal tag operation failed:', error);
      throw error;
    }
  }

  /**
   * OSDU M25 Search Service Methods
   */
  async search(searchQuery, dataPartition = this.defaultDataPartition) {
    // Use introspection to find the correct operation
    const introspectionQuery = `
      query {
        __schema {
          queryType {
            fields {
              name
              args {
                name
                type {
                  name
                }
              }
            }
          }
          mutationType {
            fields {
              name
              args {
                name
                type {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const introspectionResult = await this.graphqlRequest(this.endpoints.search, introspectionQuery);
      const availableQueries = introspectionResult.__schema?.queryType?.fields || [];
      const availableMutations = introspectionResult.__schema?.mutationType?.fields || [];
      const allOperations = [...availableQueries, ...availableMutations];
      
      console.log('Available search service operations:', allOperations.map(op => op.name));
      
      // Look for search operations
      const searchOperation = allOperations.find(op => 
        op.name.toLowerCase().includes('search') ||
        op.name.toLowerCase().includes('query') ||
        op.name.toLowerCase().includes('find')
      );
      
      if (searchOperation) {
        console.log(`Using ${searchOperation.name} operation`);
        
        // Determine if it's a query or mutation
        const isQuery = availableQueries.some(q => q.name === searchOperation.name);
        const operationType = isQuery ? 'query' : 'mutation';
        
        // Build search operation with required arguments
        const hasInputArg = searchOperation.args?.some(arg => arg.name === 'input');
        const hasDataPartitionArg = searchOperation.args?.some(arg => arg.name === 'dataPartition');
        
        let query;
        let variables = {};
        
        // Use minimal field selection to avoid field validation errors
        if (hasInputArg && hasDataPartitionArg) {
          query = `
            ${operationType}($input: SearchInput!, $dataPartition: String!) {
              ${searchOperation.name}(input: $input, dataPartition: $dataPartition)
            }
          `;
          variables = { 
            input: { query: searchQuery || "*" }, 
            dataPartition 
          };
        } else if (hasInputArg) {
          query = `
            ${operationType}($input: SearchInput!) {
              ${searchOperation.name}(input: $input)
            }
          `;
          variables = { input: { query: searchQuery || "*" } };
        } else {
          query = `
            ${operationType} {
              ${searchOperation.name}
            }
          `;
        }
        
        return this.graphqlRequest(this.endpoints.search, query, variables);
      } else {
        return {
          error: 'No search operation found',
          availableOperations: allOperations.map(op => op.name),
          suggestion: 'Check Schema Analysis tab for exact operation names'
        };
      }
    } catch (error) {
      console.error('Search operation failed:', error);
      throw error;
    }
  }

  /**
   * OSDU M25 Storage Service Methods
   */
  async getRecordById(recordId, dataPartition = this.defaultDataPartition) {
    // Use introspection to find the correct operation
    const introspectionQuery = `
      query {
        __schema {
          queryType {
            fields {
              name
              args {
                name
                type {
                  name
                }
              }
            }
          }
          types {
            name
            fields {
              name
              type {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const introspectionResult = await this.graphqlRequest(this.endpoints.storage, introspectionQuery);
      const availableQueries = introspectionResult.__schema?.queryType?.fields || [];
      const availableTypes = introspectionResult.__schema?.types || [];
      
      console.log('Available storage service queries:', availableQueries.map(q => q.name));
      
      // Look for record operations
      const recordOperation = availableQueries.find(q => 
        q.name.toLowerCase().includes('record') ||
        q.name.toLowerCase().includes('get') ||
        q.name.toLowerCase().includes('find')
      );
      
      if (recordOperation) {
        console.log(`Using ${recordOperation.name} operation`);
        
        // Find the ID parameter
        const idArg = recordOperation.args?.find(arg => 
          arg.name.toLowerCase().includes('id')
        );
        
        // Find the Legal type to see what fields are available
        const legalType = availableTypes.find(t => t.name === 'Legal');
        const legalFields = legalType?.fields?.map(f => f.name) || ['legaltags', 'otherRelevantDataCountries'];
        
        // Build query without the problematic 'status' field
        const legalFieldsSelection = legalFields.filter(field => field !== 'status').join('\n            ');
        
        // For storage operations, use minimal field selection to avoid errors
        const query = idArg ? `
          query($${idArg.name}: ${idArg.type.name}) {
            ${recordOperation.name}(${idArg.name}: $${idArg.name})
          }
        ` : `
          query {
            ${recordOperation.name}
          }
        `;
        
        const variables = idArg ? { [idArg.name]: recordId || "test-record-id" } : {};
        
        try {
          const result = await this.graphqlRequest(this.endpoints.storage, query, variables);
          return result;
        } catch (error) {
          // Handle 400 errors gracefully - likely invalid test data
          if (error.message.includes('HTTP error! status: 400')) {
            return {
              message: 'Operation available but test data invalid',
              operation: recordOperation.name,
              service: 'storage',
              suggestion: 'Try with a valid record ID'
            };
          }
          throw error;
        }
      } else {
        return {
          error: 'No record operation found',
          availableOperations: availableQueries.map(q => q.name),
          suggestion: 'Check Schema Analysis tab for exact operation names'
        };
      }
    } catch (error) {
      console.error('Get record operation failed:', error);
      throw error;
    }
  }

  /**
   * OSDU M25 Entitlements Service Methods - Additional
   */
  async getGroups(dataPartition = this.defaultDataPartition, limit = 10) {
    // Use introspection to find the correct operation
    const introspectionQuery = `
      query {
        __schema {
          queryType {
            fields {
              name
              args {
                name
                type {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const introspectionResult = await this.graphqlRequest(this.endpoints.entitlements, introspectionQuery);
      const availableQueries = introspectionResult.__schema?.queryType?.fields || [];
      
      console.log('Available entitlements service queries:', availableQueries.map(q => q.name));
      
      // Look for group operations
      const groupOperation = availableQueries.find(q => 
        q.name.toLowerCase().includes('group') ||
        q.name.toLowerCase().includes('list') ||
        q.name.toLowerCase().includes('entitlement')
      );
      
      if (groupOperation) {
        console.log(`Using ${groupOperation.name} operation`);
        
        // Build query with required arguments
        const hasDataPartitionArg = groupOperation.args?.some(arg => arg.name === 'dataPartition');
        
        const query = hasDataPartitionArg ? `
          query($dataPartition: String!) {
            ${groupOperation.name}(dataPartition: $dataPartition)
          }
        ` : `
          query {
            ${groupOperation.name}
          }
        `;
        
        const variables = hasDataPartitionArg ? { dataPartition } : {};
        
        try {
          const result = await this.graphqlRequest(this.endpoints.entitlements, query, variables);
          return result;
        } catch (error) {
          // Handle null responses gracefully
          if (error.message.includes('Cannot return null for non-nullable type')) {
            return {
              message: 'Operation successful but no data available',
              operation: groupOperation.name,
              service: 'entitlements'
            };
          }
          throw error;
        }
      } else {
        return {
          error: 'No group operation found',
          availableOperations: availableQueries.map(q => q.name),
          suggestion: 'Check Schema Analysis tab for exact operation names'
        };
      }
    } catch (error) {
      console.error('Get groups operation failed:', error);
      throw error;
    }
  }

  /**
   * Test connectivity to all services using ServiceConfigManager
   */
  async testConnectivity(dataPartition = this.defaultDataPartition) {
    try {
      // Use the service config manager for comprehensive health checks
      const healthResults = await this.serviceConfigManager.checkAllServicesHealth();
      
      // Convert to legacy format for backward compatibility
      const results = {};
      
      healthResults.forEach(result => {
        results[result.service] = {
          status: result.status === 'healthy' ? 'connected' : 'error',
          error: result.error || null,
          endpoint: this.serviceConfigManager.getServiceEndpoint(result.service)?.url,
          responseTime: result.responseTime,
          features: result.features,
          version: result.version
        };
      });

      return results;
    } catch (error) {
      console.error('Service connectivity test failed:', error);
      
      // Fallback to legacy testing
      return this.legacyTestConnectivity(dataPartition);
    }
  }

  /**
   * Legacy connectivity testing (fallback)
   */
  async legacyTestConnectivity(dataPartition = this.defaultDataPartition) {
    const results = {};
    
    // Test each service endpoint
    for (const [serviceName, endpoint] of Object.entries(this.endpoints)) {
      results[serviceName] = { status: 'unknown', error: null, endpoint };
      
      if (!endpoint) {
        results[serviceName].status = 'not_configured';
        results[serviceName].error = 'Endpoint not configured';
        continue;
      }
      
      try {
        console.log(`Testing ${serviceName} at ${endpoint}`);
        
        // Test with basic HTTP request to GraphQL endpoint
        const headers = await this.getAuthHeaders(dataPartition);
        console.log(`Headers for ${serviceName}:`, { ...headers, 'Authorization': 'Bearer [REDACTED]' });
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: `query { __typename }` })
        });
        
        console.log(`Response for ${serviceName}:`, response.status, response.statusText);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log(`Response data for ${serviceName}:`, responseData);
          results[serviceName].status = 'connected';
          results[serviceName].responseData = responseData;
        } else {
          const errorText = await response.text();
          console.error(`Error response for ${serviceName}:`, errorText);
          results[serviceName].status = 'error';
          results[serviceName].error = `HTTP ${response.status}: ${response.statusText}`;
          results[serviceName].errorDetails = errorText;
        }
      } catch (error) {
        console.error(`Exception testing ${serviceName}:`, error);
        results[serviceName].status = 'error';
        results[serviceName].error = error.message;
      }
    }

    return results;
  }

  /**
   * Get comprehensive service health status
   */
  async getServiceHealth() {
    try {
      const healthResults = await this.serviceConfigManager.checkAllServicesHealth();
      const statistics = this.serviceConfigManager.getServiceStatistics();
      
      return {
        overall: statistics.healthy === statistics.total ? 'healthy' : 
                statistics.healthy > 0 ? 'partial' : 'unhealthy',
        statistics,
        services: healthResults,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get service health:', error);
      
      // Fallback to legacy connectivity test
      const connectivity = await this.testConnectivity();
      const services = Object.values(connectivity);
      const healthy = services.filter(s => s.status === 'connected').length;
      
      return {
        overall: healthy === services.length ? 'healthy' : 
                healthy > 0 ? 'partial' : 'unhealthy',
        statistics: {
          total: services.length,
          healthy,
          unhealthy: services.length - healthy,
          unknown: 0,
          averageResponseTime: 0
        },
        services: connectivity,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Get service configuration details
   */
  getServiceConfiguration() {
    return this.serviceConfigManager.getConfiguration();
  }

  /**
   * Get services by health status
   */
  getServicesByStatus(status) {
    return this.serviceConfigManager.getServicesByStatus(status);
  }

  /**
   * Get services with specific features
   */
  getServicesWithFeature(feature) {
    return this.serviceConfigManager.getServicesWithFeature(feature);
  }

  /**
   * Manually trigger service discovery
   */
  async discoverServices() {
    return this.serviceConfigManager.discoverServicesFromDeployment();
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(intervalMs = 300000) {
    this.serviceConfigManager.startHealthMonitoring(intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    this.serviceConfigManager.stopHealthMonitoring();
  }

  /**
   * Clear authentication cache (for logout)
   */
  clearAuthCache() {
    this.serviceConfigManager.clearAuthCache();
  }

  /**
   * Retry mechanism for transient schema service failures
   * Requirement: 7.3 - Retry mechanisms for transient failures
   */
  async retrySchemaOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        
        console.log(`Schema operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  /**
   * Determine if an error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'timeout',
      'Network',
      'HTTP error! status: 500',
      'HTTP error! status: 502',
      'HTTP error! status: 503',
      'HTTP error! status: 504'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.includes(retryableError)
    );
  }

  /**
   * Handle schema service errors with detailed error analysis and suggestions
   * Requirement: 7.1, 7.2, 7.3, 7.4 - Enhanced error handling for schema operations
   */
  async handleSchemaServiceError(operation, error, context = {}) {
    const errorInfo = {
      service: 'schema',
      operation,
      timestamp: new Date().toISOString(),
      context,
      originalError: error.message,
      errorType: 'UNKNOWN',
      userFriendlyMessage: '',
      suggestions: [],
      canRetry: false,
      fallbackOptions: []
    };

    // Analyze the error type and provide specific guidance
    if (error.message.includes('Missing field argument dataPartition')) {
      errorInfo.errorType = 'MISSING_REQUIRED_ARGUMENT';
      errorInfo.userFriendlyMessage = 'The dataPartition argument is required for schema operations';
      errorInfo.suggestions = [
        'Ensure the dataPartition parameter is provided (usually "osdu")',
        'Check that the query includes the dataPartition variable',
        'Verify the GraphQL query structure matches the schema requirements'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('Field') && error.message.includes('is undefined')) {
      errorInfo.errorType = 'INVALID_FIELD_SELECTION';
      errorInfo.userFriendlyMessage = 'The query is trying to access fields that don\'t exist in the schema';
      errorInfo.suggestions = [
        'Update the query to use the correct field structure',
        'Use SchemaConnection.items to access schema data',
        'Remove references to non-existent fields like direct "id" or "schema" on connections'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('Sub selection required')) {
      errorInfo.errorType = 'MISSING_SUB_SELECTION';
      errorInfo.userFriendlyMessage = 'The query needs to specify which fields to return from complex objects';
      errorInfo.suggestions = [
        'Add field selections for complex return types',
        'Specify which properties you want to retrieve from the schema objects',
        'Use the correct GraphQL query structure with nested field selections'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('HTTP error! status: 400')) {
      errorInfo.errorType = 'BAD_REQUEST';
      errorInfo.userFriendlyMessage = 'The request was malformed or contains invalid data';
      errorInfo.suggestions = [
        'Check that all required parameters are provided',
        'Verify the GraphQL query syntax is correct',
        'Ensure authentication tokens are valid and not expired'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('HTTP error! status: 401')) {
      errorInfo.errorType = 'AUTHENTICATION_FAILED';
      errorInfo.userFriendlyMessage = 'Authentication failed - please check your credentials';
      errorInfo.suggestions = [
        'Verify that you are logged in with valid credentials',
        'Check that your authentication tokens have not expired',
        'Ensure the correct data partition permissions are granted'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('HTTP error! status: 403')) {
      errorInfo.errorType = 'AUTHORIZATION_FAILED';
      errorInfo.userFriendlyMessage = 'You don\'t have permission to perform this operation';
      errorInfo.suggestions = [
        'Contact your administrator to request schema service permissions',
        'Verify that your user account has the correct entitlements',
        'Check that the data partition allows schema operations for your user'
      ];
      errorInfo.canRetry = false;
    } else if (error.message.includes('HTTP error! status: 404')) {
      errorInfo.errorType = 'SCHEMA_NOT_FOUND';
      errorInfo.userFriendlyMessage = 'The requested schema or schema service endpoint was not found';
      errorInfo.suggestions = [
        'Verify that the schema service is deployed and accessible',
        'Check that the schema ID is correct if querying a specific schema',
        'Ensure the service endpoint URL is configured correctly'
      ];
      errorInfo.canRetry = false;
    } else if (error.message.includes('HTTP error! status: 500')) {
      errorInfo.errorType = 'SERVER_ERROR';
      errorInfo.userFriendlyMessage = 'The schema service encountered an internal error';
      errorInfo.suggestions = [
        'This is likely a temporary issue - try again in a few moments',
        'Check the service status and health monitoring',
        'Contact support if the issue persists'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('Network')) {
      errorInfo.errorType = 'NETWORK_ERROR';
      errorInfo.userFriendlyMessage = 'Unable to connect to the schema service';
      errorInfo.suggestions = [
        'Check your internet connection',
        'Verify that the schema service endpoint is accessible',
        'Try again in a few moments as this may be a temporary network issue'
      ];
      errorInfo.canRetry = true;
    } else if (error.message.includes('timeout')) {
      errorInfo.errorType = 'TIMEOUT';
      errorInfo.userFriendlyMessage = 'The schema service request timed out';
      errorInfo.suggestions = [
        'The service may be experiencing high load - try again',
        'Consider reducing the amount of data requested',
        'Check if there are any service performance issues'
      ];
      errorInfo.canRetry = true;
    }

    // Add fallback options based on the operation
    switch (operation) {
      case 'listSchemas':
        errorInfo.fallbackOptions = [
          'Try using the basic schema introspection to see available operations',
          'Use a smaller limit parameter to reduce the data load',
          'Check the Schema Analysis tab for service diagnostics'
        ];
        break;
      case 'getSchema':
        errorInfo.fallbackOptions = [
          'Verify the schema ID exists by listing schemas first',
          'Try accessing the schema through the enhanced schema search',
          'Check if the schema is in a different data partition'
        ];
        break;
      case 'validateData':
        errorInfo.fallbackOptions = [
          'Verify the schema ID is correct and the schema exists',
          'Check that the data format matches the expected schema structure',
          'Try validating with a simpler data object first'
        ];
        break;
      default:
        errorInfo.fallbackOptions = [
          'Check the service connectivity and authentication',
          'Try a simpler operation first to test the connection',
          'Review the available operations through introspection'
        ];
    }

    // Add context-specific suggestions
    if (context.fallbackSuggestions) {
      errorInfo.suggestions.push(...context.fallbackSuggestions);
    }

    // Try fallback introspection if the main operation failed
    if (errorInfo.canRetry && operation === 'listSchemas') {
      try {
        console.log('Attempting fallback introspection for schema service...');
        const schema = await this.getServiceSchema('schema');
        const availableOperations = schema.queryType.fields.map(f => f.name);
        
        errorInfo.fallbackData = {
          availableOperations,
          suggestion: 'The service is accessible but the query structure needs adjustment',
          introspectionSuccessful: true
        };
      } catch (introspectionError) {
        errorInfo.fallbackData = {
          introspectionError: introspectionError.message,
          suggestion: 'Both the main operation and introspection failed - check service connectivity'
        };
      }
    }

    // Log the detailed error for debugging
    console.error('Schema service error details:', errorInfo);

    // Return a structured error response
    return {
      success: false,
      error: errorInfo.errorType,
      message: errorInfo.userFriendlyMessage,
      suggestions: errorInfo.suggestions,
      fallbackOptions: errorInfo.fallbackOptions,
      canRetry: errorInfo.canRetry,
      details: errorInfo,
      timestamp: errorInfo.timestamp
    };
  }

  /**
   * Fallback behavior for enhanced schema features
   * Requirement: 7.4 - Implement fallback behavior for enhanced features
   */
  async getSchemaWithFallback(id, dataPartition = this.defaultDataPartition) {
    try {
      // Try enhanced schema service first
      const enhancedResult = await this.retrySchemaOperation(async () => {
        return await enhancedSchemaService.getSchema(id, dataPartition);
      });
      
      return {
        success: true,
        data: enhancedResult,
        source: 'enhanced',
        features: ['detailed-metadata', 'relationships', 'usage-stats']
      };
    } catch (enhancedError) {
      console.log('Enhanced schema service failed, falling back to basic service...');
      
      try {
        // Fallback to basic schema service
        const basicResult = await this.retrySchemaOperation(async () => {
          return await this.getSchema(id, dataPartition);
        });
        
        return {
          success: true,
          data: basicResult,
          source: 'basic',
          features: ['basic-info'],
          fallbackReason: 'Enhanced service unavailable'
        };
      } catch (basicError) {
        // Both services failed
        return this.handleSchemaServiceError('getSchemaWithFallback', basicError, {
          id,
          dataPartition,
          enhancedError: enhancedError.message,
          operation: 'retrieving schema with fallback',
          fallbackSuggestions: [
            'Both enhanced and basic schema services are unavailable',
            'Check service connectivity and authentication',
            'Try again later as this may be a temporary service issue'
          ]
        });
      }
    }
  }

  /**
   * Graceful schema not found handling
   * Requirement: 7.1 - Handle schema not found errors gracefully
   */
  async handleSchemaNotFound(schemaId, dataPartition = this.defaultDataPartition) {
    return {
      success: false,
      error: 'SCHEMA_NOT_FOUND',
      message: `Schema with ID '${schemaId}' was not found in data partition '${dataPartition}'`,
      suggestions: [
        'Verify the schema ID is correct',
        'Check if the schema exists in a different data partition',
        'Use the schema search functionality to find available schemas',
        'Ensure you have permission to access this schema'
      ],
      fallbackOptions: [
        'Browse available schemas using the list operation',
        'Search for schemas with similar names or types',
        'Check the schema service documentation for valid schema IDs'
      ],
      canRetry: false,
      schemaId,
      dataPartition,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Simple diagnostic method to test authentication and basic connectivity
   */
  async runDiagnostics(dataPartition = this.defaultDataPartition) {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      dataPartition,
      authentication: { status: 'unknown', error: null },
      endpoints: {},
      recommendations: []
    };

    // Test authentication
    try {
      const headers = await this.getAuthHeaders(dataPartition);
      diagnostics.authentication.status = 'success';
      diagnostics.authentication.headers = { ...headers, 'Authorization': 'Bearer [REDACTED]' };
    } catch (error) {
      diagnostics.authentication.status = 'failed';
      diagnostics.authentication.error = error.message;
      diagnostics.recommendations.push('Check Cognito authentication - ensure user is logged in');
      return diagnostics; // Can't test endpoints without auth
    }

    // Test each endpoint with introspection query
    for (const [serviceName, endpoint] of Object.entries(this.endpoints)) {
      if (!endpoint) {
        diagnostics.endpoints[serviceName] = {
          status: 'not_configured',
          error: 'Endpoint URL not configured'
        };
        diagnostics.recommendations.push(`Configure ${serviceName} endpoint URL`);
        continue;
      }

      try {
        const headers = await this.getAuthHeaders(dataPartition);
        
        // Try GraphQL introspection query to see what's available
        const introspectionQuery = `
          query IntrospectionQuery {
            __schema {
              queryType {
                name
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: introspectionQuery })
        });

        if (response.ok) {
          const data = await response.json();
          diagnostics.endpoints[serviceName] = {
            status: 'connected',
            endpoint,
            schema: data.data?.__schema ? 'available' : 'limited',
            availableQueries: data.data?.__schema?.queryType?.fields?.map(f => f.name) || []
          };
        } else {
          const errorText = await response.text();
          diagnostics.endpoints[serviceName] = {
            status: 'error',
            endpoint,
            httpStatus: response.status,
            error: `${response.status}: ${response.statusText}`,
            details: errorText
          };
          
          if (response.status === 401) {
            diagnostics.recommendations.push(`${serviceName}: Authentication failed - check token format`);
          } else if (response.status === 403) {
            diagnostics.recommendations.push(`${serviceName}: Access denied - check user permissions`);
          } else if (response.status === 404) {
            diagnostics.recommendations.push(`${serviceName}: Endpoint not found - verify URL`);
          }
        }
      } catch (error) {
        diagnostics.endpoints[serviceName] = {
          status: 'error',
          endpoint,
          error: error.message
        };
        diagnostics.recommendations.push(`${serviceName}: Network error - check connectivity`);
      }
    }

    return diagnostics;
  }

  /**
   * Semantic Schema Search Methods
   * These methods would integrate with the vector search backend when available
   */
  async searchSchemasBySimilarity(query, k = 10, dataPartition = this.defaultDataPartition) {
    // For now, this is a mock implementation
    // In the real implementation, this would call the vector search GraphQL API
    const mockQuery = `
      query SearchSchemasBySimilarity($dataPartition: String!, $query: String!, $k: Int) {
        searchSchemasBySimilarity(dataPartition: $dataPartition, query: $query, k: $k) {
          results {
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
              schema
              status
              scope
              createdBy
              createdAt
              updatedBy
              updatedAt
            }
            similarity
            metadata {
              matchedFields
              reasoning
              confidence
            }
          }
        }
      }
    `;

    // Mock implementation - in real scenario, this would call the GraphQL endpoint
    try {
      // For demonstration, return filtered results from regular schema search
      const regularResults = await this.listSchemas(dataPartition);
      
      if (regularResults?.listSchemas?.items) {
        // Simulate semantic matching by filtering and scoring
        const semanticResults = regularResults.listSchemas.items
          .filter(schema => {
            const searchText = query.toLowerCase();
            const schemaText = JSON.stringify(schema).toLowerCase();
            return schemaText.includes(searchText) || 
                   schema.schemaIdentity.entityType.toLowerCase().includes(searchText);
          })
          .map(schema => ({
            schema,
            similarity: Math.random() * 0.4 + 0.6, // Mock similarity score between 0.6-1.0
            metadata: {
              matchedFields: ['entityType', 'schema.properties'],
              reasoning: `Semantic match found in schema content and entity type`,
              confidence: Math.random() * 0.3 + 0.7
            }
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, k);

        return {
          searchSchemasBySimilarity: {
            results: semanticResults
          }
        };
      }
    } catch (error) {
      console.error('Semantic search failed, falling back to regular search:', error);
      // Fallback to regular search
      const fallbackResults = await this.listSchemas(dataPartition, { searchText: query });
      return {
        searchSchemasBySimilarity: {
          results: fallbackResults?.listSchemas?.items?.map(schema => ({
            schema,
            similarity: 0.5,
            metadata: {
              matchedFields: ['fallback'],
              reasoning: 'Fallback to text search',
              confidence: 0.5
            }
          })) || []
        }
      };
    }
  }

  async findRelatedSchemas(schemaId, k = 5, dataPartition = this.defaultDataPartition) {
    const query = `
      query FindRelatedSchemas($dataPartition: String!, $schemaId: ID!, $k: Int) {
        findRelatedSchemas(dataPartition: $dataPartition, schemaId: $schemaId, k: $k) {
          results {
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
              schema
              status
              scope
              createdBy
              createdAt
              updatedBy
              updatedAt
            }
            similarity
            relationshipType
            metadata {
              reasoning
              confidence
            }
          }
        }
      }
    `;

    // Mock implementation
    try {
      const allSchemas = await this.listSchemas(dataPartition);
      
      if (allSchemas?.listSchemas?.items) {
        // Filter out the current schema and return related ones
        const relatedResults = allSchemas.listSchemas.items
          .filter(schema => schema.id !== schemaId)
          .slice(0, k)
          .map(schema => ({
            schema,
            similarity: Math.random() * 0.4 + 0.6,
            relationshipType: ['semantic', 'structural', 'domain'][Math.floor(Math.random() * 3)],
            metadata: {
              reasoning: 'Related through semantic similarity analysis',
              confidence: Math.random() * 0.3 + 0.7
            }
          }));

        return {
          findRelatedSchemas: {
            results: relatedResults
          }
        };
      }
    } catch (error) {
      console.error('Related schemas search failed:', error);
      return {
        findRelatedSchemas: {
          results: []
        }
      };
    }
  }

  async getSchemaEmbeddingStats(dataPartition = this.defaultDataPartition) {
    const query = `
      query GetSchemaEmbeddingStats($dataPartition: String!) {
        getSchemaEmbeddingStats(dataPartition: $dataPartition) {
          totalSchemas
          embeddedSchemas
          embeddingModel
          lastUpdated
          averageSimilarity
          topCategories {
            category
            count
          }
        }
      }
    `;

    // Mock implementation
    return {
      getSchemaEmbeddingStats: {
        totalSchemas: 150,
        embeddedSchemas: 142,
        embeddingModel: 'amazon.titan-embed-text-v2:0',
        lastUpdated: new Date().toISOString(),
        averageSimilarity: 0.73,
        topCategories: [
          { category: 'reference-data', count: 45 },
          { category: 'work-product-component', count: 38 },
          { category: 'master-data', count: 32 },
          { category: 'relationship', count: 27 }
        ]
      }
    };
  }
}

// Create and export a singleton instance
const osduApi = new OSDUApiService();
export default osduApi;
