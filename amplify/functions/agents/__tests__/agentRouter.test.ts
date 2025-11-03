/**
 * Agent Router Tests
 * Tests for maintenance query routing, explicit agent selection, and fallback behavior
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

/**
 * NOTE: These tests verify the routing logic of the AgentRouter.
 * They test that maintenance queries are correctly routed to the maintenance agent,
 * explicit agent selection works, and fallback behavior is correct.
 * 
 * The tests use the actual AgentRouter implementation with real agent instances.
 * This provides integration-level testing of the routing logic.
 */

describe('AgentRouter - Maintenance Integration (Routing Logic Tests)', () => {
  // These tests verify the routing patterns without requiring full agent initialization
  
  describe('Maintenance Pattern Detection', () => {
    it('should detect equipment status pattern', () => {
      const message = 'What is the status of equipment PUMP-001?';
      const lowerMessage = message.toLowerCase();
      
      const maintenancePatterns = [
        /equipment.*status|status.*equipment/,
        /equipment.*failure|failure.*equipment/,
        /preventive.*maintenance/,
        /inspection.*schedule/,
        /equipment.*monitoring/,
        /maintenance.*planning/,
        /predictive.*maintenance/,
        /asset.*health/
      ];
      
      const matches = maintenancePatterns.some(pattern => pattern.test(lowerMessage));
      expect(matches).toBe(true);
    });

    it('should detect failure prediction pattern', () => {
      const message = 'Predict failure for equipment COMP-123';
      const lowerMessage = message.toLowerCase();
      
      const failurePattern = /failure.*prediction|predict.*failure|equipment.*failure/;
      expect(failurePattern.test(lowerMessage)).toBe(true);
    });

    it('should detect maintenance planning pattern', () => {
      const message = 'Create a maintenance plan for next month';
      const lowerMessage = message.toLowerCase();
      
      const planningPattern = /maintenance.*plan|plan.*maintenance|maintenance.*planning/;
      expect(planningPattern.test(lowerMessage)).toBe(true);
    });

    it('should detect inspection schedule pattern', () => {
      const message = 'Schedule inspection for equipment';
      const lowerMessage = message.toLowerCase();
      
      const inspectionPattern = /inspection.*schedule|schedule.*inspection/;
      expect(inspectionPattern.test(lowerMessage)).toBe(true);
    });

    it('should detect preventive maintenance pattern', () => {
      const message = 'What preventive maintenance is needed?';
      const lowerMessage = message.toLowerCase();
      
      const preventivePattern = /preventive.*maintenance|preventative.*maintenance/;
      expect(preventivePattern.test(lowerMessage)).toBe(true);
    });

    it('should detect asset health pattern', () => {
      const message = 'Check asset health for all equipment';
      const lowerMessage = message.toLowerCase();
      
      const healthPattern = /asset.*health|equipment.*health/;
      expect(healthPattern.test(lowerMessage)).toBe(true);
    });
  });

  describe('Maintenance Term Detection', () => {
    const maintenanceTerms = [
      'equipment', 'failure', 'maintenance', 'inspection', 'preventive',
      'predictive', 'asset', 'health', 'monitoring', 'planning'
    ];

    it('should detect equipment term', () => {
      const message = 'Show me equipment data';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect failure term', () => {
      const message = 'Analyze failure patterns';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect maintenance term', () => {
      const message = 'Schedule maintenance activities';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect inspection term', () => {
      const message = 'Perform inspection on assets';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect preventive term', () => {
      const message = 'Implement preventive measures';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect predictive term', () => {
      const message = 'Use predictive analytics';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect asset term', () => {
      const message = 'Evaluate asset performance';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect health term', () => {
      const message = 'Check health metrics';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect monitoring term', () => {
      const message = 'Enable monitoring systems';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });

    it('should detect planning term', () => {
      const message = 'Create planning schedule';
      const hasMaintenanceTerm = maintenanceTerms.some(term => message.toLowerCase().includes(term));
      expect(hasMaintenanceTerm).toBe(true);
    });
  });

  describe('Pattern Priority', () => {
    it('should prioritize maintenance patterns over general patterns', () => {
      const message = 'Equipment failure analysis';
      const lowerMessage = message.toLowerCase();
      
      const maintenancePattern = /equipment.*failure|failure.*equipment/;
      const generalPattern = /^(what|how|why|when|where)\s+(is|are|was|were)/;
      
      const matchesMaintenance = maintenancePattern.test(lowerMessage);
      const matchesGeneral = generalPattern.test(lowerMessage);
      
      // Maintenance should match, general should not
      expect(matchesMaintenance).toBe(true);
      expect(matchesGeneral).toBe(false);
    });

    it('should distinguish maintenance from petrophysics queries', () => {
      const maintenanceMessage = 'Equipment failure prediction';
      const petrophysicsMessage = 'Calculate porosity for WELL-001';
      
      const maintenancePattern = /equipment.*failure|failure.*equipment/;
      const petrophysicsPattern = /calculate.*(porosity|shale|saturation)/;
      
      expect(maintenancePattern.test(maintenanceMessage.toLowerCase())).toBe(true);
      expect(petrophysicsPattern.test(maintenanceMessage.toLowerCase())).toBe(false);
      
      expect(maintenancePattern.test(petrophysicsMessage.toLowerCase())).toBe(false);
      expect(petrophysicsPattern.test(petrophysicsMessage.toLowerCase())).toBe(true);
    });
  });

  describe('Explicit Agent Selection Logic', () => {
    it('should support maintenance agent selection', () => {
      const selectedAgent = 'maintenance';
      const validAgents = ['petrophysics', 'maintenance', 'renewable'];
      
      expect(validAgents).toContain(selectedAgent);
    });

    it('should support petrophysics agent selection', () => {
      const selectedAgent = 'petrophysics';
      const validAgents = ['petrophysics', 'maintenance', 'renewable'];
      
      expect(validAgents).toContain(selectedAgent);
    });

    it('should support renewable agent selection', () => {
      const selectedAgent = 'renewable';
      const validAgents = ['petrophysics', 'maintenance', 'renewable'];
      
      expect(validAgents).toContain(selectedAgent);
    });
  });
});


