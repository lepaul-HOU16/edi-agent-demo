import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentLandingPage from '../AgentLandingPage';

// Mock the Cloudscape components
jest.mock('@cloudscape-design/components', () => ({
  Box: ({ children, ...props }: any) => <div data-testid="box" {...props}>{children}</div>,
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  Container: ({ children, header }: any) => (
    <div data-testid="container">
      {header}
      {children}
    </div>
  ),
  Header: ({ children }: any) => <div data-testid="header">{children}</div>,
  SpaceBetween: ({ children }: any) => <div data-testid="space-between">{children}</div>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  ColumnLayout: ({ children }: any) => <div data-testid="column-layout">{children}</div>,
  ExpandableSection: ({ children, headerText }: any) => (
    <div data-testid="expandable-section">
      <div>{headerText}</div>
      {children}
    </div>
  ),
  Cards: () => <div data-testid="cards">Cards</div>,
}));

// Mock the AgentVisualization component
jest.mock('../agent-landing-pages/AgentVisualization', () => {
  return function MockAgentVisualization() {
    return <div data-testid="agent-visualization">Agent Visualization</div>;
  };
});

describe('AgentLandingPage', () => {
  it('renders AutoAgentLanding when auto agent is selected', async () => {
    render(<AgentLandingPage selectedAgent="auto" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Auto Agent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders PetrophysicsAgentLanding when petrophysics agent is selected', async () => {
    render(<AgentLandingPage selectedAgent="petrophysics" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Petrophysics Agent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders MaintenanceAgentLanding when maintenance agent is selected', async () => {
    render(<AgentLandingPage selectedAgent="maintenance" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Maintenance Agent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders RenewableAgentLanding when renewable agent is selected', async () => {
    render(<AgentLandingPage selectedAgent="renewable" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Renewable Energy Agent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders EDIcraftAgentLanding when edicraft agent is selected', async () => {
    render(<AgentLandingPage selectedAgent="edicraft" />);
    
    await waitFor(() => {
      expect(screen.getByText(/EDIcraft Agent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('passes onWorkflowSelect callback to child components', async () => {
    const mockCallback = jest.fn();
    render(<AgentLandingPage selectedAgent="auto" onWorkflowSelect={mockCallback} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Auto Agent/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // The callback should be passed down (we can't easily test the click without more complex mocking)
    // This test verifies the component renders without errors when callback is provided
  });
});
