/**
 * Test CloudscapeDataQualityDisplay Component
 * Manual test to verify component renders correctly with mock data
 */

import React from 'react';
import { CloudscapeDataQualityDisplay } from '../src/components/cloudscape/CloudscapeDataQualityDisplay';

// Mock artifact data matching the backend structure
const mockArtifact = {
  messageContentType: 'data_quality_assessment' as const,
  wellName: 'WELL-001',
  overallQuality: 'Good' as const,
  curves: [
    {
      curve: 'GR',
      completeness: 98.3,
      totalPoints: 9049,
      validPoints: 8895
    },
    {
      curve: 'RHOB',
      completeness: 98.2,
      totalPoints: 9049,
      validPoints: 8884
    },
    {
      curve: 'NPHI',
      completeness: 96.9,
      totalPoints: 9049,
      validPoints: 8768
    },
    {
      curve: 'DTC',
      completeness: 97.6,
      totalPoints: 9049,
      validPoints: 8833
    },
    {
      curve: 'DEEPRESISTIVITY',
      completeness: 97.6,
      totalPoints: 9049,
      validPoints: 8835
    },
    {
      curve: 'SHALLOWRESISTIVITY',
      completeness: 97.6,
      totalPoints: 9049,
      validPoints: 8835
    },
    {
      curve: 'CALI',
      completeness: 98.7,
      totalPoints: 9049,
      validPoints: 8935
    },
    {
      curve: 'LITHOLOGY',
      completeness: 98.4,
      totalPoints: 9049,
      validPoints: 8908
    },
    {
      curve: 'VWCL',
      completeness: 54.8,
      totalPoints: 9049,
      validPoints: 4955
    },
    {
      curve: 'ENVI',
      completeness: 54.7,
      totalPoints: 9049,
      validPoints: 4952
    },
    {
      curve: 'FAULT',
      completeness: 0.9,
      totalPoints: 9049,
      validPoints: 81
    },
    {
      curve: 'ONE-WAYTIME1',
      completeness: 100.0,
      totalPoints: 9049,
      validPoints: 9049
    }
  ],
  summary: {
    totalCurves: 12,
    goodQuality: 8,
    fairQuality: 3,
    poorQuality: 1,
    averageCompleteness: 85.5
  }
};

// Test component
export function TestDataQualityDisplay() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Data Quality Display Component Test</h1>
      <CloudscapeDataQualityDisplay artifact={mockArtifact} />
    </div>
  );
}

// Console test
console.log('✅ Component Test Data:');
console.log('Mock Artifact:', JSON.stringify(mockArtifact, null, 2));
console.log('\nExpected Rendering:');
console.log('- Overall Quality: Good (success indicator)');
console.log('- Total Curves: 12');
console.log('- Good Quality: 8 (green)');
console.log('- Fair Quality: 3 (yellow)');
console.log('- Poor Quality: 1 (red)');
console.log('- Average Completeness: 85.5% (yellow/warning)');
console.log('\nCurve Progress Bars (sorted worst to best):');
mockArtifact.curves
  .sort((a, b) => a.completeness - b.completeness)
  .forEach(curve => {
    const color = curve.completeness > 90 ? 'green' : curve.completeness >= 50 ? 'yellow' : 'red';
    console.log(`  ${curve.curve}: ${curve.completeness.toFixed(2)}% (${color})`);
  });

export default TestDataQualityDisplay;
