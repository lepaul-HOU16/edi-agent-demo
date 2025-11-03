/**
 * Maintenance Tools (MCP Pattern)
 * Tool definitions for maintenance operations following Model Context Protocol
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

/**
 * Equipment Status Tool
 * Get current operational status and health metrics for equipment
 */
export const equipmentStatusTool = {
  name: 'get_equipment_status',
  description: 'Get current operational status and health metrics for equipment',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentId: { 
        type: 'string', 
        description: 'Equipment identifier (e.g., PUMP-001, COMP-123)' 
      }
    },
    required: ['equipmentId']
  }
};

/**
 * Failure Prediction Tool
 * Analyze historical data to predict equipment failure risk
 */
export const failurePredictionTool = {
  name: 'predict_equipment_failure',
  description: 'Analyze historical data to predict equipment failure risk',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentId: { 
        type: 'string', 
        description: 'Equipment identifier' 
      },
      timeHorizon: { 
        type: 'number', 
        description: 'Prediction horizon in days',
        default: 30
      }
    },
    required: ['equipmentId']
  }
};

/**
 * Maintenance Planning Tool
 * Generate optimized maintenance schedule based on equipment condition
 */
export const maintenancePlanningTool = {
  name: 'generate_maintenance_plan',
  description: 'Generate optimized maintenance schedule based on equipment condition',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentIds: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'List of equipment identifiers to include in plan'
      },
      startDate: { 
        type: 'string', 
        format: 'date',
        description: 'Plan start date (YYYY-MM-DD)'
      },
      endDate: { 
        type: 'string', 
        format: 'date',
        description: 'Plan end date (YYYY-MM-DD)'
      },
      optimizationCriteria: {
        type: 'string',
        enum: ['cost', 'downtime', 'risk'],
        description: 'Optimization criteria for scheduling',
        default: 'risk'
      }
    },
    required: ['equipmentIds', 'startDate', 'endDate']
  }
};

/**
 * Inspection Schedule Tool
 * Generate inspection schedule for equipment
 */
export const inspectionScheduleTool = {
  name: 'generate_inspection_schedule',
  description: 'Generate inspection schedule for equipment based on regulatory requirements and condition',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentIds: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'List of equipment identifiers'
      },
      startDate: { 
        type: 'string', 
        format: 'date',
        description: 'Schedule start date (YYYY-MM-DD)'
      },
      endDate: { 
        type: 'string', 
        format: 'date',
        description: 'Schedule end date (YYYY-MM-DD)'
      },
      inspectionType: {
        type: 'string',
        enum: ['routine', 'regulatory', 'condition-based', 'all'],
        description: 'Type of inspections to schedule',
        default: 'all'
      }
    },
    required: ['equipmentIds', 'startDate', 'endDate']
  }
};

/**
 * Maintenance History Tool
 * Retrieve maintenance history for equipment
 */
export const maintenanceHistoryTool = {
  name: 'get_maintenance_history',
  description: 'Retrieve maintenance history and records for equipment',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentId: { 
        type: 'string', 
        description: 'Equipment identifier' 
      },
      startDate: { 
        type: 'string', 
        format: 'date',
        description: 'History start date (YYYY-MM-DD)',
        optional: true
      },
      endDate: { 
        type: 'string', 
        format: 'date',
        description: 'History end date (YYYY-MM-DD)',
        optional: true
      },
      maintenanceType: {
        type: 'string',
        enum: ['preventive', 'corrective', 'predictive', 'inspection', 'all'],
        description: 'Type of maintenance records to retrieve',
        default: 'all'
      }
    },
    required: ['equipmentId']
  }
};

/**
 * Asset Health Tool
 * Assess overall health of assets
 */
export const assetHealthTool = {
  name: 'assess_asset_health',
  description: 'Assess overall health and condition of equipment assets',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentIds: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'List of equipment identifiers to assess',
        optional: true
      },
      includeMetrics: {
        type: 'boolean',
        description: 'Include detailed health metrics',
        default: true
      },
      includePredictions: {
        type: 'boolean',
        description: 'Include failure predictions',
        default: true
      }
    }
  }
};

/**
 * Preventive Maintenance Tool
 * Generate preventive maintenance recommendations
 */
export const preventiveMaintenanceTool = {
  name: 'generate_preventive_maintenance',
  description: 'Generate preventive maintenance recommendations based on equipment condition and usage',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentIds: { 
        type: 'array', 
        items: { type: 'string' },
        description: 'List of equipment identifiers'
      },
      timeframe: {
        type: 'string',
        enum: ['weekly', 'monthly', 'quarterly', 'annual'],
        description: 'Preventive maintenance timeframe',
        default: 'monthly'
      },
      priority: {
        type: 'string',
        enum: ['all', 'high', 'critical'],
        description: 'Priority level filter',
        default: 'all'
      }
    },
    required: ['equipmentIds']
  }
};

/**
 * Export all maintenance tools
 */
export const maintenanceTools = [
  equipmentStatusTool,
  failurePredictionTool,
  maintenancePlanningTool,
  inspectionScheduleTool,
  maintenanceHistoryTool,
  assetHealthTool,
  preventiveMaintenanceTool
];
