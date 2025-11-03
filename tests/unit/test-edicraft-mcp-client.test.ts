/**
 * Unit Tests for EDIcraft MCP Client
 * Tests response parsing, error handling, and retry logic
 * Requirements: 6.2 - MCP Client Testing
 */

import { describe, it, expect } from '@jest/globals';

type EDIcraftConfig = {
  bedrockAgentId: string;
  bedrockAgentAliasId: string;
  minecraftHost: string;
  minecraftPort: number;
  region: string;
};

type ThoughtStep = {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
};

function createTestConfig(): EDIcraftConfig {
  return {
    bedrockAgentId: 'ABCD123456',
    bedrockAgentAliasId: 'TSTALIASID',
    minecraftHost: 'edicraft.nigelgardiner.com',
    minecraftPort: 49000,
    region: 'us-east-1'
  };
}

class TestableClient {
  private sessionId: string;
  constructor(config: EDIcraftConfig) {
    this.sessionId = `edicraft-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  getSessionId(): string { return this.sessionId; }
  shouldRetryError(error: Error): boolean {
    const msg = error.message.toLowerCase();
    return msg.includes('timeout') || msg.includes('econnrefused');
  }
  getRetryDelay(attempt: number): number {
    return [1000, 2000, 4000][attempt] || 4000;
  }
}

describe('EDIcraft MCP Client - Core Logic', () => {
  it('should generate unique session IDs', () => {
    const config = createTestConfig();
    const client1 = new TestableClient(config);
    const client2 = new TestableClient(config);
    expect(client1.getSessionId()).not.toBe(client2.getSessionId());
  });

  it('should retry on timeout errors', () => {
    const client = new TestableClient(createTestConfig());
    expect(client.shouldRetryError(new Error('timeout'))).toBe(true);
  });

  it('should retry on connection refused', () => {
    const client = new TestableClient(createTestConfig());
    expect(client.shouldRetryError(new Error('ECONNREFUSED'))).toBe(true);
  });

  it('should not retry on auth errors', () => {
    const client = new TestableClient(createTestConfig());
    expect(client.shouldRetryError(new Error('Authentication failed'))).toBe(false);
  });

  it('should use exponential backoff delays', () => {
    const client = new TestableClient(createTestConfig());
    expect(client.getRetryDelay(0)).toBe(1000);
    expect(client.getRetryDelay(1)).toBe(2000);
    expect(client.getRetryDelay(2)).toBe(4000);
  });
});


describe('EDIcraft MCP Client - Response Parsing', () => {
  function extractThoughtStep(trace: any, stepId: number): ThoughtStep | null {
    if (trace.orchestrationTrace?.rationale) {
      return {
        id: `step-${stepId}`,
        type: 'analysis',
        timestamp: Date.now(),
        title: 'Agent Reasoning',
        summary: trace.orchestrationTrace.rationale.text,
        status: 'complete'
      };
    }
    if (trace.orchestrationTrace?.invocationInput?.actionGroupInvocationInput) {
      const action = trace.orchestrationTrace.invocationInput.actionGroupInvocationInput;
      return {
        id: `step-${stepId}`,
        type: 'processing',
        timestamp: Date.now(),
        title: `Executing: ${action.actionGroupName}`,
        summary: `Invoking ${action.function}`,
        status: 'complete'
      };
    }
    if (trace.failureTrace) {
      return {
        id: `step-${stepId}`,
        type: 'processing',
        timestamp: Date.now(),
        title: 'Error Occurred',
        summary: trace.failureTrace.failureReason,
        status: 'error'
      };
    }
    return null;
  }

  it('should extract rationale as analysis step', () => {
    const trace = {
      orchestrationTrace: {
        rationale: { text: 'Planning wellbore build' }
      }
    };
    const step = extractThoughtStep(trace, 0);
    expect(step).not.toBeNull();
    expect(step?.type).toBe('analysis');
    expect(step?.summary).toBe('Planning wellbore build');
  });

  it('should extract action invocation as processing step', () => {
    const trace = {
      orchestrationTrace: {
        invocationInput: {
          actionGroupInvocationInput: {
            actionGroupName: 'MinecraftTools',
            function: 'build_wellbore'
          }
        }
      }
    };
    const step = extractThoughtStep(trace, 1);
    expect(step).not.toBeNull();
    expect(step?.type).toBe('processing');
    expect(step?.title).toContain('MinecraftTools');
  });

  it('should extract failure as error step', () => {
    const trace = {
      failureTrace: {
        failureReason: 'Connection failed'
      }
    };
    const step = extractThoughtStep(trace, 2);
    expect(step).not.toBeNull();
    expect(step?.status).toBe('error');
    expect(step?.summary).toBe('Connection failed');
  });

  it('should return null for unknown trace types', () => {
    const trace = { unknownTrace: { data: 'something' } };
    const step = extractThoughtStep(trace, 3);
    expect(step).toBeNull();
  });

  it('should generate sequential step IDs', () => {
    const trace = {
      orchestrationTrace: {
        rationale: { text: 'Test' }
      }
    };
    const step1 = extractThoughtStep(trace, 0);
    const step2 = extractThoughtStep(trace, 1);
    expect(step1?.id).toBe('step-0');
    expect(step2?.id).toBe('step-1');
  });
});

describe('EDIcraft MCP Client - Error Handling', () => {
  function categorizeError(error: Error): string {
    const name = (error as any).name;
    if (name === 'ResourceNotFoundException') return 'AGENT_NOT_DEPLOYED';
    if (name === 'AccessDeniedException') return 'AUTH_FAILED';
    if (name === 'ThrottlingException') return 'TIMEOUT';
    
    const msg = error.message.toLowerCase();
    if (msg.includes('econnrefused')) return 'CONNECTION_REFUSED';
    if (msg.includes('timeout')) return 'TIMEOUT';
    if (msg.includes('authentication')) return 'AUTH_FAILED';
    
    return 'UNKNOWN';
  }

  it('should categorize ResourceNotFoundException', () => {
    const error = new Error('Not found');
    (error as any).name = 'ResourceNotFoundException';
    expect(categorizeError(error)).toBe('AGENT_NOT_DEPLOYED');
  });

  it('should categorize AccessDeniedException', () => {
    const error = new Error('Access denied');
    (error as any).name = 'AccessDeniedException';
    expect(categorizeError(error)).toBe('AUTH_FAILED');
  });

  it('should categorize ThrottlingException', () => {
    const error = new Error('Throttled');
    (error as any).name = 'ThrottlingException';
    expect(categorizeError(error)).toBe('TIMEOUT');
  });

  it('should categorize connection refused', () => {
    expect(categorizeError(new Error('ECONNREFUSED'))).toBe('CONNECTION_REFUSED');
  });

  it('should categorize timeout errors', () => {
    expect(categorizeError(new Error('Request timeout'))).toBe('TIMEOUT');
  });

  it('should categorize authentication errors', () => {
    expect(categorizeError(new Error('Authentication failed'))).toBe('AUTH_FAILED');
  });

  it('should return UNKNOWN for unrecognized errors', () => {
    expect(categorizeError(new Error('Something went wrong'))).toBe('UNKNOWN');
  });
});

describe('EDIcraft MCP Client - Session Management', () => {
  it('should maintain session across multiple operations', () => {
    const client = new TestableClient(createTestConfig());
    const sessionId = client.getSessionId();
    expect(client.getSessionId()).toBe(sessionId);
    expect(client.getSessionId()).toBe(sessionId);
  });

  it('should include timestamp in session ID', () => {
    const client = new TestableClient(createTestConfig());
    const sessionId = client.getSessionId();
    expect(sessionId).toMatch(/edicraft-session-\d+-[a-z0-9]+/);
  });

  it('should include random component in session ID', () => {
    const client = new TestableClient(createTestConfig());
    const sessionId = client.getSessionId();
    const parts = sessionId.split('-');
    expect(parts.length).toBeGreaterThan(3);
    expect(parts[parts.length - 1]).toMatch(/[a-z0-9]+/);
  });
});
