/**
 * ConfirmationDialog Component
 * 
 * Displays confirmation prompts for destructive operations like:
 * - Project deletion
 * - Bulk deletion
 * - Project merging
 * 
 * Requirements: 2.1, 2.6, 4.2, 4.4
 */

import React from 'react';
import { useTheme } from '@mui/material/styles';

export interface ConfirmationDialogProps {
  message: string;
  confirmationPrompt?: string;
  options?: Array<{
    label: string;
    value: string;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  projectList?: string[];
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/**
 * ConfirmationDialog - Interactive confirmation prompt component
 * 
 * Displays confirmation messages with action buttons for user response.
 * Supports:
 * - Simple yes/no confirmations
 * - Multiple choice options
 * - Project list display for bulk operations
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  message,
  confirmationPrompt,
  options,
  projectList,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  // Default options if none provided
  const defaultOptions = [
    { label: 'Yes', value: 'yes', variant: 'danger' as const },
    { label: 'Cancel', value: 'cancel', variant: 'secondary' as const },
  ];

  const displayOptions = options || defaultOptions;

  const getButtonStyle = (variant: 'primary' | 'danger' | 'secondary' = 'primary') => {
    const baseStyle = {
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      marginRight: '8px',
    };

    switch (variant) {
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: theme.palette.mode === 'dark' ? '#d32f2f' : '#f44336',
          color: '#ffffff',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0',
          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
        };
      case 'primary':
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.palette.mode === 'dark' ? '#1976d2' : '#2196f3',
          color: '#ffffff',
        };
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
        border: `2px solid ${theme.palette.mode === 'dark' ? '#ffa726' : '#ff9800'}`,
        borderRadius: '8px',
        padding: '20px',
        margin: '16px 0',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Warning Icon and Title */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>⚠️</span>
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: theme.palette.mode === 'dark' ? '#ffa726' : '#f57c00',
          }}
        >
          Confirmation Required
        </h3>
      </div>

      {/* Main Message */}
      <div
        style={{
          marginBottom: '16px',
          fontSize: '15px',
          lineHeight: '1.6',
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#424242',
        }}
      >
        {message}
      </div>

      {/* Project List (for bulk operations) */}
      {projectList && projectList.length > 0 && (
        <div
          style={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            border: `1px solid ${theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0'}`,
            borderRadius: '14px',
            padding: '12px',
            marginBottom: '16px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '8px',
              color: theme.palette.mode === 'dark' ? '#bdbdbd' : '#757575',
            }}
          >
            Projects to be affected:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {projectList.map((project, index) => (
              <li
                key={index}
                style={{
                  fontSize: '14px',
                  marginBottom: '4px',
                  color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#424242',
                }}
              >
                {project}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmation Prompt */}
      {confirmationPrompt && (
        <div
          style={{
            fontSize: '14px',
            fontStyle: 'italic',
            marginBottom: '16px',
            color: theme.palette.mode === 'dark' ? '#bdbdbd' : '#757575',
          }}
        >
          {confirmationPrompt}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {displayOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => {
              if (option.value === 'cancel') {
                onCancel();
              } else {
                onConfirm(option.value);
              }
            }}
            style={getButtonStyle(option.variant)}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Help Text */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: theme.palette.mode === 'dark' ? '#9e9e9e' : '#9e9e9e',
        }}
      >
        💡 This action requires confirmation to prevent accidental data loss.
      </div>
    </div>
  );
};

export default ConfirmationDialog;
