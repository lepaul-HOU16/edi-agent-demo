/**
 * Layout Comparison Tool Component
 * 
 * Provides side-by-side comparison of different layout optimization scenarios
 * with detailed metrics and trade-off analysis.
 */

import React, { useState, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Table,
  TableProps,
  Button,
  Badge,
  StatusIndicator,
  ColumnLayout,
  ProgressBar,
  Select,
  SelectProps,
  Toggle,
  Alert,
  Tabs,
  TabsProps
} from '@cloudscape-design/components';
import { OptimizedLayout, PerformanceMetrics } from '../../types/layoutOptimization';

// ============================================================================
// Component Props
// ============================================================================

interface LayoutComparisonToolProps {
  layouts: OptimizedLayout[];
  onSelectLayout?: (layoutId: string) => void;
  onExportComparison?: (format: 'pdf' | 'excel' | 'csv') => void;
  onCloneLayout?: (layoutId: string) => void;
  onOptimizeLayout?: (layoutId: string, parameters: any) => void;
}

// ============================================================================
// Helper Types
// ============================================================================

interface ComparisonMetric {
  id: string;
  name: string;
  unit: string;
  category: 'energy' | 'economic' | 'technical' | 'environmental';
  higherIsBetter: boolean;
  getValue: (layout: OptimizedLayout) => number;
  getDisplayValue: (value: number) => string;
}

interface LayoutScore {
  layoutId: string;
  scores: Record<string, number>; // metric id -> normalized score (0-1)
  overallScore: number;
  rank: number;
}

interface ComparisonSummary {
  bestLayout: string;
  worstLayout: string;
  keyDifferences: string[];
  recommendations: string[];
}

// ============================================================================
// Comparison Metrics Configuration
// ============================================================================

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    id: 'energy_yield',
    name: 'Annual Energy Yield',
    unit: 'MWh/year',
    category: 'energy',
    higherIsBetter: true,
    getValue: (layout) => layout.energyAnalysis.annualEnergyYield,
    getDisplayValue: (value) => value.toLocaleString()
  },
  {
    id: 'capacity_factor',
    name: 'Capacity Factor',
    unit: '%',
    category: 'energy',
    higherIsBetter: true,
    getValue: (layout) => layout.energyAnalysis.capacityFactor,
    getDisplayValue: (value) => `${value.toFixed(1)}%`
  },
  {
    id: 'wake_losses',
    name: 'Wake Losses',
    unit: '%',
    category: 'energy',
    higherIsBetter: false,
    getValue: (layout) => layout.energyAnalysis.lossBreakdown.wakeLosses,
    getDisplayValue: (value) => `${value.toFixed(1)}%`
  },
  {
    id: 'lcoe',
    name: 'LCOE',
    unit: '$/MWh',
    category: 'economic',
    higherIsBetter: false,
    getValue: (layout) => layout.costAnalysis.levelizedCostOfEnergy,
    getDisplayValue: (value) => `$${value.toFixed(2)}`
  },
  {
    id: 'npv',
    name: 'Net Present Value',
    unit: '$M',
    category: 'economic',
    higherIsBetter: true,
    getValue: (layout) => layout.costAnalysis.netPresentValue / 1e6,
    getDisplayValue: (value) => `$${value.toFixed(1)}M`
  },
  {
    id: 'irr',
    name: 'Internal Rate of Return',
    unit: '%',
    category: 'economic',
    higherIsBetter: true,
    getValue: (layout) => layout.costAnalysis.internalRateOfReturn,
    getDisplayValue: (value) => `${value.toFixed(1)}%`
  },
  {
    id: 'turbine_count',
    name: 'Turbine Count',
    unit: 'units',
    category: 'technical',
    higherIsBetter: true,
    getValue: (layout) => layout.layoutMetrics.turbineCount,
    getDisplayValue: (value) => value.toString()
  },
  {
    id: 'power_density',
    name: 'Power Density',
    unit: 'MW/km²',
    category: 'technical',
    higherIsBetter: true,
    getValue: (layout) => layout.layoutMetrics.powerDensity,
    getDisplayValue: (value) => `${value.toFixed(2)}`
  },
  {
    id: 'constraint_violations',
    name: 'Constraint Violations',
    unit: 'count',
    category: 'technical',
    higherIsBetter: false,
    getValue: (layout) => layout.constraintViolations.length,
    getDisplayValue: (value) => value.toString()
  },
  {
    id: 'land_use_efficiency',
    name: 'Land Use Efficiency',
    unit: 'MW/ha',
    category: 'environmental',
    higherIsBetter: true,
    getValue: (layout) => layout.layoutMetrics.landUseEfficiency,
    getDisplayValue: (value) => `${value.toFixed(3)}`
  }
];

