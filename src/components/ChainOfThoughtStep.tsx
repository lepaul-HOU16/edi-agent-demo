/**
 * ChainOfThoughtStep Component - Detailed step display for chain of thought panel
 * Shows AI reasoning process with expandable details and professional styling
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Psychology,
  CheckCircle,
  Error,
  AccessTime,
  Speed,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { ThoughtStep } from '../../utils/thoughtTypes';

interface ChainOfThoughtStepProps {
  step: ThoughtStep;
  isStreaming?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

// Get icon for each step type
const getStepIcon = (type: ThoughtStep['type'], status: ThoughtStep['status']) => {
  const iconProps = { 
    fontSize: 'small' as const,
    sx: { 
      color: status === 'complete' ? 'success.main' : 
             status === 'error' ? 'error.main' : 'primary.main'
    }
  };

  switch (type) {
    case 'intent_detection':
      return <Psychology {...iconProps} />;
    case 'parameter_extraction':
      return <Speed {...iconProps} />;
    case 'tool_selection':
      return <CheckCircle {...iconProps} />;
    case 'execution':
      return <AccessTime {...iconProps} />;
    case 'validation':
      return <CheckCircle {...iconProps} />;
    case 'completion':
      return <CheckCircle {...iconProps} />;
    default:
      return <Psychology {...iconProps} />;
  }
};

// Get color scheme for step type
const getStepColors = (type: ThoughtStep['type']) => {
  switch (type) {
    case 'intent_detection':
      return { main: '#2196F3', light: '#E3F2FD', dark: '#1976D2' };
    case 'parameter_extraction':
      return { main: '#FF9800', light: '#FFF3E0', dark: '#F57C00' };
    case 'tool_selection':
      return { main: '#4CAF50', light: '#E8F5E8', dark: '#388E3C' };
    case 'execution':
      return { main: '#9C27B0', light: '#F3E5F5', dark: '#7B1FA2' };
    case 'validation':
      return { main: '#00BCD4', light: '#E0F7FA', dark: '#0097A7' };
    case 'completion':
      return { main: '#4CAF50', light: '#E8F5E8', dark: '#388E3C' };
    default:
      return { main: '#2196F3', light: '#E3F2FD', dark: '#1976D2' };
  }
};

// Format step type for display
const formatStepType = (type: ThoughtStep['type']): string => {
  switch (type) {
    case 'intent_detection':
      return 'Intent Detection';
    case 'parameter_extraction':
      return 'Parameter Extraction';
    case 'tool_selection':
      return 'Tool Selection';
    case 'execution':
      return 'Execution';
    case 'validation':
      return 'Validation';
    case 'completion':
      return 'Completion';
    default:
      return 'Processing';
  }
};

const ChainOfThoughtStep: React.FC<ChainOfThoughtStepProps> = ({
  step,
  isStreaming = false,
  showDetails = false,
  onToggleDetails
}) => {
  const [expanded, setExpanded] = useState(false);
  const colors = getStepColors(step.type);
  const icon = getStepIcon(step.type, step.status);

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: `2px solid ${colors.main}`,
        borderLeft: `6px solid ${colors.main}`,
        background: `linear-gradient(135deg, ${colors.light} 0%, #ffffff 100%)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        {/* Step Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          {icon}
          
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="h6" fontWeight="bold" color={colors.dark}>
                {step.title}
              </Typography>
              
              <Chip 
                label={formatStepType(step.type)}
                size="small"
                sx={{ 
                  backgroundColor: colors.light,
                  color: colors.dark,
                  border: `1px solid ${colors.main}`
                }}
              />
              
              {step.confidence && (
                <Chip 
                  label={`${Math.round(step.confidence * 100)}% confidence`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>
            
            <Typography variant="body2" color="text.secondary">
              {step.summary}
            </Typography>
          </Box>
          
          {/* Status and timing */}
          <Stack alignItems="center" spacing={1}>
            {step.status === 'thinking' && isStreaming && (
              <LinearProgress 
                sx={{ 
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.light,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.main
                  }
                }}
              />
            )}
            
            {step.duration && (
              <Typography variant="caption" color="text.secondary">
                {step.duration}ms
              </Typography>
            )}
            
            {onToggleDetails && (
              <Tooltip title={showDetails ? "Hide details" : "Show details"}>
                <IconButton 
                  size="small" 
                  onClick={onToggleDetails}
                  sx={{ color: colors.main }}
                >
                  {showDetails ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Context Information */}
        {step.context && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {step.context.wellName && (
                <Chip 
                  label={`Well: ${step.context.wellName}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              {step.context.analysisType && (
                <Chip 
                  label={`Type: ${step.context.analysisType}`}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
              {step.context.method && (
                <Chip 
                  label={`Method: ${step.context.method}`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Detailed Information (Expandable) */}
        {step.details && showDetails && (
          <Accordion 
            expanded={expanded}
            onChange={() => setExpanded(!expanded)}
            sx={{ 
              boxShadow: 'none',
              '&:before': { display: 'none' },
              backgroundColor: 'transparent'
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMore sx={{ color: colors.main }} />}
              sx={{ 
                backgroundColor: colors.light,
                borderRadius: 1,
                mb: 1,
                minHeight: 'auto',
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0'
                }
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" color={colors.dark}>
                Technical Details
              </Typography>
            </AccordionSummary>
            
            <AccordionDetails sx={{ pt: 0 }}>
              <Box 
                sx={{ 
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  borderLeft: `4px solid ${colors.main}`,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {step.details}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Parameters Display */}
        {step.context?.parameters && Object.keys(step.context.parameters).length > 0 && showDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: colors.dark }}>
              Parameters:
            </Typography>
            <Box 
              sx={{ 
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                border: `1px solid ${colors.main}20`,
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}
            >
              {Object.entries(step.context.parameters).map(([key, value]) => (
                <Box key={key} sx={{ mb: 0.5 }}>
                  <Typography component="span" fontWeight="bold" color={colors.dark}>
                    {key}:
                  </Typography>
                  {' '}
                  <Typography component="span" color="text.secondary">
                    {JSON.stringify(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Container component for multiple steps
export const ChainOfThoughtStepList: React.FC<{
  steps: ThoughtStep[];
  showDetails?: boolean;
}> = ({ steps, showDetails = false }) => {
  const [detailsVisibility, setDetailsVisibility] = useState<Record<string, boolean>>({});

  const toggleStepDetails = (stepId: string) => {
    setDetailsVisibility(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  return (
    <Box>
      {steps.map((step, index) => (
        <ChainOfThoughtStep
          key={step.id}
          step={step}
          isStreaming={step.status === 'thinking'}
          showDetails={showDetails && (detailsVisibility[step.id] ?? false)}
          onToggleDetails={() => toggleStepDetails(step.id)}
        />
      ))}
    </Box>
  );
};

export default ChainOfThoughtStep;
