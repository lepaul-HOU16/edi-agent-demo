/**
 * Unit tests for financial analysis intent classification
 * 
 * Verifies that financial analysis queries are correctly classified as
 * report_generation intent and not misrouted to terrain_analysis.
 * 
 * Requirements: 6.1, 6.2
 */

import { RenewableIntentClassifier } from '../../amplify/functions/renewableOrchestrator/RenewableIntentClassifier';

describe('Financial Analysis Intent Classification', () => {
  let classifier: RenewableIntentClassifier;

  beforeEach(() => {
    classifier = new RenewableIntentClassifier();
  });

  describe('Financial Analysis Queries', () => {
    test('should classify "financial analysis" as report_generation', () => {
      const result = classifier.classifyIntent('financial analysis');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "roi calculation" as report_generation', () => {
      const result = classifier.classifyIntent('roi calculation');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "economic analysis" as report_generation', () => {
      const result = classifier.classifyIntent('economic analysis');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "perform financial analysis and ROI calculation" as report_generation', () => {
      const result = classifier.classifyIntent('perform financial analysis and ROI calculation');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "cost benefit analysis" as report_generation', () => {
      const result = classifier.classifyIntent('cost benefit analysis');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "project economics" as report_generation', () => {
      const result = classifier.classifyIntent('project economics');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "financial report" as report_generation', () => {
      const result = classifier.classifyIntent('financial report');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "lcoe calculation" as report_generation', () => {
      const result = classifier.classifyIntent('calculate lcoe');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "investment analysis" as report_generation', () => {
      const result = classifier.classifyIntent('investment analysis');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "payback period" as report_generation', () => {
      const result = classifier.classifyIntent('calculate payback period');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Terrain Analysis Exclusions', () => {
    test('should NOT classify financial queries as terrain_analysis', () => {
      const queries = [
        'financial analysis',
        'roi calculation',
        'economic analysis',
        'cost benefit analysis',
        'investment analysis'
      ];

      queries.forEach(query => {
        const result = classifier.classifyIntent(query);
        expect(result.intent).not.toBe('terrain_analysis');
      });
    });

    test('should exclude financial keywords from terrain_analysis', () => {
      const result = classifier.classifyIntent('terrain analysis with financial considerations');
      
      // Should still be report_generation because financial keyword is present
      expect(result.intent).toBe('report_generation');
    });
  });

  describe('Report Generation Queries', () => {
    test('should classify "generate report" as report_generation', () => {
      const result = classifier.classifyIntent('generate comprehensive executive report');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "create report" as report_generation', () => {
      const result = classifier.classifyIntent('create project report');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should classify "executive summary" as report_generation', () => {
      const result = classifier.classifyIntent('executive summary');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Confidence Scoring', () => {
    test('should have high confidence for clear financial queries', () => {
      const result = classifier.classifyIntent('financial analysis and roi calculation');
      
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    test('should provide alternatives for ambiguous queries', () => {
      const result = classifier.classifyIntent('analysis');
      
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Priority', () => {
    test('should prioritize financial patterns over terrain patterns', () => {
      // This query contains both "analysis" (could match terrain) and "financial"
      const result = classifier.classifyIntent('financial analysis for wind farm site');
      
      expect(result.intent).toBe('report_generation');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    test('should prioritize financial patterns over other analysis types', () => {
      const queries = [
        'financial analysis for wake simulation',
        'roi calculation for layout optimization',
        'economic analysis of wind rose data'
      ];

      queries.forEach(query => {
        const result = classifier.classifyIntent(query);
        expect(result.intent).toBe('report_generation');
      });
    });
  });

  describe('Parameter Extraction', () => {
    test('should extract project ID from financial query', () => {
      const result = classifier.classifyIntent('financial analysis for project: wind-farm-123');
      
      expect(result.params.project_id).toBe('wind-farm-123');
    });

    test('should extract coordinates from financial query', () => {
      const result = classifier.classifyIntent('financial analysis at 35.0675, -101.3954');
      
      expect(result.params.latitude).toBeCloseTo(35.0675, 4);
      expect(result.params.longitude).toBeCloseTo(-101.3954, 4);
    });
  });
});
