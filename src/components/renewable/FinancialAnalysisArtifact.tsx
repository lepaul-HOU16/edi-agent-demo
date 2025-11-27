/**
 * FinancialAnalysisArtifact Component
 * 
 * Renders financial analysis artifacts from the renewable energy backend.
 * Displays financial metrics, cost breakdown, revenue projections, and ROI analysis.
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  Box,
  SpaceBetween,
  ColumnLayout,
  Alert,
  Button,
  ExpandableSection,
  KeyValuePairs,
} from '@cloudscape-design/components';
import Plot from 'react-plotly.js';
import { useProjectContext, extractProjectFromArtifact } from '../../contexts/ProjectContext';

interface FinancialAnalysisArtifactProps {
  data: {
    messageContentType: 'financial_analysis';
    projectId: string;
    metrics: {
      totalCapitalCost: number;
      operatingCostPerYear: number;
      revenuePerYear: number;
      lcoe: number; // Levelized Cost of Energy ($/MWh)
      npv: number; // Net Present Value
      irr: number; // Internal Rate of Return (%)
      paybackPeriod: number; // years
    };
    costBreakdown: {
      turbines: number;
      installation: number;
      grid: number;
      land: number;
      other: number;
    };
    revenueProjection: Array<{
      year: number;
      revenue: number;
      costs: number;
      netIncome: number;
    }>;
    assumptions: {
      discountRate: number;
      projectLifetime: number;
      electricityPrice: number;
      capacityFactor: number;
    };
  };
  onFollowUpAction?: (query: string) => void;
}

const FinancialAnalysisArtifact: React.FC<FinancialAnalysisArtifactProps> = ({ data, onFollowUpAction }) => {
  console.log('💰 FinancialAnalysisArtifact: Rendering with data:', {
    hasMetrics: !!data.metrics,
    hasCostBreakdown: !!data.costBreakdown,
    hasRevenueProjection: !!data.revenueProjection,
    revenueProjectionLength: data.revenueProjection?.length || 0,
    hasAssumptions: !!data.assumptions,
    projectId: data.projectId,
  });

  const [assumptionsExpanded, setAssumptionsExpanded] = useState(false);

  // Get project context
  const { setActiveProject } = useProjectContext();

  // Extract and set project context when data changes
  useEffect(() => {
    const projectInfo = extractProjectFromArtifact(data, 'FinancialAnalysisArtifact');
    if (projectInfo) {
      setActiveProject(projectInfo);
    } else {
      console.warn('⚠️ [FinancialAnalysisArtifact] Failed to extract project information from artifact data');
    }
  }, [data, setActiveProject]);

  // Error handling for missing financial data
  if (!data.metrics || !data.costBreakdown || !data.revenueProjection || !data.assumptions) {
    console.error('❌ FinancialAnalysisArtifact: Missing required financial data');
    return (
      <Container
        header={
          <Header variant="h2" description="Financial analysis data is incomplete">
            Financial Analysis Error
          </Header>
        }
      >
        <SpaceBetween size="m">
          <Alert type="error" header="Financial Analysis Failed">
            The financial analysis data is incomplete or missing. This could be due to:
            <ul style={{ marginTop: '8px', marginBottom: '0' }}>
              <li>Incomplete project data (missing layout or simulation results)</li>
              <li>Financial calculation service error</li>
              <li>Missing required parameters</li>
            </ul>
          </Alert>
          {onFollowUpAction && (
            <Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  onClick={() => onFollowUpAction(`analyze project economics for ${data.projectId || 'project'}`)}
                >
                  Retry Financial Analysis
                </Button>
                <Button
                  onClick={() => onFollowUpAction(`check project status for ${data.projectId || 'project'}`)}
                >
                  Check Project Status
                </Button>
              </SpaceBetween>
            </Box>
          )}
        </SpaceBetween>
      </Container>
    );
  }

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare cost breakdown pie chart data
  const costBreakdownData = [
    {
      values: [
        data.costBreakdown.turbines,
        data.costBreakdown.installation,
        data.costBreakdown.grid,
        data.costBreakdown.land,
        data.costBreakdown.other,
      ],
      labels: ['Turbines', 'Installation', 'Grid Connection', 'Land Lease', 'Other'],
      type: 'pie' as const,
      marker: {
        colors: ['#0972d3', '#037f0c', '#d13212', '#f89256', '#879596'],
      },
      textinfo: 'label+percent',
      hovertemplate: '<b>%{label}</b><br>Cost: %{value:$,.0f}<br>Percentage: %{percent}<extra></extra>',
    },
  ];

  const costBreakdownLayout = {
    title: {
      text: 'Capital Cost Breakdown',
      font: { size: 16, family: 'Amazon Ember, Helvetica Neue, Arial, sans-serif' },
    },
    showlegend: true,
    legend: {
      orientation: 'v' as const,
      x: 1,
      y: 0.5,
    },
    margin: { t: 50, b: 30, l: 30, r: 150 },
    height: 350,
  };

  // Prepare revenue projection line chart data
  const revenueProjectionData = [
    {
      x: data.revenueProjection.map(p => p.year),
      y: data.revenueProjection.map(p => p.revenue),
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Revenue',
      line: { color: '#037f0c', width: 2 },
      marker: { size: 6 },
    },
    {
      x: data.revenueProjection.map(p => p.year),
      y: data.revenueProjection.map(p => p.costs),
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Operating Costs',
      line: { color: '#d13212', width: 2 },
      marker: { size: 6 },
    },
    {
      x: data.revenueProjection.map(p => p.year),
      y: data.revenueProjection.map(p => p.netIncome),
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Net Income',
      line: { color: '#0972d3', width: 2 },
      marker: { size: 6 },
    },
  ];

  const revenueProjectionLayout = {
    title: {
      text: 'Revenue Projection Over Project Lifetime',
      font: { size: 16, family: 'Amazon Ember, Helvetica Neue, Arial, sans-serif' },
    },
    xaxis: {
      title: 'Year',
      showgrid: true,
      gridcolor: '#e9ebed',
    },
    yaxis: {
      title: 'Amount ($)',
      showgrid: true,
      gridcolor: '#e9ebed',
      tickformat: '$,.0f',
    },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      x: 0.5,
      xanchor: 'center',
      y: -0.2,
    },
    margin: { t: 50, b: 80, l: 80, r: 30 },
    height: 400,
  };

  return (
    <Container
      header={
        <Header variant="h2" description={`Project: ${data.projectId}`}>
          Financial Analysis
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Key Financial Metrics */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Key Financial Metrics
          </Box>
          <ColumnLayout columns={4} variant="text-grid">
            {/* LCOE */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e9ebed',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: '#545b64', marginBottom: '8px' }}>
                LCOE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
                ${data.metrics.lcoe.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#879596', marginTop: '4px' }}>
                per MWh
              </div>
            </div>

            {/* NPV */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e9ebed',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: '#545b64', marginBottom: '8px' }}>
                NPV
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: data.metrics.npv >= 0 ? '#037f0c' : '#d13212',
                }}
              >
                {formatCurrency(data.metrics.npv)}
              </div>
              <div style={{ fontSize: '11px', color: '#879596', marginTop: '4px' }}>
                Net Present Value
              </div>
            </div>

            {/* IRR */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e9ebed',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: '#545b64', marginBottom: '8px' }}>
                IRR
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
                {formatPercent(data.metrics.irr)}
              </div>
              <div style={{ fontSize: '11px', color: '#879596', marginTop: '4px' }}>
                Internal Rate of Return
              </div>
            </div>

            {/* Payback Period */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e9ebed',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: '#545b64', marginBottom: '8px' }}>
                Payback Period
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0972d3' }}>
                {data.metrics.paybackPeriod.toFixed(1)}
              </div>
              <div style={{ fontSize: '11px', color: '#879596', marginTop: '4px' }}>
                years
              </div>
            </div>
          </ColumnLayout>
        </Box>

        {/* Additional Metrics */}
        <Box>
          <ColumnLayout columns={3} variant="text-grid">
            <KeyValuePairs
              columns={1}
              items={[
                {
                  label: 'Total Capital Cost',
                  value: formatCurrency(data.metrics.totalCapitalCost),
                },
                {
                  label: 'Annual Operating Cost',
                  value: formatCurrency(data.metrics.operatingCostPerYear),
                },
                {
                  label: 'Annual Revenue',
                  value: formatCurrency(data.metrics.revenuePerYear),
                },
              ]}
            />
          </ColumnLayout>
        </Box>

        {/* Cost Breakdown Pie Chart */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Cost Breakdown
          </Box>
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <Plot
              data={costBreakdownData}
              layout={costBreakdownLayout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          </div>
        </Box>

        {/* Revenue Projection Line Chart */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Revenue Projection
          </Box>
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <Plot
              data={revenueProjectionData}
              layout={revenueProjectionLayout}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          </div>
        </Box>

        {/* Assumptions */}
        <ExpandableSection
          headerText="Financial Assumptions"
          variant="container"
          expanded={assumptionsExpanded}
          onChange={({ detail }) => setAssumptionsExpanded(detail.expanded)}
        >
          <ColumnLayout columns={2} variant="text-grid">
            <KeyValuePairs
              columns={1}
              items={[
                {
                  label: 'Discount Rate',
                  value: formatPercent(data.assumptions.discountRate),
                },
                {
                  label: 'Project Lifetime',
                  value: `${data.assumptions.projectLifetime} years`,
                },
                {
                  label: 'Electricity Price',
                  value: `$${data.assumptions.electricityPrice.toFixed(2)}/MWh`,
                },
                {
                  label: 'Capacity Factor',
                  value: formatPercent(data.assumptions.capacityFactor),
                },
              ]}
            />
          </ColumnLayout>
        </ExpandableSection>

        {/* Action Buttons */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Actions
          </Box>
          <SpaceBetween direction="horizontal" size="xs">
            {onFollowUpAction && (
              <>
                <Button
                  variant="primary"
                  iconName="view-full"
                  onClick={() => onFollowUpAction(`compare scenarios for ${data.projectId}`)}
                >
                  Compare Scenarios
                </Button>
                <Button
                  iconName="settings"
                  onClick={() => onFollowUpAction(`adjust financial assumptions for ${data.projectId}`)}
                >
                  Adjust Assumptions
                </Button>
                <Button
                  iconName="download"
                  onClick={() => onFollowUpAction(`export financial analysis for ${data.projectId}`)}
                >
                  Export Analysis
                </Button>
              </>
            )}
          </SpaceBetween>
        </Box>

        {/* Project ID */}
        <Box variant="small" color="text-body-secondary">
          Project ID: {data.projectId}
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default FinancialAnalysisArtifact;
