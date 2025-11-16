/**
 * useChatMessagePolling Hook
 * 
 * Polls for chat message updates to automatically refresh the UI when
 * long-running operations (like terrain analysis) complete.
 * 
 * NOTE: Currently disabled as we transition to REST API.
 * Messages are fetched directly from DynamoDB via page load.
 * Real-time updates will be implemented via WebSocket in future.
 */

import { useEffect, useRef, useState } from 'react';

interface UseChatMessagePollingOptions {
  chatSessionId: string;
  enabled?: boolean;
  interval?: number; // milliseconds
  onMessagesUpdated?: (messages: any[]) => void;
}

export function useChatMessagePolling({
  chatSessionId,
  enabled = true,
  interval = 3000, // Poll every 3 seconds
  onMessagesUpdated,
}: UseChatMessagePollingOptions) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  useEffect(() => {
    // TEMPORARY: Polling disabled during REST API migration
    // Messages are loaded directly from DynamoDB on page load
    // Real-time updates will be implemented via WebSocket later
    console.log('[useChatMessagePolling] Polling temporarily disabled during REST API migration');
    
    if (!enabled || !chatSessionId) {
      return;
    }

    // TODO: Implement REST API polling when messages endpoint is available
    // For now, rely on page refresh to get updated messages
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chatSessionId, enabled, interval]);

  return {
    isPolling,
    lastUpdateTime,
  };
}
