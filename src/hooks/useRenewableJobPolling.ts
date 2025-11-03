import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/../amplify/data/resource';

interface RenewableJobStatus {
  isProcessing: boolean;
  hasNewResults: boolean;
  latestMessage: Schema['ChatMessage']['type'] | null;
  error: string | null;
}

interface UseRenewableJobPollingOptions {
  chatSessionId: string;
  enabled: boolean;
  pollingInterval?: number; // milliseconds, default 3000 (3 seconds)
  onNewMessage?: (message: Schema['ChatMessage']['type']) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to poll ChatMessage table for new renewable energy job results
 * 
 * Polls every 3-5 seconds while job is processing and stops when results appear.
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
    pollingInterval = 3000, // Default 3 seconds
    onNewMessage,
    onError
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasNewResults, setHasNewResults] = useState(false);
  const [latestMessage, setLatestMessage] = useState<Schema['ChatMessage']['type'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const amplifyClientRef = useRef<ReturnType<typeof generateClient<Schema>> | null>(null);
  const isPollingRef = useRef(false);

  // Initialize Amplify client
  useEffect(() => {
    try {
      amplifyClientRef.current = generateClient<Schema>();
    } catch (err) {
      console.error('Failed to initialize Amplify client for polling:', err);
      setError('Failed to initialize polling client');
    }
  }, []);

  /**
   * Check for new messages in the chat session
   */
  const checkForNewMessages = useCallback(async () => {
    if (!amplifyClientRef.current || !chatSessionId) {
      return;
    }

    try {
      console.log('🔄 Polling for new renewable job results...', {
        chatSessionId,
        lastMessageId: lastMessageIdRef.current
      });

      // Query for messages in this chat session, ordered by creation time
      // CRITICAL: Use authMode to bypass cache and get fresh data from DynamoDB
      const result = await amplifyClientRef.current.models.ChatMessage.list({
        filter: {
          chatSessionId: { eq: chatSessionId }
        },
        selectionSet: [
          'id',
          'role',
          'content.*',
          'chatSessionId',
          'createdAt',
          'responseComplete',
          'artifacts',
          'thoughtSteps'
        ],
        authMode: 'userPool' // Force fresh query, bypass cache
      });

      if (!result.data || result.data.length === 0) {
        console.log('📭 No messages found in chat session');
        return;
      }

      // Sort messages by creation time (newest first)
      const sortedMessages = [...result.data].sort((a, b) => {
        const createdAtA = Array.isArray(a.createdAt) ? a.createdAt[0] : a.createdAt;
        const createdAtB = Array.isArray(b.createdAt) ? b.createdAt[0] : b.createdAt;
        const timeA = createdAtA ? new Date(createdAtA).getTime() : 0;
        const timeB = createdAtB ? new Date(createdAtB).getTime() : 0;
        return timeB - timeA;
      });

      const newestMessage = sortedMessages[0];

      // Check if this is a new message we haven't seen before
      const messageId = Array.isArray(newestMessage.id) ? newestMessage.id[0] : newestMessage.id;
      const messageRole = Array.isArray(newestMessage.role) ? newestMessage.role[0] : newestMessage.role;
      
      if (messageId !== lastMessageIdRef.current) {
        console.log('✨ New message detected!', {
          messageId: messageId,
          role: messageRole,
          hasArtifacts: !!(newestMessage.artifacts && newestMessage.artifacts.length > 0),
          responseComplete: newestMessage.responseComplete
        });

        // Check if this is an AI response with results
        if (messageRole === 'ai' && newestMessage.responseComplete) {
          setLatestMessage(newestMessage as any);
          setHasNewResults(true);
          setIsProcessing(false);
          lastMessageIdRef.current = messageId;

          // Notify callback
          if (onNewMessage) {
            onNewMessage(newestMessage as any);
          }

          // Stop polling since we got results
          console.log('✅ Job complete! Stopping polling.');
          stopPolling();
        } else if (messageRole === 'ai' && !newestMessage.responseComplete) {
          // Job is still processing
          console.log('⏳ Job still processing...');
          setIsProcessing(true);
          lastMessageIdRef.current = messageId;
        }
      } else {
        console.log('📝 No new messages since last check');
      }

      // Clear any previous errors
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown polling error';
      console.error('❌ Error polling for messages:', err);
      setError(errorMessage);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  }, [chatSessionId, onNewMessage, onError]);

  /**
   * Start polling for new messages
   */
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('⚠️ Polling already active');
      return;
    }

    console.log('▶️ Starting renewable job polling', {
      chatSessionId,
      interval: pollingInterval
    });

    isPollingRef.current = true;
    setIsProcessing(true);
    setHasNewResults(false);
    setError(null);

    // Check immediately
    checkForNewMessages();

    // Then poll at regular intervals
    pollingIntervalRef.current = setInterval(() => {
      checkForNewMessages();
    }, pollingInterval);
  }, [chatSessionId, pollingInterval, checkForNewMessages]);

  /**
   * Stop polling for new messages
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping renewable job polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
    setIsProcessing(false);
  }, []);

  // Auto-start polling when enabled
  useEffect(() => {
    if (enabled && chatSessionId) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, chatSessionId, startPolling, stopPolling]);

  return {
    isProcessing,
    hasNewResults,
    latestMessage,
    error,
    startPolling,
    stopPolling
  };
}
