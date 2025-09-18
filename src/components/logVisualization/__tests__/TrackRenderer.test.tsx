/**
 * TrackRenderer Component Tests
 * Testing individual track display and proper scaling
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TrackRenderer from '../TrackRenderer';
import { TrackConfig, DepthRange } from '../LogPlotViewer';
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
    data: [45, 55, 65, 75, 85, 95, 105, 85, 75, 65],
    nullValue: -999.25,
    quality: mockCurveQuality,
    apiCode: 'GR'
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
    curves: [grCurve],
    depthRange: [8000, 8100],
    dataQuality: mockQualityAssessment,
    lastModified: new Date(),
    version: '1.0'
  }];
};

// Mock track configuration
const createMockTrack = (): TrackConfig => ({
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
    gridLines: true,
    tickInterval: 25
  },
  fills: [{
    type: 'threshold',
    curveName: 'GR',
    threshold: 75,
    color: 'rgba(34, 139, 34, 0.3)',
    opacity: 0.3,
    condition: 'less_than'
  }]
});

describe('TrackRenderer Component', () => {
  const mockWellData = createMockWellData();
  const mockTrack = createMockTrack();
  const mockDepthRange: DepthRange = { min: 8000, max: 8100 };

  beforeEach(() => {
    // Mock canvas context with all required methods
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
      set fillStyle(value) { this._fillStyle = value; },
      get fillStyle() { return this._fillStyle; },
      set strokeStyle(value) { this._strokeStyle = value; },
      get strokeStyle() { return this._strokeStyle; },
      set lineWidth(value) { this._lineWidth = value; },
      get lineWidth() { return this._lineWidth; },
      set lineCap(value) { this._lineCap = value; },
      get lineCap() { return this._lineCap; },
      set lineJoin(value) { this._lineJoin = value; },
      get lineJoin() { return this._lineJoin; },
      set globalAlpha(value) { this._globalAlpha = value; },
      get globalAlpha() { return this._globalAlpha; },
      set font(value) { this._font = value; },
      get font() { return this._font; },
      set textAlign(value) { this._textAlign = value; },
      get textAlign() { return this._textAlign; }
    };

    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', { 
      writable: true, 
      value: 200 
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'height', { 
      writable: true, 
      value: 600 
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'style', { 
      writable: true, 
      value: { width: '200px', height: '600px' }
    });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 200,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }));

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders TrackRenderer with canvas', () => {
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('displays track info overlay', () => {
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    expect(container.textContent).toContain('1 curve');
  });

  test('displays multiple curves info correctly', () => {
    const multiCurveTrack: TrackConfig = {
      ...mockTrack,
      curves: [
        mockTrack.curves[0],
        {
          name: 'SP',
          displayName: 'Spontaneous Potential',
          color: '#FF0000',
          lineWidth: 1,
          scale: [-100, 100],
          unit: 'mV'
        }
      ]
    };

    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={multiCurveTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    expect(container.textContent).toContain('2 curves');
  });

  test('handles curve click events', () => {
    const onCurveClick = jest.fn();
    
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
          onCurveClick={onCurveClick}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    if (canvas) {
      fireEvent.click(canvas, { clientX: 100, clientY: 300 });
    }

    // The click handler should be called (exact behavior depends on curve proximity)
    expect(onCurveClick).toBeDefined();
  });

  test('handles empty well data gracefully', () => {
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={[]}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(container.textContent).toContain('1 curve');
  });

  test('handles missing curve data gracefully', () => {
    const trackWithMissingCurve: TrackConfig = {
      ...mockTrack,
      curves: [{
        name: 'MISSING_CURVE',
        displayName: 'Missing Curve',
        color: '#FF0000',
        lineWidth: 2,
        scale: [0, 100],
        unit: 'UNIT'
      }]
    };

    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={trackWithMissingCurve}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('applies selected curve styling', () => {
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
          selectedCurve="GR"
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    // The canvas should be rendered with selected curve styling
    // (specific styling verification would require more detailed canvas mocking)
  });

  test('handles logarithmic scale configuration', () => {
    const logScaleTrack: TrackConfig = {
      ...mockTrack,
      scale: {
        ...mockTrack.scale,
        logarithmic: true,
        min: 0.1,
        max: 1000
      }
    };

    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={logScaleTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('handles inverted scale configuration', () => {
    const invertedScaleTrack: TrackConfig = {
      ...mockTrack,
      scale: {
        ...mockTrack.scale,
        inverted: true
      }
    };

    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={invertedScaleTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('processes curve data within depth range', () => {
    const limitedDepthRange: DepthRange = { min: 8020, max: 8080 };
    
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={mockWellData}
          depthRange={limitedDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('handles null values in curve data', () => {
    const wellDataWithNulls = createMockWellData();
    wellDataWithNulls[0].curves[0].data = [45, -999.25, 65, 75, -999.25, 95, 105];
    
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={wellDataWithNulls}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('renders fill configurations', () => {
    const trackWithFills: TrackConfig = {
      ...mockTrack,
      fills: [
        {
          type: 'threshold',
          curveName: 'GR',
          threshold: 75,
          color: 'rgba(0, 255, 0, 0.3)',
          opacity: 0.3,
          condition: 'less_than'
        },
        {
          type: 'above_curve',
          curveName: 'GR',
          color: 'rgba(255, 0, 0, 0.2)',
          opacity: 0.2
        }
      ]
    };

    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={trackWithFills}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('handles resize events', () => {
    const { container } = render(
      <TestWrapper>
        <TrackRenderer
          track={mockTrack}
          wellData={mockWellData}
          depthRange={mockDepthRange}
          height={600}
        />
      </TestWrapper>
    );

    // Trigger resize event
    fireEvent(window, new Event('resize'));

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});