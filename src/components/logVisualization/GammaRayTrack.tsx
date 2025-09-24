/**
 * GammaRayTrack Component - Industry-standard gamma ray track with proper formatting
 * Requirements: 1.2, 1.6
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { WellLogData } from '../../types/petrophysics';
import { DepthRange } from './LogPlotViewer';

export interface GammaRayTrackProps {
  wellData: WellLogData[];
  depthRange: DepthRange;
  height: number;
  width?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  onCurveClick?: (curveName: string, wellName: string) => void;
}

// Industry-standard gamma ray track configuration
const GR_TRACK_CONFIG = {
  scale: {
    min: 0,
    max: 150, // API units
    gridLines: true,
    tickInterval: 25
  },
  fills: [
    {
      type: 'threshold' as const,
      threshold: 75, // Clean sand/shale cutoff
      cleanSandColor: '#90EE90', // Light green for clean sand (GR < 75 API)
      cleanSandOpacity: 0.3,
      shaleColor: '#8B4513', // Brown for shale (GR > 75 API)
      shaleOpacity: 0.3
    }
  ],
  curve: {
    color: '#000000', // Black line for GR curve
    lineWidth: 1.5,
    name: 'GR'
  }
};

export const GammaRayTrack: React.FC<GammaRayTrackProps> = ({
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

  // Process gamma ray curve data
  const grData = useMemo(() => {
    const result: Array<{
      wellName: string;
      points: Array<{ depth: number; value: number }>;
    }> = [];

    wellData.forEach(well => {
      const grCurve = well.curves.find(c => 
        c.name.toUpperCase() === 'GR' || 
        c.name.toUpperCase() === 'GAMMA' ||
        c.name.toUpperCase() === 'GAMMARAY'
      );
      
      if (!grCurve) return;

      // Create depth array - assuming uniform spacing
      const depthStep = (well.depthRange[1] - well.depthRange[0]) / (grCurve.data.length - 1);
      const points = grCurve.data
        .map((value, index) => ({
          depth: well.depthRange[0] + index * depthStep,
          value: value === grCurve.nullValue ? NaN : value
        }))
        .filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value)
        );

      result.push({
        wellName: well.wellName,
        points
      });
    });

    return result;
  }, [wellData, depthRange]);

  // Canvas drawing function
  const drawGammaRayTrack = () => {
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
    grData.forEach(wellData => {
      drawGammaRayFills(ctx, wellData, rect.width, rect.height);
    });

    // Draw gamma ray curves
    grData.forEach(wellData => {
      drawGammaRayCurve(ctx, wellData, rect.width, rect.height);
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

    // Vertical grid lines (GR scale)
    const grStep = GR_TRACK_CONFIG.scale.tickInterval;
    const tickCount = Math.floor(GR_TRACK_CONFIG.scale.max / grStep);
    
    for (let i = 0; i <= tickCount; i++) {
      const grValue = i * grStep;
      const x = grValueToPixel(grValue, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Draw gamma ray fills (clean sand vs shale)
  const drawGammaRayFills = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    if (wellData.points.length === 0) return;

    const threshold = GR_TRACK_CONFIG.fills[0].threshold;
    
    // Draw clean sand fill (GR < 75 API)
    ctx.fillStyle = GR_TRACK_CONFIG.fills[0].cleanSandColor;
    ctx.globalAlpha = GR_TRACK_CONFIG.fills[0].cleanSandOpacity;
    
    drawThresholdFill(ctx, wellData, threshold, 'below', width, height);
    
    // Draw shale fill (GR > 75 API)
    ctx.fillStyle = GR_TRACK_CONFIG.fills[0].shaleColor;
    ctx.globalAlpha = GR_TRACK_CONFIG.fills[0].shaleOpacity;
    
    drawThresholdFill(ctx, wellData, threshold, 'above', width, height);
    
    ctx.globalAlpha = 1.0;
  };

  // Draw threshold-based fill
  const drawThresholdFill = (
    ctx: CanvasRenderingContext2D,
    wellData: any,
    threshold: number,
    fillType: 'above' | 'below',
    width: number,
    height: number
  ) => {
    const thresholdX = grValueToPixel(threshold, width);
    
    ctx.beginPath();
    
    let pathStarted = false;
    
    for (let i = 0; i < wellData.points.length; i++) {
      const point = wellData.points[i];
      const x = grValueToPixel(point.value, width);
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
        // Close current path and start new one if needed
        ctx.lineTo(thresholdX, depthToPixel(wellData.points[i-1].depth, height));
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        pathStarted = false;
      }
    }
    
    // Close final path if still open
    if (pathStarted && wellData.points.length > 0) {
      const lastPoint = wellData.points[wellData.points.length - 1];
      ctx.lineTo(thresholdX, depthToPixel(lastPoint.depth, height));
      ctx.closePath();
      ctx.fill();
    }
  };

  // Draw gamma ray curve
  const drawGammaRayCurve = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    if (wellData.points.length === 0) return;

    ctx.strokeStyle = GR_TRACK_CONFIG.curve.color;
    ctx.lineWidth = GR_TRACK_CONFIG.curve.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    wellData.points.forEach((point: any, index: number) => {
      const x = grValueToPixel(point.value, width);
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

    const grStep = GR_TRACK_CONFIG.scale.tickInterval;
    const tickCount = Math.floor(GR_TRACK_CONFIG.scale.max / grStep);
    
    for (let i = 0; i <= tickCount; i++) {
      const grValue = i * grStep;
      const x = grValueToPixel(grValue, width);
      
      ctx.fillText(grValue.toString(), x, height - 5);
    }

    // Track title at top
    ctx.save();
    ctx.translate(width / 2, 15);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Gamma Ray (API)', 0, 0);
    ctx.restore();

    // Scale unit label
    ctx.fillStyle = '#666666';
    ctx.font = '9px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('0', grValueToPixel(0, width) - 2, height - 5);
    ctx.textAlign = 'left';
    ctx.fillText('150', grValueToPixel(150, width) + 2, height - 5);
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

  const grValueToPixel = (grValue: number, width: number): number => {
    // Clamp GR value to scale range
    const clampedValue = Math.max(GR_TRACK_CONFIG.scale.min, 
                                 Math.min(GR_TRACK_CONFIG.scale.max, grValue));
    
    const ratio = (clampedValue - GR_TRACK_CONFIG.scale.min) / 
                  (GR_TRACK_CONFIG.scale.max - GR_TRACK_CONFIG.scale.min);
    
    return ratio * width;
  };

  // Handle canvas click for curve selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCurveClick || grData.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find closest curve point
    let closestWell: string | null = null;
    let minDistance = Infinity;

    grData.forEach(wellData => {
      wellData.points.forEach(point => {
        const pointX = grValueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) { // 20px tolerance
          minDistance = distance;
          closestWell = wellData.wellName;
        }
      });
    });

    if (closestWell) {
      onCurveClick('GR', closestWell);
    }
  };

  // Redraw when data changes
  useEffect(() => {
    drawGammaRayTrack();
  }, [grData, depthRange, height, width, showGrid, showLabels]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawGammaRayTrack, 100); // Debounce resize
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
          Clean: &lt;75 API
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Shale: &gt;75 API
        </Typography>
      </Box>
    </Box>
  );
};

export default GammaRayTrack;