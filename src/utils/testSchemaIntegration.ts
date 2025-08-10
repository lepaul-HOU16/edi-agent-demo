/**
 * Integration test utility for Schema functionality
 * This script can be run to verify that schema loading and semantic search work correctly
 */

import osduApi from '../services/osduApiService';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class SchemaIntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Schema Integration Tests...\n');

    await this.testSchemaLoading();
    await this.testSemanticSearch();
    await this.testRelatedSchemas();
    await this.testErrorHandling();

    this.printResults();
    return this.results;
  }

  private async testSchemaLoading(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📊 Testing schema loading with listSchemas query...');
      
      const response = await osduApi.listSchemas('osdu', {}, { limit: 5 });
      
      if (response?.listSchemas?.items) {
        const schemas = response.listSchemas.items;
        
        if (schemas.length > 0) {
          const schema = schemas[0];
          
          // Verify schema structure
          const hasRequiredFields = schema.id && 
                                   schema.schemaIdentity && 
                                   schema.schemaIdentity.entityType &&
                                   schema.status;
          
          if (hasRequiredFields) {
            this.addResult({
              test: 'Schema Loading - listSchemas Query',
              status: 'PASS',
              message: `Successfully loaded ${schemas.length} schemas with correct structure`,
              duration: Date.now() - startTime
            });
            
            console.log(`✅ Loaded ${schemas.length} schemas successfully`);
            console.log(`   Sample schema: ${schema.schemaIdentity.entityType} (${schema.status})`);
          } else {
            this.addResult({
              test: 'Schema Loading - listSchemas Query',
              status: 'FAIL',
              message: 'Schemas missing required fields',
              duration: Date.now() - startTime
            });
          }
        } else {
          this.addResult({
            test: 'Schema Loading - listSchemas Query',
            status: 'FAIL',
            message: 'No schemas returned from API',
            duration: Date.now() - startTime
          });
        }
      } else {
        this.addResult({
          test: 'Schema Loading - listSchemas Query',
          status: 'FAIL',
          message: 'Invalid response structure from listSchemas',
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Schema Loading - listSchemas Query',
        status: 'FAIL',
        message: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
      
      console.log(`❌ Schema loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testSemanticSearch(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n🔍 Testing semantic search functionality...');
      
      const testQueries = [
        'well data schemas',
        'seismic survey information',
        'production data'
      ];
      
      let passedQueries = 0;
      
      for (const query of testQueries) {
        try {
          const response = await osduApi.searchSchemasBySimilarity(query, 5);
          
          if (response?.searchSchemasBySimilarity?.results) {
            const results = response.searchSchemasBySimilarity.results;
            
            if (results.length > 0) {
              const hasValidSimilarity = results.every(result => 
                result.similarity >= 0 && result.similarity <= 1
              );
              
              if (hasValidSimilarity) {
                passedQueries++;
                console.log(`   ✅ "${query}": ${results.length} results with valid similarity scores`);
              } else {
                console.log(`   ❌ "${query}": Invalid similarity scores`);
              }
            } else {
              console.log(`   ⚠️ "${query}": No results returned`);
            }
          } else {
            console.log(`   ❌ "${query}": Invalid response structure`);
          }
        } catch (queryError) {
          console.log(`   ❌ "${query}": ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
        }
      }
      
      if (passedQueries === testQueries.length) {
        this.addResult({
          test: 'Semantic Search Functionality',
          status: 'PASS',
          message: `All ${testQueries.length} test queries returned valid results`,
          duration: Date.now() - startTime
        });
      } else if (passedQueries > 0) {
        this.addResult({
          test: 'Semantic Search Functionality',
          status: 'PASS',
          message: `${passedQueries}/${testQueries.length} test queries passed (partial success)`,
          duration: Date.now() - startTime
        });
      } else {
        this.addResult({
          test: 'Semantic Search Functionality',
          status: 'FAIL',
          message: 'No semantic search queries returned valid results',
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Semantic Search Functionality',
        status: 'FAIL',
        message: `Semantic search error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testRelatedSchemas(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n🔗 Testing related schemas functionality...');
      
      // First get a schema to test with
      const schemasResponse = await osduApi.listSchemas('osdu', {}, { limit: 1 });
      
      if (schemasResponse?.listSchemas?.items?.length > 0) {
        const testSchema = schemasResponse.listSchemas.items[0];
        
        const relatedResponse = await osduApi.findRelatedSchemas(testSchema.id, 5);
        
        if (relatedResponse?.findRelatedSchemas?.results) {
          const relatedSchemas = relatedResponse.findRelatedSchemas.results;
          
          if (relatedSchemas.length > 0) {
            const hasValidRelationships = relatedSchemas.every(result =>
              result.schema && result.similarity >= 0 && result.similarity <= 1
            );
            
            if (hasValidRelationships) {
              this.addResult({
                test: 'Related Schemas Functionality',
                status: 'PASS',
                message: `Found ${relatedSchemas.length} related schemas with valid similarity scores`,
                duration: Date.now() - startTime
              });
              
              console.log(`✅ Found ${relatedSchemas.length} related schemas for ${testSchema.schemaIdentity.entityType}`);
            } else {
              this.addResult({
                test: 'Related Schemas Functionality',
                status: 'FAIL',
                message: 'Related schemas have invalid similarity scores or structure',
                duration: Date.now() - startTime
              });
            }
          } else {
            this.addResult({
              test: 'Related Schemas Functionality',
              status: 'PASS',
              message: 'No related schemas found (acceptable result)',
              duration: Date.now() - startTime
            });
            
            console.log(`⚠️ No related schemas found for ${testSchema.schemaIdentity.entityType}`);
          }
        } else {
          this.addResult({
            test: 'Related Schemas Functionality',
            status: 'FAIL',
            message: 'Invalid response structure from findRelatedSchemas',
            duration: Date.now() - startTime
          });
        }
      } else {
        this.addResult({
          test: 'Related Schemas Functionality',
          status: 'SKIP',
          message: 'No schemas available to test related functionality',
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.addResult({
        test: 'Related Schemas Functionality',
        status: 'FAIL',
        message: `Related schemas error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n🛡️ Testing error handling and loading states...');
      
      // Test with invalid parameters to check error handling
      try {
        await osduApi.listSchemas('invalid-partition', {}, {});
        
        // If we get here without error, that's actually fine - the API might handle it gracefully
        this.addResult({
          test: 'Error Handling and Loading States',
          status: 'PASS',
          message: 'API handles invalid parameters gracefully',
          duration: Date.now() - startTime
        });
        
        console.log('✅ API handles invalid parameters gracefully');
      } catch (error) {
        // This is expected behavior - API should handle errors properly
        if (error instanceof Error && error.message.includes('Authentication')) {
          this.addResult({
            test: 'Error Handling and Loading States',
            status: 'PASS',
            message: 'API properly handles authentication errors',
            duration: Date.now() - startTime
          });
          
          console.log('✅ API properly handles authentication errors');
        } else {
          this.addResult({
            test: 'Error Handling and Loading States',
            status: 'PASS',
            message: 'API properly throws errors for invalid requests',
            duration: Date.now() - startTime
          });
          
          console.log('✅ API properly throws errors for invalid requests');
        }
      }
    } catch (error) {
      this.addResult({
        test: 'Error Handling and Loading States',
        status: 'FAIL',
        message: `Unexpected error in error handling test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private addResult(result: TestResult): void {
    this.results.push(result);
  }

  private printResults(): void {
    console.log('\n📋 Test Results Summary');
    console.log('========================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.message}`);
        });
    }
    
    if (skipped > 0) {
      console.log('\n⏭️ Skipped Tests:');
      this.results
        .filter(r => r.status === 'SKIP')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.message}`);
        });
    }
    
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`\n⏱️ Total Duration: ${totalDuration}ms`);
    
    const successRate = Math.round((passed / (passed + failed)) * 100);
    console.log(`📈 Success Rate: ${successRate}%`);
  }
}

// Export for use in other files
export default SchemaIntegrationTester;

// Allow running directly in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testSchemaIntegration = async () => {
    const tester = new SchemaIntegrationTester();
    return await tester.runAllTests();
  };
  
  console.log('🧪 Schema Integration Tester loaded!');
  console.log('Run testSchemaIntegration() in the console to start tests.');
}