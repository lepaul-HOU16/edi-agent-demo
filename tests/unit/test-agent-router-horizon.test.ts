/**
 * Unit Tests for Agent Router - Horizon Query Pattern Matching
 * Tests horizon-specific patterns to ensure proper routing to EDIcraft agent
 * 
 * Requirements: 5.1 - Horizon Pattern Matching Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

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
    
    // NEW: Horizon finding and naming patterns
    /find.*horizon|horizon.*find/i,
    /get.*horizon|horizon.*name/i,
    /list.*horizon|show.*horizon/i,
    
    // NEW: Coordinate conversion patterns (more flexible)
    /convert.*coordinates|coordinates.*convert/i,
    /convert.*to.*minecraft|minecraft.*convert/i,
    /coordinates.*for.*minecraft|minecraft.*coordinates/i,
    
    // NEW: Combined horizon + coordinate patterns (HIGHEST PRIORITY)
    /horizon.*coordinates|coordinates.*horizon/i,
    /horizon.*minecraft|minecraft.*horizon/i,
    /horizon.*convert|convert.*horizon/i,
    
    // NEW: Natural language patterns
    /tell.*me.*horizon|horizon.*tell.*me/i,
    /what.*horizon|which.*horizon/i,
    /where.*horizon|horizon.*where/i,
    
    // NEW: Coordinate output patterns
    /coordinates.*you.*use|coordinates.*to.*use/i,
    /print.*coordinates|output.*coordinates/i,
    
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

  private petrophysicsPatterns = [
    /well-\d+|WELL-\d+|analyze.*well.*\d+|analyze.*WELL.*\d+/,
    /log.*curves?|well.*logs?|las.*files?/,
    /(gr|rhob|nphi|dtc|cali).*analysis/,
    /gamma.*ray|density|neutron|resistivity.*data/,
    /calculate.*(porosity|shale|saturation|permeability)/,
    /formation.*evaluation|petrophysical.*analysis/
  ];

  /**
   * Determine which agent should handle the query
   * Returns agent type and matched patterns for testing
   */
  public determineAgentType(message: string): {
    agentType: string;
    matchedPatterns: string[];
  } {
    const lowerMessage = message.toLowerCase();
    
    // Priority 1: EDIcraft patterns (HIGHEST PRIORITY)
    const matchedEDIcraftPatterns = this.edicraftPatterns.filter(pattern => 
      pattern.test(lowerMessage)
    );
    
    if (matchedEDIcraftPatterns.length > 0) {
      return {
        agentType: 'edicraft',
        matchedPatterns: matchedEDIcraftPatterns.map(p => p.source)
      };
    }
    
    // Priority 2: Petrophysics patterns
    const matchedPetrophysicsPatterns = this.petrophysicsPatterns.filter(pattern =>
      pattern.test(lowerMessage)
    );
    
    if (matchedPetrophysicsPatterns.length > 0) {
      return {
        agentType: 'petrophysics',
        matchedPatterns: matchedPetrophysicsPatterns.map(p => p.source)
      };
    }
    
    // Default to general
    return {
      agentType: 'general',
      matchedPatterns: []
    };
  }
}

