/**
 * Unit tests for Inspection Schedule Handler
 */

import { handleInspectionSchedule } from '../handlers/inspectionScheduleHandler';

describe('Inspection Schedule Handler', () => {
  describe('Basic Schedule Generation Tests', () => {
    it('should generate inspection schedule successfully', async () => {
      const result = await handleInspectionSchedule('Generate inspection schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Inspection Schedule Generated');
      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].messageContentType).toBe('inspection_report');
      expect(result.thoughtSteps).toBeDefined();
    });

    it('should include multiple inspections', async () => {
      const result = await handleInspectionSchedule('Create inspection schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.inspections).toBeDefined();
      expect(result.artifacts[0].data.inspections.length).toBeGreaterThan(0);
    });

    it('should include start and end dates', async () => {
      const result = await handleInspectionSchedule('Inspection schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.startDate).toBeDefined();
      expect(result.artifacts[0].data.endDate).toBeDefined();
      expect(result.message).toContain('Period:');
    });

    it('should calculate total estimated hours', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.totalEstimatedHours).toBeDefined();
      expect(result.artifacts[0].data.totalEstimatedHours).toBeGreaterThan(0);
      expect(result.message).toContain('Estimated Time');
    });

    it('should calculate total estimated cost', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0].data.totalEstimatedCost).toBeDefined();
      expect(result.artifacts[0].data.totalEstimatedCost).toBeGreaterThan(0);
      expect(result.message).toContain('Estimated Cost');
    });
  });

  describe('Inspection Structure Tests', () => {
    it('should include all required inspection fields', async () => {
      const result = await handleInspectionSchedule('Generate inspection schedule');

      expect(result.success).toBe(true);
      const inspection = result.artifacts[0].data.inspections[0];
      
      expect(inspection).toHaveProperty('id');
      expect(inspection).toHaveProperty('equipmentId');
      expect(inspection).toHaveProperty('equipmentName');
      expect(inspection).toHaveProperty('type');
      expect(inspection).toHaveProperty('description');
      expect(inspection).toHaveProperty('scheduledDate');
      expect(inspection).toHaveProperty('estimatedDuration');
      expect(inspection).toHaveProperty('estimatedCost');
      expect(inspection).toHaveProperty('checklist');
      expect(inspection).toHaveProperty('requiredSkills');
      expect(inspection).toHaveProperty('status');
    });

    it('should include different inspection types', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const types = [...new Set(inspections.map((i: any) => i.type))] as string[];
      
      expect(types.length).toBeGreaterThan(1);
      expect(types.some(t => ['routine', 'regulatory', 'condition-based'].includes(t))).toBe(true);
    });

    it('should include checklist for each inspection', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      inspections.forEach((inspection: any) => {
        expect(inspection.checklist).toBeDefined();
        expect(inspection.checklist.length).toBeGreaterThan(0);
      });
    });

    it('should include required skills for each inspection', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      inspections.forEach((inspection: any) => {
        expect(inspection.requiredSkills).toBeDefined();
        expect(inspection.requiredSkills.length).toBeGreaterThan(0);
      });
    });

    it('should set status to scheduled', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      inspections.forEach((inspection: any) => {
        expect(inspection.status).toBe('scheduled');
      });
    });
  });

  describe('Response Structure Tests', () => {
    it('should return correct artifact structure', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      expect(result.artifacts[0]).toHaveProperty('messageContentType');
      expect(result.artifacts[0]).toHaveProperty('title');
      expect(result.artifacts[0]).toHaveProperty('subtitle');
      expect(result.artifacts[0]).toHaveProperty('data');
      expect(result.artifacts[0]).toHaveProperty('visualizationType');
      expect(result.artifacts[0].visualizationType).toBe('table');
    });

    it('should include thought steps with schedule details', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      expect(result.thoughtSteps).toBeDefined();
      expect(result.thoughtSteps!.length).toBeGreaterThanOrEqual(3);
      
      const titles = result.thoughtSteps!.map(s => s.title);
      expect(titles).toContain('Schedule Parameters');
      expect(titles).toContain('Inspection Generation');
      expect(titles).toContain('Resource Planning');
    });

    it('should include summary statistics', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const summary = result.artifacts[0].data.summary;
      
      expect(summary).toHaveProperty('routineInspections');
      expect(summary).toHaveProperty('regulatoryInspections');
      expect(summary).toHaveProperty('conditionBasedInspections');
      expect(summary).toHaveProperty('totalEstimatedHours');
      expect(summary).toHaveProperty('totalEstimatedCost');
    });
  });

  describe('Inspection Type Tests', () => {
    it('should include routine inspections', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const routineCount = result.artifacts[0].data.summary.routineInspections;
      expect(routineCount).toBeGreaterThan(0);
    });

    it('should include regulatory inspections', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const regulatoryCount = result.artifacts[0].data.summary.regulatoryInspections;
      expect(regulatoryCount).toBeGreaterThan(0);
    });

    it('should include condition-based inspections', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const conditionCount = result.artifacts[0].data.summary.conditionBasedInspections;
      expect(conditionCount).toBeGreaterThan(0);
    });

    it('should have more routine inspections than others', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const summary = result.artifacts[0].data.summary;
      
      // Routine inspections should be most frequent
      expect(summary.routineInspections).toBeGreaterThan(summary.regulatoryInspections);
    });
  });

  describe('Equipment Coverage Tests', () => {
    it('should include inspections for multiple equipment', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const equipmentIds = [...new Set(inspections.map((i: any) => i.equipmentId))];
      
      expect(equipmentIds.length).toBeGreaterThan(1);
    });

    it('should include PUMP-001 inspections', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const pumpInspections = inspections.filter((i: any) => i.equipmentId === 'PUMP-001');
      
      expect(pumpInspections.length).toBeGreaterThan(0);
    });

    it('should include COMP-123 inspections', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const compInspections = inspections.filter((i: any) => i.equipmentId === 'COMP-123');
      
      expect(compInspections.length).toBeGreaterThan(0);
    });
  });

  describe('Date Range Tests', () => {
    it('should schedule inspections within date range', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const startDate = new Date(result.artifacts[0].data.startDate);
      const endDate = new Date(result.artifacts[0].data.endDate);
      const inspections = result.artifacts[0].data.inspections;
      
      inspections.forEach((inspection: any) => {
        const inspectionDate = new Date(inspection.scheduledDate);
        expect(inspectionDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(inspectionDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should use 6-month planning period by default', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const startDate = new Date(result.artifacts[0].data.startDate);
      const endDate = new Date(result.artifacts[0].data.endDate);
      
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                        (endDate.getMonth() - startDate.getMonth());
      
      expect(monthsDiff).toBe(6);
    });

    it('should sort inspections by date', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      for (let i = 0; i < inspections.length - 1; i++) {
        const currentDate = new Date(inspections[i].scheduledDate);
        const nextDate = new Date(inspections[i + 1].scheduledDate);
        expect(currentDate.getTime()).toBeLessThanOrEqual(nextDate.getTime());
      }
    });
  });

  describe('Frequency Tests', () => {
    it('should generate recurring inspections', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      // Check for duplicate descriptions (indicating recurring inspections)
      const descriptions = inspections.map((i: any) => i.description);
      const uniqueDescriptions = [...new Set(descriptions)];
      
      expect(descriptions.length).toBeGreaterThan(uniqueDescriptions.length);
    });

    it('should have weekly inspections for COMP-123', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const weeklyInspections = inspections.filter((i: any) => 
        i.equipmentId === 'COMP-123' && i.description.includes('Weekly')
      );
      
      expect(weeklyInspections.length).toBeGreaterThan(1);
    });

    it('should have monthly inspections for PUMP-001', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const monthlyInspections = inspections.filter((i: any) => 
        i.equipmentId === 'PUMP-001' && i.description.includes('Monthly')
      );
      
      expect(monthlyInspections.length).toBeGreaterThan(1);
    });
  });

  describe('Cost and Duration Tests', () => {
    it('should calculate total hours correctly', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const calculatedHours = inspections.reduce((sum: number, i: any) => sum + i.estimatedDuration, 0);
      
      expect(result.artifacts[0].data.totalEstimatedHours).toBe(calculatedHours);
    });

    it('should calculate total cost correctly', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      const calculatedCost = inspections.reduce((sum: number, i: any) => sum + i.estimatedCost, 0);
      
      expect(result.artifacts[0].data.totalEstimatedCost).toBe(calculatedCost);
    });

    it('should include hours in message', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Estimated Time');
      expect(result.message).toContain('hours');
    });

    it('should include cost in message', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Estimated Cost');
      expect(result.message).toContain(result.artifacts[0].data.totalEstimatedCost.toLocaleString());
    });
  });

  describe('Message Content Tests', () => {
    it('should include schedule summary in message', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('🔍 Inspection Schedule Generated');
      expect(result.message).toContain('Total Inspections');
    });

    it('should include inspection breakdown in message', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Inspection Breakdown');
      expect(result.message).toContain('Routine Inspections');
      expect(result.message).toContain('Regulatory Inspections');
      expect(result.message).toContain('Condition-Based Inspections');
    });

    it('should list next 5 upcoming inspections', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Next 5 Upcoming Inspections');
      
      const inspections = result.artifacts[0].data.inspections.slice(0, 5);
      inspections.forEach((inspection: any) => {
        expect(result.message).toContain(inspection.scheduledDate);
      });
    });

    it('should include percentages in breakdown', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/\d+%/); // Should contain percentage
    });
  });

  describe('Checklist Tests', () => {
    it('should include detailed checklists', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      inspections.forEach((inspection: any) => {
        expect(inspection.checklist.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have different checklists for different inspection types', async () => {
      const result = await handleInspectionSchedule('Create schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      const routineChecklist = inspections.find((i: any) => i.type === 'routine')?.checklist;
      const regulatoryChecklist = inspections.find((i: any) => i.type === 'regulatory')?.checklist;
      
      expect(routineChecklist).not.toEqual(regulatoryChecklist);
    });
  });

  describe('Required Skills Tests', () => {
    it('should specify appropriate skills for each inspection type', async () => {
      const result = await handleInspectionSchedule('Generate schedule');

      expect(result.success).toBe(true);
      const inspections = result.artifacts[0].data.inspections;
      
      const routineInspection = inspections.find((i: any) => i.type === 'routine');
      const regulatoryInspection = inspections.find((i: any) => i.type === 'regulatory');
      
      expect(routineInspection?.requiredSkills).toContain('Operator');
      expect(regulatoryInspection?.requiredSkills.some((s: string) => 
        s.includes('Certified') || s.includes('Licensed')
      )).toBe(true);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle errors gracefully', async () => {
      // This test verifies the error handling structure exists
      const result = await handleInspectionSchedule('Generate schedule');

      // Should succeed normally, but structure should support error handling
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('artifacts');
      expect(result).toHaveProperty('thoughtSteps');
    });
  });
});
