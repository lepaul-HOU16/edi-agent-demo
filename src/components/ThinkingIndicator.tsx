/**
 * ThinkingIndicator Component - Main chat loading indicator with breathing animation
 * Displays AI thinking process with subtle pulsing and contextual messages
 */

'use client';

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  useMediaQuery,
  useTheme,
  Fade,
  Grow,
  Collapse
} from '@mui/material';
import { Psychology } from '@mui/icons-material';
import { ThoughtStep, getAnimationIntensity } from '../../utils/thoughtTypes';

interface ThinkingIndicatorProps {
  context: string;
  step: string;
  progress?: number;
  estimatedTime?: string;
  isVisible?: boolean;
  currentThoughtStep?: ThoughtStep;
}

// Animated thinking dots component
const ThinkingDots: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
    {[0, 1, 2].map((index) => (
      <Box
        key={index}
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          animation: `bounce 1.4s ease-in-out infinite`,
          animationDelay: `${index * 0.2}s`,
          '@keyframes bounce': {
            '0%, 80%, 100%': { 
              transform: 'scale(0.8)',
              opacity: 0.6 
            },
            '40%': { 
              transform: 'scale(1.2)',
              opacity: 1 
            }
          }
        }}
      />
    ))}
  </Box>
);

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  context,
  step,
  progress = 0,
  estimatedTime,
  isVisible = true,
  currentThoughtStep
}) => {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Get animation configuration based on current step
  const animationConfig = currentThoughtStep 
    ? getAnimationIntensity(currentThoughtStep.type)
    : { duration: '2.5s', scale: { min: 1, max: 1.02 }, opacity: { min: 0.8, max: 1 } };

  const breathingAnimation = prefersReducedMotion ? {} : {
    animation: `breathe ${animationConfig.duration} ease-in-out infinite`,
    '@keyframes breathe': {
      '0%, 100%': { 
        transform: `scale(${animationConfig.scale.max})`, // Start larger
        opacity: animationConfig.opacity.max,
        backgroundColor: 'rgba(25, 118, 210, 0.15)'
      },
      '50%': { 
        transform: `scale(${animationConfig.scale.min})`, // Pulse inward to smaller
        opacity: animationConfig.opacity.min,
        backgroundColor: 'rgba(25, 118, 210, 0.08)'
      }
    }
  };

  const avatarPulse = prefersReducedMotion ? {} : {
    animation: 'avatarPulse 2s ease-in-out infinite',
    '@keyframes avatarPulse': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.1)' }
    }
  };

  const textShimmer = prefersReducedMotion ? {} : {
    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    animation: 'shimmer 3s ease-in-out infinite',
    '@keyframes shimmer': {
      '0%, 100%': { opacity: 0.7 },
      '50%': { opacity: 1 }
    }
  };

  return (
    <Collapse in={isVisible} timeout={500}>
      <Fade in={isVisible} timeout={300}>
        <Grow in={isVisible} timeout={400}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              mb: 2,
              mx: 1, // Add margin to prevent edge cut-off
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderRadius: 2,
              border: '2px solid rgba(25, 118, 210, 0.3)',
              transition: 'all 0.3s ease',
              willChange: 'transform, opacity',
              transform: 'translateZ(0)', // Force GPU layer
              backfaceVisibility: 'hidden',
              overflow: 'visible', // Allow animation to be visible
              ...breathingAnimation
            }}
          >
            {/* AI Avatar with pulse animation */}
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main',
                ...avatarPulse
              }}
            >
              <Psychology />
            </Avatar>
            
            {/* Main content area */}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body1" 
                fontWeight="medium"
                sx={textShimmer}
              >
                {context.replace(/🧠|🎯|🔧|⚡|✓|🎉|🤔/g, '')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {step}
              </Typography>
              
              {/* Verbose thought step details */}
              {currentThoughtStep && currentThoughtStep.summary && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 0.5, 
                    fontSize: '0.875rem',
                    fontStyle: 'italic',
                    opacity: 0.9
                  }}
                >
                  {currentThoughtStep.summary}
                </Typography>
              )}
              
              {/* Show context details if available */}
              {currentThoughtStep?.context && (
                <Box sx={{ mt: 0.5 }}>
                  {currentThoughtStep.context.wellName && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Well: {currentThoughtStep.context.wellName}
                    </Typography>
                  )}
                  {currentThoughtStep.context.dataSource && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Source: {currentThoughtStep.context.dataSource}
                    </Typography>
                  )}
                  {currentThoughtStep.context.method && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Method: {currentThoughtStep.context.method}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Progress indicator */}
              {progress > 0 && (
                <Box 
                  sx={{ 
                    mt: 1,
                    height: 4,
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      backgroundColor: 'primary.main',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                      width: `${progress}%`
                    }}
                  />
                </Box>
              )}
              
              {/* Estimated time or duration */}
              {(estimatedTime || currentThoughtStep?.duration) && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {estimatedTime || (currentThoughtStep?.duration ? `${currentThoughtStep.duration}ms` : '')}
                </Typography>
              )}
            </Box>
            
            {/* Thinking dots animation */}
            <ThinkingDots />
          </Box>
        </Grow>
      </Fade>
    </Collapse>
  );
};

// Higher-order component wrapper for easy integration
export const ThinkingIndicatorWrapper: React.FC<{
  children: React.ReactNode;
  thinkingState?: {
    isActive: boolean;
    context: string;
    step: string;
    progress?: number;
    estimatedTime?: string;
    currentThoughtStep?: ThoughtStep;
  };
}> = ({ children, thinkingState }) => {
  return (
    <>
      {thinkingState?.isActive && (
        <ThinkingIndicator
          context={thinkingState.context}
          step={thinkingState.step}
          progress={thinkingState.progress}
          estimatedTime={thinkingState.estimatedTime}
          currentThoughtStep={thinkingState.currentThoughtStep}
          isVisible={thinkingState.isActive}
        />
      )}
      {children}
    </>
  );
};

export default ThinkingIndicator;
