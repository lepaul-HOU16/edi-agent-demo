/**
 * Unit tests for Intent Classifier
 * Tests deterministic pattern matching for EDIcraft agent queries
 */

import { classifyIntent, generateToolCallMessage, Intent } from '../../amplify/functions/edicraftAgent/intentClassifier';

describe('Intent Classifier', () => {
  describe('classifyIntent', () => {
    describe('wellbore_trajectory intent', () => {
      it('should detect "Build wellbore trajectory for WELL-011"', () => {
        const result = classifyIntent('Build wellbore trajectory for WELL-011');
        expect(result.type).toBe('wellbore_trajectory');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result.parameters.wellId).toBe('WELL-011');
      });

      it('should detect "Visualize wellbore WELL-005"', () => {
        const result = classifyIntent('Visualize wellbore WELL-005');
        expect(result.type).toBe('wellbore_trajectory');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result.parameters.wellId).toBe('WELL-005');
      });

      it('should detect "Show me wellbore WELL-123"', () => {
        const result = classifyIntent('Show me wellbore WELL-123');
        expect(result.type).toBe('wellbore_trajectory');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result.parameters.wellId).toBe('WELL-123');
      });

      it('should extract well ID in uppercase', () => {
        const result = classifyIntent('build well-011');
        expect(result.type).toBe('wellbore_trajectory');
        expect(result.parameters.wellId).toBe('WELL-011');
      });
    });

    describe('horizon_surface intent', () => {
      it('should detect "Build horizon surface"', () => {
        const result = classifyIntent('Build horizon surface');
        expect(result.type).toBe('horizon_surface');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "Visualize horizon"', () => {
        const result = classifyIntent('Visualize horizon');
        expect(result.type).toBe('horizon_surface');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "find a horizon"', () => {
        const result = classifyIntent('find a horizon');
        expect(result.type).toBe('horizon_surface');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "horizon coordinates"', () => {
        const result = classifyIntent('horizon coordinates');
        expect(result.type).toBe('horizon_surface');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should extract horizon name when specified', () => {
        const result = classifyIntent('Show me horizon Top_Reservoir');
        expect(result.type).toBe('horizon_surface');
        expect(result.parameters.horizonName).toBe('Top_Reservoir');
      });
    });

    describe('list_players intent', () => {
      it('should detect "List players"', () => {
        const result = classifyIntent('List players');
        expect(result.type).toBe('list_players');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "Who is online?"', () => {
        const result = classifyIntent('Who is online?');
        expect(result.type).toBe('list_players');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "Show me players"', () => {
        const result = classifyIntent('Show me players');
        expect(result.type).toBe('list_players');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    describe('player_positions intent', () => {
      it('should detect "Where are the players?"', () => {
        const result = classifyIntent('Where are the players?');
        expect(result.type).toBe('player_positions');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "Player positions"', () => {
        const result = classifyIntent('Player positions');
        expect(result.type).toBe('player_positions');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "Show player coordinates"', () => {
        const result = classifyIntent('Show player coordinates');
        expect(result.type).toBe('player_positions');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    describe('system_status intent', () => {
      it('should detect "Hello"', () => {
        const result = classifyIntent('Hello');
        expect(result.type).toBe('system_status');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "What\'s the status?"', () => {
        const result = classifyIntent("What's the status?");
        expect(result.type).toBe('system_status');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should detect "Are you ready?"', () => {
        const result = classifyIntent('Are you ready?');
        expect(result.type).toBe('system_status');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });

      it('should NOT detect system_status when action words are present', () => {
        const result = classifyIntent('Hello, build wellbore WELL-011');
        expect(result.type).not.toBe('system_status');
      });
    });

    describe('unknown intent', () => {
      it('should return unknown for ambiguous queries', () => {
        const result = classifyIntent('What can you do?');
        expect(result.type).toBe('unknown');
        expect(result.confidence).toBe(0.0);
      });

      it('should return unknown for complex natural language', () => {
        const result = classifyIntent('I need help understanding the subsurface data');
        expect(result.type).toBe('unknown');
        expect(result.confidence).toBe(0.0);
      });
    });
  });

  describe('generateToolCallMessage', () => {
    it('should generate wellbore trajectory tool call', () => {
      const intent: Intent = {
        type: 'wellbore_trajectory',
        confidence: 0.95,
        parameters: { wellId: 'WELL-011' }
      };
      const result = generateToolCallMessage(intent);
      expect(result).toBe('DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("WELL-011")');
    });

    it('should generate horizon surface tool call without name', () => {
      const intent: Intent = {
        type: 'horizon_surface',
        confidence: 0.90,
        parameters: {}
      };
      const result = generateToolCallMessage(intent);
      expect(result).toBe('DIRECT_TOOL_CALL: build_horizon_surface_complete(None)');
    });

    it('should generate horizon surface tool call with name', () => {
      const intent: Intent = {
        type: 'horizon_surface',
        confidence: 0.90,
        parameters: { horizonName: 'Top_Reservoir' }
      };
      const result = generateToolCallMessage(intent);
      expect(result).toBe('DIRECT_TOOL_CALL: build_horizon_surface_complete("Top_Reservoir")');
    });

    it('should generate list players tool call', () => {
      const intent: Intent = {
        type: 'list_players',
        confidence: 0.95,
        parameters: {}
      };
      const result = generateToolCallMessage(intent);
      expect(result).toBe('DIRECT_TOOL_CALL: list_players()');
    });

    it('should generate player positions tool call', () => {
      const intent: Intent = {
        type: 'player_positions',
        confidence: 0.95,
        parameters: {}
      };
      const result = generateToolCallMessage(intent);
      expect(result).toBe('DIRECT_TOOL_CALL: get_player_positions()');
    });

    it('should generate system status tool call', () => {
      const intent: Intent = {
        type: 'system_status',
        confidence: 0.90,
        parameters: {}
      };
      const result = generateToolCallMessage(intent);
      expect(result).toBe('DIRECT_TOOL_CALL: get_system_status()');
    });

    it('should throw error for unknown intent', () => {
      const intent: Intent = {
        type: 'unknown',
        confidence: 0.0,
        parameters: {}
      };
      expect(() => generateToolCallMessage(intent)).toThrow('Cannot generate tool call for unknown intent');
    });

    it('should throw error for wellbore trajectory without well ID', () => {
      const intent: Intent = {
        type: 'wellbore_trajectory',
        confidence: 0.95,
        parameters: {}
      };
      expect(() => generateToolCallMessage(intent)).toThrow('Well ID is required');
    });
  });
});
