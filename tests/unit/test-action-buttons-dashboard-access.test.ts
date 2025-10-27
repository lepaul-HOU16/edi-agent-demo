/**
 * Unit Test: Enhanced Action Button Generation with Dashboard Access
 * 
 * Task 7: Enhance generateActionButtons with dashboard access
 * 
 * This test verifies that generateActionButtons correctly generates:
 * - Terrain analysis: "Optimize Layout" (primary) + "View Dashboard" (secondary)
 * - Wind farm layout: "Run Wake Simulation" (primary) + "View Dashboard" + "Refine Layout"
 * - Wake simulation: "Generate Report" (primary) + "View Dashboard" + "Financial Analysis" + "Optimize Layout"
 * - Report generation: "View Dashboard" (primary) + "Export Report"
 */

import { describe, it, expect } from '@jest/globals';
import { generateActionButtons, ActionButton } from '../../amplify/functions/shared/actionButtonTypes';

describe('Enhanced Action Button Generation with Dashboard Access', () => {
  describe('Terrain Analysis Buttons', () => {
    it('should generate correct buttons for terrain_analysis', () => {
      const buttons = generateActionButtons('terrain_analysis', 'test-project');
      
      expect(buttons).toHaveLength(2);
      
      // Primary button: Optimize Layout
      expect(buttons[0]).toEqual({
        label: 'Optimize Layout',
        query: 'optimize turbine layout for test-project',
        icon: 'settings',
        primary: true
      });
      
      // Secondary button: View Dashboard
      expect(buttons[1]).toEqual({
        label: 'View Dashboard',
        query: 'show project dashboard for test-project',
        icon: 'status-info',
        primary: false
      });
    });

    it('should generate correct buttons for wind_farm_terrain_analysis', () => {
      const buttons = generateActionButtons('wind_farm_terrain_analysis', 'my-wind-farm');
      
      expect(buttons).toHaveLength(2);
      expect(buttons[0].label).toBe('Optimize Layout');
      expect(buttons[0].primary).toBe(true);
      expect(buttons[1].label).toBe('View Dashboard');
      expect(buttons[1].primary).toBe(false);
    });

    it('should handle missing project name for terrain analysis', () => {
      const buttons = generateActionButtons('terrain_analysis');
      
      expect(buttons).toHaveLength(2);
      expect(buttons[0].query).toBe('optimize turbine layout');
      expect(buttons[1].query).toBe('show project dashboard');
    });
  });

  describe('Wind Farm Layout Buttons', () => {
    it('should generate correct buttons for layout_optimization', () => {
      const buttons = generateActionButtons('layout_optimization', 'test-project');
      
      expect(buttons).toHaveLength(3);
      
      // Primary button: Run Wake Simulation
      expect(buttons[0]).toEqual({
        label: 'Run Wake Simulation',
        query: 'run wake simulation for test-project',
        icon: 'refresh',
        primary: true
      });
      
      // Secondary button: View Dashboard
      expect(buttons[1]).toEqual({
        label: 'View Dashboard',
        query: 'show project dashboard for test-project',
        icon: 'status-info',
        primary: false
      });
      
      // Tertiary button: Refine Layout
      expect(buttons[2]).toEqual({
        label: 'Refine Layout',
        query: 'optimize turbine layout with different spacing for test-project',
        icon: 'settings',
        primary: false
      });
    });

    it('should generate correct buttons for wind_farm_layout', () => {
      const buttons = generateActionButtons('wind_farm_layout', 'my-wind-farm');
      
      expect(buttons).toHaveLength(3);
      expect(buttons[0].label).toBe('Run Wake Simulation');
      expect(buttons[0].primary).toBe(true);
      expect(buttons[1].label).toBe('View Dashboard');
      expect(buttons[2].label).toBe('Refine Layout');
    });

    it('should handle missing project name for layout optimization', () => {
      const buttons = generateActionButtons('wind_farm_layout');
      
      expect(buttons).toHaveLength(3);
      expect(buttons[0].query).toBe('run wake simulation');
      expect(buttons[1].query).toBe('show project dashboard');
      expect(buttons[2].query).toBe('optimize turbine layout with different spacing');
    });
  });

  describe('Wake Simulation Buttons', () => {
    it('should generate correct buttons for wake_simulation', () => {
      const buttons = generateActionButtons('wake_simulation', 'test-project');
      
      expect(buttons).toHaveLength(4);
      
      // Primary button: Generate Report
      expect(buttons[0]).toEqual({
        label: 'Generate Report',
        query: 'generate comprehensive executive report for test-project',
        icon: 'file',
        primary: true
      });
      
      // Secondary button: View Dashboard
      expect(buttons[1]).toEqual({
        label: 'View Dashboard',
        query: 'show project dashboard for test-project',
        icon: 'status-info',
        primary: false
      });
      
      // Tertiary button: Financial Analysis
      expect(buttons[2]).toEqual({
        label: 'Financial Analysis',
        query: 'perform financial analysis and ROI calculation for test-project',
        icon: 'calculator',
        primary: false
      });
      
      // Quaternary button: Optimize Layout
      expect(buttons[3]).toEqual({
        label: 'Optimize Layout',
        query: 'optimize turbine layout to reduce wake losses for test-project',
        icon: 'settings',
        primary: false
      });
    });

    it('should generate correct buttons for wind_rose_analysis', () => {
      const buttons = generateActionButtons('wind_rose_analysis', 'my-wind-farm');
      
      expect(buttons).toHaveLength(4);
      expect(buttons[0].label).toBe('Generate Report');
      expect(buttons[0].primary).toBe(true);
      expect(buttons[1].label).toBe('View Dashboard');
      expect(buttons[2].label).toBe('Financial Analysis');
      expect(buttons[3].label).toBe('Optimize Layout');
    });

    it('should handle missing project name for wake simulation', () => {
      const buttons = generateActionButtons('wake_simulation');
      
      expect(buttons).toHaveLength(4);
      expect(buttons[0].query).toBe('generate comprehensive executive report');
      expect(buttons[1].query).toBe('show project dashboard');
      expect(buttons[2].query).toBe('perform financial analysis and ROI calculation');
      expect(buttons[3].query).toBe('optimize turbine layout to reduce wake losses');
    });
  });

  describe('Report Generation Buttons', () => {
    it('should generate correct buttons for report_generation', () => {
      const buttons = generateActionButtons('report_generation', 'test-project');
      
      expect(buttons).toHaveLength(2);
      
      // Primary button: View Dashboard (primary after report)
      expect(buttons[0]).toEqual({
        label: 'View Dashboard',
        query: 'show project dashboard for test-project',
        icon: 'status-info',
        primary: true
      });
      
      // Secondary button: Export Report
      expect(buttons[1]).toEqual({
        label: 'Export Report',
        query: 'export project report as PDF for test-project',
        icon: 'download',
        primary: false
      });
    });

    it('should generate correct buttons for financial_analysis', () => {
      const buttons = generateActionButtons('financial_analysis', 'my-wind-farm');
      
      expect(buttons).toHaveLength(2);
      expect(buttons[0].label).toBe('View Dashboard');
      expect(buttons[0].primary).toBe(true);
      expect(buttons[1].label).toBe('Export Report');
      expect(buttons[1].primary).toBe(false);
    });

    it('should handle missing project name for report generation', () => {
      const buttons = generateActionButtons('report_generation');
      
      expect(buttons).toHaveLength(2);
      expect(buttons[0].query).toBe('show project dashboard');
      expect(buttons[1].query).toBe('export project report as PDF');
    });
  });

  describe('Default/Unknown Artifact Types', () => {
    it('should generate generic buttons for unknown artifact type', () => {
      const buttons = generateActionButtons('unknown_type', 'test-project');
      
      expect(buttons).toHaveLength(2);
      
      // Primary button: View Dashboard
      expect(buttons[0]).toEqual({
        label: 'View Dashboard',
        query: 'show project dashboard for test-project',
        icon: 'status-info',
        primary: true
      });
      
      // Secondary button: View All Projects
      expect(buttons[1]).toEqual({
        label: 'View All Projects',
        query: 'list my renewable projects',
        icon: 'folder',
        primary: false
      });
    });

    it('should handle missing project name for unknown type', () => {
      const buttons = generateActionButtons('unknown_type');
      
      expect(buttons).toHaveLength(2);
      expect(buttons[0].query).toBe('show project dashboard');
      expect(buttons[1].query).toBe('list my renewable projects');
    });
  });

  describe('Button Properties Validation', () => {
    it('should ensure all buttons have required properties', () => {
      const artifactTypes = [
        'terrain_analysis',
        'wind_farm_layout',
        'wake_simulation',
        'report_generation'
      ];

      artifactTypes.forEach(artifactType => {
        const buttons = generateActionButtons(artifactType, 'test-project');
        
        buttons.forEach((button: ActionButton) => {
          expect(button).toHaveProperty('label');
          expect(button).toHaveProperty('query');
          expect(button).toHaveProperty('icon');
          expect(button).toHaveProperty('primary');
          
          expect(typeof button.label).toBe('string');
          expect(typeof button.query).toBe('string');
          expect(typeof button.icon).toBe('string');
          expect(typeof button.primary).toBe('boolean');
          
          expect(button.label.length).toBeGreaterThan(0);
          expect(button.query.length).toBeGreaterThan(0);
          expect(button.icon.length).toBeGreaterThan(0);
        });
      });
    });

    it('should ensure exactly one primary button per artifact type', () => {
      const artifactTypes = [
        'terrain_analysis',
        'wind_farm_layout',
        'wake_simulation',
        'report_generation'
      ];

      artifactTypes.forEach(artifactType => {
        const buttons = generateActionButtons(artifactType, 'test-project');
        const primaryButtons = buttons.filter(b => b.primary === true);
        
        expect(primaryButtons).toHaveLength(1);
      });
    });

    it('should ensure dashboard button is present in all artifact types', () => {
      const artifactTypes = [
        'terrain_analysis',
        'wind_farm_layout',
        'wake_simulation',
        'report_generation'
      ];

      artifactTypes.forEach(artifactType => {
        const buttons = generateActionButtons(artifactType, 'test-project');
        const dashboardButtons = buttons.filter(b => 
          b.label.includes('Dashboard') || b.query.includes('dashboard')
        );
        
        expect(dashboardButtons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Query Format Validation', () => {
    it('should include project name in queries when provided', () => {
      const projectName = 'my-test-project';
      const artifactTypes = [
        'terrain_analysis',
        'wind_farm_layout',
        'wake_simulation',
        'report_generation'
      ];

      artifactTypes.forEach(artifactType => {
        const buttons = generateActionButtons(artifactType, projectName);
        
        // At least one button should include the project name
        const buttonsWithProject = buttons.filter(b => 
          b.query.includes(projectName)
        );
        
        expect(buttonsWithProject.length).toBeGreaterThan(0);
      });
    });

    it('should generate valid queries without project name', () => {
      const artifactTypes = [
        'terrain_analysis',
        'wind_farm_layout',
        'wake_simulation',
        'report_generation'
      ];

      artifactTypes.forEach(artifactType => {
        const buttons = generateActionButtons(artifactType);
        
        buttons.forEach((button: ActionButton) => {
          // Query should not contain "undefined" or "null"
          expect(button.query).not.toContain('undefined');
          expect(button.query).not.toContain('null');
          
          // Query should be a valid string
          expect(button.query.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Icon Validation', () => {
    it('should use valid Cloudscape icon names', () => {
      const validIcons = [
        'settings',
        'status-info',
        'refresh',
        'file',
        'calculator',
        'download',
        'folder'
      ];

      const artifactTypes = [
        'terrain_analysis',
        'wind_farm_layout',
        'wake_simulation',
        'report_generation'
      ];

      artifactTypes.forEach(artifactType => {
        const buttons = generateActionButtons(artifactType, 'test-project');
        
        buttons.forEach((button: ActionButton) => {
          expect(validIcons).toContain(button.icon);
        });
      });
    });
  });
});
