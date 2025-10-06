import React from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  ProgressBar,
  Badge,
  Table,
  Box,
  ColumnLayout,
  KeyValuePairs,
  Alert,
  LineChart,
  BarChart
} from '@cloudscape-design/components';

interface MonthlyData {
  month: string;
  energyProduction: number;
  capacity: number;
  efficiency: number;
  revenue: number;
}

interface TurbinePerformance {
  turbineId: string;
  annualOutput: number;
  capacityFactor: number;
  availability: number;
  maintenanceCosts: number;
  efficiency: number;
}

interface FinancialMetrics {
  totalCapex: number;
  annualOpex: number;
  annualRevenue: number;
  netPresentValue: number;
  internalRateOfReturn: number;
  paybackPeriod: number;
  levelizedCostOfEnergy: number;
}

interface WindFarmSimulationData {
  siteId: string;
  siteName: string;
  simulationPeriod: string;
  monthlyPerformance: MonthlyData[];
  turbinePerformance: TurbinePerformance[];
  financialMetrics: FinancialMetrics;
  overallMetrics: {
    totalAnnualOutput: number;
    averageCapacityFactor: number;
    totalCapacity: number;
    co2Reduction: number;
    householdsServed: number;
  };
  riskAssessment: {
    weatherRisk: number;
    technicalRisk: number;
    financialRisk: number;
    overallRisk: number;
  };
  environmentalImpact: {
    co2ReductionAnnual: number;
    waterSavings: number;
    landUseEfficiency: number;
    biodiversityImpact: string;
  };
}

interface WindFarmSimulationComponentProps {
  data: WindFarmSimulationData;
}

