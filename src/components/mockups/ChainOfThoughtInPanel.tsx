/**
 * Chain of Thought In Panel Sample
 * Shows how the chain of thought looks in the actual side panel context
 */

import React, { useState } from 'react';
import { Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';

// Reuse the same thought steps from the main sample
const firstPromptSteps = [
  {
    id: 'step-1',
    type: 'data_access',
    timestamp: Date.now() - 8000,
    title: 'Retrieving Well Log Data',
    summary: 'Fetching LAS file from S3 storage',
    details: {
      operation: 'S3 GetObject',
      source: 's3://amplify-bucket/global/well-data/WELL-001.las',
      fileSize: '2.4 MB',
      duration: 234
    },
    status: 'complete'
  },
  {
    id: 'step-2',
    type: 'parsing',
    timestamp: Date.now() - 7500,
    title: 'Parsing Well Log Data',
    summary: 'Extracted 5 curves from LAS file with 2,847 depth points',
    details: {
      operation: 'LAS Parser',
      dataPoints: 2847,
      parameters: {
        curves: ['DEPT', 'GR', 'RHOB', 'NPHI', 'RT'],
        depthRange: [1000, 3847]
      }
    },
    status: 'complete'
  },
  {
    id: 'step-3',
    type: 'calculation',
    timestamp: Date.now() - 6800,
    title: 'Calculating Density Porosity',
    summary: 'Applying density porosity formula with matrix density 2.65 g/cc and fluid density 1.0 g/cc',
    details: {
      operation: 'Density Porosity Calculation',
      dataPoints: 2847,
      parameters: {
        method: 'density',
        matrixDensity: 2.65,
        fluidDensity: 1.0
      },
      reasoning: 'Selected density method based on available RHOB curve and standard sandstone matrix assumptions'
    },
    status: 'complete'
  },
  {
    id: 'step-4',
    type: 'completion',
    timestamp: Date.now() - 6000,
    title: 'Analysis Complete',
    summary: 'Successfully calculated porosity for WELL-001 with high confidence',
    details: {
      totalDuration: 2000,
      confidence: 'high',
      artifactsGenerated: 1
    },
    status: 'complete'
  }
];

const secondPromptSteps = [
  {
    id: 'step-5',
    type: 'data_access',
    timestamp: Date.now() - 3000,
    title: 'Retrieving Well Log Data',
    summary: 'Fetching LAS file from S3 storage',
    details: {
      operation: 'S3 GetObject',
      source: 's3://amplify-bucket/global/well-data/WELL-002.las',
      fileSize: '3.1 MB',
      duration: 198
    },
    status: 'complete'
  },
  {
    id: 'step-6',
    type: 'parsing',
    timestamp: Date.now() - 2700,
    title: 'Parsing Well Log Data',
    summary: 'Extracted 4 curves from LAS file with 3,124 depth points',
    details: {
      operation: 'LAS Parser',
      dataPoints: 3124,
      parameters: {
        curves: ['DEPT', 'GR', 'RHOB', 'NPHI'],
        depthRange: [800, 3924]
      }
    },
    status: 'complete'
  },
  {
    id: 'step-7',
    type: 'calculation',
    timestamp: Date.now() - 2100,
    title: 'Calculating Shale Volume',
    summary: 'Applying Larionov Tertiary method with GR clean 25 API and GR shale 115 API',
    details: {
      operation: 'Shale Volume Calculation',
      dataPoints: 3124,
      parameters: {
        method: 'larionov_tertiary',
        grClean: 25,
        grShale: 115
      },
      reasoning: 'Selected Larionov Tertiary method based on formation age (Miocene) and regional geology'
    },
    status: 'complete'
  },
  {
    id: 'step-8',
    type: 'validation',
    timestamp: Date.now() - 1400,
    title: 'Validating Data Quality',
    summary: 'Data completeness: 97.8%, Outliers detected: 8 points (0.3%)',
    details: {
      operation: 'Quality Assessment',
      metrics: {
        completeness: 97.8,
        outlierCount: 8,
        outlierPercentage: 0.3,
        validPoints: 3056,
        nullPoints: 68
      }
    },
    status: 'complete'
  },
  {
    id: 'step-9',
    type: 'completion',
    timestamp: Date.now() - 500,
    title: 'Analysis Complete',
    summary: 'Successfully calculated shale volume for WELL-002 with high confidence',
    details: {
      totalDuration: 2500,
      confidence: 'high',
      artifactsGenerated: 1
    },
    status: 'complete'
  }
];

const ChainOfThoughtInPanel: React.FC = () => {
  const [panelOpen, setPanelOpen] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    [...firstPromptSteps, ...secondPromptSteps].forEach(step => {
      initial[step.id] = true;
    });
    return initial;
  });

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const renderThoughtSteps = (steps: typeof firstPromptSteps) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {steps.map((step, index) => (
        <div key={step.id} style={{
          backgroundColor: '#1a202c',
          borderRadius: '4px',
          padding: '10px 12px',
          borderLeft: '3px solid ' + (
            step.status === 'complete' ? '#48bb78' :
            step.status === 'error' ? '#f56565' :
            '#4299e1'
          )
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: expandedSteps[step.id] ? '8px' : '0'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#a0aec0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Step {index + 1}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: '#718096',
                  fontFamily: 'monospace'
                }}>
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
                {step.details?.duration && (
                  <span style={{
                    fontSize: '10px',
                    color: '#718096',
                    fontFamily: 'monospace'
                  }}>
                    {step.details.duration}ms
                  </span>
                )}
              </div>
              <h4 style={{
                margin: '2px 0 0 0',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {step.title}
              </h4>
            </div>
            <button
              onClick={() => toggleStep(step.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4299e1',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '3px',
                transition: 'background-color 0.2s',
                marginLeft: '8px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {expandedSteps[step.id] ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {expandedSteps[step.id] && (
            <>
              <div style={{
                color: '#cbd5e0',
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: step.details ? '8px' : '0'
              }}>
                {step.summary}
              </div>

              {step.details && (
                <div style={{
                  backgroundColor: '#0d1117',
                  borderRadius: '3px',
                  padding: '8px 10px',
                  border: '1px solid #30363d',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '11px',
                  color: '#c9d1d9',
                  overflowX: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Main Content Area (Chat) */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>Chain of Thought in Side Panel</h2>
        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          This shows how the chain of thought appears in the actual side panel. Click the button to toggle the panel.
        </p>
        
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <PsychologyIcon style={{ fontSize: '20px' }} />
          {panelOpen ? 'Hide' : 'Show'} Chain of Thought
        </button>

        {/* Mock chat messages */}
        <div style={{ marginTop: '40px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#333' }}>You</div>
            <div style={{ color: '#666' }}>Calculate porosity for WELL-001</div>
          </div>
          
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#0369a1' }}>AI Assistant</div>
            <div style={{ color: '#666' }}>I've calculated the porosity for WELL-001 using the density method...</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#333' }}>You</div>
            <div style={{ color: '#666' }}>Analyze shale volume for WELL-002</div>
          </div>
          
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#0369a1' }}>AI Assistant</div>
            <div style={{ color: '#666' }}>I've analyzed the shale volume for WELL-002 using the Larionov Tertiary method...</div>
          </div>
        </div>
      </div>

      {/* Side Panel (Chain of Thought) */}
      <Drawer
        anchor="right"
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        variant="persistent"
        sx={{
          width: panelOpen ? 400 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 400,
            boxSizing: 'border-box',
            backgroundColor: '#2d3748',
            borderLeft: '1px solid #4a5568'
          },
        }}
      >
        {/* Panel Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #4a5568',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 600
            }}>
              Chain of Thought
            </h3>
            <p style={{
              margin: '2px 0 0 0',
              color: '#a0aec0',
              fontSize: '11px'
            }}>
              Detailed reasoning steps
            </p>
          </div>
          <IconButton
            onClick={() => setPanelOpen(false)}
            size="small"
            sx={{ color: '#a0aec0' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px'
        }}>
          {/* First Prompt */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              color: '#a0aec0',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Prompt: "Calculate porosity for WELL-001"
            </div>
            {renderThoughtSteps(firstPromptSteps)}
          </div>

          {/* Separator */}
          <div style={{
            borderTop: '2px solid #4a5568',
            margin: '16px 0',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#2d3748',
              padding: '0 12px',
              color: '#718096',
              fontSize: '11px',
              fontWeight: 600
            }}>
              NEW PROMPT
            </div>
          </div>

          {/* Second Prompt */}
          <div>
            <div style={{
              color: '#a0aec0',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Prompt: "Analyze shale volume for WELL-002"
            </div>
            {renderThoughtSteps(secondPromptSteps)}
          </div>
        </div>

        {/* Panel Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #4a5568',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            color: '#a0aec0',
            fontSize: '11px'
          }}>
            Total steps: {firstPromptSteps.length + secondPromptSteps.length}
          </div>
          <div style={{
            color: '#48bb78',
            fontSize: '11px',
            fontWeight: 600
          }}>
            All steps completed
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ChainOfThoughtInPanel;
