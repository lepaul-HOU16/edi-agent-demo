/**
 * useRenewableJobPolling Hook - REST API Version
 * 
 * Polls for renewable energy job results.
 * 
 * NOTE: Currently disabled as we transition to REST API.
 * Job status will be tracked via WebSocket in future implementation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface RenewableJobStatus {
  isProcessing: boolean;
  hasNewResults: boolean;
  latestMessage: any | null;
  error: string | null;
}

interface UseRenewableJobPollingOptions {
  chatSessionId: string;
  enabled: boolean;
  pollingInterval?: number; // milliseconds, default 3000 (3 seconds)
  onNewMessage?: (message: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to poll for new renewable energy job results
 * 
 * TEMPORARY: Polling disabled during REST API migration.
 * Job results are loaded on page refresh.
 * Real-time updates will use WebSocket in future.
 * 
 * @param options - Configuration options for polling
 * @returns Job status and control functions
 */
export function useRenewableJobPolling(options: UseRenewableJobPollingOptions): RenewableJobStatus & {
  startPolling: () => void;
  stopPolling: () => void;
} {
  const {
    chatSessionId,
    enabled,
    pollingInterval = 3000,
    onNewMessage,
    onError
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasNewResults, setHasNewResults] = useState(false);
  const [latestMessage, setLatestMessage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // TEMPORARY: Polling disabled during REST API migration
  useEffect(() => {
    console.log('[useRenewableJobPolling] Polling temporarily disabled during REST API migration');
    
    if (!enabled || !chatSessionId) {
      return;
    }

    // TODO: Implement REST API polling when job status endpoint is available
    // For now, rely on page refresh to get updated results
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chatSessionId, enabled, pollingInterval]);

  const startPolling = useCallback(() => {
    console.log('[useRenewableJobPolling] Start polling called (currently disabled)');
    // TODO: Implement when REST API job status endpoint is available
  }, []);

  const stopPolling = useCallback(() => {
    console.log('[useRenewableJobPolling] Stop polling called');
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    hasNewResults,
    latestMessage,
    error,
    startPolling,
    stopPolling
  };
}
