/**
 * Wake Impact Analysis Component
 * 
 * Provides detailed analysis of wake effects including loss calculations,
 * optimization recommendations, and downstream impact assessment.
 */

import React, { useMemo, useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Table,
  Badge,
  Button,
  ProgressBar,
  Alert,
  Tabs,
  Cards,
  Link,
  Popover,
  StatusIndicator
} from '@cloudscape-design/components';
import {
  WakeAnalysisData,
  WakeOptimizationRecommendation,
  TurbineWakeResults,
  WakeOverallMetrics,
  EconomicImpact
} from '../../types/wakeData';

interface WakeImpactAnalysisProps {
  wakeData: WakeAnalysisData;
  onOptimizationSelect?: (recommendation: WakeOptimizationRecommendation) => void;
  onTurbineSelect?: (turbineId: string) => void;
  compact?: boolean;
}

interface TurbineTableItem {
  turbineId: string;
  position: string;
  wakeDeficit: number;
  powerReduction: number;
  energyLoss: number;
  turbulenceIncrease: number;
  upstreamCount: number;
  downstreamCount: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface OptimizationTableItem {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedBenefit: string;
  implementationCost: string;
  paybackPeriod: string;
  feasibility: number;
}

const WakeImpactAnalysis: React.FC<WakeImpactAnalysisProps> = ({
  wakeData,
  onOptimizationSelect,
  onTurbineSelect,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);

  // Process turbine results for table display
  const turbineTableData: TurbineTableItem[] = useMemo(() => {
    return wakeData.results.turbineResults.map(result => {
      const turbine = wakeData.turbineLayout.turbines.find(t => t.id === result.turbineId);
      const status = getWakeStatus(result.powerReduction);
      
      return {
        turbineId: result.turbineId,
        position: `(${turbine?.x.toFixed(0) || 0}, ${turbine?.y.toFixed(0) || 0})`,
        wakeDeficit: result.wakeDeficit,
        powerReduction: result.powerReduction,
        energyLoss: result.energyLoss,
        turbulenceIncrease: result.turbulenceIncrease,
        upstreamCount: result.upstreamInfluences.length,
        downstreamCount: result.downstreamImpacts.length,
        status
      };
    });
  }, [wakeData.results.turbineResults, wakeData.turbineLayout.turbines]);

  // Process optimization recommendations for table display
  const optimizationTableData: OptimizationTableItem[] = useMemo(() => {
    return wakeData.results.optimizationRecommendations.map((rec, index) => ({
      id: `opt-${index}`,
      type: rec.type.replace('_', ' ').toUpperCase(),
      priority: rec.priority,
      description: rec.description,
      expectedBenefit: `${rec.expectedBenefit.wakeLossReduction.toFixed(1)}% loss reduction`,
      implementationCost: getCostLabel(rec.implementationCost),
      paybackPeriod: `${rec.expectedBenefit.paybackPeriod.toFixed(1)} years`,
      feasibility: rec.actions.reduce((sum, action) => sum + action.feasibility, 0) / rec.actions.length
    }));
  }, [wakeData.results.optimizationRecommendations]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const results = wakeData.results.turbineResults;
    const totalTurbines = results.length;
    const severelyAffected = results.filter(r => r.powerReduction > 10).length;
    const moderatelyAffected = results.filter(r => r.powerReduction > 5 && r.powerReduction <= 10).length;
    const minimallyAffected = results.filter(r => r.powerReduction <= 5).length;

    return {
      totalTurbines,
      severelyAffected,
      moderatelyAffected,
      minimallyAffected,
      averageWakeDeficit: results.reduce((sum, r) => sum + r.wakeDeficit, 0) / totalTurbines,
      maxWakeDeficit: Math.max(...results.map(r => r.wakeDeficit)),
      totalEnergyLoss: results.reduce((sum, r) => sum + r.energyLoss, 0)
    };
  }, [wakeData.results.turbineResults]);

  // Handle optimization selection
  const handleOptimizationSelect = (optimizationId: string) => {
    const index = parseInt(optimizationId.split('-')[1]);
    const recommendation = wakeData.results.optimizationRecommendations[index];
    
    setSelectedOptimization(optimizationId);
    if (onOptimizationSelect) {
      onOptimizationSelect(recommendation);
    }
  };

  // Handle turbine selection
  const handleTurbineSelect = (turbineId: string) => {
    if (onTurbineSelect) {
      onTurbineSelect(turbineId);
    }
  };

