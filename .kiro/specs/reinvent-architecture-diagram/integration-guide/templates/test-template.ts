/**
 * Test Template
 * 
 * This template provides a starting point for creating tests for agents and tools.
 * Replace placeholders with your test-specific implementation.
 */

import { YourAgent } from '../yourAgent';
import { handler as yourToolHandler } from '../../your-tool/handler';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-s3');

describe('YourAgent', () => {
  let agent: YourAgent;

  beforeEach(() => {
    agent = new YourAgent();
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Intent Detection', () => {
    it('should detect correct intent for valid query', () => {
      const message = 'your test query here';
      const intent = (agent as any).detectIntent(message);
      
      expect(intent).toBe('your_expected_intent');
    });

    it('should return general intent for unrecognized query', () => {
      const message = 'random unrelated query';
      const intent = (agent as any).detectIntent(message);
      
      expect(intent).toBe('general');
    });

    it('should be case insensitive', () => {
      const message1 = 'YOUR TEST QUERY';
      const message2 = 'your test query';
      
      const intent1 = (agent as any).detectIntent(message1);
      const intent2 = (agent as any).detectIntent(message2);
      
      expect(intent1).toBe(intent2);
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract parameters from valid message', () => {
      const message = 'analyze WELL-001 from 5000 to 6000 ft';
      const params = (agent as any).extractParameters(message);
      
      expect(params).toHaveProperty('wellName');
      expect(params.wellName).toBe('WELL-001');
      expect(params).toHaveProperty('depthStart');
      expect(params.depthStart).toBe(5000);
      expect(params).toHaveProperty('depthEnd');
      expect(params.depthEnd).toBe(6000);
    });

    it('should handle missing parameters', () => {
      const message = 'analyze something';
      const params = (agent as any).extractParameters(message);
      
      expect(params.wellName).toBeUndefined();
      expect(params.depthStart).toBeUndefined();
    });

    it('should handle different formats', () => {
      const message1 = 'WELL-001';
      const message2 = 'WELL_001';
      const message3 = 'well001';
      
      const params1 = (agent as any).extractParameters(message1);
      const params2 = (agent as any).extractParameters(message2);
      const params3 = (agent as any).extractParameters(message3);
      
      expect(params1.wellName).toBeDefined();
      expect(params2.wellName).toBeDefined();
      expect(params3.wellName).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    it('should validate correct parameters', () => {
      const params = {
        wellName: 'WELL-001',
        depthStart: 5000,
        depthEnd: 6000
      };
      
      const validation = (agent as any).validateParameters(params);
      
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should reject missing required parameters', () => {
      const params = {
        depthStart: 5000,
        depthEnd: 6000
      };
      
      const validation = (agent as any).validateParameters(params);
      
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('wellName');
    });

    it('should reject invalid parameter values', () => {
      const params = {
        wellName: 'WELL-001',
        depthStart: 6000,
        depthEnd: 5000 // End before start
      };
      
      const validation = (agent as any).validateParameters(params);
      
      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
    });
  });

  describe('Process Message', () => {
    it('should process valid message successfully', async () => {
      const message = 'your valid test query';
      
      const result = await agent.processMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps.length).toBeGreaterThan(0);
    });

    it('should return error for invalid message', async () => {
      const message = 'invalid query without required info';
      
      const result = await agent.processMessage(message);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate thought steps', async () => {
      const message = 'your valid test query';
      
      const result = await agent.processMessage(message);
      
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps.length).toBeGreaterThan(0);
      
      const firstStep = result.thoughtSteps[0];
      expect(firstStep).toHaveProperty('id');
      expect(firstStep).toHaveProperty('type');
      expect(firstStep).toHaveProperty('title');
      expect(firstStep).toHaveProperty('summary');
      expect(firstStep).toHaveProperty('status');
    });

    it('should handle tool invocation errors gracefully', async () => {
      // Mock tool Lambda to throw error
      const mockError = new Error('Tool Lambda failed');
      jest.spyOn(agent as any, 'invokeToolLambda').mockRejectedValue(mockError);
      
      const message = 'query that requires tool';
      const result = await agent.processMessage(message);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Tool Invocation', () => {
    it('should invoke tool Lambda with correct parameters', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        Payload: new TextEncoder().encode(JSON.stringify({
          statusCode: 200,
          body: JSON.stringify({ success: true, data: {} })
        }))
      });
      
      (agent as any).lambdaClient = { send: mockInvoke };
      
      const params = { param1: 'value1' };
      await (agent as any).invokeToolLambda(params);
      
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should handle tool Lambda errors', async () => {
      const mockInvoke = jest.fn().mockRejectedValue(new Error('Lambda error'));
      (agent as any).lambdaClient = { send: mockInvoke };
      
      const params = { param1: 'value1' };
      
      await expect((agent as any).invokeToolLambda(params)).rejects.toThrow();
    });
  });

  describe('Response Formatting', () => {
    it('should format response with artifacts', () => {
      const result = {
        data: { value: 42 },
        visualization: '<html>...</html>'
      };
      
      const formatted = (agent as any).formatResponse(result);
      
      expect(formatted.message).toBeDefined();
      expect(formatted.artifacts).toBeDefined();
      expect(formatted.artifacts.length).toBeGreaterThan(0);
    });

    it('should format response without artifacts', () => {
      const result = {
        data: { value: 42 }
      };
      
      const formatted = (agent as any).formatResponse(result);
      
      expect(formatted.message).toBeDefined();
      expect(formatted.artifacts).toBeUndefined();
    });
  });
});

