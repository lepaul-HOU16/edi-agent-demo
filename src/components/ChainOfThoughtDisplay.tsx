/**
 * ChainOfThoughtDisplay Component
 * 
 * Displays verbose thought steps in a clean, professional format
 * Supports both light and dark modes with theme-aware styling
 * Features: compact spacing, toggle buttons (default expanded), markdown-style code blocks
 */


import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Backend format from renewable orchestrator
export interface BackendThoughtStep {
  step: number;
  action: string;
  reasoning: string;
  result?: string;
  status: 'in_progress' | 'complete' | 'error';
  timestamp: string;
  duration?: number;  // milliseconds
  error?: {
    message: string;
    suggestion?: string;
  };
}

// Legacy format (kept for backward compatibility)
export interface VerboseThoughtStep {
  id: string;
  type: 'intent_detection' | 'parameter_extraction' | 'tool_selection' | 'data_retrieval' | 'calculation' | 'validation' | 'completion' | 'error' | 'execution';
  timestamp: number;
  title: string;
  summary: string;
  details?: string | any;
  status: 'thinking' | 'in_progress' | 'complete' | 'error';
  confidence?: number;
  duration?: number;
  progress?: number;
  context?: Record<string, any>;
  metrics?: Record<string, any>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

// Unified type that handles both formats
export type ThoughtStep = BackendThoughtStep | VerboseThoughtStep;

interface ChainOfThoughtDisplayProps {
  thoughtSteps?: ThoughtStep[];
  messages?: any[]; // Accept messages array and extract thought steps
  autoScroll?: boolean;
  defaultExpanded?: boolean;
}

// Type guard to check if step is backend format
function isBackendThoughtStep(step: ThoughtStep): step is BackendThoughtStep {
  return 'action' in step && 'reasoning' in step;
}

// Convert backend format to display format
function normalizeThoughtStep(step: ThoughtStep): VerboseThoughtStep {
  if (isBackendThoughtStep(step)) {
    return {
      id: `step-${step.step}`,
      type: 'execution',
      timestamp: new Date(step.timestamp).getTime(),
      title: step.action,
      summary: step.reasoning,
      details: step.result,
      status: step.status,
      duration: step.duration,
      error: step.error
    };
  }
  return step as VerboseThoughtStep;
}

/**
 * Individual thought step card with theme-aware styling
 */
const ThoughtStepCard: React.FC<{ step: VerboseThoughtStep; isExpanded: boolean; onToggle: () => void }> = ({
  step,
  isExpanded,
  onToggle
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Determine border color based on status
  const getBorderColor = () => {
    switch (step.status) {
      case 'complete':
        return '#10b981'; // Green
      case 'in_progress':
      case 'thinking':
        return '#3b82f6'; // Blue
      case 'error':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Format duration
  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  // Format details for display
  const formatDetails = () => {
    if (!step.details) return null;
    
    // If details is already a string, use it
    if (typeof step.details === 'string') {
      return step.details;
    }
    
    // Otherwise, format as JSON
    return `\`\`\`json
${JSON.stringify(step.details, null, 2)}
\`\`\``;
  };

  const detailsContent = formatDetails();

  return (
    <Box
      sx={{
        backgroundColor: isDark ? '#2d3748' : '#f8f9fa',
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: '4px',
        padding: '8px 12px',
        marginBottom: '10px'
      }}
    >
      {/* Header Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: '4px' }}>
        <Typography
          variant="caption"
          sx={{
            color: isDark ? '#9ca3af' : '#6c757d',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}
        >
          {formatTime(step.timestamp)}
        </Typography>
        {step.duration && (
          <Typography
            variant="caption"
            sx={{
              color: isDark ? '#9ca3af' : '#6c757d',
              fontFamily: 'monospace',
              fontSize: '11px'
            }}
          >
            • {formatDuration(step.duration)}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: isDark ? '#9ca3af' : '#6c757d',
            fontFamily: 'monospace',
            fontSize: '11px',
            textTransform: 'uppercase'
          }}
        >
          • {step.type?.replace(/_/g, ' ') || 'unknown'}
        </Typography>
      </Box>

      {/* Title */}
      <Typography
        variant="body2"
        sx={{
          color: isDark ? '#f3f4f6' : '#212529',
          fontWeight: 500,
          marginBottom: '4px',
          fontSize: '14px'
        }}
      >
        {step.title}
      </Typography>

      {/* Summary */}
      <Typography
        variant="body2"
        sx={{
          color: isDark ? '#d1d5db' : '#495057',
          fontSize: '13px',
          lineHeight: 1.4
        }}
      >
        {step.summary}
      </Typography>

      {/* Error Message */}
      {step.error && (
        <Box
          sx={{
            marginTop: '4px',
            padding: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '4px',
            borderLeft: '3px solid #ef4444'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#fca5a5',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
          >
            {step.error.message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Main Chain of Thought Display Component
 */
export const ChainOfThoughtDisplay: React.FC<ChainOfThoughtDisplayProps> = ({
  thoughtSteps: providedThoughtSteps,
  messages,
  autoScroll = true,
  defaultExpanded = true
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevStepCountRef = useRef(0);

  // Extract thought steps from messages if provided
  const thoughtSteps = React.useMemo(() => {
    let rawSteps: ThoughtStep[] = [];
    
    if (providedThoughtSteps) {
      rawSteps = providedThoughtSteps;
    } else if (messages) {
      try {
        rawSteps = messages
          .filter(message => message.role === 'ai' && (message as any).thoughtSteps)
          .flatMap(message => {
            const steps = (message as any).thoughtSteps || [];
            
            // Parse JSON strings if needed
            const parsedSteps = Array.isArray(steps) ? steps.map(step => {
              if (typeof step === 'string') {
                try {
                  return JSON.parse(step);
                } catch (e) {
                  console.error('Failed to parse step JSON:', step);
                  return null;
                }
              }
              return step;
            }) : [];
            
            return parsedSteps.filter(Boolean);
          })
          .filter(step => step && typeof step === 'object')
          .sort((a, b) => {
            const aTime = isBackendThoughtStep(a) ? new Date(a.timestamp).getTime() : a.timestamp;
            const bTime = isBackendThoughtStep(b) ? new Date(b.timestamp).getTime() : b.timestamp;
            return aTime - bTime;
          });
      } catch (error) {
        console.error('Error extracting thought steps:', error);
        rawSteps = [];
      }
    }
    
    // Normalize all steps to VerboseThoughtStep format
    return rawSteps.map(normalizeThoughtStep);
  }, [providedThoughtSteps, messages]);

  // Initialize all steps as collapsed by default
  useEffect(() => {
    // Start with all steps collapsed
    setExpandedSteps(new Set());
  }, [thoughtSteps.length]);

  // Auto-scroll when new steps are added
  useEffect(() => {
    if (autoScroll && thoughtSteps.length > prevStepCountRef.current) {
      // Use requestAnimationFrame for smooth, immediate scrolling
      requestAnimationFrame(() => {
        // Try scrolling the end element into view first (smoother)
        if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          console.log('[ChainOfThought] Scrolled end element into view, stepCount:', thoughtSteps.length);
        } else if (containerRef.current) {
          // Fallback: scroll container to bottom
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          console.log('[ChainOfThought] Scrolled container to bottom:', {
            scrollTop: containerRef.current.scrollTop,
            scrollHeight: containerRef.current.scrollHeight,
            stepCount: thoughtSteps.length
          });
        }
      });
    }
    prevStepCountRef.current = thoughtSteps.length;
  }, [thoughtSteps.length, autoScroll]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    // Check if all steps are expanded
    const allExpanded = expandedSteps.size === thoughtSteps.length;
    
    if (allExpanded) {
      // Collapse all
      setExpandedSteps(new Set());
    } else {
      // Expand all
      setExpandedSteps(new Set(thoughtSteps.map(s => s.id)));
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        padding: '20px',
        backgroundColor: isDark ? 'var(--awsui-color-background-container-content)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}
    >
      {/* Header */}
      <Box sx={{ marginBottom: '16px' }}>
        <Typography
          variant="caption"
          sx={{
            color: isDark ? '#9ca3af' : '#6c757d',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Chain of Thought {thoughtSteps.length > 0 && `(${thoughtSteps.length} steps)`}
        </Typography>
      </Box>

      {/* Initial State Message */}
      {(!thoughtSteps || thoughtSteps.length === 0) && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#9ca3af' : '#6c757d',
              fontSize: '14px',
              fontStyle: 'italic'
            }}
          >
            Thought steps will appear here as the AI processes your query
          </Typography>
        </Box>
      )}

      {/* Thought Steps */}
      {thoughtSteps.length > 0 && thoughtSteps.map(step => (
        <ThoughtStepCard
          key={step.id}
          step={step}
          isExpanded={true}
          onToggle={() => {}}
        />
      ))}
      
      {/* Invisible element at the end for scrolling */}
      <div ref={endRef} style={{ height: '1px' }} />
    </Box>
  );
};

export default ChainOfThoughtDisplay;
