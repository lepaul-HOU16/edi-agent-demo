
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
 * - Fixed width: 900px (max 90vw on mobile)
 * - Auto height with max 85vh
 * - Centered with buffer from edges
 * - z-index above TopNavBar
 * - Uses .collection-creation-modal class for CSS targeting
 * 
 * Version: 4.0 (Updated 2025-01-15 - CLASS-BASED STYLING)
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
  
  // Add specific class to modal container for CSS targeting
  React.useEffect(() => {
    if (visible) {
      // Find the modal dialog and add our class
      const timer = setTimeout(() => {
        // Try multiple selectors to find the modal
        const modalDialog = document.querySelector('.awsui_dialog_1d217_1e7ip_169') ||
                           document.querySelector('[class*="awsui_dialog"]') ||
                           document.querySelector('[role="dialog"]');
        if (modalDialog) {
          modalDialog.classList.add('collection-creation-modal');
          console.log('✅ Added collection-creation-modal class to:', modalDialog);
        } else {
          console.warn('❌ Could not find modal dialog to add class');
        }
      }, 100); // Increased timeout to ensure modal is rendered
      
      return () => {
        clearTimeout(timer);
        // Remove class when modal closes
        const modalDialog = document.querySelector('.collection-creation-modal');
        if (modalDialog) {
          modalDialog.classList.remove('collection-creation-modal');
          console.log('🗑️ Removed collection-creation-modal class');
        }
      };
    }
  }, [visible]);
  
  return (
    <Modal
      onDismiss={onDismiss}
      visible={visible}
      closeAriaLabel="Close modal"
      header="Create Data Collection from Search Results"
      size="large"
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
      <Box padding={{ bottom: 'l' }}>
        <SpaceBetween direction="vertical" size="l">
          <FormField
            label="Collection Name"
            description="Choose a descriptive name for your data collection"
            stretch={true}
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
            stretch={true}
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
              stretch={true}
            >
              <Table
                columnDefinitions={[
                  {
                    id: 'name',
                    header: 'Name',
                    cell: item => item.name || item.id,
                    sortingField: 'name',
                    width: 200
                  },
                  {
                    id: 'type',
                    header: 'Type',
                    cell: item => item.type || 'Well',
                    sortingField: 'type',
                    width: 120
                  },
                  {
                    id: 'location',
                    header: 'Location',
                    cell: item => item.location || '-',
                    sortingField: 'location',
                    width: 200
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
                    sortingField: 'dataSource',
                    width: 100
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
      </Box>
    </Modal>
  );
}
