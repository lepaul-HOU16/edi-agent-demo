import React from 'react';
import { Box, Button, Typography, Alert, List, ListItem, ListItemText } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface DataAccessApprovalComponentProps {
  data: {
    message?: string;
    outOfScopeItems?: string[];
    collectionId?: string;
    collectionName?: string;
  };
  theme: any;
  onApprove?: () => void;
  onCancel?: () => void;
}

export const DataAccessApprovalComponent: React.FC<DataAccessApprovalComponentProps> = ({
  data,
  theme,
  onApprove,
  onCancel
}) => {
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Box
      sx={{
        padding: 3,
        margin: '16px 0',
        backgroundColor: isDark ? '#3d2f1f' : '#fff8e1',
        border: `2px solid ${isDark ? '#ff9800' : '#ffa726'}`,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <WarningAmberIcon 
          sx={{ 
            fontSize: 32, 
            color: isDark ? '#ffa726' : '#f57c00',
            marginRight: 1.5
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            color: isDark ? '#ffa726' : '#f57c00'
          }}
        >
          Data Access Request
        </Typography>
      </Box>

      {/* Message */}
      <Alert 
        severity="warning" 
        sx={{ 
          marginBottom: 2,
          backgroundColor: isDark ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)'
        }}
      >
        <Typography variant="body1" sx={{ marginBottom: 1 }}>
          This query requires access to data outside your collection <strong>"{data.collectionName}"</strong>.
        </Typography>
      </Alert>

      {/* Out of scope items */}
      {data.outOfScopeItems && data.outOfScopeItems.length > 0 && (
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
            Out of scope items ({data.outOfScopeItems.length}):
          </Typography>
          <List dense sx={{ 
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
            borderRadius: 1,
            padding: 1
          }}>
            {data.outOfScopeItems.slice(0, 5).map((item, index) => (
              <ListItem key={index} sx={{ paddingY: 0.5 }}>
                <ListItemText 
                  primary={item}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontFamily: 'monospace'
                  }}
                />
              </ListItem>
            ))}
            {data.outOfScopeItems.length > 5 && (
              <ListItem sx={{ paddingY: 0.5 }}>
                <ListItemText 
                  primary={`... and ${data.outOfScopeItems.length - 5} more`}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    color: 'text.secondary'
                  }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      )}

      {/* Options */}
      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
          Your options:
        </Typography>
        <List dense>
          <ListItem sx={{ paddingY: 0.5 }}>
            <ListItemText 
              primary="1. Approve expanded access (one-time)"
              secondary="Allow the AI to access data outside your collection for this query only"
            />
          </ListItem>
          <ListItem sx={{ paddingY: 0.5 }}>
            <ListItemText 
              primary="2. Rephrase query"
              secondary="Modify your query to use only data within your collection"
            />
          </ListItem>
          <ListItem sx={{ paddingY: 0.5 }}>
            <ListItemText 
              primary="3. Cancel query"
              secondary="Cancel this request and start over"
            />
          </ListItem>
        </List>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          sx={{ minWidth: 120 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<CheckCircleIcon />}
          onClick={onApprove}
          sx={{ 
            minWidth: 120,
            backgroundColor: isDark ? '#ffa726' : '#f57c00',
            '&:hover': {
              backgroundColor: isDark ? '#ff9800' : '#ef6c00'
            }
          }}
        >
          Approve
        </Button>
      </Box>

      {/* Info note */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block',
          marginTop: 2,
          color: 'text.secondary',
          fontStyle: 'italic'
        }}
      >
        Note: This approval will be logged in your session for audit purposes.
      </Typography>
    </Box>
  );
};
