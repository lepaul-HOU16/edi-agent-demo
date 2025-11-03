/**
 * Unit tests for ProjectListHandler pattern matching
 * Tests the fix for terrain query routing bug
 */

import { ProjectListHandler } from '../../amplify/functions/shared/projectListHandler';

describe('ProjectListHandler Pattern Matching', () => {
  describe('isProjectListQuery', () => {
    it('should match legitimate project list queries', () => {
      const validQueries = [
        'list my projects',
        'show my renewable projects',
        'what projects do I have',
        'view my projects',
        'see all my projects'
      ];
      
      validQueries.forEach(query => {
        const result = ProjectListHandler.isProjectListQuery(query);
        expect(result).toBe(true);
      });
    });
    
    it('should NOT match terrain analysis queries', () => {
      const terrainQueries = [
        'Analyze terrain at coordinates 35.067482, -101.395466 in Texas',
        'analyze terrain at 40.7128, -74.0060',
        'perform terrain analysis for location 51.5074, -0.1278'
      ];
      
      terrainQueries.forEach(query => {
        const result = ProjectListHandler.isProjectListQuery(query);
        expect(result).toBe(false);
      });
    });
    
    it('should NOT match other renewable energy queries with action verbs', () => {
      const renewableQueries = [
        'optimize layout for my project',
        'run wake simulation',
        'generate comprehensive report',
        'create wind farm layout',
        'simulate wake effects'
      ];
      
      renewableQueries.forEach(query => {
        const result = ProjectListHandler.isProjectListQuery(query);
        expect(result).toBe(false);
      });
    });

    it('should reject queries containing action verbs even if they match patterns', () => {
      // These queries might match the pattern but should be rejected due to action verbs
      const ambiguousQueries = [
        'analyze my projects',
        'optimize my projects',
        'simulate my projects'
      ];
      
      ambiguousQueries.forEach(query => {
        const result = ProjectListHandler.isProjectListQuery(query);
        expect(result).toBe(false);
      });
    });
  });
  
  describe('isProjectDetailsQuery', () => {
    it('should match project details queries with project name', () => {
      const result = ProjectListHandler.isProjectDetailsQuery('show project claude-texas-wind-farm-10');
      expect(result.isMatch).toBe(true);
      expect(result.projectName).toBe('claude-texas-wind-farm-10');
    });
    
    it('should match various project details patterns', () => {
      const queries = [
        { query: 'details for project my-wind-farm', expected: 'my-wind-farm' },
        { query: 'project test-123 details', expected: 'test-123' },
        { query: 'view project abc-def-456', expected: 'abc-def-456' },
        { query: 'info about project solar-farm-1', expected: 'solar-farm-1' },
        { query: 'status of project wind-project-2', expected: 'wind-project-2' }
      ];
      
      queries.forEach(({ query, expected }) => {
        const result = ProjectListHandler.isProjectDetailsQuery(query);
        expect(result.isMatch).toBe(true);
        expect(result.projectName).toBe(expected);
      });
    });
    
    it('should NOT match queries without "project" keyword', () => {
      const result = ProjectListHandler.isProjectDetailsQuery('show claude-texas-wind-farm-10');
      expect(result.isMatch).toBe(false);
    });

    it('should NOT match queries without project name', () => {
      const result = ProjectListHandler.isProjectDetailsQuery('show project');
      expect(result.isMatch).toBe(false);
    });
  });
});
