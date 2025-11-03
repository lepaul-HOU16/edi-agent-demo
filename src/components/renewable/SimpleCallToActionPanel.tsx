/**
 * Simple Call-to-Action Panel Component
 * 
 * Simplified version for wind rose analysis with bottom positioning
 * and contextual guidance for next steps.
 */

import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Alert,
  ExpandableSection,
  Badge
} from '@cloudscape-design/components';

interface SimpleActionButton {
  id: string;
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'tertiary';
  tooltip?: string;
  disabled?: boolean;
}

interface ContextualHelp {
  title: string;
  content: string;
  expandable?: boolean;
}

interface SimpleCallToActionPanelProps {
  position: 'bottom' | 'inline' | 'floating';
  guidance: string;
  buttons: SimpleActionButton[];
  priority: 'high' | 'medium' | 'low';
  showProgress?: boolean;
  contextualHelp?: ContextualHelp;
  onActionClick: (actionId: string) => void;
}

export const SimpleCallToActionPanel: React.FC<SimpleCallToActionPanelProps> = ({
  position,
  guidance,
  buttons,
  priority,
  showProgress = false,
  contextualHelp,
  onActionClick
}) => {
  const [showHelpDetails, setShowHelpDetails] = useState(false);

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'grey';
      case 'low': return 'blue';
      default: return 'grey';
    }
  };

  // Get button variant
  const getButtonVariant = (variant: string) => {
    switch (variant) {
      case 'primary': return 'primary';
      case 'secondary': return 'normal';
      case 'tertiary': return 'link';
      default: return 'normal';
    }
  };

  return (
    <Container 
      className={`simple-call-to-action-panel ${position === 'bottom' ? 'bottom-positioned' : ''}`}
    >
      <SpaceBetween direction="vertical" size="m">
        {/* Header with Priority Badge */}
        <Header
          variant="h3"
          actions={
            <Badge color={getPriorityColor(priority)}>
              {priority.toUpperCase()} PRIORITY
            </Badge>
          }
        >
          Next Steps
        </Header>

        {/* Guidance Message */}
        <Alert 
          type={priority === 'high' ? 'info' : 'success'}
          header="Recommended Actions"
          action={
            contextualHelp && (
              <Button
                iconName="status-info"
                variant="link"
                onClick={() => setShowHelpDetails(!showHelpDetails)}
              >
                {showHelpDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            )
          }
        >
          <SpaceBetween direction="vertical" size="s">
            <Box>{guidance}</Box>
            
            {showHelpDetails && contextualHelp && (
              <ExpandableSection 
                header={contextualHelp.title}
                defaultExpanded={contextualHelp.expandable !== false}
              >
                <Box>{contextualHelp.content}</Box>
              </ExpandableSection>
            )}
          </SpaceBetween>
        </Alert>

        {/* Action Buttons */}
        <SpaceBetween direction="horizontal" size="s">
          {buttons.map((button) => (
            <Button
              key={button.id}
              variant={getButtonVariant(button.variant) as any}
              disabled={button.disabled}
              onClick={() => onActionClick(button.action)}
              ariaLabel={button.tooltip || button.label}
            >
              {button.label}
            </Button>
          ))}
        </SpaceBetween>
      </SpaceBetween>

      {/* Custom Styles */}
      <style jsx>{`
        .simple-call-to-action-panel.bottom-positioned {
          position: sticky;
          bottom: 20px;
          z-index: 100;
          margin-top: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          background: white;
        }
        
        .simple-call-to-action-panel {
          border: 2px solid #0073bb;
          border-radius: 8px;
          background: #f9f9f9;
        }
      `}</style>
    </Container>
  );
};

export default SimpleCallToActionPanel;