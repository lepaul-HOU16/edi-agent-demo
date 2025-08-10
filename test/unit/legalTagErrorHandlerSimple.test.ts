/**
 * Simple Legal Tag Error Handler Tests
 * 
 * Basic tests to verify the error handling system works correctly.
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { legalTagErrorHandler } from '../../src/utils/legalTagErrorHandler';
import { legalTagLogger } from '../../src/utils/legalTagLogger';
import { errorMessageFormatter } from '../../src/utils/errorMessageFormatter';

describe('Legal Tag Error Handling System', () => {
  let consoleStub: sinon.SinonStub;

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

  describe('Error Handler', () => {
    it('should handle network errors', () => {
      const networkError = new Error('fetch failed');
      const context = legalTagErrorHandler.createContext('getLegalTags', {
        dataPartition: 'test'
      });

      const result = legalTagErrorHandler.handleError(networkError, context);

      expect(result.errorType).to.equal('NETWORK');
      expect(result.canRetry).to.be.true;
      expect(result.operation).to.equal('getLegalTags');
      expect(result.userMessage).to.be.a('string');
      expect(result.suggestions).to.be.an('array');
      expect(result.debugInfo).to.be.an('object');
    });

    it('should handle authentication errors', () => {
      const authError = new Error('401 Unauthorized');
      const context = legalTagErrorHandler.createContext('createLegalTag');

      const result = legalTagErrorHandler.handleError(authError, context);

      expect(result.errorType).to.equal('AUTH');
      expect(result.canRetry).to.be.false;
      expect(result.operation).to.equal('createLegalTag');
    });

    it('should create proper context', () => {
      const context = legalTagErrorHandler.createContext('getLegalTags', {
        dataPartition: 'test-partition',
        endpoint: 'https://api.example.com/legal'
      });

      expect(context.operation).to.equal('getLegalTags');
      expect(context.dataPartition).to.equal('test-partition');
      expect(context.endpoint).to.equal('https://api.example.com/legal');
    });
  });

  describe('Logger', () => {
    it('should track operations', () => {
      const operationId = legalTagLogger.startOperation('getLegalTags', {
        dataPartition: 'test'
      });

      expect(operationId).to.be.a('string');
      expect(operationId).to.contain('getLegalTags');

      legalTagLogger.endOperation(operationId, { success: true });

      const metrics = legalTagLogger.getOperationMetrics('getLegalTags');
      expect(metrics).to.be.an('array');
      expect(metrics.length).to.be.greaterThan(0);
    });

    it('should log different levels', () => {
      legalTagLogger.debug('test', 'Debug message');
      legalTagLogger.info('test', 'Info message');
      legalTagLogger.warn('test', 'Warning message');
      legalTagLogger.error('test', 'Error message');

      const debugLogs = legalTagLogger.getLogsByLevel('DEBUG');
      const infoLogs = legalTagLogger.getLogsByLevel('INFO');
      const warnLogs = legalTagLogger.getLogsByLevel('WARN');
      const errorLogs = legalTagLogger.getLogsByLevel('ERROR');

      expect(debugLogs).to.be.an('array');
      expect(infoLogs).to.be.an('array');
      expect(warnLogs).to.be.an('array');
      expect(errorLogs).to.be.an('array');
    });
  });

  describe('Message Formatter', () => {
    it('should format legal tag errors', () => {
      const legalTagError = {
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

      const formatted = errorMessageFormatter.formatLegalTagError(legalTagError);

      expect(formatted.title).to.be.a('string');
      expect(formatted.message).to.be.a('string');
      expect(formatted.suggestions).to.be.an('array');
      expect(formatted.severity).to.be.oneOf(['error', 'warning', 'info']);
      expect(formatted.canRetry).to.be.a('boolean');
    });

    it('should format generic errors', () => {
      const genericError = new Error('Something went wrong');

      const formatted = errorMessageFormatter.formatGenericError(genericError, 'testOperation');

      expect(formatted.title).to.be.a('string');
      expect(formatted.message).to.be.a('string');
      expect(formatted.suggestions).to.be.an('array');
      expect(formatted.severity).to.be.oneOf(['error', 'warning', 'info']);
    });

    it('should create retry messages', () => {
      const message = errorMessageFormatter.createRetryMessage(2, 3, 5000);

      expect(message).to.be.a('string');
      expect(message).to.contain('Retrying');
    });
  });
});