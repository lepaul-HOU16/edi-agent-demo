import { useState, useEffect, useCallback } from 'react';
import { useRenewableJobPolling } from './useRenewableJobPolling';
import { Schema } from '@/types/api';

interface RenewableJobStatusState {
  isProcessing: boolean;
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  estimatedTimeRemaining?: number;
  error: string | null;
  latestMessage: Schema['ChatMessage']['type'] | null;
}

interface UseRenewableJobStatusOptions {
  chatSessionId: string;
  enabled: boolean;
  onComplete?: (message: Schema['ChatMessage']['type']) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to manage renewable job status and processing state
 * 
 * Combines polling functionality with UI state management for:
 * - Processing indicators
 * - Progress tracking
 * - Error handling
 * - Auto-update on completion
 * 
 * Requirements: 2, 3 from async-renewable-jobs spec
 */
export function useRenewableJobStatus(options: UseRenewableJobStatusOptions): RenewableJobStatusState {
  const { chatSessionId, enabled, onComplete, onError } = options;

  const [currentStep, setCurrentStep] = useState<string>('Initializing analysis');
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [totalSteps] = useState<number>(3); // terrain, layout, simulation
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | undefined>(60);
  const [startTime] = useState<number>(Date.now());

  // Use the polling hook
  const {
    isProcessing,
    hasNewResults,
    latestMessage,
    error: pollingError,
    startPolling,
    stopPolling
  } = useRenewableJobPolling({
    chatSessionId,
    enabled,
    pollingInterval: 3000, // 3 seconds
    onNewMessage: (message) => {
      console.log('✅ Renewable job complete!', message);
      if (onComplete) {
        onComplete(message);
      }
    },
    onError: (error) => {
      console.error('❌ Renewable job error:', error);
      if (onError) {
        onError(error);
      }
    }
  });

  // Update estimated time remaining based on elapsed time
  useEffect(() => {
    if (!isProcessing) {
      setEstimatedTimeRemaining(undefined);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const averageStepTime = 20; // seconds per step
      const remainingSteps = totalSteps - completedSteps;
      const estimated = Math.max(0, remainingSteps * averageStepTime - (elapsed % averageStepTime));
      
      setEstimatedTimeRemaining(Math.ceil(estimated));
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, completedSteps, totalSteps, startTime]);

  // Simulate step progression (in real implementation, this would come from backend)
  useEffect(() => {
    if (!isProcessing) {
      setCompletedSteps(0);
      setCurrentStep('Initializing analysis');
      return;
    }

    // Simulate step progression based on elapsed time
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed < 15) {
        setCurrentStep('terrain_analysis');
        setCompletedSteps(0);
      } else if (elapsed < 35) {
        setCurrentStep('layout_optimization');
        setCompletedSteps(1);
      } else if (elapsed < 55) {
        setCurrentStep('simulation');
        setCompletedSteps(2);
      } else {
        setCurrentStep('report_generation');
        setCompletedSteps(3);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, startTime]);

  // Reset state when job completes
  useEffect(() => {
    if (hasNewResults && latestMessage) {
      setCompletedSteps(totalSteps);
      setCurrentStep('complete');
      setEstimatedTimeRemaining(0);
    }
  }, [hasNewResults, latestMessage, totalSteps]);

  return {
    isProcessing,
    currentStep,
    completedSteps,
    totalSteps,
    estimatedTimeRemaining,
    error: pollingError,
    latestMessage
  };
}
