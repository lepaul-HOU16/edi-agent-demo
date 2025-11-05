/**
 * MOCKUP: Petrophysics Response with Cloudscape Design
 * 
 * REDESIGNED FOR NARROW WIDTHS with:
 * - Mobile-first responsive layout
 * - Heatmap/Boxplot combo visualization
 * - Intensity overlay where wells overlap
 * - Stacked vertical layout for narrow screens
 * - Collapsible controls
 * - Full-width visualizations
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Tabs,
  ExpandableSection,
  Badge,
  Button,
  Select,
  Multiselect,
  FormField,
  Cards,
  StatusIndicator,
  ProgressBar,
  Alert
} from '@cloudscape-design/components';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading visualization...</div>
}) as any;

interface PetrophysicsCloudscapeMockupProps {
  data?: any;
}

export function PetrophysicsCloudscapeMockup({ data }: PetrophysicsCloudscapeMockupProps) {
  const [activeTabId, setActiveTabId] = useState('overview');
  const [selectedWells, setSelectedWells] = useState([
    { label: 'Well-001', value: 'well-001' },
    { label: 'Well-002', value: 'well-002' }
  ]);
  const [selectedDataType, setSelectedDataType] = useState({ 
    label: 'Porosity (%)', 
    value: 'porosity' 
  });
  const [depthRange, setDepthRange] = useState({ min: 5000, max: 6000 });
  const [showControls, setShowControls] = useState(true);
  const [binSize, setBinSize] = useState({ label: '50 ft', value: 50 });

  // Mock data for visualization
  const mockWells = [
    { label: 'Well-001', value: 'well-001', color: '#3184c2' },
    { label: 'Well-002', value: 'well-002', color: '#ec7211' },
    { label: 'Well-003', value: 'well-003', color: '#5f8727' },
    { label: 'Well-004', value: 'well-004', color: '#d13212' }
  ];

  const dataTypes = [
    { label: 'Porosity (%)', value: 'porosity' },
    { label: 'Permeability (mD)', value: 'permeability' },
    { label: 'Water Saturation (%)', value: 'saturation' },
    { label: 'Shale Volume (%)', value: 'shale' },
    { label: 'Gamma Ray (API)', value: 'gamma' }
  ];

  const binSizes = [
    { label: '25 ft', value: 25 },
    { label: '50 ft', value: 50 },
    { label: '100 ft', value: 100 }
  ];

  // Generate heatmap data with intensity overlay
  const generateHeatmapData = useMemo(() => {
    const bins: any = {};
    const depthBins = [];
    
    // Create depth bins
    for (let depth = depthRange.min; depth <= depthRange.max; depth += binSize.value) {
      const binCenter = depth + binSize.value / 2;
      depthBins.push(binCenter);
      bins[binCenter] = {
        depth: binCenter,
        wellData: {},
        overlayCount: 0,
        intensitySum: 0
      };
    }

    // Generate data for each well
    selectedWells.forEach(well => {
      depthBins.forEach(binCenter => {
        const baseValue = selectedDataType.value === 'porosity' ? 15 : 
                         selectedDataType.value === 'permeability' ? 100 :
                         selectedDataType.value === 'saturation' ? 60 : 
                         selectedDataType.value === 'shale' ? 25 : 80;
        
        // Add some variation based on depth and well
        const depthFactor = Math.sin((binCenter - depthRange.min) / 200) * 5;
        const wellOffset = mockWells.findIndex(w => w.value === well.value) * 2;
        const noise = (Math.random() - 0.5) * 3;
        
        const value = baseValue + depthFactor + wellOffset + noise;
        
        bins[binCenter].wellData[well.value] = value;
        bins[binCenter].overlayCount += 1;
        bins[binCenter].intensitySum += value;
      });
    });

    // Calculate intensity (average where wells overlap)
    depthBins.forEach(binCenter => {
      if (bins[binCenter].overlayCount > 0) {
        bins[binCenter].intensity = bins[binCenter].intensitySum / bins[binCenter].overlayCount;
        bins[binCenter].normalizedIntensity = bins[binCenter].overlayCount / selectedWells.length;
      }
    });

    return { bins, depthBins };
  }, [selectedWells, depthRange, binSize, selectedDataType]);

  // Generate heatmap trace with intensity overlay
  const generateHeatmapTrace = useMemo(() => {
    const { bins, depthBins } = generateHeatmapData;
    
    // Create intensity values for heatmap
    const intensityValues = depthBins.map(binCenter => {
      const bin = bins[binCenter];
      return bin.intensity || 0;
    });

    // Create overlay count for color intensity
    const overlayIntensity = depthBins.map(binCenter => {
      const bin = bins[binCenter];
      return bin.normalizedIntensity || 0;
    });

    return {
      type: 'heatmap',
      z: [intensityValues],
      y: depthBins,
      x: ['Value'],
      colorscale: [
        [0, '#f0f9ff'],      // Very light blue (no overlap)
        [0.25, '#bae6fd'],   // Light blue (1 well)
        [0.5, '#38bdf8'],    // Medium blue (2 wells)
        [0.75, '#0284c7'],   // Dark blue (3 wells)
        [1, '#0c4a6e']       // Very dark blue (4 wells - max intensity)
      ],
      colorbar: {
        title: 'Intensity<br>(Overlap)',
        titleside: 'right',
        tickmode: 'array',
        tickvals: [0, 0.25, 0.5, 0.75, 1],
        ticktext: ['None', '1 Well', '2 Wells', '3 Wells', '4 Wells']
      },
      hovertemplate: 'Depth: %{y} ft<br>' +
                    `${selectedDataType.label}: %{z:.2f}<br>` +
                    '<extra></extra>',
      showscale: true
    };
  }, [generateHeatmapData, selectedDataType]);

  // Generate boxplot traces for each well
  const generateBoxplotTraces = useMemo(() => {
    const { bins, depthBins } = generateHeatmapData;
    
    return selectedWells.map(well => {
      const wellData = mockWells.find(w => w.value === well.value);
      const values = depthBins.map(binCenter => bins[binCenter].wellData[well.value]);
      
      return {
        type: 'box',
        y: values,
        name: well.label,
        marker: {
          color: wellData?.color || '#3184c2'
        },
        boxmean: 'sd',
        hovertemplate: `<b>${well.label}</b><br>` +
                      `${selectedDataType.label}: %{y:.2f}<br>` +
                      `<extra></extra>`
      };
    });
  }, [generateHeatmapData, selectedWells]);

  // Generate distribution histogram
  const generateHistogramTraces = useMemo(() => {
    const { bins, depthBins } = generateHeatmapData;
    
    return selectedWells.map(well => {
      const wellData = mockWells.find(w => w.value === well.value);
      const values = depthBins.map(binCenter => bins[binCenter].wellData[well.value]);
      
      return {
        type: 'histogram',
        x: values,
        name: well.label,
        opacity: 0.6,
        marker: {
          color: wellData?.color || '#3184c2'
        },
        hovertemplate: `<b>${well.label}</b><br>` +
                      `${selectedDataType.label}: %{x:.2f}<br>` +
                      `Count: %{y}<br>` +
                      `<extra></extra>`
      };
    });
  }, [generateHeatmapData, selectedWells]);

  return (
    <div style={{ 
      padding: '12px', 
      backgroundColor: '#f9fafb',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      <SpaceBetween size="m">
        {/* Header Section - Narrow Width Optimized */}
        <Container
          header={
            <Header
              variant="h1"
              description="Multi-well petrophysical analysis"
              actions={
                <Button variant="primary" iconName="refresh">Refresh</Button>
              }
            >
              Porosity Analysis
            </Header>
          }
        >
          <SpaceBetween size="m">
            {/* Key Metrics - Stacked for narrow width */}
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Wells Analyzed</Box>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0972d3' }}>
                  {selectedWells.length}
                </div>
              </div>
              <div>
                <Box variant="awsui-key-label">Data Quality</Box>
                <StatusIndicator type="success">Excellent</StatusIndicator>
              </div>
            </ColumnLayout>

            {/* Compact Quality Indicators */}
            <div>
              <Box variant="awsui-key-label">Data Completeness</Box>
              <ProgressBar value={96.8} label="96.8%" />
            </div>
          </SpaceBetween>
        </Container>

        {/* Main Content with Tabs */}
        <Tabs
          activeTabId={activeTabId}
          onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              content: (
                <Container>
                  <SpaceBetween size="l">
                    <Alert type="success" header="Analysis Complete">
                      Porosity analysis completed successfully for 4 wells. 
                      High-quality reservoir intervals identified with excellent data coverage.
                    </Alert>

                    <ExpandableSection
                      headerText="Executive Summary"
                      variant="container"
                      defaultExpanded={true}
                    >
                      <SpaceBetween size="m">
                        <div>
                          <Box variant="h3">Key Findings</Box>
                          <ul style={{ marginTop: '8px' }}>
                            <li>Average effective porosity of 15.2% across all wells</li>
                            <li>12 high-quality reservoir intervals identified</li>
                            <li>Excellent data quality with 96.8% completeness</li>
                            <li>Consistent porosity trends across field</li>
                          </ul>
                        </div>

                        <div>
                          <Box variant="h3">Recommendations</Box>
                          <ul style={{ marginTop: '8px' }}>
                            <li>Focus completion efforts on top 5 intervals</li>
                            <li>Consider horizontal drilling in Zone 2</li>
                            <li>Additional core analysis recommended for Well-001</li>
                          </ul>
                        </div>
                      </SpaceBetween>
                    </ExpandableSection>

                    {/* Distribution Charts */}
                    <ColumnLayout columns={2} variant="text-grid">
                      <Container header={<Header variant="h2">Porosity Distribution</Header>}>
                        <div style={{ height: '300px' }}>
                          <Plot
                            data={[
                              {
                                type: 'pie',
                                values: [25, 45, 20, 10],
                                labels: ['Excellent (>18%)', 'Good (12-18%)', 'Fair (8-12%)', 'Poor (<8%)'],
                                marker: {
                                  colors: ['#037f0c', '#0972d3', '#f89256', '#d13212']
                                },
                                textinfo: 'label+percent',
                                hovertemplate: '<b>%{label}</b><br>%{value}%<br>%{percent}<extra></extra>'
                              }
                            ]}
                            layout={{
                              showlegend: false,
                              margin: { t: 20, b: 20, l: 20, r: 20 },
                              autosize: true
                            }}
                            config={{ displayModeBar: false, responsive: true }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      </Container>

                      <Container header={<Header variant="h2">Well Comparison</Header>}>
                        <div style={{ height: '300px' }}>
                          <Plot
                            data={[
                              {
                                type: 'bar',
                                x: ['Well-001', 'Well-002', 'Well-003', 'Well-004'],
                                y: [18.5, 16.2, 14.8, 13.1],
                                marker: {
                                  color: ['#3184c2', '#ec7211', '#5f8727', '#d13212']
                                },
                                hovertemplate: '<b>%{x}</b><br>Avg Porosity: %{y:.1f}%<extra></extra>'
                              }
                            ]}
                            layout={{
                              yaxis: { title: 'Average Porosity (%)' },
                              margin: { t: 20, b: 60, l: 60, r: 20 },
                              autosize: true,
                              showlegend: false
                            }}
                            config={{ displayModeBar: false, responsive: true }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </div>
                      </Container>
                    </ColumnLayout>
                  </SpaceBetween>
                </Container>
              )
            },
            {
              id: 'interactive',
              label: 'Intensity Heatmap',
              content: (
                <Container>
                  <SpaceBetween size="m">
                    {/* Collapsible Controls - Narrow Width Optimized */}
                    <ExpandableSection
                      headerText="Visualization Controls"
                      variant="container"
                      defaultExpanded={showControls}
                      onChange={({ detail }) => setShowControls(detail.expanded)}
                    >
                      <SpaceBetween size="m">
                        <FormField label="Data Type">
                          <Select
                            selectedOption={selectedDataType}
                            onChange={({ detail }) => setSelectedDataType(detail.selectedOption as any)}
                            options={dataTypes}
                          />
                        </FormField>

                        <FormField label="Well Overlay Selection" description="Select wells to overlay - color intensifies where they overlap">
                          <Multiselect
                            selectedOptions={selectedWells}
                            onChange={({ detail }) => setSelectedWells(detail.selectedOptions as any)}
                            options={mockWells}
                            placeholder="Select wells"
                          />
                        </FormField>

                        <FormField label="Bin Size" description="Depth interval for averaging">
                          <Select
                            selectedOption={binSize}
                            onChange={({ detail }) => setBinSize(detail.selectedOption as any)}
                            options={binSizes}
                          />
                        </FormField>

                        <FormField label="Depth Range">
                          <SpaceBetween size="xs">
                            <div>
                              <Box variant="awsui-key-label">Min: {depthRange.min} ft</Box>
                              <input
                                type="range"
                                min="4000"
                                max="7000"
                                step="50"
                                value={depthRange.min}
                                onChange={(e) => setDepthRange({ ...depthRange, min: parseInt(e.target.value) })}
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <Box variant="awsui-key-label">Max: {depthRange.max} ft</Box>
                              <input
                                type="range"
                                min="4000"
                                max="7000"
                                step="50"
                                value={depthRange.max}
                                onChange={(e) => setDepthRange({ ...depthRange, max: parseInt(e.target.value) })}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </SpaceBetween>
                        </FormField>

                        <Box variant="awsui-key-label">Selected Wells ({selectedWells.length})</Box>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {selectedWells.map(well => {
                            const wellData = mockWells.find(w => w.value === well.value);
                            return (
                              <Badge key={well.value} color="blue">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: wellData?.color,
                                      borderRadius: '2px'
                                    }}
                                  />
                                  {well.label}
                                </div>
                              </Badge>
                            );
                          })}
                        </div>
                      </SpaceBetween>
                    </ExpandableSection>

                    {/* Intensity Heatmap - Full Width */}
                    <Container 
                      header={
                        <Header 
                          variant="h2"
                          description="Color intensity increases where wells overlap"
                        >
                          Depth vs {selectedDataType.label} - Intensity Overlay
                        </Header>
                      }
                    >
                      <div style={{ height: '600px', width: '100%' }}>
                        <Plot
                          data={[generateHeatmapTrace]}
                          layout={{
                            yaxis: { 
                              title: 'Depth (ft)',
                              autorange: 'reversed',
                              side: 'left'
                            },
                            xaxis: {
                              visible: false,
                              showticklabels: false
                            },
                            margin: { t: 20, b: 40, l: 80, r: 120 },
                            autosize: true,
                            showlegend: false,
                            hovermode: 'closest'
                          }}
                          config={{ 
                            displayModeBar: true,
                            responsive: true,
                            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                            toImageButtonOptions: {
                              format: 'png',
                              filename: 'intensity_heatmap',
                              height: 800,
                              width: 400
                            }
                          }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    </Container>

                    {/* Boxplot Comparison */}
                    <ExpandableSection
                      headerText="Statistical Distribution by Well"
                      variant="container"
                    >
                      <div style={{ height: '350px', width: '100%' }}>
                        <Plot
                          data={generateBoxplotTraces}
                          layout={{
                            yaxis: { title: selectedDataType.label },
                            xaxis: { title: 'Well' },
                            margin: { t: 20, b: 60, l: 60, r: 20 },
                            autosize: true,
                            showlegend: false
                          }}
                          config={{ displayModeBar: false, responsive: true }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    </ExpandableSection>

                    {/* Histogram Overlay */}
                    <ExpandableSection
                      headerText="Value Distribution Histogram"
                      variant="container"
                    >
                      <div style={{ height: '300px', width: '100%' }}>
                        <Plot
                          data={generateHistogramTraces}
                          layout={{
                            barmode: 'overlay',
                            xaxis: { title: selectedDataType.label },
                            yaxis: { title: 'Frequency' },
                            margin: { t: 20, b: 60, l: 60, r: 20 },
                            autosize: true,
                            showlegend: true,
                            legend: { 
                              orientation: 'h',
                              y: -0.3
                            }
                          }}
                          config={{ displayModeBar: false, responsive: true }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    </ExpandableSection>
                  </SpaceBetween>
                </Container>
              )
            },
            {
              id: 'intervals',
              label: 'Reservoir Intervals',
              content: (
                <Container>
                  <SpaceBetween size="l">
                    <ExpandableSection
                      headerText="Best Reservoir Intervals (Top 5)"
                      variant="container"
                      defaultExpanded={true}
                    >
                      <Cards
                        cardDefinition={{
                          header: item => item.name,
                          sections: [
                            {
                              id: 'depth',
                              header: 'Depth Range',
                              content: item => `${item.topDepth} - ${item.bottomDepth} ft`
                            },
                            {
                              id: 'properties',
                              header: 'Properties',
                              content: item => (
                                <ColumnLayout columns={3} variant="text-grid">
                                  <div>
                                    <Box variant="awsui-key-label">Porosity</Box>
                                    <div>{item.porosity}</div>
                                  </div>
                                  <div>
                                    <Box variant="awsui-key-label">Thickness</Box>
                                    <div>{item.thickness}</div>
                                  </div>
                                  <div>
                                    <Box variant="awsui-key-label">Quality</Box>
                                    <Badge color={item.quality === 'Excellent' ? 'green' : 'blue'}>
                                      {item.quality}
                                    </Badge>
                                  </div>
                                </ColumnLayout>
                              )
                            }
                          ]
                        }}
                        items={[
                          {
                            name: 'Interval #1 - Well-001',
                            topDepth: 5245,
                            bottomDepth: 5268,
                            porosity: '18.5%',
                            thickness: '23 ft',
                            quality: 'Excellent'
                          },
                          {
                            name: 'Interval #2 - Well-002',
                            topDepth: 5312,
                            bottomDepth: 5330,
                            porosity: '17.2%',
                            thickness: '18 ft',
                            quality: 'Excellent'
                          },
                          {
                            name: 'Interval #3 - Well-001',
                            topDepth: 5450,
                            bottomDepth: 5465,
                            porosity: '16.8%',
                            thickness: '15 ft',
                            quality: 'Good'
                          }
                        ]}
                        cardsPerRow={[{ cards: 1 }]}
                      />
                    </ExpandableSection>

                    <ExpandableSection
                      headerText="High-Porosity Zones"
                      variant="container"
                    >
                      <div style={{ height: '400px' }}>
                        <Plot
                          data={[
                            {
                              type: 'scatter',
                              mode: 'markers',
                              x: [5250, 5320, 5455, 5580, 5720],
                              y: [18.5, 17.2, 16.8, 16.1, 15.5],
                              marker: {
                                size: [23, 18, 15, 20, 12],
                                color: [18.5, 17.2, 16.8, 16.1, 15.5],
                                colorscale: 'Viridis',
                                showscale: true,
                                colorbar: {
                                  title: 'Porosity (%)'
                                }
                              },
                              text: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'],
                              hovertemplate: '<b>%{text}</b><br>' +
                                           'Depth: %{x} ft<br>' +
                                           'Porosity: %{y:.1f}%<br>' +
                                           '<extra></extra>'
                            }
                          ]}
                          layout={{
                            xaxis: { title: 'Depth (ft)' },
                            yaxis: { title: 'Average Porosity (%)' },
                            margin: { t: 20, b: 60, l: 60, r: 80 },
                            autosize: true,
                            showlegend: false
                          }}
                          config={{ displayModeBar: false, responsive: true }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    </ExpandableSection>
                  </SpaceBetween>
                </Container>
              )
            },
            {
              id: 'methodology',
              label: 'Methodology',
              content: (
                <Container>
                  <SpaceBetween size="m">
                    <ExpandableSection
                      headerText="Calculation Methods"
                      variant="container"
                      defaultExpanded={true}
                    >
                      <ColumnLayout columns={2} variant="text-grid">
                        <div>
                          <Box variant="h3">Density-Neutron Method</Box>
                          <p>Industry-standard crossplot technique using bulk density and neutron porosity logs.</p>
                          <Box variant="awsui-key-label">Standards</Box>
                          <ul>
                            <li>SPE Best Practices</li>
                            <li>API RP 40</li>
                          </ul>
                        </div>
                        <div>
                          <Box variant="h3">Quality Control</Box>
                          <p>Rigorous QC applied including outlier detection and data validation.</p>
                          <Box variant="awsui-key-label">Metrics</Box>
                          <ul>
                            <li>Data completeness: 96.8%</li>
                            <li>Confidence level: 92%</li>
                          </ul>
                        </div>
                      </ColumnLayout>
                    </ExpandableSection>

                    <ExpandableSection
                      headerText="Assumptions & Limitations"
                      variant="container"
                    >
                      <ColumnLayout columns={2} variant="text-grid">
                        <div>
                          <Box variant="h3">Key Assumptions</Box>
                          <ul>
                            <li>Clean sandstone matrix</li>
                            <li>Fresh formation water</li>
                            <li>Standard temperature/pressure</li>
                          </ul>
                        </div>
                        <div>
                          <Box variant="h3">Limitations</Box>
                          <ul>
                            <li>Limited to logged intervals</li>
                            <li>Assumes homogeneous lithology</li>
                            <li>Core calibration recommended</li>
                          </ul>
                        </div>
                      </ColumnLayout>
                    </ExpandableSection>
                  </SpaceBetween>
                </Container>
              )
            }
          ]}
        />
      </SpaceBetween>
    </div>
  );
}

export default PetrophysicsCloudscapeMockup;
