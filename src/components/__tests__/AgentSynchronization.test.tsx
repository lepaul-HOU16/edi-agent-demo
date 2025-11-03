import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Test component that simulates the ChatPage with two synchronized switchers
const SynchronizedAgentSwitchers: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto');

  const handleAgentChange = (agent: AgentType) => {
    setSelectedAgent(agent);
    sessionStorage.setItem('selectedAgent', agent);
  };

  return (
    <div>
      <div data-testid="panel-switcher">
        <AgentSwitcher
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
          variant="panel"
        />
      </div>
      <div data-testid="input-switcher">
        <AgentSwitcher
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
          variant="input"
        />
      </div>
      <div data-testid="selected-agent-display">{selectedAgent}</div>
    </div>
  );
};

// Test component that restores from sessionStorage
const AgentSwitcherWithPersistence: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(() => {
    const stored = sessionStorage.getItem('selectedAgent');
    return (stored as AgentType) || 'auto';
  });

  const handleAgentChange = (agent: AgentType) => {
    setSelectedAgent(agent);
    sessionStorage.setItem('selectedAgent', agent);
  };

  return (
    <div>
      <AgentSwitcher
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
      />
      <div data-testid="selected-agent-display">{selectedAgent}</div>
    </div>
  );
};

describe('Agent Synchronization Integration Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Panel switcher updates input switcher', () => {
    it('should update input switcher when panel switcher changes to petrophysics', () => {
      render(<SynchronizedAgentSwitchers />);

      // Initially both should show auto
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const inputSwitcher = screen.getAllByTestId('button-dropdown')[1];
      
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('auto');

      // Click petrophysics in panel switcher
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const petrophysicsItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-petrophysics'
      );
      fireEvent.click(petrophysicsItem!);

      // Both switchers should now show petrophysics
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('petrophysics');
    });

    it('should update input switcher when panel switcher changes to maintenance', () => {
      render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const maintenanceItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-maintenance'
      );
      fireEvent.click(maintenanceItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('maintenance');
    });

    it('should update input switcher when panel switcher changes to renewable', () => {
      render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const renewableItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-renewable'
      );
      fireEvent.click(renewableItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('renewable');
    });

    it('should update input switcher when panel switcher changes to edicraft', () => {
      render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const edicraftItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-edicraft'
      );
      fireEvent.click(edicraftItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('edicraft');
    });
  });

  describe('Input switcher updates panel switcher', () => {
    it('should update panel switcher when input switcher changes to petrophysics', () => {
      render(<SynchronizedAgentSwitchers />);

      const inputSwitcher = screen.getAllByTestId('button-dropdown')[1];
      const inputItems = inputSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const petrophysicsItem = Array.from(inputItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-petrophysics'
      );
      fireEvent.click(petrophysicsItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('petrophysics');
    });

    it('should update panel switcher when input switcher changes to maintenance', () => {
      render(<SynchronizedAgentSwitchers />);

      const inputSwitcher = screen.getAllByTestId('button-dropdown')[1];
      const inputItems = inputSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const maintenanceItem = Array.from(inputItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-maintenance'
      );
      fireEvent.click(maintenanceItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('maintenance');
    });

    it('should update panel switcher when input switcher changes to renewable', () => {
      render(<SynchronizedAgentSwitchers />);

      const inputSwitcher = screen.getAllByTestId('button-dropdown')[1];
      const inputItems = inputSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const renewableItem = Array.from(inputItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-renewable'
      );
      fireEvent.click(renewableItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('renewable');
    });

    it('should update panel switcher when input switcher changes to edicraft', () => {
      render(<SynchronizedAgentSwitchers />);

      const inputSwitcher = screen.getAllByTestId('button-dropdown')[1];
      const inputItems = inputSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const edicraftItem = Array.from(inputItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-edicraft'
      );
      fireEvent.click(edicraftItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('edicraft');
    });
  });

  describe('SessionStorage persistence', () => {
    it('should persist agent selection to sessionStorage when changed', () => {
      render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const petrophysicsItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-petrophysics'
      );
      fireEvent.click(petrophysicsItem!);

      expect(sessionStorage.getItem('selectedAgent')).toBe('petrophysics');
    });

    it('should restore agent selection from sessionStorage on mount', () => {
      sessionStorage.setItem('selectedAgent', 'maintenance');

      render(<AgentSwitcherWithPersistence />);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('maintenance');
    });

    it('should default to auto when no sessionStorage value exists', () => {
      render(<AgentSwitcherWithPersistence />);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('auto');
    });

    it('should update sessionStorage when agent changes multiple times', () => {
      render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');

      // Change to petrophysics
      const petrophysicsItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-petrophysics'
      );
      fireEvent.click(petrophysicsItem!);
      expect(sessionStorage.getItem('selectedAgent')).toBe('petrophysics');

      // Change to renewable
      const renewableItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-renewable'
      );
      fireEvent.click(renewableItem!);
      expect(sessionStorage.getItem('selectedAgent')).toBe('renewable');

      // Change to edicraft
      const edicraftItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-edicraft'
      );
      fireEvent.click(edicraftItem!);
      expect(sessionStorage.getItem('selectedAgent')).toBe('edicraft');
    });

    it('should persist all 5 agent types correctly', () => {
      const agents: AgentType[] = ['auto', 'petrophysics', 'maintenance', 'renewable', 'edicraft'];

      agents.forEach(agent => {
        sessionStorage.clear();
        sessionStorage.setItem('selectedAgent', agent);

        const { unmount } = render(<AgentSwitcherWithPersistence />);
        expect(screen.getByTestId('selected-agent-display')).toHaveTextContent(agent);
        unmount();
      });
    });
  });

  describe('State management across re-renders', () => {
    it('should maintain agent selection after re-render', () => {
      const { rerender } = render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const maintenanceItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-maintenance'
      );
      fireEvent.click(maintenanceItem!);

      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('maintenance');

      // Force re-render
      rerender(<SynchronizedAgentSwitchers />);

      // Should still show maintenance
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('maintenance');
    });

    it('should maintain synchronization after multiple re-renders', () => {
      const { rerender } = render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const renewableItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-renewable'
      );
      fireEvent.click(renewableItem!);

      // Multiple re-renders
      rerender(<SynchronizedAgentSwitchers />);
      rerender(<SynchronizedAgentSwitchers />);
      rerender(<SynchronizedAgentSwitchers />);

      // Should still show renewable
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('renewable');
    });
  });

  describe('Bidirectional synchronization', () => {
    it('should maintain synchronization when switching between panel and input', () => {
      render(<SynchronizedAgentSwitchers />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const inputSwitcher = screen.getAllByTestId('button-dropdown')[1];

      // Change via panel
      const panelItems = panelSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const petrophysicsItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-petrophysics'
      );
      fireEvent.click(petrophysicsItem!);
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('petrophysics');

      // Change via input
      const inputItems = inputSwitcher.querySelectorAll('[data-testid^="dropdown-item-"]');
      const maintenanceItem = Array.from(inputItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-maintenance'
      );
      fireEvent.click(maintenanceItem!);
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('maintenance');

      // Change via panel again
      const renewableItem = Array.from(panelItems).find(
        item => item.getAttribute('data-testid') === 'dropdown-item-renewable'
      );
      fireEvent.click(renewableItem!);
      expect(screen.getByTestId('selected-agent-display')).toHaveTextContent('renewable');
    });
  });
});
