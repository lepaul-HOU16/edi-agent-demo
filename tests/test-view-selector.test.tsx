/**
 * View Selector Component Tests
 * 
 * Tests for the ViewSelector component functionality:
 * - Dropdown rendering with consolidated view default
 * - Wells grouped by status (Critical, Degraded, Operational)
 * - Search/filter functionality
 * - Health score badges
 * - Keyboard navigation support
 * - View switching behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ViewSelector } from '../src/components/maintenance/ViewSelector';

// Mock well data
const mockWells = [
  // Critical wells
  {
    id: 'WELL-003',
    name: 'Production Well Charlie',
    healthScore: 45,
    status: 'critical' as const,
    alertCount: 5,
    criticalAlertCount: 3,
    lastMaintenance: '2024-12-01',
    nextMaintenance: '2025-01-15',
    location: 'Field A - Sector 1',
    keyMetrics: { temperature: 185, pressure: 3200, flowRate: 450 }
  },
  {
    id: 'WELL-012',
    name: 'Production Well Lima',
    healthScore: 52,
    status: 'critical' as const,
    alertCount: 4,
    criticalAlertCount: 2,
    lastMaintenance: '2024-11-28',
    nextMaintenance: '2025-01-20',
    location: 'Field B - Sector 2',
    keyMetrics: { temperature: 190, pressure: 3100, flowRate: 420 }
  },
  // Degraded wells
  {
    id: 'WELL-007',
    name: 'Production Well Golf',
    healthScore: 68,
    status: 'degraded' as const,
    alertCount: 2,
    criticalAlertCount: 0,
    lastMaintenance: '2024-12-10',
    nextMaintenance: '2025-02-01',
    location: 'Field A - Sector 2',
    keyMetrics: { temperature: 175, pressure: 2900, flowRate: 520 }
  },
  {
    id: 'WELL-015',
    name: 'Production Well Oscar',
    healthScore: 72,
    status: 'degraded' as const,
    alertCount: 1,
    criticalAlertCount: 0,
    lastMaintenance: '2024-12-05',
    nextMaintenance: '2025-01-25',
    location: 'Field C - Sector 1',
    keyMetrics: { temperature: 170, pressure: 2850, flowRate: 540 }
  },
  // Operational wells
  {
    id: 'WELL-001',
    name: 'Production Well Alpha',
    healthScore: 92,
    status: 'operational' as const,
    alertCount: 0,
    criticalAlertCount: 0,
    lastMaintenance: '2024-12-15',
    nextMaintenance: '2025-03-15',
    location: 'Field A - Sector 1',
    keyMetrics: { temperature: 165, pressure: 2800, flowRate: 580 }
  },
  {
    id: 'WELL-002',
    name: 'Production Well Bravo',
    healthScore: 88,
    status: 'operational' as const,
    alertCount: 0,
    criticalAlertCount: 0,
    lastMaintenance: '2024-12-12',
    nextMaintenance: '2025-03-10',
    location: 'Field A - Sector 1',
    keyMetrics: { temperature: 168, pressure: 2820, flowRate: 570 }
  },
  // Offline well
  {
    id: 'WELL-020',
    name: 'Production Well Tango',
    healthScore: 0,
    status: 'offline' as const,
    alertCount: 0,
    criticalAlertCount: 0,
    lastMaintenance: '2024-10-01',
    nextMaintenance: '2025-01-01',
    location: 'Field D - Sector 3',
    keyMetrics: {}
  }
];

describe('ViewSelector Component', () => {
  let mockOnViewChange: jest.Mock;

  beforeEach(() => {
    mockOnViewChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders with consolidated view as default', () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByLabelText(/select view mode/i)).toBeInTheDocument();
      expect(screen.getByText(/consolidated view/i)).toBeInTheDocument();
    });

    test('renders search input', () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByPlaceholderText(/search wells/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/search wells by id, name, or location/i)).toBeInTheDocument();
    });

    test('renders status summary badges', () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByText(/2 critical/i)).toBeInTheDocument();
      expect(screen.getByText(/2 degraded/i)).toBeInTheDocument();
      expect(screen.getByText(/2 operational/i)).toBeInTheDocument();
      expect(screen.getByText(/1 offline/i)).toBeInTheDocument();
    });

    test('renders keyboard shortcuts hint', () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
    });
  });

  describe('Wells Grouping', () => {
    test('groups wells by status in correct order', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        // Check that critical wells appear first
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Find indices of group headers
        const criticalIndex = optionTexts.findIndex(text => text?.includes('CRITICAL WELLS'));
        const degradedIndex = optionTexts.findIndex(text => text?.includes('DEGRADED WELLS'));
        const operationalIndex = optionTexts.findIndex(text => text?.includes('OPERATIONAL WELLS'));

        // Verify order: Critical < Degraded < Operational
        expect(criticalIndex).toBeLessThan(degradedIndex);
        expect(degradedIndex).toBeLessThan(operationalIndex);
      });
    });

    test('sorts critical wells by health score (lowest first)', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Find critical wells
        const well003Index = optionTexts.findIndex(text => text?.includes('WELL-003'));
        const well012Index = optionTexts.findIndex(text => text?.includes('WELL-012'));

        // WELL-003 (health: 45) should come before WELL-012 (health: 52)
        expect(well003Index).toBeLessThan(well012Index);
      });
    });

    test('sorts operational wells by health score (highest first)', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Find operational wells
        const well001Index = optionTexts.findIndex(text => text?.includes('WELL-001'));
        const well002Index = optionTexts.findIndex(text => text?.includes('WELL-002'));

        // WELL-001 (health: 92) should come before WELL-002 (health: 88)
        expect(well001Index).toBeLessThan(well002Index);
      });
    });
  });

  describe('Search/Filter Functionality', () => {
    test('filters wells by ID', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search wells/i);
      await user.type(searchInput, 'WELL-003');

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Should show WELL-003
        expect(optionTexts.some(text => text?.includes('WELL-003'))).toBe(true);
        // Should not show other wells
        expect(optionTexts.some(text => text?.includes('WELL-001'))).toBe(false);
      });
    });

    test('filters wells by name', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search wells/i);
      await user.type(searchInput, 'Alpha');

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Should show Production Well Alpha
        expect(optionTexts.some(text => text?.includes('Alpha'))).toBe(true);
      });
    });

    test('filters wells by location', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search wells/i);
      await user.type(searchInput, 'Field A');

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Should show wells from Field A
        expect(optionTexts.some(text => text?.includes('WELL-001'))).toBe(true);
        expect(optionTexts.some(text => text?.includes('WELL-003'))).toBe(true);
        // Should not show wells from other fields
        expect(optionTexts.some(text => text?.includes('WELL-012'))).toBe(false);
      });
    });

    test('shows "No results" message when search returns nothing', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Type in search that won't match
      const searchInput = screen.getByPlaceholderText(/search wells/i);
      await user.type(searchInput, 'NONEXISTENT');

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        const options = container.querySelectorAll('[role="option"]');
        const optionTexts = Array.from(options).map(opt => opt.textContent);

        // Should show "No wells found"
        expect(optionTexts.some(text => text?.includes('No wells found'))).toBe(true);
      });
    });

    test('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search wells/i) as HTMLInputElement;
      await user.type(searchInput, 'WELL-003');
      expect(searchInput.value).toBe('WELL-003');

      // Clear search
      const clearButton = screen.getByLabelText(/clear search/i);
      await user.click(clearButton);

      expect(searchInput.value).toBe('');
    });
  });

  describe('View Switching', () => {
    test('calls onViewChange with "consolidated" when consolidated view is selected', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="WELL-001"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        // Click consolidated view option
        const consolidatedOption = screen.getByText(/consolidated view \(all wells\)/i);
        fireEvent.click(consolidatedOption);
      });

      expect(mockOnViewChange).toHaveBeenCalledWith('consolidated');
    });

    test('calls onViewChange with "individual" and wellId when well is selected', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        // Click a well option
        const wellOption = screen.getByText(/production well alpha/i);
        fireEvent.click(wellOption);
      });

      expect(mockOnViewChange).toHaveBeenCalledWith('individual', 'WELL-001');
    });

    test('does not call onViewChange for disabled options', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        // Try to click a header (disabled option)
        const header = screen.getByText(/critical wells/i);
        fireEvent.click(header);
      });

      // Should not have been called
      expect(mockOnViewChange).not.toHaveBeenCalled();
    });
  });

  describe('Health Score Badges', () => {
    test('displays health score for each well', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        // Check that health scores are displayed
        expect(screen.getByText(/health: 92\/100/i)).toBeInTheDocument();
        expect(screen.getByText(/health: 45\/100/i)).toBeInTheDocument();
      });
    });

    test('displays critical alert count when present', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      await waitFor(() => {
        // Check that alert counts are displayed for wells with alerts
        expect(screen.getByText(/3 alerts/i)).toBeInTheDocument();
        expect(screen.getByText(/2 alerts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports Escape key to clear search', async () => {
      const user = userEvent.setup();
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search wells/i) as HTMLInputElement;
      await user.type(searchInput, 'WELL-003');
      expect(searchInput.value).toBe('WELL-003');

      // Focus the select
      const select = screen.getByLabelText(/select view mode/i);
      select.focus();

      // Press Escape
      fireEvent.keyDown(select, { key: 'Escape', code: 'Escape' });

      // Search should be cleared
      expect(searchInput.value).toBe('');
    });

    test('supports Home key to jump to consolidated view', async () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="WELL-001"
          onViewChange={mockOnViewChange}
        />
      );

      // Focus the select
      const select = screen.getByLabelText(/select view mode/i);
      select.focus();

      // Press Home
      fireEvent.keyDown(select, { key: 'Home', code: 'Home' });

      expect(mockOnViewChange).toHaveBeenCalledWith('consolidated');
    });

    test('supports End key to jump to last well', async () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      // Focus the select
      const select = screen.getByLabelText(/select view mode/i);
      select.focus();

      // Press End
      fireEvent.keyDown(select, { key: 'End', code: 'End' });

      // Should jump to last well (WELL-020)
      expect(mockOnViewChange).toHaveBeenCalledWith('individual', 'WELL-020');
    });
  });

  describe('Disabled State', () => {
    test('disables select when disabled prop is true', () => {
      render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
          disabled={true}
        />
      );

      const select = screen.getByLabelText(/select view mode/i);
      expect(select).toBeDisabled();
    });

    test('does not call onViewChange when disabled', async () => {
      const { container } = render(
        <ViewSelector
          wells={mockWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
          disabled={true}
        />
      );

      // Try to open dropdown
      const select = screen.getByLabelText(/select view mode/i);
      fireEvent.click(select);

      // Should not have been called
      expect(mockOnViewChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty wells array', () => {
      render(
        <ViewSelector
          wells={[]}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByText(/0 critical/i)).toBeInTheDocument();
      expect(screen.getByText(/0 degraded/i)).toBeInTheDocument();
      expect(screen.getByText(/0 operational/i)).toBeInTheDocument();
    });

    test('handles wells with missing optional fields', () => {
      const minimalWells = [
        {
          id: 'WELL-999',
          name: 'Minimal Well',
          healthScore: 50,
          status: 'operational' as const,
          alertCount: 0,
          criticalAlertCount: 0,
          lastMaintenance: '',
          nextMaintenance: '',
          location: '',
          keyMetrics: {}
        }
      ];

      render(
        <ViewSelector
          wells={minimalWells}
          selectedView="consolidated"
          onViewChange={mockOnViewChange}
        />
      );

      expect(screen.getByText(/1 operational/i)).toBeInTheDocument();
    });
  });
});
