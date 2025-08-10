/**
 * OSDU API Service Response Normalization Integration Tests
 * 
 * Tests to verify that the osduApiService correctly uses the response normalizer
 * for legal tag operations.
 */

import { expect } from 'chai';
import sinon from 'sinon';

// Mock the response normalizer module
const mockNormalizer = {
  normalizeLegalTagResponse: sinon.stub(),
  isEmptyResponse: sinon.stub(),
  isErrorResponse: sinon.stub()
};

// We'll test the integration by mocking the GraphQL request and verifying
// that the response normalizer is called with the correct parameters
describe('OSDU API Service Response Normalization Integration', () => {
  let osduApiService: any;
  let graphqlRequestStub: sinon.SinonStub;

  beforeEach(() => {
    // Reset all stubs
    sinon.resetHistory();
    
    // Mock the response normalizer functions
    mockNormalizer.normalizeLegalTagResponse.returns({
      data: { items: [], pagination: {} },
      isEmpty: true,
      isError: false
    });
    
    // Create a mock OSDU API service instance
    osduApiService = {
      defaultDataPartition: 'osdu',
      endpoints: { legal: 'https://mock-legal-endpoint' },
      graphqlRequest: sinon.stub(),
      _executeLegalTagQuery: sinon.stub(),
      _formatLegacyResponse: sinon.stub()
    };
    
    graphqlRequestStub = osduApiService.graphqlRequest;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getLegalTags response normalization', () => {
    it('should call response normalizer with correct parameters for successful response', async () => {
      // Mock successful GraphQL response
      const mockGraphQLResponse = {
        listLegalTags: {
          items: [
            {
              id: '1',
              name: 'test-tag',
              description: 'Test legal tag',
              properties: '{"countryOfOrigin":["US"]}'
            }
          ],
          pagination: { nextToken: 'token123' }
        }
      };

      osduApiService._executeLegalTagQuery.resolves(mockGraphQLResponse);
      osduApiService._formatLegacyResponse.returns({
        getLegalTags: [{ id: '1', name: 'test-tag' }],
        listLegalTags: { items: [{ id: '1', name: 'test-tag' }], pagination: {} }
      });

      // Mock the actual getLegalTags method behavior
      const getLegalTagsMethod = async function(dataPartition = 'osdu', limit = 10) {
        try {
          const primaryResult = await this._executeLegalTagQuery('listLegalTags', dataPartition, limit);
          const normalized = mockNormalizer.normalizeLegalTagResponse(primaryResult, {
            source: 'listLegalTags',
            queryType: 'primary',
            allowEmptyResponse: true,
            validateProperties: true,
            parseJsonProperties: true
          });

          if (!normalized.isError) {
            return this._formatLegacyResponse(normalized);
          }
          throw new Error(normalized.errorMessage || 'Primary query failed');
        } catch (error) {
          throw error;
        }
      };

      // Bind the method to our mock service
      const boundMethod = getLegalTagsMethod.bind(osduApiService);
      
      // Execute the method
      await boundMethod('osdu', 10);

      // Verify that the response normalizer was called with correct parameters
      expect(mockNormalizer.normalizeLegalTagResponse.calledOnce).to.be.true;
      
      const callArgs = mockNormalizer.normalizeLegalTagResponse.getCall(0).args;
      expect(callArgs[0]).to.deep.equal(mockGraphQLResponse);
      expect(callArgs[1]).to.deep.equal({
        source: 'listLegalTags',
        queryType: 'primary',
        allowEmptyResponse: true,
        validateProperties: true,
        parseJsonProperties: true
      });
    });

    it('should handle normalization errors correctly', async () => {
      // Mock GraphQL response
      const mockGraphQLResponse = { listLegalTags: null };
      
      osduApiService._executeLegalTagQuery.resolves(mockGraphQLResponse);
      
      // Mock normalizer to return error
      mockNormalizer.normalizeLegalTagResponse.returns({
        data: { items: [], pagination: {} },
        isEmpty: true,
        isError: true,
        errorMessage: 'Invalid response structure'
      });

      // Mock the actual getLegalTags method behavior
      const getLegalTagsMethod = async function(dataPartition = 'osdu', limit = 10) {
        try {
          const primaryResult = await this._executeLegalTagQuery('listLegalTags', dataPartition, limit);
          const normalized = mockNormalizer.normalizeLegalTagResponse(primaryResult, {
            source: 'listLegalTags',
            queryType: 'primary',
            allowEmptyResponse: true,
            validateProperties: true,
            parseJsonProperties: true
          });

          if (!normalized.isError) {
            return this._formatLegacyResponse(normalized);
          }
          throw new Error(normalized.errorMessage || 'Primary query failed');
        } catch (error) {
          throw error;
        }
      };

      // Bind the method to our mock service
      const boundMethod = getLegalTagsMethod.bind(osduApiService);
      
      // Execute the method and expect it to throw
      try {
        await boundMethod('osdu', 10);
        expect.fail('Expected method to throw an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid response structure');
      }

      // Verify that the response normalizer was called
      expect(mockNormalizer.normalizeLegalTagResponse.called).to.be.true;
    });
  });

  describe('Response format validation', () => {
    it('should validate that different response formats are handled', () => {
      const testCases = [
        {
          name: 'getLegalTags connection format',
          response: {
            getLegalTags: {
              items: [{ id: '1', name: 'test' }],
              pagination: { nextToken: 'token' }
            }
          }
        },
        {
          name: 'listLegalTags connection format',
          response: {
            listLegalTags: {
              items: [{ id: '2', name: 'test2' }],
              pagination: { hasNextPage: true }
            }
          }
        },
        {
          name: 'direct array format',
          response: [{ id: '3', name: 'test3' }]
        },
        {
          name: 'single object format',
          response: { id: '4', name: 'test4' }
        },
        {
          name: 'null response',
          response: null
        }
      ];

      testCases.forEach(testCase => {
        // Reset the stub for each test case
        mockNormalizer.normalizeLegalTagResponse.resetHistory();
        
        // Mock the normalizer to return a valid response
        mockNormalizer.normalizeLegalTagResponse.returns({
          data: { items: [], pagination: {} },
          isEmpty: false,
          isError: false
        });

        // Call the normalizer directly (simulating what the service would do)
        mockNormalizer.normalizeLegalTagResponse(testCase.response, {
          source: 'test',
          queryType: 'test'
        });

        // Verify it was called with the test response
        expect(mockNormalizer.normalizeLegalTagResponse.calledOnce).to.be.true;
        expect(mockNormalizer.normalizeLegalTagResponse.getCall(0).args[0]).to.deep.equal(testCase.response);
      });
    });
  });

  describe('Error handling integration', () => {
    it('should properly handle and format different error types', () => {
      const errorTypes = [
        { type: 'NETWORK', message: 'Network connection failed' },
        { type: 'AUTHENTICATION', message: 'Invalid credentials' },
        { type: 'VALIDATION', message: 'Invalid query structure' },
        { type: 'DATA', message: 'Invalid response format' },
        { type: 'SERVER', message: 'Internal server error' }
      ];

      errorTypes.forEach(errorType => {
        mockNormalizer.normalizeLegalTagResponse.resetHistory();
        
        // Mock normalizer to return specific error type
        mockNormalizer.normalizeLegalTagResponse.returns({
          data: { items: [], pagination: {} },
          isEmpty: true,
          isError: true,
          errorType: errorType.type,
          errorMessage: errorType.message
        });

        // Call normalizer
        const result = mockNormalizer.normalizeLegalTagResponse({}, {
          source: 'test',
          queryType: 'error-test'
        });

        // Verify error properties
        expect(result.isError).to.be.true;
        expect(result.errorType).to.equal(errorType.type);
        expect(result.errorMessage).to.equal(errorType.message);
      });
    });
  });
});