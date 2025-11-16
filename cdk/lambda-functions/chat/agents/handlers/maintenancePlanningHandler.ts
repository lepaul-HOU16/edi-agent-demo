/**
 * Maintenance Planning Handler
 * Generates optimized maintenance schedules based on equipment condition
 * Requirements: 4.3
 */

interface MaintenancePlanningResult {
  success: boolean;
  message: string;
  artifacts: any[];
  thoughtSteps?: any[];
}

/**
 * Handle maintenance planning queries
 */
export async function handleMaintenancePlanning(
  userMessage: string
): Promise<MaintenancePlanningResult> {
  console.log('📅 Maintenance Planning Handler - Start');

  try {
    // Extract parameters from message (in production, use NLP or structured input)
    const params = extractPlanningParameters(userMessage);

    // Generate maintenance plan
    const planData = generateMaintenancePlan(params);

    // Create maintenance schedule artifact
    const artifact = {
      messageContentType: 'maintenance_schedule',
      title: 'Maintenance Schedule',
      subtitle: `${planData.startDate} to ${planData.endDate} | ${planData.tasks.length} tasks`,
      data: {
        id: planData.id,
        startDate: planData.startDate,
        endDate: planData.endDate,
        tasks: planData.tasks,
        totalCost: planData.totalCost,
        totalDuration: planData.totalDuration,
        optimizationCriteria: planData.optimizationCriteria,
        summary: {
          preventiveTasks: planData.tasks.filter((t: any) => t.type === 'preventive').length,
          correctiveTasks: planData.tasks.filter((t: any) => t.type === 'corrective').length,
          inspectionTasks: planData.tasks.filter((t: any) => t.type === 'inspection').length,
          criticalTasks: planData.tasks.filter((t: any) => t.priority === 'critical').length,
          highPriorityTasks: planData.tasks.filter((t: any) => t.priority === 'high').length
        }
      },
      visualizationType: 'gantt'
    };

    // Create thought steps
    const thoughtSteps = [
      {
        type: 'analysis',
        title: 'Planning Parameters',
        summary: `Planning period: ${planData.startDate} to ${planData.endDate}`,
        details: `Equipment: ${params.equipmentIds.join(', ')}. Optimization: ${params.optimizationCriteria}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Task Generation',
        summary: `Generated ${planData.tasks.length} maintenance tasks`,
        details: `Preventive: ${planData.tasks.filter((t: any) => t.type === 'preventive').length}, Corrective: ${planData.tasks.filter((t: any) => t.type === 'corrective').length}, Inspection: ${planData.tasks.filter((t: any) => t.type === 'inspection').length}`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'analysis',
        title: 'Schedule Optimization',
        summary: `Optimized for ${params.optimizationCriteria}`,
        details: `Total cost: $${planData.totalCost.toLocaleString()}, Total duration: ${planData.totalDuration} hours`,
        status: 'complete',
        timestamp: Date.now()
      },
      {
        type: 'recommendation',
        title: 'Critical Tasks',
        summary: `${planData.tasks.filter((t: any) => t.priority === 'critical').length} critical priority tasks identified`,
        details: planData.tasks
          .filter((t: any) => t.priority === 'critical')
          .map((t: any) => `${t.equipmentName}: ${t.description}`)
          .join('; '),
        status: 'complete',
        timestamp: Date.now()
      }
    ];

    const responseMessage = getPlanningMessage(planData);

    console.log('✅ Maintenance Planning Handler - Complete');
    return {
      success: true,
      message: responseMessage,
      artifacts: [artifact],
      thoughtSteps
    };

  } catch (error) {
    console.error('❌ Maintenance Planning Handler - Error:', error);
    return {
      success: false,
      message: `Error generating maintenance plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Processing Error',
        summary: 'Failed to generate maintenance plan',
        details: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
}

/**
 * Extract planning parameters from message
 */
function extractPlanningParameters(message: string): any {
  // Default parameters (in production, extract from message using NLP)
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  return {
    equipmentIds: ['PUMP-001', 'COMP-123'],
    startDate: today.toISOString().split('T')[0],
    endDate: threeMonthsLater.toISOString().split('T')[0],
    optimizationCriteria: 'risk'
  };
}

/**
 * Generate maintenance plan
 */
function generateMaintenancePlan(params: any): any {
  const planId = `PLAN-${Date.now()}`;
  const tasks = [];

  // Generate tasks for each equipment
  let taskCounter = 1;
  for (const equipmentId of params.equipmentIds) {
    const equipmentTasks = generateEquipmentTasks(equipmentId, params.startDate, params.endDate, taskCounter);
    tasks.push(...equipmentTasks);
    taskCounter += equipmentTasks.length;
  }

  // Sort tasks by priority and date
  tasks.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });

  const totalCost = tasks.reduce((sum, task) => sum + task.estimatedCost, 0);
  const totalDuration = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);

  return {
    id: planId,
    startDate: params.startDate,
    endDate: params.endDate,
    tasks,
    totalCost,
    totalDuration,
    optimizationCriteria: params.optimizationCriteria
  };
}

/**
 * Generate tasks for specific equipment
 */
