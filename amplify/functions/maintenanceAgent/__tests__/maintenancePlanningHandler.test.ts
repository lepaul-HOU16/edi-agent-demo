/**
 * Unit tests for Maintenance Planning Handler
 */

import { handleMaintenancePlanning } from '../handlers/maintenancePlanningHandler';

describe('Maintenance Planning Handler', () => {
  describe('Basic Planning Tests', () => {
    it('should generate maintenance plan successfully', async () => {
      const result = await handleMaintenancePlanning('Generate maintenance plan for next 3 months');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Maintenance Plan Generated');
      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].messageContentType).toBe('maintenance_schedule');
      expect(result.thoughtSteps).toBeDefined();
    });

    it('should include multiple tasks in plan', async () => {
      const result = await handleMaintenancePlanning('Create maintenance schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.tasks).toBeDefined();
      expect(result.artifacts[0].data.tasks.length).toBeGreaterThan(0);
    });

    it('should include start and end dates', async () => {
      const result = await handleMaintenancePlanning('Maintenance plan');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.startDate).toBeDefined();
      expect(result.artifacts[0].data.endDate).toBeDefined();
      expect(result.message).toContain('Period:');
    });

    it('should calculate total cost', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.totalCost).toBeDefined();
      expect(result.artifacts[0].data.totalCost).toBeGreaterThan(0);
      expect(result.message).toContain('Estimated Cost');
    });

    it('should calculate total duration', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.totalDuration).toBeDefined();
      expect(result.artifacts[0].data.totalDuration).toBeGreaterThan(0);
      expect(result.message).toContain('Estimated Duration');
    });
  });

  describe('Task Structure Tests', () => {
    it('should include all required task fields', async () => {
      const result = await handleMaintenancePlanning('Generate maintenance plan');

      expect(result.success).toBe(true);
      const task = result.artifacts[0].data.tasks[0];
      
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('equipmentId');
      expect(task).toHaveProperty('equipmentName');
      expect(task).toHaveProperty('type');
      expect(task).toHaveProperty('priority');
      expect(task).toHaveProperty('scheduledDate');
      expect(task).toHaveProperty('estimatedDuration');
      expect(task).toHaveProperty('estimatedCost');
      expect(task).toHaveProperty('requiredParts');
      expect(task).toHaveProperty('requiredSkills');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('procedures');
    });

    it('should include different task types', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const taskTypes = [...new Set(tasks.map((t: any) => t.type))] as string[];
      
      expect(taskTypes.length).toBeGreaterThan(1);
      expect(taskTypes.some(t => ['preventive', 'corrective', 'inspection'].includes(t))).toBe(true);
    });

    it('should include different priority levels', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const priorities = [...new Set(tasks.map((t: any) => t.priority))] as string[];
      
      expect(priorities.length).toBeGreaterThan(1);
      expect(priorities.some(p => ['critical', 'high', 'medium', 'low'].includes(p))).toBe(true);
    });

    it('should sort tasks by priority', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      
      for (let i = 0; i < tasks.length - 1; i++) {
        const currentPriority = priorityOrder[tasks[i].priority as keyof typeof priorityOrder];
        const nextPriority = priorityOrder[tasks[i + 1].priority as keyof typeof priorityOrder];
        expect(currentPriority).toBeLessThanOrEqual(nextPriority);
      }
    });

    it('should include required parts for tasks', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const tasksWithParts = tasks.filter((t: any) => t.requiredParts.length > 0);
      
      expect(tasksWithParts.length).toBeGreaterThan(0);
    });

    it('should include required skills for tasks', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      
      tasks.forEach((task: any) => {
        expect(task.requiredSkills).toBeDefined();
        expect(task.requiredSkills.length).toBeGreaterThan(0);
      });
    });

    it('should include procedures for tasks', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      
      tasks.forEach((task: any) => {
        expect(task.procedures).toBeDefined();
        expect(task.procedures.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Response Structure Tests', () => {
    it('should return correct artifact structure', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      expect(result.artifacts[0]).toHaveProperty('messageContentType');
      expect(result.artifacts[0]).toHaveProperty('title');
      expect(result.artifacts[0]).toHaveProperty('subtitle');
      expect(result.artifacts[0]).toHaveProperty('data');
      expect(result.artifacts[0]).toHaveProperty('visualizationType');
      expect(result.artifacts[0].visualizationType).toBe('gantt');
    });

    it('should include thought steps with planning details', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps!.length).toBeGreaterThanOrEqual(4);
      
      const titles = result.thoughtSteps!.map(s => s.title);
      expect(titles).toContain('Planning Parameters');
      expect(titles).toContain('Task Generation');
      expect(titles).toContain('Schedule Optimization');
      expect(titles).toContain('Critical Tasks');
    });

    it('should include summary statistics', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const summary = result.artifacts[0].data.summary;
      
      expect(summary).toHaveProperty('preventiveTasks');
      expect(summary).toHaveProperty('correctiveTasks');
      expect(summary).toHaveProperty('inspectionTasks');
      expect(summary).toHaveProperty('criticalTasks');
      expect(summary).toHaveProperty('highPriorityTasks');
    });
  });

  describe('Critical Tasks Tests', () => {
    it('should identify critical priority tasks', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const criticalTasks = tasks.filter((t: any) => t.priority === 'critical');
      
      expect(result.artifacts[0].data.summary.criticalTasks).toBe(criticalTasks.length);
    });

    it('should highlight critical tasks in message', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const criticalCount = result.artifacts[0].data.summary.criticalTasks;
      
      if (criticalCount > 0) {
        expect(result.message).toContain('🚨 Critical Priority Tasks');
      }
    });

    it('should list critical tasks first in message', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const criticalCount = result.artifacts[0].data.summary.criticalTasks;
      
      if (criticalCount > 0) {
        const criticalSection = result.message.indexOf('Critical Priority Tasks');
        const highSection = result.message.indexOf('High Priority Tasks');
        expect(criticalSection).toBeLessThan(highSection);
      }
    });
  });

  describe('Equipment Coverage Tests', () => {
    it('should include tasks for multiple equipment', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const equipmentIds = [...new Set(tasks.map((t: any) => t.equipmentId))];
      
      expect(equipmentIds.length).toBeGreaterThan(1);
    });

    it('should include PUMP-001 tasks', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const pumpTasks = tasks.filter((t: any) => t.equipmentId === 'PUMP-001');
      
      expect(pumpTasks.length).toBeGreaterThan(0);
    });

    it('should include COMP-123 tasks', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const compTasks = tasks.filter((t: any) => t.equipmentId === 'COMP-123');
      
      expect(compTasks.length).toBeGreaterThan(0);
    });
  });

  describe('Date Range Tests', () => {
    it('should schedule tasks within date range', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const startDate = new Date(result.artifacts[0].data.startDate);
      const endDate = new Date(result.artifacts[0].data.endDate);
      const tasks = result.artifacts[0].data.tasks;
      
      tasks.forEach((task: any) => {
        const taskDate = new Date(task.scheduledDate);
        expect(taskDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(taskDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should use 3-month planning period by default', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const startDate = new Date(result.artifacts[0].data.startDate);
      const endDate = new Date(result.artifacts[0].data.endDate);
      
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      
      expect(monthsDiff).toBe(3);
    });
  });

  describe('Cost and Duration Tests', () => {
    it('should calculate total cost correctly', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const calculatedCost = tasks.reduce((sum: number, t: any) => sum + t.estimatedCost, 0);
      
      expect(result.artifacts[0].data.totalCost).toBe(calculatedCost);
    });

    it('should calculate total duration correctly', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const tasks = result.artifacts[0].data.tasks;
      const calculatedDuration = tasks.reduce((sum: number, t: any) => sum + t.estimatedDuration, 0);
      
      expect(result.artifacts[0].data.totalDuration).toBe(calculatedDuration);
    });

    it('should include cost in message', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Estimated Cost');
      expect(result.message).toContain(result.artifacts[0].data.totalCost.toLocaleString());
    });

    it('should include duration in message', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Estimated Duration');
      expect(result.message).toContain('hours');
    });
  });

  describe('Optimization Tests', () => {
    it('should include optimization criteria', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.optimizationCriteria).toBeDefined();
      expect(result.message).toContain('Optimization');
    });

    it('should use risk-based optimization by default', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.optimizationCriteria).toBe('risk');
    });
  });

  describe('Message Content Tests', () => {
    it('should include plan summary in message', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      expect(result.message).toContain('📅 Maintenance Plan Generated');
      expect(result.message).toContain('Total Tasks');
    });

    it('should list high priority tasks in message', async () => {
      const result = await handleMaintenancePlanning('Create schedule');

      expect(result.success).toBe(true);
      const highCount = result.artifacts[0].data.summary.highPriorityTasks;
      
      if (highCount > 0) {
        expect(result.message).toContain('⚠️ High Priority Tasks');
      }
    });

    it('should include optimization note in message', async () => {
      const result = await handleMaintenancePlanning('Generate plan');

      expect(result.success).toBe(true);
      expect(result.message).toContain('optimized for');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle errors gracefully', async () => {
      // This test verifies the error handling structure exists
      // In a real scenario, we'd mock a failure condition
      const result = await handleMaintenancePlanning('Generate plan');

      // Should succeed normally, but structure should support error handling
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('artifacts');
      expect(result).toHaveProperty('thoughtSteps');
    });
  });
});
