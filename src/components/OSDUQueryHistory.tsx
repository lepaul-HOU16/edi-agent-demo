/**
 * OSDU Query History Component
 * 
 * Displays previous queries with timestamps and result counts.
 * Allows users to load, delete, and manage query history.
 * 
 * Requirements: 10.2, 10.3, 10.5
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Table,
  Badge,
  TextFilter,
  Alert,
  Modal
} from '@cloudscape-design/components';
import { QueryHistory, QueryHistoryItem, QueryCriterion } from '@/utils/queryHistory';

interface OSDUQueryHistoryProps {
  onLoadQuery: (item: QueryHistoryItem) => void;
  onClose: () => void;
}

export const OSDUQueryHistory: React.FC<OSDUQueryHistoryProps> = ({
  onLoadQuery,
  onClose
}) => {
  const [historyItems, setHistoryItems] = useState<QueryHistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<QueryHistoryItem[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedItems, setSelectedItems] = useState<QueryHistoryItem[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [stats, setStats] = useState<{
    totalQueries: number;
    dataTypeBreakdown: Record<string, number>;
    averageResultCount: number;
  } | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Filter items when filter text changes
  useEffect(() => {
    if (filterText) {
      const filtered = QueryHistory.search(filterText);
      setFilteredItems(filtered);
    } else {
      setFilteredItems(historyItems);
    }
  }, [filterText, historyItems]);

  const loadHistory = () => {
    const items = QueryHistory.getAll();
    setHistoryItems(items);
    setFilteredItems(items);
    setStats(QueryHistory.getStats());
  };

  const handleLoadQuery = (item: QueryHistoryItem) => {
    onLoadQuery(item);
    onClose();
  };

  const handleDeleteQuery = (id: string) => {
    QueryHistory.delete(id);
    loadHistory();
    setSelectedItems([]);
  };

  const handleClearAll = () => {
    QueryHistory.clear();
    loadHistory();
    setSelectedItems([]);
    setShowClearConfirm(false);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getDataTypeBadgeColor = (dataType: string): 'blue' | 'green' | 'red' | 'grey' => {
    switch (dataType) {
      case 'well': return 'blue';
      case 'wellbore': return 'green';
      case 'log': return 'red';
      case 'seismic': return 'grey';
      default: return 'grey';
    }
  };

  return (
    <>
      <div style={{ width: '100%' }}>
        <SpaceBetween size="l">
          {/* Header Actions */}
          <Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => setShowClearConfirm(true)}
                disabled={historyItems.length === 0}
              >
                Clear All
              </Button>
              <Button onClick={onClose} variant="link">
                Close
              </Button>
            </SpaceBetween>
          </Box>
          {/* Statistics */}
          {stats && stats.totalQueries > 0 && (
            <Box>
              <SpaceBetween direction="horizontal" size="l">
                <Box>
                  <Box variant="awsui-key-label">Total Queries</Box>
                  <Box variant="h3">{stats.totalQueries}</Box>
                </Box>
                <Box>
                  <Box variant="awsui-key-label">Avg Results</Box>
                  <Box variant="h3">{Math.round(stats.averageResultCount)}</Box>
                </Box>
                {Object.entries(stats.dataTypeBreakdown).map(([type, count]) => (
                  <Box key={type}>
                    <Box variant="awsui-key-label">{type.charAt(0).toUpperCase() + type.slice(1)}</Box>
                    <Box variant="h3">{count}</Box>
                  </Box>
                ))}
              </SpaceBetween>
            </Box>
          )}

          {/* Empty State */}
          {historyItems.length === 0 && (
            <Alert type="info">
              No query history yet. Execute queries using the Query Builder to see them here.
            </Alert>
          )}

          {/* History Table */}
          {historyItems.length > 0 && (
            <Table
              columnDefinitions={[
                {
                  id: 'timestamp',
                  header: 'Time',
                  cell: (item: QueryHistoryItem) => formatTimestamp(item.timestamp),
                  width: 120,
                  sortingField: 'timestamp'
                },
                {
                  id: 'dataType',
                  header: 'Type',
                  cell: (item: QueryHistoryItem) => (
                    <Badge color={getDataTypeBadgeColor(item.dataType)}>
                      {item.dataType.charAt(0).toUpperCase() + item.dataType.slice(1)}
                    </Badge>
                  ),
                  width: 100
                },
                {
                  id: 'query',
                  header: 'Query',
                  cell: (item: QueryHistoryItem) => (
                    <Box>
                      <code style={{ 
                        fontSize: '12px',
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '400px'
                      }}>
                        {item.query}
                      </code>
                    </Box>
                  )
                },
                {
                  id: 'criteria',
                  header: 'Criteria',
                  cell: (item: QueryHistoryItem) => (
                    <Badge>{item.criteria.length} filter{item.criteria.length !== 1 ? 's' : ''}</Badge>
                  ),
                  width: 100
                },
                {
                  id: 'results',
                  header: 'Results',
                  cell: (item: QueryHistoryItem) => (
                    item.resultCount !== undefined 
                      ? <Badge color="green">{item.resultCount}</Badge>
                      : <Badge color="grey">-</Badge>
                  ),
                  width: 100
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (item: QueryHistoryItem) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        variant="inline-link"
                        onClick={() => handleLoadQuery(item)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="inline-link"
                        onClick={() => handleDeleteQuery(item.id)}
                      >
                        Delete
                      </Button>
                    </SpaceBetween>
                  ),
                  width: 150
                }
              ]}
              items={filteredItems}
              selectionType="multi"
              selectedItems={selectedItems}
              onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
              sortingDisabled={false}
              empty={
                <Box textAlign="center" color="inherit">
                  <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                    No queries match the filter
                  </Box>
                </Box>
              }
              filter={
                <TextFilter
                  filteringText={filterText}
                  filteringPlaceholder="Search queries..."
                  onChange={({ detail }) => setFilterText(detail.filteringText)}
                  countText={`${filteredItems.length} ${filteredItems.length === 1 ? 'query' : 'queries'}`}
                />
              }
              header={
                <Header
                  counter={`(${historyItems.length})`}
                  actions={
                    <Button
                      disabled={selectedItems.length === 0}
                      onClick={() => {
                        selectedItems.forEach(item => handleDeleteQuery(item.id));
                      }}
                    >
                      Delete Selected
                    </Button>
                  }
                >
                  Previous Queries
                </Header>
              }
            />
          )}
        </SpaceBetween>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        visible={showClearConfirm}
        onDismiss={() => setShowClearConfirm(false)}
        header="Clear All Query History"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleClearAll}>
                Clear All
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box>
            Are you sure you want to clear all query history? This action cannot be undone.
          </Box>
          <Alert type="warning">
            This will permanently delete {historyItems.length} {historyItems.length === 1 ? 'query' : 'queries'} from your history.
          </Alert>
        </SpaceBetween>
      </Modal>
    </>
  );
};
