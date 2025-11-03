import React from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface MultiWellCorrelationProps {
  data: {
    messageContentType: string;
    executiveSummary?: {
      title: string;
      wellsAnalyzed: number;
      overallAssessment: string;
      keyFindings: string[];
    };
    analysisType?: string;
    results?: {
      correlationPanel?: {
        wellNames: string[];
        logTypes: string[];
        normalizationMethod: string;
        correlationQuality: string;
        geologicalMarkers?: Array<{
          name: string;
          confidence: string;
          wells: number;
        }>;
      };
      reservoirZones?: Array<{
        name: string;
        wells: string[];
        averageThickness: string;
        netToGross: string;
        quality: string;
        developmentPotential: string;
      }>;
      statisticalAnalysis?: {
        correlationCoefficients?: { [key: string]: string };
        qualityMetrics?: {
          overallCorrelation: string;
          confidenceLevel: string;
          geologicalConsistency: string;
        };
      };
      interactiveVisualization?: {
        features: string[];
        presentationReady: boolean;
        technicalDocumentation?: {
          methodology: string;
          qualityControl: string;
          industryCompliance: string[];
        };
      };
    };
    developmentStrategy?: {
      primaryTargets: string[];
      correlatedIntervals: string;
      completionStrategy: string;
      economicViability: string;
    };
  };
}

export const MultiWellCorrelationComponent: React.FC<MultiWellCorrelationProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        width: '100%',
        mt: 2, 
        mb: 2,
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
        border: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
      }}
    >
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ color: theme.palette.primary.main, mb: 3 }}>
          🔗 Multi-Well Correlation Analysis
        </Typography>
        
        {/* Executive Summary */}
        {data.executiveSummary && (
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f7ff' }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
              📋 {data.executiveSummary.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {data.executiveSummary.overallAssessment}
            </Typography>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Key Findings:
            </Typography>
            <List dense>
              {data.executiveSummary.keyFindings?.map((finding, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={`• ${finding}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Wells Overview */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffffff' }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.secondary.main }}>
                🎯 Wells Analyzed
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                {data.executiveSummary?.wellsAnalyzed || data.results?.correlationPanel?.wellNames?.length || 0}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {data.results?.correlationPanel?.wellNames?.map((wellName, index) => (
                  <Chip 
                    key={index}
                    label={wellName}
                    size="small"
                    variant="outlined"
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#ffffff',
                      color: theme.palette.text.primary,
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Correlation Quality */}
          {data.results?.correlationPanel && (
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffffff' }}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.secondary.main }}>
                  📊 Correlation Quality
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Method:</strong> {data.results.correlationPanel.normalizationMethod}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Log Types:</strong> {data.results.correlationPanel.logTypes?.join(', ')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Correlation Quality:</strong> {data.results.correlationPanel.correlationQuality}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Reservoir Zones */}
        {data.results?.reservoirZones && Array.isArray(data.results.reservoirZones) && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                ⛽ Reservoir Zones ({data.results.reservoirZones.length} Total)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {data.results.reservoirZones.map((zone, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9',
                        border: `2px solid ${zone.developmentPotential === 'High' ? theme.palette.success.main : 
                               zone.developmentPotential === 'Moderate' ? theme.palette.warning.main : 
                               theme.palette.info.main}`
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {zone.name}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Potential:</strong> {zone.developmentPotential}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Thickness:</strong> {zone.averageThickness}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Net/Gross:</strong> {zone.netToGross}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Quality:</strong> {zone.quality}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Statistical Analysis */}
        {data.results?.statisticalAnalysis && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                📊 Statistical Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {data.results.statisticalAnalysis.qualityMetrics && (
                <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Quality Metrics:
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Overall Correlation:</strong> {data.results.statisticalAnalysis.qualityMetrics.overallCorrelation}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Confidence Level:</strong> {data.results.statisticalAnalysis.qualityMetrics.confidenceLevel}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Geological Consistency:</strong> {data.results.statisticalAnalysis.qualityMetrics.geologicalConsistency}
                  </Typography>
                </Paper>
              )}
              {data.results.statisticalAnalysis.correlationCoefficients && (
                <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Correlation Coefficients:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(data.results.statisticalAnalysis.correlationCoefficients).map(([well, coefficient]) => (
                      <Grid item xs={6} md={3} key={well}>
                        <Chip
                          label={`${well}: ${coefficient}`}
                          size="small"
                          variant="filled"
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Development Strategy */}
        {data.developmentStrategy && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                🚀 Development Strategy
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                <strong>Correlated Intervals:</strong> {data.developmentStrategy.correlatedIntervals}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Completion Strategy:</strong> {data.developmentStrategy.completionStrategy}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Economic Viability:</strong> {data.developmentStrategy.economicViability}
              </Typography>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Primary Targets:
              </Typography>
              <List dense>
                {data.developmentStrategy.primaryTargets?.map((target, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`• ${target}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

// Memoize to prevent re-renders when parent re-renders
export default React.memo(MultiWellCorrelationComponent);
