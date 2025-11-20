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
    if (!enabled || !chatSessionId) {
      console.log('[useChatMessagePolling] Polling disabled or no session ID');
      return;
    }

    console.log('[useChatMessagePolling] Starting polling for session:', chatSessionId);
    setIsPolling(true);

    const pollMessages = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com';
        
        console.log('[useChatMessagePolling] Polling...', {
          sessionId: chatSessionId,
          apiUrl: API_BASE_URL,
          timestamp: new Date().toISOString()
        });
        
        // Get auth token using the proper auth method
        const { getAuthToken } = await import('@/lib/api/client');
        const token = await getAuthToken();

        if (!token) {
          console.error('[useChatMessagePolling] No auth token available');
          return;
        }

        const url = `${API_BASE_URL}/api/chat/sessions/${chatSessionId}/messages`;
        console.log('[useChatMessagePolling] Fetching from:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[useChatMessagePolling] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useChatMessagePolling] Failed to fetch messages:', response.status, errorText);
          return;
        }

        const data = await response.json();
        console.log('[useChatMessagePolling] Response data:', data);
        
        const messages = data.data || data.messages || [];

        console.log('[useChatMessagePolling] Fetched messages:', messages.length, 'Previous:', lastMessageCountRef.current);

        // Check if we have new messages
        if (messages.length > lastMessageCountRef.current) {
          console.log('[useChatMessagePolling] ✨ New messages detected:', messages.length - lastMessageCountRef.current);
          console.log('[useChatMessagePolling] Calling onMessagesUpdated with', messages.length, 'messages');
          onMessagesUpdated?.(messages);
          lastMessageCountRef.current = messages.length;
          setLastUpdateTime(Date.now());
        } else {
          console.log('[useChatMessagePolling] No new messages');
        }
      } catch (error) {
        console.error('[useChatMessagePolling] Polling error:', error);
      }
    };

    // Poll immediately
    pollMessages();

    // Then poll at interval
    intervalRef.current = setInterval(pollMessages, interval);

    // Cleanup
    return () => {
      console.log('[useChatMessagePolling] Stopping polling');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [chatSessionId, enabled, interval, onMessagesUpdated]);

  return {
    isPolling,
    lastUpdateTime,
  };
}
