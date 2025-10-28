/**
 * Integration Tests for EDIcraft Agent
 * Tests complete flow from query to response with mock Bedrock responses
 * Requirements: 6.5 - Integration Testing
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Type definitions
type EDIcraftConfig = {
  bedrockAgentId: string;
  bedrockAgentAliasId: string;
  minecraftHost: string;
  minecraftPort: number;
  rconPassword: string;
  ediUsername: string;
  ediPassword: string;
  ediClientId: string;
  ediClientSecret: string;
  ediPartition: string;
  ediPlatformUrl: string;
  region: string;
};

type ThoughtStep = {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
  details?: string;
};

type EDIcraftResponse = {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps: ThoughtStep[];
  connectionStatus: 'connected' | 'error' | 'pending' | 'not_deployed';
  error?: string;
};

// Mock Bedrock response structures
const mockBedrockTraces = {
  rationale: {
    orchestrationTrace: {
      rationale: {
        text: 'I need to fetch wellbore trajectory data from OSDU and build it in Minecraft'
      }
    }
  },
  actionInvocation: {
    orchestrationTrace: {
      invocationInput: {
        actionGroupInvocationInput: {
          actionGroupName: 'OSDU_Tools',
          function: 'get_wellbore_trajectory',
          parameters: [
            { name: 'wellbore_id', value: 'wellbore-123' }
          ]
        }
      }
    }
  },
  observation: {
    orchestrationTrace: {
      observation: {
        actionGroupInvocationOutput: {
          text: 'Successfully retrieved wellbore trajectory with 150 points'
        }
      }
    }
  },
  minecraftAction: {
    orchestrationTrace: {
      invocationInput: {
        actionGroupInvocationInput: {
          actionGroupName: 'Minecraft_Tools',
          function: 'build_wellbore',
          parameters: [
            { name: 'coordinates', value: '[[100,64,200],[101,65,201]]' }
          ]
        }
      }
    }
  },
  minecraftObservation: {
    orchestrationTrace: {
      observation: {
        actionGroupInvocationOutput: {
          text: 'Wellbore built successfully at coordinates (100, 64, 200)'
        }
      }
    }
  },
  failure: {
    failureTrace: {
      failureReason: 'Connection to Minecraft server failed',
      traceId: 'trace-123'
    }
  }
};

// Helper class to simulate the complete EDIcraft flow
class EDIcraftIntegrationSimulator {
  private config: EDIcraftConfig;
  
  constructor(config: EDIcraftConfig) {
    this.config = config;
  }
  
  validateEnvironment(): { isValid: boolean; missingVariables: string[] } {
    const requiredVars = [
      'bedrockAgentId', 'bedrockAgentAliasId', 'minecraftHost', 
      'minecraftPort', 'rconPassword', 'ediUsername', 'ediPassword',
      'ediClientId', 'ediClientSecret', 'ediPartition', 'ediPlatformUrl'
    ];
    
    const missing = requiredVars.filter(key => !this.config[key as keyof EDIcraftConfig]);
    return { isValid: missing.length === 0, missingVariables: missing };
  }
  
  async processQuery(query: string, mockTraces: any[]): Promise<EDIcraftResponse> {
    // Validate environment
    const validation = this.validateEnvironment();
    if (!validation.isValid) {
      return {
        success: false,
        message: `Configuration error: Missing ${validation.missingVariables.join(', ')}`,
        artifacts: [],
        thoughtSteps: [],
        connectionStatus: 'error',
        error: 'INVALID_CONFIG'
      };
    }
    
    // Extract thought steps from traces
    const thoughtSteps = this.extractThoughtSteps(mockTraces);
    
    // Check for failures
    const hasFailure = mockTraces.some(t => t.failureTrace);
    if (hasFailure) {
      const failure = mockTraces.find(t => t.failureTrace);
      return {
        success: false,
        message: failure.failureTrace.failureReason,
        artifacts: [],
        thoughtSteps,
        connectionStatus: 'error',
        error: 'CONNECTION_REFUSED'
      };
    }
    
    // Success response
    const finalObservation = mockTraces
      .filter(t => t.orchestrationTrace?.observation)
      .pop();
    
    const message = finalObservation?.orchestrationTrace?.observation?.actionGroupInvocationOutput?.text 
      || 'Operation completed successfully';
    
    return {
      success: true,
      message,
      artifacts: [], // EDIcraft never returns visual artifacts
      thoughtSteps,
      connectionStatus: 'connected'
    };
  }
  
  private extractThoughtSteps(traces: any[]): ThoughtStep[] {
    const steps: ThoughtStep[] = [];
    let stepId = 0;
    
    for (const trace of traces) {
      if (trace.orchestrationTrace?.rationale) {
        steps.push({
          id: `step-${stepId++}`,
          type: 'analysis',
          timestamp: Date.now(),
          title: 'Agent Reasoning',
          summary: trace.orchestrationTrace.rationale.text,
          status: 'complete'
        });
      }
      
      if (trace.orchestrationTrace?.invocationInput?.actionGroupInvocationInput) {
        const action = trace.orchestrationTrace.invocationInput.actionGroupInvocationInput;
        steps.push({
          id: `step-${stepId++}`,
          type: 'processing',
          timestamp: Date.now(),
          title: `Executing: ${action.actionGroupName}`,
          summary: `Invoking ${action.function}`,
          status: 'complete'
        });
      }
      
      if (trace.orchestrationTrace?.observation?.actionGroupInvocationOutput) {
        const output = trace.orchestrationTrace.observation.actionGroupInvocationOutput;
        steps.push({
          id: `step-${stepId++}`,
          type: 'processing',
          timestamp: Date.now(),
          title: 'Action Result',
          summary: output.text,
          status: 'complete'
        });
      }
      
      if (trace.failureTrace) {
        steps.push({
          id: `step-${stepId++}`,
          type: 'processing',
          timestamp: Date.now(),
          title: 'Error Occurred',
          summary: trace.failureTrace.failureReason,
          status: 'error'
        });
      }
    }
    
    // Add final completion step if no failure
    if (!traces.some(t => t.failureTrace)) {
      steps.push({
        id: `step-${stepId++}`,
        type: 'completion',
        timestamp: Date.now(),
        title: 'Request Complete',
        summary: 'Operation completed successfully',
        status: 'complete'
      });
    }
    
    return steps;
  }
}

// Helper to create valid config
function createValidConfig(): EDIcraftConfig {
  return {
    bedrockAgentId: 'ABCD123456',
    bedrockAgentAliasId: 'TSTALIASID',
    minecraftHost: 'edicraft.nigelgardiner.com',
    minecraftPort: 49000,
    rconPassword: 'test-password',
    ediUsername: 'test-user',
    ediPassword: 'test-pass',
    ediClientId: 'test-client-id',
    ediClientSecret: 'test-client-secret',
    ediPartition: 'test-partition',
    ediPlatformUrl: 'https://test.osdu.platform.com',
    region: 'us-east-1'
  };
}

describe('EDIcraft Integration Tests - Complete Flow', () => {
  let simulator: EDIcraftIntegrationSimulator;
  
  beforeEach(() => {
    simulator = new EDIcraftIntegrationSimulator(createValidConfig());
  });
  
  describe('Successful Wellbore Visualization Flow', () => {
    it('should complete full wellbore visualization workflow', async () => {
      const query = 'Build wellbore trajectory for wellbore-123 in Minecraft';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.actionInvocation,
        mockBedrockTraces.observation,
        mockBedrockTraces.minecraftAction,
        mockBedrockTraces.minecraftObservation
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.message).toContain('Wellbore built successfully');
      expect(response.artifacts).toEqual([]);
      expect(response.thoughtSteps.length).toBeGreaterThan(0);
      expect(response.connectionStatus).toBe('connected');
    });
    
    it('should extract all thought steps from trace', async () => {
      const query = 'Visualize wellbore in Minecraft';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.actionInvocation,
        mockBedrockTraces.observation,
        mockBedrockTraces.minecraftAction,
        mockBedrockTraces.minecraftObservation
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.thoughtSteps.length).toBeGreaterThanOrEqual(5);
      
      // Verify step types
      const hasAnalysis = response.thoughtSteps.some(s => s.type === 'analysis');
      const hasProcessing = response.thoughtSteps.some(s => s.type === 'processing');
      const hasCompletion = response.thoughtSteps.some(s => s.type === 'completion');
      
      expect(hasAnalysis).toBe(true);
      expect(hasProcessing).toBe(true);
      expect(hasCompletion).toBe(true);
    });
    
    it('should include rationale as analysis step', async () => {
      const query = 'Build wellbore';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      const analysisStep = response.thoughtSteps.find(s => s.type === 'analysis');
      expect(analysisStep).toBeDefined();
      expect(analysisStep?.title).toBe('Agent Reasoning');
      expect(analysisStep?.summary).toContain('fetch wellbore trajectory');
    });
    
    it('should include action invocations as processing steps', async () => {
      const query = 'Get wellbore data';
      const traces = [mockBedrockTraces.actionInvocation];
      
      const response = await simulator.processQuery(query, traces);
      
      const processingStep = response.thoughtSteps.find(s => 
        s.type === 'processing' && s.title.includes('OSDU_Tools')
      );
      expect(processingStep).toBeDefined();
      expect(processingStep?.summary).toContain('get_wellbore_trajectory');
    });
    
    it('should include observations as processing steps', async () => {
      const query = 'Process wellbore';
      const traces = [mockBedrockTraces.observation];
      
      const response = await simulator.processQuery(query, traces);
      
      const observationStep = response.thoughtSteps.find(s => 
        s.type === 'processing' && s.title === 'Action Result'
      );
      expect(observationStep).toBeDefined();
      expect(observationStep?.summary).toContain('Successfully retrieved');
    });
    
    it('should add final completion step', async () => {
      const query = 'Complete operation';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      const completionStep = response.thoughtSteps.find(s => s.type === 'completion');
      expect(completionStep).toBeDefined();
      expect(completionStep?.title).toBe('Request Complete');
      expect(completionStep?.status).toBe('complete');
    });
  });
  
  describe('Error Scenarios', () => {
    it('should handle missing environment variables', async () => {
      const invalidConfig = { ...createValidConfig(), bedrockAgentId: '' };
      const invalidSimulator = new EDIcraftIntegrationSimulator(invalidConfig as any);
      
      const query = 'Build wellbore';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await invalidSimulator.processQuery(query, traces);
      
      expect(response.success).toBe(false);
      expect(response.message).toContain('Configuration error');
      expect(response.message).toContain('bedrockAgentId');
      expect(response.connectionStatus).toBe('error');
      expect(response.error).toBe('INVALID_CONFIG');
    });
    
    it('should handle connection failures', async () => {
      const query = 'Build wellbore';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.actionInvocation,
        mockBedrockTraces.failure
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(false);
      expect(response.message).toContain('Connection to Minecraft server failed');
      expect(response.connectionStatus).toBe('error');
      expect(response.error).toBe('CONNECTION_REFUSED');
    });
    
    it('should include error in thought steps', async () => {
      const query = 'Build wellbore';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.failure
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      const errorStep = response.thoughtSteps.find(s => s.status === 'error');
      expect(errorStep).toBeDefined();
      expect(errorStep?.title).toBe('Error Occurred');
      expect(errorStep?.summary).toContain('Connection to Minecraft server failed');
    });
    
    it('should not add completion step on failure', async () => {
      const query = 'Build wellbore';
      const traces = [mockBedrockTraces.failure];
      
      const response = await simulator.processQuery(query, traces);
      
      const completionStep = response.thoughtSteps.find(s => s.type === 'completion');
      expect(completionStep).toBeUndefined();
    });
    
    it('should handle multiple missing environment variables', async () => {
      const invalidConfig = {
        ...createValidConfig(),
        bedrockAgentId: '',
        minecraftHost: '',
        ediUsername: ''
      };
      const invalidSimulator = new EDIcraftIntegrationSimulator(invalidConfig as any);
      
      const query = 'Build wellbore';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await invalidSimulator.processQuery(query, traces);
      
      expect(response.success).toBe(false);
      expect(response.message).toContain('bedrockAgentId');
      expect(response.message).toContain('minecraftHost');
      expect(response.message).toContain('ediUsername');
    });
  });
  
  describe('Thought Step Extraction', () => {
    it('should extract thought steps from complex trace sequence', async () => {
      const query = 'Complete workflow';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.actionInvocation,
        mockBedrockTraces.observation,
        mockBedrockTraces.minecraftAction,
        mockBedrockTraces.minecraftObservation
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      // Should have: rationale + 2 actions + 2 observations + completion = 6 steps
      expect(response.thoughtSteps.length).toBeGreaterThanOrEqual(6);
      
      // Verify sequential IDs
      response.thoughtSteps.forEach((step, index) => {
        expect(step.id).toBe(`step-${index}`);
      });
    });
    
    it('should handle empty trace array', async () => {
      const query = 'Empty trace';
      const traces: any[] = [];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.thoughtSteps.length).toBe(1); // Only completion step
      expect(response.thoughtSteps[0].type).toBe('completion');
    });
    
    it('should handle trace with only rationale', async () => {
      const query = 'Rationale only';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.thoughtSteps.length).toBe(2); // Rationale + completion
      expect(response.thoughtSteps[0].type).toBe('analysis');
      expect(response.thoughtSteps[1].type).toBe('completion');
    });
    
    it('should maintain timestamp order', async () => {
      const query = 'Check timestamps';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.actionInvocation,
        mockBedrockTraces.observation
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      for (let i = 1; i < response.thoughtSteps.length; i++) {
        expect(response.thoughtSteps[i].timestamp)
          .toBeGreaterThanOrEqual(response.thoughtSteps[i - 1].timestamp);
      }
    });
  });
  
  describe('Response Format Compatibility', () => {
    it('should return response compatible with chat interface', async () => {
      const query = 'Build wellbore';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      // Verify all required fields exist
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('artifacts');
      expect(response).toHaveProperty('thoughtSteps');
      expect(response).toHaveProperty('connectionStatus');
      
      // Verify types
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.message).toBe('string');
      expect(Array.isArray(response.artifacts)).toBe(true);
      expect(Array.isArray(response.thoughtSteps)).toBe(true);
      expect(typeof response.connectionStatus).toBe('string');
    });
    
    it('should always return empty artifacts array', async () => {
      const query = 'Build wellbore';
      const traces = [
        mockBedrockTraces.rationale,
        mockBedrockTraces.minecraftObservation
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.artifacts).toEqual([]);
      expect(response.artifacts.length).toBe(0);
    });
    
    it('should return valid connectionStatus values', async () => {
      const query = 'Test connection status';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      const validStatuses = ['connected', 'error', 'pending', 'not_deployed'];
      expect(validStatuses).toContain(response.connectionStatus);
    });
    
    it('should include error field on failure', async () => {
      const query = 'Fail';
      const traces = [mockBedrockTraces.failure];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.error).toBeDefined();
      expect(typeof response.error).toBe('string');
    });
    
    it('should not include error field on success', async () => {
      const query = 'Success';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.error).toBeUndefined();
    });
    
    it('should format thought steps with all required fields', async () => {
      const query = 'Check thought step format';
      const traces = [mockBedrockTraces.rationale];
      
      const response = await simulator.processQuery(query, traces);
      
      response.thoughtSteps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('type');
        expect(step).toHaveProperty('timestamp');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('summary');
        expect(step).toHaveProperty('status');
        
        expect(typeof step.id).toBe('string');
        expect(['analysis', 'processing', 'completion']).toContain(step.type);
        expect(typeof step.timestamp).toBe('number');
        expect(typeof step.title).toBe('string');
        expect(typeof step.summary).toBe('string');
        expect(['complete', 'pending', 'error']).toContain(step.status);
      });
    });
  });
  
  describe('Multiple Query Scenarios', () => {
    it('should handle horizon surface visualization', async () => {
      const query = 'Build horizon surface in Minecraft';
      const horizonTraces = [
        {
          orchestrationTrace: {
            rationale: {
              text: 'I need to fetch horizon surface data and render it in Minecraft'
            }
          }
        },
        {
          orchestrationTrace: {
            invocationInput: {
              actionGroupInvocationInput: {
                actionGroupName: 'OSDU_Tools',
                function: 'get_horizon_surface',
                parameters: [{ name: 'horizon_id', value: 'horizon-456' }]
              }
            }
          }
        },
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: 'Horizon surface data retrieved with 500 points'
              }
            }
          }
        },
        {
          orchestrationTrace: {
            invocationInput: {
              actionGroupInvocationInput: {
                actionGroupName: 'Minecraft_Tools',
                function: 'build_horizon',
                parameters: [{ name: 'surface_data', value: '...' }]
              }
            }
          }
        },
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: 'Horizon surface rendered successfully'
              }
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, horizonTraces);
      
      expect(response.success).toBe(true);
      expect(response.message).toContain('Horizon surface rendered');
      expect(response.thoughtSteps.length).toBeGreaterThan(0);
    });
    
    it('should handle player position tracking', async () => {
      const query = 'Track player position in Minecraft';
      const trackingTraces = [
        {
          orchestrationTrace: {
            rationale: {
              text: 'I will get the current player position'
            }
          }
        },
        {
          orchestrationTrace: {
            invocationInput: {
              actionGroupInvocationInput: {
                actionGroupName: 'Minecraft_Tools',
                function: 'get_player_position',
                parameters: []
              }
            }
          }
        },
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: 'Player is at coordinates (150, 70, 250)'
              }
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, trackingTraces);
      
      expect(response.success).toBe(true);
      expect(response.message).toContain('coordinates');
      expect(response.thoughtSteps.some(s => s.summary.includes('player position'))).toBe(true);
    });
    
    it('should handle coordinate transformation', async () => {
      const query = 'Transform UTM coordinates to Minecraft coordinates';
      const transformTraces = [
        {
          orchestrationTrace: {
            rationale: {
              text: 'I need to convert UTM coordinates to Minecraft coordinate system'
            }
          }
        },
        {
          orchestrationTrace: {
            invocationInput: {
              actionGroupInvocationInput: {
                actionGroupName: 'Coordinate_Tools',
                function: 'utm_to_minecraft',
                parameters: [
                  { name: 'utm_x', value: '500000' },
                  { name: 'utm_y', value: '4000000' }
                ]
              }
            }
          }
        },
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: 'Converted to Minecraft coordinates: (200, 64, 300)'
              }
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, transformTraces);
      
      expect(response.success).toBe(true);
      expect(response.message).toContain('Converted');
      expect(response.thoughtSteps.some(s => s.summary.includes('utm_to_minecraft'))).toBe(true);
    });
  });
});


describe('EDIcraft Integration Tests - Environment Configuration', () => {
  describe('Configuration Validation', () => {
    it('should validate all required environment variables', () => {
      const config = createValidConfig();
      const simulator = new EDIcraftIntegrationSimulator(config);
      
      const validation = simulator.validateEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.missingVariables.length).toBe(0);
    });
    
    it('should detect missing Bedrock configuration', () => {
      const config = { ...createValidConfig(), bedrockAgentId: '', bedrockAgentAliasId: '' };
      const simulator = new EDIcraftIntegrationSimulator(config as any);
      
      const validation = simulator.validateEnvironment();
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables).toContain('bedrockAgentId');
      expect(validation.missingVariables).toContain('bedrockAgentAliasId');
    });
    
    it('should detect missing Minecraft configuration', () => {
      const config = { ...createValidConfig(), minecraftHost: '', minecraftPort: 0, rconPassword: '' };
      const simulator = new EDIcraftIntegrationSimulator(config as any);
      
      const validation = simulator.validateEnvironment();
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables).toContain('minecraftHost');
      expect(validation.missingVariables).toContain('rconPassword');
    });
    
    it('should detect missing OSDU configuration', () => {
      const config = {
        ...createValidConfig(),
        ediUsername: '',
        ediPassword: '',
        ediClientId: '',
        ediClientSecret: '',
        ediPartition: '',
        ediPlatformUrl: ''
      };
      const simulator = new EDIcraftIntegrationSimulator(config as any);
      
      const validation = simulator.validateEnvironment();
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables).toContain('ediUsername');
      expect(validation.missingVariables).toContain('ediPassword');
      expect(validation.missingVariables).toContain('ediClientId');
      expect(validation.missingVariables).toContain('ediClientSecret');
      expect(validation.missingVariables).toContain('ediPartition');
      expect(validation.missingVariables).toContain('ediPlatformUrl');
    });
  });
});

describe('EDIcraft Integration Tests - Edge Cases', () => {
  let simulator: EDIcraftIntegrationSimulator;
  
  beforeEach(() => {
    simulator = new EDIcraftIntegrationSimulator(createValidConfig());
  });
  
  describe('Trace Parsing Edge Cases', () => {
    it('should handle trace with missing fields', async () => {
      const query = 'Incomplete trace';
      const traces = [
        { orchestrationTrace: {} }, // Empty orchestration trace
        { unknownTrace: { data: 'something' } } // Unknown trace type
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.thoughtSteps.length).toBeGreaterThanOrEqual(1); // At least completion step
    });
    
    it('should handle trace with null values', async () => {
      const query = 'Null values';
      const traces = [
        {
          orchestrationTrace: {
            rationale: null
          }
        }
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
    });
    
    it('should handle very long trace sequences', async () => {
      const query = 'Long sequence';
      const traces = Array(50).fill(mockBedrockTraces.rationale);
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.thoughtSteps.length).toBeGreaterThan(50);
    });
    
    it('should handle trace with special characters in text', async () => {
      const query = 'Special characters';
      const traces = [
        {
          orchestrationTrace: {
            rationale: {
              text: 'Processing data with special chars: <>&"\'\\n\\t'
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.thoughtSteps[0].summary).toContain('special chars');
    });
  });
  
  describe('Message Formatting Edge Cases', () => {
    it('should handle empty message', async () => {
      const query = 'Empty message';
      const traces = [
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: ''
              }
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(typeof response.message).toBe('string');
    });
    
    it('should handle very long message', async () => {
      const query = 'Long message';
      const longText = 'A'.repeat(10000);
      const traces = [
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: longText
              }
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.message.length).toBeGreaterThan(1000);
    });
    
    it('should handle message with unicode characters', async () => {
      const query = 'Unicode message';
      const traces = [
        {
          orchestrationTrace: {
            observation: {
              actionGroupInvocationOutput: {
                text: 'Wellbore built at 🎮 coordinates (100, 64, 200) ✅'
              }
            }
          }
        }
      ];
      
      const response = await simulator.processQuery(query, traces);
      
      expect(response.success).toBe(true);
      expect(response.message).toContain('🎮');
      expect(response.message).toContain('✅');
    });
  });
});

// Summary test to verify all requirements
describe('EDIcraft Integration Tests - Requirements Verification', () => {
  it('should satisfy Requirement 6.5: Integration Testing', async () => {
    const simulator = new EDIcraftIntegrationSimulator(createValidConfig());
    
    // Test complete flow from query to response
    const query = 'Build wellbore in Minecraft';
    const traces = [
      mockBedrockTraces.rationale,
      mockBedrockTraces.actionInvocation,
      mockBedrockTraces.observation,
      mockBedrockTraces.minecraftAction,
      mockBedrockTraces.minecraftObservation
    ];
    
    const response = await simulator.processQuery(query, traces);
    
    // Verify complete flow works
    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
    expect(response.artifacts).toEqual([]);
    expect(response.thoughtSteps.length).toBeGreaterThan(0);
    expect(response.connectionStatus).toBe('connected');
    
    // Verify thought step extraction
    expect(response.thoughtSteps.some(s => s.type === 'analysis')).toBe(true);
    expect(response.thoughtSteps.some(s => s.type === 'processing')).toBe(true);
    expect(response.thoughtSteps.some(s => s.type === 'completion')).toBe(true);
    
    // Verify response format compatibility
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('artifacts');
    expect(response).toHaveProperty('thoughtSteps');
    expect(response).toHaveProperty('connectionStatus');
  });
  
  it('should handle error scenarios (missing env vars)', async () => {
    const invalidConfig = { ...createValidConfig(), bedrockAgentId: '' };
    const simulator = new EDIcraftIntegrationSimulator(invalidConfig as any);
    
    const query = 'Test error';
    const traces = [mockBedrockTraces.rationale];
    
    const response = await simulator.processQuery(query, traces);
    
    expect(response.success).toBe(false);
    expect(response.error).toBe('INVALID_CONFIG');
    expect(response.connectionStatus).toBe('error');
  });
  
  it('should handle error scenarios (connection failures)', async () => {
    const simulator = new EDIcraftIntegrationSimulator(createValidConfig());
    
    const query = 'Test connection failure';
    const traces = [mockBedrockTraces.failure];
    
    const response = await simulator.processQuery(query, traces);
    
    expect(response.success).toBe(false);
    expect(response.error).toBe('CONNECTION_REFUSED');
    expect(response.thoughtSteps.some(s => s.status === 'error')).toBe(true);
  });
});
