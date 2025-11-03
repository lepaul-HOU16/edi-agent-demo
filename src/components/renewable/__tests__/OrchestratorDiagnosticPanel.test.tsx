/**
 * Tests for OrchestratorDiagnosticPanel Component
 * 
 * Requirements: 6.1, 6.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrchestratorDiagnosticPanel } from '../OrchestratorDiagnosticPanel';

// Mock Cloudscape components to avoid ES module issues
jest.mock('@cloudscape-design/components', () => ({
  Container: ({ children, header }: any) => (
    <div data-testid="container">
      {header}
      {children}
    </div>
  ),
  Header: ({ children, description, actions }: any) => (
    <div data-testid="header">
      <h2>{children}</h2>
      {description && <p>{description}</p>}
      {actions}
    </div>
  ),
  Button: ({ children, onClick, disabled, iconName, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-icon={iconName}>
      {children}
    </button>
  ),
  SpaceBetween: ({ children, direction, size }: any) => (
    <div data-testid="space-between" data-direction={direction} data-size={size}>
      {children}
    </div>
  ),
  Table: ({ columnDefinitions, items, empty }: any) => (
    <div data-testid="table">
      {items && items.length > 0 ? (
        <table>
          <thead>
            <tr>
              {columnDefinitions.map((col: any) => (
                <th key={col.id}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                {columnDefinitions.map((col: any) => (
                  <td key={col.id}>{col.cell(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        empty
      )}
    </div>
  ),
  Box: ({ children, variant, color, padding, textAlign }: any) => (
    <div data-testid="box" data-variant={variant} data-color={color}>
      {children}
    </div>
  ),
  StatusIndicator: ({ children, type }: any) => (
    <span data-testid="status-indicator" data-type={type}>
      {children}
    </span>
  ),
  Alert: ({ children, type, header }: any) => (
    <div data-testid="alert" data-type={type}>
      {header && <strong>{header}</strong>}
      {children}
    </div>
  ),
  ExpandableSection: ({ children, headerText, variant }: any) => (
    <details data-testid="expandable-section" data-variant={variant}>
      <summary>{headerText}</summary>
      {children}
    </details>
  ),
  Link: ({ children, href, external, target }: any) => (
    <a href={href} target={target} data-external={external}>
      {children}
    </a>
  ),
  Badge: ({ children, color }: any) => (
    <span data-testid="badge" data-color={color}>
      {children}
    </span>
  ),
  ColumnLayout: ({ children, columns, variant }: any) => (
    <div data-testid="column-layout" data-columns={columns} data-variant={variant}>
      {children}
    </div>
  ),
  Spinner: ({ size }: any) => <div data-testid="spinner" data-size={size}>Loading...</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('OrchestratorDiagnosticPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Panel Rendering', () => {
    it('should render the diagnostic panel correctly', () => {
      render(<OrchestratorDiagnosticPanel />);

      // Check header
      expect(screen.getByText('Orchestrator Diagnostics')).toBeInTheDocument();
      
      // Check description
      expect(screen.getByText(/Run diagnostics to verify the renewable energy orchestrator/)).toBeInTheDocument();
      
      // Check buttons
      expect(screen.getByText('Quick Check')).toBeInTheDocument();
      expect(screen.getByText('Run Full Diagnostics')).toBeInTheDocument();
      
      // Check initial state message
      expect(screen.getByText(/Click "Run Full Diagnostics" to check the orchestrator health/)).toBeInTheDocument();
    });

    it('should render in compact mode when specified', () => {
      const { container } = render(<OrchestratorDiagnosticPanel compact={true} />);
      
      // Component should still render with all essential elements
      expect(screen.getByText('Orchestrator Diagnostics')).toBeInTheDocument();
      expect(screen.getByText('Quick Check')).toBeInTheDocument();
      expect(screen.getByText('Run Full Diagnostics')).toBeInTheDocument();
    });
  });

  describe('Run Diagnostics Button', () => {
    it('should trigger API call when Run Full Diagnostics button is clicked', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [],
        summary: { total: 0, passed: 0, failed: 0, totalDuration: 0 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      const runButton = screen.getByText('Run Full Diagnostics');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/renewable/diagnostics',
          expect.objectContaining({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should trigger quick diagnostics when Quick Check button is clicked', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'quick',
        results: [],
        summary: { total: 0, passed: 0, failed: 0, totalDuration: 0 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      const quickButton = screen.getByText('Quick Check');
      fireEvent.click(quickButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/renewable/diagnostics?quick=true',
          expect.objectContaining({
            method: 'GET',
          })
        );
      });
    });

    it('should show loading state while diagnostics are running', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<OrchestratorDiagnosticPanel />);

      const runButton = screen.getByText('Run Full Diagnostics');
      fireEvent.click(runButton);

      // Should show loading spinner
      await waitFor(() => {
        expect(screen.getByText('Running diagnostics...')).toBeInTheDocument();
      });

      // Buttons should be disabled
      expect(screen.getByText('Quick Check')).toBeDisabled();
      expect(screen.getByText('Run Full Diagnostics')).toBeDisabled();
    });

    it('should call onDiagnosticsComplete callback when provided', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [],
        summary: { total: 0, passed: 0, failed: 0, totalDuration: 0 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const onComplete = jest.fn();
      render(<OrchestratorDiagnosticPanel onDiagnosticsComplete={onComplete} />);

      const runButton = screen.getByText('Run Full Diagnostics');
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockResponse);
      });
    });
  });

  describe('Diagnostic Results Display', () => {
    it('should display diagnostic results in table format', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          {
            step: 'Check Environment Variables',
            success: true,
            details: 'All environment variables are set',
            duration: 10,
          },
          {
            step: 'Check Orchestrator Exists',
            success: true,
            details: 'Orchestrator Lambda found',
            duration: 150,
          },
        ],
        summary: { total: 2, passed: 2, failed: 0, totalDuration: 160 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: ['All systems operational'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      const runButton = screen.getByText('Run Full Diagnostics');
      fireEvent.click(runButton);

      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Diagnostic Check')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
        
        // Check result rows
        expect(screen.getByText('Check Environment Variables')).toBeInTheDocument();
        expect(screen.getByText('Check Orchestrator Exists')).toBeInTheDocument();
      });
    });

    it('should display summary statistics', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [],
        summary: { total: 3, passed: 2, failed: 1, totalDuration: 500 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        expect(screen.getByText('Total Checks')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Passed')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Success/Failure Status Indicators', () => {
    it('should show success status indicator for passed checks', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          {
            step: 'Test Check',
            success: true,
            details: 'Check passed',
            duration: 10,
          },
        ],
        summary: { total: 1, passed: 1, failed: 0, totalDuration: 10 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        // Should show "Healthy" overall status
        expect(screen.getByText('Healthy')).toBeInTheDocument();
        // Should show the test check in the table
        expect(screen.getByText('Test Check')).toBeInTheDocument();
        // Should show "Check passed" in details
        expect(screen.getByText('Check passed')).toBeInTheDocument();
      });
    });

    it('should show failure status indicator for failed checks', async () => {
      const mockResponse = {
        status: 'unhealthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          {
            step: 'Test Check',
            success: false,
            details: {},
            error: 'Check failed',
            duration: 10,
            recommendations: ['Fix the issue'],
          },
        ],
        summary: { total: 1, passed: 0, failed: 1, totalDuration: 10 },
        cloudWatchLinks: {},
        recommendations: ['Fix the issue'],
        nextSteps: ['Review errors'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        // Should show "Unhealthy" overall status
        expect(screen.getByText('Unhealthy')).toBeInTheDocument();
        // Should show error in details
        expect(screen.getByText('Check failed')).toBeInTheDocument();
      });
    });

    it('should show degraded status indicator when some checks fail', async () => {
      const mockResponse = {
        status: 'degraded',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          { step: 'Check 1', success: true, details: 'OK', duration: 10 },
          { step: 'Check 2', success: false, details: {}, error: 'Failed', duration: 10 },
        ],
        summary: { total: 2, passed: 1, failed: 1, totalDuration: 20 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        expect(screen.getByText('Degraded')).toBeInTheDocument();
      });
    });
  });

  describe('Remediation Steps Display', () => {
    it('should display remediation steps for failures', async () => {
      const mockResponse = {
        status: 'unhealthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          {
            step: 'Failed Check',
            success: false,
            details: {},
            error: 'Something went wrong',
            recommendations: [
              'Step 1: Check configuration',
              'Step 2: Verify deployment',
            ],
          },
        ],
        summary: { total: 1, passed: 0, failed: 1, totalDuration: 10 },
        cloudWatchLinks: {},
        recommendations: [
          'Run: npx ampx sandbox',
          'Check CloudWatch logs',
        ],
        nextSteps: [
          '1. Fix environment variables',
          '2. Redeploy the function',
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        // Should show recommendations alert
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
        expect(screen.getByText(/Run: npx ampx sandbox/)).toBeInTheDocument();
        
        // Should show next steps alert
        expect(screen.getByText('Next Steps')).toBeInTheDocument();
        expect(screen.getByText(/1. Fix environment variables/)).toBeInTheDocument();
      });
    });

    it('should not display remediation section when no recommendations', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          { step: 'Check', success: true, details: 'OK', duration: 10 },
        ],
        summary: { total: 1, passed: 1, failed: 0, totalDuration: 10 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: ['All systems operational'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        // Should not show recommendations alert
        expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
      });
    });
  });

  describe('CloudWatch Log Links', () => {
    it('should display CloudWatch log links when available', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [],
        summary: { total: 0, passed: 0, failed: 0, totalDuration: 0 },
        cloudWatchLinks: {
          orchestrator: 'https://console.aws.amazon.com/cloudwatch/orchestrator',
          terrainTool: 'https://console.aws.amazon.com/cloudwatch/terrain',
        },
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        expect(screen.getByText('CloudWatch Log Links')).toBeInTheDocument();
        
        // Check for log links
        const orchestratorLink = screen.getByText('Orchestrator Logs');
        expect(orchestratorLink).toBeInTheDocument();
        expect(orchestratorLink.closest('a')).toHaveAttribute(
          'href',
          'https://console.aws.amazon.com/cloudwatch/orchestrator'
        );
        
        const terrainLink = screen.getByText('TerrainTool Logs');
        expect(terrainLink).toBeInTheDocument();
      });
    });

    it('should not display CloudWatch section when no links available', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [],
        summary: { total: 0, passed: 0, failed: 0, totalDuration: 0 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        expect(screen.queryByText('CloudWatch Log Links')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        expect(screen.getByText('Diagnostic Error')).toBeInTheDocument();
        expect(screen.getByText(/Failed to run diagnostics: Network error/)).toBeInTheDocument();
      });
    });

    it('should display authentication error when unauthorized', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        expect(screen.getByText(/Authentication required. Please sign in to run diagnostics./)).toBeInTheDocument();
      });
    });

    it('should handle error response from API', async () => {
      const mockErrorResponse = {
        status: 'error',
        error: 'Diagnostics service failed',
        message: 'Internal server error',
        timestamp: '2024-01-01T00:00:00Z',
        recommendations: ['Check AWS credentials'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        // Should display the error response
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });
  });

  describe('Duration Formatting', () => {
    it('should format durations correctly', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        region: 'us-west-2',
        diagnosticType: 'full',
        results: [
          { step: 'Fast Check', success: true, details: 'OK', duration: 50 },
          { step: 'Slow Check', success: true, details: 'OK', duration: 1500 },
        ],
        summary: { total: 2, passed: 2, failed: 0, totalDuration: 1550 },
        cloudWatchLinks: {},
        recommendations: [],
        nextSteps: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<OrchestratorDiagnosticPanel />);

      fireEvent.click(screen.getByText('Run Full Diagnostics'));

      await waitFor(() => {
        // Should show milliseconds for fast check
        expect(screen.getByText('50ms')).toBeInTheDocument();
        // Should show seconds for slow check
        expect(screen.getByText('1.50s')).toBeInTheDocument();
      });
    });
  });
});
