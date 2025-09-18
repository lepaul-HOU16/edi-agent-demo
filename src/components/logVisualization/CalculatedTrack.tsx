/**
 * CalculatedTrack Component - Industry-standard calculated parameters track (Track 4)
 * Requirements: 1.5, 1.6
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { WellLogData } from '../../types/petrophysics';
import { DepthRange } from './LogPlotViewer';

export interface CalculatedTrackProps {
  wellData: WellLogData[];
  depthRange: DepthRange;
  height: number;
  width?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  calculatedData?: CalculatedParameters[];
  onCurveClick?: (curveName: string, wellName: string) => void;
}

export interface CalculatedParameters {
  wellName: string;
  depths: number[];
  vsh: number[];      // Shale volume (0-1)
  sw: number[];       // Water saturation (0-1)
  porosity: number[]; // Effective porosity (0-1)
  netPay: boolean[];  // Net pay flags
}

// Industry-standard calculated track configuration
const CALCULATED_TRACK_CONFIG = {
  scale: {
    min: 0,
    max: 1, // All parameters normalized to 0-1 scale
    gridLines: true,
    tickInterval: 0.2 // Every 20%
  },
  fills: [
    {
      type: 'vsh' as const,
      color: '#8B4513', // Brown fill for shale volume
      opacity: 0.4,
      name: 'Vsh'
    },
    {
      type: 'sw' as const,
      color: '#0000FF', // Blue fill for water saturation
      opacity: 0.3,
      name: 'Sw'
    },
    {
      type: 'porosity' as const,
      color: '#FFFF00', // Yellow fill for porosity
      opacity: 0.3,
      name: 'φ'
    },
    {
      type: 'net_pay' as const,
      color: '#00FF00', // Green bars for net pay flags
      opacity: 0.6,
      name: 'Net Pay'
    }
  ],
  curves: [
    {
      type: 'vsh' as const,
      color: '#654321', // Dark brown line for Vsh
      lineWidth: 1.5,
      name: 'Vsh'
    },
    {
      type: 'sw' as const,
      color: '#000080', // Navy blue line for Sw
      lineWidth: 1.5,
      name: 'Sw'
    },
    {
      type: 'porosity' as const,
      color: '#DAA520', // Goldenrod line for porosity
      lineWidth: 1.5,
      name: 'φ'
    }
  ]
};

export const CalculatedTrack: React.FC<CalculatedTrackProps> = ({
  wellData,
  depthRange,
  height,
  width = 200,
  showGrid = true,
  showLabels = true,
  calculatedData = [],
  onCurveClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process calculated parameters data
  const processedData = useMemo(() => {
    const result: Array<{
      wellName: string;
      vshPoints: Array<{ depth: number; value: number }>;
      swPoints: Array<{ depth: number; value: number }>;
      porosityPoints: Array<{ depth: number; value: number }>;
      netPayPoints: Array<{ depth: number; isNetPay: boolean }>;
    }> = [];

    // Use provided calculated data if available
    if (calculatedData.length > 0) {
      calculatedData.forEach(calcData => {
        const vshPoints = calcData.depths.map((depth, index) => ({
          depth,
          value: calcData.vsh[index] !== -999.25 && !isNaN(calcData.vsh[index]) ? calcData.vsh[index] : NaN
        })).filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value)
        );

        const swPoints = calcData.depths.map((depth, index) => ({
          depth,
          value: calcData.sw[index] !== -999.25 && !isNaN(calcData.sw[index]) ? calcData.sw[index] : NaN
        })).filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value)
        );

        const porosityPoints = calcData.depths.map((depth, index) => ({
          depth,
          value: calcData.porosity[index] !== -999.25 && !isNaN(calcData.porosity[index]) ? calcData.porosity[index] : NaN
        })).filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max &&
          !isNaN(point.value)
        );

        const netPayPoints = calcData.depths.map((depth, index) => ({
          depth,
          isNetPay: calcData.netPay[index]
        })).filter(point => 
          point.depth >= depthRange.min && 
          point.depth <= depthRange.max
        );

        result.push({
          wellName: calcData.wellName,
          vshPoints,
          swPoints,
          porosityPoints,
          netPayPoints
        });
      });
    } else {
      // Generate synthetic data from well log curves for demonstration
      wellData.forEach(well => {
        const grCurve = well.curves.find(c => 
          c.name.toUpperCase() === 'GR' || 
          c.name.toUpperCase() === 'GAMMA'
        );
        const nphiCurve = well.curves.find(c => 
          c.name.toUpperCase() === 'NPHI' || 
          c.name.toUpperCase() === 'NEUTRON'
        );
        const rtCurve = well.curves.find(c => 
          c.name.toUpperCase() === 'RT' || 
          c.name.toUpperCase() === 'RESISTIVITY'
        );

        if (!grCurve && !nphiCurve && !rtCurve) return;

        // Create depth array
        const maxLength = Math.max(
          grCurve?.data.length || 0,
          nphiCurve?.data.length || 0,
          rtCurve?.data.length || 0
        );
        const depthStep = (well.depthRange[1] - well.depthRange[0]) / (maxLength - 1);

        // Generate synthetic calculated parameters
        const vshPoints: Array<{ depth: number; value: number }> = [];
        const swPoints: Array<{ depth: number; value: number }> = [];
        const porosityPoints: Array<{ depth: number; value: number }> = [];
        const netPayPoints: Array<{ depth: number; isNetPay: boolean }> = [];

        for (let i = 0; i < maxLength; i++) {
          const depth = well.depthRange[0] + i * depthStep;
          
          if (depth < depthRange.min || depth > depthRange.max) continue;

          // Synthetic Vsh calculation (simplified linear method)
          if (grCurve && i < grCurve.data.length) {
            const gr = grCurve.data[i];
            if (gr !== grCurve.nullValue && !isNaN(gr)) {
              const vsh = Math.max(0, Math.min(1, (gr - 25) / (150 - 25)));
              vshPoints.push({ depth, value: vsh });
            }
          }

          // Synthetic porosity calculation
          if (nphiCurve && i < nphiCurve.data.length) {
            const nphi = nphiCurve.data[i];
            if (nphi !== nphiCurve.nullValue && !isNaN(nphi)) {
              const porosity = Math.max(0, Math.min(1, nphi / 100));
              porosityPoints.push({ depth, value: porosity });
            }
          }

          // Synthetic Sw calculation (simplified Archie)
          if (rtCurve && nphiCurve && i < rtCurve.data.length && i < nphiCurve.data.length) {
            const rt = rtCurve.data[i];
            const nphi = nphiCurve.data[i];
            if (rt !== rtCurve.nullValue && nphi !== nphiCurve.nullValue && 
                !isNaN(rt) && !isNaN(nphi) && rt > 0 && nphi > 0) {
              const porosity = nphi / 100;
              const sw = Math.pow((0.1) / (porosity * porosity * rt), 0.5);
              const clampedSw = Math.max(0, Math.min(1, sw));
              swPoints.push({ depth, value: clampedSw });

              // Net pay determination (simplified criteria)
              const vsh = grCurve && i < grCurve.data.length ? 
                Math.max(0, Math.min(1, (grCurve.data[i] - 25) / (150 - 25))) : 0;
              const isNetPay = porosity > 0.08 && clampedSw < 0.6 && vsh < 0.5;
              netPayPoints.push({ depth, isNetPay });
            }
          }
        }

        result.push({
          wellName: well.wellName,
          vshPoints,
          swPoints,
          porosityPoints,
          netPayPoints
        });
      });
    }

    return result;
  }, [wellData, calculatedData, depthRange]);

  // Canvas drawing function
  const drawCalculatedTrack = () => {
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
    processedData.forEach(wellData => {
      drawCalculatedFills(ctx, wellData, rect.width, rect.height);
    });

    // Draw net pay flags
    processedData.forEach(wellData => {
      drawNetPayFlags(ctx, wellData, rect.width, rect.height);
    });

    // Draw calculated curves
    processedData.forEach(wellData => {
      drawCalculatedCurves(ctx, wellData, rect.width, rect.height);
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

    // Vertical grid lines (0-1 scale)
    const scaleStep = CALCULATED_TRACK_CONFIG.scale.tickInterval;
    const tickCount = Math.floor(CALCULATED_TRACK_CONFIG.scale.max / scaleStep);
    
    for (let i = 0; i <= tickCount; i++) {
      const scaleValue = i * scaleStep;
      const x = valueToPixel(scaleValue, width);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Draw calculated parameter fills
  const drawCalculatedFills = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    // Draw Vsh fill (brown)
    if (wellData.vshPoints.length > 0) {
      ctx.fillStyle = CALCULATED_TRACK_CONFIG.fills[0].color;
      ctx.globalAlpha = CALCULATED_TRACK_CONFIG.fills[0].opacity;
      drawParameterFill(ctx, wellData.vshPoints, width, height);
    }

    // Draw Sw fill (blue)
    if (wellData.swPoints.length > 0) {
      ctx.fillStyle = CALCULATED_TRACK_CONFIG.fills[1].color;
      ctx.globalAlpha = CALCULATED_TRACK_CONFIG.fills[1].opacity;
      drawParameterFill(ctx, wellData.swPoints, width, height);
    }

    // Draw porosity fill (yellow)
    if (wellData.porosityPoints.length > 0) {
      ctx.fillStyle = CALCULATED_TRACK_CONFIG.fills[2].color;
      ctx.globalAlpha = CALCULATED_TRACK_CONFIG.fills[2].opacity;
      drawParameterFill(ctx, wellData.porosityPoints, width, height);
    }

    ctx.globalAlpha = 1.0;
  };

  // Draw parameter fill from zero to curve
  const drawParameterFill = (
    ctx: CanvasRenderingContext2D,
    points: Array<{ depth: number; value: number }>,
    width: number,
    height: number
  ) => {
    if (points.length === 0) return;

    const zeroX = valueToPixel(0, width);
    
    ctx.beginPath();
    
    // Start from zero line
    ctx.moveTo(zeroX, depthToPixel(points[0].depth, height));
    
    // Draw to curve
    points.forEach(point => {
      const x = valueToPixel(point.value, width);
      const y = depthToPixel(point.depth, height);
      ctx.lineTo(x, y);
    });
    
    // Close back to zero line
    ctx.lineTo(zeroX, depthToPixel(points[points.length - 1].depth, height));
    ctx.closePath();
    ctx.fill();
  };

  // Draw net pay flags as green bars
  const drawNetPayFlags = (
    ctx: CanvasRenderingContext2D,
    wellData: any,
    width: number,
    height: number
  ) => {
    if (wellData.netPayPoints.length === 0) return;

    ctx.fillStyle = CALCULATED_TRACK_CONFIG.fills[3].color;
    ctx.globalAlpha = CALCULATED_TRACK_CONFIG.fills[3].opacity;

    const barWidth = width * 0.1; // 10% of track width
    const barX = width - barWidth - 5; // Right side of track

    wellData.netPayPoints.forEach((point: any, index: number) => {
      if (point.isNetPay) {
        const y = depthToPixel(point.depth, height);
        const barHeight = index < wellData.netPayPoints.length - 1 ? 
          depthToPixel(wellData.netPayPoints[index + 1].depth, height) - y : 2;
        
        ctx.fillRect(barX, y, barWidth, Math.max(1, barHeight));
      }
    });

    ctx.globalAlpha = 1.0;
  };

  // Draw calculated curves
  const drawCalculatedCurves = (
    ctx: CanvasRenderingContext2D, 
    wellData: any, 
    width: number, 
    height: number
  ) => {
    // Draw Vsh curve (dark brown)
    if (wellData.vshPoints.length > 0) {
      ctx.strokeStyle = CALCULATED_TRACK_CONFIG.curves[0].color;
      ctx.lineWidth = CALCULATED_TRACK_CONFIG.curves[0].lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      wellData.vshPoints.forEach((point: any, index: number) => {
        const x = valueToPixel(point.value, width);
        const y = depthToPixel(point.depth, height);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw Sw curve (navy blue)
    if (wellData.swPoints.length > 0) {
      ctx.strokeStyle = CALCULATED_TRACK_CONFIG.curves[1].color;
      ctx.lineWidth = CALCULATED_TRACK_CONFIG.curves[1].lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      wellData.swPoints.forEach((point: any, index: number) => {
        const x = valueToPixel(point.value, width);
        const y = depthToPixel(point.depth, height);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw porosity curve (goldenrod)
    if (wellData.porosityPoints.length > 0) {
      ctx.strokeStyle = CALCULATED_TRACK_CONFIG.curves[2].color;
      ctx.lineWidth = CALCULATED_TRACK_CONFIG.curves[2].lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      wellData.porosityPoints.forEach((point: any, index: number) => {
        const x = valueToPixel(point.value, width);
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
    // Scale labels at bottom
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';

    const scaleStep = CALCULATED_TRACK_CONFIG.scale.tickInterval;
    const tickCount = Math.floor(CALCULATED_TRACK_CONFIG.scale.max / scaleStep);
    
    for (let i = 0; i <= tickCount; i++) {
      const scaleValue = i * scaleStep;
      const x = valueToPixel(scaleValue, width);
      
      ctx.fillText(`${(scaleValue * 100).toFixed(0)}%`, x, height - 5);
    }

    // Track title at top
    ctx.save();
    ctx.translate(width / 2, 15);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Calculated Parameters', 0, 0);
    ctx.restore();

    // Parameter labels on right side
    const labelY = 40;
    const labelSpacing = 15;
    
    ctx.font = '9px Arial';
    ctx.textAlign = 'right';
    
    // Vsh label (brown)
    ctx.fillStyle = CALCULATED_TRACK_CONFIG.curves[0].color;
    ctx.fillText('Vsh', width - 5, labelY);
    
    // Sw label (navy)
    ctx.fillStyle = CALCULATED_TRACK_CONFIG.curves[1].color;
    ctx.fillText('Sw', width - 5, labelY + labelSpacing);
    
    // Porosity label (goldenrod)
    ctx.fillStyle = CALCULATED_TRACK_CONFIG.curves[2].color;
    ctx.fillText('φ', width - 5, labelY + 2 * labelSpacing);
    
    // Net pay label (green)
    ctx.fillStyle = CALCULATED_TRACK_CONFIG.fills[3].color;
    ctx.fillText('Net', width - 5, labelY + 3 * labelSpacing);
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

  const valueToPixel = (value: number, width: number): number => {
    // Clamp value to scale range
    const clampedValue = Math.max(CALCULATED_TRACK_CONFIG.scale.min, 
                                 Math.min(CALCULATED_TRACK_CONFIG.scale.max, value));
    
    const ratio = (clampedValue - CALCULATED_TRACK_CONFIG.scale.min) / 
                  (CALCULATED_TRACK_CONFIG.scale.max - CALCULATED_TRACK_CONFIG.scale.min);
    
    return ratio * width;
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
    let closestWell: string | null = null;
    let closestCurve: string | null = null;
    let minDistance = Infinity;

    processedData.forEach(wellData => {
      // Check Vsh points
      wellData.vshPoints.forEach((point: any) => {
        const pointX = valueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) { // 20px tolerance
          minDistance = distance;
          closestWell = wellData.wellName;
          closestCurve = 'Vsh';
        }
      });

      // Check Sw points
      wellData.swPoints.forEach((point: any) => {
        const pointX = valueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) {
          minDistance = distance;
          closestWell = wellData.wellName;
          closestCurve = 'Sw';
        }
      });

      // Check porosity points
      wellData.porosityPoints.forEach((point: any) => {
        const pointX = valueToPixel(point.value, rect.width);
        const pointY = depthToPixel(point.depth, rect.height);
        
        const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
        
        if (distance < minDistance && distance < 20) {
          minDistance = distance;
          closestWell = wellData.wellName;
          closestCurve = 'Porosity';
        }
      });
    });

    if (closestWell && closestCurve) {
      onCurveClick(closestCurve, closestWell);
    }
  };

  // Redraw when data changes
  useEffect(() => {
    drawCalculatedTrack();
  }, [processedData, depthRange, height, width, showGrid, showLabels]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(drawCalculatedTrack, 100); // Debounce resize
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
        top: 70,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '2px 6px',
        borderRadius: 1,
        fontSize: '0.7rem'
      }}>
        <Typography variant="caption" sx={{ color: '#654321' }}>
          Vsh (brown)
        </Typography>
        <br />
        <Typography variant="caption" sx={{ color: '#000080' }}>
          Sw (blue)
        </Typography>
        <br />
        <Typography variant="caption" sx={{ color: '#DAA520' }}>
          φ (yellow)
        </Typography>
        <br />
        <Typography variant="caption" sx={{ color: '#00FF00' }}>
          Net Pay
        </Typography>
      </Box>
    </Box>
  );
};

export default CalculatedTrack;