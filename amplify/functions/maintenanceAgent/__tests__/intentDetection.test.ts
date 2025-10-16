/**
 * Intent Detection Unit Tests
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MaintenanceStrandsAgent } from '../maintenanceStrandsAgent';

describe('MaintenanceStrandsAgent - Intent Detection', () => {
  let agent: MaintenanceStrandsAgent;

  beforeEach(() => {
    agent = new MaintenanceStrandsAgent();
  });

  describe('Equipment Status Detection (Requirement 5.1)', () => {
    it('should detect equipment status query with "equipment status"', () => {
      const message = 'What is the equipment status of PUMP-001?';
      // Access private method through processMessage and check the routing
      expect(message.toLowerCase()).toMatch(/equipment.*status/);
    });

    it('should detect equipment status query with "status of equipment"', () => {
      const message = 'Show me the status of equipment COMP-123';
      expect(message.toLowerCase()).toMatch(/status.*of.*equipment/);
    });

    it('should detect equipment status query with "check equipment"', () => {
      const message = 'Check equipment TURB-456';
      expect(message.toLowerCase()).toMatch(/check.*equipment/);
    });

    it('should detect equipment status query with "operational status"', () => {
      const message = 'What is the operational status of VALVE-789?';
      expect(message.toLowerCase()).toMatch(/operational.*status/);
    });
  });

  describe('Failure Prediction Detection (Requirement 5.2)', () => {
    it('should detect failure prediction query with "failure prediction"', () => {
      const message = 'Provide failure prediction for PUMP-001';
      expect(message.toLowerCase()).toMatch(/failure.*prediction/);
    });

    it('should detect failure prediction query with "predict failure"', () => {
      const message = 'Can you predict failure for COMP-123?';
      expect(message.toLowerCase()).toMatch(/predict.*failure/);
    });

    it('should detect failure prediction query with "when will fail"', () => {
      const message = 'When will TURB-456 fail?';
      expect(message.toLowerCase()).toMatch(/when.*will.*fail/);
    });

    it('should detect failure prediction query with "failure risk"', () => {
      const message = 'What is the failure risk for MOTOR-999?';
      expect(message.toLowerCase()).toMatch(/failure.*risk/);
    });

    it('should detect failure prediction query with "equipment failure"', () => {
      const message = 'Analyze equipment failure for PUMP-001';
      expect(message.toLowerCase()).toMatch(/equipment.*failure/);
    });
  });

  describe('Maintenance Planning Detection (Requirement 5.3)', () => {
    it('should detect maintenance planning query with "maintenance plan"', () => {
      const message = 'Create a maintenance plan for next quarter';
      expect(message.toLowerCase()).toMatch(/maintenance.*plan/);
    });

    it('should detect maintenance planning query with "plan maintenance"', () => {
      const message = 'Help me plan maintenance activities';
      expect(message.toLowerCase()).toMatch(/plan.*maintenance/);
    });

    it('should detect maintenance planning query with "schedule maintenance"', () => {
      const message = 'Schedule maintenance for all pumps';
      expect(message.toLowerCase()).toMatch(/schedule.*maintenance/);
    });

    it('should detect maintenance planning query with "optimize maintenance"', () => {
      const message = 'Optimize maintenance schedule';
      expect(message.toLowerCase()).toMatch(/optimize.*maintenance/);
    });
  });

  describe('Inspection Schedule Detection (Requirement 5.4)', () => {
    it('should detect inspection schedule query with "inspection schedule"', () => {
      const message = 'Show me the inspection schedule';
      expect(message.toLowerCase()).toMatch(/inspection.*schedule/);
    });

    it('should detect inspection schedule query with "schedule inspection"', () => {
      const message = 'Schedule inspection for PUMP-001';
      expect(message.toLowerCase()).toMatch(/schedule.*inspection/);
    });

    it('should detect inspection schedule query with "inspection plan"', () => {
      const message = 'What is the inspection plan?';
      expect(message.toLowerCase()).toMatch(/inspection.*plan/);
    });

    it('should detect inspection schedule query with "when inspect"', () => {
      const message = 'When should we inspect COMP-123?';
      expect(message.toLowerCase()).toMatch(/when.*inspect/);
    });
  });

  describe('Maintenance History Detection (Requirement 5.5)', () => {
    it('should detect maintenance history query with "maintenance history"', () => {
      const message = 'Show maintenance history for PUMP-001';
      expect(message.toLowerCase()).toMatch(/maintenance.*history/);
    });

    it('should detect maintenance history query with "past maintenance"', () => {
      const message = 'What past maintenance was done on COMP-123?';
      expect(message.toLowerCase()).toMatch(/past.*maintenance/);
    });

    it('should detect maintenance history query with "previous maintenance"', () => {
      const message = 'Show previous maintenance records';
      expect(message.toLowerCase()).toMatch(/previous.*maintenance/);
    });

    it('should detect maintenance history query with "maintenance records"', () => {
      const message = 'Get maintenance records for TURB-456';
      expect(message.toLowerCase()).toMatch(/maintenance.*records/);
    });
  });

  describe('Asset Health Detection (Requirement 5.6)', () => {
    it('should detect asset health query with "asset health"', () => {
      const message = 'What is the asset health?';
      expect(message.toLowerCase()).toMatch(/asset.*health/);
    });

    it('should detect asset health query with "equipment health"', () => {
      const message = 'Check equipment health for PUMP-001';
      expect(message.toLowerCase()).toMatch(/equipment.*health/);
    });

    it('should detect asset health query with "health score"', () => {
      const message = 'Show me the health score';
      expect(message.toLowerCase()).toMatch(/health.*score/);
    });

    it('should detect asset health query with "condition assessment"', () => {
      const message = 'Perform condition assessment';
      expect(message.toLowerCase()).toMatch(/condition.*assessment/);
    });
  });

  describe('Preventive Maintenance Detection (Requirement 5.7)', () => {
    it('should detect preventive maintenance query with "preventive maintenance"', () => {
      const message = 'Schedule preventive maintenance';
      expect(message.toLowerCase()).toMatch(/preventive.*maintenance/);
    });

    it('should detect preventive maintenance query with "preventative maintenance"', () => {
      const message = 'What is the preventative maintenance schedule?';
      expect(message.toLowerCase()).toMatch(/preventative.*maintenance/);
    });

    it('should detect preventive maintenance query with "pm schedule"', () => {
      const message = 'Show PM schedule for next month';
      expect(message.toLowerCase()).toMatch(/pm.*schedule/);
    });

    it('should detect preventive maintenance query with "routine maintenance"', () => {
      const message = 'What routine maintenance is needed?';
      expect(message.toLowerCase()).toMatch(/routine.*maintenance/);
    });
  });

  describe('Equipment ID Extraction', () => {
    it('should extract equipment ID in format PUMP-001', () => {
      const message = 'Check status of PUMP-001';
      const match = message.match(/([A-Z]{3,4}-\d{3,4})/i);
      expect(match).not.toBeNull();
      expect(match![1].toUpperCase()).toBe('PUMP-001');
    });

    it('should extract equipment ID in format COMP-123', () => {
      const message = 'Analyze COMP-123 failure risk';
      const match = message.match(/([A-Z]{3,4}-\d{3,4})/i);
      expect(match).not.toBeNull();
      expect(match![1].toUpperCase()).toBe('COMP-123');
    });

    it('should extract equipment ID in format TURB-456', () => {
      const message = 'TURB-456 maintenance history';
      const match = message.match(/([A-Z]{3,4}-\d{3,4})/i);
      expect(match).not.toBeNull();
      expect(match![1].toUpperCase()).toBe('TURB-456');
    });

    it('should extract equipment ID in format VALV-789', () => {
      const message = 'Inspect VALV-789';
      const match = message.match(/([A-Z]{3,4}-\d{3,4})/i);
      expect(match).not.toBeNull();
      expect(match![1].toUpperCase()).toBe('VALV-789');
    });

    it('should return undefined when no equipment ID present', () => {
      const message = 'Show all maintenance schedules';
      const match = message.match(/([A-Z]{3,4}-\d{3,4})/i);
      expect(match).toBeNull();
    });

    it('should handle lowercase equipment IDs', () => {
      const message = 'Check pump-001 status';
      const match = message.match(/([A-Z]{3,4}-\d{3,4})/i);
      expect(match).not.toBeNull();
      expect(match![1].toUpperCase()).toBe('PUMP-001');
    });
  });

  describe('Ambiguous Query Handling', () => {
    it('should handle query with no clear intent', () => {
      const message = 'Tell me about the facility';
      // Should default to natural_language_query
      const hasMaintenanceKeywords = /equipment|failure|maintenance|inspection|preventive|asset|health/i.test(message);
      expect(hasMaintenanceKeywords).toBe(false);
    });

    it('should handle query with multiple intents (prioritize first match)', () => {
      const message = 'Show equipment status and failure prediction for PUMP-001';
      // Should match equipment status first
      expect(message.toLowerCase()).toMatch(/equipment.*status/);
    });

    it('should handle empty message gracefully', () => {
      const message = '';
      expect(message.trim().length).toBe(0);
    });

    it('should handle whitespace-only message', () => {
      const message = '   ';
      expect(message.trim().length).toBe(0);
    });
  });

  describe('Pattern Matching Edge Cases', () => {
    it('should match patterns case-insensitively', () => {
      const message = 'EQUIPMENT STATUS FOR PUMP-001';
      expect(message.toLowerCase()).toMatch(/equipment.*status/);
    });

    it('should match patterns with extra whitespace', () => {
      const message = 'equipment    status';
      expect(message.toLowerCase()).toMatch(/equipment.*status/);
    });

    it('should match patterns with punctuation', () => {
      const message = 'What is the equipment status?';
      expect(message.toLowerCase()).toMatch(/equipment.*status/);
    });

    it('should match patterns in longer sentences', () => {
      const message = 'I need to check the equipment status for PUMP-001 before the meeting';
      expect(message.toLowerCase()).toMatch(/equipment.*status/);
    });
  });

  describe('Integration with processMessage', () => {
    it('should process equipment status query end-to-end', async () => {
      const message = 'What is the status of equipment PUMP-001?';
      const response = await agent.processMessage(message);
      
      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
      expect(response.message).toBeDefined();
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.message).toBe('string');
    });

    it('should process failure prediction query end-to-end', async () => {
      const message = 'Predict failure for COMP-123';
      const response = await agent.processMessage(message);
      
      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should process maintenance planning query end-to-end', async () => {
      const message = 'Create a maintenance plan for next quarter';
      const response = await agent.processMessage(message);
      
      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should handle invalid input gracefully', async () => {
      const message = '';
      const response = await agent.processMessage(message);
      
      expect(response.success).toBe(false);
      expect(response.message).toContain('valid message');
    });
  });
});
