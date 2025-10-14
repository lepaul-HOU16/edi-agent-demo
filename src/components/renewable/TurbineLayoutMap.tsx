/**
 * Turbine Layout Map Component
 * 
 * Interactive map showing optimized turbine positions with wake zones,
 * constraint compliance, and energy yield visualization.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  SpaceBetween,
  Button,
  Toggle,
  Select,
  SelectProps,
  Badge,
  StatusIndicator,
  Popover,
  Container,
  Header
} from '@cloudscape-design/components';
import { OptimizedLayout, OptimizedTurbinePosition, ConstraintViolation } from '../../types/layoutOptimization';
import { WindResourceData } from '../../types/windData';

// ============================================================================
// Component Props
// ============================================================================

interface TurbineLayoutMapProps {
  layout: OptimizedLayout;
  windData: WindResourceData;
  selectedTurbine?: string | null;
  showWakeZones?: boolean;
  showConstraintViolations?: boolean;
  showEnergyHeatmap?: boolean;
  showWindRose?: boolean;
  onTurbineSelect?: (turbineId: string | null) => void;
  onTurbineHover?: (turbineId: string | null) => void;
  className?: string;
}

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

interface TurbineMarker {
  turbine: OptimizedTurbinePosition;
  x: number;
  y: number;
  status: 'normal' | 'selected' | 'violation' | 'high_wake';
  wakeZone?: WakeZone;
}

interface WakeZone {
  centerX: number;
  centerY: number;
  radius: number;
  intensity: number;
  direction: number;
}

// ============================================================================
// Main Component
// ============================================================================

export const TurbineLayoutMap: React.FC<TurbineLayoutMapProps> = ({
  layout,
  windData,
  selectedTurbine,
  showWakeZones = false,
  showConstraintViolations = false,
  showEnergyHeatmap = false,
  showWindRose = false,
  onTurbineSelect,
  onTurbineHover,
  className
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: 'turbines', name: 'Turbines', visible: true, opacity: 1.0 },
    { id: 'wake_zones', name: 'Wake Zones', visible: showWakeZones, opacity: 0.6 },
    { id: 'constraints', name: 'Constraint Violations', visible: showConstraintViolations, opacity: 0.8 },
    { id: 'energy_heatmap', name: 'Energy Heatmap', visible: showEnergyHeatmap, opacity: 0.4 },
    { id: 'wind_rose', name: 'Wind Rose', visible: showWindRose, opacity: 0.7 }
  ]);
  const [mapBounds, setMapBounds] = useState({ minX: 0, maxX: 1000, minY: 0, maxY: 1000 });
  const [hoveredTurbine, setHoveredTurbine] = useState<string | null>(null);
  const [mapScale, setMapScale] = useState(1.0);
  const [mapCenter, setMapCenter] = useState({ x: 500, y: 500 });

  // ============================================================================
  // Computed Values
  // ============================================================================

  const turbineMarkers = useMemo(() => {
    if (!layout.turbines.length) return [];

    // Calculate map bounds from turbine positions
    const positions = layout.turbines.map(t => ({ x: t.x, y: t.y }));
    const minX = Math.min(...positions.map(p => p.x)) - 200;
    const maxX = Math.max(...positions.map(p => p.x)) + 200;
    const minY = Math.min(...positions.map(p => p.y)) - 200;
    const maxY = Math.max(...positions.map(p => p.y)) + 200;

    setMapBounds({ minX, maxX, minY, maxY });

    // Create turbine markers
    return layout.turbines.map(turbine => {
      let status: 'normal' | 'selected' | 'violation' | 'high_wake' = 'normal';
      
      if (selectedTurbine === turbine.id) {
        status = 'selected';
      } else if (layout.constraintViolations.some(v => v.affectedTurbines.includes(turbine.id))) {
        status = 'violation';
      } else if (turbine.wakeEffects.wakeDeficit > 15) {
        status = 'high_wake';
      }

      // Calculate wake zone
      const wakeZone: WakeZone = {
        centerX: turbine.x,
        centerY: turbine.y,
        radius: turbine.rotorDiameter * 3, // Simplified wake zone
        intensity: turbine.wakeEffects.wakeDeficit / 100,
        direction: windData.statistics.prevailingDirection
      };

      return {
        turbine,
        x: turbine.x,
        y: turbine.y,
        status,
        wakeZone
      };
    });
  }, [layout.turbines, selectedTurbine, layout.constraintViolations, windData.statistics.prevailingDirection]);

  const constraintViolationAreas = useMemo(() => {
    return layout.constraintViolations.map(violation => ({
      id: violation.constraintId,
      type: violation.constraintType,
      severity: violation.severity,
      affectedTurbines: violation.affectedTurbines,
      description: violation.description
    }));
  }, [layout.constraintViolations]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleTurbineClick = (turbineId: string) => {
    onTurbineSelect?.(selectedTurbine === turbineId ? null : turbineId);
  };

  const handleTurbineMouseEnter = (turbineId: string) => {
    setHoveredTurbine(turbineId);
    onTurbineHover?.(turbineId);
  };

  const handleTurbineMouseLeave = () => {
    setHoveredTurbine(null);
    onTurbineHover?.(null);
  };

  const handleLayerToggle = (layerId: string, visible: boolean) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible } : layer
    ));
  };

  const handleZoomIn = () => {
    setMapScale(prev => Math.min(prev * 1.5, 5.0));
  };

  const handleZoomOut = () => {
    setMapScale(prev => Math.max(prev / 1.5, 0.2));
  };

  const handleResetView = () => {
    setMapScale(1.0);
    setMapCenter({ 
      x: (mapBounds.minX + mapBounds.maxX) / 2, 
      y: (mapBounds.minY + mapBounds.maxY) / 2 
    });
  };

  // ============================================================================
  // Canvas Drawing
  // ============================================================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !turbineMarkers.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate transform
    const mapWidth = mapBounds.maxX - mapBounds.minX;
    const mapHeight = mapBounds.maxY - mapBounds.minY;
    const scaleX = (rect.width * 0.8) / mapWidth * mapScale;
    const scaleY = (rect.height * 0.8) / mapHeight * mapScale;
    const scale = Math.min(scaleX, scaleY);
    
    const offsetX = (rect.width - mapWidth * scale) / 2 - mapBounds.minX * scale;
    const offsetY = (rect.height - mapHeight * scale) / 2 - mapBounds.minY * scale;

    // Transform function
    const transform = (x: number, y: number) => ({
      x: x * scale + offsetX,
      y: rect.height - (y * scale + offsetY) // Flip Y axis
    });

    // Draw energy heatmap (if enabled)
    if (mapLayers.find(l => l.id === 'energy_heatmap')?.visible) {
      drawEnergyHeatmap(ctx, turbineMarkers, transform, rect);
    }

    // Draw wake zones (if enabled)
    if (mapLayers.find(l => l.id === 'wake_zones')?.visible) {
      drawWakeZones(ctx, turbineMarkers, transform, scale);
    }

    // Draw constraint violations (if enabled)
    if (mapLayers.find(l => l.id === 'constraints')?.visible) {
      drawConstraintViolations(ctx, constraintViolationAreas, turbineMarkers, transform, scale);
    }

    // Draw turbines
    if (mapLayers.find(l => l.id === 'turbines')?.visible) {
      drawTurbines(ctx, turbineMarkers, transform, scale);
    }

    // Draw wind rose (if enabled)
    if (mapLayers.find(l => l.id === 'wind_rose')?.visible) {
      drawWindRose(ctx, windData, rect);
    }

  }, [turbineMarkers, mapLayers, mapBounds, mapScale, mapCenter, windData, hoveredTurbine, selectedTurbine]);

  // ============================================================================
  // Drawing Functions
  // ============================================================================

  const drawTurbines = (
    ctx: CanvasRenderingContext2D,
    markers: TurbineMarker[],
    transform: (x: number, y: number) => { x: number; y: number },
    scale: number
  ) => {
    markers.forEach(marker => {
      const pos = transform(marker.x, marker.y);
      const radius = Math.max(8, marker.turbine.rotorDiameter * scale * 0.01);
      
      // Turbine circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      
      // Color based on status
      switch (marker.status) {
        case 'selected':
          ctx.fillStyle = '#0073bb';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          break;
        case 'violation':
          ctx.fillStyle = '#d13212';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          break;
        case 'high_wake':
          ctx.fillStyle = '#ff9900';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          break;
        default:
          ctx.fillStyle = '#16191f';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
      }
      
      ctx.fill();
      ctx.stroke();
      
      // Turbine ID label (for selected or hovered)
      if (marker.status === 'selected' || hoveredTurbine === marker.turbine.id) {
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(marker.turbine.id, pos.x, pos.y - radius - 5);
      }
      
      // Rotor direction indicator
      if (marker.status === 'selected') {
        const direction = windData.statistics.prevailingDirection * Math.PI / 180;
        const lineLength = radius * 1.5;
        const endX = pos.x + Math.sin(direction) * lineLength;
        const endY = pos.y - Math.cos(direction) * lineLength;
        
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#0073bb';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const drawWakeZones = (
    ctx: CanvasRenderingContext2D,
    markers: TurbineMarker[],
    transform: (x: number, y: number) => { x: number; y: number },
    scale: number
  ) => {
    const wakeOpacity = mapLayers.find(l => l.id === 'wake_zones')?.opacity || 0.6;
    
    markers.forEach(marker => {
      if (!marker.wakeZone || marker.wakeZone.intensity < 0.05) return;
      
      const pos = transform(marker.x, marker.y);
      const wakeRadius = marker.wakeZone.radius * scale * 0.01;
      
      // Wake zone ellipse (simplified)
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, wakeRadius, wakeRadius * 0.6, 0, 0, 2 * Math.PI);
      
      // Color intensity based on wake deficit
      const intensity = Math.min(marker.wakeZone.intensity, 0.5);
      ctx.fillStyle = `rgba(255, 153, 0, ${intensity * wakeOpacity})`;
      ctx.fill();
      
      ctx.strokeStyle = `rgba(255, 153, 0, ${wakeOpacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  const drawConstraintViolations = (
    ctx: CanvasRenderingContext2D,
    violations: any[],
    markers: TurbineMarker[],
    transform: (x: number, y: number) => { x: number; y: number },
    scale: number
  ) => {
    const violationOpacity = mapLayers.find(l => l.id === 'constraints')?.opacity || 0.8;
    
    violations.forEach(violation => {
      violation.affectedTurbines.forEach((turbineId: string) => {
        const marker = markers.find(m => m.turbine.id === turbineId);
        if (!marker) return;
        
        const pos = transform(marker.x, marker.y);
        const radius = 20;
        
        // Violation indicator circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        
        // Color based on severity
        let color = 'rgba(255, 0, 0, 0.3)';
        if (violation.severity === 'critical') color = 'rgba(255, 0, 0, 0.6)';
        else if (violation.severity === 'major') color = 'rgba(255, 100, 0, 0.5)';
        else if (violation.severity === 'moderate') color = 'rgba(255, 200, 0, 0.4)';
        
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });
  };

  const drawEnergyHeatmap = (
    ctx: CanvasRenderingContext2D,
    markers: TurbineMarker[],
    transform: (x: number, y: number) => { x: number; y: number },
    rect: DOMRect
  ) => {
    // Simplified energy heatmap - would be more sophisticated in real implementation
    const heatmapOpacity = mapLayers.find(l => l.id === 'energy_heatmap')?.opacity || 0.4;
    
    // Create gradient overlay
    const gradient = ctx.createRadialGradient(
      rect.width / 2, rect.height / 2, 0,
      rect.width / 2, rect.height / 2, Math.min(rect.width, rect.height) / 2
    );
    
    gradient.addColorStop(0, `rgba(0, 255, 0, ${heatmapOpacity})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 0, ${heatmapOpacity * 0.7})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, ${heatmapOpacity * 0.3})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const drawWindRose = (
    ctx: CanvasRenderingContext2D,
    windData: WindResourceData,
    rect: DOMRect
  ) => {
    const windRoseOpacity = mapLayers.find(l => l.id === 'wind_rose')?.opacity || 0.7;
    const centerX = rect.width - 80;
    const centerY = 80;
    const radius = 60;
    
    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, ${windRoseOpacity * 0.8})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${windRoseOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Prevailing wind direction arrow
    const direction = windData.statistics.prevailingDirection * Math.PI / 180;
    const arrowLength = radius * 0.8;
    const arrowX = centerX + Math.sin(direction) * arrowLength;
    const arrowY = centerY - Math.cos(direction) * arrowLength;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(arrowX, arrowY);
    ctx.strokeStyle = `rgba(0, 100, 200, ${windRoseOpacity})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Arrow head
    const headLength = 10;
    const headAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - headLength * Math.sin(direction - headAngle),
      arrowY + headLength * Math.cos(direction - headAngle)
    );
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - headLength * Math.sin(direction + headAngle),
      arrowY + headLength * Math.cos(direction + headAngle)
    );
    ctx.stroke();
    
    // Wind speed label
    ctx.fillStyle = `rgba(0, 0, 0, ${windRoseOpacity})`;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${windData.statistics.meanWindSpeed.toFixed(1)} m/s`, centerX, centerY + radius + 15);
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderMapControls = () => (
    <Box padding="s">
      <SpaceBetween direction="horizontal" size="s">
        <Button onClick={handleZoomIn} iconName="zoom-in" />
        <Button onClick={handleZoomOut} iconName="zoom-out" />
        <Button onClick={handleResetView}>Reset View</Button>
      </SpaceBetween>
    </Box>
  );

  const renderLayerControls = () => (
    <Container header={<Header variant="h3">Map Layers</Header>}>
      <SpaceBetween direction="vertical" size="s">
        {mapLayers.map(layer => (
          <Toggle
            key={layer.id}
            checked={layer.visible}
            onChange={({ detail }) => handleLayerToggle(layer.id, detail.checked)}
          >
            {layer.name}
          </Toggle>
        ))}
      </SpaceBetween>
    </Container>
  );

  const renderTurbineInfo = () => {
    const turbine = selectedTurbine ? 
      turbineMarkers.find(m => m.turbine.id === selectedTurbine)?.turbine : null;
    
    if (!turbine) return null;
    
    return (
      <Container header={<Header variant="h3">Turbine Details</Header>}>
        <SpaceBetween direction="vertical" size="s">
          <Box>
            <Box variant="awsui-key-label">Turbine ID</Box>
            <Box>{turbine.id}</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Position</Box>
            <Box>({turbine.x.toFixed(0)}, {turbine.y.toFixed(0)})</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Rated Power</Box>
            <Box>{turbine.ratedPower} kW</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Wake Deficit</Box>
            <Box>{turbine.wakeEffects.wakeDeficit.toFixed(1)}%</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Power Loss</Box>
            <Box>{turbine.wakeEffects.powerLoss.toFixed(1)}%</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Status</Box>
            <StatusIndicator type={turbine.status === 'active' ? 'success' : 'warning'}>
              {turbine.status}
            </StatusIndicator>
          </Box>
        </SpaceBetween>
      </Container>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={className} style={{ display: 'flex', height: '600px' }}>
      {/* Map Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%', 
            height: '100%', 
            border: '1px solid #e1e4e8',
            cursor: 'crosshair'
          }}
          onClick={(e) => {
            // Handle canvas clicks for turbine selection
            // This would require coordinate transformation logic
          }}
        />
        
        {/* Map Controls Overlay */}
        <div style={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px'
        }}>
          {renderMapControls()}
        </div>
        
        {/* Legend */}
        <div style={{ 
          position: 'absolute', 
          bottom: 10, 
          left: 10, 
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <SpaceBetween direction="vertical" size="xs">
            <Box variant="small"><strong>Legend</strong></Box>
            <Box variant="small">🔵 Normal Turbine</Box>
            <Box variant="small">🔴 Constraint Violation</Box>
            <Box variant="small">🟠 High Wake Loss</Box>
            <Box variant="small">🟦 Selected Turbine</Box>
          </SpaceBetween>
        </div>
      </div>
      
      {/* Side Panel */}
      <div style={{ width: '300px', padding: '16px', borderLeft: '1px solid #e1e4e8' }}>
        <SpaceBetween direction="vertical" size="l">
          {renderLayerControls()}
          {renderTurbineInfo()}
        </SpaceBetween>
      </div>
    </div>
  );
};