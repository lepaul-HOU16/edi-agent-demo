/**
 * Layout Optimization Visualization Component
 * 
 * Shows optimized turbine positions on interactive map with energy yield predictions,
 * wake loss calculations, and constraint compliance validation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Grid,
  ColumnLayout,
  StatusIndicator,
  ProgressBar,
  Badge,
  Tabs,
  TabsProps,
  Alert,
  Spinner
} from '@cloudscape-design/components';
import { OptimizedLayout, LayoutMetrics, PerformanceMetrics, ConstraintCompliance } from '../../types/layoutOptimization';
import { WindResourceData } from '../../types/windData';
import { TurbineSpecification } from '../../types/wakeData';

// ============================================================================
// Component Props
// ============================================================================

interface LayoutOptimizationVisualizationProps {
  optimizedLayout: OptimizedLayout;
  alternativeLayouts?: OptimizedLayout[];
  performanceMetrics: PerformanceMetrics;
  constraintCompliance: ConstraintCompliance;
  windData: WindResourceData;
  turbineSpec: TurbineSpecification;
  onExportLayout?: (layout: OptimizedLayout, format: 'json' | 'csv' | 'gis' | 'cad') => void;
  onCompareLayouts?: (layouts: OptimizedLayout[]) => void;
  onOptimizeWakeEffects?: () => void;
  onGenerateReport?: () => void;
  loading?: boolean;
  error?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const LayoutOptimizationVisualization: React.FC<LayoutOptimizationVisualizationProps> = ({
  optimizedLayout,
  alternativeLayouts = [],
  performanceMetrics,
  constraintCompliance,
  windData,
  turbineSpec,
  onExportLayout,
  onCompareLayouts,
  onOptimizeWakeEffects,
  onGenerateReport,
  loading = false,
  error
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTurbine, setSelectedTurbine] = useState<string | null>(null);
  const [showConstraintViolations, setShowConstraintViolations] = useState(false);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const layoutSummary = useMemo(() => ({
    turbineCount: optimizedLayout.turbines.length,
    totalCapacity: optimizedLayout.layoutMetrics.totalCapacity,
    energyYield: optimizedLayout.energyAnalysis.annualEnergyYield,
    capacityFactor: optimizedLayout.energyAnalysis.capacityFactor,
    wakeLosses: optimizedLayout.energyAnalysis.lossBreakdown.wakeLosses,
    constraintViolations: optimizedLayout.constraintViolations.length,
    fitnessScore: optimizedLayout.fitnessScore
  }), [optimizedLayout]);

  const constraintStatus = useMemo(() => {
    const compliance = constraintCompliance.overallCompliance;
    if (compliance >= 95) return { status: 'success' as const, label: 'Excellent' };
    if (compliance >= 85) return { status: 'warning' as const, label: 'Good' };
    if (compliance >= 70) return { status: 'error' as const, label: 'Needs Improvement' };
    return { status: 'error' as const, label: 'Poor' };
  }, [constraintCompliance]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleTabChange = (detail: TabsProps.ChangeDetail) => {
    setActiveTab(detail.activeTabId);
  };

  const handleTurbineSelect = (turbineId: string) => {
    setSelectedTurbine(selectedTurbine === turbineId ? null : turbineId);
  };

  const handleExportLayout = (format: 'json' | 'csv' | 'gis' | 'cad') => {
    onExportLayout?.(optimizedLayout, format);
  };

  const handleCompareLayouts = () => {
    if (alternativeLayouts.length > 0) {
      onCompareLayouts?.([optimizedLayout, ...alternativeLayouts.slice(0, 3)]);
    }
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderLoadingState = () => (
    <Container>
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
        <Box variant="h3" padding={{ top: 'm' }}>
          Optimizing Layout...
        </Box>
        <Box variant="p" color="text-body-secondary">
          Running genetic algorithm to find optimal turbine placement
        </Box>
      </Box>
    </Container>
  );

  const renderErrorState = () => (
    <Container>
      <Alert type="error" header="Layout Optimization Failed">
        {error || 'An unexpected error occurred during layout optimization.'}
      </Alert>
    </Container>
  );

  const renderOverviewTab = () => (
    <SpaceBetween direction="vertical" size="l">
      {/* Layout Summary Cards */}
      <Grid gridDefinition={[
        { colspan: { default: 12, xs: 6, s: 4, m: 3 } },
        { colspan: { default: 12, xs: 6, s: 4, m: 3 } },
        { colspan: { default: 12, xs: 6, s: 4, m: 3 } },
        { colspan: { default: 12, xs: 6, s: 4, m: 3 } }
      ]}>
        <Container>
          <Box variant="h3" textAlign="center">{layoutSummary.turbineCount}</Box>
          <Box variant="small" textAlign="center" color="text-body-secondary">
            Turbines
          </Box>
        </Container>
        
        <Container>
          <Box variant="h3" textAlign="center">{layoutSummary.totalCapacity.toFixed(1)} MW</Box>
          <Box variant="small" textAlign="center" color="text-body-secondary">
            Total Capacity
          </Box>
        </Container>
        
        <Container>
          <Box variant="h3" textAlign="center">{layoutSummary.energyYield.toLocaleString()} MWh</Box>
          <Box variant="small" textAlign="center" color="text-body-secondary">
            Annual Energy Yield
          </Box>
        </Container>
        
        <Container>
          <Box variant="h3" textAlign="center">{layoutSummary.capacityFactor.toFixed(1)}%</Box>
          <Box variant="small" textAlign="center" color="text-body-secondary">
            Capacity Factor
          </Box>
        </Container>
      </Grid>

      {/* Performance Metrics */}
      <Container header={<Header variant="h2">Performance Metrics</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Energy Density</Box>
              <Box>{performanceMetrics.energyMetrics.energyDensity.toFixed(2)} MWh/year/km²</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Wake Efficiency</Box>
              <Box>{performanceMetrics.energyMetrics.wakeEfficiency.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Layout Efficiency</Box>
              <Box>{performanceMetrics.technicalMetrics.layoutEfficiency.toFixed(1)}%</Box>
            </Box>
          </SpaceBetween>
          
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">LCOE</Box>
              <Box>${performanceMetrics.economicMetrics.levelizedCostOfEnergy.toFixed(2)}/MWh</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">NPV</Box>
              <Box>${(performanceMetrics.economicMetrics.netPresentValue / 1e6).toFixed(1)}M</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">IRR</Box>
              <Box>{performanceMetrics.economicMetrics.internalRateOfReturn.toFixed(1)}%</Box>
            </Box>
          </SpaceBetween>
        </ColumnLayout>
      </Container>

      {/* Constraint Compliance */}
      <Container header={<Header variant="h2">Constraint Compliance</Header>}>
        <SpaceBetween direction="vertical" size="m">
          <Box>
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Box variant="awsui-key-label">Overall Compliance</Box>
              <StatusIndicator type={constraintStatus.status}>
                {constraintStatus.label}
              </StatusIndicator>
              <Badge color={constraintStatus.status === 'success' ? 'green' : 
                           constraintStatus.status === 'warning' ? 'yellow' : 'red'}>
                {constraintCompliance.overallCompliance.toFixed(1)}%
              </Badge>
            </SpaceBetween>
          </Box>
          
          <ProgressBar
            value={constraintCompliance.overallCompliance}
            additionalInfo={`${constraintCompliance.hardConstraintViolations} hard violations, ${constraintCompliance.softConstraintViolations} soft violations`}
            description="Percentage of constraints satisfied"
          />
          
          {constraintCompliance.criticalViolations.length > 0 && (
            <Alert type="warning" header="Critical Constraint Violations">
              <SpaceBetween direction="vertical" size="xs">
                {constraintCompliance.criticalViolations.slice(0, 3).map((violation, index) => (
                  <Box key={index} variant="small">
                    • {violation.description}
                  </Box>
                ))}
                {constraintCompliance.criticalViolations.length > 3 && (
                  <Box variant="small" color="text-body-secondary">
                    ... and {constraintCompliance.criticalViolations.length - 3} more
                  </Box>
                )}
              </SpaceBetween>
            </Alert>
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );

  const renderMapTab = () => (
    <SpaceBetween direction="vertical" size="l">
      {/* Map Controls */}
      <Container>
        <SpaceBetween direction="horizontal" size="s">
          <Button
            variant={showConstraintViolations ? 'primary' : 'normal'}
            onClick={() => setShowConstraintViolations(!showConstraintViolations)}
          >
            {showConstraintViolations ? 'Hide' : 'Show'} Constraint Violations
          </Button>
          
          <Button onClick={() => setSelectedTurbine(null)}>
            Clear Selection
          </Button>
          
          <Button onClick={handleCompareLayouts} disabled={alternativeLayouts.length === 0}>
            Compare Layouts
          </Button>
        </SpaceBetween>
      </Container>

      {/* Interactive Map Placeholder */}
      <Container header={<Header variant="h2">Turbine Layout Map</Header>}>
        <Box padding="xl" textAlign="center" color="text-body-secondary">
          <Box variant="h3" padding={{ bottom: 'm' }}>
            Interactive Layout Map
          </Box>
          <Box variant="p" padding={{ bottom: 'm' }}>
            This would show an interactive map with:
          </Box>
          <SpaceBetween direction="vertical" size="s" alignItems="center">
            <Box>• Optimized turbine positions with wake zones</Box>
            <Box>• Terrain features and exclusion zones</Box>
            <Box>• Wind rose overlay showing prevailing directions</Box>
            <Box>• Constraint violation indicators</Box>
            <Box>• Energy yield heatmap</Box>
            <Box>• Clickable turbines showing detailed metrics</Box>
          </SpaceBetween>
          
          {selectedTurbine && (
            <Alert type="info" header={`Turbine ${selectedTurbine} Selected`}>
              Detailed turbine information would be displayed here including:
              wake effects, energy contribution, and constraint compliance.
            </Alert>
          )}
        </Box>
      </Container>

      {/* Turbine List */}
      <Container header={<Header variant="h2">Turbine Details</Header>}>
        <Grid gridDefinition={[
          { colspan: { default: 12, s: 6, m: 4 } },
          { colspan: { default: 12, s: 6, m: 4 } },
          { colspan: { default: 12, s: 6, m: 4 } }
        ]}>
          {optimizedLayout.turbines.slice(0, 6).map((turbine, index) => (
            <Container key={turbine.id}>
              <SpaceBetween direction="vertical" size="xs">
                <Box variant="h4">{turbine.id}</Box>
                <Box variant="small">
                  Position: ({turbine.x.toFixed(0)}, {turbine.y.toFixed(0)})
                </Box>
                <Box variant="small">
                  Power: {turbine.ratedPower} kW
                </Box>
                <Box variant="small">
                  Wake Deficit: {turbine.wakeEffects.wakeDeficit.toFixed(1)}%
                </Box>
                <Button
                  variant="link"
                  onClick={() => handleTurbineSelect(turbine.id)}
                >
                  {selectedTurbine === turbine.id ? 'Deselect' : 'Select'}
                </Button>
              </SpaceBetween>
            </Container>
          ))}
        </Grid>
        
        {optimizedLayout.turbines.length > 6 && (
          <Box textAlign="center" padding={{ top: 'm' }}>
            <Box variant="small" color="text-body-secondary">
              ... and {optimizedLayout.turbines.length - 6} more turbines
            </Box>
          </Box>
        )}
      </Container>
    </SpaceBetween>
  );

  const renderAnalysisTab = () => (
    <SpaceBetween direction="vertical" size="l">
      {/* Energy Analysis */}
      <Container header={<Header variant="h2">Energy Analysis</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Annual Energy Yield</Box>
              <Box variant="h3">{optimizedLayout.energyAnalysis.annualEnergyYield.toLocaleString()} MWh/year</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Capacity Factor</Box>
              <Box variant="h3">{optimizedLayout.energyAnalysis.capacityFactor.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Energy Density</Box>
              <Box>{optimizedLayout.energyAnalysis.energyDensity.toFixed(2)} MWh/year/km²</Box>
            </Box>
          </SpaceBetween>
          
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Wake Losses</Box>
              <Box>{optimizedLayout.energyAnalysis.lossBreakdown.wakeLosses.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Total Losses</Box>
              <Box>{optimizedLayout.energyAnalysis.lossBreakdown.totalLosses.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Net Efficiency</Box>
              <Box>{(100 - optimizedLayout.energyAnalysis.lossBreakdown.totalLosses).toFixed(1)}%</Box>
            </Box>
          </SpaceBetween>
        </ColumnLayout>
      </Container>

      {/* Wake Analysis Summary */}
      <Container header={<Header variant="h2">Wake Analysis Summary</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Average Wake Loss</Box>
              <Box>{optimizedLayout.wakeAnalysis.overallMetrics.averageWakeLoss.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Maximum Wake Loss</Box>
              <Box>{optimizedLayout.wakeAnalysis.overallMetrics.maxWakeLoss.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Wake Efficiency</Box>
              <Box>{optimizedLayout.wakeAnalysis.overallMetrics.wakeEfficiency.toFixed(1)}%</Box>
            </Box>
          </SpaceBetween>
          
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Energy Yield Reduction</Box>
              <Box>{optimizedLayout.wakeAnalysis.overallMetrics.energyYieldReduction.toLocaleString()} MWh/year</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Annual Revenue Loss</Box>
              <Box>${optimizedLayout.wakeAnalysis.overallMetrics.economicImpact.annualRevenueLoss.toLocaleString()}</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">LCOE Increase</Box>
              <Box>${optimizedLayout.wakeAnalysis.overallMetrics.economicImpact.levelizedCostIncrease.toFixed(2)}/MWh</Box>
            </Box>
          </SpaceBetween>
        </ColumnLayout>
      </Container>

      {/* Economic Analysis */}
      <Container header={<Header variant="h2">Economic Analysis</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Total Project Cost</Box>
              <Box variant="h3">${(optimizedLayout.costAnalysis.totalProjectCost / 1e6).toFixed(1)}M</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Cost per MW</Box>
              <Box>${(optimizedLayout.costAnalysis.costPerMW / 1e6).toFixed(2)}M/MW</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">LCOE</Box>
              <Box>${optimizedLayout.costAnalysis.levelizedCostOfEnergy.toFixed(2)}/MWh</Box>
            </Box>
          </SpaceBetween>
          
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <Box variant="awsui-key-label">Net Present Value</Box>
              <Box>${(optimizedLayout.costAnalysis.netPresentValue / 1e6).toFixed(1)}M</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Internal Rate of Return</Box>
              <Box>{optimizedLayout.costAnalysis.internalRateOfReturn.toFixed(1)}%</Box>
            </Box>
            <Box>
              <Box variant="awsui-key-label">Payback Period</Box>
              <Box>{optimizedLayout.costAnalysis.paybackPeriod.toFixed(1)} years</Box>
            </Box>
          </SpaceBetween>
        </ColumnLayout>
      </Container>
    </SpaceBetween>
  );

  const renderExportTab = () => (
    <SpaceBetween direction="vertical" size="l">
      <Container header={<Header variant="h2">Export Layout</Header>}>
        <SpaceBetween direction="vertical" size="m">
          <Box variant="p">
            Export the optimized layout in various formats for use in other software tools.
          </Box>
          
          <Grid gridDefinition={[
            { colspan: { default: 12, s: 6, m: 3 } },
            { colspan: { default: 12, s: 6, m: 3 } },
            { colspan: { default: 12, s: 6, m: 3 } },
            { colspan: { default: 12, s: 6, m: 3 } }
          ]}>
            <Button
              variant="primary"
              onClick={() => handleExportLayout('json')}
              fullWidth
            >
              Export JSON
            </Button>
            
            <Button
              onClick={() => handleExportLayout('csv')}
              fullWidth
            >
              Export CSV
            </Button>
            
            <Button
              onClick={() => handleExportLayout('gis')}
              fullWidth
            >
              Export GIS
            </Button>
            
            <Button
              onClick={() => handleExportLayout('cad')}
              fullWidth
            >
              Export CAD
            </Button>
          </Grid>
          
          <Box variant="small" color="text-body-secondary">
            <SpaceBetween direction="vertical" size="xs">
              <Box>• JSON: Complete layout data with all optimization results</Box>
              <Box>• CSV: Turbine coordinates and specifications for spreadsheet analysis</Box>
              <Box>• GIS: Shapefile format for geographic information systems</Box>
              <Box>• CAD: DXF format for computer-aided design software</Box>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
      </Container>

      {/* Layout Comparison */}
      {alternativeLayouts.length > 0 && (
        <Container header={<Header variant="h2">Layout Comparison</Header>}>
          <SpaceBetween direction="vertical" size="m">
            <Box variant="p">
              Compare the optimized layout with alternative solutions.
            </Box>
            
            <Button
              variant="primary"
              onClick={handleCompareLayouts}
            >
              Compare with {alternativeLayouts.length} Alternative Layout{alternativeLayouts.length > 1 ? 's' : ''}
            </Button>
            
            <Box variant="small" color="text-body-secondary">
              View side-by-side comparison of energy yield, costs, and constraint compliance
              across different layout options.
            </Box>
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return renderLoadingState();
  }

  if (error) {
    return renderErrorState();
  }

  const tabs: TabsProps.Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: renderOverviewTab()
    },
    {
      id: 'map',
      label: 'Layout Map',
      content: renderMapTab()
    },
    {
      id: 'analysis',
      label: 'Detailed Analysis',
      content: renderAnalysisTab()
    },
    {
      id: 'export',
      label: 'Export & Compare',
      content: renderExportTab()
    }
  ];

  return (
    <Container
      header={
        <Header
          variant="h1"
          description="Optimized turbine layout with energy yield predictions and constraint compliance"
          actions={
            <SpaceBetween direction="horizontal" size="s">
              <Button onClick={onOptimizeWakeEffects}>
                Optimize Wake Effects
              </Button>
              <Button variant="primary" onClick={onGenerateReport}>
                Generate Report
              </Button>
            </SpaceBetween>
          }
        >
          Layout Optimization Results
        </Header>
      }
    >
      <Tabs
        tabs={tabs}
        activeTabId={activeTab}
        onChange={handleTabChange}
      />
    </Container>
  );
};