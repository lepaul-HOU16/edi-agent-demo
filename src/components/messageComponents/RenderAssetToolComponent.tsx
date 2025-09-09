// This component is used to render an asset in a chat message.

import React from 'react';

import Link from 'next/link';

import { Theme } from '@mui/material/styles';
import { Typography, Box, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Message } from '@/../utils/types';
import FileViewer from '../FileViewer';
import { useViewport, calculateOptimalIframeDimensions, getFileTypeFromExtension } from '../../hooks/useViewport';

interface RenderAssetToolComponentProps {
  content: Message['content'];
  theme: Theme;
  chatSessionId: string;
}

const RenderAssetToolComponent: React.FC<RenderAssetToolComponentProps> = ({ content, theme, chatSessionId }) => {
  const viewport = useViewport();
  
  try {
    const assetData = JSON.parse((content as any)?.text || '{}');
    const { filePath, title, description } = assetData;
    const s3Key = `chatSessionArtifacts/sessionId=${chatSessionId}/${filePath}`;
    
    if (!filePath) {
      return (
        <Box sx={{
          padding: theme.spacing(1),
          borderRadius: theme.shape.borderRadius,
        }}>
          <Typography variant="subtitle2" color="error">
            No file path provided for asset rendering
          </Typography>
        </Box>
      );
    }

    // Get content type and calculate viewport-aware dimensions
    const contentType = getFileTypeFromExtension(filePath);
    const dimensions = calculateOptimalIframeDimensions(viewport, contentType);

    return (
      <Box sx={{
        // backgroundColor: theme.palette.grey[50],
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '100%'
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing(1.5),
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            // color: theme.palette.primary.main
          }}>
            <DescriptionIcon />
            <Typography variant="subtitle1" fontWeight="medium">
              {title || 'Asset Preview'}
            </Typography>
          </Box>
          <Tooltip title="Open in new tab">
            <Link href={`/preview/${s3Key}`} passHref>
              <OpenInNewIcon fontSize="small" />
            </Link>
          </Tooltip>
        </Box>

        {/* Description if provided */}
        {description && (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ marginBottom: theme.spacing(1.5) }}
          >
            {description}
          </Typography>
        )}

        {/* S3 Key Display */}
        <Typography 
          variant="caption" 
          color="textSecondary" 
          sx={{ 
            display: 'block',
            marginBottom: theme.spacing(1),
            fontFamily: 'monospace'
          }}
        >
          S3 Key: {s3Key}
        </Typography>

        {/* Asset Preview with viewport-aware sizing */}
        <Box sx={{
          width: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{
            width: '100%',
            height: '100%'
          }}>
            {/* Special handling for HTML files with viewport-aware sizing */}
            {s3Key.toLowerCase().endsWith('.html') ? (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                  Using viewport-aware HTML rendering
                </Typography>
                <Box 
                  className="html-iframe"
                  sx={{ 
                    width: '100%', 
                    height: dimensions.height,
                    maxHeight: dimensions.maxHeight,
                    overflow: 'hidden' 
                  }}
                >
                  <iframe 
                    src={`/file/${s3Key}`}
                    style={{ 
                      width: dimensions.width,
                      height: dimensions.height,
                      maxHeight: dimensions.maxHeight,
                      border: 'none',
                      overflow: 'hidden'
                    }}
                    title="HTML Content"
                  />
                </Box>
              </Box>
            ) : (
              <FileViewer s3Key={s3Key} />
            )}
          </Box>
        </Box>
      </Box>
    );
  } catch (error) {
    return (
      <Box sx={{
        // backgroundColor: theme.palette.grey[200],
        padding: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
      }}>
        <Typography variant="subtitle2" color="error" gutterBottom>
          Error rendering asset
        </Typography>
        <pre>
          {(content as any)?.text + "\n" + error}
        </pre>
      </Box>
    );
  }
};

export default RenderAssetToolComponent;