describe('YourTool Lambda', () => {
  beforeEach(() => {
    // Set environment variables
    process.env.STORAGE_BUCKET = 'test-bucket';
    jest.clearAllMocks();
  });

  describe('Handler', () => {
    it('should process valid event successfully', async () => {
      const event = {
        param1: 'test-value',
        param2: 42
      };
      
      const context = {} as any;
      const result = await yourToolHandler(event, context, () => {});
      
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should handle API Gateway event format', async () => {
      const event = {
        body: JSON.stringify({
          param1: 'test-value',
          param2: 42
        })
      };
      
      const context = {} as any;
      const result = await yourToolHandler(event, context, () => {});
      
      expect(result.statusCode).toBe(200);
    });

    it('should return error for invalid parameters', async () => {
      const event = {
        param1: 'test-value'
        // Missing param2
      };
      
      const context = {} as any;
      const result = await yourToolHandler(event, context, () => {});
      
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should handle exceptions gracefully', async () => {
      const event = null; // Invalid event
      
      const context = {} as any;
      const result = await yourToolHandler(event, context, () => {});
      
      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate required parameters', () => {
      // Test your tool's validation logic
      const params = {
        param1: 'value1',
        param2: 42
      };
      
      // Add your validation test
      expect(params.param1).toBeDefined();
      expect(params.param2).toBeDefined();
    });
  });

  describe('Data Processing', () => {
    it('should process data correctly', () => {
      // Test your tool's data processing logic
      const inputData = { /* test data */ };
      
      // Add your processing test
      expect(inputData).toBeDefined();
    });
  });

  describe('Artifact Generation', () => {
    it('should generate artifacts', () => {
      // Test artifact generation
      const results = { /* test results */ };
      
      // Add your artifact generation test
      expect(results).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  it('should complete end-to-end flow', async () => {
    // Test complete flow from agent to tool to response
    const agent = new YourAgent();
    const message = 'your complete test query';
    
    const result = await agent.processMessage(message);
    
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(result.artifacts).toBeDefined();
  });

  it('should handle errors in complete flow', async () => {
    // Test error handling in complete flow
    const agent = new YourAgent();
    const message = 'invalid query';
    
    const result = await agent.processMessage(message);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

/**
 * Test Utilities
 */

// Mock data generators
export const generateMockWellData = () => ({
  wellName: 'WELL-001',
  curves: {
    GR: [50, 60, 70, 80, 90],
    RHOB: [2.3, 2.4, 2.5, 2.6, 2.7],
    NPHI: [0.15, 0.18, 0.20, 0.22, 0.25]
  },
  depth: [5000, 5010, 5020, 5030, 5040]
});

export const generateMockParameters = () => ({
  wellName: 'WELL-001',
  depthStart: 5000,
  depthEnd: 6000
});

export const generateMockArtifact = () => ({
  type: 'your_artifact_type',
  data: {
    messageContentType: 'your_artifact_type',
    title: 'Test Artifact',
    content: { value: 42 },
    metadata: {
      timestamp: new Date().toISOString()
    }
  }
});

// Mock AWS SDK responses
export const mockS3GetObject = (data: any) => ({
  Body: {
    transformToString: async () => JSON.stringify(data)
  }
});

export const mockLambdaInvoke = (result: any) => ({
  Payload: new TextEncoder().encode(JSON.stringify(result))
});

/**
 * Usage Examples:
 * 
 * // Run all tests
 * npm test
 * 
 * // Run specific test file
 * npm test yourAgent.test.ts
 * 
 * // Run with coverage
 * npm test -- --coverage
 * 
 * // Run in watch mode
 * npm test -- --watch
 */
