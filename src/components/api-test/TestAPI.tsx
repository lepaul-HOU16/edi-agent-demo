'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/OidcAuthContext';
import osduApi from '../../services/osduApiService';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Container from '@cloudscape-design/components/container';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Tabs from '@cloudscape-design/components/tabs';
import Alert from '@cloudscape-design/components/alert';
import AdminBootstrap from '../admin/AdminBootstrap';

export default function TestAPI() {
  const { isAuthenticated, user, tokens } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('all');

  // Test individual service with OSDU M25 compliant calls
  const testService = async (serviceName: string): Promise<{ status: string; data?: any; error?: string }> => {
    if (!isAuthenticated) {
      return { status: 'error', error: 'Not authenticated' };
    }

    setIsLoading(true);
    try {
      let result;
      
      switch (serviceName) {
        case 'schema':
          const schemas = await osduApi.getSchemas('osdu', 5);
          result = { status: 'success', data: schemas };
          break;
        case 'legal':
          const legalTags = await osduApi.getLegalTags('osdu', 5);
          result = { status: 'success', data: legalTags };
          break;
        case 'search':
          const searchResults = await osduApi.search('*', 'osdu');
          result = { status: 'success', data: searchResults };
          break;
        case 'storage':
          // Test storage service with health check and record operations
          const storageTests = {
            healthCheck: null,
            recordCreation: null,
            recordRetrieval: null,
            recordListing: null
          };

          try {
            // Test 1: Health Check
            console.log('🏥 Testing storage service health check...');
            try {
              const healthResult = await osduApi.testStorageHealthCheck('osdu');
              storageTests.healthCheck = { status: 'success', data: healthResult };
              console.log('✅ Health check passed:', healthResult);
            } catch (error: any) {
              storageTests.healthCheck = { status: 'error', error: error.message };
              console.error('❌ Health check failed:', error);
            }

            // Test 2: Record Creation
            console.log('📝 Testing record creation...');
            try {
              const testRecord = {
                kind: 'osdu:wks:dataset--File.Generic:1.0.0',
                acl: {
                  viewers: ['testuser'],
                  owners: ['testuser']
                },
                legal: {
                  legaltags: ['osdu-public-usa-dataset-7643990'],
                  otherRelevantDataCountries: ['US']
                },
                data: {
                  Name: 'Frontend API Test Dataset',
                  Description: 'A test dataset created from the frontend API test page',
                  TestTimestamp: new Date().toISOString()
                }
              };

              const createdRecord = await osduApi.createStorageRecord(testRecord, 'osdu');
              storageTests.recordCreation = { status: 'success', data: createdRecord };
              console.log('✅ Record creation passed:', createdRecord);

              // Test 3: Record Retrieval (using the created record)
              if (createdRecord?.createRecord?.id) {
                console.log('📖 Testing record retrieval...');
                try {
                  const retrievedRecord = await osduApi.getStorageRecord(createdRecord.createRecord.id, 'osdu');
                  storageTests.recordRetrieval = { status: 'success', data: retrievedRecord };
                  console.log('✅ Record retrieval passed:', retrievedRecord);
                } catch (error: any) {
                  storageTests.recordRetrieval = { status: 'error', error: error.message };
                  console.error('❌ Record retrieval failed:', error);
                }
              }
            } catch (error: any) {
              storageTests.recordCreation = { status: 'error', error: error.message };
              console.error('❌ Record creation failed:', error);
            }

            // Test 4: Record Listing
            console.log('📋 Testing record listing...');
            try {
              const recordList = await osduApi.listStorageRecords('osdu', { limit: 5 });
              storageTests.recordListing = { status: 'success', data: recordList };
              console.log('✅ Record listing passed:', recordList);
            } catch (error: any) {
              storageTests.recordListing = { status: 'error', error: error.message };
              console.error('❌ Record listing failed:', error);
            }

          } catch (error: any) {
            console.error('❌ Storage service testing failed:', error);
          }

          result = { status: 'success', data: storageTests };
          break;
        case 'entitlements':
          const groups = await osduApi.getGroups('osdu', 5);
          result = { status: 'success', data: groups };
          break;
        case 'all':
          // Test all services
          const allResults: Record<string, any> = {
            schema: await testService('schema'),
            legal: await testService('legal'),
            search: await testService('search'),
            storage: await testService('storage'),
            entitlements: await testService('entitlements')
          };
          result = { status: 'complete', data: allResults };
          break;
        default:
          result = { status: 'error', error: 'Invalid service name' };
      }

      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        [serviceName]: result
      }));
      
      return result;
    } catch (error: any) {
      console.error(`Error testing ${serviceName} service:`, error);
      const result = { status: 'error', error: error.message || 'Unknown error' };
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        [serviceName]: result
      }));
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab selection
  const handleTabChange = (tabId: string) => {
    setSelectedService(tabId);
    if (!testResults[tabId]) {
      testService(tabId);
    }
  };

  // Run all tests
  const runAllTests = () => {
    testService('all');
  };

  // Run diagnostics
  const runDiagnostics = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Running OSDU API diagnostics...');
      const diagnostics = await osduApi.runDiagnostics();
      console.log('Diagnostics results:', diagnostics);
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        diagnostics: { status: 'success', data: diagnostics }
      }));
      
      setSelectedService('diagnostics');
    } catch (error: any) {
      console.error('Diagnostics failed:', error);
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        diagnostics: { status: 'error', error: error.message }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Run schema discovery
  const runSchemaDiscovery = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Running GraphQL schema discovery...');
      
      // Import the schema discovery utility
      const { discoverAllSchemas, generateSchemaReport, compareWithCurrentOperations } = await import('../../utils/schemaDiscovery');
      
      const discoveryResults = await discoverAllSchemas();
      const report = generateSchemaReport(discoveryResults);
      const comparison = compareWithCurrentOperations(discoveryResults);
      
      console.log('📋 Schema discovery complete:', { discoveryResults, report, comparison });
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        schemaDiscovery: { 
          status: 'success', 
          data: {
            discoveryResults,
            report,
            comparison
          }
        }
      }));
      
      setSelectedService('schemaDiscovery');
    } catch (error: any) {
      console.error('❌ Schema discovery failed:', error);
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        schemaDiscovery: { status: 'error', error: error.message }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Test storage service comprehensively
  const testStorageService = async (dataPartition = 'osdu') => {
    const tests = {
      healthCheck: null,
      recordCreation: null,
      recordRetrieval: null,
      recordListing: null
    };

    try {
      // Test 1: Health Check
      console.log('🏥 Testing storage service health check...');
      try {
        const healthResult = await osduApi.testStorageHealthCheck(dataPartition);
        tests.healthCheck = { status: 'success', data: healthResult };
        console.log('✅ Health check passed:', healthResult);
      } catch (error) {
        tests.healthCheck = { status: 'error', error: error.message };
        console.error('❌ Health check failed:', error);
      }

      // Test 2: Record Creation
      console.log('📝 Testing record creation...');
      try {
        const testRecord = {
          kind: 'osdu:wks:dataset--File.Generic:1.0.0',
          acl: {
            viewers: ['testuser'],
            owners: ['testuser']
          },
          legal: {
            legaltags: ['osdu-public-usa-dataset-7643990'],
            otherRelevantDataCountries: ['US']
          },
          data: {
            Name: 'Frontend API Test Dataset',
            Description: 'A test dataset created from the frontend API test page',
            TestTimestamp: new Date().toISOString()
          }
        };

        const createdRecord = await osduApi.createStorageRecord(testRecord, dataPartition);
        tests.recordCreation = { status: 'success', data: createdRecord };
        console.log('✅ Record creation passed:', createdRecord);

        // Test 3: Record Retrieval (using the created record)
        if (createdRecord?.createRecord?.id) {
          console.log('📖 Testing record retrieval...');
          try {
            const retrievedRecord = await osduApi.getStorageRecord(createdRecord.createRecord.id, dataPartition);
            tests.recordRetrieval = { status: 'success', data: retrievedRecord };
            console.log('✅ Record retrieval passed:', retrievedRecord);
          } catch (error) {
            tests.recordRetrieval = { status: 'error', error: error.message };
            console.error('❌ Record retrieval failed:', error);
          }
        }
      } catch (error) {
        tests.recordCreation = { status: 'error', error: error.message };
        console.error('❌ Record creation failed:', error);
      }

      // Test 4: Record Listing
      console.log('📋 Testing record listing...');
      try {
        const recordList = await osduApi.listStorageRecords(dataPartition, { limit: 5 });
        tests.recordListing = { status: 'success', data: recordList };
        console.log('✅ Record listing passed:', recordList);
      } catch (error) {
        tests.recordListing = { status: 'error', error: error.message };
        console.error('❌ Record listing failed:', error);
      }

    } catch (error) {
      console.error('❌ Storage service testing failed:', error);
    }

    return tests;
  };

  // Run schema analysis
  const runSchemaAnalysis = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔬 Running comprehensive schema analysis...');
      
      // Import the schema analysis utility
      const { analyzeSchemas, generateImplementationPlan } = await import('../../utils/schemaAnalysis');
      
      const analysis = await analyzeSchemas();
      const implementationPlan = generateImplementationPlan(analysis);
      
      console.log('📊 Schema analysis complete:', { analysis, implementationPlan });
      
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        schemaAnalysis: { 
          status: 'success', 
          data: {
            analysis,
            implementationPlan
          }
        }
      }));
      
      setSelectedService('schemaAnalysis');
    } catch (error: any) {
      console.error('❌ Schema analysis failed:', error);
      setTestResults((prev: Record<string, any>) => ({
        ...prev,
        schemaAnalysis: { status: 'error', error: error.message }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Format JSON for display
  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return 'Error formatting JSON';
    }
  };

  // Render test results
  const renderResults = (serviceName: string) => {
    const result = testResults[serviceName];
    
    if (!result) {
      return (
        <Box textAlign="center" padding="l">
          <Button onClick={() => testService(serviceName)}>Test {serviceName}</Button>
        </Box>
      );
    }

    if (result.status === 'error') {
      return (
        <Alert type="error" header="Error">
          {result.error}
        </Alert>
      );
    }

    if (serviceName === 'all') {
      return (
        <SpaceBetween direction="vertical" size="l">
          {Object.keys(result.data).map(service => (
            <Container 
              key={service} 
              header={<Header variant="h3">{service.toUpperCase()} Service</Header>}
            >
              {service === 'storage' && result.data[service].data ? (
                <SpaceBetween direction="vertical" size="s">
                  {Object.entries(result.data[service].data).map(([testName, testResult]) => (
                    <Alert
                      key={testName}
                      type={testResult?.status === 'success' ? 'success' : 'error'}
                      header={`${testName}: ${testResult?.status || 'unknown'}`}
                    >
                      <pre style={{ overflowX: 'auto', fontSize: '12px' }}>
                        {formatJson(testResult)}
                      </pre>
                    </Alert>
                  ))}
                </SpaceBetween>
              ) : (
                <pre style={{ overflowX: 'auto' }}>
                  {formatJson(result.data[service])}
                </pre>
              )}
            </Container>
          ))}
        </SpaceBetween>
      );
    }

    if (serviceName === 'storage') {
      return (
        <SpaceBetween direction="vertical" size="l">
          <Container header={<Header variant="h3">Storage Service Test Results</Header>}>
            <SpaceBetween direction="vertical" size="s">
              {Object.entries(result.data).map(([testName, testResult]) => (
                <Alert
                  key={testName}
                  type={testResult?.status === 'success' ? 'success' : 'error'}
                  header={`${testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${testResult?.status || 'unknown'}`}
                >
                  <SpaceBetween direction="vertical" size="xs">
                    {testResult?.error && (
                      <Box variant="p"><strong>Error:</strong> {testResult.error}</Box>
                    )}
                    {testResult?.data && (
                      <Box variant="p">
                        <strong>Result:</strong>
                        <pre style={{ overflowX: 'auto', fontSize: '12px', marginTop: '8px' }}>
                          {formatJson(testResult.data)}
                        </pre>
                      </Box>
                    )}
                  </SpaceBetween>
                </Alert>
              ))}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      );
    }

    if (serviceName === 'diagnostics') {
      const diagnostics = result.data;
      return (
        <SpaceBetween direction="vertical" size="l">
          <Container header={<Header variant="h3">Authentication Status</Header>}>
            <Alert 
              type={diagnostics.authentication.status === 'success' ? 'success' : 'error'}
              header={`Authentication: ${diagnostics.authentication.status}`}
            >
              {diagnostics.authentication.error || 'Authentication successful'}
            </Alert>
          </Container>

          <Container header={<Header variant="h3">Endpoint Status</Header>}>
            <SpaceBetween direction="vertical" size="s">
              {Object.entries(diagnostics.endpoints).map(([service, info]: [string, any]) => (
                <Alert
                  key={service}
                  type={info.status === 'connected' ? 'success' : 'error'}
                  header={`${service.toUpperCase()}: ${info.status}`}
                >
                  <SpaceBetween direction="vertical" size="xs">
                    <Box variant="p">Endpoint: {info.endpoint}</Box>
                    {info.error && <Box variant="p">Error: {info.error}</Box>}
                    {info.availableQueries && info.availableQueries.length > 0 && (
                      <Box variant="p">Available queries: {info.availableQueries.join(', ')}</Box>
                    )}
                  </SpaceBetween>
                </Alert>
              ))}
            </SpaceBetween>
          </Container>

          {diagnostics.recommendations.length > 0 && (
            <Container header={<Header variant="h3">Recommendations</Header>}>
              <SpaceBetween direction="vertical" size="xs">
                {diagnostics.recommendations.map((rec: string, index: number) => (
                  <Alert key={index} type="info">
                    {rec}
                  </Alert>
                ))}
              </SpaceBetween>
            </Container>
          )}

          <Container header={<Header variant="h3">Full Diagnostics Data</Header>}>
            <pre style={{ overflowX: 'auto' }}>
              {formatJson(diagnostics)}
            </pre>
          </Container>
        </SpaceBetween>
      );
    }

    if (serviceName === 'schemaDiscovery') {
      const { discoveryResults, report, comparison } = result.data;
      return (
        <SpaceBetween direction="vertical" size="l">
          <Container header={<Header variant="h3">Schema Discovery Summary</Header>}>
            <SpaceBetween direction="vertical" size="s">
              <Box variant="p">
                <strong>Total Endpoints:</strong> {report.summary.total} | 
                <strong> Successful:</strong> {report.summary.successful} | 
                <strong> Failed:</strong> {report.summary.failed} | 
                <strong> Not Configured:</strong> {report.summary.notConfigured}
              </Box>
              
              {Object.entries(report.endpoints).map(([service, info]: [string, any]) => (
                <Alert
                  key={service}
                  type={info.status === 'success' ? 'success' : 'error'}
                  header={`${service.toUpperCase()}: ${info.status}`}
                >
                  <SpaceBetween direction="vertical" size="xs">
                    <Box variant="p">Endpoint: {info.url}</Box>
                    {info.status === 'success' && (
                      <>
                        <Box variant="p">Queries: {info.queriesCount} | Mutations: {info.mutationsCount} | Types: {info.typesCount}</Box>
                        {info.availableQueries.length > 0 && (
                          <Box variant="p">Available Queries: {info.availableQueries.join(', ')}</Box>
                        )}
                        {info.availableMutations.length > 0 && (
                          <Box variant="p">Available Mutations: {info.availableMutations.join(', ')}</Box>
                        )}
                      </>
                    )}
                    {info.error && <Box variant="p">Error: {info.error}</Box>}
                  </SpaceBetween>
                </Alert>
              ))}
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">Frontend vs Schema Comparison</Header>}>
            <SpaceBetween direction="vertical" size="s">
              {comparison.exactMatches.length > 0 && (
                <Alert type="success" header={`✅ Exact Matches (${comparison.exactMatches.length})`}>
                  {comparison.exactMatches.map((match: any, index: number) => (
                    <Box key={index} variant="p">
                      {match.service}.{match.operation} ({match.type})
                    </Box>
                  ))}
                </Alert>
              )}

              {comparison.missingOperations.length > 0 && (
                <Alert type="error" header={`❌ Missing Operations (${comparison.missingOperations.length})`}>
                  {comparison.missingOperations.map((missing: any, index: number) => (
                    <Box key={index} variant="p">
                      <strong>{missing.service}.{missing.operation}</strong> - Available: {missing.available.join(', ') || 'None'}
                    </Box>
                  ))}
                </Alert>
              )}

              {comparison.availableAlternatives.length > 0 && (
                <Alert type="info" header={`💡 Suggested Alternatives (${comparison.availableAlternatives.length})`}>
                  {comparison.availableAlternatives.map((alt: any, index: number) => (
                    <Box key={index} variant="p">
                      <strong>{alt.service}.{alt.requested}</strong> → Try: {alt.alternatives.join(', ')}
                    </Box>
                  ))}
                </Alert>
              )}
            </SpaceBetween>
          </Container>

          {report.recommendations.length > 0 && (
            <Container header={<Header variant="h3">Recommendations</Header>}>
              <SpaceBetween direction="vertical" size="xs">
                {report.recommendations.map((rec: string, index: number) => (
                  <Alert key={index} type="info">
                    {rec}
                  </Alert>
                ))}
              </SpaceBetween>
            </Container>
          )}

          <Container header={<Header variant="h3">Full Discovery Data</Header>}>
            <pre style={{ overflowX: 'auto', fontSize: '12px' }}>
              {formatJson(discoveryResults)}
            </pre>
          </Container>
        </SpaceBetween>
      );
    }

    if (serviceName === 'schemaAnalysis') {
      const { analysis, implementationPlan } = result.data;
      return (
        <SpaceBetween direction="vertical" size="l">
          <Container header={<Header variant="h3">Schema Analysis Summary</Header>}>
            <SpaceBetween direction="vertical" size="s">
              <Box variant="p">
                <strong>Services Analyzed:</strong> {analysis.summary.totalServices} | 
                <strong> Successful:</strong> {analysis.summary.successfulServices} | 
                <strong> Total Operations:</strong> {analysis.summary.totalQueries + analysis.summary.totalMutations}
              </Box>
              <Box variant="p">
                <strong>Mapped Operations:</strong> {analysis.summary.mappedOperations} | 
                <strong> Unmapped:</strong> {analysis.summary.unmappedOperations}
              </Box>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">Implementation Plan</Header>}>
            <SpaceBetween direction="vertical" size="s">
              {implementationPlan.priority.high.length > 0 && (
                <Alert type="error" header={`🔥 High Priority (${implementationPlan.priority.high.length} items)`}>
                  <SpaceBetween direction="vertical" size="xs">
                    {implementationPlan.priority.high.map((item: any, index: number) => (
                      <Box key={index} variant="p">
                        <strong>{item.service}:</strong> {item.action === 'replace_operation' 
                          ? `Replace ${item.current} → ${item.suggested} (${Math.round(item.confidence * 100)}% confidence)`
                          : `Remove ${item.current} - ${item.reason}`
                        }
                      </Box>
                    ))}
                  </SpaceBetween>
                </Alert>
              )}

              {implementationPlan.priority.medium.length > 0 && (
                <Alert type="info" header={`⚡ Medium Priority (${implementationPlan.priority.medium.length} items)`}>
                  <SpaceBetween direction="vertical" size="xs">
                    {implementationPlan.priority.medium.map((item: any, index: number) => (
                      <Box key={index} variant="p">
                        <strong>{item.service}:</strong> Add support for {item.queries} queries and {item.mutations} mutations
                      </Box>
                    ))}
                  </SpaceBetween>
                </Alert>
              )}

              {implementationPlan.codeChanges.length > 0 && (
                <Alert type="warning" header={`📝 Required Code Changes (${implementationPlan.codeChanges.length} items)`}>
                  <SpaceBetween direction="vertical" size="xs">
                    {implementationPlan.codeChanges.map((change: any, index: number) => (
                      <Box key={index} variant="p">
                        <strong>{change.file}:</strong> {change.change}
                      </Box>
                    ))}
                  </SpaceBetween>
                </Alert>
              )}
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">Service Operation Mappings</Header>}>
            <SpaceBetween direction="vertical" size="s">
              {Object.entries(analysis.operationMappings).map(([service, mapping]: [string, any]) => (
                <Container key={service} header={<Header variant="h4">{service.toUpperCase()} Service</Header>}>
                  <SpaceBetween direction="vertical" size="xs">
                    {mapping.exactMatches.length > 0 && (
                      <Alert type="success" header={`✅ Working Operations (${mapping.exactMatches.length})`}>
                        {mapping.exactMatches.map((match: any, index: number) => (
                          <Box key={index} variant="p">{match.name} ({match.type})</Box>
                        ))}
                      </Alert>
                    )}
                    
                    {mapping.suggestedMappings.length > 0 && (
                      <Alert type="warning" header={`🔄 Suggested Replacements (${mapping.suggestedMappings.length})`}>
                        {mapping.suggestedMappings.map((suggestion: any, index: number) => (
                          <Box key={index} variant="p">
                            <strong>{suggestion.current}</strong> → <strong>{suggestion.suggested}</strong> 
                            ({Math.round(suggestion.confidence * 100)}% - {suggestion.reason})
                          </Box>
                        ))}
                      </Alert>
                    )}

                    <Box variant="p">
                      <strong>Available Operations:</strong> {mapping.availableOperations.queries.concat(mapping.availableOperations.mutations).join(', ')}
                    </Box>
                  </SpaceBetween>
                </Container>
              ))}
            </SpaceBetween>
          </Container>

          {analysis.newOpportunities.length > 0 && (
            <Container header={<Header variant="h3">New Service Opportunities</Header>}>
              <SpaceBetween direction="vertical" size="xs">
                {analysis.newOpportunities.map((opportunity: any, index: number) => (
                  <Alert key={index} type="info" header={`🆕 ${opportunity.service.toUpperCase()} Service`}>
                    {opportunity.description}
                  </Alert>
                ))}
              </SpaceBetween>
            </Container>
          )}

          <Container header={<Header variant="h3">Full Analysis Data</Header>}>
            <pre style={{ overflowX: 'auto', fontSize: '12px' }}>
              {formatJson(analysis)}
            </pre>
          </Container>
        </SpaceBetween>
      );
    }

    return (
      <pre style={{ overflowX: 'auto' }}>
        {formatJson(result.data)}
      </pre>
    );
  };

  return (
    <Container header={<Header variant="h2">OSDU API Testing Interface</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <AdminBootstrap />
        
        {!isAuthenticated ? (
          <Alert type="warning" header="Authentication Required">
            You need to be authenticated to test the OSDU APIs.
          </Alert>
        ) : (
          <>
            <ColumnLayout columns={2}>
              <Box>
                <SpaceBetween direction="vertical" size="s">
                  <Box variant="h3">Test Controls</Box>
                  <Button 
                    onClick={runAllTests}
                    loading={isLoading && selectedService === 'all'}
                    disabled={isLoading}
                  >
                    Test All Services
                  </Button>
                  <Button 
                    onClick={runDiagnostics}
                    loading={isLoading && selectedService === 'diagnostics'}
                    disabled={isLoading}
                    variant="normal"
                  >
                    Run Diagnostics
                  </Button>
                  <Button 
                    onClick={runSchemaDiscovery}
                    loading={isLoading && selectedService === 'schemaDiscovery'}
                    disabled={isLoading}
                    variant="primary"
                  >
                    Discover Schema
                  </Button>
                  <Button 
                    onClick={runSchemaAnalysis}
                    loading={isLoading && selectedService === 'schemaAnalysis'}
                    disabled={isLoading}
                    variant="primary"
                  >
                    Analyze & Map Operations
                  </Button>
                  <Button 
                    onClick={() => testService('storage')}
                    loading={isLoading && selectedService === 'storage'}
                    disabled={isLoading}
                    variant="primary"
                  >
                    Test Storage Service
                  </Button>
                  <Button 
                    onClick={() => window.open('/legal-tags', '_blank')}
                    variant="normal"
                  >
                    Manage Legal Tags
                  </Button>
                </SpaceBetween>
              </Box>
            <Box>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="h3">Authentication Info</Box>
                <Box variant="p">User: {user?.username || 'N/A'}</Box>
                <Box variant="p">Email: {user?.email || 'N/A'}</Box>
                <Box variant="p">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Box>
                <Box variant="p">Token: {tokens ? 'Valid' : 'Not Available'}</Box>
              </SpaceBetween>
            </Box>
            </ColumnLayout>

            <Tabs
              tabs={[
                { label: "All Services", id: "all" },
                { label: "Diagnostics", id: "diagnostics" },
                { label: "Schema Discovery", id: "schemaDiscovery" },
                { label: "Schema Analysis", id: "schemaAnalysis" },
                { label: "Schema", id: "schema" },
                { label: "Legal", id: "legal" },
                { label: "Search", id: "search" },
                { label: "Storage", id: "storage" },
                { label: "Entitlements", id: "entitlements" }
              ]}
              activeTabId={selectedService}
              onChange={({ detail }) => handleTabChange(detail.activeTabId)}
            />

            {isLoading && selectedService !== 'all' ? (
              <Box textAlign="center" padding="l">
                <SpaceBetween direction="vertical" size="m">
                  <Spinner size="large" />
                  <Box variant="p">Testing {selectedService} service...</Box>
                </SpaceBetween>
              </Box>
            ) : (
              <Container header={<Header variant="h3">Results</Header>}>
                {renderResults(selectedService)}
              </Container>
            )}
          </>
        )}
      </SpaceBetween>
    </Container>
  );
}
