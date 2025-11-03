import React from 'react';
import { Box, LinearProgress, Typography, Collapse } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import ErrorIcon from '@mui/icons-material/Error';
import { keyframes } from '@mui/system';

// Define progress step interface
export interface ProgressStep {
  step: string;
  message: string;
  elapsed: number;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
}

// Props interface
export interface AgentProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: string;
  isVisible: boolean;
}

// Spinning animation for in-progress icon
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Component to render individual step
const StepItem: React.FC<{ step: ProgressStep; isActive: boolean }> = ({ step, isActive }) => {
  // Select icon based on status
  const getIcon = () => {
    switch (step.status) {
      case 'complete':
        return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />;
      case 'in_progress':
        return (
          <HourglassEmptyIcon
            sx={{
              color: '#2196f3',
              fontSize: 24,
              animation: `${spin} 2s linear infinite`,
            }}
          />
        );
      case 'pending':
        return <PauseCircleOutlineIcon sx={{ color: '#9e9e9e', fontSize: 24 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#f44336', fontSize: 24 }} />;
      default:
        return <PauseCircleOutlineIcon sx={{ color: '#9e9e9e', fontSize: 24 }} />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        padding: 1.5,
        borderRadius: 1,
        backgroundColor: isActive ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Icon */}
      <Box sx={{ flexShrink: 0, mt: 0.5 }}>{getIcon()}</Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: step.status === 'in_progress' ? 600 : 400,
            color: step.status === 'error' ? '#f44336' : 'text.primary',
            mb: 0.5,
          }}
        >
          {step.message}
        </Typography>

        {/* Elapsed time */}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {step.elapsed > 0 ? `${step.elapsed.toFixed(1)}s` : 'Waiting...'}
        </Typography>

        {/* Progress bar for in-progress steps */}
        {step.status === 'in_progress' && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress />
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Main component
export const AgentProgressIndicator: React.FC<AgentProgressIndicatorProps> = ({
  steps,
  currentStep,
  isVisible,
}) => {
  if (!isVisible || steps.length === 0) {
    return null;
  }

  return (
    <Collapse in={isVisible}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          padding: 2,
          backgroundColor: 'background.paper',
          boxShadow: 1,
          mb: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            🤖 Agent Processing
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {currentStep === 'thinking'
              ? 'Agent is analyzing your request with extended thinking...'
              : 'Initializing AI agent system...'}
          </Typography>
        </Box>

        {/* Progress steps */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {steps.map((step, index) => (
            <StepItem
              key={`${step.step}-${index}`}
              step={step}
              isActive={step.step === currentStep}
            />
          ))}
        </Box>

        {/* Thinking indicator */}
        {currentStep === 'thinking' && (
          <Box
            sx={{
              mt: 2,
              padding: 2,
              borderRadius: 1,
              backgroundColor: 'rgba(156, 39, 176, 0.08)',
              border: '1px solid rgba(156, 39, 176, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                💭 Extended Thinking
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  '& span': {
                    animation: `${keyframes`
                      0%, 60%, 100% { opacity: 0.3; }
                      30% { opacity: 1; }
                    `} 1.4s infinite`,
                  },
                  '& span:nth-of-type(2)': {
                    animationDelay: '0.2s',
                  },
                  '& span:nth-of-type(3)': {
                    animationDelay: '0.4s',
                  },
                }}
              >
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Agent is analyzing your request with extended thinking
            </Typography>
          </Box>
        )}
      </Box>
    </Collapse>
  );
};

export default AgentProgressIndicator;
