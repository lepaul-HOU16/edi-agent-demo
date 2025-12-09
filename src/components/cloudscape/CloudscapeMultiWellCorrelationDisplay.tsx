import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Badge from '@cloudscape-design/components/badge';
import ExpandableSection from '@cloudscape-design/components/expandable-section';

interface MultiWellCorrelationProps {
  data: {
    messageContentType: string;
    title?: string;
    subtitle?: string;
    wells: string[];
    correlationData?: {
      normalizedLogs?: {
        gammaRay?: Array<{ wellName: string; normalized: boolean; range: number[]; unit: string }>;
        resistivity?: Array<{ wellName: string; normalized: boolean; range: number[]; unit: string; logScale?: boolean }>;
        porosity?: Array<{ wellName: string; normalized: boolean; range: number[]; unit: string }>;
      };
      correlationLines?: Array<{
        name: string;
        type: string;
        confidence: string;
        wells: Array<{ wellName: string; depth: number }>;
      }>;
      reservoirZones?: Array<{
        name: string;
        topDepth: number;
        bottomDepth: number;
        thickness: number;
        quality: string;
        presentInWells: string[];
      }>;
    };
    statistics?: {
      wellCount: number;
      commonCurves?: string[];
      depthRange?: {
        min: number;
        max: number;
      };
      correlationQuality?: string;
    };
    visualizations?: Array<{
      type: string;
      title: string;
      description: string;
    }>;
    analysisNotes?: {
      methodology?: string;
      correlationMethod?: string;
      confidence?: string;
      recommendations?: string[];
    };
  };
}

