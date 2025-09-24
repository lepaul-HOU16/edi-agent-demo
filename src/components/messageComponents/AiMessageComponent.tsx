import React, { useState } from 'react';
import { Theme } from '@mui/material/styles';
import { Typography, Button, Box } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { stringify } from 'yaml';
import { Message } from '@/../utils/types';
import CopyButton from './CopyButton';
import ArtifactRenderer from '../ArtifactRenderer';

interface AiMessageComponentProps {
  message: Message;
  theme: Theme;
  enhancedComponent?: React.ReactNode;
}

const AiMessageComponent: React.FC<AiMessageComponentProps> = ({ message, theme, enhancedComponent }) => {
  // Track expanded state for all tool calls
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});

  // ARTIFACT DEBUGGING: Log artifacts to console
  console.log('🎨 AiMessageComponent DEBUG:', {
    hasMessage: !!message,
    messageKeys: message ? Object.keys(message) : [],
    hasArtifacts: !!(message as any).artifacts,
    artifactCount: (message as any).artifacts?.length || 0,
    artifacts: (message as any).artifacts,
    messageContent: (message as any).content?.text?.substring(0, 100) + '...'
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '8px',
        width: '100%'
      }}>
        <SupportAgentIcon 
          sx={{ 
            color: theme.palette.primary.main,
            width: 32, 
            height: 32,
            flexShrink: 0
          }} 
        />
        <div style={{ 
          width: '100%',
          minWidth: 0 // Allows flex child to shrink below content size
        }}>
          {/* Enhanced component takes priority and renders full width */}
          {enhancedComponent ? (
            <div style={{ width: '100%' }}>
              {enhancedComponent}
            </div>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(message as any).content?.text}
              </ReactMarkdown>
              
              {/* Render artifacts if present */}
              {(message as any).artifacts && (
                <ArtifactRenderer artifacts={(message as any).artifacts} />
              )}
            </>
          )}
          
          {(message as any).toolCalls && (message as any).toolCalls !== '[]' && (
            <div style={{
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
              padding: theme.spacing(1),
              borderRadius: theme.shape.borderRadius,
              marginTop: theme.spacing(1),
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Tool Calls
              </Typography>
              {JSON.parse((message as any).toolCalls).map((toolCall: { name: string, args: unknown, id: string }, index: number) => {
                // Use tool call ID or index as key for expanded state
                const toolCallKey = toolCall.id || `tool-${index}`;
                const expanded = expandedToolCalls[toolCallKey] || false;
                
                // Parse and format the args to display
                let formattedArgs;
                try {
                  formattedArgs = stringify(JSON.parse(JSON.stringify(toolCall.args)));
                } catch {
                  formattedArgs = stringify(toolCall.args);
                }
                
                // Split into lines and limit to first 5 if not expanded
                const lines = formattedArgs.split('\n');
                const isLong = lines.length > 5;
                const displayLines = expanded ? lines : lines.slice(0, 5);
                
                return (
                  <div key={toolCall.id || index} style={{
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.common.white,
                    padding: theme.spacing(1),
                    borderRadius: theme.shape.borderRadius,
                    marginBottom: theme.spacing(1)
                  }}>
                    <Typography variant="body2" color="primary" fontWeight="bold" style={{ display: 'flex', alignItems: 'center' }}>
                      <BuildIcon fontSize="small" style={{ marginRight: theme.spacing(0.5) }} />
                      {toolCall.name}
                    </Typography>
                    <div style={{
                      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
                      padding: theme.spacing(1),
                      borderRadius: theme.shape.borderRadius,
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      marginTop: theme.spacing(0.5)
                    }}>
                      <pre>
                        {displayLines.join('\n')}
                        {isLong && !expanded && '...'}
                      </pre>
                      {isLong && (
                        <Button 
                          size="small"
                          onClick={() => setExpandedToolCalls(prev => ({
                            ...prev,
                            [toolCallKey]: !expanded
                          }))}
                          startIcon={expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          style={{ 
                            marginTop: theme.spacing(0.5),
                            fontSize: '0.75rem',
                            textTransform: 'none'
                          }}
                        >
                          {expanded ? 'Show Less' : 'Show More'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 0.5 }}>
        <CopyButton text={(message as any).content?.text || ''} />
      </Box>
    </div>
  );
};

export default AiMessageComponent;
