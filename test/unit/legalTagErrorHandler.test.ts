/**
 * Legal Tag Error Handler Tests
 * 
 * Tests for the legal tag error handling system including error classification,
 * logging, and user message formatting.
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { legalTagErrorHandler } from '../../src/utils/legalTagErrorHandler';
import { legalTagLogger } from '../../src/utils/legalTagLogger';
import { errorMessageFormatter } from '../../src/utils/errorMessageFormatter';

// Mock console methods to avoid noise in tests
let consoleStub: sinon.SinonStub;

describe('LegalTagErrorHandler', () => {
  beforeEach(() => {
    // Stub console methods to avoid noise in tests
    consoleStub = sinon.stub(console, 'group');
    sinon.stub(console, 'groupEnd');
    sinon.stub(console, 'error');
    sinon.stub(console, 'log');
    sinon.stub(console, 'warn');
    sinon.stub(console, 'info');
    sinon.stub(console, 'debug');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('fetch failed');
      const context = legalTagErrorHandler.createContext('getLegalTags', {
        dataPartition: 'test'
      });

      const result = legalTagErrorHandler.handleError(networkError, context);

      expect(result.errorType).to.equal('NETWORK');
      expect(result.canRetry).to.be.true;
      expect(result.retryDelay).to.be.greaterThan(0);
      expect(result.userMessage).to.contain('connect');
    });

    it('should classify authentication errors correctly', () => {
      const authError = new Error('401 Unauthorized');
      const context = legalTagErrorHandler.createContext('createLegalTag');

      const result = legalTagErrorHandler.handleError(authError, context);

      expect(result.errorType).toBe('AUTH');
      expect(result.canRetry).toBe(false);
      expect(result.userMessage).toContain('authorized');
    });

    it('should classify schema errors correctly', () => {
      const schemaError = new Error("Field 'invalidField' in type 'LegalTag' is undefined");
      const context = legalTagErrorHandler.createContext('getLegalTags');

      const result = legalTagErrorHandler.handleError(schemaError, context);

      expect(result.errorType).toBe('SCHEMA');
      expect(result.canRetry).toBe(false);
      expect(result.userMessage).toContain('query structure');
    });

    it('should classify data errors correctly', () => {
      const dataError = new Error('Failed to parse JSON response');
      const context = legalTagErrorHandler.createContext('getLegalTags');

      const result = legalTagErrorHandler.handleError(dataError, context);

      expect(result.errorType).toBe('DATA');
      expect(result.canRetry).toBe(true);
      expect(result.userMessage).toContain('processing');
    });

    it('should classify service errors correctly', () => {
      const serviceError = new Error('500 Internal Server Error');
      const context = legalTagErrorHandler.createContext('updateLegalTag');

      const result = legalTagErrorHandler.handleError(serviceError, context);

      expect(result.errorType).toBe('SERVICE');
      expect(result.canRetry).toBe(true);
      expect(result.userMessage).toContain('service');
    });

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Name field is required');
      const context = legalTagErrorHandler.createContext('createLegalTag');

      const result = legalTagErrorHandler.handleError(validationError, context);

      expect(result.errorType).toBe('VALIDATION');
      expect(result.canRetry).toBe(false);
      expect(result.userMessage).toContain('valid');
    });
  });

  describe('Error Context', () => {
    it('should create proper context for operations', () => {
      const context = legalTagErrorHandler.createContext('getLegalTags', {
        dataPartition: 'test-partition',
        endpoint: 'https://api.example.com/legal',
        queryType: 'primary'
      });

      expect(context.operation).toBe('getLegalTags');
      expect(context.dataPartition).toBe('test-partition');
      expect(context.endpoint).toBe('https://api.example.com/legal');
      expect(context.queryType).toBe('primary');
    });

    it('should include context in error debug info', () => {
      const error = new Error('Test error');
      const context = legalTagErrorHandler.createContext('createLegalTag', {
        dataPartition: 'test-partition',
        legalTagId: 'test-id'
      });

      const result = legalTagErrorHandler.handleError(error, context);

      expect(result.debugInfo.service).toBe('legal-tagging');
      expect(result.operation).toBe('createLegalTag');
      expect(result.debugInfo.timestamp).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    it('should provide actionable suggestions for network errors', () => {
      const networkError = new Error('ECONNREFUSED');
      const context = legalTagErrorHandler.createContext('getLegalTags');

      const result = legalTagErrorHandler.handleError(networkError, context);

      expect(result.suggestions).toContain('Check your internet connection');
      expect(result.suggestions.length).toBeGreaterThan(1);
    });

    it('should provide specific suggestions for authentication errors', () => {
      const authError = new Error('Token expired');
      const context = legalTagErrorHandler.createContext('updateLegalTag');

      const result = legalTagErrorHandler.handleError(authError, context);

      expect(result.suggestions).toContain('Please log in again');
      expect(result.userMessage).toContain('session has expired');
    });

    it('should provide helpful suggestions for schema errors', () => {
      const schemaError = new Error("Missing field argument dataPartition @ 'getLegalTags'");
      const context = legalTagErrorHandler.createContext('getLegalTags');

      const result = legalTagErrorHandler.handleError(schemaError, context);

      expect(result.suggestions).toContain('The API schema has been updated');
      expect(result.suggestions).toContain('Please refresh the page');
    });
  });

  describe('Retry Logic', () => {
    it('should set appropriate retry delays for different error types', () => {
      const networkError = new Error('fetch failed');
      const serviceError = new Error('503 Service Unavailable');
      const context = legalTagErrorHandler.createContext('getLegalTags');

      const networkResult = legalTagErrorHandler.handleError(networkError, context);
      const serviceResult = legalTagErrorHandler.handleError(serviceError, context);

      expect(networkResult.retryDelay).toBe(5000);
      expect(serviceResult.retryDelay).toBe(30000); // Longer for maintenance
    });

    it('should not allow retry for non-retryable errors', () => {
      const authError = new Error('401 Unauthorized');
      const validationError = new Error('Invalid input format');
      const context = legalTagErrorHandler.createContext('createLegalTag');

      const authResult = legalTagErrorHandler.handleError(authError, context);
      const validationResult = legalTagErrorHandler.handleError(validationError, context);

      expect(authResult.canRetry).toBe(false);
      expect(validationResult.canRetry).toBe(false);
    });
  });
});

describe('LegalTagLogger', () => {
  beforeEach(() => {
    // Clear any existing logs
    const recentLogs = legalTagLogger.getRecentLogs(1000);
    // Note: We can't easily clear the logger state, so we'll work with existing state
  });

  describe('Operation Tracking', () => {
    it('should track operation start and end', () => {
      const operationId = legalTagLogger.startOperation('getLegalTags', {
        dataPartition: 'test'
      });

      expect(operationId).toBeDefined();
      expect(operationId).toContain('getLegalTags');

      legalTagLogger.endOperation(operationId, { success: true });

      const metrics = legalTagLogger.getOperationMetrics('getLegalTags');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should track operation failures', () => {
      const operationId = legalTagLogger.startOperation('createLegalTag');
      const error = new Error('Test error');

      legalTagLogger.endOperationWithError(operationId, error, 'VALIDATION');

      const metrics = legalTagLogger.getOperationMetrics('createLegalTag');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].errorType).toBe('VALIDATION');
    });
  });

  describe('Log Levels', () => {
    it('should log different levels correctly', () => {
      legalTagLogger.debug('test', 'Debug message');
      legalTagLogger.info('test', 'Info message');
      legalTagLogger.warn('test', 'Warning message');
      legalTagLogger.error('test', 'Error message');

      const debugLogs = legalTagLogger.getLogsByLevel('DEBUG');
      const infoLogs = legalTagLogger.getLogsByLevel('INFO');
      const warnLogs = legalTagLogger.getLogsByLevel('WARN');
      const errorLogs = legalTagLogger.getLogsByLevel('ERROR');

      expect(debugLogs.length).toBeGreaterThan(0);
      expect(infoLogs.length).toBeGreaterThan(0);
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      legalTagLogger.logPerformance('getLegalTags', {
        queryTime: 100,
        networkTime: 200,
        totalTime: 300,
        cacheHit: false
      });

      const logs = legalTagLogger.getOperationLogs('getLegalTags');
      const perfLog = logs.find(log => log.message === 'Performance metrics');
      
      expect(perfLog).toBeDefined();
      expect(perfLog?.data.totalTime).toBe('300.00ms');
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data in logs', () => {
      const sensitiveData = {
        token: 'secret-token-123',
        password: 'secret-password',
        normalField: 'normal-value'
      };

      legalTagLogger.info('test', 'Test with sensitive data', sensitiveData);

      const logs = legalTagLogger.getOperationLogs('test');
      const testLog = logs[logs.length - 1];

      expect(testLog.data.token).toBe('[REDACTED]');
      expect(testLog.data.password).toBe('[REDACTED]');
      expect(testLog.data.normalField).toBe('normal-value');
    });
  });
});

describe('ErrorMessageFormatter', () => {
  describe('Legal Tag Error Formatting', () => {
    it('should format network errors for UI display', () => {
      const networkError = {
        errorType: 'NETWORK' as const,
        operation: 'getLegalTags',
        message: 'Network connection failed',
        userMessage: 'Unable to connect to the legal tagging service',
        suggestions: ['Check your internet connection'],
        canRetry: true,
        retryDelay: 5000,
        debugInfo: {
          timestamp: new Date().toISOString(),
          service: 'legal-tagging' as const
        }
      };

      const formatted = errorMessageFormatter.formatLegalTagError(networkError);

      expect(formatted.title).toContain('Connection Problem');
      expect(formatted.severity).toBe('error');
      expect(formatted.canRetry).toBe(true);
      expect(formatted.retryDelay).toBe(5000);
    });

    it('should format authentication errors appropriately', () => {
      const authError = {
        errorType: 'AUTH' as const,
        operation: 'createLegalTag',
        message: 'Authentication failed',
        userMessage: 'You are not authorized to access legal tags',
        suggestions: ['Please log in again'],
        canRetry: false,
        debugInfo: {
          timestamp: new Date().toISOString(),
          service: 'legal-tagging' as const
        }
      };

      const formatted = errorMessageFormatter.formatLegalTagError(authError);

      expect(formatted.title).toContain('Authentication Required');
      expect(formatted.severity).toBe('warning');
      expect(formatted.canRetry).toBe(false);
    });
  });

  describe('Generic Error Formatting', () => {
    it('should format generic errors with fallback messages', () => {
      const genericError = new Error('Something went wrong');

      const formatted = errorMessageFormatter.formatGenericError(genericError, 'testOperation');

      expect(formatted.title).toContain('TestOperation Error');
      expect(formatted.message).toBeDefined();
      expect(formatted.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Retry Messages', () => {
    it('should create appropriate retry messages', () => {
      const message = errorMessageFormatter.createRetryMessage(2, 3, 5000);

      expect(message).toContain('Retrying in 5 seconds');
      expect(message).toContain('1 attempts remaining');
    });

    it('should create max attempts reached message', () => {
      const message = errorMessageFormatter.createRetryMessage(3, 3, 5000);

      expect(message).toContain('Maximum retry attempts reached');
    });
  });
});