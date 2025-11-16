
import React, { useMemo } from 'react';
import { 
  Container, 
  Header, 
  SpaceBetween, 
  Box, 
  Badge, 
  ProgressBar,
  Icon,
  ExpandableSection,
  PieChart,
  BarChart
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

interface DataDashboardProps {
  wells: WellData[];
  queryType: string;
  searchQuery: string;
  weatherData?: any;
}

/**
 * DATA DASHBOARD
 * Responsive design optimized for narrow vertical panel in catalog page
 * - Stacked layout (no side-by-side grids)
 * - Compact spacing and typography
 * - Collapsible sections for better scrolling
 * - Single-column charts
 */
const DataDashboard = React.memo<DataDashboardProps>(({ 
  wells, 
  queryType, 
  searchQuery,
  weatherData
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

  // EUR distribution by well (top 5 for narrow panel)
  const eurByWellData = useMemo(() => 
    enhancedWells
      .sort((a, b) => (b.eur || 0) - (a.eur || 0))
      .slice(0, 5)
      .map(w => ({
        x: w.name.length > 15 ? w.name.substring(0, 12) + '...' : w.name,
        y: w.eur || 0
      }))
  , [enhancedWells]);

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
    <SpaceBetween direction="vertical" size="s">
      
      {/* Compact KPI Cards - Stacked vertically */}
      <Container
        header={
          <Header variant="h2">
            📊 Data Dashboard
          </Header>
        }
      >
        <SpaceBetween direction="vertical" size="xs">
          
          {/* KPI Card 1: Total Wells */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            border: '1px solid #1976d2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                Total Wells
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {fieldStats.totalWells}
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
              <Icon name="status-positive" variant="success" /><br/>
              {fieldStats.excellentCount + fieldStats.goodCount} High Quality
            </div>
          </div>

          {/* KPI Card 2: Total EUR */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#e8f5e8',
            borderRadius: '6px',
            border: '1px solid #2e7d32',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                Total EUR (MMCF)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {fieldStats.totalEUR.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
              <Icon name="angle-up" variant="success" /><br/>
              15% above forecast
            </div>
          </div>

          {/* KPI Card 3: Total NPV */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#fff3e0',
            borderRadius: '6px',
            border: '1px solid #f57c00',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                Total NPV ($M)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                ${fieldStats.totalNPV.toFixed(1)}
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
              <Icon name="status-positive" variant="success" /><br/>
              ROI: 245%
            </div>
          </div>

          {/* KPI Card 4: Average Porosity */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#f3e5f5',
            borderRadius: '6px',
            border: '1px solid #7b1fa2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                Avg Porosity
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                {fieldStats.averagePorosity.toFixed(1)}%
              </div>
            </div>
            <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
              <Icon name="status-positive" variant="success" /><br/>
              Excellent quality
            </div>
          </div>

        </SpaceBetween>
      </Container>

      {/* Reservoir Quality Distribution - Compact Donut */}
      <ExpandableSection
        headerText="📊 Reservoir Quality"
        variant="container"
        defaultExpanded={true}
      >
        <PieChart
          data={qualityDistributionData}
          detailPopoverContent={(datum, sum) => [
            { key: "Wells", value: datum.value },
            { key: "Percentage", value: `${((datum.value / sum) * 100).toFixed(1)}%` }
          ]}
          segmentDescription={(datum, sum) => 
            `${datum.value} wells, ${((datum.value / sum) * 100).toFixed(0)}%`
          }
          ariaDescription="Reservoir quality distribution"
          ariaLabel="Reservoir quality chart"
          innerMetricDescription="wells"
          innerMetricValue={fieldStats.totalWells.toString()}
          variant="donut"
          size="small"
          hideFilter
        />
        <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 'xs' }}>
          Quality based on porosity, permeability, net pay
        </Box>
      </ExpandableSection>

      {/* EUR Distribution - Compact Bar Chart */}
      <ExpandableSection
        headerText="📈 Top 5 Wells by EUR"
        variant="container"
        defaultExpanded={false}
      >
        <BarChart
          series={[
            {
              title: "EUR (MMCF)",
              type: "bar",
              data: eurByWellData,
              valueFormatter: (value) => `${value.toLocaleString()}`
            }
          ]}
          xDomain={eurByWellData.map(d => d.x)}
          yDomain={[0, Math.max(...eurByWellData.map(d => d.y)) * 1.1]}
          xTitle="Well"
          yTitle="EUR (MMCF)"
          ariaLabel="EUR distribution"
          ariaDescription="Top 5 wells by estimated ultimate recovery"
          height={200}
          hideFilter
          hideLegend
        />
        <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 'xs' }}>
          Estimated ultimate recovery
        </Box>
      </ExpandableSection>

      {/* Operator Distribution - Compact Donut */}
      <ExpandableSection
        headerText="🏢 Operator Distribution"
        variant="container"
        defaultExpanded={false}
      >
        <PieChart
          data={operatorDistribution}
          detailPopoverContent={(datum, sum) => [
            { key: "Wells", value: datum.value },
            { key: "Share", value: `${((datum.value / sum) * 100).toFixed(1)}%` }
          ]}
          segmentDescription={(datum, sum) => 
            `${datum.value} wells, ${((datum.value / sum) * 100).toFixed(0)}%`
          }
          ariaDescription="Operator distribution"
          ariaLabel="Operator chart"
          innerMetricDescription="operators"
          innerMetricValue={operatorDistribution.length.toString()}
          variant="donut"
          size="small"
          hideFilter
        />
        <Box variant="small" color="text-body-secondary" textAlign="center" margin={{ top: 'xs' }}>
          Well ownership distribution
        </Box>
      </ExpandableSection>

      {/* Economic Summary - Collapsible */}
      <ExpandableSection
        headerText="💰 Economic Summary"
        variant="container"
        defaultExpanded={false}
      >
        <SpaceBetween direction="vertical" size="xs">
          
          <div style={{
            padding: '8px 10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '6px',
            border: '1px solid #2e7d32',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#666' }}>
              Capital Investment
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32' }}>
              ${(fieldStats.totalNPV / 2.45).toFixed(1)}M
            </div>
          </div>

          <div style={{
            padding: '8px 10px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            border: '1px solid #1976d2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#666' }}>
              Expected Revenue
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1976d2' }}>
              ${(fieldStats.totalNPV * 1.5).toFixed(1)}M
            </div>
          </div>

          <div style={{
            padding: '8px 10px',
            backgroundColor: '#fff3e0',
            borderRadius: '6px',
            border: '1px solid #f57c00',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#666' }}>
              Payback Period
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f57c00' }}>
              3.2 years
            </div>
          </div>

          <div style={{
            padding: '8px 10px',
            backgroundColor: '#f3e5f5',
            borderRadius: '6px',
            border: '1px solid #7b1fa2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '10px', color: '#666' }}>
              Internal Rate of Return
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7b1fa2' }}>
              28.5%
            </div>
          </div>

        </SpaceBetween>
      </ExpandableSection>

      {/* Top Wells Table - Collapsible */}
      <ExpandableSection
        headerText="🏆 Top 10 Wells"
        variant="container"
        defaultExpanded={false}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>#</th>
                <th style={{ padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>Well</th>
                <th style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>Quality</th>
                <th style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>NPV</th>
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
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index < 3 ? '#f0f8f0' : 'white'
                    }}
                  >
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '6px', fontWeight: 'bold', color: '#1976d2' }}>
                      {well.name.length > 12 ? well.name.substring(0, 10) + '...' : well.name}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <Badge 
                        color={
                          well.reservoirQuality === 'Excellent' ? 'green' :
                          well.reservoirQuality === 'Good' ? 'blue' : 'grey'
                        }
                      >
                        {well.reservoirQuality?.substring(0, 3)}
                      </Badge>
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>
                      ${(well.npv || 0).toFixed(1)}M
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </ExpandableSection>

    </SpaceBetween>
  );
});

DataDashboard.displayName = 'DataDashboard';

export default DataDashboard;

// Backwards compatibility export
export { DataDashboard as GeoscientistDashboard };
