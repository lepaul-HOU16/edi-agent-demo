// Example integration of LeafletMapView in KnowledgeGraphExplorerPage
// This shows how the component will be used in the actual page

import React, { useState } from 'react';
import { LeafletMapView } from './src/components/knowledgeGraph/LeafletMapView';
import { GraphNode } from './src/types/knowledgeGraph';

export const KnowledgeGraphMapExample: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');

  // Example nodes from S&P Global / TGS data
  const nodes: GraphNode[] = [
    {
      id: 'well-1',
      type: 'well',
      name: 'Well 1',
      lat: 28.5,
      lng: -89.5,
      data: {
        operator: 'S&P Global',
        curves: ['GR', 'RHOB', 'NPHI', 'DT', 'RT'],
        dataPoints: 1500,
      },
      qualityScore: 85,
      qualityLevel: 'high',
    },
    {
      id: 'well-2',
      type: 'well',
      name: 'Well 2',
      lat: 28.2,
      lng: -90.2,
      data: {
        operator: 'TGS',
        curves: ['GR', 'RHOB', 'NPHI'],
        dataPoints: 800,
      },
      qualityScore: 72,
      qualityLevel: 'medium',
    },
    {
      id: 'well-3',
      type: 'well',
      name: 'Well 3',
      lat: 27.8,
      lng: -90.8,
      data: {
        operator: 'S&P Global',
        curves: ['GR', 'RHOB'],
        dataPoints: 450,
      },
      qualityScore: 58,
      qualityLevel: 'low',
    },
  ];

  const handleNodeSelect = (node: GraphNode) => {
    console.log('Node selected:', node);
    setSelectedNodeId(node.id);
    // This would also update the details panel in the actual implementation
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Controls */}
      <div style={{ padding: '10px', background: '#1a1f2e', display: 'flex', gap: '10px' }}>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          Toggle Theme ({theme})
        </button>
        <button onClick={() => setViewMode(viewMode === 'markers' ? 'heatmap' : 'markers')}>
          Toggle View ({viewMode})
        </button>
        <button onClick={() => setSelectedNodeId(null)}>
          Clear Selection
        </button>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <LeafletMapView
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          theme={theme}
          viewMode={viewMode}
        />
      </div>

      {/* Selected Node Info */}
      {selectedNodeId && (
        <div style={{ padding: '10px', background: '#1a1f2e', color: 'white' }}>
          <strong>Selected:</strong> {nodes.find(n => n.id === selectedNodeId)?.name}
        </div>
      )}
    </div>
  );
};

// Usage in KnowledgeGraphExplorerPage:
/*
<ResizableSplitView>
  <D3ForceGraph
    data={graphData}
    selectedNodeId={selectedNode?.id || null}
    onNodeSelect={handleNodeSelection}
    filters={filters}
    width={graphWidth}
    height={graphHeight}
    theme={theme}
  />
  
  <LeafletMapView
    nodes={graphData.nodes}
    selectedNodeId={selectedNode?.id || null}
    onNodeSelect={handleNodeSelection}
    theme={theme}
    viewMode={mapViewMode}
  />
</ResizableSplitView>
*/