const WindFarmSimulationComponent: React.FC<WindFarmSimulationComponentProps> = ({ data }) => {
  const turbineColumns = [
    {
      id: 'turbineId',
      header: 'Turbine ID',
      cell: (item: TurbinePerformance) => item.turbineId
    },
    {
      id: 'annualOutput',
      header: 'Annual Output (MWh)',
      cell: (item: TurbinePerformance) => item.annualOutput.toLocaleString()
    },
    {
      id: 'capacityFactor',
      header: 'Capacity Factor',
      cell: (item: TurbinePerformance) => (
        <Badge color={item.capacityFactor > 35 ? 'green' : item.capacityFactor > 25 ? 'blue' : 'red'}>
          {item.capacityFactor.toFixed(1)}%
        </Badge>
      )
    },
    {
      id: 'availability',
      header: 'Availability',
      cell: (item: TurbinePerformance) => `${item.availability.toFixed(1)}%`
    },
    {
      id: 'maintenanceCosts',
      header: 'Annual Maintenance ($)',
      cell: (item: TurbinePerformance) => `$${item.maintenanceCosts.toLocaleString()}`
    }
  ];

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'green';
    if (risk < 60) return 'blue';
    return 'red';
  };

  const getPerformanceColor = (value: number, threshold1: number, threshold2: number) => {
    if (value > threshold1) return 'green';
    if (value > threshold2) return 'blue';
    return 'red';
  };

  const overallMetricsItems = [
    { label: 'Total Annual Output', value: `${data.overallMetrics.totalAnnualOutput.toLocaleString()} MWh` },
    { label: 'Average Capacity Factor', value: `${data.overallMetrics.averageCapacityFactor}%` },
    { label: 'Total Capacity', value: `${data.overallMetrics.totalCapacity} MW` },
    { label: 'CO2 Reduction', value: `${data.overallMetrics.co2Reduction.toLocaleString()} tons/year` },
    { label: 'Households Served', value: data.overallMetrics.householdsServed.toLocaleString() },
    { label: 'Simulation Period', value: data.simulationPeriod }
  ];

  const financialItems = [
    { label: 'Total CAPEX', value: `$${(data.financialMetrics.totalCapex / 1000000).toFixed(1)}M` },
    { label: 'Annual OPEX', value: `$${(data.financialMetrics.annualOpex / 1000000).toFixed(1)}M` },
    { label: 'Annual Revenue', value: `$${(data.financialMetrics.annualRevenue / 1000000).toFixed(1)}M` },
    { label: 'Net Present Value', value: `$${(data.financialMetrics.netPresentValue / 1000000).toFixed(1)}M` },
    { label: 'Internal Rate of Return', value: `${data.financialMetrics.internalRateOfReturn}%` },
    { label: 'Payback Period', value: `${data.financialMetrics.paybackPeriod} years` },
    { label: 'LCOE', value: `$${data.financialMetrics.levelizedCostOfEnergy}/MWh` }
  ];

  const environmentalItems = [
    { label: 'Annual CO2 Reduction', value: `${data.environmentalImpact.co2ReductionAnnual.toLocaleString()} tons` },
    { label: 'Water Savings', value: `${data.environmentalImpact.waterSavings.toLocaleString()} gallons/year` },
    { label: 'Land Use Efficiency', value: `${data.environmentalImpact.landUseEfficiency} MW/km²` },
    { label: 'Biodiversity Impact', value: data.environmentalImpact.biodiversityImpact }
  ];

  const monthlyChartData = data.monthlyPerformance.map(month => ({
    x: month.month,
    y: month.energyProduction
  }));

  const capacityFactorData = data.monthlyPerformance.map(month => ({
    x: month.month,
    y: month.efficiency
  }));

  const tabs = [
    {
      label: 'Performance Overview',
      id: 'overview',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Overall Metrics</Header>
            <KeyValuePairs columns={2} items={overallMetricsItems} />
          </Container>

          <ColumnLayout columns={3} variant="text-grid">
            <div>
              <Box variant="h3">Energy Performance</Box>
              <ProgressBar
                value={data.overallMetrics.averageCapacityFactor}
                additionalInfo={`${data.overallMetrics.averageCapacityFactor}%`}
                description="Average capacity factor across all turbines"
              />
            </div>
            <div>
              <Box variant="h3">Financial Performance</Box>
              <ProgressBar
                value={Math.min(data.financialMetrics.internalRateOfReturn * 10, 100)}
                additionalInfo={`${data.financialMetrics.internalRateOfReturn}% IRR`}
                description="Internal rate of return"
              />
            </div>
            <div>
              <Box variant="h3">Environmental Impact</Box>
              <ProgressBar
                value={Math.min(data.environmentalImpact.landUseEfficiency * 20, 100)}
                additionalInfo={`${data.environmentalImpact.landUseEfficiency} MW/km²`}
                description="Land use efficiency"
              />
            </div>
          </ColumnLayout>

          <Container>
            <Header variant="h2">Risk Assessment</Header>
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="h4">Weather Risk</Box>
                <Badge color={getRiskColor(data.riskAssessment.weatherRisk)}>
                  {data.riskAssessment.weatherRisk}% Risk
                </Badge>
              </div>
              <div>
                <Box variant="h4">Technical Risk</Box>
                <Badge color={getRiskColor(data.riskAssessment.technicalRisk)}>
                  {data.riskAssessment.technicalRisk}% Risk
                </Badge>
              </div>
              <div>
                <Box variant="h4">Financial Risk</Box>
                <Badge color={getRiskColor(data.riskAssessment.financialRisk)}>
                  {data.riskAssessment.financialRisk}% Risk
                </Badge>
              </div>
              <div>
                <Box variant="h4">Overall Risk</Box>
                <Badge color={getRiskColor(data.riskAssessment.overallRisk)}>
                  {data.riskAssessment.overallRisk}% Risk
                </Badge>
              </div>
            </ColumnLayout>
          </Container>
        </SpaceBetween>
      )
    },
    {
      label: 'Monthly Performance',
      id: 'monthly',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Monthly Energy Production</Header>
            <LineChart
              series={[
                {
                  title: 'Energy Production (MWh)',
                  type: 'line',
                  data: monthlyChartData
                }
              ]}
              xDomain={data.monthlyPerformance.map(m => m.month)}
              yDomain={[0, Math.max(...data.monthlyPerformance.map(m => m.energyProduction)) * 1.1]}
              i18nStrings={{
                legendAriaLabel: 'Legend',
                chartAriaRoleDescription: 'Line chart showing monthly energy production',
                xTickFormatter: (value) => value.toString(),
                yTickFormatter: (value) => `${value.toLocaleString()} MWh`
              }}
              ariaLabel="Monthly energy production chart"
              height={300}
            />
          </Container>

          <Container>
            <Header variant="h2">Monthly Efficiency</Header>
            <BarChart
              series={[
                {
                  title: 'Capacity Factor (%)',
                  type: 'bar',
                  data: capacityFactorData
                }
              ]}
              xDomain={data.monthlyPerformance.map(m => m.month)}
              yDomain={[0, 100]}
              i18nStrings={{
                legendAriaLabel: 'Legend',
                chartAriaRoleDescription: 'Bar chart showing monthly capacity factors',
                xTickFormatter: (value) => value.toString(),
                yTickFormatter: (value) => `${value}%`
              }}
              ariaLabel="Monthly capacity factor chart"
              height={300}
            />
          </Container>
        </SpaceBetween>
      )
    },
    {
      label: 'Turbine Performance',
      id: 'turbines',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Alert
            statusIconAriaLabel="Info"
            header="Individual Turbine Performance"
          >
            Performance analysis for {data.turbinePerformance.length} turbines showing annual output, 
            capacity factors, and maintenance requirements.
          </Alert>

          <Table
            columnDefinitions={turbineColumns}
            items={data.turbinePerformance}
            loadingText="Loading turbine performance data"
            sortingDisabled
            empty={
              <Box margin={{ vertical: 'xs' }} textAlign="center" color="inherit">
                <b>No turbine performance data</b>
                <Box variant="p" color="inherit">
                  No turbine performance data to display.
                </Box>
              </Box>
            }
            header={
              <Header
                counter={`(${data.turbinePerformance.length})`}
                description="Individual turbine performance metrics and costs"
              >
                Turbine Performance Analysis
              </Header>
            }
          />
        </SpaceBetween>
      )
    },
    {
      label: 'Financial Analysis',
      id: 'financial',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Financial Metrics</Header>
            <KeyValuePairs columns={2} items={financialItems} />
          </Container>

          <Container>
            <Header variant="h2">Project Viability</Header>
            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="h4">NPV Status</Box>
                <Badge color={data.financialMetrics.netPresentValue > 0 ? 'green' : 'red'}>
                  {data.financialMetrics.netPresentValue > 0 ? 'Positive' : 'Negative'} NPV
                </Badge>
              </div>
              <div>
                <Box variant="h4">IRR Performance</Box>
                <Badge color={getPerformanceColor(data.financialMetrics.internalRateOfReturn, 8, 5)}>
                  {data.financialMetrics.internalRateOfReturn}% IRR
                </Badge>
              </div>
              <div>
                <Box variant="h4">Payback Period</Box>
                <Badge color={getPerformanceColor(15 - data.financialMetrics.paybackPeriod, 5, 0)}>
                  {data.financialMetrics.paybackPeriod} years
                </Badge>
              </div>
            </ColumnLayout>
          </Container>

          {data.financialMetrics.netPresentValue < 0 && (
            <Alert
              statusIconAriaLabel="Warning"
              type="warning"
              header="Financial Performance Warning"
            >
              The project shows negative NPV. Consider reviewing assumptions, incentives, or project scope 
              to improve financial viability.
            </Alert>
          )}
        </SpaceBetween>
      )
    },
    {
      label: 'Environmental Impact',
      id: 'environmental',
      content: (
        <SpaceBetween direction="vertical" size="l">
          <Container>
            <Header variant="h2">Environmental Benefits</Header>
            <KeyValuePairs columns={2} items={environmentalItems} />
          </Container>

          <Container>
            <Header variant="h2">Sustainability Metrics</Header>
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="h4">Carbon Impact</Box>
                <ProgressBar
                  value={Math.min(data.environmentalImpact.co2ReductionAnnual / 1000, 100)}
                  additionalInfo={`${data.environmentalImpact.co2ReductionAnnual.toLocaleString()} tons CO2/year`}
                  description="Annual carbon dioxide reduction"
                />
              </div>
              <div>
                <Box variant="h4">Resource Efficiency</Box>
                <ProgressBar
                  value={Math.min(data.environmentalImpact.waterSavings / 100000, 100)}
                  additionalInfo={`${data.environmentalImpact.waterSavings.toLocaleString()} gallons/year`}
                  description="Water resource savings compared to fossil fuels"
                />
              </div>
            </ColumnLayout>
          </Container>

          <Alert
            statusIconAriaLabel="Info"
            type="success"
            header="Positive Environmental Impact"
          >
            This wind farm will reduce CO2 emissions by {data.environmentalImpact.co2ReductionAnnual.toLocaleString()} tons 
            annually, equivalent to removing {Math.round(data.environmentalImpact.co2ReductionAnnual / 4.6)} cars from the road.
          </Alert>
        </SpaceBetween>
      )
    }
  ];

  return (
    <Container>
      <Header
        variant="h1"
        description={`Comprehensive performance simulation for ${data.siteName}`}
      >
        Wind Farm Performance Simulation
      </Header>
      <Tabs tabs={tabs} />
    </Container>
  );
};

export default WindFarmSimulationComponent;
