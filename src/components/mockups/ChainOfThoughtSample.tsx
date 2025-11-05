/**
 * Chain of Thought Sample Component
 * Demonstrates the new verbose, markdown-styled chain of thought display
 * with medium dark gray background and light text
 * Shows multiple prompts with separators
 */

import React, { useState } from 'react';

// Sample verbose thought steps from first prompt (porosity calculation)
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

// Sample verbose thought steps from second prompt (shale volume)
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

const ChainOfThoughtSample: React.FC = () => {
  // Track expanded state for each step (default all expanded)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    [...firstPromptSteps, ...secondPromptSteps].forEach(step => {
      initial[step.id] = true; // Default all expanded
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
          ),
          animation: `slideIn 0.2s ease-out ${index * 0.05}s both`
        }}>
          {/* Step Header - Compact */}
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
            {/* Toggle button */}
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

          {/* Step Summary and Details - Only show when expanded */}
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

              {/* Step Details - Always visible when expanded */}
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
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '10px', color: '#333' }}>Chain of Thought in Left Panel</h2>
      <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
        This shows how it appears in the actual left panel (5-column grid). The panel has the medium dark gray background.
      </p>
      
      {/* Simulate the actual layout with grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '20px', maxWidth: '1400px' }}>
        {/* LEFT PANEL - Chain of Thought (this is the .panel div) */}
        <div className="panel" style={{
          backgroundColor: '#2d3748',
          borderRadius: '8px',
          padding: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          height: 'fit-content',
          minHeight: '600px'
        }}>
        {/* Header - Compact */}
        <div style={{
          borderBottom: '1px solid #4a5568',
          paddingBottom: '8px',
          marginBottom: '12px'
        }}>
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
            Detailed reasoning steps for transparency
          </p>
        </div>

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

        {/* Separator between prompts */}
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

          {/* Footer - Compact */}
          <div style={{
            marginTop: '12px',
            paddingTop: '8px',
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
        </div>

        {/* RIGHT SIDE - Chat Messages (7-column grid) */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          minHeight: '600px'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '18px' }}>Chat Messages</h3>
          
          {/* Mock chat messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '6px',
              borderLeft: '3px solid #6b7280'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#374151', fontSize: '13px' }}>You</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Calculate porosity for WELL-001</div>
            </div>
            
            <div style={{
              backgroundColor: '#eff6ff',
              padding: '12px',
              borderRadius: '6px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#1e40af', fontSize: '13px' }}>AI Assistant</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                I've calculated the porosity for WELL-001 using the density method. The analysis shows a mean porosity of 0.187 with good data quality (94.2% completeness).
              </div>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '6px',
              borderLeft: '3px solid #6b7280'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#374151', fontSize: '13px' }}>You</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Analyze shale volume for WELL-002</div>
            </div>
            
            <div style={{
              backgroundColor: '#eff6ff',
              padding: '12px',
              borderRadius: '6px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#1e40af', fontSize: '13px' }}>AI Assistant</div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                I've analyzed the shale volume for WELL-002 using the Larionov Tertiary method. The results show excellent data quality (97.8% completeness) with a mean shale volume of 0.342.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChainOfThoughtSample;
