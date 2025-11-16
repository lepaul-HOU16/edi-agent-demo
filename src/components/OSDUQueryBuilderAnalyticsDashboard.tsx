
import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Badge,
  Table,
  Button,
  Alert,
  ExpandableSection,
  ProgressBar
} from '@cloudscape-design/components';
import { QueryBuilderAnalytics } from '@/utils/queryBuilderAnalytics';

/**
 * Analytics Dashboard for OSDU Query Builder
 * 
 * Displays usage metrics, performance statistics, and insights
 * about query builder usage patterns.
 * 
 * Requirements: 15.4, 15.5
 */
export const OSDUQueryBuilderAnalyticsDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [overallStats, setOverallStats] = useState(QueryBuilderAnalytics.getOverallStats());
  const [templateStats, setTemplateStats] = useState(QueryBuilderAnalytics.getTemplateUsageStats());
  const [fieldStats, setFieldStats] = useState(QueryBuilderAnalytics.getFieldUsageStats());
  const [errorStats, setErrorStats] = useState(QueryBuilderAnalytics.getErrorStats());
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh data
  const refreshData = () => {
    setOverallStats(QueryBuilderAnalytics.getOverallStats());
    setTemplateStats(QueryBuilderAnalytics.getTemplateUsageStats());
    setFieldStats(QueryBuilderAnalytics.getFieldUsageStats());
    setErrorStats(QueryBuilderAnalytics.getErrorStats());
    setRefreshKey(prev => prev + 1);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleExportData = () => {
    const data = QueryBuilderAnalytics.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-builder-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      QueryBuilderAnalytics.clearAll();
      refreshData();
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Usage metrics and performance statistics for the OSDU Query Builder"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={refreshData} iconName="refresh">
                Refresh
              </Button>
              <Button onClick={handleExportData} iconName="download">
                Export Data
              </Button>
              <Button onClick={handleClearData} iconName="remove">
                Clear Data
              </Button>
              <Button onClick={onClose} variant="link">
                Close
              </Button>
            </SpaceBetween>
          }
        >
          Query Builder Analytics
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Overall Statistics */}
        <Container header={<Header variant="h3">Overall Usage</Header>}>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Opens</Box>
              <Box variant="awsui-value-large">{overallStats.totalOpens}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Total Executions</Box>
              <Box variant="awsui-value-large">{overallStats.totalExecutions}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Success Rate</Box>
              <Box variant="awsui-value-large">
                {(overallStats.successRate * 100).toFixed(1)}%
              </Box>
              <ProgressBar
                value={overallStats.successRate * 100}
                variant={overallStats.successRate >= 0.9 ? 'success' : overallStats.successRate >= 0.7 ? 'warning' : 'error'}
              />
            </div>
            <div>
              <Box variant="awsui-key-label">Avg Execution Time</Box>
              <Box variant="awsui-value-large">
                {formatDuration(overallStats.avgExecutionTimeMs)}
              </Box>
            </div>
          </ColumnLayout>

          <Box margin={{ top: 'm' }}>
            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Successful Queries</Box>
                <Box variant="awsui-value-large" color="text-status-success">
                  {overallStats.totalSuccessfulExecutions}
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Failed Queries</Box>
                <Box variant="awsui-value-large" color="text-status-error">
                  {overallStats.totalFailedExecutions}
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Avg Results per Query</Box>
                <Box variant="awsui-value-large">
                  {overallStats.avgResultCount.toFixed(1)}
                </Box>
              </div>
            </ColumnLayout>
          </Box>
        </Container>

        {/* Top Insights */}
        <Container header={<Header variant="h3">Top Insights</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Most Used Template</Box>
              <Box variant="p">
                {overallStats.mostUsedTemplate || <em>No templates used yet</em>}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Most Used Field</Box>
              <Box variant="p">
                {overallStats.mostUsedField || <em>No fields used yet</em>}
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Most Common Error</Box>
              <Box variant="p" color="text-status-error">
                {overallStats.mostCommonError || <em>No errors recorded</em>}
              </Box>
            </div>
          </ColumnLayout>
        </Container>

        {/* Template Usage Statistics */}
        <ExpandableSection
          headerText="Template Usage Statistics"
          variant="container"
          defaultExpanded={templateStats.length > 0}
        >
          {templateStats.length === 0 ? (
            <Alert type="info">
              No template usage data available yet. Templates will appear here once they are used.
            </Alert>
          ) : (
            <Table
              columnDefinitions={[
                {
                  id: 'template',
                  header: 'Template',
                  cell: item => item.templateName,
                  sortingField: 'templateName'
                },
                {
                  id: 'usage',
                  header: 'Usage Count',
                  cell: item => item.usageCount,
                  sortingField: 'usageCount'
                },
                {
                  id: 'successRate',
                  header: 'Success Rate',
                  cell: item => (
                    <Box>
                      {(item.successRate * 100).toFixed(1)}%
                      <ProgressBar
                        value={item.successRate * 100}
                        variant={item.successRate >= 0.9 ? 'success' : item.successRate >= 0.7 ? 'warning' : 'error'}
                      />
                    </Box>
                  ),
                  sortingField: 'successRate'
                },
                {
                  id: 'avgTime',
                  header: 'Avg Execution Time',
                  cell: item => formatDuration(item.avgExecutionTimeMs),
                  sortingField: 'avgExecutionTimeMs'
                },
                {
                  id: 'avgResults',
                  header: 'Avg Results',
                  cell: item => item.avgResultCount.toFixed(1),
                  sortingField: 'avgResultCount'
                },
                {
                  id: 'lastUsed',
                  header: 'Last Used',
                  cell: item => formatDate(item.lastUsed),
                  sortingField: 'lastUsed'
                }
              ]}
              items={templateStats}
              sortingDescending
              sortingColumn={{ sortingField: 'usageCount' }}
              variant="embedded"
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No templates used yet</b>
                </Box>
              }
            />
          )}
        </ExpandableSection>

        {/* Field Usage Statistics */}
        <ExpandableSection
          headerText="Field Usage Statistics"
          variant="container"
          defaultExpanded={fieldStats.length > 0}
        >
          {fieldStats.length === 0 ? (
            <Alert type="info">
              No field usage data available yet. Fields will appear here once they are used in queries.
            </Alert>
          ) : (
            <Table
              columnDefinitions={[
                {
                  id: 'field',
                  header: 'Field',
                  cell: item => (
                    <Box>
                      <strong>{item.fieldLabel}</strong>
                      <br />
                      <Box variant="small" color="text-body-secondary">
                        {item.fieldPath}
                      </Box>
                    </Box>
                  ),
                  sortingField: 'fieldLabel'
                },
                {
                  id: 'dataType',
                  header: 'Type',
                  cell: item => (
                    <Badge color={
                      item.dataType === 'string' ? 'blue' :
                      item.dataType === 'number' ? 'green' :
                      'grey'
                    }>
                      {item.dataType}
                    </Badge>
                  ),
                  sortingField: 'dataType'
                },
                {
                  id: 'usage',
                  header: 'Usage Count',
                  cell: item => item.usageCount,
                  sortingField: 'usageCount'
                },
                {
                  id: 'operators',
                  header: 'Common Operators',
                  cell: item => (
                    <Box>
                      {item.mostCommonOperators.slice(0, 3).map((op, idx) => (
                        <Badge key={idx} color="grey">
                          {op.operator} ({op.count})
                        </Badge>
                      ))}
                    </Box>
                  )
                },
                {
                  id: 'lastUsed',
                  header: 'Last Used',
                  cell: item => formatDate(item.lastUsed),
                  sortingField: 'lastUsed'
                }
              ]}
              items={fieldStats}
              sortingDescending
              sortingColumn={{ sortingField: 'usageCount' }}
              variant="embedded"
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No fields used yet</b>
                </Box>
              }
            />
          )}
        </ExpandableSection>

        {/* Error Statistics */}
        <ExpandableSection
          headerText="Error Analysis"
          variant="container"
          defaultExpanded={errorStats.length > 0}
        >
          {errorStats.length === 0 ? (
            <Alert type="success">
              <strong>No errors recorded!</strong> All queries have executed successfully.
            </Alert>
          ) : (
            <>
              <Alert type="warning" header={`${errorStats.length} Error Type(s) Detected`}>
                Review the errors below to identify common issues and improve query builder usability.
              </Alert>
              <Table
                columnDefinitions={[
                  {
                    id: 'errorType',
                    header: 'Error Type',
                    cell: item => (
                      <Badge color="red">{item.errorType}</Badge>
                    ),
                    sortingField: 'errorType'
                  },
                  {
                    id: 'count',
                    header: 'Occurrences',
                    cell: item => item.count,
                    sortingField: 'count'
                  },
                  {
                    id: 'example',
                    header: 'Example Message',
                    cell: item => (
                      <Box variant="small" color="text-status-error">
                        {item.exampleMessage}
                      </Box>
                    )
                  },
                  {
                    id: 'lastOccurred',
                    header: 'Last Occurred',
                    cell: item => formatDate(item.lastOccurred),
                    sortingField: 'lastOccurred'
                  }
                ]}
                items={errorStats}
                sortingDescending
                sortingColumn={{ sortingField: 'count' }}
                variant="embedded"
              />
            </>
          )}
        </ExpandableSection>

        {/* Data Management */}
        <Alert type="info">
          <SpaceBetween size="xs">
            <Box variant="p">
              <strong>Data Storage:</strong> Analytics data is stored locally in your browser. 
              It includes the last 1,000 events and 500 query executions.
            </Box>
            <Box variant="p">
              <strong>Privacy:</strong> No analytics data is sent to external servers. 
              All tracking happens locally in your browser.
            </Box>
            <Box variant="p">
              <strong>Export:</strong> Click "Export Data" to download your analytics as JSON for further analysis.
            </Box>
          </SpaceBetween>
        </Alert>
      </SpaceBetween>
    </Container>
  );
};
