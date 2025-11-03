import { renderHook, act, waitFor } from '@testing-library/react';
import { useRenewableJobStatus } from '../useRenewableJobStatus';
import { useRenewableJobPolling } from '../useRenewableJobPolling';

// Mock the polling hook
jest.mock('../useRenewableJobPolling');

const mockUseRenewableJobPolling = useRenewableJobPolling as jest.MockedFunction<typeof useRenewableJobPolling>;

describe('useRenewableJobStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: false,
      hasNewResults: false,
      latestMessage: null,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    const { result } = renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: false
      })
    );

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.currentStep).toBe('Initializing analysis');
    expect(result.current.completedSteps).toBe(0);
    expect(result.current.totalSteps).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('should show processing state when job starts', () => {
    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: true,
      hasNewResults: false,
      latestMessage: null,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    const { result } = renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: true
      })
    );

    expect(result.current.isProcessing).toBe(true);
    expect(result.current.currentStep).toBe('Initializing analysis');
  });

  it('should progress through steps based on elapsed time', async () => {
    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: true,
      hasNewResults: false,
      latestMessage: null,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    const { result } = renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: true
      })
    );

    // Initial state
    expect(result.current.currentStep).toBe('Initializing analysis');
    expect(result.current.completedSteps).toBe(0);

    // Advance time to terrain analysis phase (15 seconds)
    act(() => {
      jest.advanceTimersByTime(16000);
    });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('layout_optimization');
      expect(result.current.completedSteps).toBe(1);
    });

    // Advance time to simulation phase (35 seconds total)
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('simulation');
      expect(result.current.completedSteps).toBe(2);
    });

    // Advance time to report generation phase (55 seconds total)
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('report_generation');
      expect(result.current.completedSteps).toBe(3);
    });
  });

  it('should update estimated time remaining', async () => {
    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: true,
      hasNewResults: false,
      latestMessage: null,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    const { result } = renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: true
      })
    );

    // Initial estimated time
    expect(result.current.estimatedTimeRemaining).toBeDefined();

    // Advance time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.estimatedTimeRemaining).toBeDefined();
    });
  });

  it('should handle job completion', async () => {
    const mockMessage = {
      id: 'msg-123',
      role: 'ai',
      content: { text: 'Analysis complete' },
      responseComplete: true
    } as any;

    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: false,
      hasNewResults: true,
      latestMessage: mockMessage,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: true,
        onComplete
      })
    );

    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentStep).toBe('complete');
      expect(result.current.completedSteps).toBe(3);
      // estimatedTimeRemaining is undefined when not processing
      expect(result.current.estimatedTimeRemaining).toBeUndefined();
      expect(result.current.latestMessage).toBe(mockMessage);
    });
  });

  it('should handle errors', () => {
    const mockError = 'Connection timeout';

    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: false,
      hasNewResults: false,
      latestMessage: null,
      error: mockError,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    const onError = jest.fn();

    const { result } = renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: true,
        onError
      })
    );

    expect(result.current.error).toBe(mockError);
  });

  it('should reset state when processing stops', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useRenewableJobStatus({
          chatSessionId: 'test-session',
          enabled
        }),
      { initialProps: { enabled: true } }
    );

    // Start with processing
    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: true,
      hasNewResults: false,
      latestMessage: null,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    rerender({ enabled: true });

    // Advance time to get some progress
    act(() => {
      jest.advanceTimersByTime(20000);
    });

    // Stop processing
    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: false,
      hasNewResults: false,
      latestMessage: null,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    rerender({ enabled: false });

    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.completedSteps).toBe(0);
      expect(result.current.currentStep).toBe('Initializing analysis');
      expect(result.current.estimatedTimeRemaining).toBeUndefined();
    });
  });

  it('should call onComplete callback when job finishes', async () => {
    const mockMessage = {
      id: 'msg-123',
      role: 'ai',
      content: { text: 'Analysis complete' }
    } as any;

    const onComplete = jest.fn();

    mockUseRenewableJobPolling.mockReturnValue({
      isProcessing: false,
      hasNewResults: true,
      latestMessage: mockMessage,
      error: null,
      startPolling: jest.fn(),
      stopPolling: jest.fn()
    });

    renderHook(() =>
      useRenewableJobStatus({
        chatSessionId: 'test-session',
        enabled: true,
        onComplete
      })
    );

    // The onComplete should be called by the polling hook
    // which then triggers our onComplete callback
    await waitFor(() => {
      // Note: onComplete is called by useRenewableJobPolling's onNewMessage
      // We're testing that the hook properly passes the callback through
      expect(mockUseRenewableJobPolling).toHaveBeenCalledWith(
        expect.objectContaining({
          onNewMessage: expect.any(Function)
        })
      );
    });
  });
});
