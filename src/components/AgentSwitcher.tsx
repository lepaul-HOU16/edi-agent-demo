
import React from 'react';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';

export type AgentType = 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';

export interface AgentSwitcherProps {
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  disabled?: boolean;
  variant?: 'panel' | 'input';
}

const AgentSwitcher: React.FC<AgentSwitcherProps> = ({
  selectedAgent,
  onAgentChange,
  disabled = false,
  variant = 'input'
}) => {
  const items: any[] = [
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
    },
    { 
      id: 'edicraft', 
      text: 'EDIcraft',
      iconName: selectedAgent === 'edicraft' ? 'check' : undefined
    }
  ];

  return (
    <div 
      className={`agent-switcher-container agent-switcher-${variant}`}
      role="navigation"
      aria-label={`${variant === 'panel' ? 'Panel' : 'Input'} agent selector`}
    >
      <ButtonDropdown
        items={items}
        onItemClick={({ detail }) => {
          onAgentChange(detail.id as AgentType);
        }}
        disabled={disabled}
        expandToViewport={true}
        ariaLabel={`Select AI agent for query processing. Currently selected: ${selectedAgent}`}
      />
    </div>
  );
};

export default AgentSwitcher;
