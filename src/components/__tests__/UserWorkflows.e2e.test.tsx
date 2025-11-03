/**
 * End-to-End User Workflow Tests
 * Tests complete user workflows for agent landing pages and agent selection
 * Requirements: All requirements (1.1-15.5)
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSwitcher, { AgentType } from '../AgentSwitcher';
import AgentLandingPage from '../AgentLandingPage';

// Mock Cloudscape components
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

jest.mock('@cloudscape-design/components', () => ({
  Container: ({ children, header }: any) => (
    <div data-testid="container">
      {header}
      {children}
    </div>
  ),
  Header: ({ children }: any) => <div data-testid="header">{children}</div>,
  Box: ({ children }: any) => <div data-testid="box">{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  SpaceBetween: ({ children }: any) => <div data-testid="space-between">{children}</div>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  ColumnLayout: ({ children }: any) => <div data-testid="column-layout">{children}</div>,
  ExpandableSection: ({ children, headerText }: any) => (
    <div data-testid="expandable-section">
      <div>{headerText}</div>
      {children}
    </div>
  ),
  Cards: ({ items, cardDefinition }: any) => (
    <div data-testid="cards">
      {items.map((item: any, index: number) => (
        <div key={index} data-testid={`card-${index}`}>
          {cardDefinition.sections.map((section: any, sIndex: number) => (
            <div key={sIndex}>{section.content(item)}</div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../agent-landing-pages/AgentVisualization', () => {
  return function MockAgentVisualization({ type }: any) {
    return <div data-testid="agent-visualization" data-type={type}>Visualization</div>;
  };
});

// Complete workflow test component
const CompleteWorkflowComponent: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('auto');
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const handleAgentChange = (agent: AgentType) => {
    setSelectedAgent(agent);
    sessionStorage.setItem('selectedAgent', agent);
  };

  const handleWorkflowSelect = (prompt: string) => {
    setUserInput(prompt);
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      setMessages([...messages, `[${selectedAgent}] ${userInput}`]);
      setUserInput('');
    }
  };

  return (
    <div>
      <div data-testid="panel-area">
        <div data-testid="panel-switcher">
          <AgentSwitcher
            selectedAgent={selectedAgent}
            onAgentChange={handleAgentChange}
            variant="panel"
          />
        </div>
        <div data-testid="landing-page">
          <AgentLandingPage
            selectedAgent={selectedAgent}
            onWorkflowSelect={handleWorkflowSelect}
          />
        </div>
      </div>
      
      <div data-testid="input-area">
        <AgentSwitcher
          selectedAgent={selectedAgent}
          onAgentChange={handleAgentChange}
          variant="input"
        />
        <input
          data-testid="message-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button data-testid="send-button" onClick={handleSendMessage}>
          Send
        </button>
      </div>

      <div data-testid="messages-area">
        {messages.map((msg, index) => (
          <div key={index} data-testid={`message-${index}`}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Workflow: Selecting agent from panel switcher', () => {
    it('should complete workflow of selecting agent and viewing landing page', async () => {
      render(<CompleteWorkflowComponent />);

      // Step 1: Verify initial state (auto agent)
      expect(screen.getByTestId('selected-agent-display') || screen.getByText(/Auto Agent/)).toBeTruthy();

      // Step 2: Click panel switcher to change agent
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const petrophysicsItem = panelSwitcher.querySelector('[data-testid="dropdown-item-petrophysics"]');
      fireEvent.click(petrophysicsItem!);

      // Step 3: Verify landing page updates
      await waitFor(() => {
        expect(screen.getByText(/Petrophysics Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Step 4: Verify both switchers are synchronized
      const visualization = screen.getByTestId('agent-visualization');
      expect(visualization).toHaveAttribute('data-type', 'petrophysics');
    });

    it('should update landing content when switching between agents', async () => {
      render(<CompleteWorkflowComponent />);

      // Switch to maintenance
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const maintenanceItem = panelSwitcher.querySelector('[data-testid="dropdown-item-maintenance"]');
      fireEvent.click(maintenanceItem!);

      await waitFor(() => {
        expect(screen.getByText(/Maintenance Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to renewable
      const renewableItem = panelSwitcher.querySelector('[data-testid="dropdown-item-renewable"]');
      fireEvent.click(renewableItem!);

      await waitFor(() => {
        expect(screen.getByText(/Renewable Energy Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to edicraft
      const edicraftItem = panelSwitcher.querySelector('[data-testid="dropdown-item-edicraft"]');
      fireEvent.click(edicraftItem!);

      await waitFor(() => {
        expect(screen.getByText(/EDIcraft Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Workflow: Sending message with selected agent', () => {
    it('should complete workflow of selecting agent and sending message', async () => {
      render(<CompleteWorkflowComponent />);

      // Step 1: Select petrophysics agent
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const petrophysicsItem = panelSwitcher.querySelector('[data-testid="dropdown-item-petrophysics"]');
      fireEvent.click(petrophysicsItem!);

      await waitFor(() => {
        expect(screen.getByText(/Petrophysics Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Step 2: Type message
      const messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Analyze well data for WELL-001' } });

      // Step 3: Send message
      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      // Step 4: Verify message was sent with correct agent
      await waitFor(() => {
        const message = screen.getByTestId('message-0');
        expect(message).toHaveTextContent('[petrophysics] Analyze well data for WELL-001');
      });
    });

    it('should send messages with different agents', async () => {
      render(<CompleteWorkflowComponent />);

      // Send with auto agent
      let messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'First message' } });
      fireEvent.click(screen.getByTestId('send-button'));

      await waitFor(() => {
        expect(screen.getByTestId('message-0')).toHaveTextContent('[auto] First message');
      });

      // Switch to maintenance and send
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const maintenanceItem = panelSwitcher.querySelector('[data-testid="dropdown-item-maintenance"]');
      fireEvent.click(maintenanceItem!);

      messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Second message' } });
      fireEvent.click(screen.getByTestId('send-button'));

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toHaveTextContent('[maintenance] Second message');
      });
    });
  });

  describe('Workflow: EDIcraft agent complete workflow', () => {
    it('should complete EDIcraft workflow from selection to message', async () => {
      render(<CompleteWorkflowComponent />);

      // Step 1: Select EDIcraft agent from panel
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const edicraftItem = panelSwitcher.querySelector('[data-testid="dropdown-item-edicraft"]');
      fireEvent.click(edicraftItem!);

      // Step 2: Verify EDIcraft landing page displays
      await waitFor(() => {
        expect(screen.getByText(/EDIcraft Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Step 3: Verify Minecraft server info is shown
      expect(screen.getByText(/edicraft.nigelgardiner.com:49000/)).toBeInTheDocument();

      // Step 4: Send EDIcraft message
      const messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Build wellbore trajectory in Minecraft' } });
      fireEvent.click(screen.getByTestId('send-button'));

      // Step 5: Verify message was sent with edicraft agent
      await waitFor(() => {
        const message = screen.getByTestId('message-0');
        expect(message).toHaveTextContent('[edicraft] Build wellbore trajectory in Minecraft');
      });
    });

    it('should handle EDIcraft example workflow selection', async () => {
      render(<CompleteWorkflowComponent />);

      // Select EDIcraft agent
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const edicraftItem = panelSwitcher.querySelector('[data-testid="dropdown-item-edicraft"]');
      fireEvent.click(edicraftItem!);

      await waitFor(() => {
        expect(screen.getByText(/EDIcraft Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click on example workflow (if available)
      const tryLinks = screen.queryAllByText(/Try this workflow/);
      if (tryLinks.length > 0) {
        fireEvent.click(tryLinks[0]);

        // Verify input was populated
        const messageInput = screen.getByTestId('message-input') as HTMLInputElement;
        expect(messageInput.value).not.toBe('');
      }
    });
  });

  describe('Workflow: Agent synchronization across interactions', () => {
    it('should maintain agent selection across multiple interactions', async () => {
      render(<CompleteWorkflowComponent />);

      // Select renewable agent
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const renewableItem = panelSwitcher.querySelector('[data-testid="dropdown-item-renewable"]');
      fireEvent.click(renewableItem!);

      await waitFor(() => {
        expect(screen.getByText(/Renewable Energy Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Send first message
      let messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Analyze terrain' } });
      fireEvent.click(screen.getByTestId('send-button'));

      await waitFor(() => {
        expect(screen.getByTestId('message-0')).toHaveTextContent('[renewable] Analyze terrain');
      });

      // Send second message (agent should still be renewable)
      messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Optimize layout' } });
      fireEvent.click(screen.getByTestId('send-button'));

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toHaveTextContent('[renewable] Optimize layout');
      });

      // Verify landing page still shows renewable
      expect(screen.getByText(/Renewable Energy Agent/)).toBeInTheDocument();
    });

    it('should persist agent selection in sessionStorage throughout workflow', async () => {
      render(<CompleteWorkflowComponent />);

      // Select maintenance agent
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const maintenanceItem = panelSwitcher.querySelector('[data-testid="dropdown-item-maintenance"]');
      fireEvent.click(maintenanceItem!);

      // Verify sessionStorage was updated
      expect(sessionStorage.getItem('selectedAgent')).toBe('maintenance');

      // Interact with landing page
      await waitFor(() => {
        expect(screen.getByText(/Maintenance Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Send message
      const messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Check equipment health' } });
      fireEvent.click(screen.getByTestId('send-button'));

      // Verify sessionStorage still has maintenance
      expect(sessionStorage.getItem('selectedAgent')).toBe('maintenance');
    });
  });

  describe('Workflow: Complete user journey for all agents', () => {
    const agents: { id: AgentType; name: string; message: string }[] = [
      { id: 'auto', name: 'Auto Agent', message: 'Route my query' },
      { id: 'petrophysics', name: 'Petrophysics Agent', message: 'Analyze well logs' },
      { id: 'maintenance', name: 'Maintenance Agent', message: 'Check equipment' },
      { id: 'renewable', name: 'Renewable Energy Agent', message: 'Design wind farm' },
      { id: 'edicraft', name: 'EDIcraft Agent', message: 'Build in Minecraft' }
    ];

    agents.forEach(({ id, name, message }) => {
      it(`should complete full workflow for ${name}`, async () => {
        render(<CompleteWorkflowComponent />);

        // Select agent
        const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
        const agentItem = panelSwitcher.querySelector(`[data-testid="dropdown-item-${id}"]`);
        fireEvent.click(agentItem!);

        // Verify landing page
        await waitFor(() => {
          expect(screen.getByText(new RegExp(name))).toBeInTheDocument();
        }, { timeout: 3000 });

        // Verify visualization
        const visualization = screen.getByTestId('agent-visualization');
        expect(visualization).toHaveAttribute('data-type', id);

        // Send message
        const messageInput = screen.getByTestId('message-input');
        fireEvent.change(messageInput, { target: { value: message } });
        fireEvent.click(screen.getByTestId('send-button'));

        // Verify message sent with correct agent
        await waitFor(() => {
          const sentMessage = screen.getByTestId('message-0');
          expect(sentMessage).toHaveTextContent(`[${id}] ${message}`);
        });

        // Verify sessionStorage
        expect(sessionStorage.getItem('selectedAgent')).toBe(id);
      });
    });
  });

  describe('Workflow: Error handling and edge cases', () => {
    it('should handle rapid agent switching', async () => {
      render(<CompleteWorkflowComponent />);

      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];

      // Rapidly switch between agents
      const petrophysicsItem = panelSwitcher.querySelector('[data-testid="dropdown-item-petrophysics"]');
      fireEvent.click(petrophysicsItem!);

      const maintenanceItem = panelSwitcher.querySelector('[data-testid="dropdown-item-maintenance"]');
      fireEvent.click(maintenanceItem!);

      const renewableItem = panelSwitcher.querySelector('[data-testid="dropdown-item-renewable"]');
      fireEvent.click(renewableItem!);

      // Should end up on renewable
      await waitFor(() => {
        expect(screen.getByText(/Renewable Energy Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(sessionStorage.getItem('selectedAgent')).toBe('renewable');
    });

    it('should handle empty message submission', async () => {
      render(<CompleteWorkflowComponent />);

      // Try to send empty message
      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      // Should not create a message
      expect(screen.queryByTestId('message-0')).not.toBeInTheDocument();
    });

    it('should handle workflow selection callback', async () => {
      render(<CompleteWorkflowComponent />);

      // Select auto agent (has example queries)
      const panelSwitcher = screen.getAllByTestId('button-dropdown')[0];
      const autoItem = panelSwitcher.querySelector('[data-testid="dropdown-item-auto"]');
      fireEvent.click(autoItem!);

      await waitFor(() => {
        expect(screen.getByText(/Auto Agent/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click example query if available
      const tryLinks = screen.queryAllByText(/Try this query/);
      if (tryLinks.length > 0) {
        fireEvent.click(tryLinks[0]);

        // Verify input was populated
        const messageInput = screen.getByTestId('message-input') as HTMLInputElement;
        expect(messageInput.value).not.toBe('');
      }
    });
  });
});