  return (
    <SpaceBetween size="l">
      {/* Wake Impact Overview */}
      <Container
        header={
          <Header
            variant="h2"
            description="Comprehensive analysis of wake effects on wind farm performance"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color={getOverallWakeStatusColor(wakeData.results.overallMetrics.wakeEfficiency)}>
                  {wakeData.results.overallMetrics.wakeEfficiency.toFixed(1)}% Efficiency
                </Badge>
                <Badge color="blue">
                  {wakeData.turbineLayout.turbines.length} Turbines
                </Badge>
              </SpaceBetween>
            }
          >
            Wake Impact Analysis
          </Header>
        }
      >
        <SpaceBetween size="m">
          {/* Overall Impact Alert */}
          <Alert
            type={wakeData.results.overallMetrics.wakeEfficiency > 90 ? 'success' : 
                  wakeData.results.overallMetrics.wakeEfficiency > 85 ? 'info' : 'warning'}
            header={`Wake Efficiency: ${wakeData.results.overallMetrics.wakeEfficiency.toFixed(1)}%`}
          >
            <SpaceBetween size="xs">
              <div>
                • Total wake loss: {wakeData.results.overallMetrics.totalWakeLoss.toFixed(1)}% 
                ({(wakeData.results.overallMetrics.energyYieldReduction / 1000).toFixed(1)} GWh/year)
              </div>
              <div>
                • {summaryStats.severelyAffected} turbines severely affected (&gt;10% loss), 
                {summaryStats.moderatelyAffected} moderately affected (5-10% loss)
              </div>
              <div>
                • Economic impact: ${(wakeData.results.overallMetrics.economicImpact.annualRevenueLoss / 1000000).toFixed(1)}M annual revenue loss
              </div>
            </SpaceBetween>
          </Alert>

