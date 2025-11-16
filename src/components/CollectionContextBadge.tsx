
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@cloudscape-design/components/badge';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Icon from '@cloudscape-design/components/icon';
import Popover from '@cloudscape-design/components/popover';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import { getCollection } from '../lib/api/collections';

interface CollectionContextBadgeProps {
  chatSessionId: string;
}

interface CollectionData {
  id: string;
  name: string;
  description: string;
  dataItems: any[];
  previewMetadata?: {
    wellCount?: number;
    dataPointCount?: number;
  };
}

const CollectionContextBadge: React.FC<CollectionContextBadgeProps> = ({ chatSessionId }) => {
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCollectionContext = async () => {
      try {
        setLoading(true);
        
        // TODO: Get the chat session to find linked collection
        // For now, skip as ChatSession REST API hasn't been implemented yet
        // Once chat sessions are migrated, we'll fetch the session and get linkedCollectionId
        // then call getCollection(linkedCollectionId) to load the collection data
        console.warn('ChatSession REST API not yet implemented, cannot load collection context');
        setCollection(null);
      } catch (error) {
        console.error('Error loading collection context:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollectionContext();
  }, [chatSessionId]);

  if (loading) {
    return (
      <Box padding={{ horizontal: 's' }}>
        <StatusIndicator type="loading">Loading collection context...</StatusIndicator>
      </Box>
    );
  }

  if (!collection) {
    return null;
  }

  const itemCount = collection.dataItems?.length || 
                    collection.previewMetadata?.dataPointCount || 
                    0;

  const handleBadgeClick = () => {
    navigate(`/collections/${collection.id}`);
  };

  return (
    <Popover
      dismissButton={false}
      position="bottom"
      size="large"
      triggerType="custom"
      content={
        <SpaceBetween direction="vertical" size="s">
          <Box variant="h4">{collection.name}</Box>
          {collection.description && (
            <Box variant="p" color="text-body-secondary">
              {collection.description}
            </Box>
          )}
          <SpaceBetween direction="vertical" size="xs">
            <Box variant="small">
              <strong>Data Scope:</strong> {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Box>
            {collection.previewMetadata?.wellCount && (
              <Box variant="small">
                <strong>Wells:</strong> {collection.previewMetadata.wellCount}
              </Box>
            )}
            <Box variant="small" color="text-status-info">
              <Icon name="status-info" /> AI queries are limited to this collection's data
            </Box>
          </SpaceBetween>
          <Box variant="small" color="text-body-secondary">
            Click badge to view collection details
          </Box>
        </SpaceBetween>
      }
    >
      <div
        onClick={handleBadgeClick}
        style={{
          cursor: 'pointer',
          display: 'inline-block'
        }}
      >
        <Badge color="blue">
          <SpaceBetween direction="horizontal" size="xs" alignItems="center">
            <Icon name="folder" />
            <span>{collection.name}</span>
            <span style={{ opacity: 0.7 }}>({itemCount})</span>
          </SpaceBetween>
        </Badge>
      </div>
    </Popover>
  );
};

export default CollectionContextBadge;
