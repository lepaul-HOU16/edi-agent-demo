/**
 * VoiceTranscriptionDisplay Component
 * 
 * Displays real-time voice transcription with recording indicator.
 * Matches the visual styling of user messages (blue background, right-aligned).
 * 
 * Features:
 * - Real-time transcription display
 * - Animated recording indicator
 * - Matches user message styling (blue, right-aligned, max 80% width)
 * - User icon preceding the message
 * - Smooth show/hide transitions
 */

import React from 'react';
import { Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import './VoiceTranscriptionDisplay.css';

/**
 * Props for VoiceTranscriptionDisplay component
 */
export interface VoiceTranscriptionDisplayProps {
  /** The transcription text to display */
  transcription: string;
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Whether the display should be visible */
  isVisible: boolean;
}

/**
 * VoiceTranscriptionDisplay Component
 * 
 * Displays voice transcription in a styled container that matches
 * user message styling (blue background, right-aligned).
 */
export const VoiceTranscriptionDisplay: React.FC<VoiceTranscriptionDisplayProps> = ({
  transcription,
  isRecording,
  isVisible
}) => {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        width: '100%',
        animation: 'slideIn 0.3s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          width: '100%',
          justifyContent: 'flex-end',
        }}
      >
        {/* User Icon */}
        <PersonIcon 
          sx={{ 
            color: 'rgb(0 108 224)',
            width: 32, 
            height: 32,
            flexShrink: 0,
          }} 
        />
        
        {/* Message Container */}
        <Box
          className={`voice-transcription-display ${isRecording ? 'recording' : ''}`}
          sx={{
            position: 'relative',
            backgroundColor: 'rgb(0 108 224)',
            color: '#FFFFFF',
            padding: '8px 12px',
            borderRadius: '8px',
            maxWidth: '80%',
            minHeight: '40px',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Transcription Text or Listening State */}
          <Box
            className="transcription-text"
            sx={{
              fontSize: '14px',
              lineHeight: '24px',
              color: '#FFFFFF',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxHeight: '240px',
              overflowY: 'auto',
              fontStyle: !transcription && isRecording ? 'italic' : 'normal',
              // Custom scrollbar styling
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {transcription || (isRecording ? 'Listening...' : '')}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VoiceTranscriptionDisplay;
