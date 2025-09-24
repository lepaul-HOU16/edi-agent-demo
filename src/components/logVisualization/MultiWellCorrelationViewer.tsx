import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WellLogData, GeologicalMarker, CorrelationLine } from '../../types/petrophysics';

export interface MultiWellCorrelationViewerProps {
  wells: WellLogData[];
  geologicalMarkers?: GeologicalMarker[];
  onMarkerUpdate?: (markers: GeologicalMarker[]) => void;
  onCorrelationChange?: (correlations: CorrelationLine[]) => void;
  height?: number;
  width?: number;
}

interface WellPosition {
  wellName: string;
  x: number;
  depthOffset: number;
}

interface DragState {
  isDragging: boolean;
  markerId?: string;
  wellName?: string;
  startY: number;
  startDepth: number;
}

export const MultiWellCorrelationViewer: React.FC<MultiWellCorrelationViewerProps> = ({
  wells,
  geologicalMarkers = [],
  onMarkerUpdate,
  onCorrelationChange,
  height = 800,
  width = 1200
}) => {
  const [wellPositions, setWellPositions] = useState<WellPosition[]>([]);
  const [correlationLines, setCorrelationLines] = useState<CorrelationLine[]>([]);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, startY: 0, startDepth: 0 });
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize well positions
  useEffect(() => {
    const positions: WellPosition[] = wells.map((well, index) => ({
      wellName: well.wellName,
      x: 100 + (index * (width - 200) / Math.max(wells.length - 1, 1)),
      depthOffset: 0
    }));
    setWellPositions(positions);
  }, [wells, width]);

  // Calculate depth scale
  const getDepthScale = useCallback(() => {
    if (wells.length === 0) {
      return {
        minDepth: 0,
        maxDepth: 1000,
        depthRange: 1000,
        scale: (height - 100) / 1000
      };
    }
    
    const allDepths = wells.flatMap(well => [well.depthRange[0], well.depthRange[1]]);
    const minDepth = Math.min(...allDepths);
    const maxDepth = Math.max(...allDepths);
    const depthRange = Math.max(maxDepth - minDepth, 1); // Prevent division by zero
    return {
      minDepth,
      maxDepth,
      depthRange,
      scale: (height - 100) / depthRange
    };
  }, [wells, height]);

  // Convert depth to Y coordinate
  const depthToY = useCallback((depth: number, wellName: string) => {
    const { minDepth, scale } = getDepthScale();
    const wellPos = wellPositions.find(pos => pos.wellName === wellName);
    const offset = wellPos?.depthOffset || 0;
    return 50 + (depth - minDepth + offset) * scale;
  }, [getDepthScale, wellPositions]);

  // Convert Y coordinate to depth
  const yToDepth = useCallback((y: number, wellName: string) => {
    const { minDepth, scale } = getDepthScale();
    const wellPos = wellPositions.find(pos => pos.wellName === wellName);
    const offset = wellPos?.depthOffset || 0;
    return ((y - 50) / scale) + minDepth - offset;
  }, [getDepthScale, wellPositions]);

  return (
    <div className="multi-well-correlation-viewer">
      <div className="correlation-controls mb-4">
        <div className="flex gap-4 items-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // Add new geological marker
              const newMarker: GeologicalMarker = {
                id: `marker_${Date.now()}`,
                name: `New Marker ${geologicalMarkers.length + 1}`,
                type: 'formation_top',
                depths: wells.map(well => ({
                  wellName: well.wellName,
                  depth: well.depthRange[0] + (well.depthRange[1] - well.depthRange[0]) * 0.3
                })),
                color: '#FF6B6B',
                confidence: 'medium'
              };
              const updatedMarkers = [...geologicalMarkers, newMarker];
              onMarkerUpdate?.(updatedMarkers);
            }}
          >
            Add Marker
          </button>
          
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => {
              // Auto-correlate based on log character
              // This is a simplified implementation
              console.log('Auto-correlation feature would be implemented here');
            }}
          >
            Auto Correlate
          </button>
          
          <select 
            className="px-3 py-2 border rounded"
            onChange={(e) => {
              // Filter markers by type
              console.log('Filter by type:', e.target.value);
            }}
          >
            <option value="all">All Markers</option>
            <option value="formation_top">Formation Tops</option>
            <option value="sequence_boundary">Sequence Boundaries</option>
            <option value="flooding_surface">Flooding Surfaces</option>
          </select>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-300 bg-white"
      >
        {/* Well headers */}
        {wellPositions.map((wellPos) => (
          <g key={wellPos.wellName}>
            <text
              x={wellPos.x}
              y={30}
              textAnchor="middle"
              className="text-sm font-semibold fill-gray-800"
            >
              {wellPos.wellName}
            </text>
            
            {/* Well track line */}
            <line
              x1={wellPos.x}
              y1={50}
              x2={wellPos.x}
              y2={height - 50}
              stroke="#333"
              strokeWidth="2"
            />
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
              const y = depthToY(depth, wells[0]?.wellName || '');
              return (
                <g key={i}>
                  <line
                    x1={20}
                    y1={y}
                    x2={30}
                    y2={y}
                    stroke="#666"
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

        {/* Geological markers and correlation lines */}
        {geologicalMarkers.map((marker) => (
          <g key={marker.id} className="geological-marker">
            {/* Correlation line connecting all wells */}
            <path
              d={marker.depths.map((depthPoint, index) => {
                const wellPos = wellPositions.find(pos => pos.wellName === depthPoint.wellName);
                if (!wellPos) return '';
                const x = wellPos.x;
                const y = depthToY(depthPoint.depth, depthPoint.wellName);
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              }).join(' ')}
              stroke={marker.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray={marker.confidence === 'low' ? '5,5' : 'none'}
              opacity={selectedMarker === marker.id ? 1 : 0.7}
            />
            
            {/* Marker points on each well */}
            {marker.depths.map((depthPoint) => {
              const wellPos = wellPositions.find(pos => pos.wellName === depthPoint.wellName);
              if (!wellPos) return null;
              
              const x = wellPos.x;
              const y = depthToY(depthPoint.depth, depthPoint.wellName);
              
              return (
                <circle
                  key={`${marker.id}-${depthPoint.wellName}`}
                  cx={x}
                  cy={y}
                  r="6"
                  fill={marker.color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-8"
                  onClick={() => setSelectedMarker(marker.id)}
                />
              );
            })}
            
            {/* Marker label */}
            {marker.depths.length > 0 && (
              <text
                x={wellPositions[0]?.x - 40 || 60}
                y={depthToY(marker.depths[0]?.depth || 0, marker.depths[0]?.wellName || '') + 4}
                className="text-xs fill-gray-700 font-medium"
                textAnchor="end"
              >
                {marker.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Marker details panel */}
      {selectedMarker && (
        <div className="marker-details mt-4 p-4 border rounded bg-gray-50">
          {(() => {
            const marker = geologicalMarkers.find(m => m.id === selectedMarker);
            if (!marker) return null;
            
            return (
              <div>
                <h3 className="font-semibold text-lg mb-2">{marker.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type:</label>
                    <select 
                      value={marker.type}
                      className="w-full px-3 py-1 border rounded"
                      onChange={(e) => {
                        const updatedMarkers = geologicalMarkers.map(m => 
                          m.id === selectedMarker 
                            ? { ...m, type: e.target.value as any }
                            : m
                        );
                        onMarkerUpdate?.(updatedMarkers);
                      }}
                    >
                      <option value="formation_top">Formation Top</option>
                      <option value="sequence_boundary">Sequence Boundary</option>
                      <option value="flooding_surface">Flooding Surface</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Confidence:</label>
                    <select 
                      value={marker.confidence}
                      className="w-full px-3 py-1 border rounded"
                      onChange={(e) => {
                        const updatedMarkers = geologicalMarkers.map(m => 
                          m.id === selectedMarker 
                            ? { ...m, confidence: e.target.value as any }
                            : m
                        );
                        onMarkerUpdate?.(updatedMarkers);
                      }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Depths by Well:</label>
                  <div className="space-y-2">
                    {marker.depths.map((depthPoint) => (
                      <div key={depthPoint.wellName} className="flex items-center gap-2">
                        <span className="w-24 text-sm">{depthPoint.wellName}:</span>
                        <input
                          type="number"
                          value={depthPoint.depth}
                          className="px-2 py-1 border rounded w-20"
                          onChange={(e) => {
                            const newDepth = parseFloat(e.target.value);
                            const updatedMarkers = geologicalMarkers.map(m => 
                              m.id === selectedMarker 
                                ? {
                                    ...m,
                                    depths: m.depths.map(dp => 
                                      dp.wellName === depthPoint.wellName 
                                        ? { ...dp, depth: newDepth }
                                        : dp
                                    )
                                  }
                                : m
                            );
                            onMarkerUpdate?.(updatedMarkers);
                          }}
                        />
                        <span className="text-sm text-gray-500">ft</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  className="mt-3 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => {
                    const updatedMarkers = geologicalMarkers.filter(m => m.id !== selectedMarker);
                    onMarkerUpdate?.(updatedMarkers);
                    setSelectedMarker(null);
                  }}
                >
                  Delete Marker
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default MultiWellCorrelationViewer;