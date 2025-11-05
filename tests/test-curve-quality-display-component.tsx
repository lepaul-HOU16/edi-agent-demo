/**
 * Test CloudscapeCurveQualityDisplay Component
 * Manual test to verify component renders correctly with mock data
 */

import React from 'react';
import { CloudscapeCurveQualityDisplay } from '../src/components/cloudscape/CloudscapeCurveQualityDisplay';

// Mock artifact data - Good quality curve
const mockGoodQualityArtifact = {
  messageContentType: 'curve_quality_assessment' as const,
  wellName: 'WELL-001',
  curveName: 'GR',
  completeness: 98.3,
  totalPoints: 9049,
  validPoints: 8895,
  qualityScore: 'Excellent' as const,
  outliers: {
    count: 45,
    percentage: 0.5
  }
};

// Mock artifact data - Fair quality curve
const mockFairQualityArtifact = {
  messageContentType: 'curve_quality_assessment' as const,
  wellName: 'WELL-001',
  curveName: 'VWCL',
  completeness: 54.8,
  totalPoints: 9049,
  validPoints: 4955,
  qualityScore: 'Fair' as const
};

// Mock artifact data - Poor quality curve with significant outliers
const mockPoorQualityArtifact = {
  messageContentType: 'curve_quality_assessment' as const,
  wellName: 'WELL-001',
  curveName: 'FAULT',
  completeness: 0.9,
  totalPoints: 9049,
  validPoints: 81,
  qualityScore: 'Poor' as const,
  outliers: {
    count: 8,
    percentage: 9.9
  }
};

// Test components
export function TestCurveQualityDisplay() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Curve Quality Display Component Tests</h1>
      
      <h2>Test 1: Excellent Quality (GR Curve)</h2>
      <CloudscapeCurveQualityDisplay artifact={mockGoodQualityArtifact} />
      
      <hr style={{ margin: '40px 0' }} />
      
      <h2>Test 2: Fair Quality (VWCL Curve)</h2>
      <CloudscapeCurveQualityDisplay artifact={mockFairQualityArtifact} />
      
      <hr style={{ margin: '40px 0' }} />
      
      <h2>Test 3: Poor Quality with Outliers (FAULT Curve)</h2>
      <CloudscapeCurveQualityDisplay artifact={mockPoorQualityArtifact} />
    </div>
  );
}

// Console test
console.log('✅ Curve Quality Component Test Data:');
console.log('\n=== Test 1: Excellent Quality ===');
console.log('Curve: GR');
console.log('Completeness: 98.3% (green progress bar)');
console.log('Quality Score: Excellent (success indicator)');
console.log('Outliers: 45 (0.5%) - within acceptable range');

console.log('\n=== Test 2: Fair Quality ===');
console.log('Curve: VWCL');
console.log('Completeness: 54.8% (yellow progress bar)');
console.log('Quality Score: Fair (warning indicator)');
console.log('No outlier data');

console.log('\n=== Test 3: Poor Quality with Outliers ===');
console.log('Curve: FAULT');
console.log('Completeness: 0.9% (red progress bar)');
console.log('Quality Score: Poor (error indicator)');
console.log('Outliers: 8 (9.9%) - WARNING ALERT should display');

export default TestCurveQualityDisplay;
