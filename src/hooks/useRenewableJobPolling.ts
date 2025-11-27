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

  // STREAMING: Poll for thought steps from DynamoDB
  useEffect(() => {
    console.log('[useRenewableJobPolling] Starting thought step polling', { enabled, chatSessionId });
    
    if (!enabled || !chatSessionId) {
      return;
    }

    const pollForThoughtSteps = async () => {
      try {
        // Fetch the streaming message that contains thought steps
        const { getSessionMessages } = await import('@/lib/api/sessions');
        const response = await getSessionMessages(chatSessionId);
        
        if (response.data) {
          // Find the streaming message (role: 'ai-stream')
          const streamingMessage = response.data.find((msg: any) => 
            msg.id?.startsWith('streaming-') && msg.role === 'ai-stream'
          );
          
          if (streamingMessage && streamingMessage.thoughtSteps) {
            console.log('[useRenewableJobPolling] Found streaming thought steps:', streamingMessage.thoughtSteps.length);
            setLatestMessage(streamingMessage);
            setHasNewResults(true);
            setIsProcessing(true);
            
            if (onNewMessage) {
              onNewMessage(streamingMessage);
            }
          }
        }
      } catch (error) {
        console.error('[useRenewableJobPolling] Error polling for thought steps:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    };

    // Poll immediately
    pollForThoughtSteps();
    
    // Then poll at interval
    pollingIntervalRef.current = setInterval(pollForThoughtSteps, pollingInterval);
    isPollingRef.current = true;
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [chatSessionId, enabled, pollingInterval, onNewMessage, onError]);

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
