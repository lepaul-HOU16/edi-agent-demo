import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';

// Define thinking block interface
export interface ThinkingBlock {
  type: 'thinking';
  content: string;
  timestamp: number;
}

// Props interface
export interface ExtendedThinkingDisplayProps {
  thinking: ThinkingBlock[];
  defaultExpanded?: boolean;
}

// Component to render individual thinking block
const ThinkingBlockItem: React.FC<{ block: ThinkingBlock; index: number }> = ({
  block,
  index,
}) => {
  const formattedTime = new Date(block.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 1,
        backgroundColor: 'rgba(156, 39, 176, 0.04)',
        border: '1px solid rgba(156, 39, 176, 0.1)',
        mb: 1.5,
      }}
    >
      {/* Timestamp header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(156, 39, 176, 0.08)',
            padding: '2px 8px',
            borderRadius: 0.5,
          }}
        >
          {formattedTime}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Step {index + 1}
        </Typography>
      </Box>

      {/* Thinking content */}
      <Typography
        variant="body2"
        sx={{
          color: 'text.primary',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {block.content}
      </Typography>
    </Box>
  );
};

// Main component
export const ExtendedThinkingDisplay: React.FC<ExtendedThinkingDisplayProps> = ({
  thinking,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!thinking || thinking.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        boxShadow: 1,
        mb: 2,
      }}
    >
      {/* Header - Always visible */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 2,
          cursor: 'pointer',
          backgroundColor: expanded ? 'rgba(156, 39, 176, 0.04)' : 'transparent',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(156, 39, 176, 0.08)',
          },
        }}
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PsychologyIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0 }}>
              Agent Reasoning
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {thinking.length} thinking {thinking.length === 1 ? 'step' : 'steps'}
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          sx={{
            color: 'text.secondary',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(0deg)' : 'rotate(0deg)',
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expandable content */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ padding: 2 }}>
          {/* Info message */}
          <Box
            sx={{
              padding: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              mb: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              💡 This shows Claude's internal reasoning process as it analyzes your request
              and makes decisions.
            </Typography>
          </Box>

          {/* Thinking blocks */}
          <Box>
            {thinking.map((block, index) => (
              <ThinkingBlockItem key={`thinking-${index}`} block={block} index={index} />
            ))}
          </Box>

          {/* Summary footer */}
          <Box
            sx={{
              mt: 2,
              padding: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(76, 175, 80, 0.08)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ✅ Reasoning complete - {thinking.length} thinking{' '}
              {thinking.length === 1 ? 'step' : 'steps'} processed
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ExtendedThinkingDisplay;
