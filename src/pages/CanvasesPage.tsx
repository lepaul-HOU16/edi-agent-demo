
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Cards,
  ContentLayout,
  Header,
  Pagination,
  Select,
  SpaceBetween,
  StatusIndicator,
  Icon
} from '@cloudscape-design/components';
import { withAuth } from '@/components/WithAuth';
import { cognitoAuth } from '@/lib/auth/cognitoAuth';
import { listCollections } from '@/lib/api/collections';
import { listSessions, deleteSession } from '@/lib/api/sessions';

interface CanvasCard {
  id: string;
  name: string;
  createdAt: string;
  linkedCollectionId?: string;
  collectionName?: string;
}

interface Collection {
  id: string;
  name: string;
}

interface UserInfo {
  userId: string;
  username: string;
  email: string;
}

function CanvasListPageBase() {
  // State management
  const [user, setUser] = useState<UserInfo | null>(null);
  const [canvases, setCanvases] = useState<CanvasCard[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 25;

  // Load user info
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const userInfo = await cognitoAuth.getUserInfo();
      setUser(userInfo);
      console.log('✅ User info loaded:', userInfo);
    } catch (error) {
      console.error('❌ Error loading user info:', error);
      setError('Failed to load user information');
    }
  };

  // Load canvases from ChatSession model
  useEffect(() => {
    loadCanvases();
  }, []);

  // Load collections for filter dropdown
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCanvases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Loading canvases...');
      const result = await listSessions(100);
      console.log(`✅ Loaded ${result.data.length} canvases`);
      
      // Sort by creation date (newest first)
      const sortedCanvases = result.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Process canvases with default names
      const processedCanvases: CanvasCard[] = sortedCanvases.map(session => {
        const date = new Date(session.createdAt);
        const formattedDate = date.toLocaleString();
        
        return {
          id: session.id,
          name: session.name || `Untitled - ${formattedDate}`,
          createdAt: session.createdAt,
          linkedCollectionId: session.linkedCollectionId || undefined,
          collectionName: undefined // Will be populated if needed
        };
      });

      setCanvases(processedCanvases);
    } catch (error) {
      console.error('❌ Error loading canvases:', error);
      setError('Failed to load canvases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      setLoadingCollections(true);
      
      console.log('📁 Loading collections...');
      const response = await listCollections();
      console.log(`✅ Loaded ${response.collections?.length || 0} collections`);
      
      if (response.collections) {
        setCollections(response.collections);
      }
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      // Don't set error state for collections - it's not critical
    } finally {
      setLoadingCollections(false);
    }
  };

  // Filter canvases by selected collection
  const filteredCanvases = selectedCollection === 'all'
    ? canvases
    : canvases.filter(c => c.linkedCollectionId === selectedCollection);

  // Pagination calculation
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCanvases = filteredCanvases.slice(startIndex, endIndex);
  const pagesCount = Math.ceil(filteredCanvases.length / ITEMS_PER_PAGE);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get collection name by ID
  const getCollectionName = (collectionId?: string) => {
    if (!collectionId) return null;
    const collection = collections.find(c => c.id === collectionId);
    return collection?.name || 'Unknown Collection';
  };

  // Handle collection filter change
  const handleCollectionChange = ({ detail }: any) => {
    setSelectedCollection(detail.selectedOption.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle canvas card click
  const handleCanvasClick = (canvasId: string) => {
    window.location.href = `/chat/${canvasId}`;
  };

  // Card definition matching /listChats styling
  const cardDefinition = {
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
                {item.linkedCollectionId && (
                  <Box>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Icon name="folder" />
                      <Box variant="small">
                        {getCollectionName(item.linkedCollectionId)}
                      </Box>
                    </SpaceBetween>
                  </Box>
                )}
                {!item.linkedCollectionId && (
                  <Box variant="small" color="text-status-inactive">
                    <Icon name="status-info" /> Unlinked canvas
                  </Box>
                )}
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
                      await deleteSession(item.id);
                      await loadCanvases();
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

  return (
    <div className="main-container" data-page="canvases">
      <ContentLayout
        disableOverlap
        headerVariant="divider"
        header={
          <Header
            variant="h1"
            counter={`(${filteredCanvases.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="m">
                <Button 
                  iconName="refresh" 
                  onClick={loadCanvases}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button 
                  variant="primary" 
                  href="/create-new-chat"
                  iconName="add-plus"
                >
                  Create New Canvas
                </Button>
              </SpaceBetween>
            }
          >
            All Canvases
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="l">
          {/* Error Message */}
          {error && (
            <Box>
              <StatusIndicator type="error">
                {error}
              </StatusIndicator>
            </Box>
          )}
          {/* Collection Filter Dropdown */}
          <Box>
            <SpaceBetween direction="horizontal" size="m" alignItems="center">
              <Box variant="awsui-key-label">Filter by Collection:</Box>
              <Select
                selectedOption={{
                  label: selectedCollection === 'all' 
                    ? 'All Collections' 
                    : collections.find(c => c.id === selectedCollection)?.name || 'All Collections',
                  value: selectedCollection
                }}
                onChange={handleCollectionChange}
                options={[
                  { label: 'All Collections', value: 'all' },
                  ...collections.map(c => ({ label: c.name, value: c.id }))
                ]}
                placeholder="Select a collection"
                disabled={loadingCollections}
                expandToViewport
              />
            </SpaceBetween>
          </Box>

          {/* Canvas Cards */}
          <Cards
            items={paginatedCanvases}
            cardDefinition={cardDefinition}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 300, cards: 5 }
            ]}
            variant="container"
            stickyHeader={true}
            loading={loading}
            loadingText="Loading canvases..."
            onSelectionChange={({ detail }) => {
              if (detail.selectedItems[0]) {
                handleCanvasClick(detail.selectedItems[0].id);
              }
            }}
            empty={
              <Box textAlign="center" color="inherit" padding="xxl">
                <SpaceBetween direction="vertical" size="m">
                  <Icon name="contact" size="large" />
                  <Box variant="strong" color="inherit">
                    {selectedCollection === 'all' 
                      ? 'No canvases found'
                      : 'No canvases in this collection'
                    }
                  </Box>
                  <Box variant="p" color="inherit">
                    {selectedCollection === 'all'
                      ? 'Create your first canvas to start analyzing data.'
                      : 'Create a canvas from this collection to get started.'
                    }
                  </Box>
                  <Button 
                    variant="primary" 
                    href="/create-new-chat"
                    iconName="add-plus"
                  >
                    Create New Canvas
                  </Button>
                </SpaceBetween>
              </Box>
            }
          />

          {/* Pagination Controls */}
          {filteredCanvases.length > ITEMS_PER_PAGE && (
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
      </ContentLayout>
    </div>
  );
}

// Apply auth protection
const CanvasListPage = withAuth(CanvasListPageBase);

export default CanvasListPage;
