/**
 * Unit Tests for Agent Router - EDIcraft Integration
 * Tests pattern matching, priority handling, routing decisions, and confidence scoring
 * 
 * Requirements: 6.1 - Agent Router Testing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock agent classes to avoid dependencies
class MockGeneralKnowledgeAgent {
  async processQuery() {
    return { success: true, message: 'General response' };
  }
}

class MockEnhancedStrandsAgent {
  async processMessage() {
    return { success: true, message: 'Petrophysics response' };
  }
}

class MockRenewableProxyAgent {
  async processQuery() {
    return { success: true, message: 'Renewable response' };
  }
}

class MockMaintenanceStrandsAgent {
  async processMessage() {
    return { success: true, message: 'Maintenance response' };
  }
}

class MockEDIcraftAgent {
  async processMessage() {
    return { success: true, message: 'EDIcraft response' };
  }
}

// Simplified AgentRouter for testing (pattern matching logic only)
class TestableAgentRouter {
  private edicraftPatterns = [
    // Core Minecraft patterns
    /minecraft/i,
    
    // Wellbore trajectory patterns
    /wellbore.*trajectory|trajectory.*wellbore/i,
    /build.*wellbore|wellbore.*build/i,
    /osdu.*wellbore/i,
    /3d.*wellbore|wellbore.*path/i,
    
    // Horizon surface patterns
    /horizon.*surface|surface.*horizon/i,
    /build.*horizon|render.*surface/i,
    /osdu.*horizon/i,
    /geological.*surface/i,
    
    // Coordinate and position patterns
    /player.*position/i,
    /coordinate.*tracking/i,
    /transform.*coordinates/i,
    /utm.*minecraft/i,
    
    // Visualization patterns
    /minecraft.*visualization/i,
    /visualize.*minecraft/i,
    /subsurface.*visualization/i,
    /show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i,
    
    // Combined patterns - well log + minecraft (priority over petrophysics)
    /well.*log.*minecraft|log.*minecraft/i,
    /well.*log.*and.*minecraft|minecraft.*and.*well.*log/i
  ];

  private maintenancePatterns = [
    /equipment.*failure|failure.*equipment/,
    /preventive.*maintenance|preventative.*maintenance/,
    /inspection.*schedule|schedule.*inspection/,
    /equipment.*monitoring|monitor.*equipment/,
    /maintenance.*planning|plan.*maintenance/,
    /predictive.*maintenance|predict.*maintenance/,
    /asset.*health|equipment.*health/,
    /equipment.*status|status.*equipment/
  ];

  private petrophysicsPatterns = [
    /well-\d+|WELL-\d+|analyze.*well.*\d+|analyze.*WELL.*\d+/,
    /log.*curves?|well.*logs?|las.*files?/,
    /(gr|rhob|nphi|dtc|cali).*analysis/,
    /gamma.*ray|density|neutron|resistivity.*data/,
    /calculate.*(porosity|shale|saturation|permeability)/,
    /formation.*evaluation|petrophysical.*analysis/
  ];

  private renewablePatterns = [
    /wind.*farm|wind.*turbine|turbine.*layout|wind.*energy/,
    /renewable.*energy|clean.*energy|green.*energy/,
    /terrain.*analysis|analyze.*terrain/,
    /environmental/i,
    /impact.*assessment/i
  ];

  /**
   * Determine which agent should handle the query
   * Returns agent type and matched patterns for testing
   */
  public determineAgentType(message: string): {
    agentType: string;
    matchedPatterns: string[];
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Priority 1: EDIcraft patterns (HIGHEST PRIORITY)
    const matchedEDIcraftPatterns = this.edicraftPatterns.filter(pattern => 
      pattern.test(lowerMessage)
    );
    
    if (matchedEDIcraftPatterns.length > 0) {
      console.log('🎮 EDIcraft pattern matched:', matchedEDIcraftPatterns.map(p => p.source));
      return {
        agentType: 'edicraft',
        matchedPatterns: matchedEDIcraftPatterns.map(p => p.source),
        confidence: this.calculateConfidence(matchedEDIcraftPatterns.length, lowerMessage)
      };
    }
    
    // Priority 2: Maintenance patterns
    const matchedMaintenancePatterns = this.maintenancePatterns.filter(pattern =>
      pattern.test(lowerMessage)
    );
    
    if (matchedMaintenancePatterns.length > 0) {
      console.log('🔧 Maintenance pattern matched:', matchedMaintenancePatterns.map(p => p.source));
      return {
        agentType: 'maintenance',
        matchedPatterns: matchedMaintenancePatterns.map(p => p.source),
        confidence: this.calculateConfidence(matchedMaintenancePatterns.length, lowerMessage)
      };
    }
    
    // Priority 3: Renewable patterns
    const matchedRenewablePatterns = this.renewablePatterns.filter(pattern =>
      pattern.test(lowerMessage)
    );
    
    if (matchedRenewablePatterns.length > 0) {
      console.log('🌱 Renewable pattern matched:', matchedRenewablePatterns.map(p => p.source));
      return {
        agentType: 'renewable',
        matchedPatterns: matchedRenewablePatterns.map(p => p.source),
        confidence: this.calculateConfidence(matchedRenewablePatterns.length, lowerMessage)
      };
    }
    
    // Priority 4: Petrophysics patterns
    const matchedPetrophysicsPatterns = this.petrophysicsPatterns.filter(pattern =>
      pattern.test(lowerMessage)
    );
    
    if (matchedPetrophysicsPatterns.length > 0) {
      console.log('🔬 Petrophysics pattern matched:', matchedPetrophysicsPatterns.map(p => p.source));
      return {
        agentType: 'petrophysics',
        matchedPatterns: matchedPetrophysicsPatterns.map(p => p.source),
        confidence: this.calculateConfidence(matchedPetrophysicsPatterns.length, lowerMessage)
      };
    }
    
    // Default to general
    console.log('🌐 Defaulting to general knowledge agent');
    return {
      agentType: 'general',
      matchedPatterns: [],
      confidence: 0.5
    };
  }

  /**
   * Calculate confidence score based on number of matched patterns and message length
   */
  private calculateConfidence(matchCount: number, message: string): number {
    // Base confidence from match count (0.6 to 1.0)
    const baseConfidence = Math.min(0.6 + (matchCount * 0.1), 1.0);
    
    // Adjust for message specificity (longer, more specific messages get higher confidence)
    const wordCount = message.split(/\s+/).length;
    const specificityBonus = Math.min(wordCount / 50, 0.1);
    
    return Math.min(baseConfidence + specificityBonus, 1.0);
  }
}

