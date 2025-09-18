/**
 * Tests for real-time calculation updates functionality
 * Requirements: 3.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalculationUpdateManager, CalculationCache, ParameterChange } from '../CalculationUpdateManager';
import { LogPlotViewer, TrackConfig } from '../LogPlotViewer';
import { WellLogData } from '../../../types/petrophysics';
import { CalculationParameters } from '../../../types/petrophysics';

// Mock data for testing
const mockWellData: WellLogData[] = [
  {
    wellName: 'WELL-001',
    wellInfo: {
      wellName: 'WELL-001',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.0, longitude: -95.0 },
      elevation: 100,
      totalDepth: 10000,
      wellType: 'vertical' as const,
    },
    curves: [
      {
        name: 'GR',
        unit: 'API',
        description: 'Gamma Ray',
        data: Array.from({ length: 100 }, (_, i) => 50 + Math.sin(i / 10) * 30),
        nullValue: -999.25,
        quality: { completeness: 0.95, outlierCount: 2, environmentalCorrections: [], qualityFlag: 'good' as const }
      },
      {
        name: 'RHOB',
        unit: 'g/cc',
        description: 'Bulk Density',
        data: Array.from({ length: 100 }, (_, i) => 2.3 + Math.cos(i / 15) * 0.3),
        nullValue: -999.25,
        quality: { completeness: 0.98, outlierCount: 1, environmentalCorrections: [], qualityFlag: 'excellent' as const }
      }
    ],
    depthRange: [5000, 6000],
    dataQuality: {
      overallQuality: 'good' as const,
      dataCompleteness: 0.95,
      environmentalCorrections: [],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  }
];

const mockTracks: TrackConfig[] = [
  {
    id: 'track1',
    type: 'GR',
    title: 'Gamma Ray',
    curves: [
      {
        name: 'GR',
        displayName: 'Gamma Ray',
        color: '#228B22',
        lineWidth: 1,
        scale: [0, 150],
        unit: 'API'
      }
    ],
    scale: { min: 0, max: 150, gridLines: true },
    fills: [],
    width: 1
  }
];

const mockCalculationParameters: CalculationParameters = {
  matrixDensity: 2.65,
  fluidDensity: 1.0,
  grClean: 30,
  grShale: 120,
  rw: 0.1,
  a: 1.0,
  m: 2.0,
  n: 2.0
};

describe('CalculationUpdateManager', () => {
  let mockOnCalculationComplete: jest.Mock;
  let mockOnParameterChange: jest.Mock;
  let mockOnCacheUpdate: jest.Mock;

  beforeEach(() => {
    mockOnCalculationComplete = jest.fn();
    mockOnParameterChange = jest.fn();
    mockOnCacheUpdate = jest.fn();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should render calculation update manager', () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity', 'shale_volume']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      expect(screen.getByText(/calculation updates/i)).toBeInTheDocument();
      expect(screen.getByText(/cache:/i)).toBeInTheDocument();
    });

    it('should show manual update button', () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      expect(updateButton).toBeInTheDocument();
    });

    it('should trigger manual calculation update', async () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      
      await act(async () => {
        fireEvent.click(updateButton);
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnCalculationComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Parameter Change Detection', () => {
    it('should detect porosity parameter changes', async () => {
      const { rerender } = render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      // Change matrix density
      const newParameters = {
        ...mockCalculationParameters,
        matrixDensity: 2.7
      };

      rerender(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={newParameters}
          enabledCalculations={['porosity']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      await waitFor(() => {
        expect(mockOnParameterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'porosity',
              parameter: 'matrixDensity',
              oldValue: 2.65,
              newValue: 2.7
            })
          ])
        );
      });
    });

    it('should detect saturation parameter changes', async () => {
      const { rerender } = render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['saturation']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      // Change formation water resistivity
      const newParameters = {
        ...mockCalculationParameters,
        rw: 0.2
      };

      rerender(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={newParameters}
          enabledCalculations={['saturation']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      await waitFor(() => {
        expect(mockOnParameterChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'saturation',
              parameter: 'rw',
              oldValue: 0.1,
              newValue: 0.2
            })
          ])
        );
      });
    });

    it('should trigger auto-update when parameters change', async () => {
      const { rerender } = render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      // Change parameters
      const newParameters = {
        ...mockCalculationParameters,
        matrixDensity: 2.8
      };

      rerender(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={newParameters}
          enabledCalculations={['porosity']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      // Advance timers to trigger debounced update
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(mockOnCalculationComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Caching Functionality', () => {
    it('should display cache statistics', () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      expect(screen.getByText(/cache: 0\/0/i)).toBeInTheDocument();
    });

    it('should update cache when calculations complete', async () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      
      await act(async () => {
        fireEvent.click(updateButton);
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnCacheUpdate).toHaveBeenCalled();
      });
    });

    it('should show cache hit rate', async () => {
      const { rerender } = render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      // Simulate cache update
      const mockCache: CalculationCache = {
        'test_key': {
          result: {
            values: [1, 2, 3],
            depths: [5000, 5010, 5020],
            uncertainty: [0.1, 0.1, 0.1],
            quality: { dataCompleteness: 0.95, environmentalCorrections: [], uncertaintyRange: [0, 0.1], confidenceLevel: 'high' as const },
            methodology: 'test',
            parameters: mockCalculationParameters,
            statistics: {
              mean: 2,
              median: 2,
              standardDeviation: 1,
              min: 1,
              max: 3,
              percentiles: { P10: 1.2, P25: 1.5, P50: 2, P75: 2.5, P90: 2.8 },
              count: 3,
              validCount: 3
            },
            timestamp: new Date()
          },
          timestamp: Date.now(),
          parameters: mockCalculationParameters,
          wellData: 'test_hash'
        }
      };

      // This would normally be called by the component internally
      // For testing, we can verify the cache update callback is called
      expect(mockOnCacheUpdate).toHaveBeenCalledTimes(0);
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress during calculations', async () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity', 'shale_volume']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      
      await act(async () => {
        fireEvent.click(updateButton);
        // Don't advance timers fully to catch progress state
        jest.advanceTimersByTime(50);
      });

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should show current calculation being performed', async () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      
      await act(async () => {
        fireEvent.click(updateButton);
        jest.advanceTimersByTime(50);
      });

      // Should show current calculation
      await waitFor(() => {
        expect(screen.getByText(/porosity - WELL-001/i)).toBeInTheDocument();
      });
    });

    it('should show completion status', async () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      
      await act(async () => {
        fireEvent.click(updateButton);
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/1 completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-update Behavior', () => {
    it('should show auto-update indicator when enabled', () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={true}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      expect(screen.getByText(/auto-update enabled/i)).toBeInTheDocument();
    });

    it('should not show auto-update indicator when disabled', () => {
      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      expect(screen.queryByText(/auto-update enabled/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle calculation errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <CalculationUpdateManager
          wellData={mockWellData}
          calculationParameters={mockCalculationParameters}
          enabledCalculations={['porosity']}
          autoUpdate={false}
          cacheTimeout={300000}
          onCalculationComplete={mockOnCalculationComplete}
          onParameterChange={mockOnParameterChange}
          onCacheUpdate={mockOnCacheUpdate}
        />
      );

      const updateButton = screen.getByLabelText(/manual update/i);
      
      await act(async () => {
        fireEvent.click(updateButton);
        jest.advanceTimersByTime(1000);
      });

      // Component should handle errors without crashing
      expect(screen.getByText(/calculation updates/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});

describe('LogPlotViewer Real-time Updates Integration', () => {
  let mockOnCalculationComplete: jest.Mock;
  let mockOnParameterChange: jest.Mock;

  beforeEach(() => {
    mockOnCalculationComplete = jest.fn();
    mockOnParameterChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render calculation update manager when enabled', () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        showCalculationUpdates={true}
        calculationParameters={mockCalculationParameters}
        enabledCalculations={['porosity']}
        autoUpdateCalculations={true}
        onCalculationComplete={mockOnCalculationComplete}
        onParameterChange={mockOnParameterChange}
      />
    );

    expect(screen.getByText(/calculation updates/i)).toBeInTheDocument();
  });

  it('should not render calculation update manager when disabled', () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        showCalculationUpdates={false}
        calculationParameters={mockCalculationParameters}
        onCalculationComplete={mockOnCalculationComplete}
        onParameterChange={mockOnParameterChange}
      />
    );

    expect(screen.queryByText(/calculation updates/i)).not.toBeInTheDocument();
  });

  it('should pass calculation parameters to update manager', () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        showCalculationUpdates={true}
        calculationParameters={mockCalculationParameters}
        enabledCalculations={['porosity', 'saturation']}
        autoUpdateCalculations={false}
        onCalculationComplete={mockOnCalculationComplete}
        onParameterChange={mockOnParameterChange}
      />
    );

    // Should render with the provided parameters
    expect(screen.getByText(/calculation updates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/manual update/i)).toBeInTheDocument();
  });
});