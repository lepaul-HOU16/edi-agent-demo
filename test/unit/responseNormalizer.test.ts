/**
 * Response Normalizer Tests
 * 
 * Tests for the response normalization functionality to ensure proper handling
 * of different response formats and edge cases.
 */

import { expect } from 'chai';
import { 
  ResponseNormalizer,
  normalizeLegalTagResponse,
  isEmptyResponse,
  isErrorResponse,
  createErrorResponse,
  validateLegalTagProperties
} from '../../src/utils/responseNormalizer';

describe('ResponseNormalizer', () => {
  describe('normalizeLegalTagResponse', () => {
    it('should handle getLegalTags connection format', () => {
      const response = {
        getLegalTags: {
          items: [
            {
              id: '1',
              name: 'test-tag',
              description: 'Test legal tag',
              properties: '{"countryOfOrigin":["US"],"contractId":"test-contract"}'
            }
          ],
          pagination: {
            nextToken: 'token123'
          }
        }
      };

      const result = normalizeLegalTagResponse(response, {
        source: 'getLegalTags',
        queryType: 'test'
      });

      expect(result.isError).to.be.false;
      expect(result.isEmpty).to.be.false;
      expect(result.data.items).to.have.length(1);
      expect(result.data.items[0].id).to.equal('1');
      expect(result.data.items[0].name).to.equal('test-tag');
      expect(result.data.items[0].properties).to.deep.equal({
        countryOfOrigin: ['US'],
        contractId: 'test-contract'
      });
      expect(result.data.pagination.nextToken).to.equal('token123');
    });

    it('should handle listLegalTags connection format', () => {
      const response = {
        listLegalTags: {
          items: [
            {
              id: '2',
              name: 'another-tag',
              description: 'Another test tag',
              properties: {
                countryOfOrigin: ['CA'],
                contractId: 'another-contract'
              }
            }
          ],
          pagination: {
            hasNextPage: true,
            totalCount: 10
          }
        }
      };

      const result = normalizeLegalTagResponse(response, {
        source: 'listLegalTags',
        queryType: 'test'
      });

      expect(result.isError).to.be.false;
      expect(result.isEmpty).to.be.false;
      expect(result.data.items).to.have.length(1);
      expect(result.data.items[0].properties).to.deep.equal({
        countryOfOrigin: ['CA'],
        contractId: 'another-contract'
      });
      expect(result.data.pagination.hasNextPage).to.be.true;
      expect(result.data.pagination.totalCount).to.equal(10);
    });

    it('should handle direct array format', () => {
      const response = [
        {
          id: '3',
          name: 'array-tag',
          description: 'Tag from array',
          properties: '{"countryOfOrigin":["UK"]}'
        }
      ];

      const result = normalizeLegalTagResponse(response);

      expect(result.isError).to.be.false;
      expect(result.isEmpty).to.be.false;
      expect(result.data.items).to.have.length(1);
      expect(result.data.items[0].properties.countryOfOrigin).to.deep.equal(['UK']);
    });

    it('should handle single legal tag object', () => {
      const response = {
        id: '4',
        name: 'single-tag',
        description: 'Single tag object',
        properties: {
          countryOfOrigin: ['FR'],
          contractId: 'single-contract'
        }
      };

      const result = normalizeLegalTagResponse(response);

      expect(result.isError).to.be.false;
      expect(result.isEmpty).to.be.false;
      expect(result.data.items).to.have.length(1);
      expect(result.data.items[0].id).to.equal('4');
    });

    it('should handle null response as empty', () => {
      const result = normalizeLegalTagResponse(null, { allowEmptyResponse: true });

      expect(result.isError).to.be.false;
      expect(result.isEmpty).to.be.true;
      expect(result.data.items).to.have.length(0);
    });

    it('should handle null response as error when not allowed', () => {
      const result = normalizeLegalTagResponse(null, { allowEmptyResponse: false });

      expect(result.isError).to.be.true;
      expect(result.errorType).to.equal('DATA');
      expect(result.errorMessage).to.include('null or undefined');
    });

    it('should handle empty arrays', () => {
      const response = {
        getLegalTags: {
          items: [],
          pagination: {}
        }
      };

      const result = normalizeLegalTagResponse(response);

      expect(result.isError).to.be.false;
      expect(result.isEmpty).to.be.true;
      expect(result.data.items).to.have.length(0);
    });

    it('should handle malformed JSON properties gracefully', () => {
      const response = {
        getLegalTags: {
          items: [
            {
              id: '5',
              name: 'malformed-tag',
              description: 'Tag with malformed properties',
              properties: '{"invalid": json}'
            }
          ]
        }
      };

      const result = normalizeLegalTagResponse(response);

      expect(result.isError).to.be.false;
      expect(result.data.items).to.have.length(1);
      expect(result.data.items[0].properties.rawValue).to.equal('{"invalid": json}');
    });

    it('should filter out null/undefined items', () => {
      const response = {
        getLegalTags: {
          items: [
            {
              id: '6',
              name: 'valid-tag',
              description: 'Valid tag'
            },
            null,
            undefined,
            {
              id: '7',
              name: 'another-valid-tag',
              description: 'Another valid tag'
            }
          ]
        }
      };

      const result = normalizeLegalTagResponse(response);

      expect(result.isError).to.be.false;
      expect(result.data.items).to.have.length(2);
      expect(result.data.items[0].id).to.equal('6');
      expect(result.data.items[1].id).to.equal('7');
    });

    it('should handle unknown response structure', () => {
      const response = {
        unknownField: 'unknown value',
        anotherField: 123
      };

      const result = normalizeLegalTagResponse(response);

      expect(result.isError).to.be.true;
      expect(result.errorType).to.equal('DATA');
      expect(result.errorMessage).to.include('Unknown response structure');
    });
  });

  describe('isEmptyResponse', () => {
    it('should detect null/undefined as empty', () => {
      expect(isEmptyResponse(null)).to.be.true;
      expect(isEmptyResponse(undefined)).to.be.true;
    });

    it('should detect empty arrays as empty', () => {
      expect(isEmptyResponse([])).to.be.true;
      expect(isEmptyResponse({ items: [] })).to.be.true;
      expect(isEmptyResponse({ getLegalTags: [] })).to.be.true;
      expect(isEmptyResponse({ listLegalTags: { items: [] } })).to.be.true;
    });

    it('should detect non-empty responses as not empty', () => {
      expect(isEmptyResponse([{ id: '1' }])).to.be.false;
      expect(isEmptyResponse({ items: [{ id: '1' }] })).to.be.false;
      expect(isEmptyResponse({ getLegalTags: [{ id: '1' }] })).to.be.false;
    });
  });

  describe('isErrorResponse', () => {
    it('should detect GraphQL errors', () => {
      const response = {
        errors: [
          { message: 'Field not found' },
          { message: 'Invalid argument' }
        ]
      };

      const result = isErrorResponse(response);

      expect(result.isError).to.be.true;
      expect(result.errorType).to.equal('VALIDATION');
      expect(result.errorMessage).to.include('Field not found');
    });

    it('should detect HTTP errors', () => {
      const response = {
        status: 401,
        statusText: 'Unauthorized'
      };

      const result = isErrorResponse(response);

      expect(result.isError).to.be.true;
      expect(result.errorType).to.equal('AUTHENTICATION');
      expect(result.errorMessage).to.include('HTTP 401');
    });

    it('should detect server errors', () => {
      const response = {
        status: 500,
        statusText: 'Internal Server Error'
      };

      const result = isErrorResponse(response);

      expect(result.isError).to.be.true;
      expect(result.errorType).to.equal('SERVER');
    });

    it('should not detect valid responses as errors', () => {
      const response = {
        getLegalTags: {
          items: [{ id: '1', name: 'test' }]
        }
      };

      const result = isErrorResponse(response);

      expect(result.isError).to.be.false;
    });
  });

  describe('validateLegalTagProperties', () => {
    it('should validate correct properties', () => {
      const properties = {
        countryOfOrigin: ['US'],
        contractId: 'test-contract',
        originator: 'OSDU',
        expirationDate: '2025-12-31T23:59:59.999Z'
      };

      const result = validateLegalTagProperties(properties);

      expect(result.isValid).to.be.true;
      expect(result.errors).to.have.length(0);
    });

    it('should detect missing required properties', () => {
      const properties = {
        countryOfOrigin: ['US']
        // Missing contractId and originator
      };

      const result = validateLegalTagProperties(properties);

      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Missing required property: contractId');
      expect(result.errors).to.include('Missing required property: originator');
    });

    it('should validate field types', () => {
      const properties = {
        countryOfOrigin: 'US', // Should be array
        contractId: 'test-contract',
        originator: 'OSDU',
        expirationDate: 'invalid-date'
      };

      const result = validateLegalTagProperties(properties);

      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('countryOfOrigin must be an array');
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

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const errorResponse = createErrorResponse('NETWORK', 'Connection failed', { original: 'data' });

      expect(errorResponse.isError).to.be.true;
      expect(errorResponse.isEmpty).to.be.true;
      expect(errorResponse.errorType).to.equal('NETWORK');
      expect(errorResponse.errorMessage).to.equal('Connection failed');
      expect(errorResponse.originalResponse).to.deep.equal({ original: 'data' });
      expect(errorResponse.metadata.source).to.equal('error');
    });
  });
});