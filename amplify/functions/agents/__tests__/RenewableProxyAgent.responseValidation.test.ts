/**
 * Unit tests for RenewableProxyAgent response validation functionality
 * 
 * Tests validation of orchestrator response structure, required fields,
 * artifacts array validation, project ID validation, and error messages.
 */

import { RenewableProxyAgent } from '../renewableProxyAgent';
import { LambdaClient } from '@aws-sdk/client-lambda';

// Mock the renewableConfig module
jest.mock('../../shared/renewableConfig', () => ({
  getRenewableConfig: jest.fn(() => ({
    region: 'us-east-1',
    agentCoreEndpoint: 'test-orchestrator-function',
    enabled: true,
  })),
}));

// Mock AWS SDK Lambda Client
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-lambda', () => {
  const actual = jest.requireActual('@aws-sdk/client-lambda');
  return {
    ...actual,
    LambdaClient: jest.fn(() => ({
      send: mockSend,
    })),
  };
});

describe('RenewableProxyAgent - Response Validation', () => {
  let agent: RenewableProxyAgent;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockReset();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Validation with valid response', () => {
    it('should accept response with all required fields', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
              FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Analysis completed successfully',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'project-123' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Analysis completed successfully');
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
    });

    it('should accept response with valid artifacts array', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [{ id: 1 }] },
                metadata: { projectId: 'project-456' }
              },
              {
                type: 'layout_optimization',
                data: { turbines: [] },
                metadata: { projectId: 'project-456' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBe(2);
    });

    it('should accept response with unique project ID', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'terrain-1234567890-abc123' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(result.artifacts![0].metadata.projectId).toBe('terrain-1234567890-abc123');
      expect(result.artifacts![0].metadata.projectId).not.toBe('default-project');
    });

    it('should not log validation warnings for valid response', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'project-789' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const validationWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0]?.includes('Response validation')
      );

      expect(validationWarnings.length).toBe(0);
    });
  });

  describe('Validation with missing required fields', () => {
    it('should reject response missing success field', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            // missing success field
            message: 'Test message',
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid response');
      expect(result.message).toContain('success');
    });

    it('should reject response missing message field', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            // missing message field
            artifacts: [],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid response');
      expect(result.message).toContain('message');
    });

    it('should reject response missing artifacts field', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            // missing artifacts field
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid response');
      expect(result.message).toContain('artifacts');
    });

    it('should log validation failure details for missing fields', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            // missing message and artifacts
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call =>
        call[0]?.includes('Response validation failed')
      );

      expect(errorLog).toBeDefined();
      expect(errorLog[1]).toMatchObject({
        missingFields: expect.arrayContaining(['message', 'artifacts']),
      });
    });
  });

  describe('Validation with invalid artifacts structure', () => {
    it('should reject response with non-array artifacts', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: { invalid: 'not an array' }, // Should be array
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid response');
      expect(result.message).toContain('artifacts must be an array');
    });

    it('should reject artifacts missing required type field', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                // missing type field
                data: { features: [] },
                metadata: { projectId: 'project-123' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid artifact structure');
      expect(result.message).toContain('type');
    });

    it('should reject artifacts missing data field', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                // missing data field
                metadata: { projectId: 'project-123' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid artifact structure');
      expect(result.message).toContain('data');
    });

    it('should log artifact validation failures with details', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                // missing data field
                metadata: { projectId: 'project-123' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call =>
        call[0]?.includes('Artifact validation failed')
      );

      expect(errorLog).toBeDefined();
      expect(errorLog[1]).toMatchObject({
        artifactIndex: 0,
        missingFields: expect.arrayContaining(['data']),
      });
    });
  });

  describe('Validation with "default-project" ID', () => {
    it('should reject response with "default-project" project ID', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'default-project' } // Invalid default ID
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid project ID');
      expect(result.message).toContain('default-project');
    });

    it('should log warning for default-project ID', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'default-project' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call =>
        call[0]?.includes('Invalid project ID detected')
      );

      expect(errorLog).toBeDefined();
      expect(errorLog[1]).toMatchObject({
        projectId: 'default-project',
        issue: expect.stringContaining('default'),
      });
    });

    it('should provide remediation for default-project ID', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'default-project' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('orchestrator');
      expect(result.message).toContain('project ID generation');
    });

    it('should reject response with missing project ID in metadata', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: {} // Missing projectId
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('project ID');
      expect(result.message).toContain('missing');
    });
  });

  describe('Validation error messages', () => {
    it('should provide clear error message for missing required fields', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            // missing message and artifacts
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Invalid response from renewable energy backend');
      expect(result.message).toContain('Missing required fields');
      expect(result.message).toContain('message');
      expect(result.message).toContain('artifacts');
    });

    it('should provide clear error message for invalid artifacts structure', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: 'not an array',
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Invalid response');
      expect(result.message).toContain('artifacts must be an array');
    });

    it('should provide clear error message for default-project ID', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'default-project' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Invalid project ID');
      expect(result.message).toContain('default-project');
      expect(result.message).toContain('unique project ID');
    });

    it('should include remediation steps in validation error messages', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'Test message',
            artifacts: [
              {
                type: 'terrain_analysis',
                data: { features: [] },
                metadata: { projectId: 'default-project' }
              }
            ],
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.message).toContain('Remediation');
      expect(result.message).toContain('Check orchestrator');
    });

    it('should include request ID in validation error messages', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            // missing required fields
          })),
        });
      });

      agent = new RenewableProxyAgent();
      await agent.processQuery('Test query');

      const errorLog = consoleErrorSpy.mock.calls.find(call =>
        call[0]?.includes('Response validation failed')
      );

      expect(errorLog).toBeDefined();
      expect(errorLog[1]).toHaveProperty('requestId');
      expect(errorLog[1].requestId).toMatch(/^[a-f0-9-]+$/);
    });
  });

  describe('Edge cases', () => {
    it('should accept empty artifacts array', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify({
            success: true,
            message: 'No results found',
            artifacts: [], // Empty but valid
            thoughtSteps: [],
          })),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual([]);
    });

    it('should handle null response gracefully', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode(JSON.stringify(null)),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid response');
    });

    it('should handle malformed JSON gracefully', async () => {
      mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetFunctionCommand') {
          return Promise.resolve({
            Configuration: {
              FunctionName: 'test-orchestrator-function',
            },
          });
        }
        return Promise.resolve({
          StatusCode: 200,
          Payload: new TextEncoder().encode('{ invalid json }'),
        });
      });

      agent = new RenewableProxyAgent();
      const result = await agent.processQuery('Test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('error');
    });
  });
});