describe('AgentRouter - Horizon Query Pattern Matching', () => {
  let router: TestableAgentRouter;

  beforeEach(() => {
    router = new TestableAgentRouter();
  });

  describe('Simple Horizon Finding Patterns', () => {
    it('should route "find a horizon" to EDIcraft', () => {
      const result = router.determineAgentType('find a horizon');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
      expect(result.matchedPatterns.some(p => p.includes('find.*horizon'))).toBe(true);
    });

    it('should route "horizon find" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('horizon find operation');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('horizon.*find'))).toBe(true);
    });

    it('should route "find horizon data" to EDIcraft', () => {
      const result = router.determineAgentType('find horizon data');
      expect(result.agentType).toBe('edicraft');
    });

    it('should route "find the horizon" to EDIcraft', () => {
      const result = router.determineAgentType('find the horizon');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Horizon Name Patterns', () => {
    it('should route "horizon name" to EDIcraft', () => {
      const result = router.determineAgentType('tell me the horizon name');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => 
        p.includes('horizon.*name') || p.includes('tell.*me.*horizon')
      )).toBe(true);
    });

    it('should route "get horizon" to EDIcraft', () => {
      const result = router.determineAgentType('get horizon information');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('get.*horizon'))).toBe(true);
    });

    it('should route "show horizon" to EDIcraft', () => {
      const result = router.determineAgentType('show horizon details');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('show.*horizon'))).toBe(true);
    });

    it('should route "list horizon" to EDIcraft', () => {
      const result = router.determineAgentType('list horizon data');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('list.*horizon'))).toBe(true);
    });
  });

  describe('Coordinate Conversion Patterns', () => {
    it('should route "convert to minecraft coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('convert to minecraft coordinates');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => 
        p.includes('convert.*to.*minecraft') || p.includes('minecraft.*coordinates')
      )).toBe(true);
    });

    it('should route "convert coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('convert coordinates to minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('convert.*coordinates'))).toBe(true);
    });

    it('should route "coordinates convert" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('coordinates convert to minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('coordinates.*convert'))).toBe(true);
    });

    it('should route "minecraft convert" to EDIcraft', () => {
      const result = router.determineAgentType('minecraft convert coordinates');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('minecraft.*convert'))).toBe(true);
    });

    it('should route "coordinates for minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('get coordinates for minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('coordinates.*for.*minecraft'))).toBe(true);
    });
  });

  describe('Combined Horizon + Coordinate Patterns', () => {
    it('should route "horizon coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('show horizon coordinates');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('horizon.*coordinates'))).toBe(true);
    });

    it('should route "coordinates horizon" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('get coordinates for horizon');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('coordinates.*horizon'))).toBe(true);
    });

    it('should route "horizon minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('show horizon in minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('horizon.*minecraft'))).toBe(true);
    });

    it('should route "minecraft horizon" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('display minecraft horizon data');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('minecraft.*horizon'))).toBe(true);
    });

    it('should route "horizon convert" to EDIcraft', () => {
      const result = router.determineAgentType('horizon convert to coordinates');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('horizon.*convert'))).toBe(true);
    });

    it('should route "convert horizon" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('convert horizon to minecraft');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('convert.*horizon'))).toBe(true);
    });
  });

  describe('Natural Language Horizon Patterns', () => {
    it('should route "tell me about horizon" to EDIcraft', () => {
      const result = router.determineAgentType('tell me about the horizon');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('tell.*me.*horizon'))).toBe(true);
    });

    it('should route "horizon tell me" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('for the horizon tell me the details');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('horizon.*tell.*me'))).toBe(true);
    });

    it('should route "what horizon" to EDIcraft', () => {
      const result = router.determineAgentType('what horizon is available');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('what.*horizon'))).toBe(true);
    });

    it('should route "which horizon" to EDIcraft', () => {
      const result = router.determineAgentType('which horizon should I use');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('which.*horizon'))).toBe(true);
    });

    it('should route "where horizon" to EDIcraft', () => {
      const result = router.determineAgentType('where is the horizon located');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('where.*horizon'))).toBe(true);
    });

    it('should route "horizon where" (reversed) to EDIcraft', () => {
      const result = router.determineAgentType('the horizon where we need data');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('horizon.*where'))).toBe(true);
    });
  });

  describe('Coordinate Output Patterns', () => {
    it('should route "coordinates you use" to EDIcraft', () => {
      const result = router.determineAgentType('show me the coordinates you use');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('coordinates.*you.*use'))).toBe(true);
    });

    it('should route "coordinates to use" to EDIcraft', () => {
      const result = router.determineAgentType('what are the coordinates to use');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('coordinates.*to.*use'))).toBe(true);
    });

    it('should route "print coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('print out the coordinates');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('print.*coordinates'))).toBe(true);
    });

    it('should route "output coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('output the coordinates');
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('output.*coordinates'))).toBe(true);
    });
  });

  describe('Complex User Query (Actual User Request)', () => {
    it('should route complex horizon query to EDIcraft', () => {
      const complexQuery = 'find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you\'d use to show it in minecraft';
      const result = router.determineAgentType(complexQuery);
      
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(3);
      
      // Should match multiple patterns
      expect(result.matchedPatterns.some(p => p.includes('find.*horizon'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('tell.*me.*horizon') || p.includes('horizon.*name'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('convert.*to.*minecraft') || p.includes('minecraft.*coordinates'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('coordinates.*you.*use') || p.includes('print.*coordinates'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('minecraft'))).toBe(true);
    });

    it('should route "find horizon and convert to minecraft" to EDIcraft', () => {
      const result = router.determineAgentType('find a horizon and convert it to minecraft coordinates');
      
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('find.*horizon'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('convert.*to.*minecraft'))).toBe(true);
    });

    it('should route "show horizon name and minecraft coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('show me the horizon name and minecraft coordinates');
      
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('show.*horizon'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('minecraft.*coordinates'))).toBe(true);
    });

    it('should route "get horizon, convert coordinates, print coordinates" to EDIcraft', () => {
      const result = router.determineAgentType('get the horizon data, convert the coordinates, and print the coordinates');
      
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.some(p => p.includes('get.*horizon'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('convert.*coordinates'))).toBe(true);
      expect(result.matchedPatterns.some(p => p.includes('print.*coordinates'))).toBe(true);
    });
  });

  describe('Horizon Queries Should NOT Route to Petrophysics', () => {
    it('should NOT route "find a horizon" to petrophysics', () => {
      const result = router.determineAgentType('find a horizon');
      
      expect(result.agentType).not.toBe('petrophysics');
      expect(result.agentType).toBe('edicraft');
    });

    it('should NOT route "horizon name" to petrophysics', () => {
      const result = router.determineAgentType('tell me the horizon name');
      
      expect(result.agentType).not.toBe('petrophysics');
      expect(result.agentType).toBe('edicraft');
    });

    it('should NOT route "convert to minecraft coordinates" to petrophysics', () => {
      const result = router.determineAgentType('convert to minecraft coordinates');
      
      expect(result.agentType).not.toBe('petrophysics');
      expect(result.agentType).toBe('edicraft');
    });

    it('should NOT route complex horizon query to petrophysics', () => {
      const complexQuery = 'find a horizon, tell me its name, convert it to minecraft coordinates';
      const result = router.determineAgentType(complexQuery);
      
      expect(result.agentType).not.toBe('petrophysics');
      expect(result.agentType).toBe('edicraft');
    });

    it('should NOT route "horizon coordinates" to petrophysics', () => {
      const result = router.determineAgentType('show me the horizon coordinates');
      
      expect(result.agentType).not.toBe('petrophysics');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle lowercase horizon queries', () => {
      const result = router.determineAgentType('find a horizon');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle uppercase horizon queries', () => {
      const result = router.determineAgentType('FIND A HORIZON');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle mixed case horizon queries', () => {
      const result = router.determineAgentType('Find A Horizon');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle lowercase minecraft', () => {
      const result = router.determineAgentType('convert to minecraft coordinates');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle uppercase MINECRAFT', () => {
      const result = router.determineAgentType('CONVERT TO MINECRAFT COORDINATES');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle mixed case Minecraft', () => {
      const result = router.determineAgentType('Convert To Minecraft Coordinates');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Edge Cases', () => {
    it('should handle horizon query with extra whitespace', () => {
      const result = router.determineAgentType('find   a   horizon');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle horizon query with punctuation', () => {
      const result = router.determineAgentType('find a horizon, please!');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle horizon query with special characters', () => {
      const result = router.determineAgentType('find a horizon - convert to minecraft');
      expect(result.agentType).toBe('edicraft');
    });

    it('should handle very long horizon query', () => {
      const longQuery = 'I would like to find a horizon in the subsurface data, tell me its name and properties, convert it to minecraft coordinates, and print out the coordinates you would use to show it in minecraft for visualization purposes';
      const result = router.determineAgentType(longQuery);
      
      expect(result.agentType).toBe('edicraft');
      expect(result.matchedPatterns.length).toBeGreaterThan(5);
    });

    it('should handle horizon query with numbers', () => {
      const result = router.determineAgentType('find horizon 1 and convert to minecraft');
      expect(result.agentType).toBe('edicraft');
    });
  });

  describe('Pattern Matching Specificity', () => {
    it('should match multiple patterns for comprehensive queries', () => {
      const result = router.determineAgentType('find a horizon, tell me its name, convert to minecraft coordinates, and print the output');
      
      // Should match at least 5 different patterns
      expect(result.matchedPatterns.length).toBeGreaterThanOrEqual(5);
    });

    it('should match single pattern for simple queries', () => {
      const result = router.determineAgentType('find a horizon');
      
      // Should match at least 1 pattern
      expect(result.matchedPatterns.length).toBeGreaterThanOrEqual(1);
    });

    it('should return pattern sources as strings', () => {
      const result = router.determineAgentType('find a horizon');
      
      expect(result.matchedPatterns.every(p => typeof p === 'string')).toBe(true);
    });

    it('should include regex source in matched patterns', () => {
      const result = router.determineAgentType('find a horizon');
      
      expect(result.matchedPatterns.some(p => p.includes('find') && p.includes('horizon'))).toBe(true);
    });
  });

  describe('Non-Horizon Queries Should Not Match', () => {
    it('should NOT route pure petrophysics query to EDIcraft', () => {
      const result = router.determineAgentType('calculate porosity for Well-001');
      
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('petrophysics');
    });

    it('should NOT route well log query without minecraft to EDIcraft', () => {
      const result = router.determineAgentType('show well log data');
      
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('petrophysics');
    });

    it('should NOT route general query to EDIcraft', () => {
      const result = router.determineAgentType('what is the weather today');
      
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('general');
    });

    it('should NOT route empty string to EDIcraft', () => {
      const result = router.determineAgentType('');
      
      expect(result.agentType).not.toBe('edicraft');
      expect(result.agentType).toBe('general');
    });
  });
});
