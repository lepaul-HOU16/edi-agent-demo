
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Box,
  StatusIndicator,
  Icon
} from '@cloudscape-design/components';
import { Typography } from '@mui/material';
import CollectionCreationModal from '@/components/CollectionCreationModal';
import { withAuth } from '@/components/WithAuth';
import { isCollectionsEnabled, isCollectionCreationEnabled } from '@/services/featureFlags';
import { listCollections, createCollection, deleteCollection } from '@/lib/api/collections';

function CollectionManagementPageBase() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<any[]>([]); // For bulk delete
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'collections' | 'all-sessions'>('collections');

  // Pagination state for collections
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCollections, setTotalCollections] = useState(0);
  const ITEMS_PER_PAGE = 10;

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
        const { listSessions } = await import('@/lib/api/sessions');
        const response = await listSessions(100);
        setChatSessions(response.data || []);
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        setChatSessions([]);
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
      const response = await listCollections();
      
      if (response.collections) {
        const allCollections = response.collections;

        // CRITICAL: Replace entire array, don't splice
        setCollections(allCollections);
        setTotalCollections(allCollections.length);

        // Reset to page 1 if current page is now out of bounds
        const maxPage = Math.ceil(allCollections.length / ITEMS_PER_PAGE);
        if (currentPage > maxPage && maxPage > 0) {
          setCurrentPage(1);
        }
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
      const response = await createCollection({
        name: collectionName.trim(),
        description: collectionDescription.trim(),
        dataSourceType: 'Mixed',
        previewMetadata: {
          wellCount: 0,
          dataPointCount: 0,
          createdFrom: 'manual'
        }
      });

      if (response.success) {
        await loadCollections(); // Refresh the list
        setShowCreateModal(false);
        setCollectionName('');
        setCollectionDescription('');
        // Reset to page 1 when new collection is added
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCollectionSelect = (collection: any) => {
    // Navigate to collection detail page
    navigate(`/collections/${collection.id}`);
  };

  const handleDeleteSelectedCollections = async () => {
    if (selectedCollections.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedCollections.length} selected collection${selectedCollections.length > 1 ? 's' : ''}?`)) {
      try {
        // Delete all selected collections
        await Promise.all(
          selectedCollections.map(collection => deleteCollection(collection.id))
        );
        
        // Refresh the collections list
        await loadCollections();
        setSelectedCollections([]);
      } catch (error) {
        console.error('Error deleting collections:', error);
        alert('Failed to delete some collections. Please try again.');
      }
    }
  };

  const handleSelectAllCollections = () => {
    if (selectedCollections.length === paginatedCollections.length) {
      // If all on current page are selected, deselect all
      setSelectedCollections([]);
    } else {
      // Otherwise, select all on current page
      setSelectedCollections([...paginatedCollections]);
    }
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

  // Calculate paginated collections
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCollections = collections.slice(startIndex, endIndex);
  const pagesCount = Math.ceil(collections.length / ITEMS_PER_PAGE);

  // Feature flag fallback - redirect to catalog if collections disabled
  if (!collectionsEnabled) {
    return (
      <div className='main-container' data-page="collections" style={{ background: 'transparent' }}>
        <div className="reset-chat">
          <Grid
            disableGutters
            gridDefinition={[{ colspan: 12 }]}
          >
            <div className="reset-chat-left">
              <Typography variant="h6">Data Collections</Typography>
            </div>
          </Grid>
        </div>
        <ContentLayout
          disableOverlap
          header={null}
        >
          <Alert
            type="info"
            header="Collection Management"
          >
            <Box>
              Organize and manage your data with collections.
              Create collections from the Data Catalog to group related wells and data sources.
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
      <div className='main-container' data-page="collections" style={{ background: 'transparent' }}>
        {/* Header with controls matching catalog page */}
        <div className="reset-chat">
          <Grid
            disableGutters
            gridDefinition={[{ colspan: 12 }]}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="reset-chat-left">
                <Typography variant="h6">Data Collections & Workspaces</Typography>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {/* Bulk Actions Group */}
                {selectedCollections.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                    <Box variant="span" color="text-body-secondary">
                      {selectedCollections.length} selected
                    </Box>
                    <Button
                      variant="normal"
                      iconName="remove"
                      onClick={handleDeleteSelectedCollections}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="normal"
                      onClick={() => setSelectedCollections([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}
                
                {/* Main Actions Group */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {creationEnabled && (
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create New Collection
                    </Button>
                  )}
                  <Button
                    variant="normal"
                    onClick={() => setViewMode('all-sessions')}
                  >
                    Show All Sessions
                  </Button>
                </div>
              </div>
            </div>
          </Grid>
        </div>

        <ContentLayout
          disableOverlap
          header={null}
        >
          {selectedCollection ? (
            // Selected Collection View with Canvases
            <SpaceBetween direction="vertical" size="l">
              <div className="collection-detail-header">
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
                <SpaceBetween direction="vertical" size="l">
                  <Grid
                    className="collection-detail-grid"
                    gridDefinition={[
                      { colspan: 3 },
                      { colspan: 3 },
                      { colspan: 3 }
                    ]}
                  >
                    <Box>
                      <Box variant="h3">📊 Data Summary</Box>
                      <SpaceBetween direction="horizontal" size="xs">
                        <Badge color={getDataSourceBadgeColor(selectedCollection.dataSourceType)}>
                          {selectedCollection.previewMetadata?.wellCount || 0} Wells
                        </Badge>
                        <Badge color="grey">
                          {selectedCollection.previewMetadata?.dataPointCount || 0} Data Points
                        </Badge>
                      </SpaceBetween>
                    </Box>
                    <Box>
                      <Box variant="h3">🗺️ Data Sources</Box>
                      <Badge color="grey">
                        {selectedCollection.dataSourceType}
                      </Badge>
                    </Box>
                    <Box>
                      <Box variant="h3">📅 Last Modified</Box>
                      <Box>{formatDate(selectedCollection.lastAccessedAt)}</Box>
                    </Box>
                  </Grid>

                  <div className="collection-detail-actions">
                    <Button variant="primary" iconName="external" href="/catalog">
                      View Collection Data
                    </Button>
                    <Button variant="normal" iconName="add-plus" href="/create-new-chat">
                      Create New Canvas
                    </Button>
                  </div>
                </SpaceBetween>
              </div>

            {/* Canvas Cards Section */}
            <Container
                header={
                  <Header variant="h3">
                    Workspace Canvases
                  </Header>
                }
              >
                <Box textAlign="center" color="inherit" padding="xxl">
                  <SpaceBetween direction="vertical" size="m">
                    <Icon name="folder" size="large" />
                    <Box variant="strong" color="inherit">
                      No canvases linked to this collection
                    </Box>
                    <Box variant="p" color="inherit">
                      Create a new canvas to start working with this collection's data.
                    </Box>
                    <Button variant="primary" href="/create-new-chat">
                      Create Canvas
                    </Button>
                  </SpaceBetween>
                </Box>
              </Container>
            </SpaceBetween>
          ) : (
            // Collections Grid View with Pagination
            <SpaceBetween direction="vertical" size="l">
              <div className="collections-cards-wrapper">
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
                              📊 {item.previewMetadata?.wellCount || 0} wells<br />
                              <small>{item.previewMetadata?.dataPointCount || 0} data points</small>
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
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              variant="inline-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCollectionSelect(item);
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="inline-link"
                              iconName="remove"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                  try {
                                    await deleteCollection(item.id);
                                    await loadCollections();
                                    setSelectedCollections([]);
                                  } catch (error) {
                                    console.error('Error deleting collection:', error);
                                    alert('Failed to delete collection. Please try again.');
                                  }
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </SpaceBetween>
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
                items={paginatedCollections}
                loadingText="Loading collections"
                loading={loading}
                selectionType="multi"
                selectedItems={selectedCollections}
                onSelectionChange={({ detail }) => {
                  setSelectedCollections(detail.selectedItems);
                }}
                header={
                  <Header
                    counter={`(${collections.length})`}
                    actions={
                      <SpaceBetween direction="horizontal" size="s">
                        <Button
                          onClick={handleSelectAllCollections}
                          variant="normal"
                        >
                          {selectedCollections.length === paginatedCollections.length && paginatedCollections.length > 0
                            ? 'Deselect All'
                            : 'Select All'}
                        </Button>
                        <Button iconName="refresh" onClick={loadCollections}>
                          Refresh
                        </Button>
                      </SpaceBetween>
                    }
                  >
                    Your Data Collections
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
              </div>

              {/* Pagination Controls */}
              {collections.length > ITEMS_PER_PAGE && (
                <Pagination
                  currentPageIndex={currentPage}
                  pagesCount={pagesCount}
                  onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
                  ariaLabels={{
                    nextPageLabel: "Next page",
                    previousPageLabel: "Previous page",
                    pageLabel: pageNumber => `Page ${pageNumber} of ${pagesCount}`
                  }}
                />
              )}
            </SpaceBetween>
          )}
        </ContentLayout>

        {/* Create Collection Modal */}
        {creationEnabled && (
          <CollectionCreationModal
            visible={showCreateModal}
            onDismiss={() => setShowCreateModal(false)}
            collectionName={collectionName}
            collectionDescription={collectionDescription}
            onNameChange={setCollectionName}
            onDescriptionChange={setCollectionDescription}
            onCreateCollection={handleCreateCollection}
            creating={creating}
            showItemSelection={false}
          />
        )}
      </div>
    );
  }

  return (
    <div className='main-container' data-page="collections" style={{ background: 'transparent' }}>
      {/* Header with controls matching catalog page */}
      <div className="reset-chat">
        <Grid
          disableGutters
          gridDefinition={[{ colspan: 12 }]}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="reset-chat-left">
              <Typography variant="h6">All Workspace Sessions & Canvases</Typography>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            </div>
          </div>
        </Grid>
      </div>

      <ContentLayout
        disableOverlap
        header={null}
      >
        <SpaceBetween direction="vertical" size="l">
          <div style={{ marginTop: '20px' }}>
            <Alert
              type="info"
              dismissible={false}
              header="Collection Integration Available"
            >
              Your existing chat sessions are preserved as "Unlinked Canvases." Link them to Collections for enhanced AI context and organization.
            </Alert>
          </div>

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
