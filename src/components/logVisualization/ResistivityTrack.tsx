/**
 * ResistivityTrack Component - Industry-standard resistivity track with logarithmic scale
 * Requirements: 1.4, 1.6
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { WellLogData } from '../../types/petrophysics';
import { DepthRange } from './LogPlotViewer';

export interface ResistivityTrackProps {
  wellData: WellLogData[];
  depthRange: DepthRange;
  height: number;
  width?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  onCurveClick?: (curveName: string, wellName: string) => void;
}

// Industry-standard resistivity track configuration
const RESISTIVITY_TRACK_CONFIG = {
  scale: {
    min: 0.2,
    max: 2000, // ohm-m
    logarithmic: true,
    gridLines: true,
    tickValues: [0.2, 1, 2, 10, 20, 100, 200, 1000, 2000] // Log scale tick marks
  },
  fills: [
    {
      type: 'high_resistivity' as const,
      threshold: 10, // ohm-m - typical hydrocarbon indication threshold
      color: '#90EE90', // Light green for high resistivity (hydrocarbon indication)
      opacity: 0.4
    }
  ],
  curve: {
    color: '#000000', // Black line for RT curve
    lineWidth: 1.5,
    name: 'RT'
  }
};

export const ResistivityTrack: React.FC<ResistivityTrackProps> = ({
  wellData,
  depthRange,
  height,
  width = 200,
  showGrid = true,
  showLabels = true,
  onCurveClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process resistivity curve data
  const resistivityData = useMemo(() => {
    const result: Array<{
      wellName: string;
      points: Array<{ depth: number; value: number }>;
    }> = [];

    wellData.forEach(well => {
      const rtCurve = well.curves.find(c => 
        c.name.toUpperCase() === 'RT' || 
        c.name.toUpperCase() === 'RESISTIVITY' ||
        c.name.toUpperCase() === 'RES' ||
        c.name.toUpperCase() === 'ILD' ||
        c.name.toUpperCase() === 'LLD'
      );
      
      if (!rtCurve) return;

      // Create depth array - assuming uniform spacing
      const depthStep = (well.depthRange[1] - well.depthRange[0]) / (rtCurve.data.length - 1);
      const points = rtCurve.data
        .map((value, index) => ({
          depth: well.depthRange[0] + index * depthStep,
          value: value === rtCurve.nullValue ? NaN : Math.max(0.01, value) // Ensure positive values for log scale
        }))
        .filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value) &&
          point.value > 0 // Valid for log scale
        );

      result.push({
        wellName: well.wellName,
        points
      });
    });

    return result;
  }, [wellData, depthRange]);

  // Canvas drawing function
  const drawResistivityTrack = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid lines if enabled
    if (showGrid) {
      drawGridLines(ctx, rect.width, rect.height);
    }

    // Draw fills for each well
    resistivityData.forEach(wellData => {
      drawResistivityFills(ctx, wellData, rect.width, rect.height);
    });

    // Draw resistivity curves
    resistivityData.forEach(wellData => {
      drawResistivityCurve(ctx, wellData, rect.width, rect.height);
    });

    // Draw scale labels
    if (showLabels) {
      drawScaleLabels(ctx, rect.width, rect.height);
    }

    // Draw track border
    drawTrackBorder(ctx, rect.width, rect.height);
  };

  // Draw grid lines
  const drawGridLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 1]);

    // Horizontal grid lines (depth)
    const depthStep = (depthRange.max - depthRange.min) / 10;
    for (let i = 0; i <= 10; i++) {
      const depth = depthRange.min + i * depthStep;
      const y = depthToPixel(depth, height);
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines (logarithmic resistivity scale)
    RESISTIVITY_TRACK_CONFIG.scale.tickValues.forEach(tickValue => {
      const x = resistivityValueToPixel(tickValue, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  };

  // Draw resistivity fills (high resistivity indication)
  const drawResistivityFills = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    if (wellData.points.length === 0) return;

    const threshold = RESISTIVITY_TRACK_CONFIG.fills[0].threshold;
    
    // Draw high resistivity fill (RT > threshold)
    ctx.fillStyle = RESISTIVITY_TRACK_CONFIG.fills[0].color;
    ctx.globalAlpha = RESISTIVITY_TRACK_CONFIG.fills[0].opacity;
    
    drawThresholdFill(ctx, wellData, threshold, 'above', width, height);
    
    ctx.globalAlpha = 1.0;
  };

  // Draw threshold-based fill for high resistivity
  const drawThresholdFill = (
    ctx: CanvasRenderingContext2D,
    wellData: any,
    threshold: number,
    fillType: 'above' | 'below',
    width: number,
    height: number
  ) => {
    const thresholdX = resistivityValueToPixel(threshold, width);
    const maxX = resistivityValueToPixel(RESISTIVITY_TRACK_CONFIG.scale.max, width);
    
    ctx.beginPath();
    
    let pathStarted = false;
    
    for (let i = 0; i < wellData.points.length; i++) {
      const point = wellData.points[i];
      const x = resistivityValueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      const shouldFill = fillType === 'above' ? point.value > threshold : point.value < threshold;
      
      if (shouldFill) {
        if (!pathStarted) {
          ctx.moveTo(thresholdX, y);
          ctx.lineTo(x, y);
          pathStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else if (pathStarted) {
        // Close current path and fill to threshold line
        const prevY = i > 0 ? depthToPixel(wellData.points[i-1].depth, height) : y;
        ctx.lineTo(thresholdX, prevY);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        pathStarted = false;
      }
    }
    
    // Close final path if still open
    if (pathStarted && wellData.points.length > 0) {
      const lastPoint = wellData.points[wellData.points.length - 1];
      const lastY = depthToPixel(lastPoint.depth, height);
      ctx.lineTo(thresholdX, lastY);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Draw resistivity curve
  const drawResistivityCurve = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    if (wellData.points.length === 0) return;

    ctx.strokeStyle = RESISTIVITY_TRACK_CONFIG.curve.color;
    ctx.lineWidth = RESISTIVITY_TRACK_CONFIG.curve.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    wellData.points.forEach((point: any, index: number) => {
      const x = resistivityValueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };

  // Draw scale labels
  const drawScaleLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Scale labels at bottom
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    RESISTIVITY_TRACK_CONFIG.scale.tickValues.forEach(tickValue => {
      const x = resistivityValueToPixel(tickValue, width);
      
      // Format tick labels appropriately
      let label: string;
      if (tickValue < 1) {
        label = tickValue.toFixed(1);
      } else if (tickValue < 10) {
        label = tickValue.toString();
      } else {
        label = tickValue.toString();
      }
      
      ctx.fillText(label, x, height - 5);
    });

    // Track title at top
    ctx.save();
    ctx.translate(width / 2, 15);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Resistivity (Ω·m)', 0, 0);
    ctx.restore();

    // Scale range labels
    ctx.fillStyle = '#666666';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('0.2', resistivityValueToPixel(0.2, width) + 2, height - 15);
    ctx.textAlign = 'right';
    ctx.fillText('2000', resistivityValueToPixel(2000, width) - 2, height - 15);
  };

  // Draw track border
  const drawTrackBorder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.stroke();
  };

  // Helper functions for coordinate conversion
  const depthToPixel = (depth: number, height: number): number => {
    const ratio = (depth - depthRange.min) / (depthRange.max - depthRange.min);
    return ratio * height;
  };

  const resistivityValueToPixel = (resistivityValue: number, width: number): number => {
    // Clamp resistivity value to scale range
    const clampedValue = Math.max(RESISTIVITY_TRACK_CONFIG.scale.min, 
                                 Math.min(RESISTIVITY_TRACK_CONFIG.scale.max, resistivityValue));
    
    // Logarithmic scaling
    const logMin = Math.log10(RESISTIVITY_TRACK_CONFIG.scale.min);
    const logMax = Math.log10(RESISTIVITY_TRACK_CONFIG.scale.max);
    const logValue = Math.log10(clampedValue);
    
    const ratio = (logValue - logMin) / (logMax - logMin);
    
    return ratio * width;
  };

  const pixelToResistivityValue = (x: number, width: number): number => {
    const ratio = x / width;
    const logMin = Math.log10(RESISTIVITY_TRACK_CONFIG.scale.min);
    const logMax = Math.log10(RESISTIVITY_TRACK_CONFIG.scale.max);
    const logValue = logMin + ratio * (logMax - logMin);
    
    return Math.pow(10, logValue);
  };

  // Handle canvas click for curve selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCurveClick || resistivityData.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find closest curve point
    let closestWell: string | null = null;
    let minDistance = Infinity;

    resistivityData.forEach(wellData => {
      wellData.points.forEach(point => {
        const pointX = resistivityValueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) { // 20px tolerance
          minDistance = distance;
          closestWell = wellData.wellName;
        }
      });
    });

    if (closestWell) {
      onCurveClick('RT', closestWell);
    }
  };

  // Redraw when data changes
  useEffect(() => {
    drawResistivityTrack();
  }, [resistivityData, depthRange, height, width, showGrid, showLabels]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawResistivityTrack, 100); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: width, 
        height: height, 
        position: 'relative',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider'
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'crosshair'
        }}
      />
      
      {/* Track info overlay */}
      <Box sx={{
        position: 'absolute',
        top: 30,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '2px 6px',
        borderRadius: 1,
        fontSize: '0.7rem'
      }}>
        <Typography variant="caption" color="text.secondary">
          Log Scale
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          HC: &gt;10 Ω·m
        </Typography>
      </Box>
    </Box>
  );
};

export default ResistivityTrack;