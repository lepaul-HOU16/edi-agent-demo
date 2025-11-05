import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Badge,
  ColumnLayout,
  Alert,
  Link,
  Table,
  StatusIndicator
} from '@cloudscape-design/components';

interface OSDURecord {
  id: string;
  name: string;
  type: string;
  company?: string;
  field?: string;
  basin?: string;
  country?: string;
  location?: string;
  depth?: string;
  logType?: string;
  dataSource: string;
}

interface OSDUSearchResponseProps {
  answer: string;
  recordCount: number;
  records: OSDURecord[];
  query: string;
}

/**
 * Professional Cloudscape-styled component for displaying OSDU search results
 */
export const OSDUSearchResponse: React.FC<OSDUSearchResponseProps> = ({
  answer,
  recordCount,
  records,
  query
}) => {
  // Parse answer text to extract key information
  const hasRecords = records && records.length > 0;
  const displayCount = Math.min(records?.length || 0, 10);

  return (
    <SpaceBetween size="l">
      {/* Header Section */}
      <Container
        header={
          <Header
            variant="h2"
            description={`Query: "${query}"`}
            actions={
              <Badge color={hasRecords ? "green" : "grey"}>
                {recordCount} {recordCount === 1 ? 'record' : 'records'} found
              </Badge>
            }
          >
            🔍 OSDU Search Results
          </Header>
        }
      >
        <Box variant="p">{answer}</Box>
      </Container>

      {/* Summary Statistics */}
      {hasRecords && (
        <Container>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Found</Box>
              <Box variant="awsui-value-large">{recordCount}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Showing</Box>
              <Box variant="awsui-value-large">{displayCount}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Data Source</Box>
              <Box variant="awsui-value-large">
                <Badge color="blue">OSDU</Badge>
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Status</Box>
              <StatusIndicator type="success">Available</StatusIndicator>
            </div>
          </ColumnLayout>
        </Container>
      )}

      {/* Records Table */}
      {hasRecords ? (
        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: 'Well/Record Name',
              cell: (item: OSDURecord) => (
                <Link href="#" variant="primary">
                  {item.name}
                </Link>
              ),
              sortingField: 'name',
              width: 200
            },
            {
              id: 'type',
              header: 'Type',
              cell: (item: OSDURecord) => (
                <Badge color="blue">{item.type}</Badge>
              ),
              sortingField: 'type',
              width: 180
            },
            {
              id: 'company',
              header: 'Operator',
              cell: (item: OSDURecord) => item.company || 'Unknown',
              sortingField: 'company',
              width: 150
            },
            {
              id: 'location',
              header: 'Location',
              cell: (item: OSDURecord) => (
                <SpaceBetween size="xxs" direction="horizontal">
                  {item.field && <span>📍 {item.field}</span>}
                  {item.country && <Badge>{item.country}</Badge>}
                </SpaceBetween>
              ),
              width: 200
            },
            {
              id: 'basin',
              header: 'Basin',
              cell: (item: OSDURecord) => item.basin || '-',
              sortingField: 'basin',
              width: 150
            },
            {
              id: 'depth',
              header: 'Depth',
              cell: (item: OSDURecord) => item.depth || '-',
              width: 120
            },
            {
              id: 'logType',
              header: 'Log Type',
              cell: (item: OSDURecord) => item.logType || '-',
              sortingField: 'logType',
              width: 150
            }
          ]}
          items={records.slice(0, 10)}
          loadingText="Loading OSDU records"
          sortingDisabled={false}
          variant="container"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No records found</b>
              <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                Try adjusting your search criteria.
              </Box>
            </Box>
          }
          header={
            <Header
              counter={`(${displayCount}/${recordCount})`}
              description="OSDU subsurface data records"
            >
              Record Details
            </Header>
          }
        />
      ) : (
        <Alert
          statusIconAriaLabel="Info"
          header="No records found"
        >
          <SpaceBetween size="s">
            <Box>No OSDU records matched your search criteria.</Box>
            <Box variant="p">
              <strong>Suggestions:</strong>
              <ul>
                <li>Try different search terms</li>
                <li>Check with your OSDU administrator about available data</li>
                <li>Verify your access permissions</li>
              </ul>
            </Box>
          </SpaceBetween>
        </Alert>
      )}

      {/* Additional Actions */}
      {hasRecords && recordCount > displayCount && (
        <Alert
          statusIconAriaLabel="Info"
          type="info"
        >
          Showing first {displayCount} of {recordCount} records. 
          Refine your search query to see more specific results.
        </Alert>
      )}
    </SpaceBetween>
  );
};

/**
 * Error response component for OSDU search failures
 */
export const OSDUErrorResponse: React.FC<{
  errorType: 'timeout' | 'auth' | 'network' | 'config' | 'rate-limit' | 'generic';
  errorMessage: string;
  query: string;
}> = ({ errorType, errorMessage, query }) => {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'timeout':
        return {
          type: 'warning' as const,
          icon: '⏰',
          title: 'Request Timeout',
          suggestions: [
            'Try a more specific search query',
            'Reduce the search scope',
            'Try again in a few moments'
          ]
        };
      case 'auth':
        return {
          type: 'error' as const,
          icon: '🚫',
          title: 'Access Denied',
          suggestions: [
            'Verify your access rights with your administrator',
            'Check if your OSDU credentials are valid',
            'Contact support if the issue persists'
          ]
        };
      case 'network':
        return {
          type: 'error' as const,
          icon: '🌐',
          title: 'Network Error',
          suggestions: [
            'Check your internet connection',
            'Try again in a few moments',
            'Contact your administrator if the problem persists'
          ]
        };
      case 'config':
        return {
          type: 'error' as const,
          icon: '🔧',
          title: 'Service Not Configured',
          suggestions: [
            'Contact your administrator to set up OSDU integration',
            'Verify the OSDU API configuration',
            'Check system status with your IT team'
          ]
        };
      case 'rate-limit':
        return {
          type: 'warning' as const,
          icon: '⏱️',
          title: 'Rate Limit Exceeded',
          suggestions: [
            'Wait a moment before trying again',
            'Try a more specific search query',
            'Contact your administrator about rate limits'
          ]
        };
      default:
        return {
          type: 'error' as const,
          icon: '❌',
          title: 'OSDU Search Error',
          suggestions: [
            'Try again later',
            'Contact your administrator if the problem persists'
          ]
        };
    }
  };

  const config = getErrorConfig();

  return (
    <SpaceBetween size="l">
      <Alert
        statusIconAriaLabel="Error"
        type={config.type}
        header={`${config.icon} ${config.title}`}
      >
        <SpaceBetween size="m">
          <Box>
            <strong>Query:</strong> "{query}"
          </Box>
          <Box>
            Unable to search OSDU data at this time.
          </Box>
          {errorMessage && (
            <Box variant="small">
              <strong>Details:</strong> {errorMessage}
            </Box>
          )}
          <Box>
            <strong>Suggestions:</strong>
            <ul>
              {config.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </Box>
        </SpaceBetween>
      </Alert>

      <Alert
        statusIconAriaLabel="Info"
        type="info"
        header="💡 Alternative"
      >
        Try a regular catalog search by removing "OSDU" from your query to search local data instead.
      </Alert>
    </SpaceBetween>
  );
};

export default OSDUSearchResponse;
