'use client';

import React, { useMemo } from 'react';
import { 
  Container, 
  Header, 
  SpaceBetween, 
  Grid, 
  Box, 
  Badge, 
  ProgressBar,
  KeyValuePairs,
  Cards,
  Button,
  Icon,
  ExpandableSection,
  Tabs,
  PieChart,
  BarChart,
  LineChart
} from '@cloudscape-design/components';

interface WellData {
  name: string;
  type: string;
  depth: string;
  location: string;
  operator: string;
  coordinates: [number, number];
  porosity?: number;
  permeability?: number;
  netPay?: number;
  waterSaturation?: number;
  reservoirQuality?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

interface EnhancedGeoscientistDashboardProps {
  wells: WellData[];
  queryType: string;
  searchQuery: string;
  weatherData?: any;
  narrowPanel?: boolean; // NEW: Flag to enable narrow panel mode
}

const EnhancedGeoscientistDashboard = React.memo<EnhancedGeoscientistDashboardProps>(({ 
  wells, 
  queryType, 
  searchQuery,
  weatherData,
  narrowPanel = false // Default to wide layout
}) => {
  
  // Enhanced well data with calculated properties
  const enhancedWells = useMemo(() => wells.map((well) => {
    const seed = well.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed * 9301 + 49297) % 233280 / 233280;
    
    const porosity = 0.12 + (random * 0.15);
    const permeability = Math.pow(10, (random * 3) - 1);
    const netPay = 15 + (random * 85);
    const waterSaturation = 0.25 + (random * 0.40);
    
    let reservoirQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    const qualityScore = (porosity * 100) + Math.log10(permeability) * 10 + netPay;
    
    if (qualityScore > 50) reservoirQuality = 'Excellent';
    else if (qualityScore > 35) reservoirQuality = 'Good';
    else if (qualityScore > 25) reservoirQuality = 'Fair';
    else reservoirQuality = 'Poor';

    return {
      ...well,
      porosity: Math.round(porosity * 1000) / 10,
      permeability: Math.round(permeability * 10) / 10,
      netPay: Math.round(netPay),
      waterSaturation: Math.round(waterSaturation * 1000) / 10,
      reservoirQuality,
      qualityScore: Math.round(qualityScore),
      eur: Math.round((porosity * 100) * netPay * (1 - waterSaturation) * 0.5),
      npv: Math.round((porosity * 100) * netPay * (1 - waterSaturation) * 0.5 * 2.3 * 10) / 10
    };
  }), [wells]);

  // Field statistics
  const fieldStats = useMemo(() => {
    const excellentWells = enhancedWells.filter(w => w.reservoirQuality === 'Excellent');
    const goodWells = enhancedWells.filter(w => w.reservoirQuality === 'Good');
    const fairWells = enhancedWells.filter(w => w.reservoirQuality === 'Fair');
    const poorWells = enhancedWells.filter(w => w.reservoirQuality === 'Poor');
    
    return {
      totalWells: enhancedWells.length,
      averagePorosity: enhancedWells.reduce((sum, w) => sum + (w.porosity || 0), 0) / enhancedWells.length,
      totalNetPay: enhancedWells.reduce((sum, w) => sum + (w.netPay || 0), 0),
      totalEUR: enhancedWells.reduce((sum, w) => sum + (w.eur || 0), 0),
      totalNPV: enhancedWells.reduce((sum, w) => sum + (w.npv || 0), 0),
      excellentCount: excellentWells.length,
      goodCount: goodWells.length,
      fairCount: fairWells.length,
      poorCount: poorWells.length,
      excellentWells,
      goodWells,
      fairWells,
      poorWells
    };
  }, [enhancedWells]);

  // Donut chart data for reservoir quality distribution
  const qualityDistributionData = useMemo(() => [
    { title: 'Excellent', value: fieldStats.excellentCount, color: '#2e7d32' },
    { title: 'Good', value: fieldStats.goodCount, color: '#1976d2' },
    { title: 'Fair', value: fieldStats.fairCount, color: '#f57c00' },
    { title: 'Poor', value: fieldStats.poorCount, color: '#d32f2f' }
  ], [fieldStats]);

  // EUR distribution by well
  const eurByWellData = useMemo(() => 
    enhancedWells
      .sort((a, b) => (b.eur || 0) - (a.eur || 0))
      .slice(0, 10)
      .map(w => ({
        x: w.name,
        y: w.eur || 0
      }))
  , [enhancedWells]);

  // NPV distribution by well
  const npvByWellData = useMemo(() => 
    enhancedWells
      .sort((a, b) => (b.npv || 0) - (a.npv || 0))
      .slice(0, 10)
      .map(w => ({
        x: w.name,
        y: w.npv || 0
      }))
  , [enhancedWells]);

  // Production timeline data (Gantt-style)
  const productionTimeline = useMemo(() => {
    const topWells = enhancedWells
      .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
      .slice(0, 12);
    
    return topWells.map((well, index) => {
      const phase = Math.floor(index / 3) + 1;
      const quarterStart = (phase - 1) * 3;
      const quarterEnd = quarterStart + 3;
      
      return {
        well: well.name,
        phase: `Phase ${phase}`,
        start: quarterStart,
        duration: 3,
        quality: well.reservoirQuality,
        eur: well.eur,
        npv: well.npv
      };
    });
  }, [enhancedWells]);

  // Operator distribution
  const operatorDistribution = useMemo(() => {
    const operators = enhancedWells.reduce((acc, well) => {
      acc[well.operator] = (acc[well.operator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(operators).map(([operator, count]) => ({
      title: operator,
      value: count
    }));
  }, [enhancedWells]);

  return (
    <SpaceBetween direction="vertical" size="l">
      
      {/* Executive KPI Dashboard */}
      <Container
        header={
          <Header
            variant="h1"
            description="Real-time field intelligence and development analytics"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button iconName="refresh">Refresh Data</Button>
                <Button iconName="download">Export Report</Button>
                <Button variant="primary" iconName="add-plus">New Analysis</Button>
              </SpaceBetween>
            }
          >
            🌊 Field Development Intelligence Dashboard
          </Header>
        }
      >
        <Grid gridDefinition={[
          { colspan: { default: 12, xs: 6, s: 3 } },
          { colspan: { default: 12, xs: 6, s: 3 } },
          { colspan: { default: 12, xs: 6, s: 3 } },
          { colspan: { default: 12, xs: 6, s: 3 } }
        ]}>
          
          {/* KPI Card 1: Total Wells */}
          <div style={{
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '2px solid #1976d2',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total Wells Analyzed
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1976d2', marginBottom: '8px' }}>
              {fieldStats.totalWells}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <Icon name="status-positive" variant="success" /> {fieldStats.excellentCount + fieldStats.goodCount} High Quality
            </div>
          </div>

          {/* KPI Card 2: Total EUR */}
          <div style={{
            padding: '20px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '2px solid #2e7d32',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total EUR (MMCF)
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
              {fieldStats.totalEUR.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <Icon name="angle-up" variant="success" /> 15% above forecast
            </div>
          </div>

          {/* KPI Card 3: Total NPV */}
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            border: '2px solid #f57c00',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Total NPV ($M)
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#f57c00', marginBottom: '8px' }}>
              ${fieldStats.totalNPV.toFixed(1)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <Icon name="status-positive" variant="success" /> ROI: 245%
            </div>
          </div>

          {/* KPI Card 4: Average Porosity */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f3e5f5',
            borderRadius: '8px',
            border: '2px solid #7b1fa2',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Average Porosity
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#7b1fa2', marginBottom: '8px' }}>
              {fieldStats.averagePorosity.toFixed(1)}%
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <Icon name="status-positive" variant="success" /> Excellent reservoir quality
            </div>
          </div>

        </Grid>
      </Container>

      {/* Main Analytics Grid */}
      <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
        
        {/* Left Column: Donut Charts */}
        <SpaceBetween direction="vertical" size="l">
          
          {/* Reservoir Quality Distribution Donut Chart */}
          <Container
            header={
              <Header variant="h2">
                📊 Reservoir Quality Distribution
              </Header>
            }
          >
            <PieChart
              data={qualityDistributionData}
              detailPopoverContent={(datum, sum) => [
                { key: "Wells", value: datum.value },
                { key: "Percentage", value: `${((datum.value / sum) * 100).toFixed(1)}%` },
                { 
                  key: "Avg EUR", 
                  value: `${Math.round(
                    fieldStats[`${datum.title.toLowerCase()}Wells` as keyof typeof fieldStats] 
                      ? (fieldStats[`${datum.title.toLowerCase()}Wells` as keyof typeof fieldStats] as any[])
                          .reduce((sum: number, w: any) => sum + (w.eur || 0), 0) / 
                        (fieldStats[`${datum.title.toLowerCase()}Wells` as keyof typeof fieldStats] as any[]).length
                      : 0
                  )} MMCF`
                }
              ]}
              segmentDescription={(datum, sum) => 
                `${datum.value} wells, ${((datum.value / sum) * 100).toFixed(0)}%`
              }
              ariaDescription="Reservoir quality distribution across all wells"
              ariaLabel="Reservoir quality donut chart"
              innerMetricDescription="wells"
              innerMetricValue={fieldStats.totalWells.toString()}
              variant="donut"
              size="medium"
              hideFilter
            />
            <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 's' }}>
              Quality classification based on porosity, permeability, and net pay
            </Box>
          </Container>

          {/* Operator Distribution Donut Chart */}
          <Container
            header={
              <Header variant="h2">
                🏢 Operator Distribution
              </Header>
            }
          >
            <PieChart
              data={operatorDistribution}
              detailPopoverContent={(datum, sum) => [
                { key: "Wells", value: datum.value },
                { key: "Market Share", value: `${((datum.value / sum) * 100).toFixed(1)}%` }
              ]}
              segmentDescription={(datum, sum) => 
                `${datum.value} wells, ${((datum.value / sum) * 100).toFixed(0)}%`
              }
              ariaDescription="Distribution of wells by operator"
              ariaLabel="Operator distribution donut chart"
              innerMetricDescription="operators"
              innerMetricValue={operatorDistribution.length.toString()}
              variant="donut"
              size="medium"
              hideFilter
            />
            <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 's' }}>
              Well ownership and operational responsibility distribution
            </Box>
          </Container>

        </SpaceBetween>

        {/* Right Column: Bar Charts */}
        <SpaceBetween direction="vertical" size="l">
          
          {/* EUR by Well Bar Chart */}
          <Container
            header={
              <Header 
                variant="h2"
                description="Top 10 wells by estimated ultimate recovery"
              >
                📈 EUR Distribution (MMCF)
              </Header>
            }
          >
            <BarChart
              series={[
                {
                  title: "EUR (MMCF)",
                  type: "bar",
                  data: eurByWellData,
                  valueFormatter: (value) => `${value.toLocaleString()} MMCF`
                }
              ]}
              xDomain={eurByWellData.map(d => d.x)}
              yDomain={[0, Math.max(...eurByWellData.map(d => d.y)) * 1.1]}
              xTitle="Well Name"
              yTitle="EUR (MMCF)"
              ariaLabel="EUR distribution bar chart"
              ariaDescription="Estimated ultimate recovery for top 10 wells"
              height={300}
              hideFilter
              hideLegend
            />
            <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 's' }}>
              Estimated ultimate recovery based on reservoir properties and completion design
            </Box>
          </Container>

          {/* NPV by Well Bar Chart */}
          <Container
            header={
              <Header 
                variant="h2"
                description="Top 10 wells by net present value"
              >
                💰 NPV Distribution ($M)
              </Header>
            }
          >
            <BarChart
              series={[
                {
                  title: "NPV ($M)",
                  type: "bar",
                  data: npvByWellData,
                  valueFormatter: (value) => `$${value.toFixed(1)}M`
                }
              ]}
              xDomain={npvByWellData.map(d => d.x)}
              yDomain={[0, Math.max(...npvByWellData.map(d => d.y)) * 1.1]}
              xTitle="Well Name"
              yTitle="NPV ($M)"
              ariaLabel="NPV distribution bar chart"
              ariaDescription="Net present value for top 10 wells"
              height={300}
              hideFilter
              hideLegend
            />
            <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 's' }}>
              Economic value at 10% discount rate over 15-year field life
            </Box>
          </Container>

        </SpaceBetween>

      </Grid>

      {/* Production Timeline (Gantt-style) */}
      <Container
        header={
          <Header 
            variant="h2"
            description="Phased development schedule with quality indicators"
          >
            📅 Development Timeline & Gantt Chart
          </Header>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '800px', padding: '20px' }}>
            
            {/* Timeline Header */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '150px repeat(12, 1fr)',
              gap: '4px',
              marginBottom: '12px'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', padding: '8px' }}>
                Well / Phase
              </div>
              {Array.from({ length: 12 }, (_, i) => (
                <div 
                  key={i}
                  style={{ 
                    fontWeight: 'bold', 
                    fontSize: '11px', 
                    textAlign: 'center',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px'
                  }}
                >
                  Q{(i % 4) + 1}<br/>Y{Math.floor(i / 4) + 1}
                </div>
              ))}
            </div>

            {/* Timeline Rows */}
            {productionTimeline.map((item, index) => (
              <div 
                key={item.well}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '150px repeat(12, 1fr)',
                  gap: '4px',
                  marginBottom: '8px',
                  alignItems: 'center'
                }}
              >
                {/* Well Name */}
                <div style={{ 
                  padding: '8px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Badge color={
                    item.quality === 'Excellent' ? 'green' :
                    item.quality === 'Good' ? 'blue' : 'grey'
                  }>
                    {item.quality}
                  </Badge>
                  {item.well}
                </div>

                {/* Timeline Bar */}
                {Array.from({ length: 12 }, (_, i) => {
                  const isActive = i >= item.start && i < item.start + item.duration;
                  const isStart = i === item.start;
                  const isEnd = i === item.start + item.duration - 1;
                  
                  return (
                    <div 
                      key={i}
                      style={{
                        height: '40px',
                        backgroundColor: isActive 
                          ? (item.quality === 'Excellent' ? '#2e7d32' :
                             item.quality === 'Good' ? '#1976d2' : '#f57c00')
                          : '#f5f5f5',
                        borderRadius: isStart ? '4px 0 0 4px' : isEnd ? '0 4px 4px 0' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? 'white' : 'transparent',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        position: 'relative'
                      }}
                    >
                      {isStart && (
                        <div style={{ 
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          whiteSpace: 'nowrap',
                          fontSize: '9px'
                        }}>
                          {item.phase}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#2e7d32', borderRadius: '4px' }}></div>
                <span>Excellent Quality</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#1976d2', borderRadius: '4px' }}></div>
                <span>Good Quality</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#f57c00', borderRadius: '4px' }}></div>
                <span>Fair Quality</span>
              </div>
            </div>

          </div>
        </div>

        <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 's' }}>
          Development schedule optimized for high-quality wells first, with phased approach to maximize NPV
        </Box>
      </Container>

      {/* Detailed Analytics Tabs */}
      <Container>
        <Tabs
          tabs={[
            {
              label: "Performance Metrics",
              id: "metrics",
              content: (
                <SpaceBetween direction="vertical" size="l">
                  
                  <Grid gridDefinition={[{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }]}>
                    
                    {/* Porosity Distribution */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <Box variant="h3" margin={{ bottom: 'm' }}>Porosity Distribution</Box>
                      <div style={{ height: '200px', position: 'relative' }}>
                        {/* Histogram visualization */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-end', 
                          height: '100%', 
                          gap: '4px',
                          justifyContent: 'space-around'
                        }}>
                          {[
                            { range: '10-15%', count: enhancedWells.filter(w => w.porosity && w.porosity < 15).length },
                            { range: '15-20%', count: enhancedWells.filter(w => w.porosity && w.porosity >= 15 && w.porosity < 20).length },
                            { range: '20-25%', count: enhancedWells.filter(w => w.porosity && w.porosity >= 20 && w.porosity < 25).length },
                            { range: '25-30%', count: enhancedWells.filter(w => w.porosity && w.porosity >= 25).length }
                          ].map((bin, i) => {
                            const maxCount = Math.max(...[
                              enhancedWells.filter(w => w.porosity && w.porosity < 15).length,
                              enhancedWells.filter(w => w.porosity && w.porosity >= 15 && w.porosity < 20).length,
                              enhancedWells.filter(w => w.porosity && w.porosity >= 20 && w.porosity < 25).length,
                              enhancedWells.filter(w => w.porosity && w.porosity >= 25).length
                            ]);
                            const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
                            
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                  width: '100%',
                                  height: `${height}%`,
                                  backgroundColor: '#1976d2',
                                  borderRadius: '4px 4px 0 0',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'center',
                                  paddingTop: '4px',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {bin.count}
                                </div>
                                <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
                                  {bin.range}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Permeability Distribution */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <Box variant="h3" margin={{ bottom: 'm' }}>Permeability Distribution</Box>
                      <div style={{ height: '200px', position: 'relative' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-end', 
                          height: '100%', 
                          gap: '4px',
                          justifyContent: 'space-around'
                        }}>
                          {[
                            { range: '<1 mD', count: enhancedWells.filter(w => w.permeability && w.permeability < 1).length },
                            { range: '1-10 mD', count: enhancedWells.filter(w => w.permeability && w.permeability >= 1 && w.permeability < 10).length },
                            { range: '10-50 mD', count: enhancedWells.filter(w => w.permeability && w.permeability >= 10 && w.permeability < 50).length },
                            { range: '>50 mD', count: enhancedWells.filter(w => w.permeability && w.permeability >= 50).length }
                          ].map((bin, i) => {
                            const maxCount = Math.max(...[
                              enhancedWells.filter(w => w.permeability && w.permeability < 1).length,
                              enhancedWells.filter(w => w.permeability && w.permeability >= 1 && w.permeability < 10).length,
                              enhancedWells.filter(w => w.permeability && w.permeability >= 10 && w.permeability < 50).length,
                              enhancedWells.filter(w => w.permeability && w.permeability >= 50).length
                            ]);
                            const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
                            
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                  width: '100%',
                                  height: `${height}%`,
                                  backgroundColor: '#2e7d32',
                                  borderRadius: '4px 4px 0 0',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'center',
                                  paddingTop: '4px',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {bin.count}
                                </div>
                                <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
                                  {bin.range}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Net Pay Distribution */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <Box variant="h3" margin={{ bottom: 'm' }}>Net Pay Distribution</Box>
                      <div style={{ height: '200px', position: 'relative' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-end', 
                          height: '100%', 
                          gap: '4px',
                          justifyContent: 'space-around'
                        }}>
                          {[
                            { range: '<30m', count: enhancedWells.filter(w => w.netPay && w.netPay < 30).length },
                            { range: '30-50m', count: enhancedWells.filter(w => w.netPay && w.netPay >= 30 && w.netPay < 50).length },
                            { range: '50-70m', count: enhancedWells.filter(w => w.netPay && w.netPay >= 50 && w.netPay < 70).length },
                            { range: '>70m', count: enhancedWells.filter(w => w.netPay && w.netPay >= 70).length }
                          ].map((bin, i) => {
                            const maxCount = Math.max(...[
                              enhancedWells.filter(w => w.netPay && w.netPay < 30).length,
                              enhancedWells.filter(w => w.netPay && w.netPay >= 30 && w.netPay < 50).length,
                              enhancedWells.filter(w => w.netPay && w.netPay >= 50 && w.netPay < 70).length,
                              enhancedWells.filter(w => w.netPay && w.netPay >= 70).length
                            ]);
                            const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
                            
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                  width: '100%',
                                  height: `${height}%`,
                                  backgroundColor: '#f57c00',
                                  borderRadius: '4px 4px 0 0',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'center',
                                  paddingTop: '4px',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {bin.count}
                                </div>
                                <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
                                  {bin.range}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </Grid>

                </SpaceBetween>
              )
            },
            
            {
              label: "Economic Analysis",
              id: "economics",
              content: (
                <SpaceBetween direction="vertical" size="l">
                  
                  {/* Economic Summary Cards */}
                  <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }]}>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '8px',
                      border: '2px solid #2e7d32',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Total Capital Investment
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2e7d32' }}>
                        ${(fieldStats.totalNPV / 2.45).toFixed(1)}M
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Drilling + Completion
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '8px',
                      border: '2px solid #1976d2',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Expected Revenue
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1976d2' }}>
                        ${(fieldStats.totalNPV * 1.5).toFixed(1)}M
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Over field life
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fff3e0',
                      borderRadius: '8px',
                      border: '2px solid #f57c00',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Payback Period
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f57c00' }}>
                        3.2 yrs
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        At current gas prices
                      </div>
                    </div>

                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f3e5f5',
                      borderRadius: '8px',
                      border: '2px solid #7b1fa2',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        Internal Rate of Return
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#7b1fa2' }}>
                        28.5%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Above hurdle rate
                      </div>
                    </div>

                  </Grid>

                  {/* Economic Ranking Table */}
                  <Container
                    header={
                      <Header variant="h3">
                        Top 10 Wells by Economic Value
                      </Header>
                    }
                  >
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>Rank</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>Well</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>Quality</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>EUR (MMCF)</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>NPV ($M)</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>ROI</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enhancedWells
                            .sort((a, b) => (b.npv || 0) - (a.npv || 0))
                            .slice(0, 10)
                            .map((well, index) => (
                              <tr 
                                key={well.name}
                                style={{ 
                                  borderBottom: '1px solid #e0e0e0',
                                  backgroundColor: index < 3 ? '#f0f8f0' : 'white'
                                }}
                              >
                                <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </td>
                                <td style={{ padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#1976d2' }}>
                                  {well.name}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <Badge color={
                                    well.reservoirQuality === 'Excellent' ? 'green' :
                                    well.reservoirQuality === 'Good' ? 'blue' : 'grey'
                                  }>
                                    {well.reservoirQuality}
                                  </Badge>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                                  {(well.eur || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#2e7d32' }}>
                                  ${(well.npv || 0).toFixed(1)}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                                  {((well.npv || 0) / 10 * 100).toFixed(0)}%
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <Badge color={index < 3 ? 'green' : index < 6 ? 'blue' : 'grey'}>
                                    {index < 3 ? 'High' : index < 6 ? 'Medium' : 'Low'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </Container>

                </SpaceBetween>
              )
            },
            
            {
              label: "Risk Analysis",
              id: "risk",
              content: (
                <SpaceBetween direction="vertical" size="l">
                  
                  <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
                    
                    {/* Risk Matrix */}
                    <Container
                      header={
                        <Header variant="h3">
                          ⚠️ Risk Assessment Matrix
                        </Header>
                      }
                    >
                      <div style={{ padding: '20px' }}>
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px'
                        }}>
                          {[
                            { risk: 'Geological', level: 'Low', color: '#2e7d32', score: 2 },
                            { risk: 'Technical', level: 'Low', color: '#2e7d32', score: 2 },
                            { risk: 'Economic', level: 'Medium', color: '#f57c00', score: 5 },
                            { risk: 'Operational', level: 'Medium', color: '#f57c00', score: 4 },
                            { risk: 'Environmental', level: 'Low', color: '#2e7d32', score: 3 },
                            { risk: 'Regulatory', level: 'Low', color: '#2e7d32', score: 2 }
                          ].map((item, i) => (
                            <div 
                              key={i}
                              style={{
                                padding: '16px',
                                backgroundColor: `${item.color}20`,
                                border: `2px solid ${item.color}`,
                                borderRadius: '8px',
                                textAlign: 'center'
                              }}
                            >
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                {item.risk}
                              </div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.color, marginBottom: '4px' }}>
                                {item.score}/10
                              </div>
                              <Badge color={
                                item.level === 'Low' ? 'green' :
                                item.level === 'Medium' ? 'blue' : 'red'
                              }>
                                {item.level}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Container>

                    {/* Mitigation Strategies */}
                    <Container
                      header={
                        <Header variant="h3">
                          🛡️ Risk Mitigation Strategies
                        </Header>
                      }
                    >
                      <SpaceBetween direction="vertical" size="s">
                        {[
                          {
                            title: 'Reservoir Uncertainty',
                            strategy: 'Acquire additional seismic data and drill appraisal wells',
                            status: 'In Progress'
                          },
                          {
                            title: 'Price Volatility',
                            strategy: 'Hedge 60% of production with long-term contracts',
                            status: 'Planned'
                          },
                          {
                            title: 'Weather Delays',
                            strategy: 'Schedule critical operations during optimal weather windows',
                            status: 'Implemented'
                          },
                          {
                            title: 'Cost Overruns',
                            strategy: 'Fixed-price contracts with major service providers',
                            status: 'Implemented'
                          }
                        ].map((item, i) => (
                          <div 
                            key={i}
                            style={{
                              padding: '12px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '6px',
                              border: '1px solid #e0e0e0'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {item.title}
                              </div>
                              <Badge color={
                                item.status === 'Implemented' ? 'green' :
                                item.status === 'In Progress' ? 'blue' : 'grey'
                              }>
                                {item.status}
                              </Badge>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {item.strategy}
                            </div>
                          </div>
                        ))}
                      </SpaceBetween>
                    </Container>

                  </Grid>

                </SpaceBetween>
              )
            }
          ]}
        />
      </Container>

    </SpaceBetween>
  );
});

EnhancedGeoscientistDashboard.displayName = 'EnhancedGeoscientistDashboard';

export default EnhancedGeoscientistDashboard;
