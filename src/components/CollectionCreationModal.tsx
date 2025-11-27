
import React from 'react';
import {
  Modal,
  Box,
  SpaceBetween,
  Button,
  FormField,
  Input,
  Textarea,
  Alert,
  Table
} from '@cloudscape-design/components';

interface DataItem {
  id: string;
  name: string;
  type?: string;
  location?: string;
  depth?: string;
  operator?: string;
  coordinates?: [number, number];
  dataSource?: 'OSDU' | 'catalog' | string; // Track data source
  osduId?: string; // OSDU record ID if from OSDU
  _osduOriginal?: any; // Original OSDU record data
  [key: string]: any;
}

interface CollectionCreationModalProps {
  visible: boolean;
  onDismiss: () => void;
  collectionName: string;
  collectionDescription: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreateCollection: () => void;
  creating: boolean;
  dataItems?: DataItem[];
  selectedItems?: DataItem[];
  onSelectionChange?: (items: DataItem[]) => void;
  showItemSelection?: boolean;
}

/**
 * Responsive Collection Creation Modal
 * 
 * Styling:
 * - 60% viewport width on desktop (90% on mobile)
 * - Centered horizontally
 * - 150px top and bottom margins from viewport
 * - Max height: calc(100vh - 300px)
 * - Responsive behavior for different screen sizes
 * - No beta alerts
 * - Individual checkbox selection enabled
 * 
 * Version: 2.0 (Updated 2025-01-15)
 */
export default function CollectionCreationModal({
  visible,
  onDismiss,
  collectionName,
  collectionDescription,
  onNameChange,
  onDescriptionChange,
  onCreateCollection,
  creating,
  dataItems = [],
  selectedItems = [],
  onSelectionChange,
  showItemSelection = false
}: CollectionCreationModalProps) {
  
  return (
    <>
      
      <div className="collection-modal-container">
        <Modal
          onDismiss={onDismiss}
          visible={visible}
          closeAriaLabel="Close modal"
          header="Create Data Collection from Search Results"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button 
                  variant="link" 
                  onClick={onDismiss}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={onCreateCollection}
                  loading={creating}
                  disabled={!collectionName.trim()}
                >
                  Create Collection
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <FormField
              label="Collection Name"
              description="Choose a descriptive name for your data collection"
            >
              <Input
                value={collectionName}
                onChange={({ detail }) => onNameChange(detail.value)}
                placeholder="e.g., Cuu Long Basin Production Wells"
                disabled={creating}
              />
            </FormField>

            <FormField
              label="Description (Optional)"
              description="Provide additional context about this collection"
            >
              <Textarea
                value={collectionDescription}
                onChange={({ detail }) => onDescriptionChange(detail.value)}
                placeholder="Describe the purpose and contents of this collection..."
                rows={3}
                disabled={creating}
              />
            </FormField>

            {showItemSelection && dataItems.length > 0 && (
              <FormField
                label="Data Items"
                description={`Select the items to include in this collection (${selectedItems.length} of ${dataItems.length} selected)`}
              >
                <Table
                  columnDefinitions={[
                    {
                      id: 'name',
                      header: 'Name',
                      cell: item => item.name || item.id,
                      sortingField: 'name'
                    },
                    {
                      id: 'type',
                      header: 'Type',
                      cell: item => item.type || 'Well',
                      sortingField: 'type'
                    },
                    {
                      id: 'location',
                      header: 'Location',
                      cell: item => item.location || '-',
                      sortingField: 'location'
                    },
                    {
                      id: 'dataSource',
                      header: 'Source',
                      cell: item => {
                        const source = item.dataSource || 'catalog';
                        return (
                          <Box>
                            {source === 'OSDU' ? (
                              <span style={{ 
                                backgroundColor: '#0972d3', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                OSDU
                              </span>
                            ) : (
                              <span style={{ 
                                backgroundColor: '#037f0c', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                Catalog
                              </span>
                            )}
                          </Box>
                        );
                      },
                      sortingField: 'dataSource'
                    }
                  ]}
                  items={dataItems}
                  selectionType="multi"
                  selectedItems={selectedItems}
                  onSelectionChange={({ detail }) => {
                    if (onSelectionChange) {
                      onSelectionChange(detail.selectedItems as DataItem[]);
                    }
                  }}
                  trackBy="id"
                  empty={
                    <Box textAlign="center" color="inherit">
                      <b>No data items available</b>
                    </Box>
                  }
                  variant="embedded"
                />
              </FormField>
            )}

            {!showItemSelection && dataItems.length > 0 && (() => {
              const osduCount = dataItems.filter(item => item.dataSource === 'OSDU').length;
              const catalogCount = dataItems.length - osduCount;
              
              return (
                <Alert
                  type="info"
                  header={`${dataItems.length} data items will be included`}
                >
                  All current search results will be added to this collection.
                  {osduCount > 0 && catalogCount > 0 && (
                    <Box margin={{ top: 'xs' }}>
                      <strong>Data Sources:</strong> {catalogCount} catalog records + {osduCount} OSDU records
                    </Box>
                  )}
                  {osduCount > 0 && catalogCount === 0 && (
                    <Box margin={{ top: 'xs' }}>
                      <strong>Data Source:</strong> {osduCount} OSDU records
                    </Box>
                  )}
                  {catalogCount > 0 && osduCount === 0 && (
                    <Box margin={{ top: 'xs' }}>
                      <strong>Data Source:</strong> {catalogCount} catalog records
                    </Box>
                  )}
                </Alert>
              );
            })()}
          </SpaceBetween>
        </Modal>
      </div>
    </>
  );
}
