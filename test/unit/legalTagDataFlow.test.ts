/**
 * Legal Tag Data Flow Unit Tests
 * 
 * Comprehensive unit tests for legal tag data flow including response parsing,
 * error handling logic, and data transformation.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { 
  normalizeLegalTagResponse,
  isEmptyResponse,
  isErrorResponse,
  createErrorResponse,
  validateLegalTagProperties
} from '../../src/utils/responseNormalizer';
import { legalTagErrorHandler } from '../../src/utils/legalTagErrorHandler';
import { legalTagLogger } from '../../src/utils/legalTagLogger';

// Mock console methods to avoid noise in tests
let consoleStub: sinon.SinonStub;

describe('Legal Tag Data Flow Unit Tests', () => {
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

  describe('Response Parsing Logic', () => {
    describe('listLegalTags Response Format', () => {
      it('should parse valid listLegalTags response correctly', () => {
        const response = {
          listLegalTags: {
            items: [
              {
                id: 'legal-tag-1',
                name: 'test-legal-tag',
                description: 'Test legal tag for unit testing',
                properties: {
                  countryOfOrigin: ['US'],
                  contractId: 'TEST-CONTRACT-001',
                  originator: 'OSDU',
                  expirationDate: '2025-12-31T23:59:59.999Z'
                },
                status: 'ACTIVE',
                createdBy: 'test-user@example.com',
                createdAt: '2024-01-01T00:00:00.000Z'
              }
            ],
            pagination: {
              nextToken: 'next-token-123',
              hasNextPage: true,
              totalCount: 10
            }
          }
        };

        const result = normalizeLegalTagResponse(response, {
          source: 'listLegalTags',
          queryType: 'primary',
          validateProperties: true
        });

        expect(result.isError).to.be.false;
        expect(result.isEmpty).to.be.false;
        expect(result.data.items).to.have.length(1);
        
        const item = result.data.items[0];
        expect(item.id).to.equal('legal-tag-1');
        expect(item.name).to.equal('test-legal-tag');
        expect(item.properties.countryOfOrigin).to.deep.equal(['US']);
        expect(item.properties.contractId).to.equal('TEST-CONTRACT-001');
        
        expect(result.data.pagination.nextToken).to.equal('next-token-123');
        expect(result.data.pagination.hasNextPage).to.be.true;
        expect(result.data.pagination.totalCount).to.equal(10);
      });

      it('should handle empty listLegalTags response', () => {
        const response = {
          listLegalTags: {
            items: [],
            pagination: {
              nextToken: null,
              hasNextPage: false,
              totalCount: 0
            }
          }
        };

        const result = normalizeLegalTagResponse(response, {
          source: 'listLegalTags',
          queryType: 'primary',
          allowEmptyResponse: true
        });

        expect(result.isError).to.be.false;
        expect(result.isEmpty).to.be.true;
        expect(result.data.items).to.have.length(0);
        expect(result.data.pagination.totalCount).to.equal(0);
      });

      it('should handle malformed listLegalTags response', () => {
        const response = {
          listLegalTags: null
        };

        const result = normalizeLegalTagResponse(response, {
          source: 'listLegalTags',
          queryType: 'primary',
          allowEmptyResponse: false
        });

        expect(result.isError).to.be.true;
        expect(result.errorType).to.equal('DATA');
        expect(result.errorMessage).to.include('null or undefined');
      });
    });

    describe('getLegalTags Response Format', () => {
      it('should parse valid getLegalTags array response correctly', () => {
        const response = {
          getLegalTags: [
            {
              id: 'legal-tag-2',
              name: 'array-legal-tag',
              description: 'Legal tag from array response',
              properties: '{"countryOfOrigin":["CA"],"contractId":"ARRAY-CONTRACT-001","originator":"OSDU"}',
              status: 'ACTIVE'
            }
          ]
        };

        const result = normalizeLegalTagResponse(response, {
          source: 'getLegalTags',
          queryType: 'fallback',
          parseJsonProperties: true
        });

        expect(result.isError).to.be.false;
        expect(result.isEmpty).to.be.false;
        expect(result.data.items).to.have.length(1);
        
        const item = result.data.items[0];
        expect(item.id).to.equal('legal-tag-2');
        expect(item.properties.countryOfOrigin).to.deep.equal(['CA']);
        expect(item.properties.contractId).to.equal('ARRAY-CONTRACT-001');
      });

      it('should handle direct array response format', () => {
        const response = [
          {
            id: 'legal-tag-3',
            name: 'direct-array-tag',
            description: 'Direct array format',
            properties: {
              countryOfOrigin: ['UK'],
              contractId: 'DIRECT-001',
              originator: 'OSDU'
            }
          }
        ];

        const result = normalizeLegalTagResponse(response, {
          source: 'direct',
          queryType: 'unknown'
        });

        expect(result.isError).to.be.false;
        expect(result.isEmpty).to.be.false;
        expect(result.data.items).to.have.length(1);
        expect(result.data.items[0].properties.countryOfOrigin).to.deep.equal(['UK']);
      });

      it('should handle malformed JSON properties gracefully', () => {
        const response = {
          getLegalTags: [
            {
              id: 'legal-tag-4',
              name: 'malformed-properties-tag',
              description: 'Tag with malformed JSON properties',
              properties: '{"invalid": json, "missing": quote}'
            }
          ]
        };

        const result = normalizeLegalTagResponse(response, {
          source: 'getLegalTags',
          parseJsonProperties: true
        });

        expect(result.isError).to.be.false;
        expect(result.data.items).to.have.length(1);
        expect(result.data.items[0].properties.rawValue).to.equal('{"invalid": json, "missing": quote}');
      });
    });

    describe('Single Object Response Format', () => {
      it('should handle single legal tag object response', () => {
        const response = {
          id: 'legal-tag-5',
          name: 'single-object-tag',
          description: 'Single object response',
          properties: {
            countryOfOrigin: ['FR'],
            contractId: 'SINGLE-001',
            originator: 'OSDU'
          }
        };

        const result = normalizeLegalTagResponse(response);

        expect(result.isError).to.be.false;
        expect(result.isEmpty).to.be.false;
        expect(result.data.items).to.have.length(1);
        expect(result.data.items[0].id).to.equal('legal-tag-5');
      });
    });

    describe('Error Response Handling', () => {
      it('should detect GraphQL errors in response', () => {
        const response = {
          data: null,
          errors: [
            {
              message: 'Field "invalidField" is not defined by type "LegalTag"',
              locations: [{ line: 2, column: 3 }],
              extensions: { code: 'GRAPHQL_VALIDATION_FAILED' }
            }
          ]
        };

        const errorResult = isErrorResponse(response);

        expect(errorResult.isError).to.be.true;
        expect(errorResult.errorType).to.equal('VALIDATION');
        expect(errorResult.errorMessage).to.include('Field "invalidField"');
      });

      it('should detect HTTP error responses', () => {
        const response = {
          status: 401,
          statusText: 'Unauthorized',
          message: 'Authentication failed'
        };

        const errorResult = isErrorResponse(response);

        expect(errorResult.isError).to.be.true;
        expect(errorResult.errorType).to.equal('AUTHENTICATION');
        expect(errorResult.errorMessage).to.include('HTTP 401');
      });

      it('should detect server error responses', () => {
        const response = {
          status: 500,
          statusText: 'Internal Server Error'
        };

        const errorResult = isErrorResponse(response);

        expect(errorResult.isError).to.be.true;
        expect(errorResult.errorType).to.equal('SERVER');
        expect(errorResult.errorMessage).to.include('HTTP 500');
      });
    });

    describe('Data Validation Logic', () => {
      it('should validate legal tag properties correctly', () => {
        const validProperties = {
          countryOfOrigin: ['US', 'CA'],
          contractId: 'VALID-CONTRACT-001',
          originator: 'OSDU',
          expirationDate: '2025-12-31T23:59:59.999Z',
          dataType: 'Public Domain Data',
          securityClassification: 'Public',
          personalData: 'No Personal Data',
          exportClassification: 'EAR99'
        };

        const result = validateLegalTagProperties(validProperties);

        expect(result.isValid).to.be.true;
        expect(result.errors).to.have.length(0);
      });

      it('should detect missing required properties', () => {
        const invalidProperties = {
          countryOfOrigin: ['US']
          // Missing contractId and originator
        };

        const result = validateLegalTagProperties(invalidProperties);

        expect(result.isValid).to.be.false;
        expect(result.errors).to.include('Missing required property: contractId');
        expect(result.errors).to.include('Missing required property: originator');
      });

      it('should validate property types', () => {
        const invalidProperties = {
          countryOfOrigin: 'US', // Should be array
          contractId: 123, // Should be string
          originator: 'OSDU',
          expirationDate: 'invalid-date-format'
        };

        const result = validateLegalTagProperties(invalidProperties);

        expect(result.isValid).to.be.false;
        expect(result.errors).to.include('countryOfOrigin must be an array');
        expect(result.errors).to.include('contractId must be a string');
        expect(result.errors).to.include('expirationDate must be a valid ISO date string');
      });

      it('should handle null/undefined properties', () => {
        const result1 = validateLegalTagProperties(null);
        const result2 = validateLegalTagProperties(undefined);

        expect(result1.isValid).to.be.false;
        expect(result2.isValid).to.be.false;
        expect(result1.errors).to.include('Properties must be an object');
        expect(result2.errors).to.include('Properties must be an object');
      });
    });

    describe('Empty Response Detection', () => {
      it('should detect various empty response formats', () => {
        const emptyResponses = [
          null,
          undefined,
          [],
          { items: [] },
          { getLegalTags: [] },
          { listLegalTags: { items: [] } },
          { getLegalTags: { items: [] } }
        ];

        emptyResponses.forEach((response, index) => {
          const isEmpty = isEmptyResponse(response);
          expect(isEmpty).to.be.true;
        });
      });

      it('should not detect non-empty responses as empty', () => {
        const nonEmptyResponses = [
          [{ id: '1' }],
          { items: [{ id: '1' }] },
          { getLegalTags: [{ id: '1' }] },
          { listLegalTags: { items: [{ id: '1' }] } },
          { id: '1', name: 'test' }
        ];

        nonEmptyResponses.forEach((response, index) => {
          const isEmpty = isEmptyResponse(response);
          expect(isEmpty).to.be.false;
        });
      });
    });
  });

  describe('Error Handling Logic', () => {
    describe('Error Classification', () => {
      it('should classify network errors correctly', () => {
        const networkErrors = [
          new Error('fetch failed'),
          new Error('ECONNREFUSED'),
          new Error('Network request failed'),
          new Error('ERR_NETWORK')
        ];

        networkErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('getLegalTags', {
            dataPartition: 'test'
          });

          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.errorType).to.equal('NETWORK');
          expect(result.canRetry).to.be.true;
          expect(result.retryDelay).to.be.greaterThan(0);
          expect(result.userMessage).to.contain('connect');
        });
      });

      it('should classify authentication errors correctly', () => {
        const authErrors = [
          new Error('401 Unauthorized'),
          new Error('403 Forbidden'),
          new Error('Token expired'),
          new Error('Invalid credentials')
        ];

        authErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('createLegalTag');

          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.errorType).to.equal('AUTH');
          expect(result.canRetry).to.be.false;
          expect(result.userMessage).to.contain('authorized');
        });
      });

      it('should classify schema errors correctly', () => {
        const schemaErrors = [
          new Error("Field 'invalidField' in type 'LegalTag' is undefined"),
          new Error("Cannot query field 'nonExistentField' on type 'Query'"),
          new Error("Variable '$invalidVar' is not defined")
        ];

        schemaErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('getLegalTags');

          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.errorType).to.equal('SCHEMA');
          expect(result.canRetry).to.be.false;
          expect(result.userMessage).to.contain('query structure');
        });
      });

      it('should classify data errors correctly', () => {
        const dataErrors = [
          new Error('Failed to parse JSON response'),
          new Error('Unexpected token in JSON'),
          new Error('Invalid response format')
        ];

        dataErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('getLegalTags');

          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.errorType).to.equal('DATA');
          expect(result.canRetry).to.be.true;
          expect(result.userMessage).to.contain('processing');
        });
      });

      it('should classify service errors correctly', () => {
        const serviceErrors = [
          new Error('500 Internal Server Error'),
          new Error('502 Bad Gateway'),
          new Error('503 Service Unavailable'),
          new Error('504 Gateway Timeout')
        ];

        serviceErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('updateLegalTag');

          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.errorType).to.equal('SERVICE');
          expect(result.canRetry).to.be.true;
          expect(result.userMessage).to.contain('service');
        });
      });

      it('should classify validation errors correctly', () => {
        const validationErrors = [
          new Error('Name field is required'),
          new Error('Invalid email format'),
          new Error('Country code must be 2 characters')
        ];

        validationErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('createLegalTag');

          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.errorType).to.equal('VALIDATION');
          expect(result.canRetry).to.be.false;
          expect(result.userMessage).to.contain('valid');
        });
      });
    });

    describe('Error Context Creation', () => {
      it('should create proper context for different operations', () => {
        const operations = [
          'getLegalTags',
          'listLegalTags',
          'createLegalTag',
          'updateLegalTag',
          'deleteLegalTag'
        ];

        operations.forEach(operation => {
          const context = legalTagErrorHandler.createContext(operation, {
            dataPartition: 'test-partition',
            legalTagId: 'test-id',
            endpoint: 'https://api.example.com/legal',
            queryType: 'primary'
          });

          expect(context.operation).to.equal(operation);
          expect(context.dataPartition).to.equal('test-partition');
          expect(context.legalTagId).to.equal('test-id');
          expect(context.endpoint).to.equal('https://api.example.com/legal');
          expect(context.queryType).to.equal('primary');
        });
      });

      it('should include context in error debug info', () => {
        const error = new Error('Test error');
        const context = legalTagErrorHandler.createContext('createLegalTag', {
          dataPartition: 'test-partition',
          legalTagId: 'test-id',
          endpoint: 'https://api.example.com/legal'
        });

        const result = legalTagErrorHandler.handleError(error, context);

        expect(result.debugInfo.service).to.equal('legal-tagging');
        expect(result.operation).to.equal('createLegalTag');
        expect(result.debugInfo.timestamp).to.be.a('string');
        expect(result.debugInfo.endpoint).to.equal('https://api.example.com/legal');
      });
    });

    describe('Retry Logic', () => {
      it('should set appropriate retry delays for different error types', () => {
        const errorTypes = [
          { error: new Error('fetch failed'), expectedDelay: 5000 },
          { error: new Error('503 Service Unavailable'), expectedDelay: 30000 },
          { error: new Error('Failed to parse JSON'), expectedDelay: 2000 }
        ];

        errorTypes.forEach(({ error, expectedDelay }) => {
          const context = legalTagErrorHandler.createContext('getLegalTags');
          const result = legalTagErrorHandler.handleError(error, context);

          if (result.canRetry) {
            expect(result.retryDelay).to.equal(expectedDelay);
          }
        });
      });

      it('should not allow retry for non-retryable errors', () => {
        const nonRetryableErrors = [
          new Error('401 Unauthorized'),
          new Error('403 Forbidden'),
          new Error('Invalid input format'),
          new Error("Field 'invalid' not found")
        ];

        nonRetryableErrors.forEach(error => {
          const context = legalTagErrorHandler.createContext('createLegalTag');
          const result = legalTagErrorHandler.handleError(error, context);

          expect(result.canRetry).to.be.false;
          expect(result.retryDelay).to.be.undefined;
        });
      });
    });

    describe('Error Message Generation', () => {
      it('should provide actionable suggestions for different error types', () => {
        const errorScenarios = [
          {
            error: new Error('ECONNREFUSED'),
            expectedSuggestions: ['Check your internet connection', 'Verify the service is running']
          },
          {
            error: new Error('Token expired'),
            expectedSuggestions: ['Please log in again', 'Refresh your session']
          },
          {
            error: new Error("Field 'invalid' not found"),
            expectedSuggestions: ['The API schema has been updated', 'Please refresh the page']
          }
        ];

        errorScenarios.forEach(({ error, expectedSuggestions }) => {
          const context = legalTagErrorHandler.createContext('getLegalTags');
          const result = legalTagErrorHandler.handleError(error, context);

          expectedSuggestions.forEach(suggestion => {
            expect(result.suggestions.some(s => s.includes(suggestion.split(' ')[0]))).to.be.true;
          });
        });
      });
    });
  });

  describe('Data Transformation Logic', () => {
    describe('Property Parsing', () => {
      it('should parse JSON string properties correctly', () => {
        const response = {
          getLegalTags: [
            {
              id: 'test-1',
              name: 'test-tag',
              properties: '{"countryOfOrigin":["US","CA"],"contractId":"TEST-001","originator":"OSDU"}'
            }
          ]
        };

        const result = normalizeLegalTagResponse(response, {
          parseJsonProperties: true
        });

        expect(result.data.items[0].properties).to.deep.equal({
          countryOfOrigin: ['US', 'CA'],
          contractId: 'TEST-001',
          originator: 'OSDU'
        });
      });

      it('should handle object properties without parsing', () => {
        const response = {
          listLegalTags: {
            items: [
              {
                id: 'test-2',
                name: 'test-tag-2',
                properties: {
                  countryOfOrigin: ['UK'],
                  contractId: 'TEST-002',
                  originator: 'OSDU'
                }
              }
            ]
          }
        };

        const result = normalizeLegalTagResponse(response, {
          parseJsonProperties: true
        });

        expect(result.data.items[0].properties).to.deep.equal({
          countryOfOrigin: ['UK'],
          contractId: 'TEST-002',
          originator: 'OSDU'
        });
      });

      it('should preserve malformed JSON as rawValue', () => {
        const response = {
          getLegalTags: [
            {
              id: 'test-3',
              name: 'test-tag-3',
              properties: '{"invalid": json}'
            }
          ]
        };

        const result = normalizeLegalTagResponse(response, {
          parseJsonProperties: true
        });

        expect(result.data.items[0].properties.rawValue).to.equal('{"invalid": json}');
      });
    });

    describe('Pagination Handling', () => {
      it('should normalize different pagination formats', () => {
        const responses = [
          {
            listLegalTags: {
              items: [],
              pagination: {
                nextToken: 'token-1',
                hasNextPage: true,
                totalCount: 100
              }
            }
          },
          {
            getLegalTags: {
              items: [],
              pagination: {
                nextToken: 'token-2'
              }
            }
          }
        ];

        responses.forEach((response, index) => {
          const result = normalizeLegalTagResponse(response);
          
          expect(result.data.pagination).to.exist;
          expect(result.data.pagination.nextToken).to.equal(`token-${index + 1}`);
        });
      });

      it('should handle missing pagination gracefully', () => {
        const response = {
          getLegalTags: [
            { id: 'test-1', name: 'test' }
          ]
        };

        const result = normalizeLegalTagResponse(response);

        expect(result.data.pagination).to.exist;
        expect(result.data.pagination).to.deep.equal({});
      });
    });

    describe('Item Filtering', () => {
      it('should filter out null/undefined items', () => {
        const response = {
          getLegalTags: [
            { id: 'valid-1', name: 'Valid Tag 1' },
            null,
            undefined,
            { id: 'valid-2', name: 'Valid Tag 2' },
            null
          ]
        };

        const result = normalizeLegalTagResponse(response);

        expect(result.data.items).to.have.length(2);
        expect(result.data.items[0].id).to.equal('valid-1');
        expect(result.data.items[1].id).to.equal('valid-2');
      });

      it('should filter out items without required fields', () => {
        const response = {
          listLegalTags: {
            items: [
              { id: 'valid-1', name: 'Valid Tag 1', description: 'Valid' },
              { name: 'Invalid Tag 1' }, // Missing id
              { id: 'invalid-2' }, // Missing name
              { id: 'valid-2', name: 'Valid Tag 2', description: 'Valid' }
            ]
          }
        };

        const result = normalizeLegalTagResponse(response, {
          validateProperties: true
        });

        expect(result.data.items).to.have.length(2);
        expect(result.data.items[0].id).to.equal('valid-1');
        expect(result.data.items[1].id).to.equal('valid-2');
      });
    });
  });
});