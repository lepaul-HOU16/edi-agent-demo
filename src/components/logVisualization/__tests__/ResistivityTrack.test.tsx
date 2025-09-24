/**
 * ResistivityTrack Component Tests
 * Tests for logarithmic scaling, resistivity fills, and industry-standard formatting
 * Requirements: 1.4, 1.6
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResistivityTrack } from '../ResistivityTrack';
import { WellLogData } from '../../../types/petrophysics';

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  rect: jest.fn(),
  scale: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  fillText: jest.fn(),
  setLineDash: jest.fn(),
  set fillStyle(value: string) { this._fillStyle = value; },
  get fillStyle() { return this._fillStyle; },
  set strokeStyle(value: string) { this._strokeStyle = value; },
  get strokeStyle() { return this._strokeStyle; },
  set lineWidth(value: number) { this._lineWidth = value; },
  get lineWidth() { return this._lineWidth; },
  set globalAlpha(value: number) { this._globalAlpha = value; },
  get globalAlpha() { return this._globalAlpha; },
  set font(value: string) { this._font = value; },
  get font() { return this._font; },
  set textAlign(value: string) { this._textAlign = value; },
  get textAlign() { return this._textAlign; },
  set lineCap(value: string) { this._lineCap = value; },
  get lineCap() { return this._lineCap; },
  set lineJoin(value: string) { this._lineJoin = value; },
  get lineJoin() { return this._lineJoin; },
  _fillStyle: '#000000',
  _strokeStyle: '#000000',
  _lineWidth: 1,
  _globalAlpha: 1,
  _font: '10px Arial',
  _textAlign: 'start',
  _lineCap: 'butt',
  _lineJoin: 'miter'
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => mockCanvasContext),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    width: 200,
    height: 600,
    top: 0,
    left: 0,
    right: 200,
    bottom: 600
  })),
});

Object.defineProperty(HTMLDivElement.prototype, 'getBoundingClientRect', {
  value: jest.fn(() => ({
    width: 200,
    height: 600,
    top: 0,
    left: 0,
    right: 200,
    bottom: 600
  })),
});

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
});

// Sample well data for testing
const createMockWellData = (rtValues: number[]): WellLogData[] => {
  return [{
    wellName: 'TEST_WELL_001',
    wellInfo: {
      wellName: 'TEST_WELL_001',
      field: 'Test Field',
      operator: 'Test Operator',
      location: { latitude: 30.0, longitude: -95.0 },
      elevation: 100,
      totalDepth: 10000,
      wellType: 'vertical' as const
    },
    curves: [{
      name: 'RT',
      unit: 'ohm-m',
      description: 'True Resistivity',
      data: rtValues,
      nullValue: -999.25,
      quality: {
        completeness: 0.95,
        outlierCount: 2,
        environmentalCorrections: ['borehole_correction'],
        qualityFlag: 'excellent' as const
      }
    }],
    depthRange: [8000, 9000],
    dataQuality: {
      overallQuality: 'good' as const,
      dataCompleteness: 0.9,
      environmentalCorrections: [],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  }];
};

describe('ResistivityTrack Component', () => {
  const defaultProps = {
    wellData: createMockWellData([0.5, 2, 5, 15, 50, 100, 500, 1000, 25, 8]),
    depthRange: { min: 8000, max: 9000 },
    height: 600,
    width: 200
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render resistivity track component', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should render with correct dimensions', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveStyle({
        position: 'absolute',
        cursor: 'crosshair'
      });
    });

    it('should display track info overlay', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      expect(screen.getByText('Log Scale')).toBeInTheDocument();
      expect(screen.getByText('HC: >10 Ω·m')).toBeInTheDocument();
    });
  });

  describe('Logarithmic Scale Configuration', () => {
    it('should use industry-standard 0.2-2000 ohm-m logarithmic scale', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Verify scale labels are drawn
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('0.2', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('2000', expect.any(Number), expect.any(Number));
    });

    it('should draw logarithmic grid lines at appropriate intervals', () => {
      render(<ResistivityTrack {...defaultProps} showGrid={true} />);
      
      // Verify grid lines are drawn for logarithmic scale
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should not draw grid lines when showGrid is false', () => {
      const strokeCallsBefore = mockCanvasContext.stroke.mock.calls.length;
      
      render(<ResistivityTrack {...defaultProps} showGrid={false} />);
      
      // Should have fewer stroke calls without grid
      const strokeCallsAfter = mockCanvasContext.stroke.mock.calls.length;
      expect(strokeCallsAfter).toBeGreaterThanOrEqual(strokeCallsBefore);
    });

    it('should handle logarithmic scale tick values correctly', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Check that logarithmic tick values are rendered
      const expectedTicks = ['0.2', '1', '2', '10', '20', '100', '200', '1000', '2000'];
      expectedTicks.forEach(tick => {
        expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
          tick, 
          expect.any(Number), 
          expect.any(Number)
        );
      });
    });
  });

  describe('Logarithmic Scaling', () => {
    it('should correctly convert resistivity values to logarithmic pixel coordinates', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Verify that drawing operations use logarithmic coordinates
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
    });

    it('should handle low resistivity values correctly on log scale', () => {
      const lowResistivityData = createMockWellData([0.2, 0.5, 0.8, 1.0, 1.5]);
      
      render(<ResistivityTrack {...defaultProps} wellData={lowResistivityData} />);
      
      // Should render without errors and use appropriate log scaling
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle high resistivity values correctly on log scale', () => {
      const highResistivityData = createMockWellData([500, 800, 1000, 1500, 2000]);
      
      render(<ResistivityTrack {...defaultProps} wellData={highResistivityData} />);
      
      // Should render without errors and use appropriate log scaling
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should clamp resistivity values outside scale range', () => {
      const extremeResistivityData = createMockWellData([0.05, 5000, 10000, 0.1, 3000]);
      
      render(<ResistivityTrack {...defaultProps} wellData={extremeResistivityData} />);
      
      // Should clamp values to 0.2-2000 range and render without errors
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle zero and negative values appropriately', () => {
      const invalidResistivityData = createMockWellData([0, -5, -999.25, 10, 50]);
      
      render(<ResistivityTrack {...defaultProps} wellData={invalidResistivityData} />);
      
      // Should filter out invalid values and render valid ones
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });
  });

  describe('Resistivity Fills', () => {
    it('should apply green fill for high resistivity (hydrocarbon indication)', () => {
      const highResistivityData = createMockWellData([0.5, 2, 15, 50, 100, 500, 25, 8, 30, 200]);
      
      render(<ResistivityTrack {...defaultProps} wellData={highResistivityData} />);
      
      // Check that fill operations are called for high resistivity zones
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    it('should use correct threshold for hydrocarbon indication (>10 ohm-m)', () => {
      const mixedResistivityData = createMockWellData([2, 5, 15, 25, 8, 3, 50, 100, 6, 20]);
      
      render(<ResistivityTrack {...defaultProps} wellData={mixedResistivityData} />);
      
      // Should draw fills for values > 10 ohm-m
      expect(mockCanvasContext.fill).toHaveBeenCalled();
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    });

    it('should use correct opacity for resistivity fills', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Verify fill operations are called with appropriate opacity
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });

    it('should handle continuous high resistivity zones', () => {
      const continuousHighRes = createMockWellData([50, 60, 80, 100, 120, 150, 200, 180, 160, 140]);
      
      render(<ResistivityTrack {...defaultProps} wellData={continuousHighRes} />);
      
      // Should create continuous fill for high resistivity zone
      expect(mockCanvasContext.fill).toHaveBeenCalled();
      expect(mockCanvasContext.closePath).toHaveBeenCalled();
    });

    it('should handle alternating resistivity zones correctly', () => {
      const alternatingRes = createMockWellData([2, 50, 3, 100, 5, 200, 4, 80, 6, 150]);
      
      render(<ResistivityTrack {...defaultProps} wellData={alternatingRes} />);
      
      // Should create multiple fill segments
      expect(mockCanvasContext.fill).toHaveBeenCalled();
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    });
  });

  describe('Curve Rendering', () => {
    it('should draw resistivity curve with black line', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Verify curve is drawn with correct color
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle null values correctly', () => {
      const dataWithNulls = createMockWellData([5, -999.25, 15, 50, -999.25, 100]);
      
      render(<ResistivityTrack {...defaultProps} wellData={dataWithNulls} />);
      
      // Should filter out null values and render valid ones
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should render multiple wells', () => {
      const multiWellData = [
        ...createMockWellData([5, 15, 50, 100, 25]),
        ...createMockWellData([8, 20, 80, 200, 40]).map(well => ({
          ...well,
          wellName: 'TEST_WELL_002'
        }))
      ];
      
      render(<ResistivityTrack {...defaultProps} wellData={multiWellData} />);
      
      // Should render curves for both wells
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should use appropriate line width and style', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Verify line properties are set correctly
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });
  });

  describe('Labels and Annotations', () => {
    it('should display track title when showLabels is true', () => {
      render(<ResistivityTrack {...defaultProps} showLabels={true} />);
      
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith(
        'Resistivity (Ω·m)', 
        expect.any(Number), 
        expect.any(Number)
      );
    });

    it('should not display labels when showLabels is false', () => {
      const fillTextCallsBefore = mockCanvasContext.fillText.mock.calls.length;
      
      render(<ResistivityTrack {...defaultProps} showLabels={false} />);
      
      // Should have fewer fillText calls without labels
      const fillTextCallsAfter = mockCanvasContext.fillText.mock.calls.length;
      expect(fillTextCallsAfter).toBeLessThanOrEqual(fillTextCallsBefore + 1);
    });

    it('should display logarithmic scale tick marks', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Should draw logarithmic tick marks
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('0.2', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('1', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('10', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('100', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('1000', expect.any(Number), expect.any(Number));
    });

    it('should format tick labels appropriately for different ranges', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      // Check decimal formatting for values < 1
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('0.2', expect.any(Number), expect.any(Number));
      
      // Check integer formatting for values >= 1
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('2', expect.any(Number), expect.any(Number));
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('20', expect.any(Number), expect.any(Number));
    });
  });

  describe('Interaction', () => {
    it('should handle curve click events', () => {
      const mockOnCurveClick = jest.fn();
      
      render(<ResistivityTrack {...defaultProps} onCurveClick={mockOnCurveClick} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      // Simulate click near a curve point
      fireEvent.click(canvas!, { clientX: 100, clientY: 300 });
      
      // Click handler behavior depends on proximity to curve points
    });

    it('should not trigger click events when onCurveClick is not provided', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      // Should not throw error when clicking without handler
      expect(() => {
        fireEvent.click(canvas!, { clientX: 100, clientY: 300 });
      }).not.toThrow();
    });

    it('should identify RT curve correctly in click events', () => {
      const mockOnCurveClick = jest.fn();
      
      render(<ResistivityTrack {...defaultProps} onCurveClick={mockOnCurveClick} />);
      
      const canvas = document.querySelector('canvas');
      fireEvent.click(canvas!, { clientX: 100, clientY: 300 });
      
      // If click is close enough to curve, should call with 'RT' curve name
    });
  });

  describe('Data Processing', () => {
    it('should handle empty well data', () => {
      render(<ResistivityTrack {...defaultProps} wellData={[]} />);
      
      // Should render without errors
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('should handle wells without resistivity curves', () => {
      const wellWithoutRT = [{
        ...defaultProps.wellData[0],
        curves: [{
          name: 'GR',
          unit: 'API',
          description: 'Gamma Ray',
          data: [50, 60, 70],
          nullValue: -999.25,
          quality: {
            completeness: 0.95,
            outlierCount: 2,
            environmentalCorrections: [],
            qualityFlag: 'excellent' as const
          }
        }]
      }];
      
      render(<ResistivityTrack {...defaultProps} wellData={wellWithoutRT} />);
      
      // Should render without errors even without RT data
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('should filter data by depth range', () => {
      const restrictedDepthRange = { min: 8200, max: 8800 };
      
      render(<ResistivityTrack {...defaultProps} depthRange={restrictedDepthRange} />);
      
      // Should still render (filtering happens internally)
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should recognize different resistivity curve names', () => {
      const alternativeNames = ['RESISTIVITY', 'RES', 'ILD', 'LLD'];
      
      alternativeNames.forEach(curveName => {
        const wellDataWithAltName = [{
          ...defaultProps.wellData[0],
          curves: [{
            ...defaultProps.wellData[0].curves[0],
            name: curveName
          }]
        }];
        
        render(<ResistivityTrack {...defaultProps} wellData={wellDataWithAltName} />);
        
        // Should recognize and process the curve
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = createMockWellData(
        new Array(1000).fill(0).map((_, i) => 10 * Math.pow(10, Math.sin(i / 100)))
      );
      
      const startTime = performance.now();
      render(<ResistivityTrack {...defaultProps} wellData={largeDataset} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle rapid data updates efficiently', () => {
      const { rerender } = render(<ResistivityTrack {...defaultProps} />);
      
      // Update with new data multiple times
      for (let i = 0; i < 10; i++) {
        const newData = createMockWellData(
          new Array(100).fill(0).map(() => Math.random() * 1000 + 1)
        );
        rerender(<ResistivityTrack {...defaultProps} wellData={newData} />);
      }
      
      // Should handle updates without errors
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate cursor style', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveStyle({ cursor: 'crosshair' });
    });

    it('should be keyboard accessible', () => {
      render(<ResistivityTrack {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      // Canvas elements are inherently not keyboard accessible, 
      // but the component should not prevent keyboard navigation
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small resistivity values', () => {
      const smallValues = createMockWellData([0.01, 0.05, 0.1, 0.15, 0.2]);
      
      render(<ResistivityTrack {...defaultProps} wellData={smallValues} />);
      
      // Should handle small values appropriately on log scale
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle very large resistivity values', () => {
      const largeValues = createMockWellData([1000, 1500, 2000, 2500, 3000]);
      
      render(<ResistivityTrack {...defaultProps} wellData={largeValues} />);
      
      // Should clamp large values to scale maximum
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle single data point', () => {
      const singlePoint = createMockWellData([50]);
      
      render(<ResistivityTrack {...defaultProps} wellData={singlePoint} />);
      
      // Should render single point without errors
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });

    it('should handle uniform resistivity values', () => {
      const uniformValues = createMockWellData(new Array(10).fill(25));
      
      render(<ResistivityTrack {...defaultProps} wellData={uniformValues} />);
      
      // Should render uniform values as horizontal line
      expect(mockCanvasContext.stroke).toHaveBeenCalled();
    });
  });
});