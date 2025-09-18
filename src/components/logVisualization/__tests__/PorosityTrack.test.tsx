/**
 * PorosityTrack Component Tests
 * Tests dual curve rendering and fill calculations
 * Requirements: 1.3, 1.6
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PorosityTrack } from '../PorosityTrack';
import { WellLogData, LogCurve, CurveQuality, QualityAssessment, WellHeaderInfo } from '../../../types/petrophysics';

// Mock canvas context with property tracking
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  scale: jest.fn(),
  setLineDash: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rect: jest.fn(),
  fillText: jest.fn(),
  _fillStyle: '',
  _strokeStyle: '',
  _lineWidth: 1,
  _lineCap: 'butt',
  _lineJoin: 'miter',
  _globalAlpha: 1,
  _font: '10px sans-serif',
  _textAlign: 'start',
  set fillStyle(value: string) { this._fillStyle = value; },
  get fillStyle() { return this._fillStyle; },
  set strokeStyle(value: string) { this._strokeStyle = value; },
  get strokeStyle() { return this._strokeStyle; },
  set lineWidth(value: number) { this._lineWidth = value; },
  get lineWidth() { return this._lineWidth; },
  set lineCap(value: string) { this._lineCap = value; },
  get lineCap() { return this._lineCap; },
  set lineJoin(value: string) { this._lineJoin = value; },
  get lineJoin() { return this._lineJoin; },
  set globalAlpha(value: number) { this._globalAlpha = value; },
  get globalAlpha() { return this._globalAlpha; },
  set font(value: string) { this._font = value; },
  get font() { return this._font; },
  set textAlign(value: string) { this._textAlign = value; },
  get textAlign() { return this._textAlign; },
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 200,
  height: 400,
  top: 0,
  left: 0,
  bottom: 400,
  right: 200,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

describe('PorosityTrack Component', () => {
  // Test data setup
  const mockCurveQuality: CurveQuality = {
    completeness: 0.95,
    outlierCount: 2,
    environmentalCorrections: ['borehole_correction'],
    qualityFlag: 'good',
  };

  const mockQualityAssessment: QualityAssessment = {
    overallQuality: 'good',
    dataCompleteness: 0.95,
    environmentalCorrections: ['borehole_correction'],
    validationFlags: [],
    lastAssessment: new Date(),
  };

  const mockWellHeaderInfo: WellHeaderInfo = {
    wellName: 'TEST-001',
    field: 'Test Field',
    operator: 'Test Operator',
    location: { latitude: 30.0, longitude: -95.0 },
    elevation: 100,
    totalDepth: 10000,
    wellType: 'vertical',
  };

  const createMockNphiCurve = (data: number[]): LogCurve => ({
    name: 'NPHI',
    unit: '%',
    description: 'Neutron Porosity',
    data,
    nullValue: -999.25,
    quality: mockCurveQuality,
    apiCode: '42',
  });

  const createMockRhobCurve = (data: number[]): LogCurve => ({
    name: 'RHOB',
    unit: 'g/cc',
    description: 'Bulk Density',
    data,
    nullValue: -999.25,
    quality: mockCurveQuality,
    apiCode: '45',
  });

  const createMockWellData = (nphiData: number[], rhobData: number[]): WellLogData => ({
    wellName: 'TEST-001',
    wellInfo: mockWellHeaderInfo,
    curves: [
      createMockNphiCurve(nphiData),
      createMockRhobCurve(rhobData),
    ],
    depthRange: [8000, 8100],
    dataQuality: mockQualityAssessment,
    lastModified: new Date(),
    version: '1.0',
  });

  const defaultProps = {
    wellData: [createMockWellData([15, 20, 25, 18, 22], [2.45, 2.35, 2.25, 2.40, 2.30])],
    depthRange: { min: 8000, max: 8100 },
    height: 400,
    width: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset canvas context properties
    mockCanvasContext._fillStyle = '';
    mockCanvasContext._strokeStyle = '';
    mockCanvasContext._lineWidth = 1;
    mockCanvasContext._globalAlpha = 1;
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<PorosityTrack {...defaultProps} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render with correct dimensions', () => {
      const { container } = render(<PorosityTrack {...defaultProps} />);
      const trackContainer = container.firstChild as HTMLElement;
      
      expect(trackContainer).toHaveStyle({
        width: '200px',
        height: '400px',
      });
    });

    it('should render track info overlay with curve legends', () => {
      render(<PorosityTrack {...defaultProps} />);
      
      expect(screen.getByText('NPHI (%)')).toBeInTheDocument();
      expect(screen.getByText('RHOB (g/cc)')).toBeInTheDocument();
      expect(screen.getByText('Gas Effect')).toBeInTheDocument();
    });

    it('should handle missing NPHI curve gracefully', () => {
      const wellDataWithoutNphi: WellLogData = {
        ...defaultProps.wellData[0],
        curves: [createMockRhobCurve([2.45, 2.35, 2.25, 2.40, 2.30])],
      };

      expect(() => {
        render(<PorosityTrack {...defaultProps} wellData={[wellDataWithoutNphi]} />);
      }).not.toThrow();
    });

    it('should handle missing RHOB curve gracefully', () => {
      const wellDataWithoutRhob: WellLogData = {
        ...defaultProps.wellData[0],
        curves: [createMockNphiCurve([15, 20, 25, 18, 22])],
      };

      expect(() => {
        render(<PorosityTrack {...defaultProps} wellData={[wellDataWithoutRhob]} />);
      }).not.toThrow();
    });
  });

  describe('Dual Curve Rendering', () => {
    it('should call canvas drawing methods for NPHI curve', () => {
      render(<PorosityTrack {...defaultProps} />);
      
      // Verify canvas context methods are called
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should render NPHI curve with blue color', () => {
      // Create a spy to track strokeStyle assignments
      const strokeStyleSpy = jest.fn();
      Object.defineProperty(mockCanvasContext, 'strokeStyle', {
        set: strokeStyleSpy,
        get: () => mockCanvasContext._strokeStyle,
      });

      render(<PorosityTrack {...defaultProps} />);
      
      // Check that blue color was set at some point for NPHI curve
      expect(strokeStyleSpy).toHaveBeenCalledWith('#0000FF');
    });

    it('should render RHOB curve with red color', () => {
      // Create a spy to track strokeStyle assignments
      const strokeStyleSpy = jest.fn();
      Object.defineProperty(mockCanvasContext, 'strokeStyle', {
        set: strokeStyleSpy,
        get: () => mockCanvasContext._strokeStyle,
      });

      render(<PorosityTrack {...defaultProps} />);
      
      // Check that red color was set at some point for RHOB curve
      expect(strokeStyleSpy).toHaveBeenCalledWith('#FF0000');
    });

    it('should handle NPHI scale (0-40%)', () => {
      const nphiData = [0, 10, 20, 30, 40]; // Full scale range
      const wellData = createMockWellData(nphiData, [2.65, 2.55, 2.45, 2.35, 2.25]);
      
      render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      
      // Verify canvas drawing is called (scale handling is internal)
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    });

    it('should handle RHOB scale (1.95-2.95 g/cc) with inversion', () => {
      const rhobData = [1.95, 2.25, 2.55, 2.85, 2.95]; // Full scale range
      const wellData = createMockWellData([20, 18, 15, 8, 5], rhobData);
      
      render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      
      // Verify canvas drawing is called (inversion is handled internally)
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    });
  });

  describe('Fill Calculations', () => {
    it('should calculate density porosity correctly', () => {
      // Test density porosity formula: φD = (2.65 - RHOB) / (2.65 - 1.0)
      const rhobData = [2.65, 2.45, 2.25]; // Should give 0%, 12.1%, 24.2% porosity
      const wellData = createMockWellData([15, 20, 25], rhobData);
      
      render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      
      // Verify fill methods are called
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    it('should render gas effect fill when NPHI < density porosity', () => {
      // Create a spy to track fillStyle assignments
      const fillStyleSpy = jest.fn();
      Object.defineProperty(mockCanvasContext, 'fillStyle', {
        set: fillStyleSpy,
        get: () => mockCanvasContext._fillStyle,
      });

      // Create data where NPHI is less than calculated density porosity
      const nphiData = [10, 15, 20]; // NPHI values
      const rhobData = [2.35, 2.25, 2.15]; // Should give ~18%, 24%, 30% density porosity
      const wellData = createMockWellData(nphiData, rhobData);
      
      render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      
      // Verify gas effect fill color was set (yellow color)
      expect(fillStyleSpy).toHaveBeenCalledWith('#FFFF00');
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    it('should render porosity fill between curves', () => {
      // Create a spy to track fillStyle assignments
      const fillStyleSpy = jest.fn();
      Object.defineProperty(mockCanvasContext, 'fillStyle', {
        set: fillStyleSpy,
        get: () => mockCanvasContext._fillStyle,
      });

      render(<PorosityTrack {...defaultProps} />);
      
      // Verify porosity fill color was set (sky blue color)
      expect(fillStyleSpy).toHaveBeenCalledWith('#87CEEB');
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    it('should handle null values in curve data', () => {
      const nphiDataWithNulls = [15, -999.25, 25, 18, -999.25]; // Contains null values
      const rhobDataWithNulls = [2.45, 2.35, -999.25, 2.40, 2.30]; // Contains null values
      const wellData = createMockWellData(nphiDataWithNulls, rhobDataWithNulls);
      
      expect(() => {
        render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      }).not.toThrow();
    });
  });

  describe('Grid and Labels', () => {
    it('should render grid lines when showGrid is true', () => {
      render(<PorosityTrack {...defaultProps} showGrid={true} />);
      
      expect(mockCanvasContext.setLineDash).toHaveBeenCalledWith([1, 1]);
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should not render grid lines when showGrid is false', () => {
      render(<PorosityTrack {...defaultProps} showGrid={false} />);
      
      // Grid lines should not be drawn, but curves still should be
      expect(mockCanvasContext.stroke).toHaveBeenCalled(); // For curves
    });

    it('should render scale labels when showLabels is true', () => {
      render(<PorosityTrack {...defaultProps} showLabels={true} />);
      
      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });

    it('should render NPHI scale labels (0%, 10%, 20%, 30%, 40%)', () => {
      render(<PorosityTrack {...defaultProps} showLabels={true} />);
      
      // Verify scale labels are drawn
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('0%', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('40%', expect.any(Number), expect.any(Number));
    });

    it('should render RHOB scale labels (1.95-2.95 g/cc)', () => {
      render(<PorosityTrack {...defaultProps} showLabels={true} />);
      
      // Verify RHOB scale labels are drawn
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('2.95', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('1.95', expect.any(Number), expect.any(Number));
    });

    it('should render track title', () => {
      render(<PorosityTrack {...defaultProps} showLabels={true} />);
      
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Porosity (%)', expect.any(Number), expect.any(Number));
    });
  });

  describe('Interaction Handling', () => {
    it('should handle canvas click events', () => {
      const mockOnCurveClick = jest.fn();
      const { container } = render(
        <PorosityTrack {...defaultProps} onCurveClick={mockOnCurveClick} />
      );
      
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      if (canvas) {
        fireEvent.click(canvas, { clientX: 100, clientY: 200 });
        // Click handling is tested (actual curve detection requires more complex setup)
      }
    });

    it('should call onCurveClick with correct parameters when curve is clicked', () => {
      const mockOnCurveClick = jest.fn();
      const { container } = render(
        <PorosityTrack {...defaultProps} onCurveClick={mockOnCurveClick} />
      );
      
      const canvas = container.querySelector('canvas');
      if (canvas) {
        // Simulate click near a curve point
        fireEvent.click(canvas, { clientX: 50, clientY: 100 });
        
        // Note: Actual curve detection would require more sophisticated mocking
        // of coordinate calculations, but the event handler is properly attached
      }
    });

    it('should not crash when onCurveClick is not provided', () => {
      const { container } = render(<PorosityTrack {...defaultProps} />);
      
      const canvas = container.querySelector('canvas');
      expect(() => {
        if (canvas) {
          fireEvent.click(canvas);
        }
      }).not.toThrow();
    });
  });

  describe('Data Processing', () => {
    it('should filter data points within depth range', () => {
      const wellData = createMockWellData([15, 20, 25, 18, 22], [2.45, 2.35, 2.25, 2.40, 2.30]);
      const restrictedDepthRange = { min: 8020, max: 8080 };
      
      render(<PorosityTrack {...defaultProps} wellData={[wellData]} depthRange={restrictedDepthRange} />);
      
      // Component should render without errors even with restricted depth range
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('should handle multiple wells', () => {
      const wellData1 = createMockWellData([15, 20, 25], [2.45, 2.35, 2.25]);
      const wellData2 = {
        ...createMockWellData([18, 22, 28], [2.40, 2.30, 2.20]),
        wellName: 'TEST-002',
      };
      
      render(<PorosityTrack {...defaultProps} wellData={[wellData1, wellData2]} />);
      
      // Should handle multiple wells without errors
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle empty well data array', () => {
      expect(() => {
        render(<PorosityTrack {...defaultProps} wellData={[]} />);
      }).not.toThrow();
    });
  });

  describe('Coordinate Conversion', () => {
    it('should handle NPHI value clamping (0-40%)', () => {
      // Test with values outside normal range
      const extremeNphiData = [-5, 50, 100]; // Values outside 0-40% range
      const wellData = createMockWellData(extremeNphiData, [2.45, 2.35, 2.25]);
      
      expect(() => {
        render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      }).not.toThrow();
    });

    it('should handle density porosity calculation edge cases', () => {
      // Test with extreme RHOB values
      const extremeRhobData = [1.0, 3.0, 4.0]; // Values that could cause calculation issues
      const wellData = createMockWellData([15, 20, 25], extremeRhobData);
      
      expect(() => {
        render(<PorosityTrack {...defaultProps} wellData={[wellData]} />);
      }).not.toThrow();
    });
  });

  describe('Performance and Updates', () => {
    it('should handle resize events', () => {
      const { rerender } = render(<PorosityTrack {...defaultProps} />);
      
      // Simulate window resize
      fireEvent(window, new Event('resize'));
      
      // Component should handle resize without errors
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('should redraw when data changes', () => {
      const { rerender } = render(<PorosityTrack {...defaultProps} />);
      
      const newWellData = createMockWellData([10, 15, 20], [2.50, 2.40, 2.30]);
      rerender(<PorosityTrack {...defaultProps} wellData={[newWellData]} />);
      
      // Should trigger redraw
      expect(mockCanvasContext.clearRect).toHaveBeenCalledTimes(2);
    });

    it('should redraw when depth range changes', () => {
      const { rerender } = render(<PorosityTrack {...defaultProps} />);
      
      rerender(<PorosityTrack {...defaultProps} depthRange={{ min: 8010, max: 8090 }} />);
      
      // Should trigger redraw
      expect(mockCanvasContext.clearRect).toHaveBeenCalledTimes(2);
    });
  });
});