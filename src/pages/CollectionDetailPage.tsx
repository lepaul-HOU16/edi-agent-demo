
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Enable dynamic params for static export
export const dynamicParams = true;

import {
  Alert,
  Badge,
  BreadcrumbGroup,
  Box,
  Button,
  Cards,
  Container,
  ContentLayout,
  Grid,
  Header,
  Icon,
  Pagination,
  SpaceBetween,
  StatusIndicator
} from '@cloudscape-design/components';
import { Typography } from '@mui/material';
import { withAuth } from '@/components/WithAuth';
import { getCollection } from '@/lib/api/collections';
import { listSessions, deleteSession, Session } from '@/lib/api/sessions';

interface CanvasCard {
  id: string;
  name: string;
  createdAt: string;
  linkedCollectionId?: string;
}

function CollectionDetailPageBase() {
  const params = useParams();
  const navigate = useNavigate();
  const collectionId = params.collectionId as string;
  
  const [collection, setCollection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Canvas state
  const [canvases, setCanvases] = useState<CanvasCard[]>([]);
  const [loadingCanvases, setLoadingCanvases] = useState(true);
  const [currentCanvasPage, setCurrentCanvasPage] = useState(1);
  const CANVASES_PER_PAGE = 25;

  useEffect(() => {
    loadCollectionDetails();
    loadLinkedCanvases();
  }, [collectionId]);

  const loadCollectionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading collection details for ID:', collectionId);
      
      // Query for specific collection via REST API
      const response = await getCollection(collectionId);
      
      if (response.success && response.collection) {
        console.log('✅ Collection loaded:', response.collection);
        setCollection(response.collection);
      } else {
        console.error('❌ Collection not found');
        setError('Collection not found');
      }
    } catch (err) {
      console.error('Error loading collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedCanvases = async () => {
    try {
      setLoadingCanvases(true);
      console.log('🔍 Loading canvases linked to collection:', collectionId);
      
      // Call listSessions() to get all sessions
      const response = await listSessions();
      
      if (response.sessions) {
        // Filter by linkedCollectionId matching current collection
        const linkedCanvases = response.sessions
          .filter((session: Session) => session.linkedCollectionId === collectionId)
          .map((session: Session) => ({
            id: session.id,
            name: session.name,
            createdAt: session.createdAt,
            linkedCollectionId: session.linkedCollectionId
          }));
        
        console.log(`✅ Found ${linkedCanvases.length} linked canvases`);
        setCanvases(linkedCanvases);
      } else {
        console.warn('No sessions returned from API');
        setCanvases([]);
      }
    } catch (err) {
      console.error('Error loading canvases:', err);
      setCanvases([]);
    } finally {
      setLoadingCanvases(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Pagination calculation for canvases
  const startIndex = (currentCanvasPage - 1) * CANVASES_PER_PAGE;
  const endIndex = startIndex + CANVASES_PER_PAGE;
  const paginatedCanvases = canvases.slice(startIndex, endIndex);

  // Handle canvas card click
  const handleCanvasClick = (canvasId: string) => {
    navigate(`/chat/${canvasId}`);
  };

  // Handle create new canvas
  const handleCreateCanvas = () => {
    // Navigate to create-new-chat with collectionId parameter
    // This ensures proper context loading via the enhanced service
    navigate(`/create-new-chat?collectionId=${collectionId}`);
  };

  // Card definition matching /listChats styling
  const canvasCardDefinition = {
    header: (item: CanvasCard) => (
      <Box fontSize="heading-m" fontWeight="bold">
        <div style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.name}
        </div>
      </Box>
    ),
    sections: [
      {
        id: "description",
        content: (item: CanvasCard) => (
          <Box>
            <div style={{
              maxHeight: '4.5em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5em',
              marginBottom: '16px',
              height: '150px',
            }}>
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="small" color="text-body-secondary">
                  Created: {formatDate(item.createdAt)}
                </Box>
                <Box>
                  <SpaceBetween direction="horizontal" size="xs">
                    <Icon name="folder" />
                    <Box variant="small">
                      Linked to this collection
                    </Box>
                  </SpaceBetween>
                </Box>
              </SpaceBetween>
            </div>
          </Box>
        )
      },
      {
        id: "actions",
        content: (item: CanvasCard) => (
          <Box>
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  iconName="remove"
                  variant="inline-link"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                      try {
                        await deleteSession(item.id);
                        console.log(`✅ Deleted canvas: ${item.name}`);
                        await loadLinkedCanvases();
                      } catch (err) {
                        console.error('Error deleting canvas:', err);
                        alert('Failed to delete canvas. Please try again.');
                      }
                    }
                  }}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCanvasClick(item.id);
                  }}
                >
                  Open Canvas
                </Button>
              </div>
            </div>
          </Box>
        )
      }
    ]
  };

  if (loading) {
    return (
      <div style={{ margin: '36px 80px 0' }}>
        <ContentLayout
          disableOverlap
          headerVariant="divider"
          header={<Header variant="h1">Loading Collection...</Header>}
        >
          <Container>
            <Box textAlign="center" padding="xxl">
              <StatusIndicator type="loading">
                Loading collection details...
              </StatusIndicator>
            </Box>
          </Container>
        </ContentLayout>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div style={{ margin: '36px 80px 0' }}>
        <ContentLayout
          disableOverlap
          headerVariant="divider"
          header={<Header variant="h1">Collection Not Found</Header>}
        >
          <Alert
            statusIconAriaLabel="Error"
            type="error"
            header="Unable to Load Collection"
          >
            {error || 'The requested collection could not be found.'}
          </Alert>
          <Box margin={{ top: 'l' }}>
            <Button variant="primary" onClick={() => navigate('/collections')}>
              Back to Collections
            </Button>
          </Box>
        </ContentLayout>
      </div>
    );
  }

  return (
    <div className='main-container' data-page="collections" style={{ background: 'transparent' }}>
      {/* Header with controls matching collections page */}
      <div className="reset-chat">
        <Grid
          disableGutters
          gridDefinition={[{ colspan: 12 }]}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="reset-chat-left">
              <Typography variant="h6">Data Collections & Workspaces</Typography>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button 
                variant="normal"
                onClick={() => navigate('/collections')}
              >
                ← Back to Collections
              </Button>
              <Button iconName="edit">Edit Collection</Button>
              <Button iconName="copy">Duplicate</Button>
              <Button iconName="remove">Archive</Button>
            </div>
          </div>
        </Grid>
      </div>

      <div style={{ marginTop: '20px' }}>
        <ContentLayout
          disableOverlap
          header={null}
        >
          <SpaceBetween direction="vertical" size="l">
          {/* Breadcrumbs */}
          <BreadcrumbGroup
            items={[
              { text: 'Collections', href: '/collections' },
              { text: collection.name, href: '#' }
            ]}
            ariaLabel="Breadcrumbs"
          />

          {/* Collection Title */}
          <Header variant="h1">
            🗂️ {collection.name}
          </Header>

          {/* Collection Overview */}
          <Box>
            <SpaceBetween direction="vertical" size="l">
              {collection.description && (
                <Box>
                  <Box variant="h3">Description</Box>
                  <Box color="text-body-secondary">{collection.description}</Box>
                </Box>
              )}

              <Grid
                gridDefinition={[
                  { colspan: { default: 12, xs: 3 } },
                  { colspan: { default: 12, xs: 3 } },
                  { colspan: { default: 12, xs: 3 } },
                  { colspan: { default: 12, xs: 3 } }
                ]}
              >
                <Box>
                  <Box variant="h3">📊 Data Summary</Box>
                  <Box>
                    <Badge color="blue">
                      {collection.previewMetadata?.wellCount || 0} Wells
                    </Badge>
                    {' • '}
                    <Badge color="grey">
                      {collection.previewMetadata?.dataPointCount || 0} Data Points
                    </Badge>
                  </Box>
                </Box>
                
                <Box>
                  <Box variant="h3">🗺️ Data Source</Box>
                  <Badge color={getDataSourceBadgeColor(collection.dataSourceType)}>
                    {collection.dataSourceType}
                  </Badge>
                </Box>
                
                <Box>
                  <Box variant="h3">📅 Created</Box>
                  <Box color="text-body-secondary">
                    {formatDate(collection.createdAt)}
                  </Box>
                </Box>
                
                <Box>
                  <Box variant="h3">🕐 Last Accessed</Box>
                  <Box color="text-body-secondary">
                    {formatDate(collection.lastAccessedAt)}
                  </Box>
                </Box>
              </Grid>

              <SpaceBetween direction="horizontal" size="m">
                <Button 
                  variant="primary" 
                  iconName="external" 
                  onClick={() => {
                    // Navigate to catalog with collection wells pre-selected
                    const wellNames = collection.dataItems?.map((item: any) => item.name) || [];
                    navigate('/catalog', { state: { selectedWells: wellNames, fromCollection: collection.name } });
                  }}
                >
                  View Collection Data in Catalog
                </Button>
                <Button variant="normal" iconName="add-plus" onClick={() => handleCreateCanvas()}>
                  Create New Canvas from Collection
                </Button>
              </SpaceBetween>
              
              {/* Collection Data Access Information */}
              {collection.dataSourceType === 'S3' && collection.dataItems && collection.dataItems.length > 0 && (
                <Box>
                  <Alert type="info" header="Data Access in Canvases">
                    When you create a canvas from this collection, all {collection.dataItems.length} well files will be accessible in the Session Files panel under the <strong>global/well-data/</strong> directory. 
                    These LAS files contain complete log data for analysis.
                  </Alert>
                </Box>
              )}
            </SpaceBetween>
          </Box>

          {/* Linked Canvases Section */}
          <Container
            header={
              <Header 
                variant="h2"
                description="Workspace canvases linked to this collection"
                counter={`(${canvases.length})`}
                actions={
                  <Button 
                    variant="primary" 
                    iconName="add-plus"
                    onClick={() => handleCreateCanvas()}
                  >
                    Create New Canvas
                  </Button>
                }
              >
                Linked Canvases
              </Header>
            }
          >
            {loadingCanvases ? (
              <Box textAlign="center" padding="xxl">
                <StatusIndicator type="loading">
                  Loading canvases...
                </StatusIndicator>
              </Box>
            ) : canvases.length === 0 ? (
              <Box textAlign="center" color="inherit" padding="xxl">
                <SpaceBetween direction="vertical" size="m">
                  <Icon name="contact" size="large" />
                  <Box variant="strong" color="inherit">
                    No canvases linked to this collection
                  </Box>
                  <Box variant="p" color="inherit">
                    Create a new canvas to start analyzing data from this collection.
                    The canvas will automatically inherit this collection's data context.
                  </Box>
                  <Button 
                    variant="primary" 
                    iconName="add-plus"
                    onClick={() => handleCreateCanvas()}
                  >
                    Create New Canvas
                  </Button>
                </SpaceBetween>
              </Box>
            ) : (
              <SpaceBetween direction="vertical" size="l">
                <Cards
                  items={paginatedCanvases}
                  cardDefinition={canvasCardDefinition}
                  cardsPerRow={[
                    { cards: 1 },
                    { minWidth: 300, cards: 5 }
                  ]}
                  variant="container"
                  stickyHeader={true}
                  onSelectionChange={({ detail }) => {
                    if (detail.selectedItems[0]) {
                      handleCanvasClick(detail.selectedItems[0].id);
                    }
                  }}
                  className="fixed-height-cards"
                />

                {/* Pagination Controls */}
                {canvases.length > CANVASES_PER_PAGE && (
                  <Pagination
                    currentPageIndex={currentCanvasPage}
                    pagesCount={Math.ceil(canvases.length / CANVASES_PER_PAGE)}
                    onChange={({ detail }) => setCurrentCanvasPage(detail.currentPageIndex)}
                    ariaLabels={{
                      nextPageLabel: "Next page",
                      previousPageLabel: "Previous page",
                      pageLabel: pageNumber => `Page ${pageNumber} of ${Math.ceil(canvases.length / CANVASES_PER_PAGE)}`
                    }}
                  />
                )}
              </SpaceBetween>
            )}
          </Container>

          {/* Data Items Section */}
          {collection.dataItems && collection.dataItems.length > 0 && (
            <Box>
              <div style={{ marginBottom: '20px' }}>
                <Header 
                  variant="h2"
                  counter={`(${collection.dataItems.length})`}
                >
                  Collection Data Items
                </Header>
              </div>
              <Cards
                items={collection.dataItems}
                cardDefinition={{
                  header: (item: any) => (
                    <Box fontSize="heading-s" fontWeight="bold">
                      <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                        <span>{item.name}</span>
                        {item.dataSource === 'OSDU' && (
                          <Badge color="blue">OSDU</Badge>
                        )}
                        {item.dataSource !== 'OSDU' && (
                          <Badge color="green">Catalog</Badge>
                        )}
                      </SpaceBetween>
                    </Box>
                  ),
                  sections: [
                    {
                      id: "details",
                      content: (item: any) => (
                        <SpaceBetween direction="vertical" size="xs">
                          {item.type && (
                            <Box>
                              <Box variant="small" color="text-label">Type:</Box>
                              <Box variant="small">{item.type}</Box>
                            </Box>
                          )}
                          {item.location && (
                            <Box>
                              <Box variant="small" color="text-label">Location:</Box>
                              <Box variant="small">{item.location}</Box>
                            </Box>
                          )}
                          {item.depth && (
                            <Box>
                              <Box variant="small" color="text-label">Depth:</Box>
                              <Box variant="small">{item.depth}</Box>
                            </Box>
                          )}
                          {item.operator && (
                            <Box>
                              <Box variant="small" color="text-label">Operator:</Box>
                              <Box variant="small">{item.operator}</Box>
                            </Box>
                          )}
                          {item.osduId && (
                            <Box>
                              <Box variant="small" color="text-label">OSDU ID:</Box>
                              <Box variant="small" fontSize="body-s" color="text-body-secondary">
                                {item.osduId.length > 50 ? `${item.osduId.substring(0, 50)}...` : item.osduId}
                              </Box>
                            </Box>
                          )}
                          {item.osduMetadata && (
                            <Box>
                              <Box variant="small" color="text-label">OSDU Metadata:</Box>
                              <SpaceBetween direction="horizontal" size="xs">
                                {item.osduMetadata.basin && (
                                  <Badge color="grey">{item.osduMetadata.basin}</Badge>
                                )}
                                {item.osduMetadata.country && (
                                  <Badge color="grey">{item.osduMetadata.country}</Badge>
                                )}
                                {item.osduMetadata.logType && (
                                  <Badge color="grey">{item.osduMetadata.logType}</Badge>
                                )}
                              </SpaceBetween>
                            </Box>
                          )}
                        </SpaceBetween>
                      )
                    }
                  ]
                }}
                cardsPerRow={[
                  { cards: 1 },
                  { minWidth: 400, cards: 3 }
                ]}
                variant="container"
              />
            </Box>
          )}

          {/* Collection Metadata */}
          {collection.previewMetadata && (
            <Container
              header={
                <Header variant="h3">
                  Additional Metadata
                </Header>
              }
            >
              <SpaceBetween direction="vertical" size="s">
                {collection.previewMetadata.createdFrom && (
                  <Box>
                    <Box variant="strong">Created From:</Box>{' '}
                    <Badge>{collection.previewMetadata.createdFrom}</Badge>
                  </Box>
                )}
                {collection.previewMetadata.dataSources && (
                  <Box>
                    <Box variant="strong">Data Sources:</Box>{' '}
                    {collection.previewMetadata.dataSources.join(', ')}
                  </Box>
                )}
                {collection.geographicBounds && (
                  <Box>
                    <Box variant="strong">Geographic Bounds:</Box>
                    <Box color="text-body-secondary" fontSize="body-s">
                      Lat: {collection.geographicBounds.minLat.toFixed(4)} to {collection.geographicBounds.maxLat.toFixed(4)}<br/>
                      Lon: {collection.geographicBounds.minLon.toFixed(4)} to {collection.geographicBounds.maxLon.toFixed(4)}
                    </Box>
                  </Box>
                )}
              </SpaceBetween>
            </Container>
          )}
        </SpaceBetween>
      </ContentLayout>
      </div>
    </div>
  );
}

// Apply auth protection
const CollectionDetailPage = withAuth(CollectionDetailPageBase);

export default CollectionDetailPage;
