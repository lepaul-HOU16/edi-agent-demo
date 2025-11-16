import React, { useRef, useEffect } from 'react';
import { Theme } from '@mui/material/styles';
import { Box } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/utils/types';
import CopyButton from './messageComponents/CopyButton';

interface StableEducationalMessageProps {
  message: Message;
  theme: Theme;
}

// Isolated component for educational messages that uses direct DOM manipulation
const StableEducationalMessage: React.FC<StableEducationalMessageProps> = ({ message, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Force visibility using direct DOM manipulation
  useEffect(() => {
    if (containerRef.current && contentRef.current && !mounted.current) {
      mounted.current = true;
      
      // Apply forced visibility styles directly to DOM
      const container = containerRef.current;
      const content = contentRef.current;
      
      container.style.visibility = 'visible';
      container.style.display = 'flex';
      container.style.flexDirection = 'row';
      container.style.gap = '40px';
      container.style.opacity = '1';
      container.style.position = 'relative';
      container.style.zIndex = '1';
      
      content.style.visibility = 'visible';
      content.style.display = 'block';
      content.style.opacity = '1';
      
      console.log('🔒 StableEducationalMessage: DOM protection applied');
    }
  }, []);

  // Maintain visibility on every render
  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current;
      const content = contentRef.current;
      
      // Re-apply protection after any potential state changes
      container.style.visibility = 'visible';
      container.style.display = 'flex';
      container.style.flexDirection = 'row';
      container.style.gap = '40px';
      container.style.opacity = '1';
      
      content.style.visibility = 'visible';
      content.style.display = 'block';
      content.style.opacity = '1';
    }
  });

  // Create stable key that doesn't change during typing
  const stableKey = `educational-${(message as any).id}-${(message as any).content?.text?.substring(0, 50).replace(/\W/g, '')}`;

  console.log('🔒 StableEducationalMessage: Rendering with stable key:', stableKey);

  return (
    <div
      key={stableKey}
      ref={containerRef}
      className="stable-educational-message"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '40px',
        width: '100%',
        position: 'relative',
        minHeight: 'auto',
        // Completely disable React's optimization features
        contain: 'none',
        isolation: 'auto',
        willChange: 'auto'
      }}
    >
      {/* First Column - Main Content */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        flex: '1',
        marginBottom: '0', // Remove bottom margin from first column
        minWidth: 0
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '8px',
          width: '100%',
          marginBottom: '0' // Remove bottom margin from header
        }}>
          <SupportAgentIcon 
            sx={{ 
              color: theme.palette.primary.main,
              width: 32, 
              height: 32,
              minWidth: 32,
              aspectRatio: '1',
              flexShrink: 0,
              display: 'block'
            }} 
          />
          <div
            ref={contentRef}
            style={{ 
              width: '100%',
              minWidth: 0,
              visibility: 'visible',
              display: 'block',
              opacity: 1
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {(message as any).content?.text}
            </ReactMarkdown>
          </div>
        </div>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 0.5 }}>
          <CopyButton text={(message as any).content?.text || ''} />
        </Box>
      </div>
    
    </div>
  );
};

export default StableEducationalMessage;
