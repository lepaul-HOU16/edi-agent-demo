/**
 * Unit tests for ProjectResolver
 * 
 * Tests:
 * - Explicit reference extraction
 * - Implicit reference resolution
 * - Partial name matching
 * - Ambiguity handling
 */

import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { SessionContext } from '../../amplify/functions/shared/sessionContextManager';

// Mock ProjectStore
const mockProjectStore = {
  list: jest.fn(),
  save: jest.fn(),
  load: jest.fn(),
  findByPartialName: jest.fn(),
  delete: jest.fn(),
  clearCache: jest.fn(),
  getCacheStats: jest.fn()
} as unknown as ProjectStore;

describe('ProjectResolver', () => {
  let resolver: ProjectResolver;
  let sessionContext: SessionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new ProjectResolver(mockProjectStore);
    resolver.clearCache();

    // Default session context
    sessionContext = {
      session_id: 'session-123',
      user_id: 'user-456',
      active_project: 'west-texas-wind-farm',
      project_history: ['west-texas-wind-farm', 'panhandle-wind'],
      last_updated: '2025-01-15T10:00:00Z'
    };

    // Default project list
    (mockProjectStore.list as jest.Mock).mockResolvedValue([
      { project_name: 'west-texas-wind-farm' },
      { project_name: 'east-texas-wind-farm' },
      { project_name: 'panhandle-wind' },
      { project_name: 'amarillo-tx-wind-farm' }
    ]);
  });

  describe('extractExplicitReference()', () => {
    it('should extract "for project {name}" pattern', async () => {
      const query = 'run simulation for project west-texas-wind-farm';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('explicit');
    });

    it('should extract "for {name} project" pattern', async () => {
      const query = 'run simulation for west-texas project';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('explicit');
    });

    it('should extract "project {name}" pattern', async () => {
      const query = 'show me project panhandle-wind';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('panhandle-wind');
      expect(result.confidence).toBe('explicit');
    });

    it('should handle project names with spaces', async () => {
      const query = 'for project west texas wind farm';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
    });

    it('should handle project names at end of query', async () => {
      const query = 'run simulation for project west-texas-wind-farm';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
    });
  });

  describe('implicit reference resolution', () => {
    it('should resolve "that project" to last mentioned', async () => {
      const query = 'run simulation for that project';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm'); // First in history
      expect(result.confidence).toBe('implicit');
    });

    it('should resolve "the project" to active project', async () => {
      const query = 'continue with the project';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('implicit');
    });

    it('should resolve "continue" to active project', async () => {
      const query = 'continue the analysis';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('implicit');
    });

    it('should return null if no history for "that project"', async () => {
      sessionContext.project_history = [];
      sessionContext.active_project = undefined;
      
      const query = 'run simulation for that project';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBeNull();
    });
  });

  describe('partial name matching', () => {
    it('should match partial name', async () => {
      const query = 'run simulation for west texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('partial');
    });

    it('should match single word', async () => {
      const query = 'analyze panhandle area';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('panhandle-wind');
      expect(result.confidence).toBe('partial');
    });

    it('should handle ambiguous matches', async () => {
      const query = 'run simulation for texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.isAmbiguous).toBe(true);
      expect(result.matches).toContain('west-texas-wind-farm');
      expect(result.matches).toContain('east-texas-wind-farm');
    });

    it('should prioritize exact matches', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'texas' },
        { project_name: 'west-texas-wind-farm' }
      ]);

      const query = 'run simulation for texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('texas');
      expect(result.isAmbiguous).toBe(false);
    });

    it('should use fuzzy matching', async () => {
      const query = 'run simulation for panhandle';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('panhandle-wind');
    });
  });

  describe('fallback to active project', () => {
    it('should use active project if no explicit reference', async () => {
      const query = 'run wake simulation';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('active');
    });

    it('should return null if no active project', async () => {
      sessionContext.active_project = undefined;
      
      const query = 'run wake simulation';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBeNull();
      expect(result.confidence).toBe('none');
    });
  });

  describe('ambiguity handling', () => {
    it('should detect ambiguous explicit references', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'texas-1' },
        { project_name: 'texas-2' }
      ]);

      const query = 'for project texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.isAmbiguous).toBe(true);
      expect(result.matches?.length).toBeGreaterThan(1);
    });

    it('should detect ambiguous partial matches', async () => {
      const query = 'run simulation for texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.isAmbiguous).toBe(true);
      expect(result.matches).toContain('west-texas-wind-farm');
      expect(result.matches).toContain('east-texas-wind-farm');
    });

    it('should not be ambiguous with single match', async () => {
      const query = 'run simulation for panhandle';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.isAmbiguous).toBe(false);
      expect(result.projectName).toBe('panhandle-wind');
    });
  });

  describe('confidence levels', () => {
    it('should return explicit confidence for explicit references', async () => {
      const query = 'for project west-texas-wind-farm';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.confidence).toBe('explicit');
    });

    it('should return implicit confidence for implicit references', async () => {
      const query = 'continue with that project';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.confidence).toBe('implicit');
    });

    it('should return partial confidence for partial matches', async () => {
      const query = 'run simulation for west texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.confidence).toBe('partial');
    });

    it('should return active confidence for active project fallback', async () => {
      const query = 'run wake simulation';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.confidence).toBe('active');
    });

    it('should return none confidence when no match', async () => {
      sessionContext.active_project = undefined;
      const query = 'run wake simulation';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.confidence).toBe('none');
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', async () => {
      const query = '';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm'); // Falls back to active
    });

    it('should handle query with only special characters', async () => {
      const query = '!@#$%^&*()';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm'); // Falls back to active
    });

    it('should handle very long project names', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'very-long-project-name-with-many-words-wind-farm' }
      ]);

      const query = 'for project very-long-project-name-with-many-words-wind-farm';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('very-long-project-name-with-many-words-wind-farm');
    });

    it('should handle project names with numbers', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'highway-287-wind-farm' }
      ]);

      const query = 'for project highway-287-wind-farm';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('highway-287-wind-farm');
    });

    it('should handle case-insensitive matching', async () => {
      const query = 'for project WEST-TEXAS-WIND-FARM';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
    });
  });

  describe('cache management', () => {
    it('should cache project list', async () => {
      const query1 = 'for project west-texas-wind-farm';
      await resolver.resolve(query1, sessionContext);
      
      expect((mockProjectStore.list as jest.Mock).mock.calls.length).toBe(1);

      const query2 = 'for project panhandle-wind';
      await resolver.resolve(query2, sessionContext);
      
      // Should still be 1 (used cache)
      expect((mockProjectStore.list as jest.Mock).mock.calls.length).toBe(1);
    });

    it('should clear cache', async () => {
      const query1 = 'for project west-texas-wind-farm';
      await resolver.resolve(query1, sessionContext);
      
      expect((mockProjectStore.list as jest.Mock).mock.calls.length).toBe(1);

      resolver.clearCache();

      const query2 = 'for project panhandle-wind';
      await resolver.resolve(query2, sessionContext);
      
      // Should be 2 (cache was cleared)
      expect((mockProjectStore.list as jest.Mock).mock.calls.length).toBe(2);
    });
  });

  describe('Levenshtein distance', () => {
    it('should match similar names', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'panhandle-wind-farm' }
      ]);

      const query = 'for panhandle wind';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('panhandle-wind-farm');
    });

    it('should not match very different names', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'california-solar-farm' }
      ]);

      sessionContext.active_project = undefined;
      const query = 'for texas wind';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBeNull();
    });
  });

  describe('multiple match scenarios', () => {
    it('should return best match when scores differ significantly', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'west-texas-wind-farm' },
        { project_name: 'texas-wind-farm' },
        { project_name: 'west-wind-farm' }
      ]);

      const query = 'for west texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.isAmbiguous).toBe(false);
    });

    it('should return ambiguous when scores are similar', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'north-texas-wind-farm' },
        { project_name: 'south-texas-wind-farm' }
      ]);

      const query = 'for texas';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.isAmbiguous).toBe(true);
      expect(result.matches?.length).toBe(2);
    });
  });

  describe('integration with session context', () => {
    it('should prefer explicit reference over active project', async () => {
      sessionContext.active_project = 'west-texas-wind-farm';
      
      const query = 'run simulation for project panhandle-wind';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('panhandle-wind');
      expect(result.confidence).toBe('explicit');
    });

    it('should prefer implicit reference over active project', async () => {
      sessionContext.active_project = 'west-texas-wind-farm';
      sessionContext.project_history = ['panhandle-wind', 'amarillo-tx-wind-farm'];
      
      const query = 'run simulation for that project';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('panhandle-wind'); // Most recent in history
      expect(result.confidence).toBe('implicit');
    });

    it('should use active project when no other reference', async () => {
      const query = 'run wake simulation';
      const result = await resolver.resolve(query, sessionContext);
      
      expect(result.projectName).toBe('west-texas-wind-farm');
      expect(result.confidence).toBe('active');
    });
  });
});
