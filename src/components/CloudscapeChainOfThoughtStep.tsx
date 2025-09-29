/**
 * Cloudscape Chain of Thought Step with Source Attribution
 * Enhanced version of ChainOfThoughtStep using Cloudscape Design System
 * Shows trusted source links OUTSIDE progressive disclosure for transparency
 */

import React from 'react';
import {
  Container,
  Header,
  ExpandableSection,
  SpaceBetween,
  Badge,
  Link,
  Icon,
  Box,
  StatusIndicator,
  ProgressBar
} from '@cloudscape-design/components';
import CloudscapeSourceAttribution from './CloudscapeSourceAttribution';

interface SourceAttribution {
  url: string;
  title: string;
  domain: string;
  trustLevel: 'high' | 'medium' | 'low';
  relevanceScore: number;
  lastAccessed: string;
  summary?: string;
  category: 'government' | 'academic' | 'industry' | 'news';
}

interface EnhancedThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 'execution' | 'validation' | 'completion';
  timestamp: number;
  title: string;
  summary: string;
  details?: string;
  confidence?: number;
  duration?: number;
  status: 'thinking' | 'complete' | 'error';
  context?: {
    wellName?: string;
    analysisType?: string;
    method?: string;
    parameters?: Record<string, any>;
  };
  sources?: SourceAttribution[];
}

interface Props {
  step: EnhancedThoughtStep;
  isLast?: boolean;
  showProgress?: boolean;
}

/**
 * Get status indicator type based on step status
 */
const getStatusType = (status: string, type: string): 'success' | 'info' | 'warning' | 'error' | 'in-progress' => {
  if (status === 'error') return 'error';
  if (status === 'thinking') return 'in-progress';
  if (status === 'complete') return 'success';
  return 'info';
};

/**
 * Get step icon based on type
 */
const getStepIcon = (type: string): 'search' | 'settings' | 'folder' | 'external' | 'check' => {
  switch (type) {
    case 'intent_detection': return 'search';
    case 'parameter_extraction': return 'settings';
    case 'tool_selection': return 'folder';
    case 'execution': return 'external';
    case 'validation': return 'check';
    case 'completion': return 'check';
    default: return 'search';
  }
};

/**
 * Format duration for display
 */
const formatDuration = (duration?: number): string => {
  if (!duration) return '';
  
  const seconds = Math.round(duration / 1000);
  if (seconds < 1) return '< 1s';
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Get progress percentage based on step type and status
 */
const getProgress = (step: EnhancedThoughtStep): number => {
  if (step.status === 'complete') return 100;
  if (step.status === 'error') return 0;
  
  // Estimated progress based on step type
  const progressMap = {
    intent_detection: 10,
    parameter_extraction: 30,
    tool_selection: 50,
    execution: 75,
    validation: 90,
    completion: 100
  };
  
  return progressMap[step.type] || 50;
};

const CloudscapeChainOfThoughtStep: React.FC<Props> = ({ 
  step, 
  isLast = false, 
  showProgress = false 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <Container>
      {/* Main step header with sources OUTSIDE expandable section */}
      <Header
        description={
          <SpaceBetween size="xs">
            {/* Duration and confidence metrics */}
            <SpaceBetween direction="horizontal" size="xs">
              {step.duration && (
                <Box variant="small" color="text-status-info">
                  {formatDuration(step.duration)}
                </Box>
              )}
              {step.confidence && (
                <Box variant="small" color="text-status-info">
                  Confidence: {Math.round(step.confidence * 100)}%
                </Box>
              )}
            </SpaceBetween>
            
            {/* Source attribution - ALWAYS VISIBLE outside progressive disclosure */}
            {step.sources && step.sources.length > 0 && (
              <CloudscapeSourceAttribution 
                sources={step.sources} 
                compact={true} 
              />
            )}
            
            {/* Progress bar for active steps */}
            {showProgress && step.status === 'thinking' && (
              <ProgressBar
                value={getProgress(step)}
                additionalInfo="Processing..."
                description="Step progress"
              />
            )}
          </SpaceBetween>
        }
      >
        <SpaceBetween direction="horizontal" size="s">
          <StatusIndicator type={getStatusType(step.status, step.type)}>
            <SpaceBetween direction="horizontal" size="xs">
              <Icon name={getStepIcon(step.type)} />
              <Box>{step.title}</Box>
            </SpaceBetween>
          </StatusIndicator>
        </SpaceBetween>
      </Header>

      {/* Summary - always visible */}
      <Box variant="p" color="text-body-secondary">
        {step.summary}
      </Box>

      {/* Expandable detailed process information */}
      {(step.details || step.context) && (
        <ExpandableSection
          header="View detailed process"
          expanded={isExpanded}
          onChange={({ detail }) => setIsExpanded(detail.expanded)}
        >
          <SpaceBetween size="s">
            {/* Detailed information */}
            {step.details && (
              <Box>
                {step.details}
              </Box>
            )}
            
            {/* Context information */}
            {step.context && (
              <Container>
                <Header>Process Context</Header>
                <SpaceBetween size="xs">
                  {step.context.analysisType && (
                    <SpaceBetween direction="horizontal" size="s">
                      <Badge color="blue">Type</Badge>
                      <Box variant="small">{step.context.analysisType}</Box>
                    </SpaceBetween>
                  )}
                  {step.context.wellName && (
                    <SpaceBetween direction="horizontal" size="s">
                      <Badge color="green">Well</Badge>
                      <Box variant="small">{step.context.wellName}</Box>
                    </SpaceBetween>
                  )}
                  {step.context.method && (
                    <SpaceBetween direction="horizontal" size="s">
                      <Badge color="grey">Method</Badge>
                      <Box variant="small">{step.context.method}</Box>
                    </SpaceBetween>
                  )}
                  {step.context.parameters && Object.keys(step.context.parameters).length > 0 && (
                    <Container>
                      <Header>Parameters</Header>
                      <SpaceBetween size="xxs">
                        {Object.entries(step.context.parameters).map(([key, value], idx) => (
                          <SpaceBetween key={idx} direction="horizontal" size="s">
                            <Box variant="small"><strong>{key}:</strong></Box>
                            <Box variant="small">{String(value)}</Box>
                          </SpaceBetween>
                        ))}
                      </SpaceBetween>
                    </Container>
                  )}
                </SpaceBetween>
              </Container>
            )}

            {/* Source validation details (inside progressive disclosure) */}
            {step.sources && step.sources.length > 0 && (
              <Container>
                <Header>Source Validation Details</Header>
                <CloudscapeSourceAttribution 
                  sources={step.sources} 
                  compact={false}
                  showDetails={true}
                />
              </Container>
            )}
          </SpaceBetween>
        </ExpandableSection>
      )}
    </Container>
  );
};

export default CloudscapeChainOfThoughtStep;
