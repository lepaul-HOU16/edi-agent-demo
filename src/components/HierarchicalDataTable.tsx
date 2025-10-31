'use client';

import React, { useState, useCallback } from 'react';
import { Table, Box } from '@cloudscape-design/components';

interface HierarchicalDataTableProps {
  treeData: any;
  searchQuery?: string;
}

interface FlatItem {
  id: string;
  type: 'well' | 'wellbore' | 'welllog' | 'curve';
  name: string;
  level: number;
  parentId: string | null;
  metadata?: any;
  children?: any;
  isExpanded?: boolean;
}

interface SelectionState {
  wells: Set<string>;
  wellbores: Set<string>;
  welllogs: Set<string>;
  curves: Set<string>;
}

/**
 * HierarchicalDataTable Component
 * 
 * Renders a hierarchical data tree using Cloudscape Table component.
 * Supports expand/collapse, multi-select, and indentation for nested items.
 * Displays well -> wellbore -> welllog -> curve hierarchy.
 */
const HierarchicalDataTable: React.FC<HierarchicalDataTableProps> = ({ 
  treeData, 
  searchQuery = '' 
}) => {
  const [expandedWells, setExpandedWells] = useState<Set<string>>(new Set());
  const [expandedWellbores, setExpandedWellbores] = useState<Set<string>>(new Set());
  const [expandedWelllogs, setExpandedWelllogs] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectionState>({
    wells: new Set(),
    wellbores: new Set(),
    welllogs: new Set(),
    curves: new Set()
  });

  /**
   * Flatten hierarchical tree data into flat array for table display
   */
  const flattenHierarchy = useCallback((): FlatItem[] => {
    const flatItems: FlatItem[] = [];
    
    console.log('🌳 HierarchicalDataTable - flattenHierarchy called');
    console.log('🌳 treeData:', treeData);
    console.log('🌳 treeData.wells:', treeData?.wells);
    
    if (!treeData || !treeData.wells) {
      console.log('⚠️ No treeData or wells found');
      return flatItems;
    }

    // Iterate through wells
    Object.entries(treeData.wells).forEach(([wellId, wellData]: [string, any]) => {
      console.log(`🌳 Processing well ${wellId}:`, {
        wellData,
        hasWellbores: !!wellData.wellbores,
        wellboresType: typeof wellData.wellbores,
        wellboresKeys: wellData.wellbores ? Object.keys(wellData.wellbores) : [],
        wellboresCount: wellData.wellbores ? Object.keys(wellData.wellbores).length : 0
      });
      
      const wellName = wellData.name || wellData.data?.FacilityName || wellId;
      
      // Add well item
      flatItems.push({
        id: wellId,
        type: 'well',
        name: wellName,
        level: 0,
        parentId: null,
        metadata: wellData.data,
        children: wellData.wellbores || {},
        isExpanded: expandedWells.has(wellId)
      });

      // If well is expanded, add wellbores
      if (expandedWells.has(wellId) && wellData.wellbores) {
        Object.entries(wellData.wellbores).forEach(([wellboreId, wellboreData]: [string, any]) => {
          const wellboreName = wellboreData.name || wellboreId;
          
          // Add wellbore item
          flatItems.push({
            id: wellboreId,
            type: 'wellbore',
            name: wellboreName,
            level: 1,
            parentId: wellId,
            metadata: wellboreData,
            children: wellboreData.welllogs || {},
            isExpanded: expandedWellbores.has(wellboreId)
          });

          // If wellbore is expanded, add welllogs
          if (expandedWellbores.has(wellboreId) && wellboreData.welllogs) {
            Object.entries(wellboreData.welllogs).forEach(([welllogId, welllogData]: [string, any]) => {
              // Add welllog item
              flatItems.push({
                id: welllogId,
                type: 'welllog',
                name: welllogId,
                level: 2,
                parentId: wellboreId,
                metadata: welllogData,
                children: welllogData.Curves || welllogData.curves || [],
                isExpanded: expandedWelllogs.has(welllogId)
              });

              // If welllog is expanded, add curves
              if (expandedWelllogs.has(welllogId)) {
                const curves = welllogData.Curves || welllogData.curves || [];
                curves.forEach((curve: any) => {
                  // Extract curve name - handle both string and object formats
                  let curveName: string;
                  if (typeof curve === 'string') {
                    curveName = curve;
                  } else if (typeof curve === 'object' && curve !== null) {
                    // Try common field names for curve mnemonic
                    curveName = curve.Mnemonic || curve.mnemonic || 
                                curve.CurveName || curve.curveName || 
                                curve.Name || curve.name ||
                                JSON.stringify(curve);
                  } else {
                    curveName = String(curve);
                  }
                  
                  // Add curve item
                  flatItems.push({
                    id: `${welllogId}:${curveName}`,
                    type: 'curve',
                    name: curveName,
                    level: 3,
                    parentId: welllogId,
                    metadata: { curve, curveName, welllogId }
                  });
                });
              }
            });
          }
        });
      }
    });

    return flatItems;
  }, [treeData, expandedWells, expandedWellbores, expandedWelllogs]);

  /**
   * Handle expand/collapse button click
   */
  const handleExpandCollapse = useCallback((item: FlatItem) => {
    if (item.type === 'well') {
      setExpandedWells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else if (item.type === 'wellbore') {
      setExpandedWellbores(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else if (item.type === 'welllog') {
      setExpandedWelllogs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    }
  }, []);

  /**
   * Handle selection changes
   */
  const handleSelectionChange = useCallback((selectedTableItems: FlatItem[]) => {
    const newSelection: SelectionState = {
      wells: new Set(),
      wellbores: new Set(),
      welllogs: new Set(),
      curves: new Set()
    };

    selectedTableItems.forEach(item => {
      if (item.type === 'well') {
        newSelection.wells.add(item.id);
      } else if (item.type === 'wellbore') {
        newSelection.wellbores.add(item.id);
      } else if (item.type === 'welllog') {
        newSelection.welllogs.add(item.id);
      } else if (item.type === 'curve') {
        newSelection.curves.add(item.id);
      }
    });

    setSelectedItems(newSelection);
  }, []);

  const flatItems = flattenHierarchy();

  // Check if data is available
  if (flatItems.length === 0) {
    return (
      <Box textAlign="center" padding="l" color="text-body-secondary">
        <Box variant="p" fontSize="body-m" fontWeight="normal">
          No hierarchical data available
        </Box>
        <Box variant="p" fontSize="body-s" color="text-status-inactive" margin={{ top: 'xs' }}>
          Run <code>/getdata</code> command to load well data
        </Box>
      </Box>
    );
  }

  // Type badge colors
  const getTypeBadgeStyle = (type: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      well: { bg: '#e3f2fd', color: '#1976d2' },
      wellbore: { bg: '#fff3e0', color: '#f57c00' },
      welllog: { bg: '#f3e5f5', color: '#7b1fa2' },
      curve: { bg: '#e8f5e9', color: '#388e3c' }
    };
    return colors[type] || { bg: '#f5f5f5', color: '#666' };
  };

  // Type display names
  const getTypeDisplayName = (type: string) => {
    const names: Record<string, string> = {
      well: 'Well',
      wellbore: 'Wellbore',
      welllog: 'Log Group',
      curve: 'Log Curve'
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Column definitions
  const columnDefinitions = [
    {
      id: 'name',
      header: 'Name',
      cell: (item: FlatItem) => {
        const hasChildren = item.type !== 'curve';
        const indentPx = item.level * 30;
        const colors = getTypeBadgeStyle(item.type);
        
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            paddingLeft: `${indentPx}px`
          }}>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandCollapse(item);
                }}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px',
                  color: '#666',
                  minWidth: '20px'
                }}
                aria-label={item.isExpanded ? 'Collapse' : 'Expand'}
              >
                {item.isExpanded ? '▼' : '▶'}
              </button>
            )}
            {!hasChildren && <span style={{ width: '20px' }} />}
            <span style={{ 
              fontWeight: item.level === 0 ? 600 : 'normal',
              flex: 1
            }}>
              {item.name}
            </span>
          </div>
        );
      },
      sortingField: 'name',
      width: 400
    },
    {
      id: 'type',
      header: 'Type',
      cell: (item: FlatItem) => {
        const colors = getTypeBadgeStyle(item.type);
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
            background: colors.bg,
            color: colors.color,
            display: 'inline-block'
          }}>
            {getTypeDisplayName(item.type)}
          </span>
        );
      },
      width: 120
    },
    {
      id: 'details',
      header: 'Details',
      cell: (item: FlatItem) => {
        if (item.type === 'curve') {
          return <span style={{ fontSize: '13px', color: '#666' }}>Log curve mnemonic</span>;
        } else if (item.type === 'welllog' && item.metadata) {
          const curveCount = (item.metadata.Curves || item.metadata.curves || []).length;
          return <span style={{ fontSize: '13px', color: '#666' }}>{curveCount} log curves</span>;
        } else if (item.type === 'wellbore' && item.children) {
          const datasetCount = Object.keys(item.children).length;
          return <span style={{ fontSize: '13px', color: '#666' }}>{datasetCount} log groups</span>;
        } else if (item.type === 'well' && item.children) {
          const wellboreCount = Object.keys(item.children).length;
          return <span style={{ fontSize: '13px', color: '#666' }}>{wellboreCount} wellbores</span>;
        }
        return null;
      }
    }
  ];

  // Get selected table items
  const getSelectedTableItems = () => {
    return flatItems.filter(item => {
      if (item.type === 'well') return selectedItems.wells.has(item.id);
      if (item.type === 'wellbore') return selectedItems.wellbores.has(item.id);
      if (item.type === 'welllog') return selectedItems.welllogs.has(item.id);
      if (item.type === 'curve') return selectedItems.curves.has(item.id);
      return false;
    });
  };

  // Calculate selection summary
  const getSelectionSummary = () => {
    const wellCount = selectedItems.wells.size;
    const wellboreCount = selectedItems.wellbores.size;
    const welllogCount = selectedItems.welllogs.size;
    const curveCount = selectedItems.curves.size;
    const totalCount = wellCount + wellboreCount + welllogCount + curveCount;

    if (totalCount === 0) {
      return 'No items selected';
    }

    const parts = [];
    if (wellCount > 0) parts.push(`${wellCount} well${wellCount > 1 ? 's' : ''}`);
    if (wellboreCount > 0) parts.push(`${wellboreCount} wellbore${wellboreCount > 1 ? 's' : ''}`);
    if (welllogCount > 0) parts.push(`${welllogCount} log group${welllogCount > 1 ? 's' : ''}`);
    if (curveCount > 0) parts.push(`${curveCount} curve${curveCount > 1 ? 's' : ''}`);
    
    return `Selected: ${parts.join(', ')}`;
  };

  return (
    <div style={{ 
      marginTop: '15px', 
      marginBottom: '15px',
      maxWidth: '100%',
      width: '100%',
      border: '1px solid #d5dbdb',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e9ecef',
        backgroundColor: '#f9f9f9'
      }}>
        <Box variant="h3">
          Data Hierarchy
        </Box>
        <Box variant="small" color="text-body-secondary" margin={{ top: 'xxs' }}>
          {Object.keys(treeData?.wells || {}).length} wells • Expand to view wellbores, log groups, and curves
        </Box>
      </div>
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <Table
          columnDefinitions={columnDefinitions}
          items={flatItems}
          selectionType="multi"
          selectedItems={getSelectedTableItems()}
          onSelectionChange={({ detail }) => 
            handleSelectionChange(detail.selectedItems as FlatItem[])
          }
          trackBy="id"
          empty={
            <Box textAlign="center" color="inherit" padding="l">
              <Box variant="p" color="inherit">
                No data available
              </Box>
            </Box>
          }
          variant="embedded"
        />
      </div>
      {(selectedItems.wells.size > 0 || selectedItems.wellbores.size > 0 || 
        selectedItems.welllogs.size > 0 || selectedItems.curves.size > 0) && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e9ecef',
          backgroundColor: '#e3f2fd',
          fontSize: '13px',
          color: '#1976d2',
          fontWeight: 500
        }}>
          {getSelectionSummary()}
        </div>
      )}
    </div>
  );
};

export default HierarchicalDataTable;
