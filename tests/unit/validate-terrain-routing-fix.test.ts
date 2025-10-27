/**
 * Validation test for terrain query routing fix
 * Tests the exact problematic query from the user report
 */

import { ProjectListHandler } from '../../amplify/functions/shared/projectListHandler';

describe('Terrain Query Routing Fix - User Validation', () => {
  describe('Problematic Query from User Report', () => {
    it('should NOT match "Analyze terrain at coordinates 35.067482, -101.395466 in Texas" as project list query', () => {
      const problematicQuery = 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas';
      
      const result = ProjectListHandler.isProjectListQuery(problematicQuery);
      
      expect(result).toBe(false);
    });
  });

  describe('Regression Tests - Legitimate Project List Queries', () => {
    it('should still match legitimate project list queries', () => {
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
  });

  describe('Other Renewable Queries Should Not Match', () => {
    it('should NOT match other renewable energy action queries', () => {
      const actionQueries = [
        'optimize layout for my project',
        'run wake simulation',
        'generate comprehensive report',
        'create wind farm layout',
        'simulate wake effects'
      ];

      actionQueries.forEach(query => {
        const result = ProjectListHandler.isProjectListQuery(query);
        expect(result).toBe(false);
      });
    });
  });
});
