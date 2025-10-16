/**
 * Simplified ThoughtStep Component - AgentCore-style chain of thought display
 * Clean, minimal design using Cloudscape components exclusively
 * Matches AgentCore's professional, uncluttered appearance
 */

'use client';

import React, { useState } from 'react';
import {
  ExpandableSection,
  StatusIndicator,
  Box,
  SpaceBetween,
  Spinner,
  Alert
} from '@cloudscape-design/components';

export interface ThoughtStep {
  step: number;
  action: string;
  reasoning?: string;
  result?: string;
  status: 'in_progress' | 'complete' | 'error';
  duration?: number;  // milliseconds
  timestamp: string;
  error?: {
    message: string;
    suggestion?: string;
  };
}

interface SimplifiedThoughtStepProps {
  step: ThoughtStep;
}

/**
 * Get status indicator type based on step status
 */
const getStatusType = (status: ThoughtStep['status']): 'success' | 'error' | 'in-progress' => {
  switch (status) {
    case 'complete':
      return 'success';
    case 'error':
      return 'error';
    case 'in_progress':
      return 'in-progress';
    default:
      return 'in-progress';
  }
};

/**
 * Format duration for display
 */
const formatDuration = (duration?: number): string => {
  if (!duration) return '';
  return `${duration}ms`;
};

const SimplifiedThoughtStep: React.FC<SimplifiedThoughtStepProps> = ({ step }) => {
  // Default collapsed for completed steps, always expanded for in-progress and error
  const [expanded, setExpanded] = useState(
    step.status === 'in_progress' || step.status === 'error'
  );

  // For completed steps, show collapsed by default
  if (step.status === 'complete') {
    return (
      <ExpandableSection
        variant="container"
        expanded={expanded}
        onChange={({ detail }) => setExpanded(detail.expanded)}
        headerText={
          <SpaceBetween direction="horizontal" size="xs">
            <StatusIndicator type="success">
              {step.step}. {step.action}
            </StatusIndicator>
            {step.duration && (
              <Box variant="small" color="text-status-inactive">
                {formatDuration(step.duration)}
              </Box>
            )}
          </SpaceBetween>
        }
      >
        <SpaceBetween size="s">
          {step.reasoning && (
            <Box>
              <Box variant="strong">Action:</Box>
              <Box>{step.reasoning}</Box>
            </Box>
          )}
          {step.result && (
            <Box>
              <Box variant="strong">Result:</Box>
              <Box>{step.result}</Box>
            </Box>
          )}
        </SpaceBetween>
      </ExpandableSection>
    );
  }

  // For in-progress steps, always expanded with spinner
  if (step.status === 'in_progress') {
    return (
      <ExpandableSection
        variant="container"
        expanded={true}
        onChange={() => {}} // Cannot collapse in-progress steps
        headerText={
          <SpaceBetween direction="horizontal" size="xs">
            <Spinner size="normal" />
            <Box>{step.step}. {step.action}</Box>
          </SpaceBetween>
        }
      >
        {step.reasoning && (
          <Box color="text-body-secondary">
            {step.reasoning}
          </Box>
        )}
      </ExpandableSection>
    );
  }

  // For error steps, always expanded with alert
  if (step.status === 'error') {
    return (
      <ExpandableSection
        variant="container"
        expanded={true}
        onChange={() => {}} // Cannot collapse error steps
        headerText={
          <SpaceBetween direction="horizontal" size="xs">
            <StatusIndicator type="error">
              {step.step}. {step.action}
            </StatusIndicator>
            {step.duration && (
              <Box variant="small" color="text-status-inactive">
                {formatDuration(step.duration)}
              </Box>
            )}
          </SpaceBetween>
        }
      >
        <Alert
          type="error"
          header={step.error?.message || 'An error occurred'}
        >
          {step.error?.suggestion && (
            <Box>
              <Box variant="strong">Suggestion:</Box>
              <Box>{step.error.suggestion}</Box>
            </Box>
          )}
          {step.result && (
            <Box>
              <Box variant="strong">Details:</Box>
              <Box>{step.result}</Box>
            </Box>
          )}
        </Alert>
      </ExpandableSection>
    );
  }

  return null;
};

/**
 * Container component for multiple thought steps
 */
export const SimplifiedThoughtStepList: React.FC<{
  steps: ThoughtStep[];
}> = ({ steps }) => {
  return (
    <SpaceBetween size="s">
      {steps.map((step) => (
        <SimplifiedThoughtStep key={step.step} step={step} />
      ))}
    </SpaceBetween>
  );
};

export default SimplifiedThoughtStep;
