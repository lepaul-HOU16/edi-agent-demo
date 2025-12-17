import React, { useState, useEffect } from 'react';
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
  StatusIndicator,
  Pagination
} from '@cloudscape-design/components';
import './OSDUSearchResponse.css';

interface OSDURecord {
  id: string;
  name: string;
  type: string;
  operator?: string;
  location?: string;
  basin?: string;
  country?: string;
  depth?: string;
  logType?: string;
  status?: string;
  dataSource: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface FilterCriteria {
  type: 'operator' | 'location' | 'depth' | 'type' | 'status';
  value: string | number;
  operator?: '>' | '<' | '=' | 'contains';
}

interface OSDUSearchResponseProps {
  answer: string;
  recordCount: number;
  records: OSDURecord[];
  query: string;
  // TASK 6: Enhanced filter display properties
  filterApplied?: boolean;
  filterDescription?: string;
  originalRecordCount?: number;
  activeFilters?: FilterCriteria[];
}

/**
 * Professional Cloudscape-styled component for displaying OSDU search results
 */
export const OSDUSearchResponse: React.FC<OSDUSearchResponseProps> = ({
  answer,
  recordCount,
  records,
  query,
  filterApplied = false,
  filterDescription,
  originalRecordCount,
  activeFilters = []
}) => {
  // TASK 17: Pagination state
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const pageSize = 1000; // Show ALL records
  const tableRef = React.useRef<HTMLDivElement>(null);
  
  // TASK 20: Reset pagination when records array changes
  useEffect(() => {
    // Reset to page 1 when records change (new search or filter applied)
    console.log('🔄 [OSDUSearchResponse] Records array changed, resetting pagination to page 1');
    console.log('📊 [OSDUSearchResponse] New record count:', records.length);
    console.log('📄 [OSDUSearchResponse] Previous page index:', currentPageIndex);
    
    setCurrentPageIndex(1);
    
    console.log('✅ [OSDUSearchResponse] Pagination reset complete');
  }, [records]); // Dependency on records array - triggers when reference changes
  
  // Scroll to table when page changes
  useEffect(() => {
    if (tableRef.current && currentPageIndex > 1) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPageIndex]);
  
  // Parse answer text to extract key information
  const hasRecords = records && records.length > 0;
  
  // TASK 17: Calculate pagination
  const startIndex = (currentPageIndex - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = records.slice(startIndex, endIndex);
  const totalPages = Math.ceil(records.length / pageSize);
  
  // Update display count for summary
  const displayCount = paginatedRecords.length;
  const showingStart = records.length > 0 ? startIndex + 1 : 0;
  const showingEnd = startIndex + displayCount;

  // TASK 6: Format filter badges for display
  const formatFilterBadge = (filter: FilterCriteria) => {
    const operatorDisplay = filter.operator === 'contains' 
      ? '⊃' 
      : filter.operator === '>' 
      ? '>' 
      : filter.operator === '<' 
      ? '<' 
      : filter.operator === '=' 
      ? '=' 
      : '';
    
    return `${filter.type}: ${operatorDisplay} ${filter.value}`;
  };

  return (
    <SpaceBetween size="l">
      {/* TASK 6: Filter Status Banner */}
      {filterApplied && activeFilters.length > 0 && (
        <Alert
          statusIconAriaLabel="Info"
          type="info"
          header="🔍 Filters Applied"
        >
          <SpaceBetween size="s">
            <Box>
              <strong>Active Filters:</strong>
            </Box>
            <SpaceBetween direction="horizontal" size="xs">
              {activeFilters.map((filter, index) => (
                <Badge key={index} color="blue">
                  {formatFilterBadge(filter)}
                </Badge>
              ))}
            </SpaceBetween>
            {originalRecordCount && (
              <Box variant="small">
                Showing {recordCount} of {originalRecordCount} original records
              </Box>
            )}
          </SpaceBetween>
        </Alert>
      )}

      {/* Header Section - Removed query block */}

      {/* Removed verbose summary statistics - info shown in table header */}

      {/* Records Table */}
      {hasRecords ? (
        <div ref={tableRef} style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <div className="osdu-search-results-table">
            <Table
            columnDefinitions={[
            {
              id: 'name',
              header: 'Well Name',
              cell: (item: OSDURecord) => (
                <div 
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.name}
                >
                  <Link href="#" variant="primary">
                    {item.name}
                  </Link>
                </div>
              ),
              sortingField: 'name',
              width: '40%'
            },
            {
              id: 'type',
              header: 'Type',
              cell: (item: OSDURecord) => {
                // Extract just the last part after the last hyphen for cleaner display
                const parts = item.type.split('-');
                const displayType = parts[parts.length - 1];
                return <Badge color="blue">{displayType}</Badge>;
              },
              sortingField: 'type',
              width: '20%'
            },
            {
              id: 'operator',
              header: 'Operator',
              cell: (item: OSDURecord) => (
                <div 
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.operator || '-'}
                >
                  {item.operator || '-'}
                </div>
              ),
              sortingField: 'operator',
              width: '20%'
            },
            {
              id: 'location',
              header: 'Location',
              cell: (item: OSDURecord) => (
                <div 
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.location || '-'}
                >
                  {item.location || '-'}
                </div>
              ),
              width: '20%'
            }
          ]}
          items={paginatedRecords}
          loadingText="Loading OSDU records"
          sortingDisabled={false}
          variant="container"
          wrapLines={false}
          stripedRows={true}
          stickyHeader={true}
          contentDensity="compact"
          resizableColumns={false}
          columnDisplay={[
            { id: 'name', visible: true },
            { id: 'type', visible: true },
            { id: 'operator', visible: true },
            { id: 'location', visible: true }
          ]}
          pagination={
            <Pagination
              currentPageIndex={currentPageIndex}
              onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
              pagesCount={totalPages}
              ariaLabels={{
                nextPageLabel: "Next page",
                previousPageLabel: "Previous page",
                pageLabel: pageNumber => `Page ${pageNumber} of ${totalPages}`
              }}
            />
          }
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
              counter={`(${showingStart}-${showingEnd} of ${recordCount})`}
            >
              Record Details
            </Header>
          }
        />
          </div>
        </div>
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
      {hasRecords && recordCount > records.length && (
        <Alert
          statusIconAriaLabel="Info"
          type="info"
        >
          <SpaceBetween size="s">
            <Box>
              <strong>Note:</strong> OSDU API returned {records.length} records out of {recordCount} total found.
            </Box>
            <Box variant="small">
              The external OSDU service limits results per request. Refine your search query for more specific results.
            </Box>
          </SpaceBetween>
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
