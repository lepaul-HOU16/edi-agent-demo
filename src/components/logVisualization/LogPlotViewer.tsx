/**
 * LogPlotViewer Component - Professional log visualization with configurable tracks
 * Requirements: 1.1, 1.2, 1.6, 1.7
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Stack, IconButton, Tooltip, Slider, TextField, InputAdornment, Drawer } from '@mui/material';
import { ZoomIn, ZoomOut, PanTool, Refresh, CropFree, Straighten, Tune, Close, Calculate } from '@mui/icons-material';
import { WellLogData } from '../../types/petrophysics';
import { TrackRenderer } from './TrackRenderer';
import { CurveSelectionPanel, CurveVisibility, CurveOverlay } from './CurveSelectionPanel';
import { CalculationUpdateManager, CalculationCache, ParameterChange } from './CalculationUpdateManager';
import { CalculationParameters, CalculationResult } from '../../types/petrophysics';

// Track configuration interfaces
export interface TrackConfig {
  id: string;
  type: 'GR' | 'POROSITY' | 'RESISTIVITY' | 'CALCULATED';
  title: string;
  curves: CurveConfig[];
  scale: ScaleConfig;
  fills: FillConfig[];
  width: number; // Relative width (1-4)
}

export interface CurveConfig {
  name: string;
  displayName: string;
  color: string;
  lineWidth: number;
  scale: [number, number];
  inverted?: boolean;
  unit: string;
}

export interface ScaleConfig {
  min: number;
  max: number;
  logarithmic?: boolean;
  inverted?: boolean;
  gridLines?: boolean;
  tickInterval?: number;
}

export interface FillConfig {
  type: 'threshold' | 'between_curves' | 'above_curve' | 'below_curve';
  curveName?: string;
  curve1?: string;
  curve2?: string;
  threshold?: number;
  color: string;
  opacity: number;
  condition?: 'greater_than' | 'less_than' | 'between';
}

// Depth range and zoom state
export interface DepthRange {
  min: number;
  max: number;
}

export interface ZoomState {
  depthRange: DepthRange;
  zoomLevel: number;
  panOffset: number;
}

// Props interface
export interface LogPlotViewerProps {
  wellData: WellLogData[];
  tracks: TrackConfig[];
  initialDepthRange?: DepthRange;
  height?: number;
  showDepthScale?: boolean;
  interactive?: boolean;
  showZoomControls?: boolean;
  showDepthSelector?: boolean;
  showCurveControls?: boolean;
  showCalculationUpdates?: boolean;
  calculationParameters?: CalculationParameters;
  enabledCalculations?: string[];
  autoUpdateCalculations?: boolean;
  onDepthRangeChange?: (range: DepthRange) => void;
  onCurveSelect?: (curveName: string, wellName: string) => void;
  onZoomChange?: (zoomLevel: number) => void;
  onCurveVisibilityChange?: (visibility: CurveVisibility[]) => void;
  onOverlayChange?: (overlays: CurveOverlay[]) => void;
  onCalculationComplete?: (results: { [calculationType: string]: CalculationResult[] }) => void;
  onParameterChange?: (changes: ParameterChange[]) => void;
}

export const LogPlotViewer: React.FC<LogPlotViewerProps> = ({
  wellData,
  tracks,
  initialDepthRange,
  height = 600,
  showDepthScale = true,
  interactive = true,
  showZoomControls = true,
  showDepthSelector = true,
  showCurveControls = true,
  showCalculationUpdates = true,
  calculationParameters = {},
  enabledCalculations = ['porosity', 'shale_volume', 'saturation'],
  autoUpdateCalculations = true,
  onDepthRangeChange,
  onCurveSelect,
  onZoomChange,
  onCurveVisibilityChange,
  onOverlayChange,
  onCalculationComplete,
  onParameterChange
}) => {
  // Calculate overall depth range from all wells
  const overallDepthRange = useMemo(() => {
    if (wellData.length === 0) return { min: 0, max: 1000 };
    
    let minDepth = Infinity;
    let maxDepth = -Infinity;
    
    wellData.forEach(well => {
      minDepth = Math.min(minDepth, well.depthRange[0]);
      maxDepth = Math.max(maxDepth, well.depthRange[1]);
    });
    
    return { min: minDepth, max: maxDepth };
  }, [wellData]);

  // State management
  const [zoomState, setZoomState] = useState<ZoomState>(() => ({
    depthRange: initialDepthRange || overallDepthRange,
    zoomLevel: 1,
    panOffset: 0
  }));

  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [tempDepthRange, setTempDepthRange] = useState<DepthRange | null>(null);
  const [showCurvePanel, setShowCurvePanel] = useState(false);

  // Curve visibility and overlay state
  const [curveVisibility, setCurveVisibility] = useState<CurveVisibility[]>(() => {
    const visibility: CurveVisibility[] = [];
    wellData.forEach(well => {
      tracks.forEach(track => {
        track.curves.forEach(curveConfig => {
          const curve = well.curves.find(c => c.name === curveConfig.name);
          if (curve) {
            visibility.push({
              wellName: well.wellName,
              curveName: curve.name,
              visible: true,
              color: curveConfig.color,
              lineWidth: curveConfig.lineWidth,
              lineStyle: 'solid',
              opacity: 1.0
            });
          }
        });
      });
    });
    return visibility;
  });

  const [overlays, setOverlays] = useState<CurveOverlay[]>([]);
  const [calculationCache, setCalculationCache] = useState<CalculationCache>({});
  const [calculationResults, setCalculationResults] = useState<{ [calculationType: string]: CalculationResult[] }>({});

  // Refs for interaction handling
  const containerRef = useRef<HTMLDivElement>(null);
  const plotAreaRef = useRef<HTMLDivElement>(null);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update zoom state when initial depth range changes
  useEffect(() => {
    if (initialDepthRange) {
      setZoomState(prev => ({
        ...prev,
        depthRange: initialDepthRange
      }));
    }
  }, [initialDepthRange]);

  // Enhanced zoom controls with center point support
  const handleZoomIn = useCallback((centerDepth?: number) => {
    setZoomState(prev => {
      const currentRange = prev.depthRange.max - prev.depthRange.min;
      const newRange = currentRange * 0.7; // Zoom in by 30%
      const center = centerDepth ?? (prev.depthRange.min + prev.depthRange.max) / 2;
      
      const newDepthRange = {
        min: center - newRange / 2,
        max: center + newRange / 2
      };
      
      // Ensure we don't zoom beyond data bounds
      const clampedRange = {
        min: Math.max(newDepthRange.min, overallDepthRange.min),
        max: Math.min(newDepthRange.max, overallDepthRange.max)
      };
      
      // Adjust if we hit bounds
      if (clampedRange.min === overallDepthRange.min) {
        clampedRange.max = Math.min(clampedRange.min + newRange, overallDepthRange.max);
      }
      if (clampedRange.max === overallDepthRange.max) {
        clampedRange.min = Math.max(clampedRange.max - newRange, overallDepthRange.min);
      }
      
      const newZoomLevel = prev.zoomLevel * 1.43;
      onDepthRangeChange?.(clampedRange);
      onZoomChange?.(newZoomLevel);
      
      return {
        ...prev,
        depthRange: clampedRange,
        zoomLevel: newZoomLevel
      };
    });
  }, [overallDepthRange, onDepthRangeChange, onZoomChange]);

  const handleZoomOut = useCallback((centerDepth?: number) => {
    setZoomState(prev => {
      const currentRange = prev.depthRange.max - prev.depthRange.min;
      const newRange = Math.min(currentRange * 1.43, overallDepthRange.max - overallDepthRange.min);
      const center = centerDepth ?? (prev.depthRange.min + prev.depthRange.max) / 2;
      
      let newDepthRange = {
        min: center - newRange / 2,
        max: center + newRange / 2
      };
      
      // Ensure we don't zoom out beyond data bounds
      if (newDepthRange.min < overallDepthRange.min) {
        newDepthRange = {
          min: overallDepthRange.min,
          max: Math.min(overallDepthRange.min + newRange, overallDepthRange.max)
        };
      }
      if (newDepthRange.max > overallDepthRange.max) {
        newDepthRange = {
          min: Math.max(overallDepthRange.max - newRange, overallDepthRange.min),
          max: overallDepthRange.max
        };
      }
      
      const newZoomLevel = Math.max(prev.zoomLevel * 0.7, 1);
      onDepthRangeChange?.(newDepthRange);
      onZoomChange?.(newZoomLevel);
      
      return {
        ...prev,
        depthRange: newDepthRange,
        zoomLevel: newZoomLevel
      };
    });
  }, [overallDepthRange, onDepthRangeChange, onZoomChange]);

  const handleResetZoom = useCallback(() => {
    const resetRange = initialDepthRange || overallDepthRange;
    setZoomState({
      depthRange: resetRange,
      zoomLevel: 1,
      panOffset: 0
    });
    onDepthRangeChange?.(resetRange);
    onZoomChange?.(1);
  }, [initialDepthRange, overallDepthRange, onDepthRangeChange, onZoomChange]);

  // Mouse wheel zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!interactive) return;
    
    event.preventDefault();
    
    // Clear existing timeout
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }
    
    // Get mouse position relative to plot area
    const plotArea = plotAreaRef.current;
    if (!plotArea) return;
    
    const rect = plotArea.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    const relativePosition = mouseY / rect.height;
    const mouseDepth = zoomState.depthRange.min + 
      (zoomState.depthRange.max - zoomState.depthRange.min) * relativePosition;
    
    // Debounce wheel events
    wheelTimeoutRef.current = setTimeout(() => {
      if (event.deltaY < 0) {
        handleZoomIn(mouseDepth);
      } else {
        handleZoomOut(mouseDepth);
      }
    }, 50);
  }, [interactive, zoomState.depthRange, handleZoomIn, handleZoomOut]);

  // Depth range selector
  const handleDepthRangeSliderChange = useCallback((event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      const newRange = { min: newValue[0], max: newValue[1] };
      setTempDepthRange(newRange);
    }
  }, []);

  const handleDepthRangeSliderCommit = useCallback((event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      const newRange = { min: newValue[0], max: newValue[1] };
      setZoomState(prev => ({
        ...prev,
        depthRange: newRange,
        zoomLevel: (overallDepthRange.max - overallDepthRange.min) / (newRange.max - newRange.min)
      }));
      onDepthRangeChange?.(newRange);
      setTempDepthRange(null);
    }
  }, [overallDepthRange, onDepthRangeChange]);

  // Manual depth input handlers
  const handleMinDepthChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value < zoomState.depthRange.max && value >= overallDepthRange.min) {
      const newRange = { min: value, max: zoomState.depthRange.max };
      setZoomState(prev => ({ ...prev, depthRange: newRange }));
      onDepthRangeChange?.(newRange);
    }
  }, [zoomState.depthRange.max, overallDepthRange.min, onDepthRangeChange]);

  const handleMaxDepthChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value > zoomState.depthRange.min && value <= overallDepthRange.max) {
      const newRange = { min: zoomState.depthRange.min, max: value };
      setZoomState(prev => ({ ...prev, depthRange: newRange }));
      onDepthRangeChange?.(newRange);
    }
  }, [zoomState.depthRange.min, overallDepthRange.max, onDepthRangeChange]);

  // Enhanced pan and selection handling
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!interactive) return;
    
    // Check if Shift key is pressed for depth selection
    if (event.shiftKey) {
      const plotArea = plotAreaRef.current;
      if (!plotArea) return;
      
      const rect = plotArea.getBoundingClientRect();
      const mouseY = event.clientY - rect.top;
      const relativePosition = mouseY / rect.height;
      const clickDepth = zoomState.depthRange.min + 
        (zoomState.depthRange.max - zoomState.depthRange.min) * relativePosition;
      
      setIsSelecting(true);
      setSelectionStart(clickDepth);
      setSelectionEnd(clickDepth);
    } else {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
    
    event.preventDefault();
  }, [interactive, zoomState.depthRange]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    const plotArea = plotAreaRef.current;
    if (!plotArea) return;
    
    if (isSelecting && selectionStart !== null) {
      // Handle depth selection
      const rect = plotArea.getBoundingClientRect();
      const mouseY = event.clientY - rect.top;
      const relativePosition = mouseY / rect.height;
      const currentDepth = zoomState.depthRange.min + 
        (zoomState.depthRange.max - zoomState.depthRange.min) * relativePosition;
      
      setSelectionEnd(currentDepth);
    } else if (isDragging && dragStart) {
      // Handle panning
      const deltaY = event.clientY - dragStart.y;
      const plotHeight = plotArea.clientHeight;
      const depthRange = zoomState.depthRange.max - zoomState.depthRange.min;
      
      // Convert pixel movement to depth units
      const depthDelta = (deltaY / plotHeight) * depthRange;
      
      let newDepthRange = {
        min: zoomState.depthRange.min + depthDelta,
        max: zoomState.depthRange.max + depthDelta
      };
      
      // Clamp to overall bounds
      if (newDepthRange.min < overallDepthRange.min) {
        const offset = overallDepthRange.min - newDepthRange.min;
        newDepthRange.min += offset;
        newDepthRange.max += offset;
      }
      if (newDepthRange.max > overallDepthRange.max) {
        const offset = newDepthRange.max - overallDepthRange.max;
        newDepthRange.min -= offset;
        newDepthRange.max -= offset;
      }
      
      setZoomState(prev => ({ ...prev, depthRange: newDepthRange }));
      onDepthRangeChange?.(newDepthRange);
      
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  }, [isDragging, dragStart, isSelecting, selectionStart, zoomState.depthRange, overallDepthRange, onDepthRangeChange]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      // Apply depth selection
      const minDepth = Math.min(selectionStart, selectionEnd);
      const maxDepth = Math.max(selectionStart, selectionEnd);
      
      // Only apply if selection is meaningful (> 10 ft difference)
      if (maxDepth - minDepth > 10) {
        const newRange = { min: minDepth, max: maxDepth };
        setZoomState(prev => ({
          ...prev,
          depthRange: newRange,
          zoomLevel: (overallDepthRange.max - overallDepthRange.min) / (maxDepth - minDepth)
        }));
        onDepthRangeChange?.(newRange);
      }
      
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
    
    setIsDragging(false);
    setDragStart(null);
  }, [isSelecting, selectionStart, selectionEnd, overallDepthRange, onDepthRangeChange]);

  // Curve selection handler
  const handleCurveClick = useCallback((curveName: string, wellName: string) => {
    setSelectedCurve(curveName);
    onCurveSelect?.(curveName, wellName);
  }, [onCurveSelect]);

  // Curve visibility handlers
  const handleCurveVisibilityChange = useCallback((visibility: CurveVisibility[]) => {
    setCurveVisibility(visibility);
    onCurveVisibilityChange?.(visibility);
  }, [onCurveVisibilityChange]);

  const handleOverlayChange = useCallback((newOverlays: CurveOverlay[]) => {
    setOverlays(newOverlays);
    onOverlayChange?.(newOverlays);
  }, [onOverlayChange]);

  const handleCurveStyleChange = useCallback((wellName: string, curveName: string, style: Partial<CurveVisibility>) => {
    const updated = curveVisibility.map(cv =>
      cv.wellName === wellName && cv.curveName === curveName
        ? { ...cv, ...style }
        : cv
    );
    setCurveVisibility(updated);
    onCurveVisibilityChange?.(updated);
  }, [curveVisibility, onCurveVisibilityChange]);

  // Toggle curve panel
  const handleToggleCurvePanel = useCallback(() => {
    setShowCurvePanel(prev => !prev);
  }, []);

  // Calculation update handlers
  const handleCalculationComplete = useCallback((results: { [calculationType: string]: CalculationResult[] }) => {
    setCalculationResults(results);
    onCalculationComplete?.(results);
  }, [onCalculationComplete]);

  const handleParameterChange = useCallback((changes: ParameterChange[]) => {
    onParameterChange?.(changes);
  }, [onParameterChange]);

  const handleCacheUpdate = useCallback((cache: CalculationCache) => {
    setCalculationCache(cache);
  }, []);

  // Filter tracks based on curve visibility and overlays
  const visibleTracks = useMemo(() => {
    return tracks.map(track => ({
      ...track,
      curves: track.curves.filter(curveConfig => {
        // Check if any well has this curve visible
        return wellData.some(well => {
          const visibility = curveVisibility.find(cv => 
            cv.wellName === well.wellName && cv.curveName === curveConfig.name
          );
          return visibility?.visible !== false;
        });
      })
    })).filter(track => track.curves.length > 0);
  }, [tracks, wellData, curveVisibility]);

  // Calculate track widths
  const totalWidth = visibleTracks.reduce((sum, track) => sum + track.width, 0);
  const depthScaleWidth = showDepthScale ? 80 : 0;
  const availableWidth = `calc(100% - ${depthScaleWidth}px)`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Calculation Update Manager */}
      {showCalculationUpdates && (
        <CalculationUpdateManager
          wellData={wellData}
          calculationParameters={calculationParameters}
          enabledCalculations={enabledCalculations}
          autoUpdate={autoUpdateCalculations}
          cacheTimeout={300000} // 5 minutes
          onCalculationComplete={handleCalculationComplete}
          onParameterChange={handleParameterChange}
          onCacheUpdate={handleCacheUpdate}
        />
      )}

      <Paper 
        elevation={2} 
        sx={{ 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
      {/* Header with controls */}
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" component="h2">
            Well Log Display
          </Typography>
          
          {interactive && (
            <Stack direction="row" spacing={1}>
              {showZoomControls && (
                <>
                  <Tooltip title="Zoom In (Mouse wheel up)">
                    <IconButton size="small" onClick={() => handleZoomIn()}>
                      <ZoomIn />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom Out (Mouse wheel down)">
                    <IconButton size="small" onClick={() => handleZoomOut()}>
                      <ZoomOut />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Fit to Data">
                    <IconButton size="small" onClick={handleResetZoom}>
                      <CropFree />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset Zoom">
                    <IconButton size="small" onClick={handleResetZoom}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              {showCurveControls && (
                <Tooltip title="Curve Selection & Overlays">
                  <IconButton size="small" onClick={handleToggleCurvePanel} color={showCurvePanel ? 'primary' : 'default'}>
                    <Tune />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        {/* Depth Range Controls */}
        {interactive && showDepthSelector && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Straighten fontSize="small" />
            <TextField
              size="small"
              label="Min Depth"
              type="number"
              value={zoomState.depthRange.min.toFixed(1)}
              onChange={handleMinDepthChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">ft</InputAdornment>,
              }}
              sx={{ width: 120 }}
            />
            
            <Box sx={{ flex: 1, mx: 2 }}>
              <Slider
                value={[
                  tempDepthRange?.min ?? zoomState.depthRange.min,
                  tempDepthRange?.max ?? zoomState.depthRange.max
                ]}
                min={overallDepthRange.min}
                max={overallDepthRange.max}
                step={(overallDepthRange.max - overallDepthRange.min) / 1000}
                onChange={handleDepthRangeSliderChange}
                onChangeCommitted={handleDepthRangeSliderCommit}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value.toFixed(0)} ft`}
                size="small"
              />
            </Box>
            
            <TextField
              size="small"
              label="Max Depth"
              type="number"
              value={zoomState.depthRange.max.toFixed(1)}
              onChange={handleMaxDepthChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">ft</InputAdornment>,
              }}
              sx={{ width: 120 }}
            />
          </Box>
        )}
      </Box>

      {/* Main plot area */}
      <Box 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          display: 'flex',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 
                  isSelecting ? 'crosshair' : 
                  (interactive ? 'grab' : 'default'),
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Depth scale */}
        {showDepthScale && (
          <Box sx={{ 
            width: depthScaleWidth, 
            borderRight: 1, 
            borderColor: 'divider',
            backgroundColor: 'grey.50',
            position: 'relative'
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute',
                top: 8,
                left: 8,
                fontWeight: 'bold'
              }}
            >
              Depth (ft)
            </Typography>
            {/* Depth scale will be rendered by a separate component */}
          </Box>
        )}

        {/* Track container */}
        <Box 
          ref={plotAreaRef}
          sx={{ 
            width: availableWidth,
            display: 'flex',
            height: '100%',
            position: 'relative'
          }}
        >
          {visibleTracks.map((track, index) => (
            <Box
              key={track.id}
              sx={{
                width: `${(track.width / totalWidth) * 100}%`,
                borderRight: index < visibleTracks.length - 1 ? 1 : 0,
                borderColor: 'divider',
                position: 'relative'
              }}
            >
              <TrackRenderer
                track={track}
                wellData={wellData}
                depthRange={zoomState.depthRange}
                height={height - (showDepthSelector ? 120 : 80)} // Adjust for header height
                selectedCurve={selectedCurve}
                curveVisibility={curveVisibility}
                overlays={overlays}
                onCurveClick={handleCurveClick}
              />
            </Box>
          ))}

          {/* Depth Selection Overlay */}
          {isSelecting && selectionStart !== null && selectionEnd !== null && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${Math.min(
                  ((selectionStart - zoomState.depthRange.min) / (zoomState.depthRange.max - zoomState.depthRange.min)) * 100,
                  ((selectionEnd - zoomState.depthRange.min) / (zoomState.depthRange.max - zoomState.depthRange.min)) * 100
                )}%`,
                height: `${Math.abs(
                  ((selectionEnd - selectionStart) / (zoomState.depthRange.max - zoomState.depthRange.min)) * 100
                )}%`,
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                border: '2px dashed #1976d2',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            />
          )}
        </Box>
      </Box>

      {/* Status bar */}
      <Box sx={{ 
        p: 1, 
        borderTop: 1, 
        borderColor: 'divider',
        backgroundColor: 'grey.50',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" color="text.secondary">
          Depth: {zoomState.depthRange.min.toFixed(1)} - {zoomState.depthRange.max.toFixed(1)} ft 
          ({(zoomState.depthRange.max - zoomState.depthRange.min).toFixed(1)} ft range)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Zoom: {zoomState.zoomLevel.toFixed(1)}x | Wells: {wellData.length}
          {isSelecting && ' | Shift+Drag to select depth range'}
        </Typography>
      </Box>

      {/* Curve Selection Drawer */}
      <Drawer
        anchor="right"
        open={showCurvePanel}
        onClose={() => setShowCurvePanel(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            maxWidth: '40vw'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Curve Controls
          </Typography>
          <IconButton onClick={() => setShowCurvePanel(false)}>
            <Close />
          </IconButton>
        </Box>
        
        <CurveSelectionPanel
          wellData={wellData}
          tracks={tracks}
          curveVisibility={curveVisibility}
          overlays={overlays}
          onCurveVisibilityChange={handleCurveVisibilityChange}
          onOverlayChange={handleOverlayChange}
          onCurveStyleChange={handleCurveStyleChange}
        />
      </Drawer>
      </Paper>
    </Box>
  );
};

export default LogPlotViewer;