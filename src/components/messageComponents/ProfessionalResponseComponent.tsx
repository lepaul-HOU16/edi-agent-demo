import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

interface ProfessionalResponseProps {
  content: any;
  theme: any;
  chatSessionId?: string;
}

interface ProfessionalData {
  responseType: string;
  calculationType: string;
  wellName: string;
  method: string;
  executiveSummary: {
    overview: string;
    keyFindings: string[];
    recommendations: string[];
    qualityRating: string;
  };
  results: {
    primaryValue: number;
    unit: string;
    confidenceLevel: string;
    statistics: {
      mean: number;
      median: number;
      standardDeviation: number;
      minimum: number;
      maximum: number;
      count: number;
    };
  };
  methodology: {
    method: string;
    description: string;
    industryStandards: string[];
    assumptions: string[];
    limitations: string[];
    references: string[];
  };
  qualityMetrics: {
    dataQuality: string;
    calculationAccuracy: string;
    industryCompliance: string;
    uncertaintyLevel: string;
  };
  technicalDocumentation: {
    parameters: Array<{
      name: string;
      value: any;
      unit?: string;
      description: string;
    }>;
    calculations: Array<{
      step: string;
      formula?: string;
      result: any;
    }>;
  };
}

const ProfessionalResponseComponent: React.FC<ProfessionalResponseProps> = ({ 
  content, 
  theme, 
  chatSessionId 
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    executiveSummary: true,
    results: true,
    methodology: false,
    qualityMetrics: false,
    technicalDocumentation: false
  });

  // Parse professional response data
  let professionalData: ProfessionalData | null = null;
  try {
    const messageText = content?.text || '';
    if (messageText.trim().startsWith('{')) {
      professionalData = JSON.parse(messageText);
    }
  } catch (e) {
    console.error('Failed to parse professional response:', e);
  }

  if (!professionalData) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to parse professional response data
      </Alert>
    );
  }

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getQualityIcon = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return <CheckCircleIcon color="success" />;
      case 'good':
        return <VerifiedIcon color="primary" />;
      case 'fair':
        return <WarningIcon color="warning" />;
      case 'poor':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getQualityColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', mb: 2 }}>
      {/* Header with well name and calculation type */}
      <Card elevation={3} sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <ScienceIcon color="primary" />
              <Typography variant="h6" component="h3">
                {professionalData.calculationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis
              </Typography>
              <Chip 
                label={professionalData.wellName} 
                variant="outlined" 
                color="primary" 
                size="small"
              />
              <Chip 
                label={professionalData.method.replace(/_/g, ' ')} 
                variant="outlined" 
                size="small"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {getQualityIcon(professionalData.executiveSummary.qualityRating)}
              <Chip 
                label={professionalData.executiveSummary.qualityRating} 
                color={getQualityColor(professionalData.executiveSummary.qualityRating) as any}
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Accordion 
        expanded={expandedSections.executiveSummary}
        onChange={() => handleSectionToggle('executiveSummary')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <AssessmentIcon color="primary" />
            <Typography variant="h6">Executive Summary</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>{professionalData.executiveSummary.overview}</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Key Findings
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {professionalData.executiveSummary.keyFindings.map((finding, index) => (
                  <Typography component="li" key={index} variant="body2" paragraph>
                    {finding}
                  </Typography>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Recommendations
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {professionalData.executiveSummary.recommendations.map((rec, index) => (
                  <Typography component="li" key={index} variant="body2" paragraph>
                    {rec}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Results */}
      <Accordion 
        expanded={expandedSections.results}
        onChange={() => handleSectionToggle('results')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <TimelineIcon color="primary" />
            <Typography variant="h6">Calculation Results</Typography>
            <Chip 
              label={`${professionalData.results.primaryValue.toFixed(3)} ${professionalData.results.unit}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Typography variant="h4" color="primary" align="center" gutterBottom>
                  {professionalData.results.primaryValue.toFixed(3)}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  {professionalData.results.unit} ({professionalData.results.confidenceLevel} confidence)
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Statistic</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Mean</TableCell>
                      <TableCell align="right">{professionalData.results.statistics.mean.toFixed(3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Median</TableCell>
                      <TableCell align="right">{professionalData.results.statistics.median.toFixed(3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Std Dev</TableCell>
                      <TableCell align="right">{professionalData.results.statistics.standardDeviation.toFixed(3)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Range</TableCell>
                      <TableCell align="right">
                        {professionalData.results.statistics.minimum.toFixed(3)} - {professionalData.results.statistics.maximum.toFixed(3)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Count</TableCell>
                      <TableCell align="right">{professionalData.results.statistics.count}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Quality Metrics */}
      <Accordion 
        expanded={expandedSections.qualityMetrics}
        onChange={() => handleSectionToggle('qualityMetrics')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <VerifiedIcon color="primary" />
            <Typography variant="h6">Quality Metrics</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {Object.entries(professionalData.qualityMetrics).map(([key, value]) => (
              <Grid item xs={6} sm={3} key={key}>
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Chip 
                    label={value}
                    color={getQualityColor(value) as any}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Methodology */}
      <Accordion 
        expanded={expandedSections.methodology}
        onChange={() => handleSectionToggle('methodology')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScienceIcon color="primary" />
            <Typography variant="h6">Methodology & Standards</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            {professionalData.methodology.description}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Industry Standards
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {professionalData.methodology.industryStandards.map((standard, index) => (
                  <Typography component="li" key={index} variant="body2">
                    {standard}
                  </Typography>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Key Assumptions
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {professionalData.methodology.assumptions.map((assumption, index) => (
                  <Typography component="li" key={index} variant="body2">
                    {assumption}
                  </Typography>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Limitations
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {professionalData.methodology.limitations.map((limitation, index) => (
                  <Typography component="li" key={index} variant="body2">
                    {limitation}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Technical Documentation */}
      <Accordion 
        expanded={expandedSections.technicalDocumentation}
        onChange={() => handleSectionToggle('technicalDocumentation')}
        elevation={2}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6">Technical Documentation</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Parameters
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parameter</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {professionalData.technicalDocumentation.parameters.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {param.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {typeof param.value === 'number' ? param.value.toFixed(3) : param.value}
                            {param.unit && ` ${param.unit}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {param.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Calculation Steps
              </Typography>
              <Box>
                {professionalData.technicalDocumentation.calculations.map((calc, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      Step {index + 1}: {calc.step}
                    </Typography>
                    {calc.formula && (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 0.5 }} gutterBottom>
                        {calc.formula}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Result: {typeof calc.result === 'number' ? calc.result.toFixed(3) : calc.result}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ProfessionalResponseComponent;