          {/* Key Metrics */}
          <ColumnLayout columns={compact ? 2 : 4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Wake Loss</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d13212' }}>
                {wakeData.results.overallMetrics.totalWakeLoss.toFixed(1)}%
              </div>
              <Box variant="small" color="text-body-secondary">
                Average: {wakeData.results.overallMetrics.averageWakeLoss.toFixed(1)}%
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Energy Loss</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d13212' }}>
                {(wakeData.results.overallMetrics.energyYieldReduction / 1000).toFixed(1)} GWh/yr
              </div>
              <Box variant="small" color="text-body-secondary">
                {wakeData.results.overallMetrics.capacityFactorReduction.toFixed(1)}% CF reduction
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Revenue Impact</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d13212' }}>
                ${(wakeData.results.overallMetrics.economicImpact.annualRevenueLoss / 1000000).toFixed(1)}M/yr
              </div>
              <Box variant="small" color="text-body-secondary">
                NPV: ${(wakeData.results.overallMetrics.economicImpact.netPresentValueImpact / 1000000).toFixed(1)}M
              </Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Affected Turbines</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0073bb' }}>
                {summaryStats.severelyAffected + summaryStats.moderatelyAffected}
              </div>
              <Box variant="small" color="text-body-secondary">
                of {summaryStats.totalTurbines} total
              </Box>
            </div>
          </ColumnLayout>
        </SpaceBetween>
      </Container>

      {/* Detailed Analysis Tabs */}
      <Tabs
        activeTabId={activeTab}
        onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <SpaceBetween size="m">
                {/* Turbine Impact Distribution */}
                <Container
                  header={
                    <Header variant="h3">
                      Turbine Impact Distribution
                    </Header>
                  }
                >
                  <ColumnLayout columns={3} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Severely Affected (&gt;10% loss)</Box>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d13212' }}>
                        {summaryStats.severelyAffected}
                      </div>
                      <ProgressBar
                        value={(summaryStats.severelyAffected / summaryStats.totalTurbines) * 100}
                        description={`${((summaryStats.severelyAffected / summaryStats.totalTurbines) * 100).toFixed(1)}%`}
                        variant="flash"
                      />
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Moderately Affected (5-10% loss)</Box>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9900' }}>
                        {summaryStats.moderatelyAffected}
                      </div>
                      <ProgressBar
                        value={(summaryStats.moderatelyAffected / summaryStats.totalTurbines) * 100}
                        description={`${((summaryStats.moderatelyAffected / summaryStats.totalTurbines) * 100).toFixed(1)}%`}
                      />
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Minimally Affected (&lt;5% loss)</Box>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#037f0c' }}>
                        {summaryStats.minimallyAffected}
                      </div>
                      <ProgressBar
                        value={(summaryStats.minimallyAffected / summaryStats.totalTurbines) * 100}
                        description={`${((summaryStats.minimallyAffected / summaryStats.totalTurbines) * 100).toFixed(1)}%`}
                        variant="success"
                      />
                    </div>
                  </ColumnLayout>
                </Container>

                {/* Economic Impact Breakdown */}
                <Container
                  header={
                    <Header variant="h3">
                      Economic Impact Analysis
                    </Header>
                  }
                >
                  <EconomicImpactBreakdown economicImpact={wakeData.results.overallMetrics.economicImpact} />
                </Container>
              </SpaceBetween>
            )
          },
          {
            id: 'turbines',
            label: 'Turbine Details',
            content: (
              <Container
                header={
                  <Header 
                    variant="h3"
                    description="Detailed wake impact analysis for each turbine"
                  >
                    Individual Turbine Analysis
                  </Header>
                }
              >
                <Table
                  columnDefinitions={[
                    {
                      id: 'turbineId',
                      header: 'Turbine ID',
                      cell: item => (
                        <Link onFollow={() => handleTurbineSelect(item.turbineId)}>
                          {item.turbineId}
                        </Link>
                      ),
                      sortingField: 'turbineId'
                    },
                    {
                      id: 'position',
                      header: 'Position (m)',
                      cell: item => item.position,
                      sortingField: 'position'
                    },
                    {
                      id: 'wakeDeficit',
                      header: 'Wake Deficit',
                      cell: item => (
                        <div>
                          {item.wakeDeficit.toFixed(1)}%
                          <ProgressBar
                            value={item.wakeDeficit}
                            variant={item.wakeDeficit > 15 ? 'flash' : 'in-progress'}
                          />
                        </div>
                      ),
                      sortingField: 'wakeDeficit'
                    },
                    {
                      id: 'powerReduction',
                      header: 'Power Loss',
                      cell: item => (
                        <div>
                          <Badge color={getWakeStatusColor(item.status)}>
                            {item.powerReduction.toFixed(1)}%
                          </Badge>
                        </div>
                      ),
                      sortingField: 'powerReduction'
                    },
                    {
                      id: 'energyLoss',
                      header: 'Energy Loss (MWh/yr)',
                      cell: item => item.energyLoss.toFixed(1),
                      sortingField: 'energyLoss'
                    },
                    {
                      id: 'turbulenceIncrease',
                      header: 'Turbulence Increase',
                      cell: item => `${item.turbulenceIncrease.toFixed(1)}%`,
                      sortingField: 'turbulenceIncrease'
                    },
                    {
                      id: 'interactions',
                      header: 'Interactions',
                      cell: item => (
                        <Popover
                          dismissButton={false}
                          position="top"
                          size="small"
                          triggerType="custom"
                          content={
                            <div>
                              <div>Upstream: {item.upstreamCount} turbines</div>
                              <div>Downstream: {item.downstreamCount} turbines</div>
                            </div>
                          }
                        >
                          <StatusIndicator type="info">
                            {item.upstreamCount + item.downstreamCount}
                          </StatusIndicator>
                        </Popover>
                      )
                    }
                  ]}
                  items={turbineTableData}
                  sortingDisabled={false}
                  pagination={{
                    pageSize: compact ? 5 : 10
                  }}
                  header={
                    <Header
                      counter={`(${turbineTableData.length})`}
                      description="Click turbine ID to view detailed analysis"
                    >
                      Turbine Wake Analysis
                    </Header>
                  }
                  empty="No turbine data available"
                />
              </Container>
            )
          },
          {
            id: 'optimization',
            label: 'Optimization',
            content: (
              <SpaceBetween size="m">
                <Container
                  header={
                    <Header 
                      variant="h3"
                      description="Recommendations to reduce wake losses and improve performance"
                    >
                      Wake Optimization Recommendations
                    </Header>
                  }
                >
                  <Cards
                    cardDefinition={{
                      header: item => (
                        <div>
                          <Badge color={getPriorityColor(item.priority)}>
                            {item.priority.toUpperCase()}
                          </Badge>
                          <Box variant="h4" margin={{ top: 'xs' }}>
                            {item.type}
                          </Box>
                        </div>
                      ),
                      sections: [
                        {
                          id: 'description',
                          content: item => item.description
                        },
                        {
                          id: 'benefits',
                          header: 'Expected Benefits',
                          content: item => (
                            <SpaceBetween size="xs">
                              <div>• {item.expectedBenefit}</div>
                              <div>• Payback period: {item.paybackPeriod}</div>
                              <div>• Implementation cost: {item.implementationCost}</div>
                            </SpaceBetween>
                          )
                        },
                        {
                          id: 'feasibility',
                          header: 'Feasibility',
                          content: item => (
                            <ProgressBar
                              value={item.feasibility * 100}
                              description={`${(item.feasibility * 100).toFixed(0)}% feasible`}
                              variant={item.feasibility > 0.8 ? 'success' : item.feasibility > 0.6 ? 'in-progress' : 'flash'}
                            />
                          )
                        }
                      ]
                    }}
                    cardsPerRow={[
                      { cards: 1 },
                      { minWidth: 500, cards: 2 }
                    ]}
                    items={optimizationTableData}
                    selectionType="single"
                    selectedItems={selectedOptimization ? [optimizationTableData.find(item => item.id === selectedOptimization)!] : []}
                    onSelectionChange={({ detail }) => {
                      const selected = detail.selectedItems[0];
                      if (selected) {
                        handleOptimizationSelect(selected.id);
                      }
                    }}
                    header={
                      <Header
                        counter={`(${optimizationTableData.length})`}
                        actions={
                          <Button
                            variant="primary"
                            disabled={!selectedOptimization}
                            onClick={() => {
                              if (selectedOptimization) {
                                const index = parseInt(selectedOptimization.split('-')[1]);
                                const recommendation = wakeData.results.optimizationRecommendations[index];
                                if (onOptimizationSelect) {
                                  onOptimizationSelect(recommendation);
                                }
                              }
                            }}
                          >
                            Apply Optimization
                          </Button>
                        }
                      >
                        Optimization Recommendations
                      </Header>
                    }
                    empty="No optimization recommendations available"
                  />
                </Container>
              </SpaceBetween>
            )
          }
        ]}
      />
    </SpaceBetween>
  );
};

