'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Badge,
  BreadcrumbGroup,
  Cards,
  Container,
  ContentLayout,
  Grid,
  Header,
  SpaceBetween,
  Button,
  Pagination,
  Modal,
  FormField,
  Input,
  Textarea,
  Box,
  StatusIndicator,
  Icon
} from '@cloudscape-design/components';
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/../amplify/data/resource";
import { withAuth } from '@/components/WithAuth';
import { isCollectionsEnabled, isCollectionCreationEnabled } from '@/services/featureFlags';

const amplifyClient = generateClient<Schema>();

function CollectionManagementPageBase() {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'collections' | 'all-sessions'>('collections');
  
  // Create collection form state
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // All sessions state (moved to top to avoid hook order violations)
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Feature flag check
  const userContext = { userId: 'current-user' }; // In production, get from auth
  const collectionsEnabled = isCollectionsEnabled(userContext);
  const creationEnabled = isCollectionCreationEnabled(userContext);

  // Load collections on mount
  useEffect(() => {
    if (collectionsEnabled) {
      loadCollections();
    }
  }, [collectionsEnabled]);

  // Load existing chat sessions (moved to top to avoid hook order violations)
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        setLoadingSessions(true);
        const response = await amplifyClient.models.ChatSession.list();
        setChatSessions(response.data || []);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };

    if (viewMode === 'all-sessions') {
      loadChatSessions();
    }
  }, [viewMode]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await amplifyClient.queries.collectionQuery({
        operation: 'listCollections'
      });
      if (response.data) {
        const collectionsData = JSON.parse(response.data);
        setCollections(collectionsData.collections || []);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionName.trim() || !creationEnabled) return;
    
    try {
      setCreating(true);
      const response = await amplifyClient.mutations.collectionManagement({
        operation: 'createCollection',
        name: collectionName.trim(),
        description: collectionDescription.trim(),
        dataSourceType: 'Mixed',
        previewMetadata: JSON.stringify({
          wellCount: 0,
          dataPointCount: 0,
          createdFrom: 'manual'
        })
      });
      
      if (response.data) {
        await loadCollections(); // Refresh the list
        setShowCreateModal(false);
        setCollectionName('');
        setCollectionDescription('');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCollectionSelect = (collection: any) => {
    setSelectedCollection(collection);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDataSourceBadgeColor = (dataSourceType: string) => {
    switch (dataSourceType) {
      case 'OSDU': return 'blue';
      case 'S3': return 'green';
      case 'Mixed': return 'grey';
      default: return 'blue';
    }
  };

  // Feature flag fallback - redirect to catalog if collections disabled
  if (!collectionsEnabled) {
    return (
      <div style={{ margin: '36px 80px 0' }}>
        <ContentLayout
          disableOverlap
          headerVariant="divider"
          header={
            <Header variant="h1">
              Collections (Beta Feature)
            </Header>
          }
        >
          <Alert
            statusIconAriaLabel="Info"
            type="info"
            header="Collection Management Coming Soon"
          >
            <Box>
              The collection management feature is currently in development. 
              You can continue using the Data Catalog for all your data discovery and analysis needs.
            </Box>
            <Box margin={{ top: 'm' }}>
              <Button variant="primary" href="/catalog">
                Go to Data Catalog
              </Button>
            </Box>
          </Alert>
        </ContentLayout>
      </div>
    );
  }

  if (viewMode === 'collections') {
    return (
      <div style={{ margin: '36px 80px 0' }}>
        <ContentLayout
          disableOverlap
          headerVariant="divider"
          header={
            <Header
              variant="h1"
              actions={
                <SpaceBetween direction="horizontal" size="m">
                  <Button 
                    variant="normal"
                    onClick={() => setViewMode('all-sessions')}
                  >
                    Show All Sessions
                  </Button>
                  {creationEnabled && (
                    <Button 
                      variant="primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create New Collection
                    </Button>
                  )}
                </SpaceBetween>
              }
            >
              Data Collections & Workspaces
            </Header>
          }
        >
          {selectedCollection ? (
            // Selected Collection View with Canvases
            <SpaceBetween direction="vertical" size="l">
              <Container
                header={
                  <Header
                    variant="h2"
                    actions={
                      <SpaceBetween direction="horizontal" size="s">
                        <Button 
                          variant="link"
                          onClick={() => setSelectedCollection(null)}
                        >
                          ← Back to Collections
                        </Button>
                        <Button iconName="edit">Edit Collection</Button>
                        <Button iconName="copy">Duplicate</Button>
                        <Button iconName="remove">Archive</Button>
                      </SpaceBetween>
                    }
                  >
                    🗂️ {selectedCollection.name}
                  </Header>
                }
              >
                <SpaceBetween direction="vertical" size="l">
                  <Grid
                    gridDefinition={[
                      { colspan: { default: 12, xs: 4 } },
                      { colspan: { default: 12, xs: 4 } },
                      { colspan: { default: 12, xs: 4 } }
                    ]}
                  >
                    <Box>
                      <Box variant="h3">📊 Data Summary</Box>
                      <Box>
                        {selectedCollection.previewMetadata?.wellCount || 0} Wells • 
                        {selectedCollection.previewMetadata?.dataPointCount || 0} Data Points
                      </Box>
                    </Box>
                    <Box>
                      <Box variant="h3">🗺️ Data Sources</Box>
                      <Box>{selectedCollection.previewMetadata?.dataSources?.join(', ') || selectedCollection.dataSourceType}</Box>
                    </Box>
                    <Box>
                      <Box variant="h3">📅 Last Modified</Box>
                      <Box>{formatDate(selectedCollection.lastAccessedAt)}</Box>
                    </Box>
                  </Grid>

                  <SpaceBetween direction="horizontal" size="m">
                    <Button variant="primary" iconName="external" href="/catalog">
                      View Collection Data
                    </Button>
                    <Button variant="normal" iconName="add-plus" href="/create-new-chat">
                      Create New Canvas
                    </Button>
                  </SpaceBetween>
                </SpaceBetween>
              </Container>

              {/* Canvas Cards Section */}
              <Container
                header={
                  <Header variant="h3">
                    Workspace Canvases (Coming Soon)
                  </Header>
                }
              >
                <Box textAlign="center" color="inherit" padding="xxl">
                  <SpaceBetween direction="vertical" size="m">
                    <Icon name="folder" size="large" />
                    <Box variant="strong" color="inherit">
                      Canvas linking in development
                    </Box>
                    <Box variant="p" color="inherit">
                      Canvas-collection linking will be available in the next phase.
                    </Box>
                  </SpaceBetween>
                </Box>
              </Container>
            </SpaceBetween>
          ) : (
            // Collections Grid View
            <Cards
              cardDefinition={{
                header: item => (
                  <SpaceBetween direction="vertical" size="xs">
                    <Box variant="h3">{item.name}</Box>
                    <Box variant="small" color="text-body-secondary">
                      Last modified: {formatDate(item.lastAccessedAt)}
                    </Box>
                  </SpaceBetween>
                ),
                sections: [
                  {
                    id: "preview",
                    content: item => (
                      <Box padding={{ vertical: "m" }}>
                        <div style={{ 
                          height: '120px', 
                          background: '#f8f9fa', 
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e1e4e8'
                        }}>
                          <Box variant="p" color="text-body-secondary" textAlign="center">
                            📊 {item.previewMetadata?.wellCount || 0} wells<br/>
                            <small>Preview coming soon</small>
                          </Box>
                        </div>
                      </Box>
                    )
                  },
                  {
                    id: "metadata",
                    content: item => (
                      <SpaceBetween direction="vertical" size="xs">
                        <SpaceBetween direction="horizontal" size="xs">
                          <Badge color={getDataSourceBadgeColor(item.dataSourceType)}>
                            {item.previewMetadata?.wellCount || 0} Wells
                          </Badge>
                          <Badge color="grey">
                            {item.dataSourceType}
                          </Badge>
                        </SpaceBetween>
                        <Box variant="small" color="text-body-secondary">
                          📝 Canvas linking coming soon
                        </Box>
                      </SpaceBetween>
                    )
                  }
                ]
              }}
              cardsPerRow={[
                { cards: 1 },
                { minWidth: 400, cards: 2 },
                { minWidth: 800, cards: 3 }
              ]}
              items={collections}
              loadingText="Loading collections"
              loading={loading}
              selectionType="single"
              onSelectionChange={({ detail }) => {
                if (detail.selectedItems[0]) {
                  handleCollectionSelect(detail.selectedItems[0]);
                }
              }}
              header={
                <Header
                  counter={`(${collections.length})`}
                  actions={
                    <Button iconName="refresh" onClick={loadCollections}>
                      Refresh
                    </Button>
                  }
                >
                  Your Data Collections (Beta)
                </Header>
              }
              empty={
                <Box textAlign="center" color="inherit" padding="xxl">
                  <SpaceBetween direction="vertical" size="m">
                    <Icon name="folder" size="large" />
                    <Box variant="strong" color="inherit">
                      No data collections
                    </Box>
                    <Box variant="p" color="inherit">
                      Create your first collection to organize and manage your data.
                      Collections are currently in beta preview.
                    </Box>
                    {creationEnabled && (
                      <Button 
                        variant="primary" 
                        iconName="add-plus"
                        onClick={() => setShowCreateModal(true)}
                      >
                        Create New Collection
                      </Button>
                    )}
                  </SpaceBetween>
                </Box>
              }
            />
          )}
        </ContentLayout>

        {/* Create Collection Modal */}
        {creationEnabled && (
          <Modal
            onDismiss={() => setShowCreateModal(false)}
            visible={showCreateModal}
            closeAriaLabel="Close modal"
            header="Create New Data Collection (Beta)"
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button 
                    variant="link" 
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateCollection}
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
                header="Beta Feature"
              >
                Collection management is currently in beta testing. 
                Features like data import and canvas linking are still in development.
              </Alert>

              <FormField
                label="Collection Name"
                description="Choose a descriptive name for your data collection"
              >
                <Input
                  value={collectionName}
                  onChange={({ detail }) => setCollectionName(detail.value)}
                  placeholder="e.g., Cuu Long Basin Production Wells"
                />
              </FormField>

              <FormField
                label="Description (Optional)"
                description="Provide additional context about this collection"
              >
                <Textarea
                  value={collectionDescription}
                  onChange={({ detail }) => setCollectionDescription(detail.value)}
                  placeholder="Describe the purpose and contents of this collection..."
                  rows={3}
                />
              </FormField>
            </SpaceBetween>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div style={{ margin: '36px 80px 0' }}>
      <ContentLayout
        disableOverlap
        headerVariant="divider"
        header={
          <Header
            variant="h1"
            actions={
              <SpaceBetween direction="horizontal" size="m">
                <Button 
                  variant="normal" 
                  iconName="undo" 
                  onClick={() => setViewMode('collections')}
                >
                  Return to Collections
                </Button>
                <Button 
                  variant="primary" 
                  href="/create-new-chat"
                >
                  Create New Session
                </Button>
              </SpaceBetween>
            }
          >
            All Workspace Sessions & Canvases
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          <Alert 
            type="info" 
            dismissible={false}
            header="Collection Integration Available"
          >
            Your existing chat sessions are preserved as "Unlinked Canvases." Link them to Collections for enhanced AI context and organization.
          </Alert>

          <Cards
            cardDefinition={{
              header: item => (
                <SpaceBetween direction="vertical" size="xs">
                  <Box variant="h3">
                    {item.name || `Chat Session ${item.id.slice(-8)}`}
                  </Box>
                  <Box variant="small" color="text-body-secondary">
                    {item.linkedCollectionId ? 
                      `📁 Linked to Collection` : 
                      `🔗 Unlinked Canvas - Ready for Collection`
                    }
                  </Box>
                </SpaceBetween>
              ),
              sections: [
                {
                  id: "status",
                  content: item => (
                    <SpaceBetween direction="vertical" size="xs">
                      <SpaceBetween direction="horizontal" size="xs">
                        <Badge color={item.linkedCollectionId ? 'green' : 'grey'}>
                          {item.linkedCollectionId ? 'Collection Linked' : 'Unlinked Canvas'}
                        </Badge>
                        <Badge>
                          {formatDate(item.createdAt)}
                        </Badge>
                      </SpaceBetween>
                      <Box variant="small" color="text-body-secondary">
                        💬 Chat session ready for analysis
                      </Box>
                    </SpaceBetween>
                  )
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 400, cards: 2 },
              { minWidth: 800, cards: 3 }
            ]}
            items={chatSessions}
            loadingText="Loading chat sessions..."
            loading={loadingSessions}
            selectionType="single"
            onSelectionChange={({ detail }) => {
              if (detail.selectedItems[0]) {
                window.location.href = `/chat/${detail.selectedItems[0].id}`;
              }
            }}
            header={
              <Header
                counter={`(${chatSessions.length} sessions)`}
                description="Your chat sessions and workspace canvases. Link to collections for enhanced context."
              >
                Workspace Sessions & Canvases
              </Header>
            }
            empty={
              <Box textAlign="center" color="inherit" padding="xxl">
                <SpaceBetween direction="vertical" size="m">
                  <Icon name="contact" size="large" />
                  <Box variant="strong" color="inherit">
                    No chat sessions found
                  </Box>
                  <Box variant="p" color="inherit">
                    Create your first workspace session to start data analysis and exploration.
                  </Box>
                  <Button variant="primary" href="/create-new-chat">
                    Create New Session
                  </Button>
                </SpaceBetween>
              </Box>
            }
          />
        </SpaceBetween>
      </ContentLayout>
    </div>
  );
}

// Apply auth protection
const CollectionManagementPage = withAuth(CollectionManagementPageBase);

export default CollectionManagementPage;