function generateEquipmentTasks(equipmentId: string, startDate: string, endDate: string, startCounter: number): any[] {
  const equipmentData: Record<string, any> = {
    'PUMP-001': {
      name: 'Primary Cooling Pump',
      tasks: [
        {
          type: 'preventive',
          priority: 'medium',
          description: 'Quarterly bearing lubrication',
          estimatedDuration: 2,
          estimatedCost: 150,
          requiredParts: ['Bearing grease'],
          requiredSkills: ['Mechanical technician'],
          procedures: ['Isolate pump', 'Remove grease fittings', 'Apply fresh grease', 'Test operation'],
          daysFromStart: 30
        },
        {
          type: 'inspection',
          priority: 'high',
          description: 'Vibration analysis and alignment check',
          estimatedDuration: 4,
          estimatedCost: 500,
          requiredParts: [],
          requiredSkills: ['Vibration analyst', 'Alignment specialist'],
          procedures: ['Perform vibration analysis', 'Check alignment', 'Document findings', 'Recommend corrections'],
          daysFromStart: 45
        },
        {
          type: 'preventive',
          priority: 'low',
          description: 'Seal inspection and replacement if needed',
          estimatedDuration: 3,
          estimatedCost: 300,
          requiredParts: ['Mechanical seal kit'],
          requiredSkills: ['Mechanical technician'],
          procedures: ['Inspect seals', 'Replace if worn', 'Test for leaks'],
          daysFromStart: 75
        }
      ]
    },
    'COMP-123': {
      name: 'Main Air Compressor',
      tasks: [
        {
          type: 'corrective',
          priority: 'critical',
          description: 'Bearing replacement due to excessive vibration',
          estimatedDuration: 8,
          estimatedCost: 2500,
          requiredParts: ['Bearing set', 'Coupling', 'Alignment shims'],
          requiredSkills: ['Senior mechanical technician', 'Alignment specialist'],
          procedures: ['Shutdown and lockout', 'Remove coupling', 'Replace bearings', 'Align shaft', 'Test operation'],
          daysFromStart: 14
        },
        {
          type: 'preventive',
          priority: 'high',
          description: 'Oil change and filter replacement',
          estimatedDuration: 3,
          estimatedCost: 400,
          requiredParts: ['Compressor oil', 'Oil filter', 'Air filter'],
          requiredSkills: ['Mechanical technician'],
          procedures: ['Drain old oil', 'Replace filters', 'Add new oil', 'Check levels'],
          daysFromStart: 21
        },
        {
          type: 'inspection',
          priority: 'high',
          description: 'Thermal imaging and electrical inspection',
          estimatedDuration: 2,
          estimatedCost: 350,
          requiredParts: [],
          requiredSkills: ['Electrical technician', 'Thermographer'],
          procedures: ['Perform thermal scan', 'Check electrical connections', 'Document hot spots', 'Recommend repairs'],
          daysFromStart: 60
        }
      ]
    }
  };

  const equipment = equipmentData[equipmentId];
  if (!equipment) return [];

  const start = new Date(startDate);
  return equipment.tasks.map((task: any, index: number) => {
    const scheduledDate = new Date(start);
    scheduledDate.setDate(scheduledDate.getDate() + task.daysFromStart);

    return {
      id: `TASK-${startCounter + index}`,
      equipmentId,
      equipmentName: equipment.name,
      type: task.type,
      priority: task.priority,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      estimatedDuration: task.estimatedDuration,
      estimatedCost: task.estimatedCost,
      requiredParts: task.requiredParts,
      requiredSkills: task.requiredSkills,
      dependencies: [],
      description: task.description,
      procedures: task.procedures
    };
  });
}

/**
 * Generate planning message
 */
function getPlanningMessage(plan: any): string {
  let message = `📅 Maintenance Plan Generated\n\n`;
  message += `Period: ${plan.startDate} to ${plan.endDate}\n`;
  message += `Total Tasks: ${plan.tasks.length}\n`;
  message += `Estimated Cost: $${plan.totalCost.toLocaleString()}\n`;
  message += `Estimated Duration: ${plan.totalDuration} hours\n`;
  message += `Optimization: ${plan.optimizationCriteria}\n\n`;

  const criticalTasks = plan.tasks.filter((t: any) => t.priority === 'critical');
  if (criticalTasks.length > 0) {
    message += `🚨 Critical Priority Tasks (${criticalTasks.length}):\n`;
    criticalTasks.forEach((task: any) => {
      message += `• ${task.scheduledDate}: ${task.equipmentName} - ${task.description}\n`;
    });
    message += `\n`;
  }

  const highTasks = plan.tasks.filter((t: any) => t.priority === 'high');
  if (highTasks.length > 0) {
    message += `⚠️ High Priority Tasks (${highTasks.length}):\n`;
    highTasks.forEach((task: any) => {
      message += `• ${task.scheduledDate}: ${task.equipmentName} - ${task.description}\n`;
    });
    message += `\n`;
  }

  message += `The schedule has been optimized for ${plan.optimizationCriteria} and includes preventive, corrective, and inspection tasks.`;

  return message;
}
