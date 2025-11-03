/**
 * Tests for Layout Creation vs Wake Analysis Intent Detection
 * 
 * Ensures that layout creation queries route to layout_optimization
 * and wake analysis queries route to wake_simulation.
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

import { RenewableIntentClassifier } from '../RenewableIntentClassifier';

describe('Layout vs Wake Intent Detection', () => {
  let classifier: RenewableIntentClassifier;

  beforeEach(() => {
    classifier = new RenewableIntentClassifier();
  });

  describe('Layout Creation Queries', () => {
    test('should route "create a wind farm layout" to layout_optimization', () => {
      const result = classifier.classifyIntent('create a wind farm layout at 40.7128, -74.0060');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "generate layout" to layout_optimization', () => {
      const result = classifier.classifyIntent('generate a turbine layout for my site');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "design wind farm" to layout_optimization', () => {
      const result = classifier.classifyIntent('design a wind farm layout at coordinates 45.5, -122.6');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "create turbine layout" to layout_optimization', () => {
      const result = classifier.classifyIntent('create a turbine layout with 10 turbines');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "build wind farm layout" to layout_optimization', () => {
      const result = classifier.classifyIntent('build a wind farm layout for 50 MW capacity');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "optimize turbine placement" to layout_optimization', () => {
      const result = classifier.classifyIntent('optimize turbine placement for maximum energy');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "plan turbine placement" to layout_optimization', () => {
      const result = classifier.classifyIntent('plan turbine placement for my site');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(70);
    });
  });

  describe('Wake Analysis Queries', () => {
    test('should route "analyze wake effects" to wake_analysis', () => {
      const result = classifier.classifyIntent('analyze wake effects for project-123');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "wake analysis for project" to wake_analysis', () => {
      const result = classifier.classifyIntent('wake analysis for project wind-farm-001');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "turbine interaction" to wake_analysis', () => {
      const result = classifier.classifyIntent('analyze turbine interaction and wake effects');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "wake modeling" to wake_analysis', () => {
      const result = classifier.classifyIntent('perform wake modeling for existing layout');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "wake loss calculation" to wake_analysis', () => {
      const result = classifier.classifyIntent('calculate wake loss for turbine array');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should route "downstream impact" to wake_analysis', () => {
      const result = classifier.classifyIntent('analyze downstream impact of turbines');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });
  });

  describe('Exclusion Patterns', () => {
    test('should NOT route "create layout" to wake_analysis', () => {
      const result = classifier.classifyIntent('create a wind farm layout');
      
      expect(result.intent).not.toBe('wake_analysis');
      expect(result.intent).toBe('layout_optimization');
    });

    test('should NOT route "wake analysis" to layout_optimization', () => {
      const result = classifier.classifyIntent('analyze wake effects');
      
      expect(result.intent).not.toBe('layout_optimization');
      expect(result.intent).toBe('wake_analysis');
    });

    test('should NOT route "generate layout" to wake_analysis', () => {
      const result = classifier.classifyIntent('generate a new turbine layout');
      
      expect(result.intent).not.toBe('wake_analysis');
      expect(result.intent).toBe('layout_optimization');
    });

    test('should NOT route "design wind farm" to wake_analysis', () => {
      const result = classifier.classifyIntent('design a wind farm with optimal spacing');
      
      expect(result.intent).not.toBe('wake_analysis');
      expect(result.intent).toBe('layout_optimization');
    });
  });

  describe('Confidence Scores', () => {
    test('should have high confidence for clear layout creation query', () => {
      const result = classifier.classifyIntent('create a wind farm layout at 40.7128, -74.0060');
      
      expect(result.confidence).toBeGreaterThan(80);
    });

    test('should have high confidence for clear wake analysis query', () => {
      const result = classifier.classifyIntent('analyze wake effects for project-123');
      
      expect(result.confidence).toBeGreaterThan(80);
    });

    test('should have lower confidence for ambiguous query', () => {
      const result = classifier.classifyIntent('turbine optimization');
      
      // Ambiguous - could be layout or wake
      expect(result.confidence).toBeLessThan(80);
    });
  });

  describe('Parameter Extraction', () => {
    test('should extract coordinates from layout creation query', () => {
      const result = classifier.classifyIntent('create a wind farm layout at 40.7128, -74.0060');
      
      expect(result.params.latitude).toBe(40.7128);
      expect(result.params.longitude).toBe(-74.0060);
    });

    test('should extract project ID from wake analysis query with colon', () => {
      const result = classifier.classifyIntent('wake analysis for project: wind-farm-001');
      
      expect(result.params.project_id).toBe('wind-farm-001');
    });

    test('should extract project ID from wake analysis query with hyphen', () => {
      const result = classifier.classifyIntent('analyze wake effects for project-1760358510367');
      
      expect(result.params.project_id).toBe('1760358510367');
    });

    test('should extract capacity from layout query', () => {
      const result = classifier.classifyIntent('create a 50 MW wind farm layout');
      
      expect(result.params.capacity).toBe(50);
    });
  });

  describe('Real User Queries', () => {
    test('should handle "create a wind farm layout at coordinates X, Y"', () => {
      const result = classifier.classifyIntent('create a wind farm layout at coordinates 45.5231, -122.6765');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(75);
      expect(result.params.latitude).toBe(45.5231);
      expect(result.params.longitude).toBe(-122.6765);
    });

    test('should handle "analyze wake effects for my existing layout"', () => {
      const result = classifier.classifyIntent('analyze wake effects for my existing layout project-abc-123');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should handle "design an optimal turbine layout"', () => {
      const result = classifier.classifyIntent('design an optimal turbine layout for maximum energy production');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.confidence).toBeGreaterThan(75);
    });

    test('should handle "what are the wake losses"', () => {
      const result = classifier.classifyIntent('what are the wake losses for this wind farm');
      
      expect(result.intent).toBe('wake_analysis');
      expect(result.confidence).toBeGreaterThan(70);
    });
  });

  describe('Edge Cases', () => {
    test('should handle query with both layout and wake keywords', () => {
      const result = classifier.classifyIntent('create a layout that minimizes wake effects');
      
      // Should prioritize layout creation since "create" is a strong indicator
      expect(result.intent).toBe('layout_optimization');
    });

    test('should handle query asking for wake analysis of new layout', () => {
      const result = classifier.classifyIntent('analyze wake effects for the new layout I want to create');
      
      // "create" keyword should take precedence since they want to create a layout first
      // Wake analysis would come after layout creation
      expect(result.intent).toBe('layout_optimization');
      expect(result.params.optimizeForWake).toBe(true); // Should optimize for wake
    });

    test('should provide alternatives for ambiguous query', () => {
      const result = classifier.classifyIntent('turbine spacing optimization');
      
      // Should have alternatives since it could be layout or wake-related
      expect(result.alternatives.length).toBeGreaterThan(0);
    });
  });
});
