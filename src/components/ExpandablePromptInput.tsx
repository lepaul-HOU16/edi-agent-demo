import React, { useState, useRef, useCallback } from 'react';
import { Box } from '@mui/material';
import PromptInput from '@cloudscape-design/components/prompt-input';

interface ExpandablePromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onAction: () => void;
  placeholder?: string;
  actionButtonAriaLabel?: string;
  actionButtonIconName?: string;
  ariaLabel?: string;
  onTypingStateChange?: (isTyping: boolean) => void;
}

const ExpandablePromptInput: React.FC<ExpandablePromptInputProps> = ({
  value,
  onChange,
  onAction,
  placeholder = "Ask a question",
  actionButtonAriaLabel = "Send message",
  actionButtonIconName = "send",
  ariaLabel = "Prompt input with action button",
  onTypingStateChange
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced input change handler with immediate typing state clearing on empty
  const handleInputChange = useCallback((newValue: string) => {
    // Update the input value immediately - no interference
    onChange(newValue);
    
    // Handle typing state if needed
    if (onTypingStateChange) {
      // Clear existing timeout to prevent race conditions
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (newValue.length === 0) {
        // Immediately clear typing state when input is empty (on submit/clear)
        setIsTyping(false);
        onTypingStateChange(false);
      } else {
        // Set typing state if not already typing
        if (!isTyping) {
          setIsTyping(true);
          onTypingStateChange(true);
        }
        
        // Set shorter timeout for faster typing end detection
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingStateChange(false);
        }, 800); // Reduced from 1500ms to 800ms for faster reset
      }
    }
  }, [onChange, onTypingStateChange, isTyping]);
  
  // Handle action (submit) - immediately clear typing state
  const handleAction = useCallback(() => {
    // Clear typing state immediately on submit
    if (onTypingStateChange && isTyping) {
      setIsTyping(false);
      onTypingStateChange(false);
    }
    
    // Clear timeout to prevent delayed state changes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Call the original onAction
    onAction();
  }, [onAction, onTypingStateChange, isTyping]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      // Remove outer padding to maximize input width
      boxSizing: 'border-box',
      '& .awsui-prompt-input': {
        width: '100%',
      },
      '& .awsui-prompt-input__input': {
        width: '100% !important',
        minHeight: '40px',
        padding: '12px 16px !important', // Single, consistent internal padding
        resize: 'vertical',
        boxSizing: 'border-box',
      },
      '& .awsui-prompt-input__action-button': {
        alignSelf: 'flex-end',
        marginBottom: '8px',
        marginRight: '2px', // Minimal spacing from edge
      },
      // Maximize container width - remove unnecessary padding
      '& .awsui-prompt-input__container': {
        width: '100%',
        padding: '4px', // Minimal padding for proper layout
        boxSizing: 'border-box',
        gap: '4px', // Smaller gap to maximize input space
      },
      '& .awsui-prompt-input__input-wrapper': {
        width: '100%',
        flex: '1 1 auto',
        // Remove marginRight to extend input closer to Example Prompts
        marginRight: '0px',
      }
    }}>
      <PromptInput
        onChange={({ detail }) => handleInputChange(detail.value)}
        onAction={handleAction}
        value={value}
        actionButtonAriaLabel={actionButtonAriaLabel}
        actionButtonIconName="send"
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        maxRows={10}
      />
    </Box>
  );
};

export default ExpandablePromptInput;
