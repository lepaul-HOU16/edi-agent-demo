/**
 * ConfirmationMessageComponent
 * 
 * Displays confirmation prompts in the chat interface for lifecycle operations.
 * Integrates with the confirmation state manager to handle user responses.
 * 
 * Requirements: 2.1, 2.6, 4.2, 4.4
 */

import React from 'react';
import { useTheme } from '@mui/material/styles';
import { ConfirmationDialog } from '../ConfirmationDialog';

export interface ConfirmationMessageProps {
  message: string;
  confirmationPrompt?: string;
  options?: Array<{
    label: string;
    value: string;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  projectList?: string[];
  action: string;
  metadata?: Record<string, any>;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/**
 * ConfirmationMessageComponent - Renders confirmation prompts in chat
 * 
 * This component is displayed when the backend returns a response that requires
 * user confirmation (e.g., delete project, bulk delete, merge projects).
 * 
 * It wraps the ConfirmationDialog component and integrates it into the chat
 * message flow.
 */
export const ConfirmationMessageComponent: React.FC<ConfirmationMessageProps> = ({
  message,
  confirmationPrompt,
  options,
  projectList,
  action,
  metadata,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '16px 0',
      }}
    >
      {/* AI Message Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '14px',
          color: theme.palette.mode === 'dark' ? '#9e9e9e' : '#757575',
        }}
      >
        <span style={{ marginRight: '8px' }}>🤖</span>
        <span>AI Assistant</span>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        message={message}
        confirmationPrompt={confirmationPrompt}
        options={options}
        projectList={projectList}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      {/* Context Information */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9',
            border: `1px solid ${theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0'}`,
            borderRadius: '4px',
            fontSize: '13px',
            color: theme.palette.mode === 'dark' ? '#bdbdbd' : '#757575',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Additional Information:</div>
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} style={{ marginLeft: '8px' }}>
              • {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfirmationMessageComponent;
