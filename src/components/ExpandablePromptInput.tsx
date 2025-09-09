import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Popper, Fade } from '@mui/material';
import PromptInput from '@cloudscape-design/components/prompt-input';

interface ExpandablePromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onAction: () => void;
  placeholder?: string;
  actionButtonAriaLabel?: string;
  actionButtonIconName?: string;
  ariaLabel?: string;
}

const ExpandablePromptInput: React.FC<ExpandablePromptInputProps> = ({
  value,
  onChange,
  onAction,
  placeholder = "Ask a question",
  actionButtonAriaLabel = "Send message",
  actionButtonIconName = "send",
  ariaLabel = "Prompt input with action button"
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Calculate if text would overflow based on input width
  useEffect(() => {
    const calculateOverflow = () => {
      if (inputRef.current && textMeasureRef.current) {
        // Get the width of the input container
        const inputWidth = inputRef.current.clientWidth;
        
        // Set the text in the measuring div and get its width
        textMeasureRef.current.textContent = value;
        const textWidth = textMeasureRef.current.scrollWidth;
        
        // Determine if text would overflow (with some margin)
        const wouldOverflow = textWidth > (inputWidth - 60); // 60px for padding and send button
        setIsOverflowing(wouldOverflow);
      }
    };
    
    calculateOverflow();
    
    // Add resize listener to recalculate on window resize
    window.addEventListener('resize', calculateOverflow);
    return () => window.removeEventListener('resize', calculateOverflow);
  }, [value]);

  // Set anchor element for the popper when content would overflow
  useEffect(() => {
    if (isOverflowing && inputRef.current) {
      setAnchorEl(inputRef.current);
    } else {
      setAnchorEl(null);
    }
  }, [isOverflowing]);

  // Determine if the popper should be open
  const open = Boolean(anchorEl) && isOverflowing;

  return (
    <Box sx={{ position: 'relative', width: '100%' }} ref={inputRef}>
      {/* Hidden div to measure text width */}
      <div 
        ref={textMeasureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          pointerEvents: 'none'
        }}
      />
      {/* Regular input that's always visible */}
      <div>
        <PromptInput
          onChange={({ detail }) => onChange(detail.value)}
          onAction={onAction}
          value={value}
          actionButtonAriaLabel={actionButtonAriaLabel}
          actionButtonIconName={"send"}
          ariaLabel={ariaLabel}
          placeholder={placeholder}
          maxRows={1}
        />
      </div>

      {/* Flyout expanded input */}
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="top-start"
        transition
        style={{ zIndex: 1500, width: inputRef.current?.offsetWidth }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 2, 
                mt: 1, 
                mb: -3.5, // -28px (converted to rem, assuming 8px = 1rem)
                borderRadius: '10px',
                backgroundColor: '#006ce0',
                width: '100%'
              }}
            >
              <PromptInput
                onChange={({ detail }) => onChange(detail.value)}
                onAction={onAction}
                value={value}
                actionButtonAriaLabel={actionButtonAriaLabel}
                actionButtonIconName={"send"}
                ariaLabel={ariaLabel}
                placeholder={placeholder}
                maxRows={10} // Allow multiple rows in the expanded view
              />
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default ExpandablePromptInput;
