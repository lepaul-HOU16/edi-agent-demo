/**
 * Chain of Thought Display Tests
 * Tests SimplifiedThoughtStep component for step expansion/collapse,
 * status indicators, timing display, error handling, and clean appearance
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import SimplifiedThoughtStep, { SimplifiedThoughtStepList, ThoughtStep } from '../../src/components/SimplifiedThoughtStep';

// Mock Cloudscape components
jest.mock('@cloudscape-design/components', () => ({
  ExpandableSection: ({ children, headerText, expanded, onChange, variant }: any) => (
    <div data-testid="expandable-section" data-expanded={expanded} data-variant={variant}>
      <div data-testid="header" onClick={() => onChange?.({ detail: { expanded: !expanded } })}>
        {headerText}
      </div>
      {expanded && <div data-testid="content">{children}</div>}
    </div>
  ),
  StatusIndicator: ({ children, type }: any) => (
    <span data-testid="status-indicator" data-type={type}>
      {children}
    </span>
  ),
  Box: ({ children, variant, color, ...props }: any) => (
    <div data-testid="box" data-variant={variant} data-color={color} {...props}>
      {children}
    </div>
  ),
  SpaceBetween: ({ children, direction, size }: any) => (
    <div data-testid="space-between" data-direction={direction} data-size={size}>
      {children}
    </div>
  ),
  Spinner: ({ size }: any) => (
    <div data-testid="spinner" data-size={size}>
      Loading...
    </div>
  ),
  Alert: ({ children, type, header }: any) => (
    <div data-testid="alert" data-type={type}>
      <div data-testid="alert-header">{header}</div>
      <div data-testid="alert-content">{children}</div>
    </div>
  ),
}));

describe('SimplifiedThoughtStep Component', () => {
  describe('Complete Step Display', () => {
    const completeStep: ThoughtStep = {
      step: 1,
      action: 'Intent Detection',
      reasoning: 'Analyzing query to determine intent',
      result: 'Detected wake_simulation intent (95% confidence)',
      status: 'complete',
      duration: 125,
      timestamp: '2025-01-16T10:30:00Z'
    };

    it('should render complete step with success indicator', () => {
      render(<SimplifiedThoughtStep step={completeStep} />);
      
      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toHaveAttribute('data-type', 'success');
      expect(screen.getByText(/1\. Intent Detection/)).toBeInTheDocument();
    });

    it('should display duration in milliseconds', () => {
      render(<SimplifiedThoughtStep step={completeStep} />);
      
      expect(screen.getByText('125ms')).toBeInTheDocument();
    });

    it('should be collapsed by default for complete steps', () => {
      render(<SimplifiedThoughtStep step={completeStep} />);
      
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-expanded', 'false');
    });

    it('should expand when clicked', () => {
      render(<SimplifiedThoughtStep step={completeStep} />);
      
      const header = screen.getByTestId('header');
      fireEvent.click(header);
      
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-expanded', 'true');
    });

    it('should show reasoning and result when expanded', () => {
      render(<SimplifiedThoughtStep step={completeStep} />);
      
      const header = screen.getByTestId('header');
      fireEvent.click(header);
      
      expect(screen.getByText('Action:')).toBeInTheDocument();
      expect(screen.getByText('Analyzing query to determine intent')).toBeInTheDocument();
      expect(screen.getByText('Result:')).toBeInTheDocument();
      expect(screen.getByText('Detected wake_simulation intent (95% confidence)')).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(<SimplifiedThoughtStep step={completeStep} />);
      
      const header = screen.getByTestId('header');
      
      // Expand
      fireEvent.click(header);
      expect(screen.getByTestId('expandable-section')).toHaveAttribute('data-expanded', 'true');
      
      // Collapse
      fireEvent.click(header);
      expect(screen.getByTestId('expandable-section')).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('In-Progress Step Display', () => {
    const inProgressStep: ThoughtStep = {
      step: 2,
      action: 'Calling Tool Lambda',
      reasoning: 'Invoking wake simulation Lambda function',
      status: 'in_progress',
      timestamp: '2025-01-16T10:30:01Z'
    };

    it('should render in-progress step with spinner', () => {
      render(<SimplifiedThoughtStep step={inProgressStep} />);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText(/2\. Calling Tool Lambda/)).toBeInTheDocument();
    });

    it('should be expanded by default for in-progress steps', () => {
      render(<SimplifiedThoughtStep step={inProgressStep} />);
      
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-expanded', 'true');
    });

    it('should show reasoning when provided', () => {
      render(<SimplifiedThoughtStep step={inProgressStep} />);
      
      expect(screen.getByText('Invoking wake simulation Lambda function')).toBeInTheDocument();
    });

    it('should not show duration for in-progress steps', () => {
      render(<SimplifiedThoughtStep step={inProgressStep} />);
      
      expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
    });

    it('should not be collapsible', () => {
      render(<SimplifiedThoughtStep step={inProgressStep} />);
      
      const header = screen.getByTestId('header');
      fireEvent.click(header);
      
      // Should remain expanded
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-expanded', 'true');
    });
  });

  describe('Error Step Display', () => {
    const errorStep: ThoughtStep = {
      step: 3,
      action: 'Parameter Validation',
      result: 'Validation failed',
      status: 'error',
      duration: 45,
      timestamp: '2025-01-16T10:30:02Z',
      error: {
        message: 'Missing required parameter: latitude',
        suggestion: 'Provide coordinates or project name'
      }
    };

    it('should render error step with error indicator', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      const statusIndicator = screen.getByTestId('status-indicator');
      expect(statusIndicator).toHaveAttribute('data-type', 'error');
      expect(screen.getByText(/3\. Parameter Validation/)).toBeInTheDocument();
    });

    it('should display duration for error steps', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      expect(screen.getByText('45ms')).toBeInTheDocument();
    });

    it('should be expanded by default for error steps', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-expanded', 'true');
    });

    it('should show error alert with message', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-type', 'error');
      expect(screen.getByTestId('alert-header')).toHaveTextContent('Missing required parameter: latitude');
    });

    it('should show error suggestion when provided', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      expect(screen.getByText('Suggestion:')).toBeInTheDocument();
      expect(screen.getByText('Provide coordinates or project name')).toBeInTheDocument();
    });

    it('should show error details when provided', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      expect(screen.getByText('Details:')).toBeInTheDocument();
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });

    it('should not be collapsible', () => {
      render(<SimplifiedThoughtStep step={errorStep} />);
      
      const header = screen.getByTestId('header');
      fireEvent.click(header);
      
      // Should remain expanded
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-expanded', 'true');
    });
  });

  describe('Status Indicators', () => {
    it('should show success indicator for complete steps', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveAttribute('data-type', 'success');
    });

    it('should show spinner for in-progress steps', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'in_progress',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show error indicator for error steps', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'error',
        timestamp: '2025-01-16T10:30:00Z',
        error: { message: 'Test error' }
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveAttribute('data-type', 'error');
    });
  });

  describe('Timing Display', () => {
    it('should format duration correctly', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        duration: 1234,
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.getByText('1234ms')).toBeInTheDocument();
    });

    it('should not show duration when not provided', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
    });

    it('should show duration for complete steps', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        duration: 500,
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.getByText('500ms')).toBeInTheDocument();
    });

    it('should show duration for error steps', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'error',
        duration: 250,
        timestamp: '2025-01-16T10:30:00Z',
        error: { message: 'Test error' }
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.getByText('250ms')).toBeInTheDocument();
    });
  });

  describe('Clean Minimal Appearance', () => {
    it('should use Cloudscape container variant', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      const expandableSection = screen.getByTestId('expandable-section');
      expect(expandableSection).toHaveAttribute('data-variant', 'container');
    });

    it('should use SpaceBetween for layout', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.getAllByTestId('space-between').length).toBeGreaterThan(0);
    });

    it('should not have complex animations or effects', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      const { container } = render(<SimplifiedThoughtStep step={step} />);
      
      // Should not have gradient, pulsing, or complex styling
      expect(container.innerHTML).not.toContain('gradient');
      expect(container.innerHTML).not.toContain('pulse');
      expect(container.innerHTML).not.toContain('animation');
    });
  });

  describe('SimplifiedThoughtStepList Component', () => {
    const steps: ThoughtStep[] = [
      {
        step: 1,
        action: 'Intent Detection',
        status: 'complete',
        duration: 125,
        timestamp: '2025-01-16T10:30:00Z'
      },
      {
        step: 2,
        action: 'Calling Tool Lambda',
        status: 'in_progress',
        timestamp: '2025-01-16T10:30:01Z'
      },
      {
        step: 3,
        action: 'Parameter Validation',
        status: 'error',
        duration: 45,
        timestamp: '2025-01-16T10:30:02Z',
        error: { message: 'Validation failed' }
      }
    ];

    it('should render multiple steps', () => {
      render(<SimplifiedThoughtStepList steps={steps} />);
      
      expect(screen.getByText(/1\. Intent Detection/)).toBeInTheDocument();
      expect(screen.getByText(/2\. Calling Tool Lambda/)).toBeInTheDocument();
      expect(screen.getByText(/3\. Parameter Validation/)).toBeInTheDocument();
    });

    it('should render steps in order', () => {
      render(<SimplifiedThoughtStepList steps={steps} />);
      
      const expandableSections = screen.getAllByTestId('expandable-section');
      expect(expandableSections).toHaveLength(3);
    });

    it('should handle empty steps array', () => {
      render(<SimplifiedThoughtStepList steps={[]} />);
      
      expect(screen.queryByTestId('expandable-section')).not.toBeInTheDocument();
    });

    it('should render with proper spacing', () => {
      render(<SimplifiedThoughtStepList steps={steps} />);
      
      const spaceBetween = screen.getAllByTestId('space-between')[0];
      expect(spaceBetween).toHaveAttribute('data-size', 's');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle step without reasoning', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      const header = screen.getByTestId('header');
      fireEvent.click(header);
      
      expect(screen.queryByText('Action:')).not.toBeInTheDocument();
    });

    it('should handle step without result', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      const header = screen.getByTestId('header');
      fireEvent.click(header);
      
      expect(screen.queryByText('Result:')).not.toBeInTheDocument();
    });

    it('should handle error without suggestion', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'error',
        timestamp: '2025-01-16T10:30:00Z',
        error: { message: 'Test error' }
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.queryByText('Suggestion:')).not.toBeInTheDocument();
    });

    it('should handle error without message', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'error',
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.getByTestId('alert-header')).toHaveTextContent('An error occurred');
    });

    it('should handle zero duration', () => {
      const step: ThoughtStep = {
        step: 1,
        action: 'Test Action',
        status: 'complete',
        duration: 0,
        timestamp: '2025-01-16T10:30:00Z'
      };
      
      render(<SimplifiedThoughtStep step={step} />);
      
      expect(screen.queryByText('0ms')).not.toBeInTheDocument();
    });
  });
});
