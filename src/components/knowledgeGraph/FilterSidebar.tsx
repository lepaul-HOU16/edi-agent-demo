import React from 'react';
import { FilterState, GraphData } from '@/types/knowledgeGraph';
import './FilterSidebar.css';

interface FilterSidebarProps {
  filters: FilterState;
  graphData: GraphData;
  onFilterChange: (filters: FilterState) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  graphData,
  onFilterChange
}) => {
  const [wellSearchQuery, setWellSearchQuery] = React.useState('');
  const [showAllWells, setShowAllWells] = React.useState(true);

  const calculateCounts = () => {
    const nodeTypeCounts: Record<string, number> = {
      well: 0,
      event: 0,
      formation: 0,
      equipment: 0
    };

    const relationshipTypeCounts: Record<string, number> = {
      correlation: 0,
      hierarchy: 0,
      'event-link': 0,
      duplicate: 0
    };

    const qualityLevelCounts: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0
    };

    graphData.nodes.forEach(node => {
      if (node.type in nodeTypeCounts) {
        nodeTypeCounts[node.type]++;
      }
      if (node.qualityLevel) {
        qualityLevelCounts[node.qualityLevel]++;
      }
    });

    graphData.links.forEach(link => {
      if (link.type in relationshipTypeCounts) {
        relationshipTypeCounts[link.type]++;
      }
    });

    return {
      nodeTypes: nodeTypeCounts,
      relationshipTypes: relationshipTypeCounts,
      qualityLevels: qualityLevelCounts
    };
  };

  const counts = calculateCounts();

  // Get all well nodes
  const allWells = graphData.nodes.filter(n => n.type === 'well');
  const filteredWells = wellSearchQuery
    ? allWells.filter(w => w.name.toLowerCase().includes(wellSearchQuery.toLowerCase()))
    : allWells;

  const handleNodeTypeToggle = (nodeType: string) => {
    const newTypes = new Set(filters.nodeTypes);
    if (newTypes.has(nodeType)) {
      newTypes.delete(nodeType);
    } else {
      newTypes.add(nodeType);
    }
    onFilterChange({ ...filters, nodeTypes: newTypes });
  };

  const handleRelationshipTypeToggle = (relType: string) => {
    const newTypes = new Set(filters.relationshipTypes);
    if (newTypes.has(relType)) {
      newTypes.delete(relType);
    } else {
      newTypes.add(relType);
    }
    onFilterChange({ ...filters, relationshipTypes: newTypes });
  };

  const handleQualityLevelToggle = (level: string) => {
    const newLevels = new Set(filters.qualityLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    onFilterChange({ ...filters, qualityLevels: newLevels });
  };

  const handleWellToggle = (wellId: string) => {
    const newSelectedWells = new Set(filters.selectedWells || new Set());
    if (newSelectedWells.has(wellId)) {
      newSelectedWells.delete(wellId);
    } else {
      newSelectedWells.add(wellId);
    }
    onFilterChange({ ...filters, selectedWells: newSelectedWells });
    setShowAllWells(false);
  };

  const handleSelectAllWells = () => {
    if (showAllWells) {
      // Deselect all
      onFilterChange({ ...filters, selectedWells: new Set() });
      setShowAllWells(false);
    } else {
      // Select all
      const allWellIds = new Set(allWells.map(w => w.id));
      onFilterChange({ ...filters, selectedWells: allWellIds });
      setShowAllWells(true);
    }
  };

  return (
    <div className="filter-sidebar">
      <h2 className="filter-sidebar-title">FILTERS</h2>
      
      <div className="filter-group">
        <h3 className="filter-group-title">Select Wells</h3>
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Search wells..."
            value={wellSearchQuery}
            onChange={(e) => setWellSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              border: '1px solid #30363d',
              borderRadius: '4px',
              background: '#0d1117',
              color: '#e6edf3'
            }}
          />
        </div>
        <div className="filter-item" onClick={handleSelectAllWells}>
          <input
            type="checkbox"
            checked={showAllWells}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">All Wells</label>
          <span className="filter-count">{allWells.length}</span>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
          {filteredWells.map(well => (
            <div key={well.id} className="filter-item" onClick={() => handleWellToggle(well.id)}>
              <input
                type="checkbox"
                checked={filters.selectedWells?.has(well.id) || showAllWells}
                onChange={() => {}}
                className="filter-checkbox"
              />
              <label className="filter-label" style={{ fontSize: '11px' }}>{well.name}</label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="filter-group">
        <h3 className="filter-group-title">Node Types</h3>
        <div className="filter-item" onClick={() => handleNodeTypeToggle('well')}>
          <input
            type="checkbox"
            checked={filters.nodeTypes.has('well')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Wells</label>
          <span className="filter-count">{counts.nodeTypes.well}</span>
        </div>
        <div className="filter-item" onClick={() => handleNodeTypeToggle('event')}>
          <input
            type="checkbox"
            checked={filters.nodeTypes.has('event')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Events</label>
          <span className="filter-count">{counts.nodeTypes.event}</span>
        </div>
        <div className="filter-item" onClick={() => handleNodeTypeToggle('formation')}>
          <input
            type="checkbox"
            checked={filters.nodeTypes.has('formation')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Formations</label>
          <span className="filter-count">{counts.nodeTypes.formation}</span>
        </div>
        <div className="filter-item" onClick={() => handleNodeTypeToggle('equipment')}>
          <input
            type="checkbox"
            checked={filters.nodeTypes.has('equipment')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Equipment</label>
          <span className="filter-count">{counts.nodeTypes.equipment}</span>
        </div>
      </div>
      
      <div className="filter-group">
        <h3 className="filter-group-title">Relationship Types</h3>
        <div className="filter-item" onClick={() => handleRelationshipTypeToggle('correlation')}>
          <input
            type="checkbox"
            checked={filters.relationshipTypes.has('correlation')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Correlations</label>
          <span className="filter-count">{counts.relationshipTypes.correlation}</span>
        </div>
        <div className="filter-item" onClick={() => handleRelationshipTypeToggle('hierarchy')}>
          <input
            type="checkbox"
            checked={filters.relationshipTypes.has('hierarchy')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Hierarchies</label>
          <span className="filter-count">{counts.relationshipTypes.hierarchy}</span>
        </div>
        <div className="filter-item" onClick={() => handleRelationshipTypeToggle('event-link')}>
          <input
            type="checkbox"
            checked={filters.relationshipTypes.has('event-link')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Event Links</label>
          <span className="filter-count">{counts.relationshipTypes['event-link']}</span>
        </div>
        <div className="filter-item" onClick={() => handleRelationshipTypeToggle('duplicate')}>
          <input
            type="checkbox"
            checked={filters.relationshipTypes.has('duplicate')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Duplicates</label>
          <span className="filter-count">{counts.relationshipTypes.duplicate}</span>
        </div>
      </div>
      
      <div className="filter-group">
        <h3 className="filter-group-title">Data Quality</h3>
        <div className="filter-item" onClick={() => handleQualityLevelToggle('high')}>
          <input
            type="checkbox"
            checked={filters.qualityLevels.has('high')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">High Quality</label>
          <span className="filter-count">{counts.qualityLevels.high}</span>
        </div>
        <div className="filter-item" onClick={() => handleQualityLevelToggle('medium')}>
          <input
            type="checkbox"
            checked={filters.qualityLevels.has('medium')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Medium Quality</label>
          <span className="filter-count">{counts.qualityLevels.medium}</span>
        </div>
        <div className="filter-item" onClick={() => handleQualityLevelToggle('low')}>
          <input
            type="checkbox"
            checked={filters.qualityLevels.has('low')}
            onChange={() => {}}
            className="filter-checkbox"
          />
          <label className="filter-label">Low Quality</label>
          <span className="filter-count">{counts.qualityLevels.low}</span>
        </div>
      </div>
    </div>
  );
};