// ============================================================================
// Main Component
// ============================================================================

export const LayoutComparisonTool: React.FC<LayoutComparisonToolProps> = ({
  layouts,
  onSelectLayout,
  onExportComparison,
  onCloneLayout,
  onOptimizeLayout
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    COMPARISON_METRICS.slice(0, 6).map(m => m.id)
  );
  const [showNormalizedScores, setShowNormalizedScores] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison');
  const [sortColumn, setSortColumn] = useState<string>('energy_yield');
  const [sortDescending, setSortDescending] = useState(true);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const layoutScores = useMemo((): LayoutScore[] => {
    if (layouts.length === 0) return [];

    // Calculate normalized scores for each metric
    const scores = layouts.map(layout => {
      const layoutScores: Record<string, number> = {};
      
      COMPARISON_METRICS.forEach(metric => {
        const value = metric.getValue(layout);
        const allValues = layouts.map(l => metric.getValue(l));
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        
        let normalizedScore = 0;
        if (max !== min) {
          normalizedScore = (value - min) / (max - min);
          if (!metric.higherIsBetter) {
            normalizedScore = 1 - normalizedScore;
          }
        } else {
          normalizedScore = 1; // All values are the same
        }
        
        layoutScores[metric.id] = normalizedScore;
      });
      
      // Calculate overall score (average of selected metrics)
      const selectedScores = selectedMetrics.map(id => layoutScores[id] || 0);
      const overallScore = selectedScores.reduce((sum, score) => sum + score, 0) / selectedScores.length;
      
      return {
        layoutId: layout.id,
        scores: layoutScores,
        overallScore,
        rank: 0 // Will be calculated after sorting
      };
    });
    
    // Assign ranks
    scores.sort((a, b) => b.overallScore - a.overallScore);
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });
    
    return scores;
  }, [layouts, selectedMetrics]);

  const comparisonSummary = useMemo((): ComparisonSummary => {
    if (layoutScores.length === 0) {
      return {
        bestLayout: '',
        worstLayout: '',
        keyDifferences: [],
        recommendations: []
      };
    }

    const best = layoutScores[0];
    const worst = layoutScores[layoutScores.length - 1];
    
    const bestLayout = layouts.find(l => l.id === best.layoutId);
    const worstLayout = layouts.find(l => l.id === worst.layoutId);
    
    const keyDifferences: string[] = [];
    const recommendations: string[] = [];
    
    if (bestLayout && worstLayout) {
      // Energy yield difference
      const energyDiff = bestLayout.energyAnalysis.annualEnergyYield - worstLayout.energyAnalysis.annualEnergyYield;
      if (energyDiff > 1000) {
        keyDifferences.push(`Best layout produces ${energyDiff.toLocaleString()} MWh/year more energy`);
      }
      
      // Wake loss difference
      const wakeDiff = worstLayout.energyAnalysis.lossBreakdown.wakeLosses - bestLayout.energyAnalysis.lossBreakdown.wakeLosses;
      if (wakeDiff > 1) {
        keyDifferences.push(`Best layout has ${wakeDiff.toFixed(1)}% lower wake losses`);
      }
      
      // Economic difference
      const lcoeDiff = worstLayout.costAnalysis.levelizedCostOfEnergy - bestLayout.costAnalysis.levelizedCostOfEnergy;
      if (lcoeDiff > 1) {
        keyDifferences.push(`Best layout has $${lcoeDiff.toFixed(2)}/MWh lower LCOE`);
      }
      
      // Generate recommendations
      if (best.overallScore - worst.overallScore > 0.2) {
        recommendations.push('Consider adopting the best-performing layout configuration');
      }
      
      if (bestLayout.constraintViolations.length < worstLayout.constraintViolations.length) {
        recommendations.push('Focus on layouts with fewer constraint violations');
      }
      
      if (bestLayout.energyAnalysis.lossBreakdown.wakeLosses < 10) {
        recommendations.push('Prioritize layouts with low wake losses for maximum energy yield');
      }
    }
    
    return {
      bestLayout: best.layoutId,
      worstLayout: worst.layoutId,
      keyDifferences,
      recommendations
    };
  }, [layoutScores, layouts]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleMetricSelection = (selectedOptions: SelectProps.Option[]) => {
    setSelectedMetrics(selectedOptions.map(option => option.value as string));
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDescending(!sortDescending);
    } else {
      setSortColumn(columnId);
      setSortDescending(true);
    }
  };

  const handleExportComparison = (format: 'pdf' | 'excel' | 'csv') => {
    onExportComparison?.(format);
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderComparisonSummary = () => (
    <Container header={<Header variant="h2">Comparison Summary</Header>}>
      <SpaceBetween direction="vertical" size="m">
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Best Performing Layout</Box>
              <Box variant="h3">{comparisonSummary.bestLayout}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Layouts Compared</Box>
              <Box>{layouts.length}</Box>
            </Box>
          </SpaceBetween>
          
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Lowest Performing Layout</Box>
              <Box variant="h3">{comparisonSummary.worstLayout}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Metrics Evaluated</Box>
              <Box>{selectedMetrics.length}</Box>
            </Box>
          </SpaceBetween>
        </ColumnLayout>
        
        {comparisonSummary.keyDifferences.length > 0 && (
          <Box>
            <Box variant="awsui-key-label">Key Differences</Box>
            <SpaceBetween direction="vertical" size="xs">
              {comparisonSummary.keyDifferences.map((difference, index) => (
                <Box key={index} variant="small">• {difference}</Box>
              ))}
            </SpaceBetween>
          </Box>
        )}
        
        {comparisonSummary.recommendations.length > 0 && (
          <Box>
            <Box variant="awsui-key-label">Recommendations</Box>
            <SpaceBetween direction="vertical" size="xs">
              {comparisonSummary.recommendations.map((recommendation, index) => (
                <Box key={index} variant="small">• {recommendation}</Box>
              ))}
            </SpaceBetween>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );

  const renderMetricSelection = () => (
    <Container header={<Header variant="h3">Comparison Settings</Header>}>
      <SpaceBetween direction="vertical" size="m">
        <Box>
          <Box variant="awsui-key-label">Select Metrics to Compare</Box>
          <Select
            selectedOption={null}
            onChange={() => {}} // Placeholder - would implement multi-select
            options={COMPARISON_METRICS.map(metric => ({
              label: `${metric.name} (${metric.unit})`,
              value: metric.id,
              description: `Category: ${metric.category}`
            }))}
            placeholder="Select metrics to compare"
            expandToViewport
          />
        </Box>
        
        <Toggle
          checked={showNormalizedScores}
          onChange={({ detail }) => setShowNormalizedScores(detail.checked)}
        >
          Show normalized scores (0-1 scale)
        </Toggle>
      </SpaceBetween>
    </Container>
  );

  const renderComparisonTable = () => {
    const tableItems = layouts.map(layout => {
      const score = layoutScores.find(s => s.layoutId === layout.id);
      const item: any = {
        id: layout.id,
        layout: layout,
        rank: score?.rank || 0,
        overallScore: score?.overallScore || 0
      };
      
      // Add metric values
      COMPARISON_METRICS.forEach(metric => {
        const value = metric.getValue(layout);
        const normalizedScore = score?.scores[metric.id] || 0;
        
        item[metric.id] = {
          value,
          displayValue: metric.getDisplayValue(value),
          normalizedScore,
          isSelected: selectedMetrics.includes(metric.id)
        };
      });
      
      return item;
    });

    const columnDefinitions: TableProps.ColumnDefinition<any>[] = [
      {
        id: 'rank',
        header: 'Rank',
        cell: (item) => (
          <Badge color={item.rank === 1 ? 'green' : item.rank === layouts.length ? 'red' : 'blue'}>
            #{item.rank}
          </Badge>
        ),
        sortingField: 'rank',
        width: 80
      },
      {
        id: 'layout',
        header: 'Layout',
        cell: (item) => (
          <SpaceBetween direction="vertical" size="xs">
            <Box variant="strong">{item.layout.id}</Box>
            <Box variant="small">
              {item.layout.layoutMetrics.turbineCount} turbines, {item.layout.layoutMetrics.totalCapacity.toFixed(1)} MW
            </Box>
          </SpaceBetween>
        ),
        width: 200
      },
      {
        id: 'overall_score',
        header: 'Overall Score',
        cell: (item) => (
          <SpaceBetween direction="vertical" size="xs">
            <ProgressBar value={item.overallScore * 100} />
            <Box variant="small" textAlign="center">
              {(item.overallScore * 100).toFixed(1)}%
            </Box>
          </SpaceBetween>
        ),
        sortingField: 'overallScore',
        width: 120
      }
    ];

    // Add columns for selected metrics
    selectedMetrics.forEach(metricId => {
      const metric = COMPARISON_METRICS.find(m => m.id === metricId);
      if (!metric) return;

      columnDefinitions.push({
        id: metricId,
        header: metric.name,
        cell: (item) => {
          const metricData = item[metricId];
          if (!metricData) return '-';
          
          return (
            <SpaceBetween direction="vertical" size="xs">
              <Box variant="strong">{metricData.displayValue}</Box>
              {showNormalizedScores && (
                <Box variant="small" color="text-body-secondary">
                  Score: {(metricData.normalizedScore * 100).toFixed(0)}%
                </Box>
              )}
            </SpaceBetween>
          );
        },
        sortingField: metricId,
        width: 120
      });
    });

    // Add actions column
    columnDefinitions.push({
      id: 'actions',
      header: 'Actions',
      cell: (item) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="link"
            onClick={() => onSelectLayout?.(item.layout.id)}
          >
            Select
          </Button>
          <Button
            variant="link"
            onClick={() => onCloneLayout?.(item.layout.id)}
          >
            Clone
          </Button>
          <Button
            variant="link"
            onClick={() => onOptimizeLayout?.(item.layout.id, {})}
          >
            Optimize
          </Button>
        </SpaceBetween>
      ),
      width: 150
    });

    return (
      <Table
        columnDefinitions={columnDefinitions}
        items={tableItems}
        sortingColumn={sortColumn}
        sortingDescending={sortDescending}
        onSortingChange={({ detail }) => {
          setSortColumn(detail.sortingColumn.sortingField || '');
          setSortDescending(detail.isDescending || false);
        }}
        variant="embedded"
        empty={
          <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
              No layouts to compare
            </Box>
            <Box variant="p" padding={{ bottom: 's' }} color="inherit">
              Add multiple layouts to enable comparison.
            </Box>
          </Box>
        }
      />
    );
  };

  const renderVisualizationTab = () => (
    <SpaceBetween direction="vertical" size="l">
      <Alert type="info" header="Layout Visualization Comparison">
        This would show side-by-side visual comparisons of the layouts including:
        <SpaceBetween direction="vertical" size="xs">
          <Box>• Turbine position overlays</Box>
          <Box>• Wake pattern comparisons</Box>
          <Box>• Constraint violation heatmaps</Box>
          <Box>• Energy yield distribution maps</Box>
        </SpaceBetween>
      </Alert>
      
      <Box textAlign="center" padding="xxl">
        <Box variant="h3">Interactive Layout Comparison</Box>
        <Box variant="p" padding={{ top: 's' }}>
          Visual comparison tools would be implemented here showing
          multiple layouts side-by-side with interactive controls.
        </Box>
      </Box>
    </SpaceBetween>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (layouts.length === 0) {
    return (
      <Container>
        <Alert type="info" header="No Layouts to Compare">
          Add multiple layout optimization results to enable comparison functionality.
        </Alert>
      </Container>
    );
  }

  if (layouts.length === 1) {
    return (
      <Container>
        <Alert type="warning" header="Single Layout Detected">
          Comparison requires at least two layouts. Run optimization with different parameters
          to generate alternative layouts for comparison.
        </Alert>
      </Container>
    );
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: 'comparison',
      label: 'Metric Comparison',
      content: (
        <SpaceBetween direction="vertical" size="l">
          {renderComparisonSummary()}
          
          <Container header={<Header variant="h2">Detailed Comparison</Header>}>
            <SpaceBetween direction="vertical" size="m">
              {renderMetricSelection()}
              {renderComparisonTable()}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      )
    },
    {
      id: 'visualization',
      label: 'Visual Comparison',
      content: renderVisualizationTab()
    }
  ];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description={`Comparing ${layouts.length} layout optimization scenarios`}
          actions={
            <SpaceBetween direction="horizontal" size="s">
              <Button onClick={() => handleExportComparison('csv')}>
                Export CSV
              </Button>
              <Button onClick={() => handleExportComparison('excel')}>
                Export Excel
              </Button>
              <Button variant="primary" onClick={() => handleExportComparison('pdf')}>
                Export Report
              </Button>
            </SpaceBetween>
          }
        >
          Layout Comparison Tool
        </Header>
      }
    >
      <Tabs
        tabs={tabs}
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
      />
    </Container>
  );
};