/**
 * Universal Response Component - Professional Material-UI Design
 * Provides visual treatment for ALL response types using Material-UI design system
 * Eliminates plain text responses and maximizes visual data processing efficiency
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore,
  School,
  Science,
  Info,
  CheckCircle,
  Warning,
  Error,
  Lightbulb,
  Calculate,
  TrendingUp,
  Psychology,
  MenuBook,
  Assignment,
  QuestionAnswer,
  Help,
  PlayCircle,
  FiberManualRecord
} from '@mui/icons-material';

// Universal response data structure
interface UniversalResponseData {
  messageContentType: 'concept_definition' | 'general_knowledge' | 'quick_answer' | 'error_response' | 'guidance_response';
  title: string;
  subtitle?: string;
  category?: 'concept' | 'process' | 'method' | 'guidance' | 'error';
  definition?: string;
  formula?: string;
  keyPoints?: string[];
  examples?: string[];
  applications?: string[];
  relatedConcepts?: string[];
  nextSteps?: string[];
  tips?: string[];
  warnings?: string[];
  references?: string[];
  visualElements?: {
    icon?: string;
    color?: string;
    bgColor?: string;
  };
}

interface UniversalResponseComponentProps {
  data: UniversalResponseData;
}

// Get category configuration for styling
const getCategoryConfig = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'concept':
      return { 
        icon: Psychology, 
        color: '#2196F3', 
        bgColor: '#E3F2FD', 
        label: 'Concept',
        gradient: 'linear-gradient(135deg, #E3F2FD 0%, #E8F5E8 100%)'
      };
    case 'process':
      return { 
        icon: Science, 
        color: '#4CAF50', 
        bgColor: '#E8F5E8', 
        label: 'Process',
        gradient: 'linear-gradient(135deg, #E8F5E8 0%, #E3F2FD 100%)'
      };
    case 'method':
      return { 
        icon: Calculate, 
        color: '#FF9800', 
        bgColor: '#FFF3E0', 
        label: 'Method',
        gradient: 'linear-gradient(135deg, #FFF3E0 0%, #F3E5F5 100%)'
      };
    case 'guidance':
      return { 
        icon: Help, 
        color: '#9C27B0', 
        bgColor: '#F3E5F5', 
        label: 'Guidance',
        gradient: 'linear-gradient(135deg, #F3E5F5 0%, #FFF8E1 100%)'
      };
    case 'error':
      return { 
        icon: Error, 
        color: '#F44336', 
        bgColor: '#FFEBEE', 
        label: 'Notice',
        gradient: 'linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 100%)'
      };
    default:
      return { 
        icon: Info, 
        color: '#2196F3', 
        bgColor: '#E3F2FD', 
        label: 'Information',
        gradient: 'linear-gradient(135deg, #E3F2FD 0%, #E8F5E8 100%)'
      };
  }
};

// Concept Definition Component
const ConceptDefinitionResponse: React.FC<{ data: UniversalResponseData }> = ({ data }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('definition');
  const categoryConfig = getCategoryConfig(data.category || 'concept');
  const CategoryIcon = categoryConfig.icon;

  const sections = [
    { id: 'definition', title: '📖 Definition', content: data.definition, icon: MenuBook },
    { id: 'key-points', title: '💡 Key Points', content: data.keyPoints, icon: Lightbulb },
    { id: 'formula', title: '🧮 Formula', content: data.formula, icon: Calculate },
    { id: 'examples', title: '📝 Examples', content: data.examples, icon: Assignment },
    { id: 'applications', title: '🎯 Applications', content: data.applications, icon: TrendingUp },
    { id: 'related', title: '🔗 Related Concepts', content: data.relatedConcepts, icon: School }
  ].filter(section => section.content);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        flex: '1',
        marginBottom: '0', // Remove bottom margin from first column
        minWidth: 0
      }}>
        <div style={{ 
          display: 'table', 
          alignItems: 'flex-start', 
          gap: '40px',
          width: '100%',
          height: '100%',
          marginBottom: '0' // Remove bottom margin from header
        }}>

        {/* Professional Header */}
        <Card sx={{ 
          display: 'table-cell',
          background: categoryConfig.gradient,
          border: `2px solid ${categoryConfig.color}`,
          borderLeft: `6px solid ${categoryConfig.color}`,
        }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CategoryIcon sx={{ color: categoryConfig.color, fontSize: 36 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {data.title}
                </Typography>
                {data.subtitle && (
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                    {data.subtitle}
                  </Typography>
                )}
                <Chip 
                  label={categoryConfig.label}
                  size="small"
                  sx={{ 
                    mt: 1,
                    backgroundColor: categoryConfig.bgColor,
                    color: categoryConfig.color,
                    border: `1px solid ${categoryConfig.color}`
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card> 

        {/* Content Sections */}
        <Card variant="outlined" sx={{display: 'table-cell',}}>
          <CardContent sx={{ p: 0 }}>
            {sections.map((section) => {
              const SectionIcon = section.icon;
              const isExpanded = expandedSection === section.id;

              return (
                <Accordion 
                  key={section.id}
                  expanded={isExpanded}
                  onChange={() => setExpandedSection(isExpanded ? null : section.id)}
                  sx={{ 
                    boxShadow: 'none',
                    '&:not(:last-child)': { borderBottom: 0 },
                    '&::before': { display: 'none' }
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
                    {section.id === 'formula' && typeof section.content === 'string' ? (
                      <Paper 
                        sx={{ 
                          p: 2, 
                          backgroundColor: '#FFF8E1',
                          borderLeft: '4px solid #FF9800',
                          borderRadius: 1
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#F57C00' }}>
                          Mathematical Formula
                        </Typography>
                        <Paper
                          sx={{ 
                            p: 2, 
                            backgroundColor: '#FFF',
                            fontFamily: 'monospace',
                            border: '1px solid #FFB74D',
                            fontSize: '1.1em'
                          }}
                        >
                          <Typography variant="body1" component="code" sx={{ color: '#E65100' }}>
                            {section.content}
                          </Typography>
                        </Paper>
                      </Paper>
                    ) : Array.isArray(section.content) ? (
                      <Stack spacing={1}>
                        {section.content.map((item, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <FiberManualRecord 
                              sx={{ 
                                color: categoryConfig.color, 
                                fontSize: 8, 
                                mt: 1
                              }} 
                            />
                            <Typography variant="body1" color="text.primary">
                              {item}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Paper 
                        sx={{ 
                          p: 2.5, 
                          backgroundColor: '#F5F5F5',
                          borderRadius: 2,
                          borderLeft: `4px solid ${categoryConfig.color}`
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {section.content}
                        </Typography>
                      </Paper>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </CardContent>
        </Card>

        {/* Additional Action Items */}
        {data.nextSteps && data.nextSteps.length > 0 && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlayCircle color="primary" />
                🚀 Next Steps
              </Typography>
              <Stack spacing={1}>
                {data.nextSteps.map((step, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircle sx={{ color: '#4CAF50', fontSize: 18 }} />
                    <Typography variant="body2" color="text.primary">
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        </div>
      </div>




      
    </Box>
  );
};

// General Knowledge Response Component  
const GeneralKnowledgeResponse: React.FC<{ data: UniversalResponseData }> = ({ data }) => {
  const categoryConfig = getCategoryConfig(data.category || 'general');
  const CategoryIcon = categoryConfig.icon;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
        {/* Professional Header */}
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: categoryConfig.gradient,
          border: `2px solid ${categoryConfig.color}`,
          borderLeft: `6px solid ${categoryConfig.color}`,
        }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CategoryIcon sx={{ color: categoryConfig.color, fontSize: 32 }} />
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

      {/* Main Content */}
      <Card variant="outlined">
        <CardContent>
          {data.definition && (
            <Paper 
              sx={{ 
                p: 2.5, 
                backgroundColor: categoryConfig.bgColor,
                borderLeft: `4px solid ${categoryConfig.color}`,
                borderRadius: 1,
                mb: 2
              }}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.6, fontSize: '1.1em' }}>
                {data.definition}
              </Typography>
            </Paper>
          )}

          {/* Key Points Grid */}
          {data.keyPoints && data.keyPoints.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb color="warning" />
                💡 Key Points
              </Typography>
              <Grid container spacing={1}>
                {data.keyPoints.map((point, i) => (
                  <Grid item xs={12} md={6} key={i}>
                    <Paper 
                      sx={{ 
                        p: 1.5, 
                        backgroundColor: '#F5F5F5',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1
                      }}
                    >
                      <CheckCircle sx={{ color: '#4CAF50', fontSize: 16, mt: 0.5 }} />
                      <Typography variant="body2" color="text.primary">
                        {point}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Formula Display */}
          {data.formula && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calculate color="warning" />
                🧮 Formula
              </Typography>
              <Paper
                sx={{ 
                  p: 2, 
                  backgroundColor: '#FFF8E1',
                  border: '1px solid #FFB74D',
                  fontFamily: 'monospace',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h6" component="code" sx={{ color: '#E65100' }}>
                  {data.formula}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Examples */}
          {data.examples && data.examples.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment color="info" />
                📝 Examples
              </Typography>
              <Stack spacing={1}>
                {data.examples.map((example, i) => (
                  <Paper 
                    key={i}
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#E3F2FD',
                      borderLeft: '4px solid #2196F3'
                    }}
                  >
                    <Typography variant="body2" color="text.primary">
                      {example}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Applications */}
          {data.applications && data.applications.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                🎯 Applications
              </Typography>
              <List dense>
                {data.applications.map((app, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={app}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Related Concepts */}
      {data.relatedConcepts && data.relatedConcepts.length > 0 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School color="primary" />
              🔗 Related Concepts
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {data.relatedConcepts.map((concept, i) => (
                <Chip
                  key={i}
                  label={concept}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => console.log(`User might ask: "what is ${concept}"`)}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// Quick Answer Component
const QuickAnswerResponse: React.FC<{ data: UniversalResponseData }> = ({ data }) => {
  const categoryConfig = getCategoryConfig(data.category || 'guidance');
  const CategoryIcon = categoryConfig.icon;

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Card sx={{ 
        background: categoryConfig.gradient,
        border: `2px solid ${categoryConfig.color}`,
        borderLeft: `6px solid ${categoryConfig.color}`
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <CategoryIcon sx={{ color: categoryConfig.color, fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              {data.title}
            </Typography>
          </Stack>

          {data.definition && (
            <Paper 
              sx={{ 
                p: 2, 
                backgroundColor: '#F5F5F5',
                borderRadius: 2,
                mb: 2
              }}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {data.definition}
              </Typography>
            </Paper>
          )}

          {/* Quick Points */}
          {data.keyPoints && data.keyPoints.length > 0 && (
            <Grid container spacing={1}>
              {data.keyPoints.map((point, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />
                    <Typography variant="body2" color="text.primary">
                      {point}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Next Steps */}
          {data.nextSteps && data.nextSteps.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E0E0E0' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                🚀 Try These:
              </Typography>
              <Stack spacing={0.5}>
                {data.nextSteps.map((step, i) => (
                  <Typography 
                    key={i}
                    variant="body2" 
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 500,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    • {step}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Error/Warning Response Component
const ErrorResponseComponent: React.FC<{ data: UniversalResponseData }> = ({ data }) => {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Card sx={{ 
        background: 'linear-gradient(135deg, #FFEBEE 0%, #FFF3E0 100%)',
        border: '2px solid #FF9800',
        borderLeft: '6px solid #FF9800'
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Warning sx={{ color: '#FF9800', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#F57C00' }}>
              {data.title}
            </Typography>
          </Stack>

          {data.definition && (
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              {data.definition}
            </Typography>
          )}

          {data.nextSteps && data.nextSteps.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                💡 What you can try:
              </Typography>
              {data.nextSteps.map((step, i) => (
                <Typography 
                  key={i}
                  variant="body2" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500,
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  • {step}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Main Universal Response Component
const UniversalResponseComponent: React.FC<UniversalResponseComponentProps> = ({ data }) => {
  switch (data.messageContentType) {
    case 'concept_definition':
      return <ConceptDefinitionResponse data={data} />;
    
    case 'general_knowledge':
    case 'quick_answer':
      return <QuickAnswerResponse data={data} />;
    
    case 'error_response':
    case 'guidance_response':
      return <ErrorResponseComponent data={data} />;
    
    default:
      return <QuickAnswerResponse data={data} />;
  }
};

export default UniversalResponseComponent;
