'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import BugReportIcon from '@mui/icons-material/BugReport';
import osduApi from '@/services/osduApiService';
import { introspectionEngine } from '@/utils/graphqlIntrospection';
import { legalTagLogger } from '@/utils/legalTagLogger';
import { graphqlQueryTester, QueryTestResult } from '@/utils/graphqlQueryTester';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debug-tabpanel-${index}`}
      aria-labelledby={`debug-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LegalTagDebug: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Schema introspection state
  const [schema, setSchema] = useState<any>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [availableQueries, setAvailableQueries] = useState<any[]>([]);
  const [availableMutations, setAvailableMutations] = useState<any[]>([]);
  
  // Query testing state
  const [customQuery, setCustomQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [queryVariables, setQueryVariables] = useState('{}');
  const [queryResult, setQueryResult] = useState<any>(null);
  
  // Logging state
  const [logs, setLogs] = useState<any[]>([]);
  const [logLevel, setLogLevel] = useState<string>('all');
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  
  // Query testing state
  const [testHistory, setTestHistory] = useState<QueryTestResult[]>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  // Development mode detection
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true';

  // Auto-refresh logs effect
  useEffect(() => {
    if (autoRefreshLogs) {
      const interval = setInterval(() => {
        refreshLogs();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefreshLogs]);

  // Initial load
  useEffect(() => {
    refreshLogs();
    loadPerformanceMetrics();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const testGetLegalTags = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      if (isDevelopment) {
        legalTagLogger.info('debug-test', 'Starting getLegalTags test from debug component');
      }
      
      const response = await osduApi.getLegalTags('osdu');
      
      if (isDevelopment) {
        legalTagLogger.info('debug-test', 'getLegalTags test completed successfully', {
          responseType: typeof response,
          hasData: !!response,
          dataKeys: response ? Object.keys(response) : []
        });
      }
      
      setResult(response);
      refreshLogs();
    } catch (err: any) {
      if (isDevelopment) {
        legalTagLogger.error('debug-test', 'getLegalTags test failed', {
          error: err.message,
          stack: err.stack
        });
      }
      
      setError(err.message || 'Unknown error');
      refreshLogs();
    } finally {
      setLoading(false);
    }
  };

  const testCreateLegalTag = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const testData = {
        name: 'test-legal-tag-' + Date.now(),
        description: 'Test legal tag created from debug component',
        properties: {
          dataType: 'Well Data',
          securityClassification: 'Public',
          countryOfOrigin: ['United States'],
          originator: 'Test User',
          personalData: 'None',
          exportClassification: 'EAR99'
        }
      };
      
      if (isDevelopment) {
        legalTagLogger.info('debug-test', 'Starting createLegalTag test from debug component', {
          testData: { ...testData, name: '[GENERATED]' }
        });
      }
      
      const response = await osduApi.createLegalTag(testData, 'osdu');
      
      if (isDevelopment) {
        legalTagLogger.info('debug-test', 'createLegalTag test completed successfully', {
          createdTag: response?.name || 'unknown',
          responseKeys: response ? Object.keys(response) : []
        });
      }
      
      setResult(response);
      refreshLogs();
    } catch (err: any) {
      if (isDevelopment) {
        legalTagLogger.error('debug-test', 'createLegalTag test failed', {
          error: err.message,
          stack: err.stack
        });
      }
      
      setError(err.message || 'Unknown error');
      refreshLogs();
    } finally {
      setLoading(false);
    }
  };

  const testIntrospection = async () => {
    setSchemaLoading(true);
    setError(null);
    
    try {
      if (isDevelopment) {
        legalTagLogger.info('debug-introspection', 'Starting schema introspection');
      }
      
      const legalEndpoint = osduApi.endpoints.legal;
      if (!legalEndpoint) {
        throw new Error('Legal service endpoint not configured');
      }
      
      const authHeaders = await osduApi.getAuthHeaders();
      const schemaResult = await introspectionEngine.introspectServiceWithAuth(legalEndpoint, authHeaders);
      
      setSchema(schemaResult);
      setAvailableQueries(schemaResult.queryType?.fields || []);
      setAvailableMutations(schemaResult.mutationType?.fields || []);
      
      if (isDevelopment) {
        legalTagLogger.info('debug-introspection', 'Schema introspection completed', {
          queryCount: schemaResult.queryType?.fields?.length || 0,
          mutationCount: schemaResult.mutationType?.fields?.length || 0,
          typeCount: schemaResult.types?.length || 0
        });
      }
      
      setResult(schemaResult);
      refreshLogs();
    } catch (err: any) {
      if (isDevelopment) {
        legalTagLogger.error('debug-introspection', 'Schema introspection failed', {
          error: err.message,
          stack: err.stack
        });
      }
      
      setError(err.message || 'Unknown error');
      refreshLogs();
    } finally {
      setSchemaLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) {
      setError('Please enter a GraphQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setQueryResult(null);

    try {
      let variables = {};
      if (queryVariables.trim()) {
        variables = JSON.parse(queryVariables);
      }

      const legalEndpoint = osduApi.endpoints.legal;
      const authHeaders = await osduApi.getAuthHeaders();
      
      // Use the query tester for enhanced testing capabilities
      const testResult = await graphqlQueryTester.testQuery(
        legalEndpoint,
        customQuery,
        variables,
        authHeaders
      );

      setQueryResult(testResult.data);
      setTestHistory(graphqlQueryTester.getTestHistory());
      
      if (!testResult.success) {
        setError(testResult.errors?.map(e => e.message).join(', ') || 'Query failed');
      }

      if (isDevelopment) {
        legalTagLogger.logSuccess('debug-custom-query', 'Custom query test completed', {
          success: testResult.success,
          duration: `${testResult.duration.toFixed(2)}ms`,
          hasData: !!testResult.data,
          errorCount: testResult.errors?.length || 0
        });
      }

      refreshLogs();
    } catch (err: any) {
      if (isDevelopment) {
        legalTagLogger.error('debug-custom-query', 'Custom query execution failed', {
          error: err.message,
          query: customQuery.substring(0, 200) + '...'
        });
      }

      setError(err.message || 'Unknown error');
      refreshLogs();
    } finally {
      setLoading(false);
    }
  };

  const executeSelectedOperation = async () => {
    if (!selectedOperation) {
      setError('Please select an operation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const legalEndpoint = osduApi.endpoints.legal;
      const authHeaders = await osduApi.getAuthHeaders();
      
      // Use the query tester to generate a proper template
      const template = await graphqlQueryTester.generateQueryTemplate(
        legalEndpoint,
        selectedOperation,
        authHeaders
      );

      setCustomQuery(template.query);
      setQueryVariables(JSON.stringify(template.variables, null, 2));
      
      if (isDevelopment) {
        legalTagLogger.logSuccess('debug-template-generation', 'Query template generated', {
          operationName: selectedOperation,
          queryLength: template.query.length,
          variableCount: Object.keys(template.variables).length
        });
      }

      // Show the description in the result area temporarily
      setQueryResult({
        templateGenerated: true,
        description: template.description,
        operation: selectedOperation
      });

    } catch (err: any) {
      if (isDevelopment) {
        legalTagLogger.error('debug-template-generation', 'Query template generation failed', {
          operationName: selectedOperation,
          error: err.message
        });
      }

      setError(err.message || 'Failed to generate query template');
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentQuery = async () => {
    if (!customQuery.trim()) {
      setError('Please enter a GraphQL query to validate');
      return;
    }

    setLoading(true);
    setValidationResult(null);

    try {
      const legalEndpoint = osduApi.endpoints.legal;
      const authHeaders = await osduApi.getAuthHeaders();
      
      const validation = await graphqlQueryTester.validateQuery(
        legalEndpoint,
        customQuery,
        authHeaders
      );

      setValidationResult(validation);

      if (isDevelopment) {
        legalTagLogger.logSuccess('debug-query-validation', 'Query validation completed', {
          valid: validation.valid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          suggestionCount: validation.suggestions.length
        });
      }

    } catch (err: any) {
      if (isDevelopment) {
        legalTagLogger.error('debug-query-validation', 'Query validation failed', {
          error: err.message
        });
      }

      setError(err.message || 'Query validation failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshLogs = () => {
    const recentLogs = legalTagLogger.getRecentLogs(50);
    const filteredLogs = logLevel === 'all' 
      ? recentLogs 
      : recentLogs.filter(log => log.level === logLevel.toUpperCase());
    
    setLogs(filteredLogs);
  };

  const loadPerformanceMetrics = () => {
    const metrics = legalTagLogger.getPerformanceSummary();
    setPerformanceMetrics(metrics);
  };

  const exportLogs = () => {
    const logData = legalTagLogger.exportLogs('json');
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-tag-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    legalTagLogger.clearOldLogs();
    refreshLogs();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BugReportIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Legal Tag Debug Tools
          </Typography>
          {isDevelopment && (
            <Chip 
              label="Development Mode" 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }} 
            />
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="debug tabs">
            <Tab label="Quick Tests" />
            <Tab label="Schema Introspection" />
            <Tab label="Query Testing" />
            <Tab label="Logs & Metrics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Quick API Tests
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              onClick={testIntrospection}
              disabled={schemaLoading}
              startIcon={schemaLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Test Introspection
            </Button>
            <Button
              variant="outlined"
              onClick={testGetLegalTags}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
            >
              Test Get Legal Tags
            </Button>
            <Button
              variant="outlined"
              onClick={testCreateLegalTag}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
            >
              Test Create Legal Tag
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Test Result ({typeof result === 'object' ? Object.keys(result).length + ' keys' : typeof result})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            GraphQL Schema Introspection
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={testIntrospection}
              disabled={schemaLoading}
              startIcon={schemaLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {schemaLoading ? 'Introspecting...' : 'Introspect Schema'}
            </Button>
          </Stack>

          {schema && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Schema Overview
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip label={`${availableQueries.length} Queries`} color="primary" />
                <Chip label={`${availableMutations.length} Mutations`} color="secondary" />
                <Chip label={`${schema.types?.length || 0} Types`} />
              </Stack>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Available Queries</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Arguments</TableCell>
                          <TableCell>Return Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableQueries.map((query: any) => (
                          <TableRow key={query.name}>
                            <TableCell>{query.name}</TableCell>
                            <TableCell>
                              {query.args?.map((arg: any) => (
                                <Chip 
                                  key={arg.name} 
                                  label={`${arg.name}: ${arg.type.name || arg.type.ofType?.name}`}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell>{query.type.name || query.type.ofType?.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Available Mutations</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Arguments</TableCell>
                          <TableCell>Return Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableMutations.map((mutation: any) => (
                          <TableRow key={mutation.name}>
                            <TableCell>{mutation.name}</TableCell>
                            <TableCell>
                              {mutation.args?.map((arg: any) => (
                                <Chip 
                                  key={arg.name} 
                                  label={`${arg.name}: ${arg.type.name || arg.type.ofType?.name}`}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell>{mutation.type.name || mutation.type.ofType?.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            GraphQL Query Testing
          </Typography>

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Operation</InputLabel>
              <Select
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
                label="Select Operation"
              >
                <MenuItem value="">
                  <em>Choose an operation</em>
                </MenuItem>
                {availableQueries.map((query: any) => (
                  <MenuItem key={query.name} value={query.name}>
                    Query: {query.name}
                  </MenuItem>
                ))}
                {availableMutations.map((mutation: any) => (
                  <MenuItem key={mutation.name} value={mutation.name}>
                    Mutation: {mutation.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={executeSelectedOperation}
                disabled={!selectedOperation || loading}
                startIcon={loading ? <CircularProgress size={16} /> : undefined}
              >
                Generate Query Template
              </Button>
              <Button
                variant="outlined"
                onClick={validateCurrentQuery}
                disabled={!customQuery.trim() || loading}
              >
                Validate Query
              </Button>
            </Stack>
          </Box>

          <TextField
            label="GraphQL Query"
            multiline
            rows={8}
            fullWidth
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Enter your GraphQL query here..."
          />

          <TextField
            label="Variables (JSON)"
            multiline
            rows={4}
            fullWidth
            value={queryVariables}
            onChange={(e) => setQueryVariables(e.target.value)}
            sx={{ mb: 2 }}
            placeholder='{"dataPartition": "osdu"}'
          />

          <Button
            variant="contained"
            onClick={executeCustomQuery}
            disabled={loading || !customQuery.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
            sx={{ mb: 2 }}
          >
            Execute Query
          </Button>

          {queryResult && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Query Result</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          )}

          {validationResult && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Query Validation {validationResult.valid ? '✅' : '❌'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {validationResult.errors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="error">Errors:</Typography>
                      {validationResult.errors.map((error: string, index: number) => (
                        <Alert key={index} severity="error" sx={{ mt: 1 }}>
                          {error}
                        </Alert>
                      ))}
                    </Box>
                  )}
                  
                  {validationResult.warnings.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="warning.main">Warnings:</Typography>
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                          {warning}
                        </Alert>
                      ))}
                    </Box>
                  )}
                  
                  {validationResult.suggestions.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="info.main">Suggestions:</Typography>
                      {validationResult.suggestions.map((suggestion: string, index: number) => (
                        <Alert key={index} severity="info" sx={{ mt: 1 }}>
                          {suggestion}
                        </Alert>
                      ))}
                    </Box>
                  )}

                  {validationResult.availableFields && validationResult.availableFields.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2">Available Fields:</Typography>
                      <Box sx={{ mt: 1 }}>
                        {validationResult.availableFields.map((field: string) => (
                          <Chip key={field} label={field} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {validationResult.requiredArguments && validationResult.requiredArguments.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2">Required Arguments:</Typography>
                      <Box sx={{ mt: 1 }}>
                        {validationResult.requiredArguments.map((arg: string) => (
                          <Chip key={arg} label={arg} size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {testHistory.length > 0 && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  Test History ({testHistory.length} tests)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Query</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {testHistory.slice(-10).reverse().map((test, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {new Date(test.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={test.success ? 'Success' : 'Failed'} 
                              size="small"
                              color={test.success ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {test.duration.toFixed(2)}ms
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', maxWidth: 200 }}>
                            {test.query.substring(0, 50)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Logs & Performance Metrics
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <FormControl size="small">
              <InputLabel>Log Level</InputLabel>
              <Select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                label="Log Level"
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warn">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={autoRefreshLogs}
                  onChange={(e) => setAutoRefreshLogs(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />

            <Button
              variant="outlined"
              onClick={refreshLogs}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>

            <Button
              variant="outlined"
              onClick={exportLogs}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>

            <Button
              variant="outlined"
              onClick={clearLogs}
            >
              Clear
            </Button>
          </Stack>

          {performanceMetrics && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Performance Summary</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip label={`${performanceMetrics.totalOperations} Total Operations`} />
                  <Chip 
                    label={`${performanceMetrics.successfulOperations} Successful`} 
                    color="success" 
                  />
                  <Chip 
                    label={`${performanceMetrics.failedOperations} Failed`} 
                    color="error" 
                  />
                  <Chip 
                    label={`${performanceMetrics.averageDuration.toFixed(2)}ms Avg`} 
                    color="info" 
                  />
                </Stack>

                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Operation</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Success Rate</TableCell>
                        <TableCell>Avg Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(performanceMetrics.operationBreakdown).map(([operation, metrics]: [string, any]) => (
                        <TableRow key={operation}>
                          <TableCell>{operation}</TableCell>
                          <TableCell>{metrics.count}</TableCell>
                          <TableCell>{(metrics.successRate * 100).toFixed(1)}%</TableCell>
                          <TableCell>{metrics.averageDuration.toFixed(2)}ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Recent Logs ({logs.length} entries)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Operation</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.level} 
                            size="small"
                            color={
                              log.level === 'ERROR' ? 'error' :
                              log.level === 'WARN' ? 'warning' :
                              log.level === 'INFO' ? 'info' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{log.operation}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalTagDebug;