/**
 * Service Configuration Manager (JavaScript version)
 * 
 * Manages configuration for all OSDU backend services with automatic service discovery,
 * Cognito authentication, and health checking mechanisms.
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import config from './config';

export class ServiceConfigManager {
  constructor(initialConfig = {}) {
    this.defaultDataPartition = config.NEXT_PUBLIC_DEFAULT_DATA_PARTITION || 'osdu';
    
    // Initialize with default configuration
    this.config = {
      schema: {
        url: config.NEXT_PUBLIC_SCHEMA_API_URL || '',
        name: 'Schema Service',
        type: 'graphql',
        status: 'unknown'
      },
      entitlements: {
        url: config.NEXT_PUBLIC_ENTITLEMENTS_API_URL || '',
        name: 'Entitlements Service',
        type: 'graphql',
        status: 'unknown'
      },
      legal: {
        url: config.NEXT_PUBLIC_LEGAL_API_URL || '',
        name: 'Legal Tagging Service',
        type: 'graphql',
        status: 'unknown'
      },
      search: {
        url: config.NEXT_PUBLIC_SEARCH_API_URL || '',
        name: 'Search Service',
        type: 'graphql',
        status: 'unknown'
      },
      storage: {
        url: config.NEXT_PUBLIC_STORAGE_API_URL || '',
        name: 'Storage Service',
        type: 'graphql',
        status: 'unknown'
      },
      ...initialConfig
    };

    // Add optional services if configured
    if (config.NEXT_PUBLIC_AI_API_URL) {
      this.config.ai = {
        url: config.NEXT_PUBLIC_AI_API_URL,
        name: 'AI Service',
        type: 'graphql',
        status: 'unknown'
      };
    }

    if (config.NEXT_PUBLIC_DATA_INGESTION_API_URL) {
      this.config.dataIngestion = {
        url: config.NEXT_PUBLIC_DATA_INGESTION_API_URL,
        name: 'Data Ingestion Service',
        type: 'graphql',
        status: 'unknown'
      };
    }

    if (config.NEXT_PUBLIC_SEISMIC_INGESTION_API_URL) {
      this.config.seismicIngestion = {
        url: config.NEXT_PUBLIC_SEISMIC_INGESTION_API_URL,
        name: 'Seismic Ingestion Service',
        type: 'graphql',
        status: 'unknown'
      };
    }

    this.authTokenCache = null;
    this.healthCheckInterval = null;
  }

  /**
   * Get authentication headers with Cognito tokens
   */
  async getAuthHeaders(dataPartition = this.defaultDataPartition) {
    try {
      // Check if we have cached valid tokens
      if (this.authTokenCache && this.authTokenCache.expiresAt > Date.now()) {
        return this.buildAuthHeaders(
          this.authTokenCache.idToken,
          this.authTokenCache.accessToken,
          dataPartition
        );
      }

      let idToken;
      let accessToken;

      // Try to get tokens from window context (OIDC) first
      if (typeof window !== 'undefined' && window.__OIDC_TOKENS__) {
        const tokens = window.__OIDC_TOKENS__;
        idToken = tokens.idToken;
        accessToken = tokens.accessToken;
        console.log('✅ Using OIDC tokens from window context');
      } else {
        // Fallback to Amplify fetchAuthSession
        try {
          const session = await fetchAuthSession();
          idToken = session.tokens?.idToken?.toString();
          accessToken = session.tokens?.accessToken?.toString();
          if (idToken && accessToken) {
            console.log('✅ Using tokens from Amplify fetchAuthSession');
          }
        } catch (amplifyError) {
          console.warn('Amplify fetchAuthSession failed:', amplifyError);
        }
      }

      if (!idToken || !accessToken) {
        console.warn('⚠️ No authentication tokens available yet. This may be normal during initial page load.');
        throw new Error('No valid authentication tokens found. Please ensure you are logged in.');
      }

      // Cache tokens (assuming 1 hour expiry)
      this.authTokenCache = {
        idToken,
        accessToken,
        expiresAt: Date.now() + (55 * 60 * 1000) // 55 minutes to be safe
      };

      return this.buildAuthHeaders(idToken, accessToken, dataPartition);
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Build authentication headers for OSDU compliance
   */
  buildAuthHeaders(idToken, accessToken, dataPartition) {
    return {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      'data-partition-id': dataPartition,
      'x-access-token': accessToken,
      'Accept': 'application/json'
    };
  }

  /**
   * Discover services from AWS CloudFormation deployment outputs
   */
  async discoverServicesFromDeployment() {
    try {
      // Simulate service discovery from environment variables
      const discoveredServices = await this.simulateServiceDiscovery();
      
      // Update configuration with discovered services
      Object.entries(discoveredServices).forEach(([serviceName, endpoint]) => {
        if (serviceName in this.config) {
          this.config[serviceName].url = endpoint.url;
          this.config[serviceName].status = 'unknown';
          this.config[serviceName].lastChecked = undefined;
        }
      });

      console.log('Service discovery completed:', discoveredServices);
    } catch (error) {
      console.error('Service discovery failed:', error);
      // Continue with existing configuration
    }
  }

  /**
   * Simulate service discovery from deployment outputs
   */
  async simulateServiceDiscovery() {
    const discoveredServices = {};

    // Check for stack outputs in environment variables
    const stackOutputs = [
      { env: 'NEXT_PUBLIC_SCHEMA_STACK_OUTPUT', service: 'schema', name: 'Schema Service' },
      { env: 'NEXT_PUBLIC_ENTITLEMENTS_STACK_OUTPUT', service: 'entitlements', name: 'Entitlements Service' },
      { env: 'NEXT_PUBLIC_LEGAL_STACK_OUTPUT', service: 'legal', name: 'Legal Tagging Service' },
      { env: 'NEXT_PUBLIC_SEARCH_STACK_OUTPUT', service: 'search', name: 'Search Service' },
      { env: 'NEXT_PUBLIC_STORAGE_STACK_OUTPUT', service: 'storage', name: 'Storage Service' }
    ];

    stackOutputs.forEach(({ env, service, name }) => {
      const url = config[env];
      if (url) {
        discoveredServices[service] = {
          url,
          name,
          type: 'graphql',
          status: 'unknown'
        };
      }
    });

    return discoveredServices;
  }

  /**
   * Perform health check on a specific service
   */
  async checkServiceHealth(serviceName) {
    const service = this.config[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not configured`);
    }

    const startTime = Date.now();
    
    try {
      const headers = await this.getAuthHeaders();
      
      // Perform basic connectivity test with introspection query
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(service.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query HealthCheck {
              __schema {
                queryType {
                  name
                }
              }
            }
          `
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      // Try to detect service features through introspection
      const features = await this.detectServiceFeatures(service.url, headers);
      
      // Update service status
      service.status = 'healthy';
      service.lastChecked = new Date();
      service.responseTime = responseTime;
      service.features = features;

      return {
        service: serviceName,
        status: 'healthy',
        responseTime,
        features,
        version: await this.detectServiceVersion(service.url, headers)
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update service status
      service.status = 'unhealthy';
      service.lastChecked = new Date();
      service.responseTime = responseTime;

      return {
        service: serviceName,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect available features for a service through introspection
   */
  async detectServiceFeatures(url, headers) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query DetectFeatures {
              __schema {
                queryType {
                  fields {
                    name
                  }
                }
                mutationType {
                  fields {
                    name
                  }
                }
              }
            }
          `
        })
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      if (result.errors) {
        return [];
      }

      const queryFields = result.data?.__schema?.queryType?.fields?.map(f => f.name) || [];
      const mutationFields = result.data?.__schema?.mutationType?.fields?.map(f => f.name) || [];
      
      const features = [];
      
      // Detect enhanced schema features
      if (queryFields.includes('validateData')) features.push('data-validation');
      if (queryFields.includes('searchSchemas')) features.push('schema-search');
      if (queryFields.includes('getSchemaStatistics')) features.push('schema-statistics');
      if (queryFields.includes('compareSchemas')) features.push('schema-comparison');
      
      // Detect standard OSDU features
      if (queryFields.some(f => f.includes('list'))) features.push('listing');
      if (mutationFields.some(f => f.includes('create'))) features.push('creation');
      if (mutationFields.some(f => f.includes('update'))) features.push('updating');
      if (mutationFields.some(f => f.includes('delete'))) features.push('deletion');

      return features;
    } catch (error) {
      console.warn('Failed to detect service features:', error);
      return [];
    }
  }

  /**
   * Detect service version (if available)
   */
  async detectServiceVersion(url, headers) {
    try {
      // Try to get version from a version query if available
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query GetVersion {
              version
            }
          `
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.version) {
          return result.data.version;
        }
      }

      // Fallback: try to extract version from response headers
      const serverHeader = response.headers.get('server');
      if (serverHeader) {
        const versionMatch = serverHeader.match(/v?(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          return versionMatch[1];
        }
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Check health of all configured services
   */
  async checkAllServicesHealth() {
    const serviceNames = Object.keys(this.config);
    const healthChecks = serviceNames.map(serviceName => 
      this.checkServiceHealth(serviceName).catch(error => ({
        service: serviceName,
        status: 'unhealthy',
        responseTime: 0,
        error: error.message
      }))
    );

    return Promise.all(healthChecks);
  }

  /**
   * Start periodic health checking
   */
  startHealthMonitoring(intervalMs = 300000) { // Default 5 minutes
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllServicesHealth();
        console.log('Periodic health check completed');
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop periodic health checking
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get current service configuration
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Get a specific service endpoint
   */
  getServiceEndpoint(serviceName) {
    return this.config[serviceName];
  }

  /**
   * Update service configuration
   */
  updateServiceConfig(serviceName, updates) {
    if (this.config[serviceName]) {
      this.config[serviceName] = { ...this.config[serviceName], ...updates };
    }
  }

  /**
   * Get services by status
   */
  getServicesByStatus(status) {
    return Object.entries(this.config)
      .filter(([, endpoint]) => endpoint.status === status)
      .map(([name, endpoint]) => ({ name, endpoint }));
  }

  /**
   * Get services with specific features
   */
  getServicesWithFeature(feature) {
    return Object.entries(this.config)
      .filter(([, endpoint]) => endpoint.features?.includes(feature))
      .map(([name, endpoint]) => ({ name, endpoint }));
  }

  /**
   * Clear authentication token cache (for logout)
   */
  clearAuthCache() {
    this.authTokenCache = null;
  }

  /**
   * Get service statistics
   */
  getServiceStatistics() {
    const services = Object.values(this.config);
    const total = services.length;
    const healthy = services.filter(s => s.status === 'healthy').length;
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    const unknown = services.filter(s => s.status === 'unknown').length;
    
    const responseTimes = services
      .filter(s => s.responseTime !== undefined)
      .map(s => s.responseTime);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      total,
      healthy,
      unhealthy,
      unknown,
      averageResponseTime
    };
  }
}

// Export singleton instance
export const serviceConfigManager = new ServiceConfigManager();