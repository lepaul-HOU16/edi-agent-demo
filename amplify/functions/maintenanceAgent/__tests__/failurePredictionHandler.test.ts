/**
 * Unit tests for Failure Prediction Handler
 */

import { handleFailurePrediction } from '../handlers/failurePredictionHandler';

describe('Failure Prediction Handler', () => {
  describe('Valid Equipment ID Tests', () => {
    it('should return failure prediction for PUMP-001', async () => {
      const result = await handleFailurePrediction('Predict failure for PUMP-001', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('PUMP-001');
      expect(result.message).toContain('Primary Cooling Pump');
      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].messageContentType).toBe('failure_prediction');
      expect(result.artifacts[0].data.equipmentId).toBe('PUMP-001');
      expect(result.thoughtSteps).toBeDefined();
    });

    it('should return low risk prediction for PUMP-001', async () => {
      const result = await handleFailurePrediction('Failure prediction PUMP-001', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.failureRisk).toBe('low');
      expect(result.artifacts[0].data.riskScore).toBe(25);
      expect(result.artifacts[0].data.timeToFailure).toBe(180);
      expect(result.message).toContain('LOW');
      expect(result.message).toContain('✅');
    });

    it('should return high risk prediction for COMP-123', async () => {
      const result = await handleFailurePrediction('Predict failure COMP-123', 'COMP-123');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.failureRisk).toBe('high');
      expect(result.artifacts[0].data.riskScore).toBe(75);
      expect(result.artifacts[0].data.timeToFailure).toBe(45);
      expect(result.message).toContain('HIGH');
      expect(result.message).toContain('🚨');
    });

    it('should include confidence level', async () => {
      const result = await handleFailurePrediction('PUMP-001 failure prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.confidence).toBeDefined();
      expect(result.artifacts[0].data.confidence).toBeGreaterThan(0);
      expect(result.artifacts[0].data.confidence).toBeLessThanOrEqual(1);
      expect(result.message).toContain('Confidence');
    });

    it('should include contributing factors', async () => {
      const result = await handleFailurePrediction('PUMP-001 failure risk', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.contributingFactors).toBeDefined();
      expect(result.artifacts[0].data.contributingFactors.length).toBeGreaterThan(0);
      
      const factor = result.artifacts[0].data.contributingFactors[0];
      expect(factor).toHaveProperty('factor');
      expect(factor).toHaveProperty('impact');
      expect(factor).toHaveProperty('trend');
      expect(factor).toHaveProperty('description');
    });

    it('should include recommendations', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.recommendations).toBeDefined();
      expect(result.artifacts[0].data.recommendations.length).toBeGreaterThan(0);
      expect(result.message).toContain('Recommendations');
    });

    it('should include methodology information', async () => {
      const result = await handleFailurePrediction('PUMP-001 failure', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.methodology).toBeDefined();
      expect(result.artifacts[0].data.methodology).toContain('Machine Learning');
      expect(result.message).toContain('Methodology');
    });
  });

  describe('Error Handling Tests', () => {
    it('should return error when equipment ID is missing', async () => {
      const result = await handleFailurePrediction('Predict equipment failure');

      expect(result.success).toBe(false);
      expect(result.message).toContain('specify an equipment ID');
      expect(result.artifacts).toHaveLength(0);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps![0].type).toBe('error');
      expect(result.thoughtSteps![0].title).toBe('Missing Equipment ID');
    });

    it('should return error when equipment ID is not found', async () => {
      const result = await handleFailurePrediction('Predict failure for INVALID-999', 'INVALID-999');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(result.message).toContain('insufficient historical data');
      expect(result.artifacts).toHaveLength(0);
      expect(result.thoughtSteps![0].type).toBe('error');
    });

    it('should handle empty equipment ID', async () => {
      const result = await handleFailurePrediction('Failure prediction', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('specify an equipment ID');
    });
  });

  describe('Response Structure Tests', () => {
    it('should return correct artifact structure', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0]).toHaveProperty('messageContentType');
      expect(result.artifacts[0]).toHaveProperty('title');
      expect(result.artifacts[0]).toHaveProperty('subtitle');
      expect(result.artifacts[0]).toHaveProperty('data');
      expect(result.artifacts[0]).toHaveProperty('visualizationType');
      expect(result.artifacts[0].visualizationType).toBe('timeline');
    });

    it('should include thought steps with analysis', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps!.length).toBeGreaterThanOrEqual(4);
      
      const titles = result.thoughtSteps!.map(s => s.title);
      expect(titles).toContain('Data Collection');
      expect(titles).toContain('Risk Assessment');
      expect(titles).toContain('Contributing Factors');
      expect(titles).toContain('Recommendations');
    });

    it('should include all required data fields', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      const data = result.artifacts[0].data;
      
      expect(data).toHaveProperty('equipmentId');
      expect(data).toHaveProperty('equipmentName');
      expect(data).toHaveProperty('predictionDate');
      expect(data).toHaveProperty('failureRisk');
      expect(data).toHaveProperty('riskScore');
      expect(data).toHaveProperty('timeToFailure');
      expect(data).toHaveProperty('confidence');
      expect(data).toHaveProperty('contributingFactors');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('methodology');
    });
  });

  describe('Risk Assessment Tests', () => {
    it('should provide appropriate recommendations for low risk', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.failureRisk).toBe('low');
      const recommendations = result.artifacts[0].data.recommendations;
      expect(recommendations.some((r: string) => r.toLowerCase().includes('continue'))).toBe(true);
    });

    it('should provide urgent recommendations for high risk', async () => {
      const result = await handleFailurePrediction('COMP-123 prediction', 'COMP-123');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.failureRisk).toBe('high');
      const recommendations = result.artifacts[0].data.recommendations;
      expect(recommendations.some((r: string) => r.includes('URGENT') || r.includes('⚠️'))).toBe(true);
    });

    it('should calculate time to failure correctly', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.timeToFailure).toBeGreaterThan(0);
      expect(result.message).toContain('Time to Failure');
      expect(result.message).toContain('days');
    });
  });

  describe('Contributing Factors Tests', () => {
    it('should identify multiple contributing factors', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      const factors = result.artifacts[0].data.contributingFactors;
      expect(factors.length).toBeGreaterThanOrEqual(3);
    });

    it('should include impact scores for factors', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      const factors = result.artifacts[0].data.contributingFactors;
      factors.forEach((factor: any) => {
        expect(factor.impact).toBeGreaterThan(0);
        expect(factor.impact).toBeLessThanOrEqual(1);
      });
    });

    it('should include trend information for factors', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      const factors = result.artifacts[0].data.contributingFactors;
      const validTrends = ['improving', 'stable', 'degrading'];
      factors.forEach((factor: any) => {
        expect(validTrends).toContain(factor.trend);
      });
    });

    it('should show degrading trends for high-risk equipment', async () => {
      const result = await handleFailurePrediction('COMP-123 prediction', 'COMP-123');

      expect(result.success).toBe(true);
      const factors = result.artifacts[0].data.contributingFactors;
      const degradingFactors = factors.filter((f: any) => f.trend === 'degrading');
      expect(degradingFactors.length).toBeGreaterThan(0);
    });
  });

  describe('Message Content Tests', () => {
    it('should include risk emoji in message', async () => {
      const lowRiskResult = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');
      expect(lowRiskResult.message).toContain('✅');

      const highRiskResult = await handleFailurePrediction('COMP-123 prediction', 'COMP-123');
      expect(highRiskResult.message).toContain('🚨');
    });

    it('should list all contributing factors in message', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Key Risk Factors');
      result.artifacts[0].data.contributingFactors.forEach((factor: any) => {
        expect(result.message).toContain(factor.factor);
      });
    });

    it('should include trend indicators in message', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/📈|➡️|📉/); // Should contain trend emojis
    });

    it('should list all recommendations in message', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Recommendations');
      result.artifacts[0].data.recommendations.forEach((rec: string) => {
        expect(result.message).toContain(rec);
      });
    });
  });

  describe('Data Analysis Tests', () => {
    it('should include data points analyzed', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.dataPointsAnalyzed).toBeDefined();
      expect(result.artifacts[0].data.dataPointsAnalyzed).toBeGreaterThan(0);
      expect(result.message).toContain('data points');
    });

    it('should include analysis period', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.analysisPeriod).toBeDefined();
      expect(result.message).toContain(result.artifacts[0].data.analysisPeriod);
    });

    it('should include historical failure count', async () => {
      const result = await handleFailurePrediction('PUMP-001 prediction', 'PUMP-001');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.historicalFailures).toBeDefined();
      expect(typeof result.artifacts[0].data.historicalFailures).toBe('number');
    });
  });
});
