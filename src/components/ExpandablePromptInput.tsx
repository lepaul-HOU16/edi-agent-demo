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
  isSending?: boolean;
}

const ExpandablePromptInput: React.FC<ExpandablePromptInputProps> = ({
  value,
  onChange,
  onAction,
  placeholder = "Ask a question",
  actionButtonAriaLabel = "Send message",
  actionButtonIconName = "send",
  ariaLabel = "Prompt input with action button",
  onTypingStateChange,
  isSending = false
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [justCleared, setJustCleared] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple input change handler
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    
    // Only handle typing state if callback is provided
    if (onTypingStateChange) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (newValue.length === 0) {
        if (isTyping) {
          setIsTyping(false);
          onTypingStateChange(false);
        }
      } else {
        if (!isTyping) {
          setIsTyping(true);
          onTypingStateChange(true);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingStateChange(false);
        }, 1200);
      }
    }
  }, [onChange, onTypingStateChange, isTyping]);
  
  // Handle action (submit)
  const handleAction = useCallback(() => {
    if (onTypingStateChange && isTyping) {
      setIsTyping(false);
      onTypingStateChange(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Visual feedback: show clearing animation
    setJustCleared(true);
    setTimeout(() => setJustCleared(false), 300);
    
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
      boxSizing: 'border-box',
      '& .awsui-prompt-input': {
        width: '100%',
        transition: justCleared ? 'opacity 0.2s ease-out' : 'none',
        opacity: justCleared ? 0.7 : 1,
        borderRadius: '8px !important',
        overflow: 'hidden !important',
      },
      '& .awsui-prompt-input__container': {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        gap: '8px',
        borderRadius: '8px !important',
        overflow: 'hidden !important',
      },
      '& .awsui-prompt-input__container > *': {
        borderRadius: '8px !important',
      },
      '& textarea': {
        borderRadius: '8px !important',
      },
      '& .awsui-prompt-input__input': {
        width: '100% !important',
        minHeight: '40px',
        padding: '12px 16px !important',
        resize: 'vertical',
        boxSizing: 'border-box',
        lineHeight: '24px',
      },
      '& .awsui-prompt-input__action-button': {
        alignSelf: 'flex-end',
        marginBottom: '8px',
        marginRight: '2px',
      },
      '& .awsui-prompt-input__action-button button': {
        border: '0 !important',
        borderWidth: '0 !important',
        borderStyle: 'none !important',
        boxShadow: 'none !important',
        outline: 'none !important',
      },
      '& button[aria-label="Send message"]': {
        border: '0 !important',
        borderWidth: '0 !important',
        borderStyle: 'none !important',
        boxShadow: 'none !important',
        outline: 'none !important',
      },
      '& .awsui-prompt-input__input-wrapper': {
        width: '100%',
        flex: '1 1 auto',
        marginRight: '0px',
      }
    }}>
      <div style={{ 
        borderRadius: '8px',
        overflow: 'hidden',
        width: '100%'
      }}>
        <PromptInput
          onChange={({ detail }) => handleInputChange(detail.value)}
          onAction={handleAction}
          value={value}
          actionButtonAriaLabel={actionButtonAriaLabel}
          actionButtonIconName="send"
          ariaLabel={ariaLabel}
          placeholder={isSending ? "Sending..." : placeholder}
          maxRows={10}
          disabled={isSending}
        />
      </div>
      {isSending && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          right: '60px',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          color: '#0073bb',
          fontWeight: 500,
          pointerEvents: 'none'
        }}>
          Sending...
        </Box>
      )}
    </Box>
  );
};

export default ExpandablePromptInput;
