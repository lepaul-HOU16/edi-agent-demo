import React, { useEffect, useState } from 'react';
import { useRenewableJobStatus } from '@/hooks/useRenewableJobStatus';
import { RenewableJobProcessingIndicator } from './RenewableJobProcessingIndicator';
import { Schema } from '@/types/api';

interface RenewableJobStatusDisplayProps {
  chatSessionId: string;
  enabled: boolean;
  onComplete?: (message: Schema['ChatMessage']['type']) => void;
  onError?: (error: Error) => void;
}

/**
 * Display component for renewable job processing status
 * 
 * Integrates polling and UI state to show:
 * - Real-time processing indicators
 * - Progress updates
 * - Automatic result display
 * 
 * Usage in chat interface:
 * ```tsx
 * <RenewableJobStatusDisplay
 *   chatSessionId={chatSessionId}
 *   enabled={isRenewableJobActive}
 *   onComplete={(message) => {
 *     // Handle completion - message will auto-display via polling
 *     console.log('Job complete!', message);
 *   }}
 * />
 * ```
 * 
 * Requirements: 2, 3 from async-renewable-jobs spec
 */
export const RenewableJobStatusDisplay: React.FC<RenewableJobStatusDisplayProps> = ({
  chatSessionId,
  enabled,
  onComplete,
  onError
}) => {
  const [showIndicator, setShowIndicator] = useState(false);

  const jobStatus = useRenewableJobStatus({
    chatSessionId,
    enabled,
    onComplete: (message) => {
      console.log('✅ RenewableJobStatusDisplay: Job complete, hiding indicator');
      setShowIndicator(false);
      if (onComplete) {
        onComplete(message);
      }
    },
    onError: (error) => {
      console.error('❌ RenewableJobStatusDisplay: Job error');
      if (onError) {
        onError(error);
      }
    }
  });

  // Show indicator when processing starts
  useEffect(() => {
    if (jobStatus.isProcessing) {
      console.log('🔄 RenewableJobStatusDisplay: Processing started, showing indicator');
      setShowIndicator(true);
    }
  }, [jobStatus.isProcessing]);

  // Hide indicator when job completes
  useEffect(() => {
    if (jobStatus.latestMessage && !jobStatus.isProcessing) {
      console.log('✅ RenewableJobStatusDisplay: Job complete, will hide indicator');
      // Keep indicator visible briefly to show completion
      const timeout = setTimeout(() => {
        setShowIndicator(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [jobStatus.latestMessage, jobStatus.isProcessing]);

  if (!showIndicator && !jobStatus.isProcessing) {
    return null;
  }

  return (
    <RenewableJobProcessingIndicator
      isProcessing={jobStatus.isProcessing}
      currentStep={jobStatus.currentStep}
      completedSteps={jobStatus.completedSteps}
      totalSteps={jobStatus.totalSteps}
      estimatedTimeRemaining={jobStatus.estimatedTimeRemaining}
      error={jobStatus.error}
    />
  );
};

export default RenewableJobStatusDisplay;
