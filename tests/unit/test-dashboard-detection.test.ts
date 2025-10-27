/**
 * Unit Tests for Dashboard Detection
 * 
 * Tests the isProjectDashboardQuery() method to ensure:
 * - Dashboard queries are correctly identified
 * - List queries are NOT identified as dashboard queries
 * - Action queries are NOT identified as dashboard queries
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { ProjectListHandler } from '../../amplify/functions/shared/projectListHandler';

describe('ProjectListHandler.isProjectDashboardQuery', () => {
  
  describe('Dashboard queries (should return true)', () => {
    
    test('should match "show my project dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('show my project dashboard');
      expect(result).toBe(true);
    });

    test('should match "project dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('project dashboard');
      expect(result).toBe(true);
    });

    test('should match "dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('dashboard');
      expect(result).toBe(true);
    });

    test('should match "view dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('view dashboard');
      expect(result).toBe(true);
    });

    test('should match "open dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('open dashboard');
      expect(result).toBe(true);
    });

    test('should match "my dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('my dashboard');
      expect(result).toBe(true);
    });

    test('should match "show project dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('show project dashboard');
      expect(result).toBe(true);
    });

    test('should be case insensitive', () => {
      expect(ProjectListHandler.isProjectDashboardQuery('SHOW MY PROJECT DASHBOARD')).toBe(true);
      expect(ProjectListHandler.isProjectDashboardQuery('Dashboard')).toBe(true);
      expect(ProjectListHandler.isProjectDashboardQuery('PROJECT DASHBOARD')).toBe(true);
    });
  });

  describe('List queries (should return false)', () => {
    
    test('should NOT match "list my projects"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('list my projects');
      expect(result).toBe(false);
    });

    test('should NOT match "list my renewable projects"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('list my renewable projects');
      expect(result).toBe(false);
    });

    test('should NOT match "show my projects"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('show my projects');
      expect(result).toBe(false);
    });
  });

  describe('Action queries (should return false)', () => {
    
    test('should NOT match "analyze terrain"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('analyze terrain');
      expect(result).toBe(false);
    });

    test('should NOT match "optimize layout"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('optimize layout');
      expect(result).toBe(false);
    });

    test('should NOT match "simulate wind farm"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('simulate wind farm');
      expect(result).toBe(false);
    });

    test('should NOT match "generate report"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('generate report');
      expect(result).toBe(false);
    });

    test('should NOT match "create new project"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('create new project');
      expect(result).toBe(false);
    });

    test('should NOT match "run simulation"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('run simulation');
      expect(result).toBe(false);
    });

    test('should NOT match "perform analysis"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('perform analysis');
      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    
    test('should NOT match empty string', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('');
      expect(result).toBe(false);
    });

    test('should NOT match queries with action verbs even if they contain "dashboard"', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('analyze dashboard data');
      expect(result).toBe(false);
    });

    test('should match dashboard with extra words', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('please show me the project dashboard');
      expect(result).toBe(true);
    });

    test('should NOT match "list" even with "dashboard" nearby', () => {
      const result = ProjectListHandler.isProjectDashboardQuery('list projects on dashboard');
      expect(result).toBe(false);
    });
  });

  describe('Requirement validation', () => {
    
    test('Requirement 1.1: Dashboard keyword triggers dashboard intent', () => {
      expect(ProjectListHandler.isProjectDashboardQuery('dashboard')).toBe(true);
      expect(ProjectListHandler.isProjectDashboardQuery('project dashboard')).toBe(true);
    });

    test('Requirement 1.2: "show my project dashboard" returns high confidence', () => {
      expect(ProjectListHandler.isProjectDashboardQuery('show my project dashboard')).toBe(true);
    });

    test('Requirement 1.3: "show my projects" without "dashboard" is NOT dashboard', () => {
      expect(ProjectListHandler.isProjectDashboardQuery('show my projects')).toBe(false);
    });

    test('Requirement 1.4: Dashboard + projects prioritizes dashboard intent', () => {
      expect(ProjectListHandler.isProjectDashboardQuery('show my project dashboard')).toBe(true);
      expect(ProjectListHandler.isProjectDashboardQuery('project dashboard')).toBe(true);
    });
  });
});
