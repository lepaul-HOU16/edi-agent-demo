'use client';

import React from 'react';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import Icon from '@cloudscape-design/components/icon';

export interface AgentSwitcherProps {
  selectedAgent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable';
  onAgentChange: (agent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable') => void;
  disabled?: boolean;
}

const AgentSwitcher: React.FC<AgentSwitcherProps> = ({
  selectedAgent,
  onAgentChange,
  disabled = false
}) => {
  const items = [
    { 
      id: 'auto', 
      text: 'Auto',
      iconName: selectedAgent === 'auto' ? 'check' : undefined
    },
    { 
      id: 'petrophysics', 
      text: 'Petrophysics',
      iconName: selectedAgent === 'petrophysics' ? 'check' : undefined
    },
    { 
      id: 'maintenance', 
      text: 'Maintenance',
      iconName: selectedAgent === 'maintenance' ? 'check' : undefined
    },
    { 
      id: 'renewable', 
      text: 'Renewable Energy',
      iconName: selectedAgent === 'renewable' ? 'check' : undefined
    }
  ];

  return (
    <div className="agent-switcher-container">
      <ButtonDropdown
        items={items}
        onItemClick={({ detail }) => {
          onAgentChange(detail.id as 'auto' | 'petrophysics' | 'maintenance' | 'renewable');
        }}
        disabled={disabled}
        expandToViewport={true}
        iconName="contact"
        ariaLabel="Select agent"
      />
    </div>
  );
};

export default AgentSwitcher;
