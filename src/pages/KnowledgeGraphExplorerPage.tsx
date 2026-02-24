import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCollection } from '@/lib/api/collections';
import { createSession } from '@/lib/api/sessions';
import { D3ForceGraph } from '@/components/knowledgeGraph/D3ForceGraph';
import { LeafletMapView } from '@/components/knowledgeGraph/LeafletMapView';
import { FilterSidebar } from '@/components/knowledgeGraph/FilterSidebar';
import { DetailsPanel } from '@/components/knowledgeGraph/DetailsPanel';
import { loadLASFilesFromCollection } from '@/services/knowledgeGraph/lasDataLoader';
import { buildKnowledgeGraph } from '@/services/knowledgeGraph/graphBuilder';
import { GraphData, GraphNode, FilterState } from '@/types/knowledgeGraph';
import './KnowledgeGraphExplorer.css';
import theme from '@/theme';

function KnowledgeGraphExplorerPage() {
  const params = useParams();
  const navigate = useNavigate();
  const collectionId = params.collectionId as string;
  
  const [collection, setCollection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sync with global theme from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === null ? true : savedMode === 'true';
  });
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [creatingCanvas, setCreatingCanvas] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 400 });
  
  const [filters, setFilters] = useState<FilterState>({
    nodeTypes: new Set(['well', 'event', 'formation', 'equipment']),
    relationshipTypes: new Set(['correlation', 'hierarchy', 'event-link', 'duplicate']),
    qualityLevels: new Set(['high', 'medium', 'low']),
    searchQuery: '',
    showDuplicatesOnly: false,
    selectedWells: new Set() // Empty = show all wells
  });

  useEffect(() => {
    loadCollectionData();
  }, [collectionId]);

  // Listen for global theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const { width, height } = graphContainerRef.current.getBoundingClientRect();
        setGraphDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading collection for Knowledge Graph:', collectionId);
      
      const response = await getCollection(collectionId);
      
      if (response.success && response.collection) {
        console.log('✅ Collection loaded for Knowledge Graph:', response.collection);
        setCollection(response.collection);
        await buildGraphFromCollection(response.collection);
      } else {
        console.error('❌ Collection not found');
        setError('Collection not found');
      }
    } catch (err) {
      console.error('❌ Error loading collection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const buildGraphFromCollection = async (collection: any) => {
    try {
      setLoadingGraph(true);
      setGraphError(null);
      console.log('🔨 Building knowledge graph from collection data...');
      
      if (!collection.dataItems || collection.dataItems.length === 0) {
        setGraphError('No data items found in collection. Add wells to this collection to build the knowledge graph.');
        setGraphData({ nodes: [], links: [] });
        return;
      }
      
      const lasFiles = await loadLASFilesFromCollection(collection.dataItems);
      console.log(`📊 Loaded ${lasFiles.length} LAS files from collection`);
      
      if (lasFiles.length === 0) {
        setGraphError('No valid LAS files found in collection data items.');
        setGraphData({ nodes: [], links: [] });
        return;
      }
      
      const graph = await buildKnowledgeGraph(lasFiles);
      console.log(`✅ Built graph with ${graph.nodes.length} nodes and ${graph.links.length} links`);
      
      if (graph.nodes.length === 0) {
        setGraphError('No valid well data found in collection.');
        setGraphData({ nodes: [], links: [] });
        return;
      }
      
      setGraphData(graph);
      setGraphError(null);
    } catch (err) {
      console.error('❌ Error building knowledge graph:', err);
      setGraphError(err instanceof Error ? err.message : 'Failed to build knowledge graph');
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleNodeSelect = (node: GraphNode) => {
    console.log('🎯 Node selected:', node);
    setSelectedNode(node);
    
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: value
    }));
  };

  const handleCreateCanvasFromSelection = async () => {
    if (selectedNodes.size === 0) return;
    
    try {
      setCreatingCanvas(true);
      
      const selectedNodeData = graphData.nodes.filter(node => selectedNodes.has(node.id));
      const canvasName = selectedNodes.size === 1
        ? `Analysis: ${selectedNodeData[0].name}`
        : `Analysis: ${selectedNodes.size} Wells from ${collection.name}`;
      
      const response = await createSession({
        name: canvasName,
        linkedCollectionId: collectionId
      });
      
      if (response.success && response.sessionId) {
        console.log('✅ Canvas created:', response.sessionId);
        setTimeout(() => {
          navigate(`/chat/${response.sessionId}`);
        }, 500);
      }
    } catch (err) {
      console.error('❌ Error creating canvas:', err);
    } finally {
      setCreatingCanvas(false);
    }
  };

  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    // Dispatch event to sync with other components
    window.dispatchEvent(new Event('themechange'));
    
    // Update body attributes for Cloudscape
    document.body.setAttribute('data-awsui-mode', newMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  const calculateFilteredStatistics = () => {
    const visibleNodes = graphData.nodes.filter(node => {
      if (!filters.nodeTypes.has(node.type)) return false;
      if (node.qualityLevel && !filters.qualityLevels.has(node.qualityLevel)) return false;
      if (filters.searchQuery && !node.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
    
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = graphData.links.filter(link => {
      if (!filters.relationshipTypes.has(link.type)) return false;
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });
    
    const linkTypeCounts: Record<string, number> = {};
    visibleLinks.forEach(link => {
      linkTypeCounts[link.type] = (linkTypeCounts[link.type] || 0) + 1;
    });
    
    return {
      totalNodes: visibleNodes.length,
      totalLinks: visibleLinks.length,
      duplicatesFound: linkTypeCounts['duplicate'] || 0,
      dataSources: ['EDI Platform', 'S3 Data Lake'],
      nodeTypeCounts: {},
      linkTypeCounts,
      qualityDistribution: { high: 0, medium: 0, low: 0 }
    };
  };

  const getRelatedNodes = (node: GraphNode) => {
    if (!node) return [];
    
    const related: any[] = [];
    graphData.links.forEach(link => {
      let relatedNodeId: string | null = null;
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (sourceId === node.id) {
        relatedNodeId = targetId;
      } else if (targetId === node.id) {
        relatedNodeId = sourceId;
      }
      
      if (relatedNodeId) {
        const relatedNode = graphData.nodes.find(n => n.id === relatedNodeId);
        if (relatedNode) {
          related.push({
            node: relatedNode,
            relationship: link.type,
            label: link.label
          });
        }
      }
    });
    
    return related;
  };

  if (loading) {
    return (
      <div className={`kg-container ${darkMode ? '' : 'light-mode'}`}>
        <div className="kg-loading">
          <div className="kg-loading-spinner"></div>
          <div className="kg-loading-text">Loading Knowledge Graph...</div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className={`kg-container ${darkMode ? '' : 'light-mode'}`}>
        <div className="kg-error">
          <div className="kg-error-icon">⚠️</div>
          <div className="kg-error-title">Unable to Load Collection</div>
          <div className="kg-error-message">{error || 'Collection not found'}</div>
          <div className="kg-error-actions">
            <button className="kg-btn kg-btn-secondary" onClick={() => navigate('/collections')}>
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`kg-container ${darkMode ? '' : 'light-mode'}`}>
      <div className="kg-header">
        <h1 className="kg-title">🔗 Knowledge Graph Explorer</h1>
        <div className="kg-search-box">
          <input
            type="text"
            placeholder="Search wells, events, formations, equipment..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="kg-search-input"
          />
        </div>
        <div className="kg-data-sources">
          <span className="kg-data-sources-label">Data Sources:</span>
          <span className="kg-data-source kg-data-source-edi">EDI Platform</span>
          <span className="kg-data-sources-separator">•</span>
          <span className="kg-data-source kg-data-source-s3">S3 Data Lake</span>
        </div>
      </div>
      
      <div className="kg-sidebar">
        <FilterSidebar
          filters={filters}
          graphData={graphData}
          onFilterChange={setFilters}
        />
      </div>
      
      <div className="kg-main-content">
        <div className="kg-split-container">
          <div className="kg-graph-container" ref={graphContainerRef}>
            {loadingGraph ? (
              <div className="kg-graph-loading">
                <div className="kg-loading-spinner"></div>
                <div className="kg-loading-text">Building knowledge graph...</div>
              </div>
            ) : graphError ? (
              <div className="kg-graph-error">
                <div className="kg-error-icon">⚠️</div>
                <div className="kg-error-title">Graph Building Failed</div>
                <div className="kg-error-message">{graphError}</div>
              </div>
            ) : graphData.nodes.length > 0 ? (
              <D3ForceGraph
                data={graphData}
                selectedNodeId={selectedNode?.id || null}
                selectedNodeIds={selectedNodes}
                onNodeSelect={handleNodeSelect}
                filters={filters}
                width={graphDimensions.width}
                height={graphDimensions.height}
                theme={darkMode ? 'dark' : 'light'}
              />
            ) : (
              <div className="kg-graph-empty">
                <div className="kg-empty-icon">📊</div>
                <div className="kg-empty-title">No Graph Data</div>
                <div className="kg-empty-message">No data items found in collection</div>
              </div>
            )}
          </div>
          
          <div className="kg-divider"></div>
          
          <div className="kg-map-container">
            {graphData.nodes.filter(n => n.lat && n.lng).length > 0 ? (
              <>
                <LeafletMapView
                  nodes={graphData.nodes}
                  selectedNodeId={selectedNode?.id || null}
                  onNodeSelect={handleNodeSelect}
                  theme={theme}
                  viewMode="markers"
                />
                <div style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  display: 'flex',
                  gap: '8px',
                  zIndex: 1000
                }}>
                  <button
                    className="kg-btn"
                    style={{
                      background: theme === 'dark' ? '#58a6ff' : '#0969da',
                      borderColor: theme === 'dark' ? '#58a6ff' : '#0969da',
                      color: 'white'
                    }}
                    title="Markers View"
                  >
                    📍 Markers
                  </button>
                </div>
              </>
            ) : (
              <div className="kg-map-placeholder">
                <div className="kg-empty-icon">🗺️</div>
                <div className="kg-empty-title">No Geographic Data</div>
                <div className="kg-empty-message">No entities with coordinates available for map visualization</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="kg-details-panel">
        <DetailsPanel
          node={selectedNode}
          relatedNodes={selectedNode ? getRelatedNodes(selectedNode) : []}
          sourceDocs={selectedNode?.sourceDocs || []}
          lineage={selectedNode?.lineage || []}
          quality={selectedNode?.quality || null}
          statistics={calculateFilteredStatistics()}
          onNodeSelect={(nodeId) => {
            const node = graphData.nodes.find(n => n.id === nodeId);
            if (node) handleNodeSelect(node);
          }}
          onCreateCanvas={handleCreateCanvasFromSelection}
        />
      </div>
    </div>
  );
}

export default KnowledgeGraphExplorerPage;
