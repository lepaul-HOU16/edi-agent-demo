/**
 * TrackRenderer Component - Individual track display with proper scaling
 * Requirements: 1.1, 1.2, 1.6, 1.7
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { WellLogData } from '../../types/petrophysics';
import { TrackConfig, DepthRange } from './LogPlotViewer';
import { CurveVisibility, CurveOverlay } from './CurveSelectionPanel';

export interface TrackRendererProps {
  track: TrackConfig;
  wellData: WellLogData[];
  depthRange: DepthRange;
  height: number;
  selectedCurve?: string | null;
  curveVisibility?: CurveVisibility[];
  overlays?: CurveOverlay[];
  onCurveClick?: (curveName: string, wellName: string) => void;
}

export const TrackRenderer: React.FC<TrackRendererProps> = ({
  track,
  wellData,
  depthRange,
  height,
  selectedCurve,
  curveVisibility = [],
  overlays = [],
  onCurveClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process curve data for rendering
  const processedData = useMemo(() => {
    const result: Array<{
      wellName: string;
      curveName: string;
      points: Array<{ depth: number; value: number }>;
      config: any;
      visibility: CurveVisibility | null;
    }> = [];

    wellData.forEach(well => {
      track.curves.forEach(curveConfig => {
        const curve = well.curves.find(c => c.name === curveConfig.name);
        if (!curve) return;

        // Check visibility
        const visibility = curveVisibility.find(cv => 
          cv.wellName === well.wellName && cv.curveName === curve.name
        );
        
        // Skip if explicitly hidden
        if (visibility && !visibility.visible) return;

        // Create depth array - assuming uniform spacing
        const depthStep = (well.depthRange[1] - well.depthRange[0]) / (curve.data.length - 1);
        const points = curve.data
          .map((value, index) => ({
            depth: well.depthRange[0] + index * depthStep,
            value: value === curve.nullValue ? NaN : value
          }))
          .filter(point => 
            point.depth >= depthRange.min && 
            point.depth <= depthRange.max &&
            !isNaN(point.value)
          );

        result.push({
          wellName: well.wellName,
          curveName: curve.name,
          points,
          config: curveConfig,
          visibility
        });
      });
    });

    return result;
  }, [wellData, track.curves, depthRange, curveVisibility]);

  // Canvas drawing function
  const drawTrack = () => {
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
    if (track.scale.gridLines) {
      drawGridLines(ctx, rect.width, rect.height);
    }

    // Draw fills first (behind curves)
    track.fills.forEach(fill => {
      drawFill(ctx, fill, rect.width, rect.height);
    });

    // Draw curves
    processedData.forEach(curveData => {
      drawCurve(ctx, curveData, rect.width, rect.height);
    });

    // Draw scale labels
    drawScaleLabels(ctx, rect.width, rect.height);
  };

  // Draw grid lines
  const drawGridLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

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

    // Vertical grid lines (scale)
    const scaleStep = (track.scale.max - track.scale.min) / 5;
    for (let i = 0; i <= 5; i++) {
      const value = track.scale.min + i * scaleStep;
      const x = valueToPixel(value, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Draw fill areas
  const drawFill = (ctx: CanvasRenderingContext2D, fill: any, width: number, height: number) => {
    const curveData = processedData.find(d => d.curveName === fill.curveName);
    if (!curveData || curveData.points.length === 0) return;

    ctx.fillStyle = fill.color;
    ctx.globalAlpha = fill.opacity;

    switch (fill.type) {
      case 'threshold':
        drawThresholdFill(ctx, curveData, fill.threshold, width, height);
        break;
      case 'above_curve':
        drawAboveCurveFill(ctx, curveData, width, height);
        break;
      case 'below_curve':
        drawBelowCurveFill(ctx, curveData, width, height);
        break;
    }

    ctx.globalAlpha = 1.0;
  };

  // Draw threshold fill
  const drawThresholdFill = (
    ctx: CanvasRenderingContext2D, 
    curveData: any, 
    threshold: number, 
    width: number, 
    height: number
  ) => {
    const thresholdX = valueToPixel(threshold, width);
    
    ctx.beginPath();
    curveData.points.forEach((point: any, index: number) => {
      const x = valueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      if (index === 0) {
        ctx.moveTo(thresholdX, y);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Close the path back to threshold line
    if (curveData.points.length > 0) {
      const lastPoint = curveData.points[curveData.points.length - 1];
      const lastY = depthToPixel(lastPoint.depth, height);
      ctx.lineTo(thresholdX, lastY);
    }
    
    ctx.closePath();
    ctx.fill();
  };

  // Draw above curve fill
  const drawAboveCurveFill = (
    ctx: CanvasRenderingContext2D, 
    curveData: any, 
    width: number, 
    height: number
  ) => {
    ctx.beginPath();
    curveData.points.forEach((point: any, index: number) => {
      const x = valueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      if (index === 0) {
        ctx.moveTo(width, y);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Close to right edge
    if (curveData.points.length > 0) {
      const lastPoint = curveData.points[curveData.points.length - 1];
      const lastY = depthToPixel(lastPoint.depth, height);
      ctx.lineTo(width, lastY);
    }
    
    ctx.closePath();
    ctx.fill();
  };

  // Draw below curve fill
  const drawBelowCurveFill = (
    ctx: CanvasRenderingContext2D, 
    curveData: any, 
    width: number, 
    height: number
  ) => {
    ctx.beginPath();
    curveData.points.forEach((point: any, index: number) => {
      const x = valueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      if (index === 0) {
        ctx.moveTo(0, y);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Close to left edge
    if (curveData.points.length > 0) {
      const lastPoint = curveData.points[curveData.points.length - 1];
      const lastY = depthToPixel(lastPoint.depth, height);
      ctx.lineTo(0, lastY);
    }
    
    ctx.closePath();
    ctx.fill();
  };

  // Draw individual curve
  const drawCurve = (ctx: CanvasRenderingContext2D, curveData: any, width: number, height: number) => {
    if (curveData.points.length === 0) return;

    const isSelected = selectedCurve === curveData.curveName;
    const visibility = curveData.visibility;
    
    // Use visibility settings if available, otherwise use config
    const color = visibility?.color || curveData.config.color;
    const lineWidth = visibility?.lineWidth || curveData.config.lineWidth;
    const opacity = visibility?.opacity || 1.0;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? lineWidth * 1.5 : lineWidth;
    ctx.globalAlpha = opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle line style
    if (visibility?.lineStyle) {
      switch (visibility.lineStyle) {
        case 'dashed':
          ctx.setLineDash([5, 5]);
          break;
        case 'dotted':
          ctx.setLineDash([2, 2]);
          break;
        case 'dashdot':
          ctx.setLineDash([5, 2, 2, 2]);
          break;
        default:
          ctx.setLineDash([]);
      }
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    curveData.points.forEach((point: any, index: number) => {
      const x = valueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash
    ctx.globalAlpha = 1.0; // Reset opacity
  };

  // Draw scale labels
  const drawScaleLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    // Scale labels at bottom
    const labelCount = 5;
    const step = (track.scale.max - track.scale.min) / labelCount;
    
    for (let i = 0; i <= labelCount; i++) {
      const value = track.scale.min + i * step;
      const x = valueToPixel(value, width);
      
      ctx.fillText(value.toFixed(1), x, height - 5);
    }

    // Track title
    ctx.save();
    ctx.translate(width / 2, 15);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(track.title, 0, 0);
    ctx.restore();
  };

  // Helper functions for coordinate conversion
  const depthToPixel = (depth: number, height: number): number => {
    const ratio = (depth - depthRange.min) / (depthRange.max - depthRange.min);
    return ratio * height;
  };

  const valueToPixel = (value: number, width: number): number => {
    let normalizedValue: number;
    
    if (track.scale.logarithmic) {
      const logMin = Math.log10(Math.max(track.scale.min, 0.001));
      const logMax = Math.log10(Math.max(track.scale.max, 0.001));
      const logValue = Math.log10(Math.max(value, 0.001));
      normalizedValue = (logValue - logMin) / (logMax - logMin);
    } else {
      normalizedValue = (value - track.scale.min) / (track.scale.max - track.scale.min);
    }
    
    // Handle inverted scale
    if (track.scale.inverted) {
      normalizedValue = 1 - normalizedValue;
    }
    
    return normalizedValue * width;
  };

  // Handle canvas click for curve selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCurveClick || processedData.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find closest curve point
    let closestCurve: string | null = null;
    let closestWell: string | null = null;
    let minDistance = Infinity;

    processedData.forEach(curveData => {
      curveData.points.forEach(point => {
        const pointX = valueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) { // 20px tolerance
          minDistance = distance;
          closestCurve = curveData.curveName;
          closestWell = curveData.wellName;
        }
      });
    });

    if (closestCurve && closestWell) {
      onCurveClick(closestCurve, closestWell);
    }
  };

  // Redraw when data changes
  useEffect(() => {
    drawTrack();
  }, [processedData, depthRange, selectedCurve, track]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawTrack, 100); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
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
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '4px 8px',
        borderRadius: 1,
        fontSize: '0.75rem'
      }}>
        <Typography variant="caption" color="text.secondary">
          {track.curves.length} curve{track.curves.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default TrackRenderer;