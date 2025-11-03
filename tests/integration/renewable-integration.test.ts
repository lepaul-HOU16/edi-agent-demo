/**
 * Integration Tests for Renewable Energy Integration
 * 
 * These tests validate the complete end-to-end flow from user query
 * to artifact rendering, including:
 * - Configuration validation
 * - Agent routing
 * - AgentCore communication
 * - Response transformation
 * - Artifact rendering
 */

import { RenewableClient } from '../../src/services/renewable-integration/renewableClient';
import { ResponseTransformer } from '../../src/services/renewable-integration/responseTransformer';
import { getRenewableConfig, isRenewableEnabled } from '../../src/services/renewable-integration/config';
import { RenewableProxyAgent } from '../../amplify/functions/agents/renewableProxyAgent';

describe('Renewable Energy Integration - End-to-End Tests', () => {
  
  describe('Configuration Tests', () => {
    
    it('should load renewable configuration', () => {
      const config = getRenewableConfig();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('agentCoreEndpoint');
      expect(config).toHaveProperty('s3Bucket');
      expect(config).toHaveProperty('region');
    });
    
    it('should validate enabled status', () => {
      const enabled = isRenewableEnabled();
      expect(typeof enabled).toBe('boolean');
    });
    
    it('should have default region if not specified', () => {
      const config = getRenewableConfig();
      expect(config.region).toBeDefined();
      expect(config.region.length).toBeGreaterThan(0);
    });
  });
  
  describe('RenewableClient Tests', () => {
    
    let client: RenewableClient;
    
    beforeEach(() => {
      const config = getRenewableConfig();
      
      // Skip tests if renewable is not enabled
      if (!config.enabled) {
        console.log('⚠️  Renewable energy integration is disabled. Skipping client tests.');
        return;
      }
      
      client = new RenewableClient(config);
    });
    
    it('should initialize RenewableClient', () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(RenewableClient);
    });
    
    it('should have invokeAgent method', () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      expect(client.invokeAgent).toBeDefined();
      expect(typeof client.invokeAgent).toBe('function');
    });
  });
  
  describe('RenewableProxyAgent Tests', () => {
    
    let agent: RenewableProxyAgent;
    
    beforeEach(() => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Renewable energy integration is disabled. Skipping agent tests.');
        return;
      }
      
      agent = new RenewableProxyAgent();
    });
    
    it('should initialize RenewableProxyAgent', () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      expect(agent).toBeDefined();
      expect(agent).toBeInstanceOf(RenewableProxyAgent);
    });
    
    it('should have processQuery method', () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      expect(agent.processQuery).toBeDefined();
      expect(typeof agent.processQuery).toBe('function');
    });
    
    it('should have setSessionId method', () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      expect(agent.setSessionId).toBeDefined();
      expect(typeof agent.setSessionId).toBe('function');
    });
  });
  
  describe('ResponseTransformer Tests', () => {
    
    it('should have transformToEDIArtifacts method', () => {
      expect(ResponseTransformer.transformToEDIArtifacts).toBeDefined();
      expect(typeof ResponseTransformer.transformToEDIArtifacts).toBe('function');
    });
    
    it('should transform terrain artifact', () => {
      const mockAgentCoreResponse = {
        message: 'Terrain analysis complete',
        artifacts: [
          {
            type: 'terrain' as const,
            data: {
              mapHtml: '<html><body>Mock terrain map</body></html>',
              suitabilityScore: 85,
              coordinates: { lat: 35.067482, lng: -101.395466 },
              exclusionZones: [],
            },
            metadata: {
              projectId: 'test-project-123',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        thoughtSteps: [],
        projectId: 'test-project-123',
        status: 'success' as const,
      };
      
      const artifacts = ResponseTransformer.transformToEDIArtifacts(mockAgentCoreResponse);
      
      expect(artifacts).toBeDefined();
      expect(Array.isArray(artifacts)).toBe(true);
      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0]).toHaveProperty('messageContentType');
      expect(artifacts[0].messageContentType).toBe('wind_farm_terrain_analysis');
    });
    
    it('should transform layout artifact', () => {
      const mockAgentCoreResponse = {
        message: 'Layout design complete',
        artifacts: [
          {
            type: 'layout' as const,
            data: {
              mapHtml: '<html><body>Mock layout map</body></html>',
              turbineCount: 15,
              totalCapacity: 30,
              turbinePositions: [],
            },
            metadata: {
              projectId: 'test-project-456',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        thoughtSteps: [],
        projectId: 'test-project-456',
        status: 'success' as const,
      };
      
      const artifacts = ResponseTransformer.transformToEDIArtifacts(mockAgentCoreResponse);
      
      expect(artifacts).toBeDefined();
      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0].messageContentType).toBe('wind_farm_layout');
    });
    
    it('should transform simulation artifact', () => {
      const mockAgentCoreResponse = {
        message: 'Simulation complete',
        artifacts: [
          {
            type: 'simulation' as const,
            data: {
              performanceMetrics: {
                annualEnergyProduction: 95000,
                capacityFactor: 0.42,
                wakeLosses: 0.08,
              },
              chartImages: {
                wakeMap: 'data:image/png;base64,mock-image',
                performanceChart: 'data:image/png;base64,mock-chart',
              },
            },
            metadata: {
              projectId: 'test-project-789',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        thoughtSteps: [],
        projectId: 'test-project-789',
        status: 'success' as const,
      };
      
      const artifacts = ResponseTransformer.transformToEDIArtifacts(mockAgentCoreResponse);
      
      expect(artifacts).toBeDefined();
      expect(artifacts.length).toBeGreaterThan(0);
      expect(artifacts[0].messageContentType).toBe('wind_farm_simulation');
    });
    
    it('should handle empty artifacts array', () => {
      const mockAgentCoreResponse = {
        message: 'No artifacts generated',
        artifacts: [],
        thoughtSteps: [],
        projectId: 'test-project-empty',
        status: 'success' as const,
      };
      
      const artifacts = ResponseTransformer.transformToEDIArtifacts(mockAgentCoreResponse);
      
      expect(artifacts).toBeDefined();
      expect(Array.isArray(artifacts)).toBe(true);
      expect(artifacts.length).toBe(0);
    });
  });
});

describe('Renewable Energy Integration - Live Tests', () => {
  
  // These tests require actual AgentCore deployment and should only run
  // when renewable integration is enabled and configured
  
  const TIMEOUT = 60000; // 60 seconds for AgentCore calls
  
  beforeAll(() => {
    if (!isRenewableEnabled()) {
      console.log('⚠️  Renewable energy integration is disabled.');
      console.log('⚠️  Set NEXT_PUBLIC_RENEWABLE_ENABLED=true to run live tests.');
      console.log('⚠️  Skipping all live integration tests.');
    }
  });
  
  describe('Live AgentCore Communication', () => {
    
    it('should connect to AgentCore endpoint', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      const config = getRenewableConfig();
      const client = new RenewableClient(config);
      
      // Simple connection test
      try {
        const response = await client.invokeAgent('Hello', 'test-session');
        expect(response).toBeDefined();
        expect(response).toHaveProperty('message');
      } catch (error: any) {
        console.error('❌ AgentCore connection failed:', error.message);
        throw error;
      }
    }, TIMEOUT);
    
    it('should process terrain analysis query', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }
      
      const agent = new RenewableProxyAgent();
      agent.setSessionId('test-terrain-session');
      
      const query = 'Analyze terrain for wind farm at 35.067482, -101.395466';
      
      try {
        const response = await agent.processQuery(query);
        
        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.message).toBeDefined();
        expect(response.agentUsed).toBe('renewable_energy');
        expect(response.thoughtSteps).toBeDefined();
        expect(Array.isArray(response.thoughtSteps)).toBe(true);
        
        // Check for terrain artifact
        if (response.artifacts && response.artifacts.length > 0) {
          const terrainArtifact = response.artifacts.find(
            (a: any) => a.messageContentType === 'wind_farm_terrain_analysis'
          );
          expect(terrainArtifact).toBeDefined();
        }
      } catch (error: any) {
        console.error('❌ Terrain analysis failed:', error.message);
        throw error;
      }
    }, TIMEOUT);
  });
});

