/**
 * Unit Tests for Dashboard Intent Detection via RenewableIntentClassifier
 * 
 * Verifies that the RenewableIntentClassifier can detect dashboard queries
 * and route them correctly.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { RenewableIntentClassifier } from '../../amplify/functions/renewableOrchestrator/RenewableIntentClassifier';

describe('RenewableIntentClassifier - Dashboard Detection', () => {
  let classifier: RenewableIntentClassifier;

  beforeEach(() => {
    classifier = new RenewableIntentClassifier();
  });

  describe('Dashboard query detection', () => {
    test('should detect "show project dashboard" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('show project dashboard');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "project dashboard" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('project dashboard');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "dashboard" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('dashboard');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "view dashboard" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('view dashboard');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "my dashboard" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('my dashboard');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "show all projects" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('show all projects');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "project overview" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('project overview');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });

    test('should detect "project summary" as project_dashboard intent', () => {
      const result = classifier.classifyIntent('project summary');
      
      expect(result.intent).toBe('project_dashboard');
      expect(result.confidence).toBeGreaterThan(70);
    });
  });

  describe('Dashboard query exclusions', () => {
    test('should NOT detect "delete project" as project_dashboard', () => {
      const result = classifier.classifyIntent('delete project');
      
      expect(result.intent).not.toBe('project_dashboard');
    });

    test('should NOT detect "rename project" as project_dashboard', () => {
      const result = classifier.classifyIntent('rename project');
      
      expect(result.intent).not.toBe('project_dashboard');
    });

    test('should NOT detect "merge projects" as project_dashboard', () => {
      const result = classifier.classifyIntent('merge projects');
      
      expect(result.intent).not.toBe('project_dashboard');
    });

    test('should NOT detect "archive project" as project_dashboard', () => {
      const result = classifier.classifyIntent('archive project');
      
      expect(result.intent).not.toBe('project_dashboard');
    });

    test('should NOT detect "export project" as project_dashboard', () => {
      const result = classifier.classifyIntent('export project');
      
      expect(result.intent).not.toBe('project_dashboard');
    });

    test('should NOT detect "search projects" as project_dashboard', () => {
      const result = classifier.classifyIntent('search projects');
      
      expect(result.intent).toBe('search_projects'); // Should be search, not dashboard
    });
  });

  describe('Confidence scoring', () => {
    test('should have high confidence for explicit dashboard queries', () => {
      const queries = [
        'show project dashboard',
        'project dashboard',
        'view dashboard'
      ];

      queries.forEach(query => {
        const result = classifier.classifyIntent(query);
        expect(result.confidence).toBeGreaterThanOrEqual(80);
      });
    });

    test('should have moderate confidence for implicit dashboard queries', () => {
      const queries = [
        'dashboard',
        'my projects',
        'all projects'
      ];

      queries.forEach(query => {
        const result = classifier.classifyIntent(query);
        expect(result.confidence).toBeGreaterThanOrEqual(60);
      });
    });
  });

  describe('Parameter extraction', () => {
    test('should not extract coordinates from dashboard queries', () => {
      const result = classifier.classifyIntent('show project dashboard');
      
      expect(result.params.latitude).toBeUndefined();
      expect(result.params.longitude).toBeUndefined();
    });

    test('should not extract project-specific parameters', () => {
      const result = classifier.classifyIntent('project dashboard');
      
      expect(result.params.capacity).toBeUndefined();
      expect(result.params.radius).toBeUndefined();
    });
  });

  describe('Alternative suggestions', () => {
    test('should not suggest dashboard for terrain queries', () => {
      const result = classifier.classifyIntent('analyze terrain at 40.7128, -74.0060');
      
      expect(result.intent).toBe('terrain_analysis');
      expect(result.alternatives.map(a => a.intent)).not.toContain('project_dashboard');
    });

    test('should not suggest dashboard for layout queries', () => {
      const result = classifier.classifyIntent('optimize turbine layout');
      
      expect(result.intent).toBe('layout_optimization');
      expect(result.alternatives.map(a => a.intent)).not.toContain('project_dashboard');
    });
  });
});
