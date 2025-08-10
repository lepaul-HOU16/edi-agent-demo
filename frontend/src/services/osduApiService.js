import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * OSDU M25 Compliant API Service
 * Handles all API calls to OSDU services using Cognito authentication tokens
 * Updated to match OSDU M25 specification and deployed backend schema
 */
class OSDUApiService {
  constructor() {
    this.client = generateClient();
    this.endpoints = {
      schema: import.meta.env.VITE_SCHEMA_API_URL,
      entitlements: import.meta.env.VITE_ENTITLEMENTS_API_URL,
      legal: import.meta.env.VITE_LEGAL_API_URL,
      search: import.meta.env.VITE_SEARCH_API_URL,
      storage: import.meta.env.VITE_STORAGE_API_URL,
      ai: import.meta.env.VITE_AI_API_URL,
      dataIngestion: import.meta.env.VITE_DATA_INGESTION_API_URL,
      seismicIngestion: import.meta.env.VITE_SEISMIC_INGESTION_API_URL
    };
    
    // Default data partition for OSDU
    this.defaultDataPartition = import.meta.env.VITE_DEFAULT_DATA_PARTITION || 'osdu';
  }

  /**
   * Get authentication headers with Cognito tokens
   */
  async getAuthHeaders(dataPartition = this.defaultDataPartition) {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      const accessToken = session.tokens?.accessToken?.toString();

      if (!idToken || !accessToken) {
        throw new Error('No valid authentication tokens found');
      }

      return {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'data-partition-id': dataPartition,
        // Include access token in custom header for additional verification
        'x-access-token': accessToken
      };
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      throw new Error('Authentication required');
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
   * OSDU M25 Schema Service Methods
   */
  async getSchemas(dataPartition = this.defaultDataPartition, filter = {}, pagination = {}) {
    const query = `
      query GetSchemas($dataPartition: String!, $filter: SchemaFilterInput, $pagination: PaginationInput) {
        getSchemas(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
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
            schema
            status
            scope
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
    `;

    return this.graphqlRequest(this.endpoints.schema, query, { dataPartition, filter, pagination });
  }

  async listSchemas(dataPartition = this.defaultDataPartition, filter = {}, pagination = {}) {
    const query = `
      query ListSchemas($dataPartition: String!, $filter: SchemaFilterInput, $pagination: PaginationInput) {
        listSchemas(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
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
            schema
            status
            scope
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
    `;

    return this.graphqlRequest(this.endpoints.schema, query, { dataPartition, filter, pagination });
  }

  async getSchema(id, version = null, dataPartition = this.defaultDataPartition) {
    const query = `
      query GetSchema($dataPartition: String!, $id: ID!, $version: String) {
        getSchema(dataPartition: $dataPartition, id: $id, version: $version) {
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

    return this.graphqlRequest(this.endpoints.schema, query, { dataPartition, id, version });
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
   * OSDU M25 Entitlements Service Methods
   */
  async getEntitlements(dataPartition = this.defaultDataPartition, filter = {}, pagination = {}) {
    const query = `
      query ListEntitlements($dataPartition: String!, $filter: EntitlementFilterInput!, $pagination: PaginationInput) {
        listEntitlements(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
          items {
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
          pagination {
            nextToken
          }
        }
      }
    `;

    return this.graphqlRequest(this.endpoints.entitlements, query, { dataPartition, filter, pagination });
  }

  async getEntitlement(id, dataPartition = this.defaultDataPartition) {
    const query = `
      query GetEntitlement($dataPartition: String!, $id: ID!) {
        getEntitlement(dataPartition: $dataPartition, id: $id) {
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

    return this.graphqlRequest(this.endpoints.entitlements, query, { dataPartition, id });
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
   * Note: Legal Tagging Service deployment is pending, these are prepared for when it's ready
   */
  async getLegalTags(dataPartition = this.defaultDataPartition, filter = {}) {
    const query = `
      query GetLegalTags($dataPartition: String!, $filter: LegalTagFilterInput) {
        getLegalTags(dataPartition: $dataPartition, filter: $filter) {
          items {
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
    `;

    return this.graphqlRequest(this.endpoints.legal, query, { dataPartition, filter });
  }

  async getLegalTag(name, dataPartition = this.defaultDataPartition) {
    const query = `
      query GetLegalTag($dataPartition: String!, $name: String!) {
        getLegalTag(dataPartition: $dataPartition, name: $name) {
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

    return this.graphqlRequest(this.endpoints.legal, query, { dataPartition, name });
  }

  /**
   * Test connectivity to all services
   */
  async testConnectivity(dataPartition = this.defaultDataPartition) {
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
        // Test with basic HTTP request to GraphQL endpoint
        const headers = await this.getAuthHeaders(dataPartition);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: `query { __typename }` })
        });
        
        if (response.ok) {
          results[serviceName].status = 'connected';
        } else {
          results[serviceName].status = 'error';
          results[serviceName].error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        results[serviceName].status = 'error';
        results[serviceName].error = error.message;
      }
    }

    return results;
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    const connectivity = await this.testConnectivity();
    
    return {
      overall: Object.values(connectivity).every(service => service.status === 'connected') ? 'healthy' : 'degraded',
      services: connectivity,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const osduApiService = new OSDUApiService();
export default osduApiService;
