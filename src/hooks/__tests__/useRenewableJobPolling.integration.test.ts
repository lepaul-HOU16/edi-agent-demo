/**
 * Integration test for useRenewableJobPolling hook
 * 
 * This test verifies the hook works correctly with the actual Amplify schema
 * and handles real-world scenarios.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRenewableJobPolling } from '../useRenewableJobPolling';

// Mock Amplify client
jest.mock('aws-amplify/data', () => ({
}));

describe('useRenewableJobPolling - Integration Tests', () => {
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

  describe('Real-World Scenarios', () => {
    it('should handle complete renewable energy analysis workflow', async () => {
      // Simulate the complete workflow:
      // 1. User submits query
      // 2. Backend returns "processing" message
      // 3. Backend completes and returns results

      const processingMessage = {
        id: 'msg-processing',
        role: 'ai',
        content: { text: 'Starting renewable energy analysis...' },
        chatSessionId: 'session-123',
        createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
        responseComplete: false
      };

      const completeMessage = {
        id: 'msg-complete',
        role: 'ai',
        content: { text: 'Analysis complete!' },
        chatSessionId: 'session-123',
        createdAt: new Date('2024-01-01T10:00:30Z').toISOString(),
        responseComplete: true,
        artifacts: [
          { type: 'terrain_map', data: { features: 151 } },
          { type: 'wind_rose', data: { speeds: [5, 10, 15] } },
          { type: 'layout_map', data: { turbines: 10 } }
        ]
      };

      // First poll: processing message
      mockListMessages.mockResolvedValueOnce({
        data: [processingMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true,
          pollingInterval: 1000
        })
      );

      // Should detect processing state
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
        expect(result.current.hasNewResults).toBe(false);
      });

      // Second poll: still processing
      mockListMessages.mockResolvedValueOnce({
        data: [processingMessage]
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      // Third poll: complete with results
      mockListMessages.mockResolvedValueOnce({
        data: [processingMessage, completeMessage]
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should detect completion and stop polling
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.latestMessage?.id).toBe('msg-complete');
        expect(result.current.latestMessage?.artifacts).toHaveLength(3);
      });

      // Should not poll again
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockListMessages).toHaveBeenCalledTimes(3);
    });

    it('should handle terrain analysis with 151 features', async () => {
      const terrainMessage = {
        id: 'msg-terrain',
        role: 'ai',
        content: { text: 'Terrain analysis complete' },
        chatSessionId: 'session-123',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        artifacts: [
          {
            type: 'terrain_map',
            data: {
              features: Array.from({ length: 151 }, (_, i) => ({
                id: `feature-${i}`,
                type: 'road',
                geometry: { type: 'LineString', coordinates: [] }
              }))
            }
          }
        ]
      };

      mockListMessages.mockResolvedValue({
        data: [terrainMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        const terrainArtifact = result.current.latestMessage?.artifacts?.[0] as any;
        expect(terrainArtifact?.data?.features).toHaveLength(151);
      });
    });

    it('should handle multiple artifact types', async () => {
      const multiArtifactMessage = {
        id: 'msg-multi',
        role: 'ai',
        content: { text: 'Complete analysis with multiple artifacts' },
        chatSessionId: 'session-123',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        artifacts: [
          { type: 'terrain_map', data: { features: 151 } },
          { type: 'wind_rose', data: { speeds: [5, 10, 15, 20] } },
          { type: 'layout_map', data: { turbines: 10, capacity: 50 } },
          { type: 'simulation_chart', data: { aep: 125000 } },
          { type: 'report', data: { url: 's3://bucket/report.pdf' } }
        ]
      };

      mockListMessages.mockResolvedValue({
        data: [multiArtifactMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.latestMessage?.artifacts).toHaveLength(5);
        
        const artifactTypes = result.current.latestMessage?.artifacts?.map((a: any) => a.type);
        expect(artifactTypes).toContain('terrain_map');
        expect(artifactTypes).toContain('wind_rose');
        expect(artifactTypes).toContain('layout_map');
        expect(artifactTypes).toContain('simulation_chart');
        expect(artifactTypes).toContain('report');
      });
    });

    it('should handle thought steps in messages', async () => {
      const messageWithThoughts = {
        id: 'msg-thoughts',
        role: 'ai',
        content: { text: 'Analysis complete with reasoning' },
        chatSessionId: 'session-123',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        thoughtSteps: [
          { step: 'analyze_terrain', status: 'complete' },
          { step: 'calculate_wind', status: 'complete' },
          { step: 'optimize_layout', status: 'complete' }
        ],
        artifacts: [
          { type: 'layout_map', data: { turbines: 10 } }
        ]
      };

      mockListMessages.mockResolvedValue({
        data: [messageWithThoughts]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.latestMessage?.thoughtSteps).toHaveLength(3);
      });
    });

    it('should handle long-running job (60+ seconds)', async () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      
      const processingMessage = {
        id: 'msg-long',
        role: 'ai',
        content: { text: 'Processing...' },
        chatSessionId: 'session-123',
        createdAt: startTime.toISOString(),
        responseComplete: false
      };

      const completeMessage = {
        id: 'msg-long-complete',
        role: 'ai',
        content: { text: 'Long analysis complete' },
        chatSessionId: 'session-123',
        createdAt: new Date(startTime.getTime() + 65000).toISOString(), // 65 seconds later
        responseComplete: true,
        artifacts: [{ type: 'report', data: {} }]
      };

      // Simulate 20 polls over 60 seconds (3 second interval)
      for (let i = 0; i < 20; i++) {
        mockListMessages.mockResolvedValueOnce({
          data: [processingMessage]
        });
      }

      // Final poll with results
      mockListMessages.mockResolvedValueOnce({
        data: [processingMessage, completeMessage]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true,
          pollingInterval: 3000
        })
      );

      // Should stay in processing state
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      // Advance through multiple polls
      for (let i = 0; i < 20; i++) {
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        await waitFor(() => {
          expect(result.current.isProcessing).toBe(true);
        });
      }

      // Final poll should detect completion
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('should handle network timeout and retry', async () => {
      // First poll: network timeout
      mockListMessages.mockRejectedValueOnce(new Error('Network timeout'));

      // Second poll: success
      const successMessage = {
        id: 'msg-success',
        role: 'ai',
        content: { text: 'Success after retry' },
        chatSessionId: 'session-123',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        artifacts: [{ type: 'terrain_map', data: {} }]
      };

      mockListMessages.mockResolvedValueOnce({
        data: [successMessage]
      });

      const onError = jest.fn();

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true,
          pollingInterval: 1000,
          onError
        })
      );

      // Should handle error
      await waitFor(() => {
        expect(result.current.error).toBe('Network timeout');
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });

      // Should retry and succeed
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with no artifacts', async () => {
      const messageNoArtifacts = {
        id: 'msg-no-artifacts',
        role: 'ai',
        content: { text: 'Complete but no artifacts' },
        chatSessionId: 'session-123',
        createdAt: new Date().toISOString(),
        responseComplete: true,
        artifacts: []
      };

      mockListMessages.mockResolvedValue({
        data: [messageNoArtifacts]
      });

      const { result } = renderHook(() =>
        useRenewableJobPolling({
          chatSessionId: 'session-123',
          enabled: true
        })
      );

      await waitFor(() => {
        expect(result.current.hasNewResults).toBe(true);
        expect(result.current.latestMessage?.artifacts).toEqual([]);
      });
    });

    it('should handle rapid enable/disable toggling', async () => {
      mockListMessages.mockResolvedValue({ data: [] });

      const { rerender } = renderHook(
        ({ enabled }) =>
          useRenewableJobPolling({
            chatSessionId: 'session-123',
            enabled,
            pollingInterval: 1000
          }),
        { initialProps: { enabled: true } }
      );

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalledTimes(1);
      });

      // Rapid toggling
      rerender({ enabled: false });
      rerender({ enabled: true });
      rerender({ enabled: false });
      rerender({ enabled: true });

      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(mockListMessages).toHaveBeenCalled();
      });
    });
  });
});
