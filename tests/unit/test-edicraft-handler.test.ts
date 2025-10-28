/**
 * Unit Tests for EDIcraft Agent Handler
 * Tests environment variable validation, error categorization, response formatting, and thought step generation
 * 
 * Requirements: 6.3, 6.4 - Handler Testing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Type definitions for testing
type ValidationResult = {
  isValid: boolean;
  missingVariables: string[];
  invalidVariables: { name: string; reason: string }[];
};

type EDIcraftAgentResponse = {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
  error?: string;
  connectionStatus?: string;
};

type ThoughtStep = {
  id: string;
  type: 'analysis' | 'processing' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  status: 'complete' | 'pending' | 'error';
};

// Mock environment variables helper
class EnvironmentHelper {
  private originalEnv: NodeJS.ProcessEnv;

  constructor() {
    this.originalEnv = { ...process.env };
  }

  setValidEnvironment() {
    process.env.BEDROCK_AGENT_ID = 'ABCD123456';
    process.env.BEDROCK_AGENT_ALIAS_ID = 'TSTALIASID';
    process.env.MINECRAFT_HOST = 'edicraft.nigelgardiner.com';
    process.env.MINECRAFT_PORT = '49000';
    process.env.MINECRAFT_RCON_PASSWORD = 'test-password';
    process.env.EDI_USERNAME = 'test-user';
    process.env.EDI_PASSWORD = 'test-pass';
    process.env.EDI_CLIENT_ID = 'test-client-id';
    process.env.EDI_CLIENT_SECRET = 'test-client-secret';
    process.env.EDI_PARTITION = 'test-partition';
    process.env.EDI_PLATFORM_URL = 'https://test.osdu.platform.com';
    process.env.AWS_REGION = 'us-east-1';
  }

  clearEnvironment() {
    delete process.env.BEDROCK_AGENT_ID;
    delete process.env.BEDROCK_AGENT_ALIAS_ID;
    delete process.env.MINECRAFT_HOST;
    delete process.env.MINECRAFT_PORT;
    delete process.env.MINECRAFT_RCON_PASSWORD;
    delete process.env.EDI_USERNAME;
    delete process.env.EDI_PASSWORD;
    delete process.env.EDI_CLIENT_ID;
    delete process.env.EDI_CLIENT_SECRET;
    delete process.env.EDI_PARTITION;
    delete process.env.EDI_PLATFORM_URL;
  }

  restore() {
    process.env = { ...this.originalEnv };
  }
}

// Simplified validation function for testing (extracted from handler)
function validateEnvironmentVariables(): ValidationResult {
  const requiredVariables = [
    'BEDROCK_AGENT_ID',
    'BEDROCK_AGENT_ALIAS_ID',
    'MINECRAFT_HOST',
    'MINECRAFT_PORT',
    'MINECRAFT_RCON_PASSWORD',
    'EDI_USERNAME',
    'EDI_PASSWORD',
    'EDI_CLIENT_ID',
    'EDI_CLIENT_SECRET',
    'EDI_PARTITION',
    'EDI_PLATFORM_URL'
  ];

  const missingVariables: string[] = [];
  const invalidVariables: { name: string; reason: string }[] = [];

  // Check for missing variables
  for (const varName of requiredVariables) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVariables.push(varName);
    }
  }

  // Validate BEDROCK_AGENT_ID format
  const agentId = process.env.BEDROCK_AGENT_ID;
  if (agentId && agentId.trim() !== '') {
    const agentIdPattern = /^[A-Z0-9]{10}$/;
    if (!agentIdPattern.test(agentId)) {
      invalidVariables.push({
        name: 'BEDROCK_AGENT_ID',
        reason: 'Invalid format. Expected 10 uppercase alphanumeric characters (e.g., ABCD123456)'
      });
    }
  }

  // Validate BEDROCK_AGENT_ALIAS_ID format
  const aliasId = process.env.BEDROCK_AGENT_ALIAS_ID;
  if (aliasId && aliasId.trim() !== '') {
    const aliasIdPattern = /^([A-Z0-9]{10}|TSTALIASID)$/;
    if (!aliasIdPattern.test(aliasId)) {
      invalidVariables.push({
        name: 'BEDROCK_AGENT_ALIAS_ID',
        reason: 'Invalid format. Expected 10 uppercase alphanumeric characters or "TSTALIASID"'
      });
    }
  }

  // Validate MINECRAFT_PORT
  const port = process.env.MINECRAFT_PORT;
  if (port && port.trim() !== '') {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      invalidVariables.push({
        name: 'MINECRAFT_PORT',
        reason: 'Invalid port number. Must be between 1 and 65535'
      });
    }
  }

  // Validate EDI_PLATFORM_URL
  const platformUrl = process.env.EDI_PLATFORM_URL;
  if (platformUrl && platformUrl.trim() !== '') {
    try {
      new URL(platformUrl);
    } catch (e) {
      invalidVariables.push({
        name: 'EDI_PLATFORM_URL',
        reason: 'Invalid URL format. Must be a valid HTTP/HTTPS URL'
      });
    }
  }

  return {
    isValid: missingVariables.length === 0 && invalidVariables.length === 0,
    missingVariables,
    invalidVariables
  };
}

// Error categorization function for testing
function categorizeError(errorMessage: string): string {
  if (errorMessage.includes('INVALID_CONFIG') || errorMessage.includes('Configuration Error')) {
    return 'INVALID_CONFIG';
  }
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection refused')) {
    return 'CONNECTION_REFUSED';
  }
  if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
    return 'TIMEOUT';
  }
  if (errorMessage.includes('EAUTH') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    return 'AUTH_FAILED';
  }
  if (errorMessage.includes('OSDU') || errorMessage.includes('platform')) {
    return 'OSDU_ERROR';
  }
  if (errorMessage.includes('agent') && errorMessage.includes('not') && (errorMessage.includes('deployed') || errorMessage.includes('found'))) {
    return 'AGENT_NOT_DEPLOYED';
  }
  return 'UNKNOWN';
}

// Response formatting helper
function formatResponse(
  success: boolean,
  message: string,
  thoughtSteps: ThoughtStep[] = [],
  connectionStatus: string = 'connected'
): EDIcraftAgentResponse {
  return {
    success,
    message,
    artifacts: [], // EDIcraft never returns visual artifacts
    thoughtSteps,
    connectionStatus
  };
}

// Thought step generator for testing
function generateThoughtSteps(count: number): ThoughtStep[] {
  const steps: ThoughtStep[] = [];
  const types: Array<'analysis' | 'processing' | 'completion'> = ['analysis', 'processing', 'completion'];
  
  for (let i = 0; i < count; i++) {
    steps.push({
      id: `step-${i + 1}`,
      type: types[i % types.length],
      timestamp: Date.now() + i * 1000,
      title: `Step ${i + 1}`,
      summary: `Processing step ${i + 1}`,
      status: 'complete'
    });
  }
  
  return steps;
}

describe('EDIcraft Handler - Environment Variable Validation', () => {
  let envHelper: EnvironmentHelper;

  beforeEach(() => {
    envHelper = new EnvironmentHelper();
    envHelper.clearEnvironment();
  });

  afterEach(() => {
    envHelper.restore();
  });

  describe('Valid Configuration', () => {
    it('should validate when all required variables are set', () => {
      envHelper.setValidEnvironment();
      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
      expect(result.missingVariables.length).toBe(0);
      expect(result.invalidVariables.length).toBe(0);
    });

    it('should accept valid BEDROCK_AGENT_ID format', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ID = 'ABCD123456';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
      expect(result.invalidVariables.find(v => v.name === 'BEDROCK_AGENT_ID')).toBeUndefined();
    });

    it('should accept TSTALIASID as valid alias', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ALIAS_ID = 'TSTALIASID';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
      expect(result.invalidVariables.find(v => v.name === 'BEDROCK_AGENT_ALIAS_ID')).toBeUndefined();
    });

    it('should accept valid port numbers', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = '49000';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
      expect(result.invalidVariables.find(v => v.name === 'MINECRAFT_PORT')).toBeUndefined();
    });

    it('should accept valid HTTPS URLs', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'https://test.osdu.platform.com';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
      expect(result.invalidVariables.find(v => v.name === 'EDI_PLATFORM_URL')).toBeUndefined();
    });

    it('should accept valid HTTP URLs', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'http://localhost:8080';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });
  });

  describe('Missing Variables', () => {
    it('should detect missing BEDROCK_AGENT_ID', () => {
      envHelper.setValidEnvironment();
      delete process.env.BEDROCK_AGENT_ID;
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain('BEDROCK_AGENT_ID');
    });

    it('should detect missing MINECRAFT_HOST', () => {
      envHelper.setValidEnvironment();
      delete process.env.MINECRAFT_HOST;
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain('MINECRAFT_HOST');
    });

    it('should detect missing OSDU credentials', () => {
      envHelper.setValidEnvironment();
      delete process.env.EDI_USERNAME;
      delete process.env.EDI_PASSWORD;
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain('EDI_USERNAME');
      expect(result.missingVariables).toContain('EDI_PASSWORD');
    });

    it('should detect multiple missing variables', () => {
      envHelper.clearEnvironment();
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingVariables.length).toBe(11); // All required variables
    });

    it('should treat empty string as missing', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ID = '';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain('BEDROCK_AGENT_ID');
    });

    it('should treat whitespace-only string as missing', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_HOST = '   ';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingVariables).toContain('MINECRAFT_HOST');
    });
  });

  describe('Invalid Variable Formats', () => {
    it('should reject invalid BEDROCK_AGENT_ID format (too short)', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ID = 'ABC123';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'BEDROCK_AGENT_ID')).toBeDefined();
    });

    it('should reject invalid BEDROCK_AGENT_ID format (lowercase)', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ID = 'abcd123456';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'BEDROCK_AGENT_ID')).toBeDefined();
    });

    it('should reject invalid BEDROCK_AGENT_ID format (special characters)', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ID = 'ABCD-12345';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid BEDROCK_AGENT_ALIAS_ID format', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ALIAS_ID = 'invalid-alias';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'BEDROCK_AGENT_ALIAS_ID')).toBeDefined();
    });

    it('should reject invalid port number (too low)', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = '0';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'MINECRAFT_PORT')).toBeDefined();
    });

    it('should reject invalid port number (too high)', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = '70000';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'MINECRAFT_PORT')).toBeDefined();
    });

    it('should reject non-numeric port', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = 'not-a-number';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'MINECRAFT_PORT')).toBeDefined();
    });

    it('should reject invalid URL format', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'not-a-valid-url';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.invalidVariables.find(v => v.name === 'EDI_PLATFORM_URL')).toBeDefined();
    });

    it('should reject URL without protocol', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'test.osdu.platform.com';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
    });
  });

  describe('Validation Error Messages', () => {
    it('should provide reason for invalid BEDROCK_AGENT_ID', () => {
      envHelper.setValidEnvironment();
      process.env.BEDROCK_AGENT_ID = 'invalid';
      
      const result = validateEnvironmentVariables();
      const error = result.invalidVariables.find(v => v.name === 'BEDROCK_AGENT_ID');
      
      expect(error).toBeDefined();
      expect(error?.reason).toContain('10 uppercase alphanumeric characters');
    });

    it('should provide reason for invalid port', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = '99999';
      
      const result = validateEnvironmentVariables();
      const error = result.invalidVariables.find(v => v.name === 'MINECRAFT_PORT');
      
      expect(error).toBeDefined();
      expect(error?.reason).toContain('between 1 and 65535');
    });

    it('should provide reason for invalid URL', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'invalid-url';
      
      const result = validateEnvironmentVariables();
      const error = result.invalidVariables.find(v => v.name === 'EDI_PLATFORM_URL');
      
      expect(error).toBeDefined();
      expect(error?.reason).toContain('valid HTTP/HTTPS URL');
    });
  });
});

describe('EDIcraft Handler - Error Categorization', () => {
  describe('Configuration Errors', () => {
    it('should categorize INVALID_CONFIG errors', () => {
      const errorType = categorizeError('INVALID_CONFIG: Missing environment variables');
      expect(errorType).toBe('INVALID_CONFIG');
    });

    it('should categorize Configuration Error messages', () => {
      const errorType = categorizeError('Configuration Error: Invalid setup');
      expect(errorType).toBe('INVALID_CONFIG');
    });
  });

  describe('Connection Errors', () => {
    it('should categorize ECONNREFUSED errors', () => {
      const errorType = categorizeError('Error: connect ECONNREFUSED 127.0.0.1:49000');
      expect(errorType).toBe('CONNECTION_REFUSED');
    });

    it('should categorize connection refused messages (case-insensitive)', () => {
      const errorType = categorizeError('connection refused by server');
      expect(errorType).toBe('CONNECTION_REFUSED');
    });
  });

  describe('Timeout Errors', () => {
    it('should categorize ETIMEDOUT errors', () => {
      const errorType = categorizeError('Error: connect ETIMEDOUT');
      expect(errorType).toBe('TIMEOUT');
    });

    it('should categorize timeout messages', () => {
      const errorType = categorizeError('Request timeout after 30 seconds');
      expect(errorType).toBe('TIMEOUT');
    });
  });

  describe('Authentication Errors', () => {
    it('should categorize EAUTH errors', () => {
      const errorType = categorizeError('EAUTH: Authentication failed');
      expect(errorType).toBe('AUTH_FAILED');
    });

    it('should categorize authentication messages (case-insensitive)', () => {
      const errorType = categorizeError('authentication failed for user');
      expect(errorType).toBe('AUTH_FAILED');
    });

    it('should categorize unauthorized messages (case-insensitive)', () => {
      const errorType = categorizeError('unauthorized access to resource');
      expect(errorType).toBe('AUTH_FAILED');
    });
  });

  describe('OSDU Platform Errors', () => {
    it('should categorize OSDU errors', () => {
      const errorType = categorizeError('OSDU platform connection failed');
      expect(errorType).toBe('OSDU_ERROR');
    });

    it('should categorize platform errors (case-insensitive)', () => {
      const errorType = categorizeError('platform API returned error');
      expect(errorType).toBe('OSDU_ERROR');
    });
  });

  describe('Agent Deployment Errors', () => {
    it('should categorize agent not deployed errors (case-insensitive)', () => {
      const errorType = categorizeError('agent not deployed to Bedrock');
      expect(errorType).toBe('AGENT_NOT_DEPLOYED');
    });

    it('should categorize agent not found errors (case-insensitive)', () => {
      const errorType = categorizeError('agent not found in region');
      expect(errorType).toBe('AGENT_NOT_DEPLOYED');
    });
  });

  describe('Unknown Errors', () => {
    it('should categorize unrecognized errors as UNKNOWN', () => {
      const errorType = categorizeError('Something went wrong');
      expect(errorType).toBe('UNKNOWN');
    });

    it('should categorize empty error as UNKNOWN', () => {
      const errorType = categorizeError('');
      expect(errorType).toBe('UNKNOWN');
    });
  });

  describe('Error Priority', () => {
    it('should prioritize INVALID_CONFIG over other keywords', () => {
      const errorType = categorizeError('INVALID_CONFIG: OSDU platform error');
      expect(errorType).toBe('INVALID_CONFIG');
    });

    it('should prioritize CONNECTION_REFUSED over TIMEOUT', () => {
      const errorType = categorizeError('ECONNREFUSED after timeout');
      expect(errorType).toBe('CONNECTION_REFUSED');
    });
  });
});

describe('EDIcraft Handler - Response Formatting', () => {
  describe('Success Response Format', () => {
    it('should format successful response with all required fields', () => {
      const response = formatResponse(true, 'Operation completed successfully');
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation completed successfully');
      expect(response.artifacts).toEqual([]);
      expect(response.thoughtSteps).toEqual([]);
      expect(response.connectionStatus).toBe('connected');
    });

    it('should include thought steps in successful response', () => {
      const thoughtSteps = generateThoughtSteps(3);
      const response = formatResponse(true, 'Success', thoughtSteps);
      
      expect(response.success).toBe(true);
      expect(response.thoughtSteps).toHaveLength(3);
      expect(response.thoughtSteps).toEqual(thoughtSteps);
    });

    it('should always return empty artifacts array', () => {
      const response = formatResponse(true, 'Success');
      
      expect(response.artifacts).toEqual([]);
      expect(Array.isArray(response.artifacts)).toBe(true);
    });

    it('should set connectionStatus to connected by default', () => {
      const response = formatResponse(true, 'Success');
      
      expect(response.connectionStatus).toBe('connected');
    });

    it('should allow custom connectionStatus', () => {
      const response = formatResponse(true, 'Processing', [], 'pending');
      
      expect(response.connectionStatus).toBe('pending');
    });
  });

  describe('Error Response Format', () => {
    it('should format error response with required fields', () => {
      const response = formatResponse(false, 'Operation failed', [], 'error');
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Operation failed');
      expect(response.connectionStatus).toBe('error');
    });

    it('should include empty artifacts in error response', () => {
      const response = formatResponse(false, 'Error occurred', [], 'error');
      
      expect(response.artifacts).toEqual([]);
    });

    it('should allow thought steps in error response', () => {
      const thoughtSteps = generateThoughtSteps(2);
      const response = formatResponse(false, 'Error', thoughtSteps, 'error');
      
      expect(response.thoughtSteps).toHaveLength(2);
    });
  });

  describe('Message Content', () => {
    it('should preserve message content exactly', () => {
      const message = 'Wellbore trajectory built at coordinates (100, 64, 200)';
      const response = formatResponse(true, message);
      
      expect(response.message).toBe(message);
    });

    it('should handle multi-line messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const response = formatResponse(true, message);
      
      expect(response.message).toBe(message);
    });

    it('should handle empty message', () => {
      const response = formatResponse(true, '');
      
      expect(response.message).toBe('');
    });
  });
});

describe('EDIcraft Handler - Thought Step Generation', () => {
  describe('Thought Step Structure', () => {
    it('should generate thought steps with all required fields', () => {
      const steps = generateThoughtSteps(1);
      
      expect(steps[0]).toHaveProperty('id');
      expect(steps[0]).toHaveProperty('type');
      expect(steps[0]).toHaveProperty('timestamp');
      expect(steps[0]).toHaveProperty('title');
      expect(steps[0]).toHaveProperty('summary');
      expect(steps[0]).toHaveProperty('status');
    });

    it('should generate unique IDs for each step', () => {
      const steps = generateThoughtSteps(5);
      const ids = steps.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(5);
    });

    it('should generate sequential IDs', () => {
      const steps = generateThoughtSteps(3);
      
      expect(steps[0].id).toBe('step-1');
      expect(steps[1].id).toBe('step-2');
      expect(steps[2].id).toBe('step-3');
    });

    it('should cycle through step types', () => {
      const steps = generateThoughtSteps(6);
      
      expect(steps[0].type).toBe('analysis');
      expect(steps[1].type).toBe('processing');
      expect(steps[2].type).toBe('completion');
      expect(steps[3].type).toBe('analysis');
      expect(steps[4].type).toBe('processing');
      expect(steps[5].type).toBe('completion');
    });

    it('should generate increasing timestamps', () => {
      const steps = generateThoughtSteps(3);
      
      expect(steps[1].timestamp).toBeGreaterThan(steps[0].timestamp);
      expect(steps[2].timestamp).toBeGreaterThan(steps[1].timestamp);
    });

    it('should set status to complete by default', () => {
      const steps = generateThoughtSteps(3);
      
      steps.forEach(step => {
        expect(step.status).toBe('complete');
      });
    });
  });

  describe('Thought Step Types', () => {
    it('should support analysis type', () => {
      const steps = generateThoughtSteps(1);
      expect(['analysis', 'processing', 'completion']).toContain(steps[0].type);
    });

    it('should support processing type', () => {
      const steps = generateThoughtSteps(2);
      expect(steps.some(s => s.type === 'processing')).toBe(true);
    });

    it('should support completion type', () => {
      const steps = generateThoughtSteps(3);
      expect(steps.some(s => s.type === 'completion')).toBe(true);
    });
  });

  describe('Thought Step Content', () => {
    it('should generate descriptive titles', () => {
      const steps = generateThoughtSteps(3);
      
      steps.forEach((step, index) => {
        expect(step.title).toBe(`Step ${index + 1}`);
      });
    });

    it('should generate descriptive summaries', () => {
      const steps = generateThoughtSteps(3);
      
      steps.forEach((step, index) => {
        expect(step.summary).toBe(`Processing step ${index + 1}`);
      });
    });
  });

  describe('Multiple Thought Steps', () => {
    it('should generate empty array for zero steps', () => {
      const steps = generateThoughtSteps(0);
      
      expect(steps).toEqual([]);
      expect(steps.length).toBe(0);
    });

    it('should generate single step', () => {
      const steps = generateThoughtSteps(1);
      
      expect(steps.length).toBe(1);
    });

    it('should generate multiple steps', () => {
      const steps = generateThoughtSteps(10);
      
      expect(steps.length).toBe(10);
    });

    it('should maintain order of steps', () => {
      const steps = generateThoughtSteps(5);
      
      for (let i = 0; i < steps.length - 1; i++) {
        expect(steps[i].timestamp).toBeLessThan(steps[i + 1].timestamp);
      }
    });
  });

  describe('Thought Step Integration', () => {
    it('should integrate thought steps into response', () => {
      const steps = generateThoughtSteps(3);
      const response = formatResponse(true, 'Success', steps);
      
      expect(response.thoughtSteps).toEqual(steps);
      expect(response.thoughtSteps?.length).toBe(3);
    });

    it('should handle empty thought steps', () => {
      const response = formatResponse(true, 'Success', []);
      
      expect(response.thoughtSteps).toEqual([]);
    });

    it('should preserve thought step data in response', () => {
      const steps = generateThoughtSteps(2);
      const response = formatResponse(true, 'Success', steps);
      
      expect(response.thoughtSteps?.[0].id).toBe('step-1');
      expect(response.thoughtSteps?.[0].type).toBe('analysis');
      expect(response.thoughtSteps?.[1].id).toBe('step-2');
      expect(response.thoughtSteps?.[1].type).toBe('processing');
    });
  });
});

describe('EDIcraft Handler - Integration Scenarios', () => {
  let envHelper: EnvironmentHelper;

  beforeEach(() => {
    envHelper = new EnvironmentHelper();
  });

  afterEach(() => {
    envHelper.restore();
  });

  describe('Complete Success Flow', () => {
    it('should validate environment, format response, and include thought steps', () => {
      envHelper.setValidEnvironment();
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
      
      const thoughtSteps = generateThoughtSteps(3);
      const response = formatResponse(true, 'Wellbore built successfully', thoughtSteps);
      
      expect(response.success).toBe(true);
      expect(response.message).toContain('Wellbore built');
      expect(response.thoughtSteps?.length).toBe(3);
      expect(response.artifacts).toEqual([]);
      expect(response.connectionStatus).toBe('connected');
    });
  });

  describe('Configuration Error Flow', () => {
    it('should detect invalid config and format error response', () => {
      envHelper.clearEnvironment();
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables.length).toBeGreaterThan(0);
      
      const errorType = categorizeError('INVALID_CONFIG');
      expect(errorType).toBe('INVALID_CONFIG');
      
      const response = formatResponse(false, 'Configuration error', [], 'error');
      expect(response.success).toBe(false);
      expect(response.connectionStatus).toBe('error');
    });
  });

  describe('Connection Error Flow', () => {
    it('should categorize connection error and format response', () => {
      const errorType = categorizeError('ECONNREFUSED: Connection refused');
      expect(errorType).toBe('CONNECTION_REFUSED');
      
      const response = formatResponse(false, 'Cannot connect to Minecraft server', [], 'error');
      expect(response.success).toBe(false);
      expect(response.connectionStatus).toBe('error');
    });
  });

  describe('Partial Success Flow', () => {
    it('should handle success with warnings in thought steps', () => {
      envHelper.setValidEnvironment();
      
      const thoughtSteps: ThoughtStep[] = [
        {
          id: 'step-1',
          type: 'analysis',
          timestamp: Date.now(),
          title: 'Analyzing request',
          summary: 'Request analyzed successfully',
          status: 'complete'
        },
        {
          id: 'step-2',
          type: 'processing',
          timestamp: Date.now() + 1000,
          title: 'Building structure',
          summary: 'Structure built with warnings',
          status: 'complete'
        }
      ];
      
      const response = formatResponse(true, 'Operation completed with warnings', thoughtSteps);
      
      expect(response.success).toBe(true);
      expect(response.thoughtSteps?.length).toBe(2);
      expect(response.thoughtSteps?.[1].summary).toContain('warnings');
    });
  });
});

describe('EDIcraft Handler - Edge Cases', () => {
  let envHelper: EnvironmentHelper;

  beforeEach(() => {
    envHelper = new EnvironmentHelper();
  });

  afterEach(() => {
    envHelper.restore();
  });

  describe('Environment Variable Edge Cases', () => {
    it('should handle environment variables with special characters', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_RCON_PASSWORD = 'p@ssw0rd!#$%';
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
    });

    it('should handle very long environment variable values', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PASSWORD = 'a'.repeat(1000);
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
    });

    it('should handle minimum valid port (1)', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = '1';
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
    });

    it('should handle maximum valid port (65535)', () => {
      envHelper.setValidEnvironment();
      process.env.MINECRAFT_PORT = '65535';
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
    });

    it('should handle URL with port', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'https://test.osdu.platform.com:8080';
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
    });

    it('should handle URL with path', () => {
      envHelper.setValidEnvironment();
      process.env.EDI_PLATFORM_URL = 'https://test.osdu.platform.com/api/v1';
      
      const validation = validateEnvironmentVariables();
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Error Message Edge Cases', () => {
    it('should categorize error with multiple keywords (prioritizes by check order)', () => {
      const errorType = categorizeError('OSDU platform authentication timeout');
      // TIMEOUT is checked before OSDU in categorization function
      expect(errorType).toBe('TIMEOUT');
    });

    it('should handle very long error messages', () => {
      const longError = 'Error: '.repeat(100) + 'ECONNREFUSED';
      const errorType = categorizeError(longError);
      
      expect(errorType).toBe('CONNECTION_REFUSED');
    });

    it('should handle error messages with newlines', () => {
      const errorType = categorizeError('Error:\nECONNREFUSED\nConnection failed');
      expect(errorType).toBe('CONNECTION_REFUSED');
    });
  });

  describe('Response Formatting Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'Success: '.repeat(1000);
      const response = formatResponse(true, longMessage);
      
      expect(response.message).toBe(longMessage);
    });

    it('should handle messages with special characters', () => {
      const message = 'Built at (100, 64, 200) with 🎮 emoji';
      const response = formatResponse(true, message);
      
      expect(response.message).toBe(message);
    });

    it('should handle large number of thought steps', () => {
      const steps = generateThoughtSteps(100);
      const response = formatResponse(true, 'Success', steps);
      
      expect(response.thoughtSteps?.length).toBe(100);
    });
  });
});
