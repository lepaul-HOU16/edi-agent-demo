import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../../types/knowledgeGraph';

interface D3ForceGraphProps {
  data: GraphData;
  selectedNodeId: string | null;
  selectedNodeIds?: Set<string>;
  onNodeSelect: (node: GraphNode) => void;
  filters: {
    nodeTypes: Set<string>;
    relationshipTypes: Set<string>;
    qualityLevels: Set<string>;
    searchQuery: string;
    showDuplicatesOnly: boolean;
  };
  width: number;
  height: number;
  theme: 'light' | 'dark';
}

// Node type colors
const NODE_COLORS = {
  well: '#0972D3',      // Blue
  event: '#D91515',     // Red
  formation: '#037F0C', // Green
  equipment: '#FF9900'  // Orange
};

// Link type styles
const LINK_STYLES = {
  correlation: { stroke: '#0972D3', strokeDasharray: '5,5', strokeWidth: 2 },
  hierarchy: { stroke: '#037F0C', strokeDasharray: 'none', strokeWidth: 2 },
  'event-link': { stroke: '#D91515', strokeDasharray: 'none', strokeWidth: 2 },
  duplicate: { stroke: '#FF9900', strokeDasharray: '2,2', strokeWidth: 2 }
};

export const D3ForceGraph: React.FC<D3ForceGraphProps> = ({
  data,
  selectedNodeId,
  selectedNodeIds = new Set(),
  onNodeSelect,
  filters,
  width,
  height,
  theme
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Identify nodes that have duplicate links
  const nodesWithDuplicates = new Set<string>();
  data.links.forEach(link => {
    if (link.type === 'duplicate') {
      nodesWithDuplicates.add(typeof link.source === 'string' ? link.source : link.source.id);
      nodesWithDuplicates.add(typeof link.target === 'string' ? link.target : link.target.id);
    }
  });

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    
    // Create container group for zoom/pan
    const container = svg.append('g').attr('class', 'graph-container');

    // Performance optimization: Determine if we need virtualization
    const useVirtualization = data.nodes.length > 100;
    const maxIterations = data.nodes.length > 100 ? 100 : 300; // Limit iterations for large graphs

    // Filter data based on filters
    const filteredNodes = data.nodes.filter(node => {
      // Node type filter
      if (filters.nodeTypes.size > 0 && !filters.nodeTypes.has(node.type)) {
        return false;
      }
      
      // Specific well selection filter (most important!)
      if (filters.selectedWells && filters.selectedWells.size > 0) {
        // If this is a well node, it must be in the selected set
        if (node.type === 'well' && !filters.selectedWells.has(node.id)) {
          return false;
        }
        // If this is NOT a well node, check if it's connected to any selected well
        if (node.type !== 'well') {
          const connectedToSelectedWell = data.links.some(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            
            // Check if this node is connected to a selected well
            if (sourceId === node.id && filters.selectedWells!.has(targetId)) return true;
            if (targetId === node.id && filters.selectedWells!.has(sourceId)) return true;
            return false;
          });
          
          if (!connectedToSelectedWell) return false;
        }
      }
      
      // Quality level filter
      if (filters.qualityLevels.size > 0 && node.qualityLevel) {
        if (!filters.qualityLevels.has(node.qualityLevel)) {
          return false;
        }
      }
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!node.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Show duplicates only filter
      if (filters.showDuplicatesOnly && !nodesWithDuplicates.has(node.id)) {
        return false;
      }
      
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    const filteredLinks = data.links.filter(link => {
      // Only show links where both nodes are visible
      if (!filteredNodeIds.has(link.source as string) || !filteredNodeIds.has(link.target as string)) {
        return false;
      }
      
      // Relationship type filter
      if (filters.relationshipTypes.size > 0 && !filters.relationshipTypes.has(link.type)) {
        return false;
      }
      
      return true;
    });

    // Create force simulation with performance optimizations
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
      .alphaDecay(0.02) // Faster convergence for large graphs
      .velocityDecay(0.4); // Reduce oscillation

    // Limit simulation iterations for performance
    if (useVirtualization) {
      simulation.stop();
      for (let i = 0; i < maxIterations; ++i) {
        simulation.tick();
      }
    }

    simulationRef.current = simulation;

    // Create links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => LINK_STYLES[d.type]?.stroke || '#999')
      .attr('stroke-width', d => LINK_STYLES[d.type]?.strokeWidth || 1)
      .attr('stroke-dasharray', d => LINK_STYLES[d.type]?.strokeDasharray || 'none')
      .attr('opacity', 0.6);

    // Create nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('data-id', d => d.id)
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any);

    // Add circles to nodes
    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => NODE_COLORS[d.type] || '#999')
      .attr('stroke', d => {
        if (d.id === selectedNodeId) return '#fff';
        if (selectedNodeIds.has(d.id)) return '#FFD700'; // Gold for multi-selected
        return 'none';
      })
      .attr('stroke-width', d => {
        if (d.id === selectedNodeId) return 3;
        if (selectedNodeIds.has(d.id)) return 2;
        return 0;
      })
      .attr('opacity', d => {
        if (d.id === selectedNodeId || selectedNodeIds.has(d.id)) return 1;
        return 0.8;
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeSelect(d);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Add quality score color-coded badge to nodes
    node.filter(d => d.qualityScore !== undefined)
      .append('circle')
      .attr('r', 6)
      .attr('cx', 10)
      .attr('cy', 10)
      .attr('fill', d => {
        if (!d.qualityLevel) return '#999';
        if (d.qualityLevel === 'high') return '#4caf50'; // Green
        if (d.qualityLevel === 'medium') return '#ff9800'; // Orange
        return '#f44336'; // Red for low
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('pointer-events', 'none');

    // Add quality score text to badge
    node.filter(d => d.qualityScore !== undefined)
      .append('text')
      .attr('x', 10)
      .attr('y', 13)
      .attr('text-anchor', 'middle')
      .attr('font-size', '7px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => Math.round(d.qualityScore || 0));

    // Add orange badge indicator for duplicate nodes
    node.filter(d => nodesWithDuplicates.has(d.id))
      .append('circle')
      .attr('r', 6)
      .attr('cx', 10)
      .attr('cy', -10)
      .attr('fill', '#FF9900')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('pointer-events', 'none');

    // Add warning icon to duplicate badge
    node.filter(d => nodesWithDuplicates.has(d.id))
      .append('text')
      .attr('x', 10)
      .attr('y', -7)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text('!');


    // Add labels to nodes (only show for selected/hovered or if <50 nodes for performance)
    const showAllLabels = filteredNodes.length < 50;
    node.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', theme === 'dark' ? '#fff' : '#000')
      .attr('pointer-events', 'none')
      .attr('opacity', d => {
        if (showAllLabels) {
          return d.id === selectedNodeId || d.id === hoveredNode ? 1 : 0.7;
        }
        return d.id === selectedNodeId || d.id === hoveredNode ? 1 : 0;
      });

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Update positions on simulation tick (with performance optimization)
    if (!useVirtualization) {
      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as any).x)
          .attr('y1', d => (d.source as any).y)
          .attr('x2', d => (d.target as any).x)
          .attr('y2', d => (d.target as any).y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
    } else {
      // For large graphs, update positions once after pre-computation
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    // Drag functions with performance optimization
    function dragStarted(event: any, d: GraphNode) {
      if (!event.active && !useVirtualization) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
      
      // For virtualized graphs, manually update positions
      if (useVirtualization) {
        node.filter((n: any) => n.id === d.id)
          .attr('transform', `translate(${d.fx},${d.fy})`);
        
        // Update connected links
        link.filter((l: any) => l.source.id === d.id || l.target.id === d.id)
          .attr('x1', (l: any) => l.source.id === d.id ? d.fx : l.source.x)
          .attr('y1', (l: any) => l.source.id === d.id ? d.fy : l.source.y)
          .attr('x2', (l: any) => l.target.id === d.id ? d.fx : l.target.x)
          .attr('y2', (l: any) => l.target.id === d.id ? d.fy : l.target.y);
      }
    }

    function dragEnded(event: any, d: GraphNode) {
      if (!event.active && !useVirtualization) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, selectedNodeId, selectedNodeIds, filters, width, height, theme, hoveredNode, onNodeSelect]);

  // Update selected node styling when selection changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.node circle')
      .attr('stroke', function(d: any) {
        if (d.id === selectedNodeId) return '#fff';
        if (selectedNodeIds.has(d.id)) return '#FFD700';
        return 'none';
      })
      .attr('stroke-width', function(d: any) {
        if (d.id === selectedNodeId) return 3;
        if (selectedNodeIds.has(d.id)) return 2;
        return 0;
      })
      .attr('opacity', function(d: any) {
        if (d.id === selectedNodeId || selectedNodeIds.has(d.id)) return 1;
        return 0.8;
      });

    svg.selectAll('.node text')
      .attr('opacity', function(d: any) {
        return d.id === selectedNodeId || d.id === hoveredNode || selectedNodeIds.has(d.id) ? 1 : 0.7;
      });
  }, [selectedNodeId, selectedNodeIds, hoveredNode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
          cursor: 'grab'
        }}
      />
      
      {/* Graph controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        gap: '8px',
        zIndex: 1000
      }}>
        <button
          onClick={() => {
            if (svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(750).call(
                d3.zoom<SVGSVGElement, unknown>().transform as any,
                d3.zoomIdentity.scale(1.2)
              );
            }
          }}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: theme === 'dark' ? '#21262d' : '#f3f4f6',
            color: theme === 'dark' ? '#e6edf3' : '#1f2328',
            border: `1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#30363d' : '#e6edf3';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#58a6ff' : '#0969da';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#21262d' : '#f3f4f6';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#30363d' : '#d0d7de';
          }}
          title="Zoom In"
        >
          🔍 +
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(750).call(
                d3.zoom<SVGSVGElement, unknown>().transform as any,
                d3.zoomIdentity.scale(0.8)
              );
            }
          }}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: theme === 'dark' ? '#21262d' : '#f3f4f6',
            color: theme === 'dark' ? '#e6edf3' : '#1f2328',
            border: `1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#30363d' : '#e6edf3';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#58a6ff' : '#0969da';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#21262d' : '#f3f4f6';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#30363d' : '#d0d7de';
          }}
          title="Zoom Out"
        >
          🔍 −
        </button>
        <button
          onClick={() => {
            if (svgRef.current) {
              const svg = d3.select(svgRef.current);
              svg.transition().duration(750).call(
                d3.zoom<SVGSVGElement, unknown>().transform as any,
                d3.zoomIdentity
              );
            }
          }}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: theme === 'dark' ? '#21262d' : '#f3f4f6',
            color: theme === 'dark' ? '#e6edf3' : '#1f2328',
            border: `1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#30363d' : '#e6edf3';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#58a6ff' : '#0969da';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#21262d' : '#f3f4f6';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#30363d' : '#d0d7de';
          }}
          title="Reset View"
        >
          ↻ Reset
        </button>
        <button
          onClick={() => {
            if (simulationRef.current) {
              simulationRef.current.alpha(1).restart();
            }
          }}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: theme === 'dark' ? '#21262d' : '#f3f4f6',
            color: theme === 'dark' ? '#e6edf3' : '#1f2328',
            border: `1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#30363d' : '#e6edf3';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#58a6ff' : '#0969da';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#21262d' : '#f3f4f6';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#30363d' : '#d0d7de';
          }}
          title="Auto-Cluster"
        >
          ⚡ Auto-Cluster
        </button>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: theme === 'dark' ? '#161b22' : '#f6f8fa',
        border: `1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`,
        borderRadius: '6px',
        padding: '16px',
        fontSize: '12px',
        color: theme === 'dark' ? '#e6edf3' : '#1f2328',
        opacity: 0.95
      }}>
        <div style={{ fontWeight: 600, marginBottom: '12px', color: theme === 'dark' ? '#8b949e' : '#656d76' }}>NODE TYPES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: NODE_COLORS.well,
              border: `2px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`
            }} />
            <span>Wells</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: NODE_COLORS.event,
              border: `2px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`
            }} />
            <span>Events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: NODE_COLORS.formation,
              border: `2px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`
            }} />
            <span>Formations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              backgroundColor: NODE_COLORS.equipment,
              border: `2px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'}`
            }} />
            <span>Equipment</span>
          </div>
        </div>
      </div>
    </div>
  );
};
