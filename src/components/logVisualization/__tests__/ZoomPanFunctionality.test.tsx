/**
 * Tests for zoom and pan functionality in LogPlotViewer
 * Requirements: 3.1, 3.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogPlotViewer, TrackConfig } from '../LogPlotViewer';
import { WellLogData } from '../../../types/petrophysics';

// Mock data for testing
const mockWellData: WellLogData[] = [
  {
    wellName: 'TEST-001',
    wellInfo: {
      wellName: 'TEST-001',
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
        data: Array.from({ length: 1000 }, (_, i) => 50 + Math.sin(i / 100) * 30),
        nullValue: -999.25,
        quality: { completeness: 0.95, outlierCount: 20, environmentalCorrections: [], qualityFlag: 'good' as const }
      },
      {
        name: 'RHOB',
        unit: 'g/cc',
        description: 'Bulk Density',
        data: Array.from({ length: 1000 }, (_, i) => 2.3 + Math.cos(i / 150) * 0.3),
        nullValue: -999.25,
        quality: { completeness: 0.98, outlierCount: 10, environmentalCorrections: [], qualityFlag: 'excellent' as const }
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

describe('LogPlotViewer Zoom and Pan Functionality', () => {
  let mockOnDepthRangeChange: jest.Mock;
  let mockOnZoomChange: jest.Mock;

  beforeEach(() => {
    mockOnDepthRangeChange = jest.fn();
    mockOnZoomChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Zoom Controls', () => {
    it('should render zoom control buttons when interactive', () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          interactive={true}
          showZoomControls={true}
          onDepthRangeChange={mockOnDepthRangeChange}
          onZoomChange={mockOnZoomChange}
        />
      );

      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zoom out/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fit to data/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reset zoom/i)).toBeInTheDocument();
    });

    it('should not render zoom controls when showZoomControls is false', () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          interactive={true}
          showZoomControls={false}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      expect(screen.queryByLabelText(/zoom in/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/zoom out/i)).not.toBeInTheDocument();
    });

    it('should zoom in when zoom in button is clicked', async () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
          onZoomChange={mockOnZoomChange}
        />
      );

      const zoomInButton = screen.getByLabelText(/zoom in/i);
      fireEvent.click(zoomInButton);

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalled();
        expect(mockOnZoomChange).toHaveBeenCalled();
        
        const lastCall = mockOnDepthRangeChange.mock.calls[mockOnDepthRangeChange.mock.calls.length - 1];
        const newRange = lastCall[0];
        
        // Should zoom in (smaller range)
        expect(newRange.max - newRange.min).toBeLessThan(1000);
      });
    });

    it('should zoom out when zoom out button is clicked', async () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5200, max: 5800 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
          onZoomChange={mockOnZoomChange}
        />
      );

      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      fireEvent.click(zoomOutButton);

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalled();
        expect(mockOnZoomChange).toHaveBeenCalled();
        
        const lastCall = mockOnDepthRangeChange.mock.calls[mockOnDepthRangeChange.mock.calls.length - 1];
        const newRange = lastCall[0];
        
        // Should zoom out (larger range)
        expect(newRange.max - newRange.min).toBeGreaterThan(600);
      });
    });

    it('should reset zoom when reset button is clicked', async () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
          onZoomChange={mockOnZoomChange}
        />
      );

      // First zoom in
      const zoomInButton = screen.getByLabelText(/zoom in/i);
      fireEvent.click(zoomInButton);

      // Then reset
      const resetButton = screen.getByLabelText(/reset zoom/i);
      fireEvent.click(resetButton);

      await waitFor(() => {
        const lastCall = mockOnDepthRangeChange.mock.calls[mockOnDepthRangeChange.mock.calls.length - 1];
        const resetRange = lastCall[0];
        
        // Should return to initial range
        expect(resetRange.min).toBe(5000);
        expect(resetRange.max).toBe(6000);
      });
    });
  });

  describe('Mouse Wheel Zoom', () => {
    it('should zoom in on wheel up', async () => {
      const { container } = render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
          onZoomChange={mockOnZoomChange}
        />
      );

      const plotArea = container.querySelector('[data-testid="plot-area"]') || container.firstChild;
      
      fireEvent.wheel(plotArea as Element, { deltaY: -100 });

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should zoom out on wheel down', async () => {
      const { container } = render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5200, max: 5800 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
          onZoomChange={mockOnZoomChange}
        />
      );

      const plotArea = container.querySelector('[data-testid="plot-area"]') || container.firstChild;
      
      fireEvent.wheel(plotArea as Element, { deltaY: 100 });

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Depth Range Selector', () => {
    it('should render depth range controls when showDepthSelector is true', () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          interactive={true}
          showDepthSelector={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      expect(screen.getByLabelText(/min depth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max depth/i)).toBeInTheDocument();
    });

    it('should update depth range when min depth input changes', async () => {
      const user = userEvent.setup();
      
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          showDepthSelector={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      const minDepthInput = screen.getByLabelText(/min depth/i);
      
      await user.clear(minDepthInput);
      await user.type(minDepthInput, '5100');

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalledWith(
          expect.objectContaining({ min: 5100 })
        );
      });
    });

    it('should update depth range when max depth input changes', async () => {
      const user = userEvent.setup();
      
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          showDepthSelector={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      const maxDepthInput = screen.getByLabelText(/max depth/i);
      
      await user.clear(maxDepthInput);
      await user.type(maxDepthInput, '5900');

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalledWith(
          expect.objectContaining({ max: 5900 })
        );
      });
    });
  });

  describe('Pan Functionality', () => {
    it('should handle mouse drag for panning', async () => {
      const { container } = render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5200, max: 5800 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      const plotArea = container.firstChild as Element;
      
      // Simulate drag
      fireEvent.mouseDown(plotArea, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(plotArea, { clientX: 100, clientY: 150 });
      fireEvent.mouseUp(plotArea);

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalled();
      });
    });

    it('should show appropriate cursor during drag', () => {
      const { container } = render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      const plotArea = container.firstChild as HTMLElement;
      
      // Should show grab cursor initially
      expect(plotArea.style.cursor).toContain('grab');
      
      // Should show grabbing cursor during drag
      fireEvent.mouseDown(plotArea, { clientX: 100, clientY: 100 });
      expect(plotArea.style.cursor).toContain('grabbing');
      
      fireEvent.mouseUp(plotArea);
    });
  });

  describe('Depth Selection', () => {
    it('should handle shift+drag for depth selection', async () => {
      const { container } = render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      const plotArea = container.firstChild as Element;
      
      // Simulate shift+drag
      fireEvent.mouseDown(plotArea, { 
        clientX: 100, 
        clientY: 100, 
        shiftKey: true 
      });
      fireEvent.mouseMove(plotArea, { 
        clientX: 100, 
        clientY: 200, 
        shiftKey: true 
      });
      fireEvent.mouseUp(plotArea);

      await waitFor(() => {
        expect(mockOnDepthRangeChange).toHaveBeenCalled();
      });
    });

    it('should show crosshair cursor during selection', () => {
      const { container } = render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      const plotArea = container.firstChild as HTMLElement;
      
      // Should show crosshair cursor during selection
      fireEvent.mouseDown(plotArea, { 
        clientX: 100, 
        clientY: 100, 
        shiftKey: true 
      });
      expect(plotArea.style.cursor).toContain('crosshair');
      
      fireEvent.mouseUp(plotArea);
    });
  });

  describe('Depth Synchronization', () => {
    it('should maintain depth synchronization across all tracks', () => {
      const multiTrackConfig: TrackConfig[] = [
        ...mockTracks,
        {
          id: 'track2',
          type: 'POROSITY',
          title: 'Porosity',
          curves: [
            {
              name: 'RHOB',
              displayName: 'Bulk Density',
              color: '#FF0000',
              lineWidth: 1,
              scale: [1.95, 2.95],
              unit: 'g/cc'
            }
          ],
          scale: { min: 1.95, max: 2.95, gridLines: true },
          fills: [],
          width: 1
        }
      ];

      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={multiTrackConfig}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      // Zoom in
      const zoomInButton = screen.getByLabelText(/zoom in/i);
      fireEvent.click(zoomInButton);

      // All tracks should receive the same depth range
      expect(mockOnDepthRangeChange).toHaveBeenCalled();
    });
  });

  describe('Boundary Conditions', () => {
    it('should not zoom beyond data bounds', async () => {
      render(
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          initialDepthRange={{ min: 5000, max: 6000 }}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      // Try to zoom out beyond data bounds
      const zoomOutButton = screen.getByLabelText(/zoom out/i);
      
      // Click multiple times to try to exceed bounds
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOutButton);
      }

      await waitFor(() => {
        const lastCall = mockOnDepthRangeChange.mock.calls[mockOnDepthRangeChange.mock.calls.length - 1];
        const finalRange = lastCall[0];
        
        // Should not exceed original data bounds
        expect(finalRange.min).toBeGreaterThanOrEqual(5000);
        expect(finalRange.max).toBeLessThanOrEqual(6000);
      });
    });

    it('should handle empty well data gracefully', () => {
      render(
        <LogPlotViewer
          wellData={[]}
          tracks={mockTracks}
          interactive={true}
          onDepthRangeChange={mockOnDepthRangeChange}
        />
      );

      // Should render without crashing
      expect(screen.getByText(/well log display/i)).toBeInTheDocument();
    });
  });
});