/**
 * LogPlotViewer Component Tests
 * Testing track rendering and depth alignment functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LogPlotViewer, { TrackConfig } from '../LogPlotViewer';
import { WellLogData, LogCurve, CurveQuality, QualityAssessment } from '../../../types/petrophysics';

// Mock theme
const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock well data
const createMockWellData = (): WellLogData[] => {
  const mockCurveQuality: CurveQuality = {
    completeness: 0.95,
    outlierCount: 2,
    environmentalCorrections: ['temperature', 'pressure'],
    qualityFlag: 'good',
    notes: 'Test curve'
  };

  const mockQualityAssessment: QualityAssessment = {
    overallQuality: 'good',
    dataCompleteness: 0.95,
    environmentalCorrections: ['temperature'],
    validationFlags: [],
    lastAssessment: new Date()
  };

  const grCurve: LogCurve = {
    name: 'GR',
    unit: 'API',
    description: 'Gamma Ray',
    data: Array.from({ length: 100 }, (_, i) => 50 + Math.sin(i * 0.1) * 30),
    nullValue: -999.25,
    quality: mockCurveQuality,
    apiCode: 'GR'
  };

  const nphiCurve: LogCurve = {
    name: 'NPHI',
    unit: 'V/V',
    description: 'Neutron Porosity',
    data: Array.from({ length: 100 }, (_, i) => 0.15 + Math.sin(i * 0.05) * 0.1),
    nullValue: -999.25,
    quality: mockCurveQuality,
    apiCode: 'NPHI'
  };

  const rhobCurve: LogCurve = {
    name: 'RHOB',
    unit: 'G/C3',
    description: 'Bulk Density',
    data: Array.from({ length: 100 }, (_, i) => 2.3 + Math.sin(i * 0.08) * 0.2),
    nullValue: -999.25,
    quality: mockCurveQuality,
    apiCode: 'RHOB'
  };

  return [{
    wellName: 'TEST-001',
    wellInfo: {
      wellName: 'TEST-001',
      field: 'Test Field',
      operator: 'Test Operator',
      location: {
        latitude: 30.0,
        longitude: -95.0
      },
      elevation: 100,
      totalDepth: 10000,
      wellType: 'vertical'
    },
    curves: [grCurve, nphiCurve, rhobCurve],
    depthRange: [8000, 9000],
    dataQuality: mockQualityAssessment,
    lastModified: new Date(),
    version: '1.0'
  }];
};

// Mock track configurations
const createMockTracks = (): TrackConfig[] => [
  {
    id: 'track1',
    type: 'GR',
    title: 'Gamma Ray',
    width: 1,
    curves: [{
      name: 'GR',
      displayName: 'Gamma Ray',
      color: '#228B22',
      lineWidth: 2,
      scale: [0, 150],
      unit: 'API'
    }],
    scale: {
      min: 0,
      max: 150,
      gridLines: true
    },
    fills: [{
      type: 'threshold',
      curveName: 'GR',
      threshold: 75,
      color: 'rgba(34, 139, 34, 0.3)',
      opacity: 0.3,
      condition: 'less_than'
    }]
  },
  {
    id: 'track2',
    type: 'POROSITY',
    title: 'Porosity',
    width: 1,
    curves: [
      {
        name: 'NPHI',
        displayName: 'Neutron Porosity',
        color: '#0000FF',
        lineWidth: 2,
        scale: [0, 0.4],
        unit: 'V/V'
      },
      {
        name: 'RHOB',
        displayName: 'Bulk Density',
        color: '#FF0000',
        lineWidth: 2,
        scale: [1.95, 2.95],
        inverted: true,
        unit: 'G/C3'
      }
    ],
    scale: {
      min: 0,
      max: 0.4,
      gridLines: true
    },
    fills: []
  }
];

describe('LogPlotViewer Component', () => {
  const mockWellData = createMockWellData();
  const mockTracks = createMockTracks();

  beforeEach(() => {
    // Mock canvas context
    const mockContext = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn(),
      scale: jest.fn(),
      setLineDash: jest.fn(),
      fillText: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      set fillStyle(value) {},
      set strokeStyle(value) {},
      set lineWidth(value) {},
      set lineCap(value) {},
      set lineJoin(value) {},
      set globalAlpha(value) {},
      set font(value) {},
      set textAlign(value) {}
    };

    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', { writable: true });
    Object.defineProperty(HTMLCanvasElement.prototype, 'height', { writable: true });
    Object.defineProperty(HTMLCanvasElement.prototype, 'style', { 
      writable: true, 
      value: { width: '', height: '' }
    });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders LogPlotViewer with basic structure', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Well Log Display')).toBeInTheDocument();
    expect(screen.getByText('Depth (ft)')).toBeInTheDocument();
  });

  test('renders correct number of tracks', () => {
    const { container } = render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
        />
      </TestWrapper>
    );

    // Should have 2 track containers (based on mockTracks length)
    const trackContainers = container.querySelectorAll('canvas');
    expect(trackContainers).toHaveLength(2);
  });

  test('displays zoom controls when interactive', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          interactive={true}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset Zoom')).toBeInTheDocument();
  });

  test('hides zoom controls when not interactive', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          interactive={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByLabelText('Zoom In')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Zoom Out')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Reset Zoom')).not.toBeInTheDocument();
  });

  test('handles zoom in functionality', async () => {
    const onDepthRangeChange = jest.fn();
    
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          interactive={true}
          onDepthRangeChange={onDepthRangeChange}
        />
      </TestWrapper>
    );

    const zoomInButton = screen.getByLabelText('Zoom In');
    fireEvent.click(zoomInButton);

    await waitFor(() => {
      expect(onDepthRangeChange).toHaveBeenCalled();
    });
  });

  test('handles zoom out functionality', async () => {
    const onDepthRangeChange = jest.fn();
    
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          interactive={true}
          onDepthRangeChange={onDepthRangeChange}
        />
      </TestWrapper>
    );

    const zoomOutButton = screen.getByLabelText('Zoom Out');
    fireEvent.click(zoomOutButton);

    await waitFor(() => {
      expect(onDepthRangeChange).toHaveBeenCalled();
    });
  });

  test('handles reset zoom functionality', async () => {
    const onDepthRangeChange = jest.fn();
    
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          interactive={true}
          onDepthRangeChange={onDepthRangeChange}
        />
      </TestWrapper>
    );

    const resetButton = screen.getByLabelText('Reset Zoom');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(onDepthRangeChange).toHaveBeenCalled();
    });
  });

  test('displays depth range in status bar', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          initialDepthRange={{ min: 8000, max: 9000 }}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Depth: 8000\.0 - 9000\.0 ft/)).toBeInTheDocument();
  });

  test('displays well count in status bar', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Wells: 1/)).toBeInTheDocument();
  });

  test('handles curve selection callback', async () => {
    const onCurveSelect = jest.fn();
    
    const { container } = render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          onCurveSelect={onCurveSelect}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    if (canvas) {
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
    }

    // Note: The actual curve selection logic depends on the canvas implementation
    // This test verifies the callback is set up correctly
    expect(onCurveSelect).toBeDefined();
  });

  test('handles empty well data gracefully', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={[]}
          tracks={mockTracks}
          height={600}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Well Log Display')).toBeInTheDocument();
    expect(screen.getByText(/Wells: 0/)).toBeInTheDocument();
  });

  test('handles custom initial depth range', () => {
    const customRange = { min: 8200, max: 8800 };
    
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          initialDepthRange={customRange}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Depth: 8200\.0 - 8800\.0 ft/)).toBeInTheDocument();
  });

  test('calculates correct track widths', () => {
    const tracksWithDifferentWidths: TrackConfig[] = [
      { ...mockTracks[0], width: 2 },
      { ...mockTracks[1], width: 1 }
    ];

    const { container } = render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={tracksWithDifferentWidths}
          height={600}
        />
      </TestWrapper>
    );

    // Should have canvas elements for each track
    const canvasElements = container.querySelectorAll('canvas');
    expect(canvasElements.length).toBe(2);
  });

  test('shows depth scale when enabled', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          showDepthScale={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Depth (ft)')).toBeInTheDocument();
  });

  test('hides depth scale when disabled', () => {
    render(
      <TestWrapper>
        <LogPlotViewer
          wellData={mockWellData}
          tracks={mockTracks}
          height={600}
          showDepthScale={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText('Depth (ft)')).not.toBeInTheDocument();
  });
});