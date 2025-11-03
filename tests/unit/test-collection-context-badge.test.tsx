/**
 * Unit tests for CollectionContextBadge component
 * Tests collection context display in canvas interface
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollectionContextBadge from '@/components/CollectionContextBadge';
import { generateClient } from 'aws-amplify/data';

// Mock Amplify client
jest.mock('aws-amplify/data', () => ({
  generateClient: jest.fn()
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}));

describe('CollectionContextBadge', () => {
  const mockAmplifyClient = {
    models: {
      ChatSession: {
        get: jest.fn()
      }
    },
    queries: {
      collectionQuery: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (generateClient as jest.Mock).mockReturnValue(mockAmplifyClient);
  });

  it('should render loading state initially', () => {
    mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
      data: { id: 'chat-1', linkedCollectionId: null }
    });

    render(<CollectionContextBadge chatSessionId="chat-1" />);
    
    expect(screen.getByText(/Loading collection context/i)).toBeInTheDocument();
  });

  it('should render nothing when no collection is linked', async () => {
    mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
      data: { id: 'chat-1', linkedCollectionId: null }
    });

    const { container } = render(<CollectionContextBadge chatSessionId="chat-1" />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render collection badge when collection is linked', async () => {
    mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
      data: { 
        id: 'chat-1', 
        linkedCollectionId: 'collection-1' 
      }
    });

    mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
      data: JSON.stringify({
        success: true,
        collection: {
          id: 'collection-1',
          name: 'Test Collection',
          description: 'Test description',
          dataItems: [{ id: '1' }, { id: '2' }, { id: '3' }],
          previewMetadata: {
            wellCount: 5,
            dataPointCount: 3
          }
        }
      })
    });

    render(<CollectionContextBadge chatSessionId="chat-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Collection')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });
  });

  it('should display correct item count', async () => {
    mockAmplifyClient.models.ChatSession.get.mockResolvedValue({
      data: { 
        id: 'chat-1', 
        linkedCollectionId: 'collection-1' 
      }
    });

    mockAmplifyClient.queries.collectionQuery.mockResolvedValue({
      data: JSON.stringify({
        success: true,
        collection: {
          id: 'collection-1',
          name: 'Test Collection',
          dataItems: [{ id: '1' }, { id: '2' }]
        }
      })
    });

    render(<CollectionContextBadge chatSessionId="chat-1" />);
    
    await waitFor(() => {
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    mockAmplifyClient.models.ChatSession.get.mockRejectedValue(
      new Error('Failed to load chat session')
    );

    const { container } = render(<CollectionContextBadge chatSessionId="chat-1" />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