describe('AgentRouter - EDIcraft Pattern Matching', () => {
  let router: TestableAgentRouter;

  beforeEach(() => {
    router = new TestableAgentRouter();
  });

  describe('Core Minecraft Patterns', () => {
    it('should route "minecraft" keyword to EDIcraft', () => {
      const result = router.determineAgentType('Show me data in Minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should route "Minecraft" (capitalized) to EDIcraft', () => {
      const result = router.determineAgentType('Display in Minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
    });

    it('should route "MINECRAFT" (uppercase) to EDIcraft', () => {
      const result = router.determineAgentType('Build in MINECRAFT');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Wellbore Trajectory Patterns', () => {
    it('should route "wellbore trajectory" to EDIcraft', () => {
      const result = router.determineAgentType('Show wellbore trajectory');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('wellbore.*trajectory'))).toBe(true);
    });

    it('should route "trajectory wellbore" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('Display trajectory wellbore data');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "build wellbore" to EDIcraft', () => {
      const result = router.determineAgentType('Build wellbore in 3D');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "wellbore build" to EDIcraft', () => {
      const result = router.determineAgentType('Wellbore build visualization');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "OSDU wellbore" to EDIcraft', () => {
      const result = router.determineAgentType('Show OSDU wellbore data');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "3D wellbore" to EDIcraft', () => {
      const result = router.determineAgentType('Create 3D wellbore visualization');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "wellbore path" to EDIcraft', () => {
      const result = router.determineAgentType('Display wellbore path');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Horizon Surface Patterns', () => {
    it('should route "horizon surface" to EDIcraft', () => {
      const result = router.determineAgentType('Show horizon surface');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "surface horizon" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('Display surface horizon data');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "build horizon" to EDIcraft', () => {
      const result = router.determineAgentType('Build horizon in visualization');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "render surface" to EDIcraft', () => {
      const result = router.determineAgentType('Render surface data');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "OSDU horizon" to EDIcraft', () => {
      const result = router.determineAgentType('Show OSDU horizon data');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "geological surface" to EDIcraft', () => {
      const result = router.determineAgentType('Display geological surface');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Coordinate and Position Patterns', () => {
    it('should route "player position" to EDIcraft', () => {
      const result = router.determineAgentType('Track player position');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "coordinate tracking" to EDIcraft', () => {
      const result = router.determineAgentType('Enable coordinate tracking');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "transform coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('Transform coordinates to UTM');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "UTM minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('Convert to UTM minecraft coordinates');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Visualization Patterns', () => {
    it('should route "minecraft visualization" to EDIcraft', () => {
      const result = router.determineAgentType('Create minecraft visualization');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "visualize minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('Visualize data in minecraft');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "subsurface visualization" to EDIcraft', () => {
      const result = router.determineAgentType('Show subsurface visualization');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "show in minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('Show wellbore in minecraft');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "display in minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('Display horizon in minecraft');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "render in minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('Render geological data in minecraft');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Priority Handling - Well Log + Minecraft', () => {
    it('should route "well log minecraft" to EDIcraft (not petrophysics)', () => {
      const result = router.determineAgentType('Show well log data in minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should route "log minecraft" to EDIcraft (not petrophysics)', () => {
      const result = router.determineAgentType('Display log curves in minecraft');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "well log and minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('Show well log and minecraft visualization');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "minecraft and well log" to EDIcraft', () => {
      const result = router.determineAgentType('Create minecraft and well log display');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "well log" WITHOUT minecraft to petrophysics', () => {
      const result = router.determineAgentType('Show well log data for Well-001');
      expect(result.agentType).toBe('petrophysics');
    });

    it('should route "log curves" WITHOUT minecraft to petrophysics', () => {
      const result = router.determineAgentType('Analyze log curves for Well-002');
      expect(result.agentType).toBe('petrophysics');
    });
  });

  describe('Non-EDIcraft Queries', () => {
    it('should NOT route pure petrophysics queries to EDIcraft', () => {
      const result = router.determineAgentType('Calculate porosity for Well-001');
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('petrophysics');
    });

    it('should NOT route renewable energy queries to EDIcraft', () => {
      const result = router.determineAgentType('Analyze wind farm layout');
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('renewable');
    });

    it('should NOT route maintenance queries to EDIcraft', () => {
      const result = router.determineAgentType('Show equipment status');
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('maintenance');
    });

    it('should NOT route general queries to EDIcraft', () => {
      const result = router.determineAgentType('What is the weather today?');
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('general');
    });
  });

  describe('Routing Decision Logging', () => {
    it('should log matched patterns for EDIcraft queries', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const result = router.determineAgentType('Show wellbore in minecraft');
      
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('EDIcraft pattern matched'),
        expect.any(Array)
      );
      
      consoleSpy.mockRestore();
    });

    it('should include pattern sources in matched patterns', () => {
      const result = router.determineAgentType('Build wellbore trajectory in minecraft');
      
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
      expect(result.matchedPatterns.some(p => typeof p === 'string')).toBe(true);
    });

    it('should log when defaulting to general agent', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const result = router.determineAgentType('Hello, how are you?');
      
      expect(result.agentType).toBe('general');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Defaulting to general knowledge agent')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Confidence Scoring', () => {
    it('should have higher confidence for multiple pattern matches', () => {
      const singleMatch = router.determineAgentType('minecraft');
      const multiMatch = router.determineAgentType('Show wellbore trajectory in minecraft with player position');
      
      expect(multiMatch.confidence).toBeGreaterThan(singleMatch.confidence);
    });

    it('should have confidence >= 0.6 for EDIcraft matches', () => {
      const result = router.determineAgentType('Show minecraft visualization');
      
      expect(result.agentType).toBe('edicraft');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it('should have confidence <= 1.0 for all matches', () => {
      const result = router.determineAgentType('Show wellbore trajectory in minecraft with OSDU horizon and player position tracking');
      
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });

    it('should increase confidence for longer, more specific queries', () => {
      const shortQuery = router.determineAgentType('minecraft');
      const longQuery = router.determineAgentType('Show detailed wellbore trajectory visualization in minecraft with OSDU data integration and coordinate tracking');
      
      expect(longQuery.confidence).toBeGreaterThan(shortQuery.confidence);
    });

    it('should have default confidence of 0.5 for general queries', () => {
      const result = router.determineAgentType('Hello');
      
      expect(result.agentType).toBe('general');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('Complex Query Scenarios', () => {
    it('should handle queries with multiple agent keywords (EDIcraft priority)', () => {
      const result = router.determineAgentType('Show well log porosity in minecraft');
      
      // Should route to EDIcraft because minecraft is present (priority over petrophysics)
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle case-insensitive matching', () => {
      const lowercase = router.determineAgentType('minecraft');
      const uppercase = router.determineAgentType('MINECRAFT');
      const mixedcase = router.determineAgentType('MineCraft');
      
      expect(lowercase.agentType).toBe('edicraft');
      expect(uppercase.agentType).toBe('edicraft');
      expect(mixedcase.agentType).toBe('edicraft');
    });

    it('should handle queries with special characters', () => {
      const result = router.determineAgentType('Show wellbore-trajectory in minecraft!');
      
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle very long queries', () => {
      const longQuery = 'I would like to visualize the wellbore trajectory data from the OSDU platform in minecraft with proper coordinate transformation and player position tracking for better subsurface visualization';
      const result = router.determineAgentType(longQuery);
      
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(3);
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = router.determineAgentType('');
      
      expect(result.agentType).toBe('general');
      expect(result.matchedPatterns.length).toBe(0);
    });

    it('should handle whitespace-only string', () => {
      const result = router.determineAgentType('   ');
      
      expect(result.agentType).toBe('general');
    });

    it('should handle single character', () => {
      const result = router.determineAgentType('m');
      
      expect(result.agentType).toBe('general');
    });

    it('should handle queries with only numbers', () => {
      const result = router.determineAgentType('12345');
      
      expect(result.agentType).toBe('general');
    });
  });
});

describe('AgentRouter - Pattern Priority Order', () => {
  let router: TestableAgentRouter;

  beforeEach(() => {
    router = new TestableAgentRouter();
  });

  it('should prioritize EDIcraft over maintenance when both patterns match', () => {
    const result = router.determineAgentType('Show equipment status in minecraft');
    
    // EDIcraft should win because it has higher priority
    expect(result.agentType).toBe('edicraft');
  });

  it('should prioritize EDIcraft over renewable when both patterns match', () => {
    const result = router.determineAgentType('Show wind turbine in minecraft');
    
    // EDIcraft should win because it has higher priority
    expect(result.agentType).toBe('edicraft');
  });

  it('should prioritize EDIcraft over petrophysics when both patterns match', () => {
    const result = router.determineAgentType('Show well log data in minecraft');
    
    // EDIcraft should win because it has higher priority
    expect(result.agentType).toBe('edicraft');
  });

  it('should prioritize maintenance over renewable when no EDIcraft patterns', () => {
    const result = router.determineAgentType('Show equipment status for wind turbine');
    
    // Maintenance should win (higher priority than renewable)
    expect(result.agentType).toBe('maintenance');
  });

  it('should prioritize renewable over petrophysics when no higher priority patterns', () => {
    const result = router.determineAgentType('Analyze wind farm terrain with well data');
    
    // Renewable should win (higher priority than petrophysics)
    expect(result.agentType).toBe('renewable');
  });
});

describe('AgentRouter - Matched Patterns Tracking', () => {
  let router: TestableAgentRouter;

  beforeEach(() => {
    router = new TestableAgentRouter();
  });

  it('should track all matched patterns for a query', () => {
    const result = router.determineAgentType('Show wellbore trajectory in minecraft with player position');
    
    expect(result.matchedPatterns.length).toBeGreaterThanOrEqual(3);
    expect(result.matchedPatterns.some(p => p.includes('minecraft'))).toBe(true);
    expect(result.matchedPatterns.some(p => p.includes('wellbore'))).toBe(true);
    expect(result.matchedPatterns.some(p => p.includes('player'))).toBe(true);
  });

  it('should return empty array for non-matching queries', () => {
    const result = router.determineAgentType('Hello world');
    
    expect(result.matchedPatterns.length).toBe(0);
  });

  it('should track pattern sources as strings', () => {
    const result = router.determineAgentType('minecraft visualization');
    
    expect(result.matchedPatterns.every(p => typeof p === 'string')).toBe(true);
  });
});
