import React, { useState } from 'react';
import { Theme } from '@mui/material/styles';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/utils/types';
import CopyButton from './CopyButton';

interface HumanMessageComponentProps {
  message: Message;
  theme: Theme;
  onRegenerateMessage?: (messageId: string, messageText: string) => Promise<boolean>;
}

const HumanMessageComponent: React.FC<HumanMessageComponentProps> = ({ 
  message, 
  theme, 
  onRegenerateMessage 
}) => {
  // State to track if deletion is in progress
  const [isDeletingMessages, setIsDeletingMessages] = useState<boolean>(false);
  // State to track deletion progress
  const [deletionProgress, setDeletionProgress] = useState<number>(0);

  const humanMessageStyle = {
    backgroundColor: 'rgb(0 108 224)',
    color: '#FFFFFF', // Force white text in all modes
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    maxWidth: '80%',
  };

  const markdownStyle = {
    textAlign: 'left' as const,
    color: '#FFFFFF', // Force white text for all markdown content
    '& ul, & ol': {
      marginLeft: theme.spacing(2),
      marginRight: 0,
      paddingLeft: theme.spacing(2),
      color: '#FFFFFF',
    },
    '& li': {
      marginBottom: theme.spacing(0.5),
      color: '#FFFFFF',
    },
    '& p': {
      margin: theme.spacing(1, 0),
      color: '#FFFFFF',
    },
    '& *': {
      color: '#FFFFFF !important',
    },
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      width: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '8px',
        width: '100%',
        justifyContent: 'flex-end'
      }}>
        <PersonIcon 
          sx={{ 
            color: 'rgb(0 108 224)',
            width: '32px !important',
            height: '32px !important',
            minWidth: '32px',
            minHeight: '32px',
            maxWidth: '32px',
            maxHeight: '32px',
            flexShrink: 0,
            fontSize: '32px',
          }} 
        />
        <div style={humanMessageStyle}>
          <Box sx={markdownStyle}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, ...props}) => <p style={{color: '#FFFFFF'}} {...props} />,
                span: ({node, ...props}) => <span style={{color: '#FFFFFF'}} {...props} />,
                div: ({node, ...props}) => <div style={{color: '#FFFFFF'}} {...props} />,
                li: ({node, ...props}) => <li style={{color: '#FFFFFF'}} {...props} />,
                a: ({node, ...props}) => <a style={{color: '#FFFFFF'}} {...props} />,
              }}
            >
              {(message as any).content?.text}
            </ReactMarkdown>
          </Box>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: theme.spacing(0.5) }}>
        <CopyButton text={(message as any).content?.text || ''} />
        {onRegenerateMessage && (
          <>
            <Button 
              size="small"
              onClick={async () => {
                // Set deleting state to true when retry is clicked
                setIsDeletingMessages(true);
                setDeletionProgress(0);
                
                try {
                  // Start with initial progress to show something is happening
                  setDeletionProgress(10);
                  
                  // Call the regenerate function and wait for completion
                  const success = await onRegenerateMessage(
                    (message as any).id || '', 
                    (message as any).content?.text || ''
                  );
                  
                  // Show completion progress only if successful
                  if (success) {
                    setDeletionProgress(100);
                    
                    // Reset states after a brief delay to show the 100%
                    setTimeout(() => {
                      setIsDeletingMessages(false);
                      setDeletionProgress(0);
                    }, 500);
                  } else {
                    // If not successful, reset states immediately
                    setIsDeletingMessages(false);
                    setDeletionProgress(0);
                  }
                } catch (error) {
                  console.error('Error during message regeneration:', error);
                  // Reset states on error
                  setIsDeletingMessages(false);
                  setDeletionProgress(0);
                }
              }}
              startIcon={<ReplayIcon fontSize="small" />}
              disabled={isDeletingMessages}
              sx={{ 
                fontSize: '0.75rem',
                color: isDeletingMessages ? theme.palette.grey[400] : theme.palette.grey[700],
                '&:hover': {
                  backgroundColor: theme.palette.grey[100]
                }
              }}
            >
              {isDeletingMessages ? 'Deleting...' : 'Retry'}
            </Button>
            
            {isDeletingMessages && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CircularProgress 
                  size={16} 
                  thickness={5}
                  variant="determinate" 
                  value={deletionProgress} 
                />
                <Typography variant="caption" color="text.secondary">
                  {deletionProgress}%
                </Typography>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HumanMessageComponent;
