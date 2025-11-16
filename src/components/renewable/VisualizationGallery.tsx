/**
 * VisualizationGallery Component
 * 
 * Provides gallery view for browsing all available visualizations
 * with side-by-side comparison mode and visualization history.
 */

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Header, 
  Box, 
  SpaceBetween, 
  Grid, 
  Button, 
  Toggle, 
  Select,
  Tabs,
  Badge,
  Alert
} from '@cloudscape-design/components';
import { VisualizationData, CategorizedVisualizations } from '@/utils/VisualizationDataParser';
import VisualizationRenderer from './VisualizationRenderer';
import VisualizationExporter from '@/utils/VisualizationExporter';

interface VisualizationItem {
  id: string;
  title: string;
  url: string;
  category: 'chart' | 'map' | 'report';
  type: 'image' | 'html';
  htmlContent?: string;
  description?: string;
  timestamp?: Date;
}

interface VisualizationGalleryProps {
  visualizations: CategorizedVisualizations;
  title?: string;
  enableComparison?: boolean;
  enableBatchExport?: boolean;
}

export const VisualizationGallery: React.FC<VisualizationGalleryProps> = ({
  visualizations,
  title = 'Visualization Gallery',
  enableComparison = true,
  enableBatchExport = true
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedVisualizations, setSelectedVisualizations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'date'>('category');
  const [isExporting, setIsExporting] = useState(false);

  // Convert categorized visualizations to flat array
  const getAllVisualizations = (): VisualizationItem[] => {
    const items: VisualizationItem[] = [];
    
    // Add terrain visualizations
    if (visualizations.terrain_analysis) {
      Object.entries(visualizations.terrain_analysis).forEach(([key, url]) => {
        if (url && typeof url === 'string') {
          items.push({
            id: `terrain_${key}`,
            title: `Terrain ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            url,
            category: key.includes('map') ? 'map' : 'chart',
            type: key.includes('map') ? 'html' : 'image',
            description: `Terrain analysis: ${key.replace(/_/g, ' ')}`
          });
        }
      });
    }

    // Add wind visualizations
    if (visualizations.wind_analysis) {
      Object.entries(visualizations.wind_analysis).forEach(([key, url]) => {
        if (url && typeof url === 'string') {
          items.push({
            id: `wind_${key}`,
            title: `Wind ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            url,
            category: 'chart',
            type: 'image',
            description: `Wind analysis: ${key.replace(/_/g, ' ')}`
          });
        }
      });
    }

    // Add performance visualizations
    if (visualizations.performance_analysis) {
      Object.entries(visualizations.performance_analysis).forEach(([key, url]) => {
        if (url) {
          if (typeof url === 'string') {
            items.push({
              id: `performance_${key}`,
              title: `Performance ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
              url,
              category: 'chart',
              type: 'image',
              description: `Performance analysis: ${key.replace(/_/g, ' ')}`
            });
          } else if (Array.isArray(url)) {
            url.forEach((chartUrl, index) => {
              items.push({
                id: `performance_${key}_${index}`,
                title: `Performance ${key.replace(/_/g, ' ')} ${index + 1}`,
                url: chartUrl,
                category: 'chart',
                type: 'image',
                description: `Performance analysis: ${key.replace(/_/g, ' ')} (${index + 1})`
              });
            });
          }
        }
      });
    }

    // Add wake visualizations
    if (visualizations.wake_analysis) {
      Object.entries(visualizations.wake_analysis).forEach(([key, url]) => {
        if (url && typeof url === 'string') {
          items.push({
            id: `wake_${key}`,
            title: `Wake ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            url,
            category: 'chart',
            type: 'image',
            description: `Wake analysis: ${key.replace(/_/g, ' ')}`
          });
        }
      });
    }

    // Add reports
    if (visualizations.reports) {
      Object.entries(visualizations.reports).forEach(([key, url]) => {
        if (url) {
          items.push({
            id: `report_${key}`,
            title: `Report ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            url,
            category: 'report',
            type: 'image',
            description: `Report: ${key.replace(/_/g, ' ')}`
          });
        }
      });
    }

    return items;
  };

  const allVisualizations = getAllVisualizations();

  // Filter visualizations based on active tab
  const getFilteredVisualizations = () => {
    let filtered = allVisualizations;

    if (activeTab !== 'all') {
      filtered = filtered.filter(viz => viz.category === activeTab);
    }

    // Sort visualizations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'date':
          return (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0);
        case 'category':
        default:
          return a.category.localeCompare(b.category);
      }
    });

    return filtered;
  };

  const filteredVisualizations = getFilteredVisualizations();

  // Handle visualization selection for comparison
  const handleVisualizationSelect = (vizId: string) => {
    if (comparisonMode) {
      setSelectedVisualizations(prev => {
        if (prev.includes(vizId)) {
          return prev.filter(id => id !== vizId);
        } else if (prev.length < 4) { // Limit to 4 comparisons
          return [...prev, vizId];
        }
        return prev;
      });
    }
  };

  // Handle batch export
  const handleBatchExport = async () => {
    if (!enableBatchExport || selectedVisualizations.length === 0) return;

    setIsExporting(true);
    try {
      const exportItems = selectedVisualizations.map(vizId => {
        const viz = allVisualizations.find(v => v.id === vizId);
        if (!viz) return null;

        return {
          url: viz.url,
          filename: viz.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
          type: viz.type,
          htmlContent: viz.htmlContent
        };
      }).filter(Boolean) as any[];

      await VisualizationExporter.batchExport(exportItems);
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('Batch export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get tab items
  const getTabItems = () => {
    const categories = ['all', 'chart', 'map', 'report'];
    return categories.map(category => ({
      id: category,
      label: category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1),
      content: null // Content will be rendered separately
    }));
  };

  // Render visualization grid
  const renderVisualizationGrid = () => {
    if (filteredVisualizations.length === 0) {
      return (
        <Box textAlign="center" padding="xl">
          <div style={{ color: '#666', fontSize: '16px' }}>
            📊 No visualizations available
          </div>
          <div style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>
            {activeTab === 'all' ? 'No visualizations found' : `No ${activeTab} visualizations found`}
          </div>
        </Box>
      );
    }

    if (comparisonMode && selectedVisualizations.length > 0) {
      // Comparison view
      const selectedVizs = selectedVisualizations.map(id => 
        allVisualizations.find(v => v.id === id)
      ).filter(Boolean) as VisualizationItem[];

      return (
        <Grid gridDefinition={[
          { colspan: selectedVizs.length > 2 ? 6 : 12 },
          { colspan: selectedVizs.length > 2 ? 6 : 12 },
          ...(selectedVizs.length > 2 ? [{ colspan: 6 }, { colspan: 6 }] : [])
        ]}>
          {selectedVizs.map((viz, index) => (
            <div key={viz.id} style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px', 
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                padding: '4px'
              }}>
                <Button
                  variant="icon"
                  iconName="close"
                  onClick={() => handleVisualizationSelect(viz.id)}
                  ariaLabel="Remove from comparison"
                />
              </div>
              <VisualizationRenderer
                imageUrl={viz.type === 'image' ? viz.url : undefined}
                htmlContent={viz.type === 'html' ? viz.htmlContent || viz.url : undefined}
                title={viz.title}
                description={viz.description}
                category={viz.category}
                height="400px"
                enableFullScreen={true}
                enableExport={true}
              />
            </div>
          ))}
        </Grid>
      );
    }

    // Grid or list view
    if (viewMode === 'grid') {
      return (
        <Grid gridDefinition={[
          { colspan: 6 },
          { colspan: 6 },
          { colspan: 6 },
          { colspan: 6 }
        ]}>
          {filteredVisualizations.map(viz => (
            <div 
              key={viz.id} 
              style={{ 
                position: 'relative',
                cursor: comparisonMode ? 'pointer' : 'default',
                border: selectedVisualizations.includes(viz.id) ? '2px solid #0972d3' : 'none',
                borderRadius: '8px',
                padding: selectedVisualizations.includes(viz.id) ? '4px' : '0'
              }}
              onClick={() => handleVisualizationSelect(viz.id)}
            >
              {comparisonMode && (
                <div style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  left: '8px', 
                  zIndex: 10 
                }}>
                  <Badge color={selectedVisualizations.includes(viz.id) ? 'blue' : 'grey'}>
                    {selectedVisualizations.includes(viz.id) ? '✓ Selected' : 'Click to compare'}
                  </Badge>
                </div>
              )}
              <VisualizationRenderer
                imageUrl={viz.type === 'image' ? viz.url : undefined}
                htmlContent={viz.type === 'html' ? viz.htmlContent || viz.url : undefined}
                title={viz.title}
                description={viz.description}
                category={viz.category}
                height="300px"
                enableFullScreen={!comparisonMode}
                enableExport={!comparisonMode}
              />
            </div>
          ))}
        </Grid>
      );
    } else {
      // List view
      return (
        <SpaceBetween size="m">
          {filteredVisualizations.map(viz => (
            <div 
              key={viz.id}
              style={{ 
                cursor: comparisonMode ? 'pointer' : 'default',
                border: selectedVisualizations.includes(viz.id) ? '2px solid #0972d3' : '1px solid #e9ebed',
                borderRadius: '8px',
                padding: '16px'
              }}
              onClick={() => handleVisualizationSelect(viz.id)}
            >
              <VisualizationRenderer
                imageUrl={viz.type === 'image' ? viz.url : undefined}
                htmlContent={viz.type === 'html' ? viz.htmlContent || viz.url : undefined}
                title={viz.title}
                description={viz.description}
                category={viz.category}
                height="200px"
                enableFullScreen={!comparisonMode}
                enableExport={!comparisonMode}
              />
            </div>
          ))}
        </SpaceBetween>
      );
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={`Browse and compare ${allVisualizations.length} visualizations`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {enableComparison && (
                <Toggle
                  checked={comparisonMode}
                  onChange={({ detail }) => {
                    setComparisonMode(detail.checked);
                    if (!detail.checked) {
                      setSelectedVisualizations([]);
                    }
                  }}
                >
                  Comparison Mode
                </Toggle>
              )}
              
              <Select
                selectedOption={{ label: viewMode === 'grid' ? 'Grid' : 'List', value: viewMode }}
                onChange={({ detail }) => setViewMode(detail.selectedOption.value as 'grid' | 'list')}
                options={[
                  { label: 'Grid', value: 'grid' },
                  { label: 'List', value: 'list' }
                ]}
                disabled={comparisonMode}
              />

              <Select
                selectedOption={{ 
                  label: sortBy === 'name' ? 'Name' : sortBy === 'date' ? 'Date' : 'Category', 
                  value: sortBy 
                }}
                onChange={({ detail }) => setSortBy(detail.selectedOption.value as 'name' | 'category' | 'date')}
                options={[
                  { label: 'Category', value: 'category' },
                  { label: 'Name', value: 'name' },
                  { label: 'Date', value: 'date' }
                ]}
              />

              {enableBatchExport && selectedVisualizations.length > 0 && (
                <Button
                  variant="primary"
                  iconName="download"
                  onClick={handleBatchExport}
                  loading={isExporting}
                >
                  Export Selected ({selectedVisualizations.length})
                </Button>
              )}
            </SpaceBetween>
          }
        >
          {title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {comparisonMode && (
          <Alert
            type="info"
            header="Comparison Mode Active"
          >
            Click on visualizations to select them for comparison (max 4). 
            Selected: {selectedVisualizations.length}/4
          </Alert>
        )}

        <Tabs
          tabs={getTabItems()}
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        />

        {renderVisualizationGrid()}
      </SpaceBetween>
    </Container>
  );
};

export default VisualizationGallery;