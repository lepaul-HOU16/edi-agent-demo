/**
 * useAgentProgress Hook - REST API Version
 * 
 * Tracks agent progress for long-running operations.
 * 
 * NOTE: Currently disabled as we transition to REST API.
 * Progress tracking will be implemented via WebSocket in future.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

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

  // TEMPORARY: Progress tracking disabled during REST API migration
  const fetchProgress = useCallback(async () => {
    if (!requestId || !enabled || completedRef.current) {
      return;
    }

    console.log('[useAgentProgress] Progress tracking temporarily disabled during REST API migration');
    
    // TODO: Implement REST API progress endpoint
    // For now, progress is not tracked in real-time
    
  }, [requestId, enabled]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!requestId || !enabled || isPolling) {
      return;
    }

    console.log('[useAgentProgress] Polling temporarily disabled during REST API migration');
    
    // TODO: Implement when REST API progress endpoint is available
    
  }, [requestId, enabled, isPolling, fetchProgress, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto-start polling when requestId changes
  useEffect(() => {
    if (requestId && enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [requestId, enabled]); // Removed startPolling and stopPolling from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []); // Removed stopPolling from dependencies

  return {
    progressData,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refetch: fetchProgress,
  };
};
