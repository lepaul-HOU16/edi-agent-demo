import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSwitcher, { AgentType } from '../AgentSwitcher';

// Mock Cloudscape ButtonDropdown
jest.mock('@cloudscape-design/components/button-dropdown', () => {
  return function MockButtonDropdown({ items, onItemClick, disabled, ariaLabel }: any) {
    return (
      <div data-testid="button-dropdown" aria-label={ariaLabel}>
        <button disabled={disabled} data-testid="dropdown-trigger">
          Select Agent
        </button>
        <ul data-testid="dropdown-items">
          {items.map((item: any) => (
            <li 
              key={item.id}
              data-testid={`dropdown-item-${item.id}`}
              onClick={() => onItemClick({ detail: { id: item.id } })}
            >
              {item.text}
              {item.iconName === 'check' && <span data-testid={`checkmark-${item.id}`}>✓</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };
});

describe('AgentSwitcher', () => {
  const mockOnAgentChange = jest.fn();

  beforeEach(() => {
    mockOnAgentChange.mockClear();
  });

  describe('Rendering all 5 agent options', () => {
    it('should render all 5 agent options', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.getByTestId('dropdown-item-auto')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item-petrophysics')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item-maintenance')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item-renewable')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-item-edicraft')).toBeInTheDocument();
    });

    it('should display correct text for each agent option', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.getByText('Auto')).toBeInTheDocument();
      expect(screen.getByText('Petrophysics')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Renewable Energy')).toBeInTheDocument();
      expect(screen.getByText('EDIcraft')).toBeInTheDocument();
    });
  });

  describe('Checkmark display for selected agent', () => {
    it('should show checkmark for auto agent when selected', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.getByTestId('checkmark-auto')).toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-petrophysics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-maintenance')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-renewable')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-edicraft')).not.toBeInTheDocument();
    });

    it('should show checkmark for petrophysics agent when selected', () => {
      render(
        <AgentSwitcher 
          selectedAgent="petrophysics" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.queryByTestId('checkmark-auto')).not.toBeInTheDocument();
      expect(screen.getByTestId('checkmark-petrophysics')).toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-maintenance')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-renewable')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-edicraft')).not.toBeInTheDocument();
    });

    it('should show checkmark for maintenance agent when selected', () => {
      render(
        <AgentSwitcher 
          selectedAgent="maintenance" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.queryByTestId('checkmark-auto')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-petrophysics')).not.toBeInTheDocument();
      expect(screen.getByTestId('checkmark-maintenance')).toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-renewable')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-edicraft')).not.toBeInTheDocument();
    });

    it('should show checkmark for renewable agent when selected', () => {
      render(
        <AgentSwitcher 
          selectedAgent="renewable" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.queryByTestId('checkmark-auto')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-petrophysics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-maintenance')).not.toBeInTheDocument();
      expect(screen.getByTestId('checkmark-renewable')).toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-edicraft')).not.toBeInTheDocument();
    });

    it('should show checkmark for edicraft agent when selected', () => {
      render(
        <AgentSwitcher 
          selectedAgent="edicraft" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      expect(screen.queryByTestId('checkmark-auto')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-petrophysics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-maintenance')).not.toBeInTheDocument();
      expect(screen.queryByTestId('checkmark-renewable')).not.toBeInTheDocument();
      expect(screen.getByTestId('checkmark-edicraft')).toBeInTheDocument();
    });
  });

  describe('onAgentChange callback', () => {
    it('should call onAgentChange with correct agent when auto is clicked', () => {
      render(
        <AgentSwitcher 
          selectedAgent="petrophysics" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      fireEvent.click(screen.getByTestId('dropdown-item-auto'));
      expect(mockOnAgentChange).toHaveBeenCalledWith('auto');
      expect(mockOnAgentChange).toHaveBeenCalledTimes(1);
    });

    it('should call onAgentChange with correct agent when petrophysics is clicked', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      fireEvent.click(screen.getByTestId('dropdown-item-petrophysics'));
      expect(mockOnAgentChange).toHaveBeenCalledWith('petrophysics');
      expect(mockOnAgentChange).toHaveBeenCalledTimes(1);
    });

    it('should call onAgentChange with correct agent when maintenance is clicked', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      fireEvent.click(screen.getByTestId('dropdown-item-maintenance'));
      expect(mockOnAgentChange).toHaveBeenCalledWith('maintenance');
      expect(mockOnAgentChange).toHaveBeenCalledTimes(1);
    });

    it('should call onAgentChange with correct agent when renewable is clicked', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      fireEvent.click(screen.getByTestId('dropdown-item-renewable'));
      expect(mockOnAgentChange).toHaveBeenCalledWith('renewable');
      expect(mockOnAgentChange).toHaveBeenCalledTimes(1);
    });

    it('should call onAgentChange with correct agent when edicraft is clicked', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      fireEvent.click(screen.getByTestId('dropdown-item-edicraft'));
      expect(mockOnAgentChange).toHaveBeenCalledWith('edicraft');
      expect(mockOnAgentChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel vs input variant differences', () => {
    it('should render with input variant by default', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      const container = screen.getByRole('navigation');
      expect(container).toHaveClass('agent-switcher-input');
      expect(container).not.toHaveClass('agent-switcher-panel');
    });

    it('should render with panel variant when specified', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange}
          variant="panel"
        />
      );

      const container = screen.getByRole('navigation');
      expect(container).toHaveClass('agent-switcher-panel');
      expect(container).not.toHaveClass('agent-switcher-input');
    });

    it('should render with input variant when explicitly specified', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange}
          variant="input"
        />
      );

      const container = screen.getByRole('navigation');
      expect(container).toHaveClass('agent-switcher-input');
      expect(container).not.toHaveClass('agent-switcher-panel');
    });

    it('should have correct aria-label for panel variant', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange}
          variant="panel"
        />
      );

      const container = screen.getByRole('navigation');
      expect(container).toHaveAttribute('aria-label', 'Panel agent selector');
    });

    it('should have correct aria-label for input variant', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange}
          variant="input"
        />
      );

      const container = screen.getByRole('navigation');
      expect(container).toHaveAttribute('aria-label', 'Input agent selector');
    });

    it('should include selected agent in ButtonDropdown aria-label', () => {
      render(
        <AgentSwitcher 
          selectedAgent="petrophysics" 
          onAgentChange={mockOnAgentChange}
        />
      );

      const dropdown = screen.getByTestId('button-dropdown');
      expect(dropdown).toHaveAttribute('aria-label', 'Select AI agent for query processing. Currently selected: petrophysics');
    });
  });

  describe('Disabled state', () => {
    it('should be enabled by default', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange} 
        />
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).not.toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange}
          disabled={true}
        />
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeDisabled();
    });

    it('should be enabled when disabled prop is false', () => {
      render(
        <AgentSwitcher 
          selectedAgent="auto" 
          onAgentChange={mockOnAgentChange}
          disabled={false}
        />
      );

      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).not.toBeDisabled();
    });
  });
});
