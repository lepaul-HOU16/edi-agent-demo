import React, { useState, useCallback, useMemo } from 'react';
import { CompletionTarget, WellLogData } from '../../types/petrophysics';

export interface CompletionTargetViewerProps {
  wells: WellLogData[];
  targets: CompletionTarget[];
  onTargetSelect?: (target: CompletionTarget) => void;
  onTargetUpdate?: (targets: CompletionTarget[]) => void;
  height?: number;
  width?: number;
}

interface TargetVisualization {
  target: CompletionTarget;
  x: number;
  y: number;
  height: number;
  color: string;
}

export const CompletionTargetViewer: React.FC<CompletionTargetViewerProps> = ({
  wells,
  targets,
  onTargetSelect,
  onTargetUpdate,
  height = 600,
  width = 1000
}) => {
  const [selectedTarget, setSelectedTarget] = useState<CompletionTarget | null>(null);
  const [sortBy, setSortBy] = useState<'ranking' | 'thickness' | 'quality' | 'porosity'>('ranking');
  const [filterQuality, setFilterQuality] = useState<'all' | 'excellent' | 'good' | 'fair' | 'poor'>('all');

  // Calculate well positions and depth scale
  const { wellPositions, depthScale } = useMemo(() => {
    const positions = wells.map((well, index) => ({
      wellName: well.wellName,
      x: 100 + (index * (width - 200) / Math.max(wells.length - 1, 1))
    }));

    const allDepths = wells.flatMap(well => [well.depthRange[0], well.depthRange[1]]);
    const minDepth = Math.min(...allDepths);
    const maxDepth = Math.max(...allDepths);
    const scale = (height - 100) / (maxDepth - minDepth);

    return {
      wellPositions: positions,
      depthScale: { minDepth, maxDepth, scale }
    };
  }, [wells, width, height]);

  // Convert depth to Y coordinate
  const depthToY = useCallback((depth: number) => {
    return 50 + (depth - depthScale.minDepth) * depthScale.scale;
  }, [depthScale]);

  // Filter and sort targets
  const filteredTargets = useMemo(() => {
    let filtered = targets;
    
    if (filterQuality !== 'all') {
      filtered = filtered.filter(target => target.quality === filterQuality);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ranking':
          return a.ranking - b.ranking;
        case 'thickness':
          return b.thickness - a.thickness;
        case 'quality':
          const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
          return qualityOrder[b.quality] - qualityOrder[a.quality];
        case 'porosity':
          return b.averagePorosity - a.averagePorosity;
        default:
          return 0;
      }
    });
  }, [targets, sortBy, filterQuality]);

  // Create target visualizations
  const targetVisualizations: TargetVisualization[] = useMemo(() => {
    return filteredTargets.map(target => {
      const wellPos = wellPositions.find(pos => pos.wellName === target.wellName);
      if (!wellPos) return null;

      const y = depthToY(target.startDepth);
      const targetHeight = (target.endDepth - target.startDepth) * depthScale.scale;
      
      const color = getQualityColor(target.quality);

      return {
        target,
        x: wellPos.x - 15,
        y,
        height: targetHeight,
        color
      };
    }).filter(Boolean) as TargetVisualization[];
  }, [filteredTargets, wellPositions, depthToY, depthScale.scale]);

  const getQualityColor = (quality: string): string => {
    const colors = {
      excellent: '#22C55E', // Green
      good: '#3B82F6',      // Blue
      fair: '#F59E0B',      // Amber
      poor: '#EF4444'       // Red
    };
    return colors[quality as keyof typeof colors] || '#6B7280';
  };

  const handleTargetClick = (target: CompletionTarget) => {
    setSelectedTarget(target);
    onTargetSelect?.(target);
  };

  return (
    <div className="completion-target-viewer">
      {/* Controls */}
      <div className="controls mb-4 p-4 bg-gray-50 rounded">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded"
            >
              <option value="ranking">Ranking</option>
              <option value="thickness">Thickness</option>
              <option value="quality">Quality</option>
              <option value="porosity">Porosity</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter by quality:</label>
            <select 
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value as any)}
              className="px-3 py-1 border rounded"
            >
              <option value="all">All</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Excellent</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Fair</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Poor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="flex gap-4">
        <div className="flex-1">
          <svg
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
              {Array.from({ length: 11 }, (_, i) => {
                const depth = depthScale.minDepth + (i * (depthScale.maxDepth - depthScale.minDepth) / 10);
                const y = depthToY(depth);
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
              })}
            </g>

            {/* Completion targets */}
            {targetVisualizations.map((viz, index) => (
              <g key={index} className="completion-target">
                <rect
                  x={viz.x}
                  y={viz.y}
                  width="30"
                  height={viz.height}
                  fill={viz.color}
                  fillOpacity={selectedTarget?.wellName === viz.target.wellName && 
                              selectedTarget?.startDepth === viz.target.startDepth ? 0.9 : 0.6}
                  stroke={viz.color}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-opacity-80"
                  onClick={() => handleTargetClick(viz.target)}
                />
                
                {/* Target ranking */}
                <text
                  x={viz.x + 15}
                  y={viz.y + viz.height / 2 + 4}
                  textAnchor="middle"
                  className="text-xs font-bold fill-white"
                >
                  {viz.target.ranking}
                </text>
                
                {/* Target label */}
                <text
                  x={viz.x + 35}
                  y={viz.y + viz.height / 2 + 4}
                  className="text-xs fill-gray-700"
                >
                  {viz.target.thickness.toFixed(0)}ft
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Target details panel */}
        <div className="w-80 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold text-lg mb-4">Completion Targets</h3>
          
          {/* Summary statistics */}
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="space-y-1 text-sm">
              <div>Total Targets: {filteredTargets.length}</div>
              <div>Excellent: {filteredTargets.filter(t => t.quality === 'excellent').length}</div>
              <div>Good: {filteredTargets.filter(t => t.quality === 'good').length}</div>
              <div>Fair: {filteredTargets.filter(t => t.quality === 'fair').length}</div>
              <div>Poor: {filteredTargets.filter(t => t.quality === 'poor').length}</div>
            </div>
          </div>

          {/* Selected target details */}
          {selectedTarget && (
            <div className="p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">Target Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Well:</span> {selectedTarget.wellName}</div>
                <div><span className="font-medium">Depth:</span> {selectedTarget.startDepth.toFixed(0)} - {selectedTarget.endDepth.toFixed(0)} ft</div>
                <div><span className="font-medium">Thickness:</span> {selectedTarget.thickness.toFixed(1)} ft</div>
                <div><span className="font-medium">Quality:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    selectedTarget.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                    selectedTarget.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                    selectedTarget.quality === 'fair' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedTarget.quality}
                  </span>
                </div>
                <div><span className="font-medium">Ranking:</span> #{selectedTarget.ranking}</div>
                <div><span className="font-medium">Avg Porosity:</span> {(selectedTarget.averagePorosity * 100).toFixed(1)}%</div>
                <div><span className="font-medium">Est Permeability:</span> {selectedTarget.estimatedPermeability.toFixed(1)} mD</div>
                <div><span className="font-medium">Water Saturation:</span> {(selectedTarget.waterSaturation * 100).toFixed(1)}%</div>
                <div><span className="font-medium">Shale Volume:</span> {(selectedTarget.shaleVolume * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}

          {/* Target list */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">All Targets</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredTargets.map((target, index) => (
                <div
                  key={index}
                  className={`p-2 border rounded cursor-pointer hover:bg-gray-100 ${
                    selectedTarget === target ? 'bg-blue-50 border-blue-300' : 'bg-white'
                  }`}
                  onClick={() => handleTargetClick(target)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">#{target.ranking}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      target.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                      target.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                      target.quality === 'fair' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {target.quality}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {target.wellName}: {target.startDepth.toFixed(0)}-{target.endDepth.toFixed(0)}ft
                  </div>
                  <div className="text-xs text-gray-600">
                    {target.thickness.toFixed(1)}ft, φ={(target.averagePorosity * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionTargetViewer;