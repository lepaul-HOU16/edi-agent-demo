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

interface ChainOfThoughtDisplayProps {
  thoughtSteps?: VerboseThoughtStep[];
  messages?: any[]; // Accept messages array and extract thought steps
  autoScroll?: boolean;
  defaultExpanded?: boolean;
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
        backgroundColor: isDark ? '#2d3748' : '#f8f9fa', // Dark: medium dark gray, Light: light gray
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isDark ? '#374151' : '#e9ecef'
        }
      }}
    >
      {/* Header Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            • {step.type.replace(/_/g, ' ')}
          </Typography>
        </Box>
        
        {detailsContent && (
          <Button
            size="small"
            onClick={onToggle}
            sx={{
              minWidth: 'auto',
              padding: '2px 8px',
              fontSize: '11px',
              color: isDark ? '#9ca3af' : '#6c757d',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        )}
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
          lineHeight: 1.5
        }}
      >
        {step.summary}
      </Typography>

      {/* Error Message */}
      {step.error && (
        <Box
          sx={{
            marginTop: '8px',
            padding: '8px',
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

      {/* Details (Expandable) */}
      {detailsContent && isExpanded && (
        <Box
          sx={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: isDark ? 'none' : '1px solid #dee2e6',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px',
            '& pre': {
              margin: 0,
              padding: '8px',
              backgroundColor: isDark ? '#111827' : '#f8f9fa',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace'
            },
            '& code': {
              color: isDark ? '#e5e7eb' : '#212529',
              fontFamily: 'monospace',
              fontSize: '12px'
            },
            '& p': {
              margin: '4px 0',
              color: isDark ? '#d1d5db' : '#495057',
              fontSize: '13px'
            }
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {detailsContent}
          </ReactMarkdown>
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
  const prevStepCountRef = useRef(0);

  // Extract thought steps from messages if provided
  const thoughtSteps = React.useMemo(() => {
    if (providedThoughtSteps) {
      return providedThoughtSteps;
    }
    
    if (!messages) {
      return [];
    }

    try {
      const extractedSteps = messages
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
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
      return extractedSteps;
    } catch (error) {
      console.error('Error extracting thought steps:', error);
      return [];
    }
  }, [providedThoughtSteps, messages]);

  // Initialize all steps as expanded if defaultExpanded is true
  useEffect(() => {
    if (defaultExpanded && thoughtSteps.length > 0) {
      setExpandedSteps(new Set(thoughtSteps.map(s => s.id)));
    }
  }, [defaultExpanded, thoughtSteps.length]);

  // Auto-scroll when new steps are added
  useEffect(() => {
    if (autoScroll && thoughtSteps.length > prevStepCountRef.current) {
      if (containerRef.current) {
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
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
    if (expandedSteps.size === thoughtSteps.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(thoughtSteps.map(s => s.id)));
    }
  };

  if (!thoughtSteps || thoughtSteps.length === 0) {
    return (
      <Box
        sx={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: isDark ? '#1f2937' : '#f8f9fa',
          borderRadius: '8px',
          marginTop: '12px'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: isDark ? '#9ca3af' : '#6c757d',
            marginBottom: '8px',
            fontSize: '16px'
          }}
        >
          No AI reasoning process active
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? '#6b7280' : '#868e96',
            fontSize: '13px'
          }}
        >
          Submit a query to see the AI's step-by-step decision-making process
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        marginTop: '12px',
        marginBottom: '12px'
      }}
    >
      {/* Header with Expand/Collapse All */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
          Chain of Thought ({thoughtSteps.length} steps)
        </Typography>
        <Button
          size="small"
          onClick={toggleAll}
          sx={{
            minWidth: 'auto',
            padding: '2px 8px',
            fontSize: '11px',
            color: isDark ? '#9ca3af' : '#6c757d',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          {expandedSteps.size === thoughtSteps.length ? 'Collapse All' : 'Expand All'}
        </Button>
      </Box>

      {/* Thought Steps */}
      {thoughtSteps.map(step => (
        <ThoughtStepCard
          key={step.id}
          step={step}
          isExpanded={expandedSteps.has(step.id)}
          onToggle={() => toggleStep(step.id)}
        />
      ))}
    </Box>
  );
};

export default ChainOfThoughtDisplay;
