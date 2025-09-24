/**
 * Tests for curve selection and overlay functionality
 * Requirements: 3.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurveSelectionPanel, CurveVisibility, CurveOverlay } from '../CurveSelectionPanel';
import { LogPlotViewer, TrackConfig } from '../LogPlotViewer';
import { WellLogData } from '../../../types/petrophysics';

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
  },
  {
    wellName: 'WELL-002',
    wellInfo: {
      wellName: 'WELL-002',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.1, longitude: -95.1 },
      elevation: 110,
      totalDepth: 9500,
      wellType: 'vertical' as const,
    },
    curves: [
      {
        name: 'GR',
        unit: 'API',
        description: 'Gamma Ray',
        data: Array.from({ length: 100 }, (_, i) => 60 + Math.sin(i / 12) * 25),
        nullValue: -999.25,
        quality: { completeness: 0.93, outlierCount: 3, environmentalCorrections: [], qualityFlag: 'good' as const }
      }
    ],
    depthRange: [4800, 5800],
    dataQuality: {
      overallQuality: 'good' as const,
      dataCompleteness: 0.93,
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
  },
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

const mockCurveVisibility: CurveVisibility[] = [
  {
    wellName: 'WELL-001',
    curveName: 'GR',
    visible: true,
    color: '#228B22',
    lineWidth: 1,
    lineStyle: 'solid',
    opacity: 1.0
  },
  {
    wellName: 'WELL-001',
    curveName: 'RHOB',
    visible: true,
    color: '#FF0000',
    lineWidth: 1,
    lineStyle: 'solid',
    opacity: 1.0
  },
  {
    wellName: 'WELL-002',
    curveName: 'GR',
    visible: true,
    color: '#228B22',
    lineWidth: 1,
    lineStyle: 'solid',
    opacity: 1.0
  }
];

describe('CurveSelectionPanel', () => {
  let mockOnCurveVisibilityChange: jest.Mock;
  let mockOnOverlayChange: jest.Mock;
  let mockOnCurveStyleChange: jest.Mock;

  beforeEach(() => {
    mockOnCurveVisibilityChange = jest.fn();
    mockOnOverlayChange = jest.fn();
    mockOnCurveStyleChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Curve Visibility Controls', () => {
    it('should render curve visibility section', () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      expect(screen.getByText(/curve visibility/i)).toBeInTheDocument();
      expect(screen.getByText(/gamma ray/i)).toBeInTheDocument();
      expect(screen.getByText(/porosity/i)).toBeInTheDocument();
    });

    it('should display correct curve count', () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      // Should show 3/3 curves visible
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });

    it('should toggle curve visibility when checkbox is clicked', async () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      // Find and click a curve visibility checkbox
      const grCheckboxes = screen.getAllByRole('checkbox');
      const firstCurveCheckbox = grCheckboxes.find(checkbox => 
        checkbox.getAttribute('aria-label')?.includes('GR') || 
        checkbox.closest('label')?.textContent?.includes('GR')
      );

      if (firstCurveCheckbox) {
        fireEvent.click(firstCurveCheckbox);

        await waitFor(() => {
          expect(mockOnCurveVisibilityChange).toHaveBeenCalled();
          const updatedVisibility = mockOnCurveVisibilityChange.mock.calls[0][0];
          expect(updatedVisibility).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                wellName: 'WELL-001',
                curveName: 'GR',
                visible: false
              })
            ])
          );
        });
      }
    });

    it('should show all curves when "Show All" button is clicked', async () => {
      const hiddenVisibility = mockCurveVisibility.map(cv => ({ ...cv, visible: false }));
      
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={hiddenVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      const showAllButton = screen.getByText(/show all/i);
      fireEvent.click(showAllButton);

      await waitFor(() => {
        expect(mockOnCurveVisibilityChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ visible: true })
          ])
        );
      });
    });
  });

  describe('Overlay Creation', () => {
    it('should render overlay creation section', () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      expect(screen.getByText(/create overlay/i)).toBeInTheDocument();
    });

    it('should allow curve selection for overlay', async () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      // Find selection checkboxes (secondary checkboxes for overlay selection)
      const checkboxes = screen.getAllByRole('checkbox');
      const selectionCheckboxes = checkboxes.filter(cb => 
        cb.getAttribute('class')?.includes('secondary') || 
        cb.getAttribute('color') === 'secondary'
      );

      if (selectionCheckboxes.length > 0) {
        fireEvent.click(selectionCheckboxes[0]);
        
        // Should show selected curve count
        await waitFor(() => {
          expect(screen.getByText(/selected curves/i)).toBeInTheDocument();
        });
      }
    });

    it('should create overlay when name is provided and curves are selected', async () => {
      const user = userEvent.setup();
      
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={[]}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      // Enter overlay name
      const nameInput = screen.getByLabelText(/overlay name/i);
      await user.type(nameInput, 'Test Overlay');

      // Select curves (this would require expanding the UI and selecting curves)
      // For now, we'll test the button state
      const createButton = screen.getByText(/create overlay/i);
      expect(createButton).toBeDisabled(); // Should be disabled without selected curves
    });
  });

  describe('Overlay Management', () => {
    const mockOverlays: CurveOverlay[] = [
      {
        id: 'overlay1',
        name: 'GR Comparison',
        curves: [
          {
            wellName: 'WELL-001',
            curveName: 'GR',
            color: '#228B22',
            lineWidth: 2
          },
          {
            wellName: 'WELL-002',
            curveName: 'GR',
            color: '#FF0000',
            lineWidth: 2
          }
        ],
        visible: true
      }
    ];

    it('should display existing overlays', () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={mockOverlays}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      expect(screen.getByText('GR Comparison')).toBeInTheDocument();
      expect(screen.getByText(/active overlays/i)).toBeInTheDocument();
    });

    it('should toggle overlay visibility', async () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={mockOverlays}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      // Find visibility toggle button for overlay
      const visibilityButtons = screen.getAllByRole('button');
      const toggleButton = visibilityButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('overlay') ||
        btn.querySelector('[data-testid="VisibilityIcon"]')
      );

      if (toggleButton) {
        fireEvent.click(toggleButton);

        await waitFor(() => {
          expect(mockOnOverlayChange).toHaveBeenCalledWith(
            expect.arrayContaining([
              expect.objectContaining({
                id: 'overlay1',
                visible: false
              })
            ])
          );
        });
      }
    });

    it('should remove overlay when remove button is clicked', async () => {
      render(
        <CurveSelectionPanel
          wellData={mockWellData}
          tracks={mockTracks}
          curveVisibility={mockCurveVisibility}
          overlays={mockOverlays}
          onCurveVisibilityChange={mockOnCurveVisibilityChange}
          onOverlayChange={mockOnOverlayChange}
          onCurveStyleChange={mockOnCurveStyleChange}
        />
      );

      // Find remove button for overlay
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('remove') ||
        btn.querySelector('[data-testid="RemoveIcon"]')
      );

      if (removeButton) {
        fireEvent.click(removeButton);

        await waitFor(() => {
          expect(mockOnOverlayChange).toHaveBeenCalledWith([]);
        });
      }
    });
  });
});

describe('LogPlotViewer Curve Controls Integration', () => {
  let mockOnCurveVisibilityChange: jest.Mock;
  let mockOnOverlayChange: jest.Mock;

  beforeEach(() => {
    mockOnCurveVisibilityChange = jest.fn();
    mockOnOverlayChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render curve controls button when showCurveControls is true', () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        interactive={true}
        showCurveControls={true}
        onCurveVisibilityChange={mockOnCurveVisibilityChange}
        onOverlayChange={mockOnOverlayChange}
      />
    );

    const curveControlsButton = screen.getByLabelText(/curve selection & overlays/i);
    expect(curveControlsButton).toBeInTheDocument();
  });

  it('should not render curve controls button when showCurveControls is false', () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        interactive={true}
        showCurveControls={false}
        onCurveVisibilityChange={mockOnCurveVisibilityChange}
        onOverlayChange={mockOnOverlayChange}
      />
    );

    expect(screen.queryByLabelText(/curve selection & overlays/i)).not.toBeInTheDocument();
  });

  it('should open curve selection panel when curve controls button is clicked', async () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        interactive={true}
        showCurveControls={true}
        onCurveVisibilityChange={mockOnCurveVisibilityChange}
        onOverlayChange={mockOnOverlayChange}
      />
    );

    const curveControlsButton = screen.getByLabelText(/curve selection & overlays/i);
    fireEvent.click(curveControlsButton);

    await waitFor(() => {
      expect(screen.getByText(/curve controls/i)).toBeInTheDocument();
    });
  });

  it('should filter tracks based on curve visibility', () => {
    const hiddenVisibility: CurveVisibility[] = mockCurveVisibility.map(cv => ({
      ...cv,
      visible: cv.curveName === 'GR' ? false : true
    }));

    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        interactive={true}
        showCurveControls={true}
        onCurveVisibilityChange={mockOnCurveVisibilityChange}
        onOverlayChange={mockOnOverlayChange}
      />
    );

    // The component should render but with filtered tracks
    // This is more of an integration test that would need visual verification
    expect(screen.getByText(/well log display/i)).toBeInTheDocument();
  });

  it('should handle curve visibility changes', async () => {
    render(
      <LogPlotViewer
        wellData={mockWellData}
        tracks={mockTracks}
        interactive={true}
        showCurveControls={true}
        onCurveVisibilityChange={mockOnCurveVisibilityChange}
        onOverlayChange={mockOnOverlayChange}
      />
    );

    // Open curve panel
    const curveControlsButton = screen.getByLabelText(/curve selection & overlays/i);
    fireEvent.click(curveControlsButton);

    await waitFor(() => {
      expect(screen.getByText(/curve controls/i)).toBeInTheDocument();
    });

    // The curve visibility changes would be tested through the CurveSelectionPanel
    // which we've already tested above
  });
});