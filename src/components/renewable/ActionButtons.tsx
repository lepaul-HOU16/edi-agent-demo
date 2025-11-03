/**
 * Action Buttons Component
 * 
 * Renders contextual action buttons that guide users to the next logical step
 * in their renewable energy workflow.
 */

import React from 'react';
import { Button, SpaceBetween, Box } from '@cloudscape-design/components';

export interface ActionButton {
  label: string;
  query: string;
  icon: string;
  primary?: boolean;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  onActionClick: (query: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ actions, onActionClick }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <Box margin={{ top: 'm' }} padding={{ top: 's', bottom: 's' }}>
      <SpaceBetween direction="horizontal" size="xs">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.primary ? 'primary' : 'normal'}
            iconName={action.icon as any}
            onClick={() => onActionClick(action.query)}
          >
            {action.label}
          </Button>
        ))}
      </SpaceBetween>
    </Box>
  );
};

export default ActionButtons;
