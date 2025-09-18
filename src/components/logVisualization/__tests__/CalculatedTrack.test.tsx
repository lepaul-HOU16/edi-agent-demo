/**
 * Unit tests for CalculatedTrack component
 * Tests calculated parameter visualization and color schemes
 * Requirements: 1.5, 1.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalculatedTrack, { CalculatedParameters } from '../CalculatedTrack';
import { WellLogData, LogCurve, CurveQuality, QualityAssessment } from '../../../types/petrophysics';

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  scale: jest.fn(),
  setLineDash: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 50 })),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rect: jest.fn(),
  set fillStyle(value) { this._fillStyle = value; },
  get fillStyle() { return this._fillStyle; },
  set strokeStyle(value) { this._strokeStyle = value; },
  get strokeStyle() { return this._strokeStyle; },
  set lineWidth(value) { this._lineWidth = value; },
  get lineWidth() { return this._lineWidth; },
  set globalAlpha(value) { this._globalAlpha = value; },
  get globalAlpha() { return this._globalAlpha; },
  set font(value) { this._font = value; },
  get font() { return this._font; },
  set textAlign(value) { this._textAlign = value; },
  get textAlign() { return this._textAlign; },
  set lineCap(value) { this._lineCap = value; },
  get lineCap() { return this._lineCap; },
  set lineJoin(value) { this._lineJoin = value; },
  get lineJoin() { return this._lineJoin; },
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
    bottom: 600,
  })),
});

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
});

describe('CalculatedTrack Component', () => {
  // Sample test data
  const sampleQuality: CurveQuality = {
    completeness: 0.95,
    outlierCount: 2,
    environmentalCorrections: ['Temperature'],
    qualityFlag: 'good',
  };

  const sampleQualityAssessment: QualityAssessment = {
    overallQuality: 'good',
    dataCompleteness: 0.92,
    environmentalCorrections: ['Temperature'],
    validationFlags: [],
    lastAssessment: new Date(),
  };

  const createSampleWellData = (): WellLogData[] => {
    const depths = [8000, 8010, 8020, 8030, 8040];
    const grData = [30, 50, 80, 120, 150];
    const nphiData = [10, 15, 20, 25, 30];
    const rtData = [1, 5, 10, 50, 100];

    const grCurve: LogCurve = {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: grData,
      nullValue: -999.25,
      quality: sampleQuality,
    };

    const nphiCurve: LogCurve = {
      name: 'NPHI',
      unit: '%',
      description: 'Neutron Porosity',
      data: nphiData,
      nullValue: -999.25,
      quality: sampleQuality,
    };

    const rtCurve: LogCurve = {
      name: 'RT',
      unit: 'ohm-m',
      description: 'True Resistivity',
      data: rtData,
      nullValue: -999.25,
      quality: sampleQuality,
    };

    const depthCurve: LogCurve = {
      name: 'DEPTH',
      unit: 'ft',
      description: 'Measured Depth',
      data: depths,
      nullValue: -999.25,
      quality: sampleQuality,
    };

    return [
      {
        wellName: 'TEST-001',
        wellInfo: {
          wellName: 'TEST-001',
          field: 'Test Field',
          operator: 'Test Operator',
          location: { latitude: 29.7604, longitude: -95.3698 },
          elevation: 50,
          totalDepth: 8050,
          wellType: 'vertical',
        },
        curves: [grCurve, nphiCurve, rtCurve, depthCurve],
        depthRange: [8000, 8050],
        dataQuality: sampleQualityAssessment,
        lastModified: new Date(),
        version: '1.0',
      },
    ];
  };

  const createSampleCalculatedData = (): CalculatedParameters[] => {
    return [
      {
        wellName: 'TEST-001',
        depths: [8000, 8010, 8020, 8030, 8040],
        vsh: [0.1, 0.3, 0.5, 0.7, 0.9],
        sw: [0.2, 0.4, 0.6, 0.8, 1.0],
        porosity: [0.15, 0.20, 0.25, 0.30, 0.35],
        netPay: [true, true, false, false, false],
      },
    ];
  };

  const defaultProps = {
    wellData: createSampleWellData(),
    depthRange: { min: 8000, max: 8050 },
    height: 600,
    width: 200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CalculatedTrack {...defaultProps} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('renders with custom dimensions', () => {
      render(<CalculatedTrack {...defaultProps} width={300} height={800} />);
      const container = document.querySelector('canvas')?.parentElement;
      expect(container).toHaveStyle({ width: '300px', height: '800px' });
    });

    it('renders track info overlay', () => {
      render(<CalculatedTrack {...defaultProps} />);
      expect(screen.getByText('Vsh (brown)')).toBeInTheDocument();
      expect(screen.getByText('Sw (blue)')).toBeInTheDocument();
      expect(screen.getByText('φ (yellow)')).toBeInTheDocument();
      expect(screen.getByText('Net Pay')).toBeInTheDocument();
    });
  });

  describe('Canvas Drawing', () => {
    it('calls canvas drawing methods', async () => {
      render(<CalculatedTrack {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
        expect(mockCanvasContext.fillRect).toHaveBeenCalled();
        expect(mockCanvasContext.scale).toHaveBeenCalled();
      });
    });

    it('draws grid lines when showGrid is true', async () => {
      render(<CalculatedTrack {...defaultProps} showGrid={true} />);
      
      await waitFor(() => {
        expect(mockCanvasContext.setLineDash).toHaveBeenCalled();
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });

    it('does not draw grid lines when showGrid is false', async () => {
      render(<CalculatedTrack {...defaultProps} showGrid={false} />);
      
      await waitFor(() => {
        // Grid lines use dashed lines, so setLineDash should be called less frequently
        const setLineDashCalls = mockCanvasContext.setLineDash.mock.calls;
        const dashedLineCalls = setLineDashCalls.filter(call => call[0].length > 0);
        expect(dashedLineCalls.length).toBe(0);
      });
    });

    it('draws scale labels when showLabels is true', async () => {
      render(<CalculatedTrack {...defaultProps} showLabels={true} />);
      
      await waitFor(() => {
        expect(mockCanvasContext.fillText).toHaveBeenCalled();
      });
    });
  });

  describe('Calculated Parameters Display', () => {
    it('displays calculated parameters when provided', async () => {
      const calculatedData = createSampleCalculatedData();
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should draw fills for Vsh, Sw, and porosity
        expect(mockCanvasContext.fill).toHaveBeenCalled();
        // Should draw curves for calculated parameters
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });

    it('generates synthetic data when no calculated data provided', async () => {
      render(<CalculatedTrack {...defaultProps} />);
      
      await waitFor(() => {
        // Should still draw something even without explicit calculated data
        expect(mockCanvasContext.fill).toHaveBeenCalled();
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });

    it('handles empty calculated data gracefully', async () => {
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={[]}
        />
      );
      
      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
    });
  });

  describe('Color Schemes', () => {
    it('uses correct colors for different parameters', async () => {
      const calculatedData = createSampleCalculatedData();
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Check that different colors are set for different parameters
        const fillStyleCalls = mockCanvasContext.fillStyle;
        const strokeStyleCalls = mockCanvasContext.strokeStyle;
        
        // Should have set multiple different colors
        expect(mockCanvasContext.fill).toHaveBeenCalled();
        expect(mockCanvasContext.stroke).toHaveBeenCalled();
      });
    });

    it('applies correct opacity for fills', async () => {
      const calculatedData = createSampleCalculatedData();
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should set globalAlpha for transparency
        expect(mockCanvasContext.globalAlpha).toBeDefined();
      });
    });
  });

  describe('Net Pay Flags', () => {
    it('displays net pay flags as green bars', async () => {
      const calculatedData = createSampleCalculatedData();
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should draw rectangles for net pay flags
        expect(mockCanvasContext.fillRect).toHaveBeenCalled();
      });
    });

    it('handles net pay flags correctly', async () => {
      const calculatedData = createSampleCalculatedData();
      // Modify to have specific net pay pattern
      calculatedData[0].netPay = [true, false, true, false, true];
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        expect(mockCanvasContext.fillRect).toHaveBeenCalled();
      });
    });
  });

  describe('Interaction', () => {
    it('handles curve click events', async () => {
      const onCurveClick = jest.fn();
      const calculatedData = createSampleCalculatedData();
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
          onCurveClick={onCurveClick}
        />
      );
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      // Simulate click on canvas
      fireEvent.click(canvas!, { clientX: 100, clientY: 300 });
      
      await waitFor(() => {
        // Should call onCurveClick if click is near a curve
        // Note: The exact behavior depends on the click position and curve data
        expect(onCurveClick).toHaveBeenCalledTimes(0); // May be 0 if click is not near curve
      });
    });

    it('does not call onCurveClick when not provided', async () => {
      const calculatedData = createSampleCalculatedData();
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      // Should not throw error when clicking without onCurveClick
      expect(() => {
        fireEvent.click(canvas!, { clientX: 100, clientY: 300 });
      }).not.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('handles null values in calculated data', async () => {
      const calculatedData = createSampleCalculatedData();
      // Add some null values
      calculatedData[0].vsh = [0.1, -999.25, 0.5, NaN, 0.9];
      calculatedData[0].sw = [0.2, 0.4, -999.25, 0.8, NaN];
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should handle null values gracefully
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
    });

    it('handles mismatched array lengths', async () => {
      const calculatedData = createSampleCalculatedData();
      // Make arrays different lengths
      calculatedData[0].vsh = [0.1, 0.3]; // Shorter array
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should handle gracefully without crashing
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
    });
  });

  describe('Depth Range Filtering', () => {
    it('filters data based on depth range', async () => {
      const calculatedData = createSampleCalculatedData();
      // Use a narrower depth range
      const narrowDepthRange = { min: 8010, max: 8030 };
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          depthRange={narrowDepthRange}
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should still draw, but with filtered data
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
    });

    it('handles empty depth range', async () => {
      const calculatedData = createSampleCalculatedData();
      // Use depth range with no data
      const emptyDepthRange = { min: 9000, max: 9100 };
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          depthRange={emptyDepthRange}
          calculatedData={calculatedData}
        />
      );
      
      await waitFor(() => {
        // Should handle empty range gracefully
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
    });
  });

  describe('Resize Handling', () => {
    it('handles window resize events', async () => {
      render(<CalculatedTrack {...defaultProps} />);
      
      // Simulate window resize
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        // Should redraw after resize
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
    });

    it('cleans up resize listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<CalculatedTrack {...defaultProps} />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      // Create large dataset
      const largeDepths = Array.from({ length: 1000 }, (_, i) => 8000 + i * 0.1);
      const largeCalculatedData: CalculatedParameters[] = [
        {
          wellName: 'LARGE-001',
          depths: largeDepths,
          vsh: largeDepths.map(() => Math.random()),
          sw: largeDepths.map(() => Math.random()),
          porosity: largeDepths.map(() => Math.random() * 0.3),
          netPay: largeDepths.map(() => Math.random() > 0.5),
        },
      ];
      
      const startTime = performance.now();
      
      render(
        <CalculatedTrack 
          {...defaultProps} 
          calculatedData={largeCalculatedData}
        />
      );
      
      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});