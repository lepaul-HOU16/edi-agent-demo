/**
 * Interactive Educational Component - Professional Material-UI Design
 * Provides interactive educational content with workflow steppers and expandable sections
 * Uses Material-UI design system to match other professional tools
 */

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Schedule,
  Warning,
  Error,
  School,
  Science,
  Assignment,
  FlashOn,
  TrendingUp,
  Info
} from '@mui/icons-material';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  content: string;
  duration?: string;
  criticality?: string;
  details?: {
    tools?: string[];
    inputs?: string[];
    outputs?: string[];
    formula?: string;
  };
}

interface MethodComparison {
  name: string;
  formula: string;
  advantages: string[];
  disadvantages: string[];
  bestFor: string[];
  accuracy?: string;
  complexity?: string;
}

interface InteractiveEducationalData {
  messageContentType: 'interactive_educational';
  title: string;
  subtitle?: string;
  type: 'workflow_stepper' | 'method_comparison' | 'concept_explainer' | 'troubleshooting_guide';
  overview?: string;
  steps?: WorkflowStep[];
  methods?: MethodComparison[];
  concepts?: any[];
  keyPoints?: string[];
  examples?: string[];
  nextSteps?: string[];
}

interface InteractiveEducationalComponentProps {
  data: InteractiveEducationalData;
}

// Get criticality icon and color
const getCriticalityConfig = (criticality: string) => {
  switch (criticality?.toLowerCase()) {
    case 'critical':
      return { icon: Error, color: '#F44336', bgColor: '#FFEBEE', label: 'Critical' };
    case 'high':
      return { icon: Warning, color: '#FF9800', bgColor: '#FFF3E0', label: 'High' };
    case 'medium':
      return { icon: Info, color: '#2196F3', bgColor: '#E3F2FD', label: 'Medium' };
    default:
      return { icon: CheckCircle, color: '#4CAF50', bgColor: '#E8F5E8', label: 'Standard' };
  }
};

