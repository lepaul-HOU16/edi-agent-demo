/**
 * Unit Test: Action Button Generation in formatArtifacts
 * 
 * Task 6: Implement action button generation in formatArtifacts
 * 
 * This test verifies that the formatArtifacts function correctly:
 * 1. Calls generateActionButtons() for each artifact
 * 2. Passes artifact type, project name, and project data
 * 3. Includes actions array in artifact object
 * 4. Logs action button generation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the action button types module
const mockGenerateActionButtons = jest.fn();
jest.mock('../../amplify/functions/shared/actionButtonTypes', () => ({
  generateActionButtons: mockGenerateActionButtons,
  generateNextStepSuggestion: jest.fn(),
  formatProjectStatusChecklist: jest.fn()
}));

describe('Action Button Generation in formatArtifacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Terrain Analysis Artifact', () => {
    it('should generate action buttons for terrain analysis', () => {
      const mockResults = [
        {
          success: true,
          type: 'terrain_analysis',
          data: {
            coordinates: { latitude: 35.0, longitude: -101.0 },
            projectId: 'test-project',
            geojson: { type: 'FeatureCollection', features: [] },
            message: 'Terrain analysis complete'
          }
        }
      ];

      const mockActions = [
        { label: 'Optimize Turbine Layout', query: 'optimize layout for test-project', icon: 'settings', primary: true },
        { label: 'View Project Details', query: 'show project test-project', icon: 'status-info' }
      ];

      mockGenerateActionButtons.mockReturnValue(mockActions);

      // Import the function after mocking
      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'terrain_analysis', 'test-project', {});

      // Verify generateActionButtons was called
      expect(mockGenerateActionButtons).toHaveBeenCalledWith(
        'terrain_analysis',
        'test-project',
        {}
      );

      // Verify artifact includes actions
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].actions).toEqual(mockActions);
      expect(artifacts[0].type).toBe('wind_farm_terrain_analysis');
    });

    it('should not generate actions when project name is missing', () => {
      const mockResults = [
        {
          success: true,
          type: 'terrain_analysis',
          data: {
            coordinates: { latitude: 35.0, longitude: -101.0 },
            projectId: 'test-project',
            geojson: { type: 'FeatureCollection', features: [] },
            message: 'Terrain analysis complete'
          }
        }
      ];

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'terrain_analysis', undefined, {});

      // Verify generateActionButtons was NOT called
      expect(mockGenerateActionButtons).not.toHaveBeenCalled();

      // Verify artifact has no actions
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].actions).toBeUndefined();
    });
  });

  describe('Layout Optimization Artifact', () => {
    it('should generate action buttons for layout optimization', () => {
      const mockResults = [
        {
          success: true,
          type: 'layout_optimization',
          data: {
            projectId: 'test-project',
            turbineCount: 10,
            totalCapacity: 25,
            layoutType: 'grid',
            geojson: { type: 'FeatureCollection', features: [] },
            message: 'Layout optimization complete'
          }
        }
      ];

      const mockActions = [
        { label: 'Run Wake Simulation', query: 'run wake simulation for test-project', icon: 'refresh', primary: true },
        { label: 'Adjust Layout', query: 'optimize layout for test-project with different spacing', icon: 'edit' }
      ];

      mockGenerateActionButtons.mockReturnValue(mockActions);

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'layout_optimization', 'test-project', {});

      // Verify generateActionButtons was called with correct artifact type
      expect(mockGenerateActionButtons).toHaveBeenCalledWith(
        'layout_optimization',
        'test-project',
        {}
      );

      // Verify artifact includes actions
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].actions).toEqual(mockActions);
      expect(artifacts[0].type).toBe('wind_farm_layout');
    });
  });

  describe('Wake Simulation Artifact', () => {
    it('should generate action buttons for wake simulation', () => {
      const mockResults = [
        {
          success: true,
          type: 'wake_simulation',
          data: {
            projectId: 'test-project',
            performanceMetrics: { netAEP: 100 },
            turbineMetrics: { count: 10 },
            message: 'Wake simulation complete'
          }
        }
      ];

      const mockActions = [
        { label: 'Generate Report', query: 'generate report for test-project', icon: 'file', primary: true },
        { label: 'View Performance Dashboard', query: 'show performance dashboard for test-project', icon: 'view-full' },
        { label: 'Compare Scenarios', query: 'create alternative layout for test-project', icon: 'copy' }
      ];

      mockGenerateActionButtons.mockReturnValue(mockActions);

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'wake_simulation', 'test-project', {});

      // Verify generateActionButtons was called
      expect(mockGenerateActionButtons).toHaveBeenCalledWith(
        'wake_simulation',
        'test-project',
        {}
      );

      // Verify artifact includes actions
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].actions).toEqual(mockActions);
      expect(artifacts[0].type).toBe('wake_simulation');
    });
  });

  describe('Report Generation Artifact', () => {
    it('should generate action buttons for report generation', () => {
      const mockResults = [
        {
          success: true,
          type: 'report_generation',
          data: {
            projectId: 'test-project',
            executiveSummary: 'Summary',
            recommendations: ['Rec 1'],
            message: 'Report generated'
          }
        }
      ];

      const mockActions = [
        { label: 'Start New Project', query: 'analyze terrain at [coordinates]', icon: 'add-plus', primary: true },
        { label: 'View All Projects', query: 'list my renewable projects', icon: 'folder' }
      ];

      mockGenerateActionButtons.mockReturnValue(mockActions);

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'report_generation', 'test-project', {});

      // Verify generateActionButtons was called
      expect(mockGenerateActionButtons).toHaveBeenCalledWith(
        'report_generation',
        'test-project',
        {}
      );

      // Verify artifact includes actions
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].actions).toEqual(mockActions);
      expect(artifacts[0].type).toBe('wind_farm_report');
    });
  });

  describe('Wind Rose Analysis Artifact', () => {
    it('should generate action buttons for wind rose analysis', () => {
      const mockResults = [
        {
          success: true,
          type: 'wind_rose_analysis',
          data: {
            projectId: 'test-project',
            coordinates: { latitude: 35.0, longitude: -101.0 },
            windRoseData: {},
            message: 'Wind rose analysis complete'
          }
        }
      ];

      const mockActions = [
        { label: 'Generate Report', query: 'generate report for test-project', icon: 'file', primary: true },
        { label: 'View Performance Dashboard', query: 'show performance dashboard for test-project', icon: 'view-full' }
      ];

      mockGenerateActionButtons.mockReturnValue(mockActions);

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'wind_rose_analysis', 'test-project', {});

      // Verify generateActionButtons was called
      expect(mockGenerateActionButtons).toHaveBeenCalledWith(
        'wind_rose_analysis',
        'test-project',
        {}
      );

      // Verify artifact includes actions
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].actions).toEqual(mockActions);
      expect(artifacts[0].type).toBe('wind_rose_analysis');
    });
  });

  describe('Multiple Artifacts', () => {
    it('should generate action buttons for each artifact', () => {
      const mockResults = [
        {
          success: true,
          type: 'terrain_analysis',
          data: {
            projectId: 'test-project',
            geojson: { type: 'FeatureCollection', features: [] },
            message: 'Terrain complete'
          }
        },
        {
          success: true,
          type: 'layout_optimization',
          data: {
            projectId: 'test-project',
            turbineCount: 10,
            totalCapacity: 25,
            geojson: { type: 'FeatureCollection', features: [] },
            message: 'Layout complete'
          }
        }
      ];

      const mockTerrainActions = [
        { label: 'Optimize Layout', query: 'optimize layout', icon: 'settings', primary: true }
      ];

      const mockLayoutActions = [
        { label: 'Run Simulation', query: 'run simulation', icon: 'refresh', primary: true }
      ];

      mockGenerateActionButtons
        .mockReturnValueOnce(mockTerrainActions)
        .mockReturnValueOnce(mockLayoutActions);

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'terrain_analysis', 'test-project', {});

      // Verify generateActionButtons was called twice
      expect(mockGenerateActionButtons).toHaveBeenCalledTimes(2);

      // Verify both artifacts have actions
      expect(artifacts).toHaveLength(2);
      expect(artifacts[0].actions).toEqual(mockTerrainActions);
      expect(artifacts[1].actions).toEqual(mockLayoutActions);
    });
  });

  describe('Project Status Context', () => {
    it('should pass project status to generateActionButtons', () => {
      const mockResults = [
        {
          success: true,
          type: 'terrain_analysis',
          data: {
            projectId: 'test-project',
            geojson: { type: 'FeatureCollection', features: [] },
            message: 'Terrain complete'
          }
        }
      ];

      const projectStatus = {
        terrain: true,
        layout: false,
        simulation: false,
        report: false
      };

      mockGenerateActionButtons.mockReturnValue([]);

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      formatArtifacts(mockResults, 'terrain_analysis', 'test-project', projectStatus);

      // Verify project status was passed
      expect(mockGenerateActionButtons).toHaveBeenCalledWith(
        'terrain_analysis',
        'test-project',
        projectStatus
      );
    });
  });

  describe('Failed Results', () => {
    it('should not generate actions for failed results', () => {
      const mockResults = [
        {
          success: false,
          type: 'terrain_analysis',
          data: {},
          error: 'Analysis failed'
        }
      ];

      const { formatArtifacts } = require('../../amplify/functions/renewableOrchestrator/handler');

      const artifacts = formatArtifacts(mockResults, 'terrain_analysis', 'test-project', {});

      // Verify generateActionButtons was NOT called
      expect(mockGenerateActionButtons).not.toHaveBeenCalled();

      // Verify no artifacts returned
      expect(artifacts).toHaveLength(0);
    });
  });
});
