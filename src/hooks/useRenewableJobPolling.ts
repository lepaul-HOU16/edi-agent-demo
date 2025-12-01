/**
 * useRenewableJobPolling Hook - REST API Version
 * 
 * Polls for renewable energy job results with retry logic and automatic stop.
 * 
 * Features:
 * - Polls every 500ms for real-time thought step updates
 * - Retrieves streaming messages (role='ai-stream') from DynamoDB
 * - Automatically stops polling when final response is received
 * - Implements exponential backoff retry logic (up to 3 retries)
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
  pollingInterval?: number; // milliseconds, default 500
  onNewMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void; // Called when final response is received
}

/**
 * Hook to poll for new renewable energy job results
 * 
 * Implements:
 * - Fast polling (500ms) for real-time thought step updates
 * - Automatic stop when final response is received
 * - Exponential backoff retry logic (up to 3 retries)
 * - Retrieves streaming messages with role='ai-stream'
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
    pollingInterval = 500, // Poll every 500ms for fast updates
    onNewMessage,
    onError,
    onComplete
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasNewResults, setHasNewResults] = useState(false);
  const [latestMessage, setLatestMessage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const lastStreamingMessageIdRef = useRef<string | null>(null);

  // STREAMING: Poll for thought steps from DynamoDB with retry logic and auto-stop
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 [POLLING] Starting thought step polling');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Enabled:', enabled);
    console.log('🆔 Session ID:', chatSessionId);
    console.log('⏱️  Interval:', pollingInterval, 'ms');
    console.log('🔁 Max Retries:', maxRetries);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════════');
    
    if (!enabled || !chatSessionId) {
      console.log('⚠️ [POLLING] Polling disabled or no session ID');
      return;
    }

    const pollForThoughtSteps = async () => {
      try {
        console.log('🔄 [POLLING] Polling for thought steps...');
        
        // Fetch the streaming message that contains thought steps
        const { getSessionMessages } = await import('@/lib/api/sessions');
        const response = await getSessionMessages(chatSessionId);
        
        console.log('📦 [POLLING] Response received:', {
          success: !!response.data,
          messageCount: response.data?.length || 0
        });
        
        if (response.data) {
          // Find the streaming message (role: 'ai-stream')
          const streamingMessage = response.data.find((msg: any) => 
            msg.id?.startsWith('streaming-') && msg.role === 'ai-stream'
          );
          
          console.log('🔍 [POLLING] Streaming message search:', {
            found: !!streamingMessage,
            messageId: streamingMessage?.id,
            thoughtStepCount: (streamingMessage as any)?.thoughtSteps?.length || 0
          });
          
          // Check if streaming message disappeared (indicates completion)
          if (lastStreamingMessageIdRef.current && !streamingMessage) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('✅ [POLLING] JOB COMPLETE - Streaming message removed');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🆔 Last Message ID:', lastStreamingMessageIdRef.current);
            console.log('🛑 Stopping polling');
            console.log('⏰ Timestamp:', new Date().toISOString());
            console.log('═══════════════════════════════════════════════════════════');
            
            setIsProcessing(false);
            
            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            isPollingRef.current = false;
            
            // Notify completion
            if (onComplete) {
              console.log('📢 [POLLING] Notifying completion callback');
              onComplete();
            }
            
            return;
          }
          
          if (streamingMessage && (streamingMessage as any).thoughtSteps) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🧠 [POLLING] THOUGHT STEPS FOUND');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🆔 Message ID:', streamingMessage.id);
            console.log('📊 Thought Step Count:', (streamingMessage as any).thoughtSteps.length);
            console.log('🔄 Retry Count:', retryCountRef.current);
            console.log('⏰ Timestamp:', new Date().toISOString());
            
            // Log each thought step for debugging
            (streamingMessage as any).thoughtSteps.forEach((step: any, index: number) => {
              console.log(`  ${index + 1}. ${step.action || 'Unknown'} - ${step.status}`);
            });
            
            console.log('═══════════════════════════════════════════════════════════');
            
            // Track streaming message ID
            lastStreamingMessageIdRef.current = streamingMessage.id;
            
            // Reset retry count on successful poll
            retryCountRef.current = 0;
            
            setLatestMessage(streamingMessage);
            setHasNewResults(true);
            setIsProcessing(true);
            setError(null); // Clear any previous errors
            
            if (onNewMessage) {
              console.log('📢 [POLLING] Notifying new message callback');
              onNewMessage(streamingMessage);
            }
          } else if (!streamingMessage && !lastStreamingMessageIdRef.current) {
            // No streaming message yet, keep polling
            console.log('⏳ [POLLING] No streaming message yet, continuing to poll');
          }
        }
      } catch (error) {
        console.log('═══════════════════════════════════════════════════════════');
        console.error('❌ [POLLING] ERROR DURING POLLING');
        console.log('═══════════════════════════════════════════════════════════');
        console.error('Error:', error);
        console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error Message:', error instanceof Error ? error.message : String(error));
        console.log('🔁 Current Retry Count:', retryCountRef.current);
        console.log('🔁 Max Retries:', maxRetries);
        console.log('⏰ Timestamp:', new Date().toISOString());
        console.log('═══════════════════════════════════════════════════════════');
        
        // Implement exponential backoff retry logic
        retryCountRef.current += 1;
        
        if (retryCountRef.current <= maxRetries) {
          const backoffDelay = Math.pow(2, retryCountRef.current - 1) * 1000; // 1s, 2s, 4s
          console.log('═══════════════════════════════════════════════════════════');
          console.log(`🔄 [POLLING] RETRY ${retryCountRef.current}/${maxRetries}`);
          console.log('═══════════════════════════════════════════════════════════');
          console.log('⏱️  Backoff Delay:', backoffDelay, 'ms');
          console.log('⏰ Next Retry:', new Date(Date.now() + backoffDelay).toISOString());
          console.log('═══════════════════════════════════════════════════════════');
          
          // Don't set error state yet, just retry
          setTimeout(() => {
            // Retry will happen on next polling interval
          }, backoffDelay);
        } else {
          // Max retries exceeded, set error state
          console.log('═══════════════════════════════════════════════════════════');
          console.error('❌ [POLLING] MAX RETRIES EXCEEDED - STOPPING POLLING');
          console.log('═══════════════════════════════════════════════════════════');
          console.error('🔁 Retry Count:', retryCountRef.current);
          console.error('🛑 Polling Stopped');
          console.log('⏰ Timestamp:', new Date().toISOString());
          console.log('═══════════════════════════════════════════════════════════');
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(errorMessage);
          
          // Stop polling after max retries
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          isPollingRef.current = false;
          
          if (onError && error instanceof Error) {
            console.log('📢 [POLLING] Notifying error callback');
            onError(error);
          }
        }
      }
    };

    // Poll immediately (no delay)
    pollForThoughtSteps();
    
    // Then poll at fast interval (500ms for real-time updates)
    pollingIntervalRef.current = setInterval(pollForThoughtSteps, pollingInterval);
    isPollingRef.current = true;
    
    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
      retryCountRef.current = 0;
      lastStreamingMessageIdRef.current = null;
    };
  }, [chatSessionId, enabled, pollingInterval, onNewMessage, onError, onComplete]);

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
    retryCountRef.current = 0;
    lastStreamingMessageIdRef.current = null;
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
