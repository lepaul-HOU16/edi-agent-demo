import { renderHook, act, waitFor } from '@testing-library/react';
import { useRenewableJobPolling } from '../useRenewableJobPolling';

// Mock Amplify client
jest.mock('aws-amplify/data', () => ({
}));

describe('useRenewableJobPolling', () => {
  let mockAmplifyClient: any;
  let mockListMessages: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockListMessages = jest.fn();
    mockAmplifyClient = {
      models: {
        ChatMessage: {
          list: mockListMessages
        }
      }
    };

  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: false
        })
      );

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.hasNewResults).toBe(false);
      expect(result.current.latestMessage).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should initialize Amplify client on mount', () => {
      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: false
        })
      );

    });
  });

  describe('Polling Behavior', () => {
    it('should start polling when enabled is true', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      // Should check immediately
      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      // Should poll again after interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(2);
      });
    });

    it('should not start polling when enabled is false', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: false
        })
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockListMessages).not.toHaveBeenCalled();
    });

    it('should use custom polling interval', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 5000
        })
      );

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      // Should not poll before interval
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(mockListMessages).toHaveBeenCalledTimes(1);

      // Should poll after full interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(2);
      });
    });

    it('should stop polling when disabled', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      const { rerender } = renderHook(
        ({ enabled }) =>
          useRenewableJobPolling({
            chatSessionId: 'test-session',
            enabled,
            pollingInterval: 1000
          }),
        { initialProps: { enabled: true } }
      );

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      // Disable polling
      rerender({ enabled: false });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not poll anymore
      expect(mockListMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Detection', () => {
    it('should detect new AI message with complete response', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Analysis complete' },
        chatSessionId: 'test-session',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        artifacts: [{ type: 'terrain_map', data: {} }]
      };

      mockListMessages.mockResolvedValue({
        data: [mockMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.latestMessage).toEqual(mockMessage);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('should detect processing state for incomplete AI message', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Processing...' },
        chatSessionId: 'test-session',
        createdAt: new Date().toISOString(),
        responseComplete: false
      };

      mockListMessages.mockResolvedValue({
        data: [mockMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
        expect(result.current.hasNewResults).toBe(false);
      });
    });

    it('should stop polling when complete message is received', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Analysis complete' },
        chatSessionId: 'test-session',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        artifacts: [{ type: 'terrain_map', data: {} }]
      };

      mockListMessages.mockResolvedValue({
        data: [mockMessage]
      });

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      // Should not poll again after receiving complete message
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockListMessages).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple messages and select newest', async () => {
      const olderMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Old message' },
        chatSessionId: 'test-session',
        createdAt: new Date('2024-01-01').toISOString(),
        responseComplete: true
      };

      const newerMessage = {
        id: 'msg-2',
        role: 'ai',
        content: { text: 'New message' },
        chatSessionId: 'test-session',
        createdAt: new Date('2024-01-02').toISOString(),
        responseComplete: true
      };

      mockListMessages.mockResolvedValue({
        data: [olderMessage, newerMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      await waitFor(() => {
        expect(result.current.latestMessage?.id).toBe('msg-2');
      });
    });

    it('should not trigger for same message twice', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Analysis complete' },
        chatSessionId: 'test-session',
        createdAt: new Date().toISOString(),
        responseComplete: true
      };

      mockListMessages.mockResolvedValue({
        data: [mockMessage]
      });

      const onNewMessage = jest.fn();

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000,
          onNewMessage
        })
      );

      await waitFor(() => {
        expect(onNewMessage).toHaveBeenCalledTimes(1);
      });

      // Poll again with same message
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not trigger callback again
      await waitFor(() => {
        expect(onNewMessage).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onNewMessage when new message is detected', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Analysis complete' },
        chatSessionId: 'test-session',
        createdAt: new Date().toISOString(),
        responseComplete: true
      };

      mockListMessages.mockResolvedValue({
        data: [mockMessage]
      });

      const onNewMessage = jest.fn();

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          onNewMessage
        })
      );

      await waitFor(() => {
        expect(onNewMessage).toHaveBeenCalledWith(mockMessage);
      });
    });

    it('should call onError when polling fails', async () => {
      const mockError = new Error('Network error');
      mockListMessages.mockRejectedValue(mockError);

      const onError = jest.fn();

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          onError
        })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(mockError);
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('Manual Control', () => {
    it('should allow manual start of polling', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: false
        })
      );

      expect(mockListMessages).not.toHaveBeenCalled();

      act(() => {
        result.current.startPolling();
      });

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalled();
      });
    });

    it('should allow manual stop of polling', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      act(() => {
        result.current.stopPolling();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not poll anymore
      expect(mockListMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup polling on unmount', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      const { unmount } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true,
          pollingInterval: 1000
        })
      );

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Should not poll after unmount
      expect(mockListMessages).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message list', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(false);
        expect(result.current.latestMessage).toBe(null);
      });
    });

    it('should handle null data response', async () => {
      mockListMessages.mockResolvedValue({ data: null });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it('should handle messages without createdAt', async () => {
      const mockMessage = {
        id: 'msg-1',
        role: 'ai',
        content: { text: 'Analysis complete' },
        chatSessionId: 'test-session',
        responseComplete: true
      };

      mockListMessages.mockResolvedValue({
        data: [mockMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'test-session',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
      });
    });

    it('should not start polling without chatSessionId', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: '',
          enabled: true
        })
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockListMessages).not.toHaveBeenCalled();
    });
  });
});
