'use client';

import ChainOfThoughtDisplay from '@/components/ChainOfThoughtDisplay';
import type { PromptGroup } from '@/types/chainOfThought';

export default function ChainOfThoughtComponentTest() {
  // Sample data matching the approved design
  const samplePromptGroups: PromptGroup[] = [
    {
      promptText: 'Calculate porosity for WELL-001',
      steps: [
        {
          id: 'step-1',
          type: 'data_access',
          timestamp: Date.now() - 5000,
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
          timestamp: Date.now() - 4500,
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
          timestamp: Date.now() - 3800,
          title: 'Calculating Density Porosity',
          summary: 'Applying density porosity formula with matrix density 2.65 g/cc',
          details: {
            operation: 'Density Porosity Calculation',
            dataPoints: 2847,
            parameters: {
              method: 'density',
              matrixDensity: 2.65,
              fluidDensity: 1.0
            },
            reasoning: 'Selected density method based on available RHOB curve'
          },
          status: 'complete'
        },
        {
          id: 'step-4',
          type: 'completion',
          timestamp: Date.now() - 3000,
          title: 'Analysis Complete',
          summary: 'Successfully calculated porosity with high confidence',
          details: {
            totalDuration: 2000,
            confidence: 'high',
            artifactsGenerated: 1
          },
          status: 'complete'
        }
      ]
    },
    {
      promptText: 'Analyze shale volume for WELL-002',
      steps: [
        {
          id: 'step-5',
          type: 'data_access',
          timestamp: Date.now() - 2000,
          title: 'Retrieving Well Log Data',
          summary: 'Fetching LAS file from S3 storage',
          details: {
            operation: 'S3 GetObject',
            source: 's3://amplify-bucket/global/well-data/WELL-002.las',
            duration: 198
          },
          status: 'complete'
        },
        {
          id: 'step-6',
          type: 'calculation',
          timestamp: Date.now() - 1000,
          title: 'Calculating Shale Volume',
          summary: 'Applying Larionov Tertiary method',
          details: {
            operation: 'Shale Volume Calculation',
            parameters: {
              method: 'larionov_tertiary',
              grClean: 25,
              grShale: 115
            }
          },
          status: 'complete'
        }
      ]
    }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '10px', color: '#333' }}>Chain of Thought Component Test</h2>
      <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
        Testing the reusable ChainOfThoughtDisplay component with sample data.
      </p>

      <div style={{ maxWidth: '800px', height: '600px' }}>
        <ChainOfThoughtDisplay promptGroups={samplePromptGroups} />
      </div>
    </div>
  );
}
