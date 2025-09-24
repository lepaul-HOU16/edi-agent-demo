import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GeologicalMarker, WellLogData, MarkerDepth } from '../../types/petrophysics';

export interface InteractiveCorrelationPanelProps {
  wells: WellLogData[];
  markers: GeologicalMarker[];
  onMarkerUpdate: (markers: GeologicalMarker[]) => void;
  selectedCurve?: string;
  height?: number;
  width?: number;
}

interface DragState {
  isDragging: boolean;
  markerId: string | null;
  wellName: string | null;
  startY: number;
  startDepth: number;
}

interface WellTrack {
  wellName: string;
  x: number;
  width: number;
  logData: number[];
  depthRange: [number, number];
}

export const InteractiveCorrelationPanel: React.FC<InteractiveCorrelationPanelProps> = ({
  wells,
  markers,
  onMarkerUpdate,
  selectedCurve = 'GR',
  height = 600,
  width = 1000
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    markerId: null,
    wellName: null,
    startY: 0,
    startDepth: 0
  });
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [wellTracks, setWellTracks] = useState<WellTrack[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const trackWidth = 80;
  const trackSpacing = 20;

  // Initialize well tracks
  useEffect(() => {
    const tracks: WellTrack[] = wells.map((well, index) => {
      const curve = well.curves.find(c => c.name === selectedCurve);
      return {
        wellName: well.wellName,
        x: 100 + index * (trackWidth + trackSpacing),
        width: trackWidth,
        logData: curve?.data || [],
        depthRange: well.depthRange
      };
    });
    setWellTracks(tracks);
  }, [wells, selectedCurve]);

  // Calculate depth scale
  const getDepthScale = useCallback(() => {
    const allDepths = wells.flatMap(well => [well.depthRange[0], well.depthRange[1]]);
    const minDepth = Math.min(...allDepths);
    const maxDepth = Math.max(...allDepths);
    const depthRange = maxDepth - minDepth;
    return {
      minDepth,
      maxDepth,
      depthRange,
      scale: (height - 100) / depthRange
    };
  }, [wells, height]);

  // Convert depth to Y coordinate
  const depthToY = useCallback((depth: number) => {
    const { minDepth, scale } = getDepthScale();
    return 50 + (depth - minDepth) * scale;
  }, [getDepthScale]);

  // Convert Y coordinate to depth
  const yToDepth = useCallback((y: number) => {
    const { minDepth, scale } = getDepthScale();
    return ((y - 50) / scale) + minDepth;
  }, [getDepthScale]);

  // Handle mouse down on marker
  const handleMarkerMouseDown = useCallback((
    event: React.MouseEvent,
    markerId: string,
    wellName: string,
    currentDepth: number
  ) => {
    event.preventDefault();
    setDragState({
      isDragging: true,
      markerId,
      wellName,
      startY: event.clientY,
      startDepth: currentDepth
    });
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.markerId || !dragState.wellName) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = event.clientY - rect.top;
    const newDepth = yToDepth(y);

    // Update marker depth
    const updatedMarkers = markers.map(marker => {
      if (marker.id === dragState.markerId) {
        return {
          ...marker,
          depths: marker.depths.map(depthPoint =>
            depthPoint.wellName === dragState.wellName
              ? { ...depthPoint, depth: newDepth }
              : depthPoint
          )
        };
      }
      return marker;
    });

    onMarkerUpdate(updatedMarkers);
  }, [dragState, markers, onMarkerUpdate, yToDepth]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      markerId: null,
      wellName: null,
      startY: 0,
      startDepth: 0
    });
  }, []);

  // Render log curve as path
  const renderLogCurve = useCallback((track: WellTrack) => {
    if (track.logData.length === 0) return null;

    const { minDepth, maxDepth } = getDepthScale();
    const depthStep = (maxDepth - minDepth) / track.logData.length;
    
    // Normalize log values to track width
    const validData = track.logData.filter(val => val !== -999.25); // Common null value
    const minVal = Math.min(...validData);
    const maxVal = Math.max(...validData);
    const valRange = maxVal - minVal;

    const pathData = track.logData.map((value, index) => {
      const depth = minDepth + (index * depthStep);
      const y = depthToY(depth);
      
      let x = track.x;
      if (value !== -999.25 && valRange > 0) {
        const normalizedVal = (value - minVal) / valRange;
        x = track.x + (normalizedVal * track.width);
      }
      
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    return (
      <g key={track.wellName}>
        {/* Track background */}
        <rect
          x={track.x}
          y={50}
          width={track.width}
          height={height - 100}
          fill="#f8f9fa"
          stroke="#dee2e6"
          strokeWidth="1"
        />
        
        {/* Log curve */}
        <path
          d={pathData}
          stroke="#007bff"
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Track scale lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
          <line
            key={fraction}
            x1={track.x + (fraction * track.width)}
            y1={50}
            x2={track.x + (fraction * track.width)}
            y2={height - 50}
            stroke="#dee2e6"
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}
      </g>
    );
  }, [getDepthScale, depthToY, height]);

  return (
    <div className="interactive-correlation-panel">
      <div className="correlation-controls mb-4">
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Curve:</span>
            <select 
              value={selectedCurve}
              className="px-3 py-1 border rounded"
              onChange={(e) => {
                // This would be handled by parent component
                console.log('Curve changed to:', e.target.value);
              }}
            >
              <option value="GR">Gamma Ray</option>
              <option value="NPHI">Neutron Porosity</option>
              <option value="RHOB">Bulk Density</option>
              <option value="RT">Resistivity</option>
            </select>
          </label>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            onClick={() => {
              // Auto-correlate functionality would be implemented here
              console.log('Auto-correlate triggered');
            }}
          >
            Auto Correlate
          </button>
          
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            onClick={() => {
              // Snap to peaks functionality
              console.log('Snap to peaks triggered');
            }}
          >
            Snap to Peaks
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-300 bg-white cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Well headers */}
        {wellTracks.map((track) => (
          <g key={`header-${track.wellName}`}>
            <text
              x={track.x + track.width / 2}
              y={30}
              textAnchor="middle"
              className="text-sm font-semibold fill-gray-800"
            >
              {track.wellName}
            </text>
            
            {/* Curve name */}
            <text
              x={track.x + track.width / 2}
              y={45}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {selectedCurve}
            </text>
          </g>
        ))}

        {/* Depth scale */}
        <g className="depth-scale">
          {(() => {
            const { minDepth, maxDepth } = getDepthScale();
            const intervals = 10;
            const step = (maxDepth - minDepth) / intervals;
            return Array.from({ length: intervals + 1 }, (_, i) => {
              const depth = minDepth + (i * step);
              const y = depthToY(depth);
              return (
                <g key={i}>
                  <line
                    x1={20}
                    y1={y}
                    x2={width - 20}
                    y2={y}
                    stroke="#e9ecef"
                    strokeWidth="1"
                  />
                  <text
                    x={15}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                  >
                    {Math.round(depth)}
                  </text>
                </g>
              );
            });
          })()}
        </g>

        {/* Render log curves */}
        {wellTracks.map(track => renderLogCurve(track))}

        {/* Geological markers and correlation lines */}
        {markers.map((marker) => (
          <g key={marker.id} className="geological-marker">
            {/* Correlation line */}
            <path
              d={marker.depths.map((depthPoint, index) => {
                const track = wellTracks.find(t => t.wellName === depthPoint.wellName);
                if (!track) return '';
                const x = track.x + track.width / 2;
                const y = depthToY(depthPoint.depth);
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              }).join(' ')}
              stroke={marker.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray={marker.confidence === 'low' ? '5,5' : 'none'}
              opacity={hoveredMarker === marker.id ? 1 : 0.7}
            />
            
            {/* Marker points */}
            {marker.depths.map((depthPoint) => {
              const track = wellTracks.find(t => t.wellName === depthPoint.wellName);
              if (!track) return null;
              
              const x = track.x + track.width / 2;
              const y = depthToY(depthPoint.depth);
              
              return (
                <circle
                  key={`${marker.id}-${depthPoint.wellName}`}
                  cx={x}
                  cy={y}
                  r="6"
                  fill={marker.color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-grab hover:cursor-grabbing"
                  onMouseDown={(e) => handleMarkerMouseDown(e, marker.id, depthPoint.wellName, depthPoint.depth)}
                  onMouseEnter={() => setHoveredMarker(marker.id)}
                  onMouseLeave={() => setHoveredMarker(null)}
                />
              );
            })}
            
            {/* Marker label */}
            <text
              x={wellTracks[0]?.x - 10 || 90}
              y={depthToY(marker.depths[0]?.depth || 0) + 4}
              className="text-xs fill-gray-700 font-medium"
              textAnchor="end"
            >
              {marker.name}
            </text>
          </g>
        ))}

        {/* Drag indicator */}
        {dragState.isDragging && (
          <circle
            cx={0}
            cy={0}
            r="8"
            fill="rgba(255, 0, 0, 0.5)"
            stroke="red"
            strokeWidth="2"
            className="pointer-events-none"
          />
        )}
      </svg>

      {/* Correlation statistics */}
      <div className="correlation-stats mt-4 p-3 bg-gray-50 rounded">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Markers: </span>{markers.length}
          </div>
          <div>
            <span className="font-medium">Wells Correlated: </span>{wells.length}
          </div>
          <div>
            <span className="font-medium">Avg Confidence: </span>{
              markers.length > 0 
                ? (markers.filter(m => m.confidence === 'high').length / markers.length * 100).toFixed(0) + '%'
                : 'N/A'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCorrelationPanel;