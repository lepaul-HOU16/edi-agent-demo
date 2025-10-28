import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentVisualization from '../agent-landing-pages/AgentVisualization';

describe('AgentVisualization', () => {
  describe('Rendering for each agent type', () => {
    it('should render auto agent visualization', () => {
      render(<AgentVisualization type="auto" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Auto agent visualization showing intelligent routing between specialized agents');
    });

    it('should render petrophysics agent visualization', () => {
      render(<AgentVisualization type="petrophysics" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Petrophysics agent visualization showing well log curves');
    });

    it('should render maintenance agent visualization', () => {
      render(<AgentVisualization type="maintenance" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Maintenance agent visualization showing equipment health monitoring');
    });

    it('should render renewable agent visualization', () => {
      render(<AgentVisualization type="renewable" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Renewable energy agent visualization showing wind farm with turbines');
    });

    it('should render edicraft agent visualization', () => {
      render(<AgentVisualization type="edicraft" />);
      
      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'EDIcraft agent visualization showing Minecraft-style subsurface blocks');
    });
  });

  describe('Size prop (small, medium, large)', () => {
    it('should render with medium size by default', () => {
      const { container } = render(<AgentVisualization type="auto" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '200');
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-medium');
    });

    it('should render with small size when specified', () => {
      const { container } = render(<AgentVisualization type="auto" size="small" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '120');
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-small');
    });

    it('should render with medium size when explicitly specified', () => {
      const { container } = render(<AgentVisualization type="auto" size="medium" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '200');
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-medium');
    });

    it('should render with large size when specified', () => {
      const { container } = render(<AgentVisualization type="auto" size="large" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '300');
      expect(svg).toHaveAttribute('height', '300');
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-large');
    });

    it('should maintain viewBox regardless of size', () => {
      const { container: smallContainer } = render(<AgentVisualization type="auto" size="small" />);
      const { container: mediumContainer } = render(<AgentVisualization type="auto" size="medium" />);
      const { container: largeContainer } = render(<AgentVisualization type="auto" size="large" />);
      
      const smallSvg = smallContainer.querySelector('svg');
      const mediumSvg = mediumContainer.querySelector('svg');
      const largeSvg = largeContainer.querySelector('svg');
      
      expect(smallSvg).toHaveAttribute('viewBox', '0 0 200 200');
      expect(mediumSvg).toHaveAttribute('viewBox', '0 0 200 200');
      expect(largeSvg).toHaveAttribute('viewBox', '0 0 200 200');
    });
  });

  describe('ARIA labels and accessibility', () => {
    it('should have title element for auto agent', () => {
      render(<AgentVisualization type="auto" />);
      
      const title = screen.getByText('Auto Agent Routing Diagram');
      expect(title).toBeInTheDocument();
    });

    it('should have desc element for auto agent', () => {
      render(<AgentVisualization type="auto" />);
      
      const desc = screen.getByText(/Central AI node connected to four specialized agent nodes/);
      expect(desc).toBeInTheDocument();
    });

    it('should have title element for petrophysics agent', () => {
      render(<AgentVisualization type="petrophysics" />);
      
      const title = screen.getByText('Petrophysics Well Log Visualization');
      expect(title).toBeInTheDocument();
    });

    it('should have desc element for petrophysics agent', () => {
      render(<AgentVisualization type="petrophysics" />);
      
      const desc = screen.getByText(/Depth track with gamma ray, resistivity, and porosity log curves/);
      expect(desc).toBeInTheDocument();
    });

    it('should have title element for maintenance agent', () => {
      render(<AgentVisualization type="maintenance" />);
      
      const title = screen.getByText('Maintenance Equipment Health Monitoring');
      expect(title).toBeInTheDocument();
    });

    it('should have desc element for maintenance agent', () => {
      render(<AgentVisualization type="maintenance" />);
      
      const desc = screen.getByText(/Equipment outline with health status indicators/);
      expect(desc).toBeInTheDocument();
    });

    it('should have title element for renewable agent', () => {
      render(<AgentVisualization type="renewable" />);
      
      const title = screen.getByText('Renewable Energy Wind Farm Visualization');
      expect(title).toBeInTheDocument();
    });

    it('should have desc element for renewable agent', () => {
      render(<AgentVisualization type="renewable" />);
      
      const desc = screen.getByText(/Terrain with multiple wind turbines/);
      expect(desc).toBeInTheDocument();
    });

    it('should have title element for edicraft agent', () => {
      render(<AgentVisualization type="edicraft" />);
      
      const title = screen.getByText('EDIcraft Minecraft Subsurface Visualization');
      expect(title).toBeInTheDocument();
    });

    it('should have desc element for edicraft agent', () => {
      render(<AgentVisualization type="edicraft" />);
      
      const desc = screen.getByText(/Pixelated Minecraft blocks showing surface terrain/);
      expect(desc).toBeInTheDocument();
    });

    it('should have role="img" on SVG element', () => {
      render(<AgentVisualization type="auto" />);
      
      const svg = screen.getByRole('img');
      expect(svg.tagName.toLowerCase()).toBe('svg');
    });
  });

  describe('CSS classes', () => {
    it('should have base agent-visualization class', () => {
      const { container } = render(<AgentVisualization type="auto" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toBeInTheDocument();
    });

    it('should have agent-type-specific class for auto', () => {
      const { container } = render(<AgentVisualization type="auto" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-auto');
    });

    it('should have agent-type-specific class for petrophysics', () => {
      const { container } = render(<AgentVisualization type="petrophysics" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-petrophysics');
    });

    it('should have agent-type-specific class for maintenance', () => {
      const { container } = render(<AgentVisualization type="maintenance" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-maintenance');
    });

    it('should have agent-type-specific class for renewable', () => {
      const { container } = render(<AgentVisualization type="renewable" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-renewable');
    });

    it('should have agent-type-specific class for edicraft', () => {
      const { container } = render(<AgentVisualization type="edicraft" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-edicraft');
    });

    it('should have size-specific class', () => {
      const { container } = render(<AgentVisualization type="auto" size="large" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-large');
    });

    it('should have all three classes combined', () => {
      const { container } = render(<AgentVisualization type="maintenance" size="small" />);
      
      const visualizationDiv = container.querySelector('.agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization');
      expect(visualizationDiv).toHaveClass('agent-visualization-maintenance');
      expect(visualizationDiv).toHaveClass('agent-visualization-small');
    });
  });

  describe('Component memoization', () => {
    it('should have displayName set for debugging', () => {
      expect(AgentVisualization.displayName).toBe('AgentVisualization');
    });
  });
});
