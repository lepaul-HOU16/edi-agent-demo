/**
 * PorosityTrack Component - Industry-standard porosity track with dual curves
 * Requirements: 1.3, 1.6
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { WellLogData } from '../../types/petrophysics';
import { DepthRange } from './LogPlotViewer';

export interface PorosityTrackProps {
  wellData: WellLogData[];
  depthRange: DepthRange;
  height: number;
  width?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  onCurveClick?: (curveName: string, wellName: string) => void;
}

// Industry-standard porosity track configuration
const POROSITY_TRACK_CONFIG = {
  nphi: {
    scale: {
      min: 0,
      max: 40, // Percentage
      inverted: false
    },
    curve: {
      color: '#0000FF', // Blue line for NPHI
      lineWidth: 1.5,
      name: 'NPHI'
    }
  },
  rhob: {
    scale: {
      min: 1.95,
      max: 2.95, // g/cc
      inverted: true // Inverted scale for RHOB
    },
    curve: {
      color: '#FF0000', // Red line for RHOB
      lineWidth: 1.5,
      name: 'RHOB'
    }
  },
  fills: [
    {
      type: 'gas_effect' as const,
      color: '#FFFF00', // Yellow for gas effect (NPHI < RHOB porosity)
      opacity: 0.4
    },
    {
      type: 'porosity_fill' as const,
      color: '#87CEEB', // Sky blue for porosity fill
      opacity: 0.3
    }
  ],
  gridLines: true,
  tickInterval: {
    nphi: 10, // Every 10% for NPHI
    rhob: 0.2  // Every 0.2 g/cc for RHOB
  }
};

export const PorosityTrack: React.FC<PorosityTrackProps> = ({
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

  // Process porosity curve data
  const porosityData = useMemo(() => {
    const result: Array<{
      wellName: string;
      nphiPoints: Array<{ depth: number; value: number }>;
      rhobPoints: Array<{ depth: number; value: number }>;
    }> = [];

    wellData.forEach(well => {
      // Find NPHI curve (neutron porosity)
      const nphiCurve = well.curves.find(c => 
        c.name.toUpperCase() === 'NPHI' || 
        c.name.toUpperCase() === 'NEUTRON' ||
        c.name.toUpperCase() === 'TNPH'
      );
      
      // Find RHOB curve (bulk density)
      const rhobCurve = well.curves.find(c => 
        c.name.toUpperCase() === 'RHOB' || 
        c.name.toUpperCase() === 'DENSITY' ||
        c.name.toUpperCase() === 'RHOZ'
      );

      if (!nphiCurve && !rhobCurve) return;

      // Create depth array - assuming uniform spacing
      const depthStep = (well.depthRange[1] - well.depthRange[0]) / 
                       (Math.max(nphiCurve?.data.length || 0, rhobCurve?.data.length || 0) - 1);

      const nphiPoints = nphiCurve ? nphiCurve.data
        .map((value, index) => ({
          depth: well.depthRange[0] + index * depthStep,
          value: value === nphiCurve.nullValue ? NaN : value
        }))
        .filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value)
        ) : [];

      const rhobPoints = rhobCurve ? rhobCurve.data
        .map((value, index) => ({
          depth: well.depthRange[0] + index * depthStep,
          value: value === rhobCurve.nullValue ? NaN : value
        }))
        .filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value)
        ) : [];

      result.push({
        wellName: well.wellName,
        nphiPoints,
        rhobPoints
      });
    });

    return result;
  }, [wellData, depthRange]);

  // Canvas drawing function
  const drawPorosityTrack = () => {
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
    porosityData.forEach(wellData => {
      drawPorosityFills(ctx, wellData, rect.width, rect.height);
    });

    // Draw porosity curves
    porosityData.forEach(wellData => {
      drawPorosityCurves(ctx, wellData, rect.width, rect.height);
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

    // Vertical grid lines for NPHI scale
    const nphiStep = POROSITY_TRACK_CONFIG.nphi.scale.max / 4; // 0, 10, 20, 30, 40%
    for (let i = 0; i <= 4; i++) {
      const nphiValue = i * nphiStep;
      const x = nphiValueToPixel(nphiValue, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Draw porosity fills (gas effect and porosity fill)
  const drawPorosityFills = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    if (wellData.nphiPoints.length === 0 || wellData.rhobPoints.length === 0) return;

    // Calculate density porosity for comparison
    const densityPorosityPoints = wellData.rhobPoints.map((rhobPoint: any) => {
      // Density porosity formula: φD = (2.65 - RHOB) / (2.65 - 1.0)
      const densityPorosity = (2.65 - rhobPoint.value) / (2.65 - 1.0) * 100; // Convert to percentage
      return {
        depth: rhobPoint.depth,
        value: Math.max(0, Math.min(40, densityPorosity)) // Clamp to 0-40%
      };
    });

    // Draw gas effect fill (where NPHI < density porosity)
    drawGasEffectFill(ctx, wellData.nphiPoints, densityPorosityPoints, width, height);

    // Draw porosity fill between curves
    drawCurveFill(ctx, wellData.nphiPoints, densityPorosityPoints, width, height);
  };

  // Draw gas effect fill
  const drawGasEffectFill = (
    ctx: CanvasRenderingContext2D,
    nphiPoints: any[],
    densityPorosityPoints: any[],
    width: number,
    height: number
  ) => {
    ctx.fillStyle = POROSITY_TRACK_CONFIG.fills[0].color;
    ctx.globalAlpha = POROSITY_TRACK_CONFIG.fills[0].opacity;

    // Find overlapping depth points
    const minLength = Math.min(nphiPoints.length, densityPorosityPoints.length);
    
    ctx.beginPath();
    let pathStarted = false;

    for (let i = 0; i < minLength; i++) {
      const nphiPoint = nphiPoints[i];
      const densityPoint = densityPorosityPoints[i];
      
      // Check if depths are approximately equal (within tolerance)
      if (Math.abs(nphiPoint.depth - densityPoint.depth) < 0.5) {
        const y = depthToPixel(nphiPoint.depth, height);
        const nphiX = nphiValueToPixel(nphiPoint.value, width);
        const densityX = nphiValueToPixel(densityPoint.value, width);
        
        // Gas effect occurs when NPHI < density porosity
        if (nphiPoint.value < densityPoint.value) {
          if (!pathStarted) {
            ctx.moveTo(nphiX, y);
            pathStarted = true;
          } else {
            ctx.lineTo(nphiX, y);
          }
        } else if (pathStarted) {
          // Close current path and fill
          ctx.lineTo(densityX, y);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          pathStarted = false;
        }
      }
    }

    // Close final path if still open
    if (pathStarted && minLength > 0) {
      const lastDensityPoint = densityPorosityPoints[minLength - 1];
      const lastY = depthToPixel(lastDensityPoint.depth, height);
      const lastDensityX = nphiValueToPixel(lastDensityPoint.value, width);
      ctx.lineTo(lastDensityX, lastY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  };

  // Draw fill between curves
  const drawCurveFill = (
    ctx: CanvasRenderingContext2D,
    nphiPoints: any[],
    densityPorosityPoints: any[],
    width: number,
    height: number
  ) => {
    ctx.fillStyle = POROSITY_TRACK_CONFIG.fills[1].color;
    ctx.globalAlpha = POROSITY_TRACK_CONFIG.fills[1].opacity;

    const minLength = Math.min(nphiPoints.length, densityPorosityPoints.length);
    if (minLength === 0) return;

    ctx.beginPath();

    // Draw NPHI curve
    nphiPoints.slice(0, minLength).forEach((point, index) => {
      const x = nphiValueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Draw density porosity curve in reverse
    for (let i = minLength - 1; i >= 0; i--) {
      const point = densityPorosityPoints[i];
      const x = nphiValueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  // Draw porosity curves
  const drawPorosityCurves = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    // Draw NPHI curve (blue)
    if (wellData.nphiPoints.length > 0) {
      ctx.strokeStyle = POROSITY_TRACK_CONFIG.nphi.curve.color;
      ctx.lineWidth = POROSITY_TRACK_CONFIG.nphi.curve.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      wellData.nphiPoints.forEach((point: any, index: number) => {
        const x = nphiValueToPixel(point.value, width);
        const y = depthToPixel(point.depth, height);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw RHOB curve (red) - converted to density porosity
    if (wellData.rhobPoints.length > 0) {
      ctx.strokeStyle = POROSITY_TRACK_CONFIG.rhob.curve.color;
      ctx.lineWidth = POROSITY_TRACK_CONFIG.rhob.curve.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      wellData.rhobPoints.forEach((point: any, index: number) => {
        // Convert RHOB to density porosity
        const densityPorosity = (2.65 - point.value) / (2.65 - 1.0) * 100;
        const clampedPorosity = Math.max(0, Math.min(40, densityPorosity));
        
        const x = nphiValueToPixel(clampedPorosity, width);
        const y = depthToPixel(point.depth, height);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  };

  // Draw scale labels
  const drawScaleLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // NPHI scale labels at bottom
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    const nphiStep = POROSITY_TRACK_CONFIG.nphi.scale.max / 4;
    for (let i = 0; i <= 4; i++) {
      const nphiValue = i * nphiStep;
      const x = nphiValueToPixel(nphiValue, width);
      
      ctx.fillText(`${nphiValue}%`, x, height - 5);
    }

    // RHOB scale labels (converted to porosity equivalent)
    ctx.fillStyle = '#FF0000';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    
    // Show RHOB values at top
    const rhobValues = [2.95, 2.65, 2.35, 2.05, 1.95];
    rhobValues.forEach(rhobValue => {
      const densityPorosity = (2.65 - rhobValue) / (2.65 - 1.0) * 100;
      const x = nphiValueToPixel(densityPorosity, width);
      ctx.fillText(rhobValue.toFixed(2), x, 15);
    });

    // Track title
    ctx.save();
    ctx.translate(width / 2, 30);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Porosity (%)', 0, 0);
    ctx.restore();

    // Curve legends
    ctx.fillStyle = POROSITY_TRACK_CONFIG.nphi.curve.color;
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('NPHI', 5, height - 20);
    
    ctx.fillStyle = POROSITY_TRACK_CONFIG.rhob.curve.color;
    ctx.fillText('RHOB', 5, height - 10);
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

  const nphiValueToPixel = (nphiValue: number, width: number): number => {
    // Clamp NPHI value to scale range
    const clampedValue = Math.max(POROSITY_TRACK_CONFIG.nphi.scale.min, 
                                 Math.min(POROSITY_TRACK_CONFIG.nphi.scale.max, nphiValue));
    
    const ratio = (clampedValue - POROSITY_TRACK_CONFIG.nphi.scale.min) / 
                  (POROSITY_TRACK_CONFIG.nphi.scale.max - POROSITY_TRACK_CONFIG.nphi.scale.min);
    
    return ratio * width;
  };

  // Handle canvas click for curve selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCurveClick || porosityData.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find closest curve point
    let closestWell: string | null = null;
    let closestCurve: string | null = null;
    let minDistance = Infinity;

    porosityData.forEach(wellData => {
      // Check NPHI points
      wellData.nphiPoints.forEach(point => {
        const pointX = nphiValueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) { // 20px tolerance
          minDistance = distance;
          closestWell = wellData.wellName;
          closestCurve = 'NPHI';
        }
      });

      // Check RHOB points (converted to density porosity)
      wellData.rhobPoints.forEach(point => {
        const densityPorosity = (2.65 - point.value) / (2.65 - 1.0) * 100;
        const clampedPorosity = Math.max(0, Math.min(40, densityPorosity));
        
        const pointX = nphiValueToPixel(clampedPorosity, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) { // 20px tolerance
          minDistance = distance;
          closestWell = wellData.wellName;
          closestCurve = 'RHOB';
        }
      });
    });

    if (closestWell && closestCurve) {
      onCurveClick(closestCurve, closestWell);
    }
  };

  // Redraw when data changes
  useEffect(() => {
    drawPorosityTrack();
  }, [porosityData, depthRange, height, width, showGrid, showLabels]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawPorosityTrack, 100); // Debounce resize
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
        top: 45,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '2px 6px',
        borderRadius: 1,
        fontSize: '0.7rem'
      }}>
        <Typography variant="caption" color="primary" sx={{ color: '#0000FF' }}>
          NPHI (%)
        </Typography>
        <br />
        <Typography variant="caption" color="error" sx={{ color: '#FF0000' }}>
          RHOB (g/cc)
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Gas Effect
        </Typography>
      </Box>
    </Box>
  );
};

export default PorosityTrack;