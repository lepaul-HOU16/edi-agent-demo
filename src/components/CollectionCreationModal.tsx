'use client';

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
 * - 100px top and bottom margins from viewport
 * - Max height: calc(100vh - 200px)
 * - Responsive behavior for different screen sizes
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
      <style jsx global>{`
        /* Responsive modal styling */
        .collection-modal-container .awsui-modal-container {
          width: 60% !important;
          max-width: 60% !important;
          max-height: calc(100vh - 200px) !important;
          margin-top: 100px !important;
          margin-bottom: 100px !important;
        }
        
        .collection-modal-container .awsui-modal-content {
          max-height: calc(100vh - 300px) !important;
          overflow-y: auto !important;
        }
        
        /* Mobile responsive - 90% width on small screens */
        @media (max-width: 768px) {
          .collection-modal-container .awsui-modal-container {
            width: 90% !important;
            max-width: 90% !important;
          }
        }
        
        /* Tablet responsive - 75% width on medium screens */
        @media (min-width: 769px) and (max-width: 1024px) {
          .collection-modal-container .awsui-modal-container {
            width: 75% !important;
            max-width: 75% !important;
          }
        }
        
        /* Ensure modal is centered */
        .collection-modal-container {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
        }
      `}</style>
      
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
            <Alert
              statusIconAriaLabel="Info"
              type="info"
              header="Collection Management (Beta)"
            >
              Collections help you organize and manage curated datasets for AI-powered analysis. 
              This feature is currently in beta testing.
            </Alert>

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

            {!showItemSelection && dataItems.length > 0 && (
              <Alert
                type="info"
                header={`${dataItems.length} data items will be included`}
              >
                All current search results will be added to this collection.
              </Alert>
            )}
          </SpaceBetween>
        </Modal>
      </div>
    </>
  );
}
