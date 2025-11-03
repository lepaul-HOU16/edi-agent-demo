import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';

const client = generateClient<Schema>();

export interface ProgressStep {
  step: string;
  message: string;
  elapsed: number;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
}

export interface AgentProgressData {
  requestId: string;
  steps: ProgressStep[];
  status: 'in_progress' | 'complete' | 'error';
  createdAt: number;
  updatedAt: number;
}

export interface UseAgentProgressOptions {
  requestId: string | null;
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
  onComplete?: (data: AgentProgressData) => void;
  onError?: (error: Error) => void;
}

export const useAgentProgress = ({
  requestId,
  enabled = true,
  pollingInterval = 1000,
  onComplete,
  onError,
}: UseAgentProgressOptions) => {
  const [progressData, setProgressData] = useState<AgentProgressData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!requestId || !enabled || completedRef.current) {
      return;
    }

    try {
      // Query the AgentProgress using GraphQL query
      const response = await client.queries.getAgentProgress({ requestId });

      if (response.data) {
        const data = response.data as unknown as AgentProgressData;
        setProgressData(data);
        setError(null);

        // Check if complete
        if (data.status === 'complete' || data.status === 'error') {
          completedRef.current = true;
          setIsPolling(false);

          // Clear polling interval
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Call completion callback
          if (data.status === 'complete' && onComplete) {
            onComplete(data);
          } else if (data.status === 'error' && onError) {
            onError(new Error('Agent processing failed'));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch agent progress:', err);
      const error = err instanceof Error ? err : new Error('Failed to fetch progress');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [requestId, enabled, onComplete, onError]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!requestId || !enabled || isPolling || completedRef.current) {
      return;
    }

    console.log(`[useAgentProgress] Starting polling for requestId: ${requestId}`);
    setIsPolling(true);
    completedRef.current = false;

    // Fetch immediately
    fetchProgress();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchProgress();
    }, pollingInterval);
  }, [requestId, enabled, isPolling, fetchProgress, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('[useAgentProgress] Stopping polling');
    setIsPolling(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    console.log('[useAgentProgress] Resetting state');
    stopPolling();
    setProgressData(null);
    setError(null);
    completedRef.current = false;
  }, [stopPolling]);

  // Auto-start polling when requestId changes
  useEffect(() => {
    if (requestId && enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [requestId, enabled, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    progressData,
    isPolling,
    error,
    startPolling,
    stopPolling,
    reset,
  };
};

export default useAgentProgress;
