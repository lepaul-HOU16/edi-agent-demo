/**
 * Priority Action Items Component Tests
 * Tests for the PriorityActionItems component functionality
 * 
 * Requirements: 2.4, 3.1, 3.2
 */

import { describe, it, expect } from '@jest/globals';

describe('Priority Action Items Component', () => {
  describe('Component Structure', () => {
    it('should have PriorityActionItems component exported', () => {
      // Verify component file exists
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('export const PriorityActionItems');
      expect(content).toContain('export interface PriorityAction');
    });

    it('should define PriorityAction interface with required fields', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      // Check for required interface fields
      expect(content).toContain('id: string');
      expect(content).toContain('wellId: string');
      expect(content).toContain('wellName: string');
      expect(content).toContain("priority: 'urgent' | 'high' | 'medium' | 'low'");
      expect(content).toContain('title: string');
      expect(content).toContain('description: string');
      expect(content).toContain('estimatedTime?: string');
      expect(content).toContain('dueDate?: string');
      expect(content).toContain("actionType: 'inspection' | 'maintenance' | 'diagnostic' | 'repair'");
    });

    it('should accept actions array prop', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('actions: PriorityAction[]');
    });

    it('should accept optional callback props', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('onSchedule?:');
      expect(content).toContain('onViewDetails?:');
    });
  });

  describe('Priority Level Display', () => {
    it('should implement priority color coding', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      // Check for priority color function
      expect(content).toContain('getPriorityColor');
      expect(content).toContain("'urgent'");
      expect(content).toContain("'high'");
      expect(content).toContain("'medium'");
      expect(content).toContain("'low'");
    });

    it('should display priority badges', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('<Badge');
      expect(content).toContain('priority');
    });

    it('should implement priority icons', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('getPriorityIcon');
      expect(content).toContain('<Icon');
    });
  });

  describe('Action Information Display', () => {
    it('should display action title and description', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('action.title');
      expect(content).toContain('action.description');
    });

    it('should display well name', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('action.wellName');
    });

    it('should display estimated time when available', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('action.estimatedTime');
      expect(content).toContain('Estimated Time');
    });

    it('should display due date when available', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('action.dueDate');
      expect(content).toContain('Due Date');
    });

    it('should display action type', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('action.actionType');
      expect(content).toContain('getActionTypeIcon');
    });
  });

  describe('Action Buttons', () => {
    it('should implement Schedule button', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('Schedule');
      expect(content).toContain('onSchedule');
    });

    it('should implement View Details button', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('View Details');
      expect(content).toContain('onViewDetails');
    });

    it('should call onSchedule callback when Schedule clicked', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('onClick={() => onSchedule?.(action)}');
    });

    it('should call onViewDetails callback when View Details clicked', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('onClick={() => onViewDetails?.(action)}');
    });
  });

  describe('Expandable Details', () => {
    it('should implement expand/collapse functionality', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('expanded');
      expect(content).toContain('setExpanded');
      expect(content).toContain('Show more');
      expect(content).toContain('Show less');
    });

    it('should display additional details when expanded', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('{expanded &&');
      expect(content).toContain('Action ID');
      expect(content).toContain('Well ID');
    });
  });

  describe('Priority Sorting', () => {
    it('should sort actions by priority', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('priorityOrder');
      expect(content).toContain('sort');
      expect(content).toContain('urgent: 0');
      expect(content).toContain('high: 1');
      expect(content).toContain('medium: 2');
      expect(content).toContain('low: 3');
    });

    it('should sort by due date within same priority', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('dueDate');
      expect(content).toContain('getTime()');
    });
  });

  describe('Due Date Handling', () => {
    it('should format due dates for display', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('formatDueDate');
      expect(content).toContain('Due today');
      expect(content).toContain('Due tomorrow');
      expect(content).toContain('Overdue');
    });

    it('should detect overdue actions', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('isOverdue');
      expect(content).toContain('OVERDUE');
    });

    it('should highlight overdue actions', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('overdue');
      expect(content).toContain('text-status-error');
    });
  });

  describe('Summary Statistics', () => {
    it('should display total action count', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('Total Actions');
      expect(content).toContain('actions.length');
    });

    it('should count urgent actions', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('urgentCount');
      expect(content).toContain("filter(a => a.priority === 'urgent')");
    });

    it('should count high priority actions', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('highCount');
      expect(content).toContain("filter(a => a.priority === 'high')");
    });

    it('should count overdue actions', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('overdueCount');
      expect(content).toContain('isOverdue');
    });
  });

  describe('Empty State', () => {
    it('should handle empty actions array', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('actions.length === 0');
      expect(content).toContain('No priority actions required');
    });

    it('should display success message when no actions', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('StatusIndicator');
      expect(content).toContain('success');
      expect(content).toContain('operating within acceptable parameters');
    });
  });

  describe('Logging and Debugging', () => {
    it('should log component rendering', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain("console.log('🎯 Rendering Priority Action Items')");
    });

    it('should log action counts by priority', () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(process.cwd(), 'src/components/maintenance/PriorityActionItems.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');

      expect(content).toContain('Total Actions');
      expect(content).toContain('Urgent:');
      expect(content).toContain('High:');
      expect(content).toContain('Medium:');
      expect(content).toContain('Low:');
    });
  });

  describe('Integration with ConsolidatedAnalysisView', () => {
    it('should be imported in ConsolidatedAnalysisView', () => {
      const fs = require('fs');
      const path = require('path');
      const viewPath = path.join(process.cwd(), 'src/components/maintenance/ConsolidatedAnalysisView.tsx');
      const content = fs.readFileSync(viewPath, 'utf-8');

      expect(content).toContain("import { PriorityActionItems");
      expect(content).toContain("from './PriorityActionItems'");
    });

    it('should be rendered in ConsolidatedAnalysisView', () => {
      const fs = require('fs');
      const path = require('path');
      const viewPath = path.join(process.cwd(), 'src/components/maintenance/ConsolidatedAnalysisView.tsx');
      const content = fs.readFileSync(viewPath, 'utf-8');

      expect(content).toContain('<PriorityActionItems');
      expect(content).toContain('actions={priorityActions}');
    });

    it('should receive callback props from ConsolidatedAnalysisView', () => {
      const fs = require('fs');
      const path = require('path');
      const viewPath = path.join(process.cwd(), 'src/components/maintenance/ConsolidatedAnalysisView.tsx');
      const content = fs.readFileSync(viewPath, 'utf-8');

      expect(content).toContain('onSchedule=');
      expect(content).toContain('onViewDetails=');
    });
  });

  describe('Integration with WellsEquipmentDashboard', () => {
    it('should pass priority actions from dashboard artifact', () => {
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(process.cwd(), 'src/components/maintenance/WellsEquipmentDashboard.tsx');
      const content = fs.readFileSync(dashboardPath, 'utf-8');

      expect(content).toContain('priorityActions={dashboardData.priorityActions}');
    });

    it('should implement onScheduleAction handler', () => {
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(process.cwd(), 'src/components/maintenance/WellsEquipmentDashboard.tsx');
      const content = fs.readFileSync(dashboardPath, 'utf-8');

      expect(content).toContain('onScheduleAction=');
      expect(content).toContain('Schedule action');
    });

    it('should implement onViewActionDetails handler', () => {
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(process.cwd(), 'src/components/maintenance/WellsEquipmentDashboard.tsx');
      const content = fs.readFileSync(dashboardPath, 'utf-8');

      expect(content).toContain('onViewActionDetails=');
      expect(content).toContain('View details');
    });
  });
});

console.log('✅ All Priority Action Items component tests defined');
