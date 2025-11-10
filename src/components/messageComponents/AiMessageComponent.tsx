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
import StableEducationalMessage from '../StableEducationalMessage';

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

  // Detect if this is an educational response (simple AI message without enhanced component)
  const isEducationalMessage = !enhancedComponent && 
                              !(message as any).artifacts && 
                              (message as any).content?.text &&
                              (!(message as any).toolCalls || (message as any).toolCalls === '[]');

  console.log('🎯 AiMessageComponent: Educational message detection:', {
    isEducationalMessage,
    hasEnhancedComponent: !!enhancedComponent,
    hasArtifacts: !!(message as any).artifacts,
    hasToolCalls: !!(message as any).toolCalls,
    toolCallsValue: (message as any).toolCalls,
    messageLength: (message as any).content?.text?.length || 0
  });

  // CRITICAL FIX: Use isolated component for educational messages
  if (isEducationalMessage) {
    console.log('🔒 AiMessageComponent: Using StableEducationalMessage for educational response');
    return <StableEducationalMessage message={message} theme={theme} />;
  }

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '40px',
        width: '100%',
        // Add stability measures to prevent scroll interference
        position: 'relative',
        minHeight: 'auto',
        // Prevent layout shifts by ensuring consistent container behavior
        contain: 'layout style',
        willChange: 'auto' // Optimize for rendering stability
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
          display: 'grid',
          gridTemplateColumns: '32px 1fr',
          gap: '8px',
          marginBottom: '0'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            flexShrink: 0
          }}>
            <SupportAgentIcon 
              sx={{ 
                color: theme.palette.primary.main,
                width: '32px', 
                height: '32px',
                display: 'block'
              }} 
            />
          </div>
          <div style={{ 
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
            
            {/* Show fallback warning if advanced AI was unavailable */}
            {(message as any).metadata?.fallbackUsed && (
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(33, 150, 243, 0.1)' 
                    : 'rgba(33, 150, 243, 0.08)',
                  border: `1px solid ${theme.palette.mode === 'dark' 
                    ? 'rgba(33, 150, 243, 0.3)' 
                    : 'rgba(33, 150, 243, 0.2)'}`,
                  borderRadius: theme.shape.borderRadius,
                  padding: theme.spacing(1.5),
                  marginTop: theme.spacing(1),
                  marginBottom: theme.spacing(1),
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: theme.spacing(1)
                }}
              >
                <Box
                  sx={{
                    color: theme.palette.info.main,
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    marginTop: '2px'
                  }}
                >
                  ℹ️
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                      marginBottom: 0.5
                    }}
                  >
                    Advanced AI unavailable, using basic mode
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'block'
                    }}
                  >
                    {(message as any).metadata?.fallbackReason || 'The intelligent agent system is temporarily unavailable. Results generated using direct tool invocation.'}
                  </Typography>
                </Box>
              </Box>
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
    </div>
  );
};

export default AiMessageComponent;