export const CloudscapeMultiWellCorrelationDisplay: React.FC<MultiWellCorrelationProps> = ({ data }) => {
  console.log('🔍 CloudscapeMultiWellCorrelationDisplay - Received data:', data);
  console.log('🔍 Wells array:', data.wells);
  console.log('🔍 Statistics:', data.statistics);

  const wellCount = data.wells?.length || data.statistics?.wellCount || 0;
  const wellNames = data.wells || [];

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle || `Geological correlation and log analysis for ${wellCount} wells`}
        >
          🔗 {data.title || 'Multi-Well Correlation Analysis'}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Overview Section */}
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">🎯 Wells Analyzed</Box>
            <Box variant="h1" fontSize="display-l" fontWeight="bold">
              {wellCount}
            </Box>
            <Box variant="p" margin={{ top: 'xs' }}>
              <SpaceBetween size="xs" direction="horizontal">
                {wellNames.map((wellName, index) => (
                  <Badge key={index} color="blue">
                    {wellName}
                  </Badge>
                ))}
              </SpaceBetween>
            </Box>
          </div>

          <div>
            <Box variant="awsui-key-label">📊 Correlation Quality</Box>
            <Box variant="h2" fontSize="heading-l" fontWeight="bold" margin={{ top: 'xs' }}>
              {data.statistics?.correlationQuality || 'Good'}
            </Box>
            {data.statistics?.commonCurves && (
              <Box variant="p" margin={{ top: 'xs' }}>
                <Box variant="small">
                  <strong>Common Curves:</strong> {data.statistics.commonCurves.join(', ')}
                </Box>
              </Box>
            )}
            {data.statistics?.depthRange && (
              <Box variant="p" margin={{ top: 'xs' }}>
                <Box variant="small">
                  <strong>Depth Range:</strong> {data.statistics.depthRange.min}m - {data.statistics.depthRange.max}m
                </Box>
              </Box>
            )}
          </div>
        </ColumnLayout>

        {/* Normalized Logs Section */}
        {data.correlationData?.normalizedLogs && (
          <ExpandableSection headerText="📈 Normalized Log Correlations" defaultExpanded>
            <SpaceBetween size="m">
              {data.correlationData.normalizedLogs.gammaRay && (
                <Container header={<Header variant="h3">Gamma Ray</Header>}>
                  <ColumnLayout columns={3} variant="text-grid">
                    {data.correlationData.normalizedLogs.gammaRay.map((log, index) => (
                      <div key={index}>
                        <Box variant="awsui-key-label">{log.wellName}</Box>
                        <Box variant="p">
                          Range: {log.range[0]} - {log.range[1]} {log.unit}
                        </Box>
                        <Badge color={log.normalized ? 'green' : 'grey'}>
                          {log.normalized ? 'Normalized' : 'Raw'}
                        </Badge>
                      </div>
                    ))}
                  </ColumnLayout>
                </Container>
              )}

              {data.correlationData.normalizedLogs.resistivity && (
                <Container header={<Header variant="h3">Resistivity</Header>}>
                  <ColumnLayout columns={3} variant="text-grid">
                    {data.correlationData.normalizedLogs.resistivity.map((log, index) => (
                      <div key={index}>
                        <Box variant="awsui-key-label">{log.wellName}</Box>
                        <Box variant="p">
                          Range: {log.range[0]} - {log.range[1]} {log.unit}
                        </Box>
                        <SpaceBetween size="xs" direction="horizontal">
                          <Badge color={log.normalized ? 'green' : 'grey'}>
                            {log.normalized ? 'Normalized' : 'Raw'}
                          </Badge>
                          {log.logScale && <Badge>Log Scale</Badge>}
                        </SpaceBetween>
                      </div>
                    ))}
                  </ColumnLayout>
                </Container>
              )}

              {data.correlationData.normalizedLogs.porosity && (
                <Container header={<Header variant="h3">Porosity</Header>}>
                  <ColumnLayout columns={3} variant="text-grid">
                    {data.correlationData.normalizedLogs.porosity.map((log, index) => (
                      <div key={index}>
                        <Box variant="awsui-key-label">{log.wellName}</Box>
                        <Box variant="p">
                          Range: {log.range[0]} - {log.range[1]} {log.unit}
                        </Box>
                        <Badge color={log.normalized ? 'green' : 'grey'}>
                          {log.normalized ? 'Normalized' : 'Raw'}
                        </Badge>
                      </div>
                    ))}
                  </ColumnLayout>
                </Container>
              )}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Correlation Lines Section */}
        {data.correlationData?.correlationLines && data.correlationData.correlationLines.length > 0 && (
          <ExpandableSection headerText="🎯 Geological Correlation Lines" defaultExpanded>
            <SpaceBetween size="m">
              {data.correlationData.correlationLines.map((line, index) => (
                <Container key={index} header={<Header variant="h3">{line.name}</Header>}>
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Type</Box>
                      <Box variant="p">{line.type}</Box>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Confidence</Box>
                      <Badge color={line.confidence === 'high' ? 'green' : line.confidence === 'medium' ? 'blue' : 'grey'}>
                        {line.confidence}
                      </Badge>
                    </div>
                  </ColumnLayout>
                  <Box variant="p" margin={{ top: 's' }}>
                    <Box variant="awsui-key-label">Depths by Well</Box>
                    <ColumnLayout columns={3} variant="text-grid">
                      {line.wells.map((well, wellIndex) => (
                        <Box key={wellIndex} variant="p">
                          <strong>{well.wellName}:</strong> {well.depth.toFixed(1)}m
                        </Box>
                      ))}
                    </ColumnLayout>
                  </Box>
                </Container>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Reservoir Zones Section */}
        {data.correlationData?.reservoirZones && data.correlationData.reservoirZones.length > 0 && (
          <ExpandableSection headerText="⛽ Reservoir Zones" defaultExpanded>
            <SpaceBetween size="m">
              {data.correlationData.reservoirZones.map((zone, index) => (
                <Container 
                  key={index} 
                  header={
                    <Header 
                      variant="h3"
                      actions={
                        <Badge color={zone.quality === 'Good' ? 'green' : zone.quality === 'Fair' ? 'blue' : 'grey'}>
                          {zone.quality}
                        </Badge>
                      }
                    >
                      {zone.name}
                    </Header>
                  }
                >
                  <ColumnLayout columns={3} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Top Depth</Box>
                      <Box variant="p">{zone.topDepth}m</Box>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Bottom Depth</Box>
                      <Box variant="p">{zone.bottomDepth}m</Box>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Thickness</Box>
                      <Box variant="p">{zone.thickness}m</Box>
                    </div>
                  </ColumnLayout>
                  <Box variant="p" margin={{ top: 's' }}>
                    <Box variant="awsui-key-label">Present in Wells</Box>
                    <SpaceBetween size="xs" direction="horizontal">
                      {zone.presentInWells.map((well, wellIndex) => (
                        <Badge key={wellIndex} color="blue">
                          {well}
                        </Badge>
                      ))}
                    </SpaceBetween>
                  </Box>
                </Container>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Visualizations Section */}
        {/* {data.visualizations && data.visualizations.length > 0 && (
          <ExpandableSection headerText="📊 Available Visualizations">
            <SpaceBetween size="s">
              {data.visualizations.map((viz, index) => (
                <Container key={index}>
                  <Box variant="h4">{viz.title}</Box>
                  <Box variant="p" color="text-body-secondary">
                    {viz.description}
                  </Box>
                </Container>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )} */}

        {/* Analysis Notes Section */}
        {data.analysisNotes && (
          <ExpandableSection headerText="📝 Analysis Notes">
            <SpaceBetween size="m">
              {data.analysisNotes.methodology && (
                <div>
                  <Box variant="awsui-key-label">Methodology</Box>
                  <Box variant="p">{data.analysisNotes.methodology}</Box>
                </div>
              )}
              {data.analysisNotes.correlationMethod && (
                <div>
                  <Box variant="awsui-key-label">Correlation Method</Box>
                  <Box variant="p">{data.analysisNotes.correlationMethod}</Box>
                </div>
              )}
              {data.analysisNotes.confidence && (
                <div>
                  <Box variant="awsui-key-label">Confidence</Box>
                  <Box variant="p">{data.analysisNotes.confidence}</Box>
                </div>
              )}
              {data.analysisNotes.recommendations && data.analysisNotes.recommendations.length > 0 && (
                <div>
                  <Box variant="awsui-key-label">Recommendations</Box>
                  <SpaceBetween size="xs">
                    {data.analysisNotes.recommendations.map((rec, index) => (
                      <Box key={index} variant="p">
                        • {rec}
                      </Box>
                    ))}
                  </SpaceBetween>
                </div>
              )}
            </SpaceBetween>
          </ExpandableSection>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default React.memo(CloudscapeMultiWellCorrelationDisplay);
