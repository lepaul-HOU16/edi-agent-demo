import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoAgentLanding from '../agent-landing-pages/AutoAgentLanding';
import PetrophysicsAgentLanding from '../agent-landing-pages/PetrophysicsAgentLanding';
import MaintenanceAgentLanding from '../agent-landing-pages/MaintenanceAgentLanding';
import RenewableAgentLanding from '../agent-landing-pages/RenewableAgentLanding';
import EDIcraftAgentLanding from '../agent-landing-pages/EDIcraftAgentLanding';

// Mock Cloudscape components
jest.mock('@cloudscape-design/components', () => ({
  Container: ({ children, header }: any) => (
    <div data-testid="container">
      {header}
      {children}
    </div>
  ),
  Header: ({ children, variant }: any) => (
    <div data-testid="header" data-variant={variant}>{children}</div>
  ),
  Box: ({ children, variant, ...props }: any) => (
    <div data-testid="box" data-variant={variant}>{children}</div>
  ),
  SpaceBetween: ({ children, direction, size }: any) => (
    <div data-testid="space-between" data-direction={direction} data-size={size}>
      {children}
    </div>
  ),
  Badge: ({ children, color }: any) => (
    <span data-testid="badge" data-color={color}>{children}</span>
  ),
  ColumnLayout: ({ children, columns }: any) => (
    <div data-testid="column-layout" data-columns={columns}>{children}</div>
  ),
  ExpandableSection: ({ children, headerText }: any) => (
    <div data-testid="expandable-section">
      <div data-testid="expandable-header">{headerText}</div>
      {children}
    </div>
  ),
  Cards: ({ items, cardDefinition }: any) => (
    <div data-testid="cards">
      {items.map((item: any, index: number) => (
        <div key={index} data-testid={`card-${index}`}>
          <div data-testid={`card-header-${index}`}>{cardDefinition.header(item)}</div>
          {cardDefinition.sections.map((section: any, sIndex: number) => (
            <div key={sIndex} data-testid={`card-section-${index}-${sIndex}`}>
              {section.content(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  StatusIndicator: ({ children, type }: any) => (
    <span data-testid="status-indicator" data-type={type}>{children}</span>
  ),
}));

// Mock AgentVisualization
jest.mock('../agent-landing-pages/AgentVisualization', () => {
  return function MockAgentVisualization({ type, size }: any) {
    return (
      <div data-testid="agent-visualization" data-type={type} data-size={size}>
        Agent Visualization
      </div>
    );
  };
});

describe('AutoAgentLanding', () => {
  describe('Rendering all sections', () => {
    it('should render header with agent name', () => {
      render(<AutoAgentLanding />);
      expect(screen.getByText('Auto Agent')).toBeInTheDocument();
    });

    it('should render bio section', () => {
      render(<AutoAgentLanding />);
      expect(screen.getByText('Intelligent Query Routing')).toBeInTheDocument();
      expect(screen.getByText(/automatically analyzes your queries/)).toBeInTheDocument();
    });

    it('should render capabilities section', () => {
      render(<AutoAgentLanding />);
      expect(screen.getByText('Core Capabilities')).toBeInTheDocument();
      expect(screen.getByText(/Intent Detection/)).toBeInTheDocument();
      expect(screen.getByText(/Smart Routing/)).toBeInTheDocument();
      expect(screen.getByText(/Multi-Agent Coordination/)).toBeInTheDocument();
      expect(screen.getByText(/Context Awareness/)).toBeInTheDocument();
    });

    it('should render specialized agents list', () => {
      render(<AutoAgentLanding />);
      expect(screen.getByText('Routes to Specialized Agents')).toBeInTheDocument();
      expect(screen.getByText('Petrophysics Agent')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Agent')).toBeInTheDocument();
      expect(screen.getByText('Renewable Energy Agent')).toBeInTheDocument();
      expect(screen.getByText('EDIcraft Agent')).toBeInTheDocument();
    });

    it('should render example queries section', () => {
      render(<AutoAgentLanding />);
      expect(screen.getByText('Example Queries')).toBeInTheDocument();
    });
  });

  describe('Visualization display', () => {
    it('should display AgentVisualization component', () => {
      render(<AutoAgentLanding />);
      const visualization = screen.getByTestId('agent-visualization');
      expect(visualization).toBeInTheDocument();
      expect(visualization).toHaveAttribute('data-type', 'auto');
      expect(visualization).toHaveAttribute('data-size', 'medium');
    });
  });

  describe('onWorkflowSelect callback', () => {
    it('should call onWorkflowSelect when example query is clicked', () => {
      const mockCallback = jest.fn();
      render(<AutoAgentLanding onWorkflowSelect={mockCallback} />);
      
      const links = screen.getAllByText(/Try this query/);
      fireEvent.click(links[0]);
      
      expect(mockCallback).toHaveBeenCalledWith('Analyze well data for WELL-001');
    });

    it('should not error when onWorkflowSelect is not provided', () => {
      render(<AutoAgentLanding />);
      
      const links = screen.getAllByText(/Try this query/);
      expect(() => fireEvent.click(links[0])).not.toThrow();
    });
  });
});

describe('PetrophysicsAgentLanding', () => {
  describe('Rendering all sections', () => {
    it('should render header with agent name', () => {
      render(<PetrophysicsAgentLanding />);
      expect(screen.getByText('Petrophysics Agent')).toBeInTheDocument();
    });

    it('should render bio section', () => {
      render(<PetrophysicsAgentLanding />);
      expect(screen.getByText('Professional Well Log Analysis')).toBeInTheDocument();
      expect(screen.getByText(/specializes in comprehensive petrophysical analysis/)).toBeInTheDocument();
    });

    it('should render capabilities section', () => {
      render(<PetrophysicsAgentLanding />);
      expect(screen.getByText('Key Capabilities')).toBeInTheDocument();
      expect(screen.getByText(/Porosity Calculation/)).toBeInTheDocument();
      expect(screen.getByText(/Shale Volume Analysis/)).toBeInTheDocument();
      expect(screen.getByText(/Multi-Well Correlation/)).toBeInTheDocument();
      expect(screen.getByText(/Data Quality Assessment/)).toBeInTheDocument();
    });

    it('should render example workflows section', () => {
      render(<PetrophysicsAgentLanding />);
      expect(screen.getByText('Example Workflows')).toBeInTheDocument();
    });
  });

  describe('Visualization display', () => {
    it('should display AgentVisualization component', () => {
      render(<PetrophysicsAgentLanding />);
      const visualization = screen.getByTestId('agent-visualization');
      expect(visualization).toBeInTheDocument();
      expect(visualization).toHaveAttribute('data-type', 'petrophysics');
    });
  });

  describe('onWorkflowSelect callback', () => {
    it('should call onWorkflowSelect when example workflow is clicked', () => {
      const mockCallback = jest.fn();
      render(<PetrophysicsAgentLanding onWorkflowSelect={mockCallback} />);
      
      const links = screen.getAllByText(/Try this workflow/);
      if (links.length > 0) {
        fireEvent.click(links[0]);
        expect(mockCallback).toHaveBeenCalled();
      }
    });
  });
});

describe('MaintenanceAgentLanding', () => {
  describe('Rendering all sections', () => {
    it('should render header with agent name', () => {
      render(<MaintenanceAgentLanding />);
      expect(screen.getByText('Maintenance Agent')).toBeInTheDocument();
    });

    it('should render bio section', () => {
      render(<MaintenanceAgentLanding />);
      expect(screen.getByText('Predictive Equipment Maintenance')).toBeInTheDocument();
      expect(screen.getByText(/specializes in equipment health monitoring/)).toBeInTheDocument();
    });

    it('should render capabilities section', () => {
      render(<MaintenanceAgentLanding />);
      expect(screen.getByText('Key Capabilities')).toBeInTheDocument();
      expect(screen.getByText(/Health Assessment/)).toBeInTheDocument();
      expect(screen.getByText(/Failure Prediction/)).toBeInTheDocument();
      expect(screen.getByText(/Maintenance Planning/)).toBeInTheDocument();
      expect(screen.getByText(/Inspection Scheduling/)).toBeInTheDocument();
    });

    it('should render example use cases section', () => {
      render(<MaintenanceAgentLanding />);
      expect(screen.getByText('Example Use Cases')).toBeInTheDocument();
    });
  });

  describe('Visualization display', () => {
    it('should display AgentVisualization component', () => {
      render(<MaintenanceAgentLanding />);
      const visualization = screen.getByTestId('agent-visualization');
      expect(visualization).toBeInTheDocument();
      expect(visualization).toHaveAttribute('data-type', 'maintenance');
    });
  });

  describe('onWorkflowSelect callback', () => {
    it('should call onWorkflowSelect when example use case is clicked', () => {
      const mockCallback = jest.fn();
      render(<MaintenanceAgentLanding onWorkflowSelect={mockCallback} />);
      
      const links = screen.getAllByText(/Try this use case/);
      if (links.length > 0) {
        fireEvent.click(links[0]);
        expect(mockCallback).toHaveBeenCalled();
      }
    });
  });
});

describe('RenewableAgentLanding', () => {
  describe('Rendering all sections', () => {
    it('should render header with agent name', () => {
      render(<RenewableAgentLanding />);
      expect(screen.getByText('Renewable Energy Agent')).toBeInTheDocument();
    });

    it('should render bio section', () => {
      render(<RenewableAgentLanding />);
      expect(screen.getByText('Wind Farm Site Design & Optimization')).toBeInTheDocument();
      expect(screen.getByText(/specializes in renewable energy site analysis/)).toBeInTheDocument();
    });

    it('should render capabilities section', () => {
      render(<RenewableAgentLanding />);
      expect(screen.getByText('Key Capabilities')).toBeInTheDocument();
      expect(screen.getByText(/Terrain Analysis/)).toBeInTheDocument();
      expect(screen.getByText(/Layout Optimization/)).toBeInTheDocument();
      expect(screen.getByText(/Wind Rose Generation/)).toBeInTheDocument();
      expect(screen.getByText(/Energy Production Modeling/)).toBeInTheDocument();
    });

    it('should render example workflows section', () => {
      render(<RenewableAgentLanding />);
      expect(screen.getByText('Example Workflows')).toBeInTheDocument();
    });
  });

  describe('Visualization display', () => {
    it('should display AgentVisualization component', () => {
      render(<RenewableAgentLanding />);
      const visualization = screen.getByTestId('agent-visualization');
      expect(visualization).toBeInTheDocument();
      expect(visualization).toHaveAttribute('data-type', 'renewable');
    });
  });

  describe('onWorkflowSelect callback', () => {
    it('should call onWorkflowSelect when example workflow is clicked', () => {
      const mockCallback = jest.fn();
      render(<RenewableAgentLanding onWorkflowSelect={mockCallback} />);
      
      const links = screen.getAllByText(/Try this workflow/);
      if (links.length > 0) {
        fireEvent.click(links[0]);
        expect(mockCallback).toHaveBeenCalled();
      }
    });
  });
});

describe('EDIcraftAgentLanding', () => {
  describe('Rendering all sections', () => {
    it('should render header with agent name', () => {
      render(<EDIcraftAgentLanding />);
      expect(screen.getByText('EDIcraft Agent')).toBeInTheDocument();
    });

    it('should render bio section', () => {
      render(<EDIcraftAgentLanding />);
      expect(screen.getByText('Minecraft Subsurface Visualization')).toBeInTheDocument();
      expect(screen.getByText(/specializes in visualizing subsurface data/)).toBeInTheDocument();
    });

    it('should render capabilities section', () => {
      render(<EDIcraftAgentLanding />);
      expect(screen.getByText('Key Capabilities')).toBeInTheDocument();
      expect(screen.getByText(/Wellbore Trajectory Visualization/)).toBeInTheDocument();
      expect(screen.getByText(/Horizon Surface Rendering/)).toBeInTheDocument();
      expect(screen.getByText(/OSDU Data Integration/)).toBeInTheDocument();
      expect(screen.getByText(/Real-time 3D Building/)).toBeInTheDocument();
    });

    it('should render Minecraft server connection status', () => {
      render(<EDIcraftAgentLanding />);
      expect(screen.getByText(/Minecraft Server/)).toBeInTheDocument();
      expect(screen.getByText(/edicraft.nigelgardiner.com:49000/)).toBeInTheDocument();
    });

    it('should render example workflows section', () => {
      render(<EDIcraftAgentLanding />);
      expect(screen.getByText('Example Workflows')).toBeInTheDocument();
    });
  });

  describe('Visualization display', () => {
    it('should display AgentVisualization component', () => {
      render(<EDIcraftAgentLanding />);
      const visualization = screen.getByTestId('agent-visualization');
      expect(visualization).toBeInTheDocument();
      expect(visualization).toHaveAttribute('data-type', 'edicraft');
    });
  });

  describe('onWorkflowSelect callback', () => {
    it('should call onWorkflowSelect when example workflow is clicked', () => {
      const mockCallback = jest.fn();
      render(<EDIcraftAgentLanding />);
      
      const links = screen.getAllByText(/Try this workflow/);
      if (links.length > 0) {
        fireEvent.click(links[0]);
        expect(mockCallback).toHaveBeenCalled();
      }
    });
  });
});

describe('All Landing Components - Common Tests', () => {
  const components = [
    { name: 'AutoAgentLanding', Component: AutoAgentLanding },
    { name: 'PetrophysicsAgentLanding', Component: PetrophysicsAgentLanding },
    { name: 'MaintenanceAgentLanding', Component: MaintenanceAgentLanding },
    { name: 'RenewableAgentLanding', Component: RenewableAgentLanding },
    { name: 'EDIcraftAgentLanding', Component: EDIcraftAgentLanding },
  ];

  components.forEach(({ name, Component }) => {
    describe(name, () => {
      it('should render without crashing', () => {
        expect(() => render(<Component />)).not.toThrow();
      });

      it('should render Container component', () => {
        render(<Component />);
        expect(screen.getByTestId('container')).toBeInTheDocument();
      });

      it('should render Header component', () => {
        render(<Component />);
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });

      it('should render AgentVisualization', () => {
        render(<Component />);
        expect(screen.getByTestId('agent-visualization')).toBeInTheDocument();
      });

      it('should have proper ARIA structure', () => {
        const { container } = render(<Component />);
        const sections = container.querySelectorAll('section');
        expect(sections.length).toBeGreaterThan(0);
      });

      it('should render with onWorkflowSelect callback', () => {
        const mockCallback = jest.fn();
        expect(() => render(<Component onWorkflowSelect={mockCallback} />)).not.toThrow();
      });

      it('should render without onWorkflowSelect callback', () => {
        expect(() => render(<Component />)).not.toThrow();
      });
    });
  });
});