// Professional workflow stepper component
const WorkflowStepper: React.FC<{ steps: WorkflowStep[], overview?: string }> = ({ steps, overview }) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Executive Header */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #E3F2FD 0%, #E8F5E8 100%)',
        border: '2px solid #2196F3',
        borderLeft: '6px solid #2196F3',
        mb: 3
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <School sx={{ color: '#2196F3', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              📋 Interactive Workflow Guide
            </Typography>
            <Chip 
              label={`${steps.length} Steps`}
              color="primary"
              variant="filled"
              size="small"
            />
          </Stack>

          {overview && (
            <Box sx={{ mt: 2 }}>
              <Button
                onClick={() => setShowOverview(!showOverview)}
                startIcon={showOverview ? <ExpandMore /> : <ChevronRight />}
                variant="text"
                color="primary"
                sx={{ mb: showOverview ? 2 : 0 }}
              >
                🎯 Overview
              </Button>
              {showOverview && (
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#E3F2FD',
                    borderLeft: '4px solid #2196F3'
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    {overview}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Interactive Workflow Steps */}
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {steps.map((step, index) => {
            const criticalityConfig = getCriticalityConfig(step.criticality || '');
            const CriticalityIcon = criticalityConfig.icon;
            const isExpanded = expandedStep === step.id;

            return (
              <Accordion 
                key={step.id}
                expanded={isExpanded}
                onChange={() => setExpandedStep(isExpanded ? null : step.id)}
                sx={{ 
                  boxShadow: 'none',
                  '&:not(:last-child)': {
                    borderBottom: 0,
                  },
                  '&::before': {
                    display: 'none',
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      {/* Step Number */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: criticalityConfig.bgColor,
                          border: `2px solid ${criticalityConfig.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold" sx={{ color: criticalityConfig.color }}>
                          {index + 1}
                        </Typography>
                      </Box>

                      {/* Step Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight="semibold" sx={{ mb: 0.5 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {step.description}
                        </Typography>
                        
                        {/* Step Metadata */}
                        <Stack direction="row" spacing={1} alignItems="center">
                          {step.duration && (
                            <Chip
                              icon={<Schedule sx={{ fontSize: 14 }} />}
                              label={step.duration}
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                          )}
                          <Chip
                            icon={<CriticalityIcon sx={{ fontSize: 14 }} />}
                            label={criticalityConfig.label}
                            size="small"
                            sx={{ 
                              backgroundColor: criticalityConfig.bgColor,
                              color: criticalityConfig.color,
                              border: `1px solid ${criticalityConfig.color}`
                            }}
                          />
                        </Stack>
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Stack spacing={3}>
                    {/* Step Content */}
                    <Paper 
                      sx={{ 
                        p: 2, 
                        backgroundColor: '#F5F5F5',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {step.content}
                      </Typography>
                    </Paper>

                    {/* Step Details - Even Distribution */}
                    {step.details && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Calculate available sections for even distribution */}
                        <Box sx={{ 
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          gap: 2,
                          width: '100%'
                        }}>
                          {step.details.inputs && (
                            <Paper 
                              sx={{ 
                                flex: 1,
                                p: 2, 
                                backgroundColor: '#E8F5E8',
                                borderLeft: '4px solid #4CAF50',
                                borderRadius: 1,
                                minHeight: 120
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#2E7D32' }}>
                                📥 Inputs
                              </Typography>
                              <Stack spacing={0.5}>
                                {step.details.inputs.map((input, i) => (
                                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                      width: 6, 
                                      height: 6, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#4CAF50'
                                    }} />
                                    <Typography variant="body2" color="text.primary">
                                      {input}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Paper>
                          )}

                          {step.details.tools && (
                            <Paper 
                              sx={{ 
                                flex: 1,
                                p: 2, 
                                backgroundColor: '#E3F2FD',
                                borderLeft: '4px solid #2196F3',
                                borderRadius: 1,
                                minHeight: 120
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#1565C0' }}>
                                🔧 Tools
                              </Typography>
                              <Stack spacing={0.5}>
                                {step.details.tools.map((tool, i) => (
                                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                      width: 6, 
                                      height: 6, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#2196F3'
                                    }} />
                                    <Typography variant="body2" color="text.primary">
                                      {tool}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Paper>
                          )}

                          {step.details.outputs && (
                            <Paper 
                              sx={{ 
                                flex: 1,
                                p: 2, 
                                backgroundColor: '#F3E5F5',
                                borderLeft: '4px solid #9C27B0',
                                borderRadius: 1,
                                minHeight: 120
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#6A1B9A' }}>
                                📤 Outputs
                              </Typography>
                              <Stack spacing={0.5}>
                                {step.details.outputs.map((output, i) => (
                                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                      width: 6, 
                                      height: 6, 
                                      borderRadius: '50%', 
                                      backgroundColor: '#9C27B0'
                                    }} />
                                    <Typography variant="body2" color="text.primary">
                                      {output}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Paper>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Formula Display */}
                    {step.details?.formula && (
                      <Paper 
                        sx={{ 
                          p: 2, 
                          backgroundColor: '#FFF8E1',
                          borderLeft: '4px solid #FF9800',
                          borderRadius: 1,
                          width: '100%'
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#F57C00' }}>
                          🧮 Formula
                        </Typography>
                        <Paper
                          sx={{ 
                            p: 1.5, 
                            backgroundColor: '#FFF',
                            fontFamily: 'monospace',
                            border: '1px solid #FFB74D',
                            width: '100%'
                          }}
                        >
                          <Typography variant="body2" component="code" sx={{ color: '#E65100' }}>
                            {step.details.formula}
                          </Typography>
                        </Paper>
                      </Paper>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
};

// Professional method comparison component
const MethodComparison: React.FC<{ methods: MethodComparison[] }> = ({ methods }) => {
  const [selectedMethod, setSelectedMethod] = useState(0);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header Card */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
        border: '2px solid #2196F3',
        borderLeft: '6px solid #2196F3',
        mb: 3
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Science sx={{ color: '#2196F3', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              ⚖️ Method Comparison
            </Typography>
            <Chip 
              label={`${methods.length} Methods`}
              color="secondary"
              variant="filled"
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Method Selection */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}>
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 2 }}>
            {methods.map((method, index) => (
              <Button
                key={index}
                onClick={() => setSelectedMethod(index)}
                variant={selectedMethod === index ? "contained" : "outlined"}
                color="primary"
                sx={{ 
                  minWidth: 120,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {method.name}
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Method Details */}
      {methods[selectedMethod] && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              {methods[selectedMethod].name} Method
            </Typography>

            <Grid container spacing={3}>
              {/* Formula */}
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#F5F5F5',
                    border: '1px solid #E0E0E0',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    📐 Formula
                  </Typography>
                  <Paper
                    sx={{ 
                      p: 1.5, 
                      backgroundColor: '#FFF',
                      fontFamily: 'monospace',
                      border: '1px solid #BDBDBD'
                    }}
                  >
                    <Typography variant="body1" component="code" color="primary">
                      {methods[selectedMethod].formula}
                    </Typography>
                  </Paper>
                </Paper>
              </Grid>

              {/* Advantages & Disadvantages */}
              <Grid item xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#E8F5E8',
                    borderLeft: '4px solid #4CAF50',
                    borderRadius: 1,
                    height: '100%'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#2E7D32' }}>
                    ✅ Advantages
                  </Typography>
                  <Stack spacing={1}>
                    {methods[selectedMethod].advantages.map((advantage, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <CheckCircle sx={{ color: '#4CAF50', fontSize: 16, mt: 0.5 }} />
                        <Typography variant="body2" color="text.primary">
                          {advantage}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#FFEBEE',
                    borderLeft: '4px solid #F44336',
                    borderRadius: 1,
                    height: '100%'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#C62828' }}>
                    ⚠️ Limitations
                  </Typography>
                  <Stack spacing={1}>
                    {methods[selectedMethod].disadvantages.map((disadvantage, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Warning sx={{ color: '#F44336', fontSize: 16, mt: 0.5 }} />
                        <Typography variant="body2" color="text.primary">
                          {disadvantage}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Best Used For */}
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#E3F2FD',
                    borderLeft: '4px solid #2196F3',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: '#1565C0' }}>
                    🎯 Best Used For
                  </Typography>
                  <Stack spacing={1}>
                    {methods[selectedMethod].bestFor.map((use, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <TrendingUp sx={{ color: '#2196F3', fontSize: 16, mt: 0.5 }} />
                        <Typography variant="body2" color="text.primary">
                          {use}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Accuracy & Complexity Metrics */}
              {(methods[selectedMethod].accuracy || methods[selectedMethod].complexity) && (
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    {methods[selectedMethod].accuracy && (
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#FFF8E1' }}>
                          <Typography variant="h4" fontWeight="bold" color="primary">
                            {methods[selectedMethod].accuracy}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📊 Accuracy Rating
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {methods[selectedMethod].complexity && (
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#F3E5F5' }}>
                          <Typography variant="h4" fontWeight="bold" color="secondary">
                            {methods[selectedMethod].complexity}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            🔧 Complexity Level
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Professional concept explainer component
const ConceptExplainer: React.FC<{ data: InteractiveEducationalData }> = ({ data }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    { id: 'overview', title: '🎯 Overview', content: data.overview, icon: Info },
    { id: 'key-points', title: '💡 Key Points', content: data.keyPoints, icon: FlashOn },
    { id: 'examples', title: '📝 Examples', content: data.examples, icon: Assignment },
    { id: 'next-steps', title: '🚀 Next Steps', content: data.nextSteps, icon: PlayCircle }
  ].filter(section => section.content);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Header Card */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, #E3F2FD 0%, #FFF8E1 100%)',
        border: '2px solid #2196F3',
        borderLeft: '6px solid #2196F3',
        mb: 3
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <School sx={{ color: '#2196F3', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {data.title}
              </Typography>
              {data.subtitle && (
                <Typography variant="subtitle1" color="text.secondary">
                  {data.subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          {sections.map((section, index) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <Accordion 
                key={section.id}
                expanded={isExpanded}
                onChange={() => setExpandedSection(isExpanded ? null : section.id)}
                sx={{ 
                  boxShadow: 'none',
                  '&:not(:last-child)': {
                    borderBottom: 0,
                  },
                  '&::before': {
                    display: 'none',
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SectionIcon color="primary" />
                    <Typography variant="h6" fontWeight="semibold">
                      {section.title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#F5F5F5',
                      borderRadius: 2
                    }}
                  >
                    {Array.isArray(section.content) ? (
                      <Stack spacing={1}>
                        {section.content.map((item, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              backgroundColor: 'primary.main',
                              mt: 1
                            }} />
                            <Typography variant="body2" color="text.primary">
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {section.content}
                      </Typography>
                    )}
                  </Paper>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
};

// Main component
const InteractiveEducationalComponent: React.FC<InteractiveEducationalComponentProps> = ({ data }) => {
  switch (data.type) {
    case 'workflow_stepper':
      return <WorkflowStepper steps={data.steps || []} overview={data.overview} />;
    
    case 'method_comparison':
      return <MethodComparison methods={data.methods || []} />;
    
    case 'concept_explainer':
    case 'troubleshooting_guide':
      return <ConceptExplainer data={data} />;
    
    default:
      return (
        <Box sx={{ width: '100%', p: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <School color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {data.title}
                  </Typography>
                  {data.subtitle && (
                    <Typography variant="body2" color="text.secondary">
                      {data.subtitle}
                    </Typography>
                  )}
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Interactive educational component for: {data.type}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      );
  }
};

export default InteractiveEducationalComponent;
