/**
 * Test for CreateNewChatPage REST API migration
 * 
 * This test verifies that the CreateNewChatPage correctly:
 * 1. Uses REST API instead of Amplify
 * 2. Uses React Router instead of Next.js navigation
 * 3. Creates sessions with proper data structure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateNewChatPage from '../src/pages/CreateNewChatPage';
import * as sessionsApi from '../src/lib/api/sessions';
import * as collectionContextLoader from '../src/services/collectionContextLoader';

// Mock the API modules
vi.mock('../src/lib/api/sessions');
vi.mock('../src/services/collectionContextLoader');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateNewChatPage REST API Migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new session without collection context', async () => {
    // Mock createSession to return a session
    const mockSession = {
      id: 'test-session-123',
      owner: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    vi.mocked(sessionsApi.createSession).mockResolvedValue(mockSession);

    // Render the component
    render(
      <BrowserRouter>
        <CreateNewChatPage />
      </BrowserRouter>
    );

    // Wait for session creation
    await waitFor(() => {
      expect(sessionsApi.createSession).toHaveBeenCalledWith({});
    });

    // Verify navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/chat/test-session-123');
    });
  });

  it('should create a new session with collection context', async () => {
    // Mock URL search params with collectionId
    const mockSearchParams = new URLSearchParams('?collectionId=collection-456');
    
    // Mock createSession
    const mockSession = {
      id: 'test-session-789',
      owner: 'test-user',
      linkedCollectionId: 'collection-456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    vi.mocked(sessionsApi.createSession).mockResolvedValue(mockSession);
    
    // Mock loadCanvasContext
    const mockContext = { wells: ['well-1', 'well-2'] };
    vi.mocked(collectionContextLoader.loadCanvasContext).mockResolvedValue(mockContext);

    // Render with search params
    render(
      <BrowserRouter>
        <CreateNewChatPage />
      </BrowserRouter>
    );

    // Wait for session creation with collection context
    await waitFor(() => {
      expect(collectionContextLoader.loadCanvasContext).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(sessionsApi.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedCollectionId: expect.any(String),
          collectionContext: expect.any(Object),
        })
      );
    });
  });

  it('should inherit collection context from existing session', async () => {
    // Mock URL search params with fromSession
    const mockSearchParams = new URLSearchParams('?fromSession=existing-session-123');
    
    // Mock getSession to return session with collection
    const mockExistingSession = {
      id: 'existing-session-123',
      owner: 'test-user',
      linkedCollectionId: 'collection-789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    vi.mocked(sessionsApi.getSession).mockResolvedValue(mockExistingSession);
    
    // Mock createSession
    const mockNewSession = {
      id: 'new-session-456',
      owner: 'test-user',
      linkedCollectionId: 'collection-789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    vi.mocked(sessionsApi.createSession).mockResolvedValue(mockNewSession);
    
    // Mock loadCanvasContext
    const mockContext = { wells: ['well-1'] };
    vi.mocked(collectionContextLoader.loadCanvasContext).mockResolvedValue(mockContext);

    // Render
    render(
      <BrowserRouter>
        <CreateNewChatPage />
      </BrowserRouter>
    );

    // Verify getSession was called
    await waitFor(() => {
      expect(sessionsApi.getSession).toHaveBeenCalledWith('existing-session-123');
    });

    // Verify new session created with inherited collection
    await waitFor(() => {
      expect(sessionsApi.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          linkedCollectionId: 'collection-789',
        })
      );
    });
  });

  it('should handle session creation errors gracefully', async () => {
    // Mock createSession to throw error
    vi.mocked(sessionsApi.createSession).mockRejectedValue(new Error('API Error'));
    
    // Mock alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Render
    render(
      <BrowserRouter>
        <CreateNewChatPage />
      </BrowserRouter>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to create chat session.');
    });

    // Verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
    
    mockAlert.mockRestore();
  });
});