// Economic Impact Breakdown Component
const EconomicImpactBreakdown: React.FC<{ economicImpact: EconomicImpact }> = ({ economicImpact }) => (
  <ColumnLayout columns={2} variant="text-grid">
    <div>
      <Box variant="awsui-key-label">Annual Revenue Loss</Box>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d13212' }}>
        ${(economicImpact.annualRevenueLoss / 1000000).toFixed(2)}M
      </div>
      <Box variant="small" color="text-body-secondary">
        Per year due to wake losses
      </Box>
    </div>
    <div>
      <Box variant="awsui-key-label">Net Present Value Impact</Box>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d13212' }}>
        ${(economicImpact.netPresentValueImpact / 1000000).toFixed(2)}M
      </div>
      <Box variant="small" color="text-body-secondary">
        Total project impact
      </Box>
    </div>
    <div>
      <Box variant="awsui-key-label">Payback Period Increase</Box>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9900' }}>
        +{economicImpact.paybackPeriodIncrease.toFixed(1)} years
      </div>
      <Box variant="small" color="text-body-secondary">
        Additional payback time
      </Box>
    </div>
    <div>
      <Box variant="awsui-key-label">LCOE Increase</Box>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9900' }}>
        +${economicImpact.levelizedCostIncrease.toFixed(2)}/MWh
      </div>
      <Box variant="small" color="text-body-secondary">
        Levelized cost increase
      </Box>
    </div>
  </ColumnLayout>
);

// Helper functions
function getWakeStatus(powerReduction: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (powerReduction <= 2) return 'excellent';
  if (powerReduction <= 5) return 'good';
  if (powerReduction <= 10) return 'fair';
  return 'poor';
}

function getWakeStatusColor(status: string): 'green' | 'blue' | 'grey' | 'red' {
  switch (status) {
    case 'excellent': return 'green';
    case 'good': return 'blue';
    case 'fair': return 'grey';
    case 'poor': return 'red';
    default: return 'grey';
  }
}

function getOverallWakeStatusColor(efficiency: number): 'green' | 'blue' | 'grey' | 'red' {
  if (efficiency >= 95) return 'green';
  if (efficiency >= 90) return 'blue';
  if (efficiency >= 85) return 'grey';
  return 'red';
}

function getPriorityColor(priority: string): 'red' | 'blue' | 'grey' {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'blue';
    case 'low': return 'grey';
    default: return 'grey';
  }
}

function getCostLabel(cost: number): string {
  if (cost <= 0.3) return 'Low';
  if (cost <= 0.6) return 'Medium';
  return 'High';
}

export default WakeImpactAnalysis;