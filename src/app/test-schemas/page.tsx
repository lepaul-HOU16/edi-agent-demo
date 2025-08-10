'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  CheckCircle as PassIcon,
  Error as FailIcon,
  Warning as SkipIcon,
  Schema as SchemaIcon
} from '@mui/icons-material';
import { withAuth } from '@/components/WithAuth';
import SchemaIntegrationTester from '@/utils/testSchemaIntegration';
import osduApi from '@/services/osduApiService';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

const TestSchemasPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sampleSchemas, setSampleSchemas] = useState<any[]>([]);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    checkApiConnection();
    loadSampleSchemas();
  }, []);

  const checkApiConnection = async () => {
    try {
      const health = await osduApi.getServiceHealth();
      if (health.overall === 'healthy') {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('error');
    }
  };

  const loadSampleSchemas = async () => {
    try {
      const response = await osduApi.listSchemas('osdu', {}, { limit: 3 });
      if (response?.listSchemas?.items) {
        setSampleSchemas(response.listSchemas.items);
      }
    } catch (error) {
      console.error('Failed to load sample schemas:', error);
    }
  };

  const runIntegrationTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const tester = new SchemaIntegrationTester();
      const results = await tester.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
      setTestResults([{
        test: 'Test Execution',
        status: 'FAIL',
        message: `Failed to run tests: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const testSemanticSearch = async () => {
    try {
      const response = await osduApi.searchSchemasBySimilarity('well data schemas', 5);
      console.log('Semantic search results:', response);
      alert(`Semantic search returned ${response?.searchSchemasBySimilarity?.results?.length || 0} results`);
    } catch (error) {
      console.error('Semantic search failed:', error);
      alert(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testRelatedSchemas = async () => {
    if (sampleSchemas.length === 0) {
      alert('No sample schemas available to test with');
      return;
    }

    try {
      const response = await osduApi.findRelatedSchemas(sampleSchemas[0].id, 5);
      console.log('Related schemas results:', response);
      alert(`Found ${response?.findRelatedSchemas?.results?.length || 0} related schemas`);
    } catch (error) {
      console.error('Related schemas search failed:', error);
      alert(`Related schemas search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <PassIcon color="success" />;
      case 'FAIL':
        return <FailIcon color="error" />;
      case 'SKIP':
        return <SkipIcon color="warning" />;
      default:
        return <SchemaIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'error';
      case 'SKIP':
        return 'warning';
      default:
        return 'default';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'PASS').length;
  const failedTests = testResults.filter(r => r.status === 'FAIL').length;
  const skippedTests = testResults.filter(r => r.status === 'SKIP').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Schema Integration Testing
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Test the integration between schema loading, semantic search, and UI components
      </Typography>

      {/* API Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Connection Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={apiStatus === 'connected' ? 'Connected' : apiStatus === 'error' ? 'Error' : 'Checking...'}
              color={apiStatus === 'connected' ? 'success' : apiStatus === 'error' ? 'error' : 'default'}
              variant="filled"
            />
            {apiStatus === 'connected' && (
              <Typography variant="body2" color="text.secondary">
                OSDU API services are accessible
              </Typography>
            )}
            {apiStatus === 'error' && (
              <Typography variant="body2" color="error">
                Unable to connect to OSDU API services
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Sample Schemas */}
      {sampleSchemas.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sample Loaded Schemas
            </Typography>
            <Grid container spacing={2}>
              {sampleSchemas.map((schema, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {schema.schemaIdentity.entityType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {schema.schemaIdentity.authority}:{schema.schemaIdentity.source}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={schema.status}
                          size="small"
                          color={schema.status === 'published' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Manual Tests */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manual Tests
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={testSemanticSearch}
              disabled={apiStatus !== 'connected'}
            >
              Test Semantic Search
            </Button>
            <Button
              variant="outlined"
              onClick={testRelatedSchemas}
              disabled={apiStatus !== 'connected' || sampleSchemas.length === 0}
            >
              Test Related Schemas
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.open('/schemas', '_blank')}
            >
              Open Schemas Page
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Automated Tests */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Automated Integration Tests
            </Typography>
            <Button
              variant="contained"
              startIcon={isRunning ? <CircularProgress size={20} /> : <RunIcon />}
              onClick={runIntegrationTests}
              disabled={isRunning || apiStatus !== 'connected'}
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </Box>

          {testResults.length > 0 && (
            <>
              {/* Test Summary */}
              <Box sx={{ mb: 2 }}>
                <Alert 
                  severity={failedTests === 0 ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>Test Summary:</strong> {passedTests} passed, {failedTests} failed, {skippedTests} skipped
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label={`${passedTests} Passed`} color="success" variant="outlined" />
                  <Chip label={`${failedTests} Failed`} color="error" variant="outlined" />
                  <Chip label={`${skippedTests} Skipped`} color="warning" variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Test Results */}
              <List>
                {testResults.map((result, index) => (
                  <ListItem key={index} divider={index < testResults.length - 1}>
                    <ListItemIcon>
                      {getStatusIcon(result.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {result.test}
                          </Typography>
                          <Chip
                            label={result.status}
                            size="small"
                            color={getStatusColor(result.status)}
                            variant="outlined"
                          />
                          {result.duration && (
                            <Typography variant="caption" color="text.secondary">
                              ({result.duration}ms)
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={result.message}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            This page helps verify that the schema loading and semantic search functionality is working correctly:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="1. Check API Connection"
                secondary="Verify that the OSDU API services are accessible and responding"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Review Sample Schemas"
                secondary="Confirm that schemas are being loaded and displayed with correct information"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Run Manual Tests"
                secondary="Test individual features like semantic search and related schemas"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="4. Run Automated Tests"
                secondary="Execute comprehensive integration tests to verify all functionality"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="5. Test UI Components"
                secondary="Open the schemas page to test the complete user interface"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default withAuth(TestSchemasPage);