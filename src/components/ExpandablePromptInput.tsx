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

  // Simplified typing detection - only through onChange
  const handleInputChange = useCallback((newValue: string) => {
    // Update the input value immediately - no interference
    onChange(newValue);
    
    // Handle typing state if needed
    if (onTypingStateChange) {
      if (!isTyping && newValue.length > 0) {
        setIsTyping(true);
        onTypingStateChange(true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout for typing end only if there's content
      if (newValue.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingStateChange(false);
        }, 1500); // Longer timeout to prevent premature typing end
      } else {
        // If input is empty, immediately set typing to false
        setIsTyping(false);
        onTypingStateChange(false);
      }
    }
  }, [onChange, onTypingStateChange, isTyping]);

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
        onAction={onAction}
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
