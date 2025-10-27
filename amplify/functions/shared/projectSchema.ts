/**
 * Project Data Schema and Validation
 * 
 * Defines TypeScript interfaces and JSON schema validation for project data
 */

import { ProjectData, ProjectStatus } from './projectStore';

/**
 * JSON Schema for ProjectData validation
 */
export const ProjectDataSchema = {
  type: 'object',
  required: ['project_id', 'project_name', 'created_at', 'updated_at'],
  properties: {
    project_id: {
      type: 'string',
      pattern: '^proj-[0-9]+-[a-z0-9]+$',
      description: 'Unique project identifier',
    },
    project_name: {
      type: 'string',
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
      minLength: 1,
      maxLength: 100,
      description: 'Human-friendly project name in kebab-case',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp of project creation',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp of last update',
    },
    status: {
      type: 'string',
      enum: ['not_started', 'in_progress', 'completed', 'failed'],
      description: 'Current status of the project',
    },
    coordinates: {
      type: 'object',
      required: ['latitude', 'longitude'],
      properties: {
        latitude: {
          type: 'number',
          minimum: -90,
          maximum: 90,
          description: 'Latitude in decimal degrees',
        },
        longitude: {
          type: 'number',
          minimum: -180,
          maximum: 180,
          description: 'Longitude in decimal degrees',
        },
      },
      additionalProperties: false,
    },
    terrain_results: {
      type: 'object',
      description: 'Results from terrain analysis',
    },
    layout_results: {
      type: 'object',
      description: 'Results from layout optimization',
    },
    simulation_results: {
      type: 'object',
      description: 'Results from wake simulation',
    },
    report_results: {
      type: 'object',
      description: 'Results from report generation',
    },
    metadata: {
      type: 'object',
      properties: {
        turbine_count: {
          type: 'number',
          minimum: 0,
          description: 'Number of turbines in layout',
        },
        total_capacity_mw: {
          type: 'number',
          minimum: 0,
          description: 'Total capacity in megawatts',
        },
        annual_energy_gwh: {
          type: 'number',
          minimum: 0,
          description: 'Annual energy production in gigawatt-hours',
        },
        archived: {
          type: 'boolean',
          description: 'Whether the project is archived',
        },
        archived_at: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp when project was archived',
        },
        imported_at: {
          type: 'string',
          format: 'date-time',
          description: 'ISO 8601 timestamp when project was imported',
        },
        status: {
          type: 'string',
          enum: ['not_started', 'in_progress', 'completed', 'failed'],
          description: 'Current status of the project',
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: false,
};

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate project data against schema
 */
export function validateProjectData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.project_id) {
    errors.push('Missing required field: project_id');
  } else if (typeof data.project_id !== 'string') {
    errors.push('project_id must be a string');
  } else if (!/^proj-[0-9]+-[a-z0-9]+$/.test(data.project_id)) {
    errors.push('project_id must match pattern: proj-{timestamp}-{random}');
  }

  if (!data.project_name) {
    errors.push('Missing required field: project_name');
  } else if (typeof data.project_name !== 'string') {
    errors.push('project_name must be a string');
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.project_name)) {
    errors.push('project_name must be in kebab-case (lowercase with hyphens)');
  } else if (data.project_name.length > 100) {
    errors.push('project_name must be 100 characters or less');
  }

  if (!data.created_at) {
    errors.push('Missing required field: created_at');
  } else if (!isValidISODate(data.created_at)) {
    errors.push('created_at must be a valid ISO 8601 date-time string');
  }

  if (!data.updated_at) {
    errors.push('Missing required field: updated_at');
  } else if (!isValidISODate(data.updated_at)) {
    errors.push('updated_at must be a valid ISO 8601 date-time string');
  }

  // Optional status validation
  if (data.status !== undefined) {
    const validStatuses: ProjectStatus[] = ['not_started', 'in_progress', 'completed', 'failed'];
    if (typeof data.status !== 'string') {
      errors.push('status must be a string');
    } else if (!validStatuses.includes(data.status as ProjectStatus)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Optional coordinates validation
  if (data.coordinates) {
    if (typeof data.coordinates !== 'object') {
      errors.push('coordinates must be an object');
    } else {
      if (typeof data.coordinates.latitude !== 'number') {
        errors.push('coordinates.latitude must be a number');
      } else if (data.coordinates.latitude < -90 || data.coordinates.latitude > 90) {
        errors.push('coordinates.latitude must be between -90 and 90');
      }

      if (typeof data.coordinates.longitude !== 'number') {
        errors.push('coordinates.longitude must be a number');
      } else if (data.coordinates.longitude < -180 || data.coordinates.longitude > 180) {
        errors.push('coordinates.longitude must be between -180 and 180');
      }
    }
  }

  // Optional metadata validation
  if (data.metadata) {
    if (typeof data.metadata !== 'object') {
      errors.push('metadata must be an object');
    } else {
      if (data.metadata.turbine_count !== undefined) {
        if (typeof data.metadata.turbine_count !== 'number') {
          errors.push('metadata.turbine_count must be a number');
        } else if (data.metadata.turbine_count < 0) {
          errors.push('metadata.turbine_count must be non-negative');
        }
      }

      if (data.metadata.total_capacity_mw !== undefined) {
        if (typeof data.metadata.total_capacity_mw !== 'number') {
          errors.push('metadata.total_capacity_mw must be a number');
        } else if (data.metadata.total_capacity_mw < 0) {
          errors.push('metadata.total_capacity_mw must be non-negative');
        }
      }

      if (data.metadata.annual_energy_gwh !== undefined) {
        if (typeof data.metadata.annual_energy_gwh !== 'number') {
          errors.push('metadata.annual_energy_gwh must be a number');
        } else if (data.metadata.annual_energy_gwh < 0) {
          errors.push('metadata.annual_energy_gwh must be non-negative');
        }
      }

      if (data.metadata.archived !== undefined) {
        if (typeof data.metadata.archived !== 'boolean') {
          errors.push('metadata.archived must be a boolean');
        }
      }

      if (data.metadata.archived_at !== undefined) {
        if (!isValidISODate(data.metadata.archived_at)) {
          errors.push('metadata.archived_at must be a valid ISO 8601 date-time string');
        }
      }

      if (data.metadata.imported_at !== undefined) {
        if (!isValidISODate(data.metadata.imported_at)) {
          errors.push('metadata.imported_at must be a valid ISO 8601 date-time string');
        }
      }

      if (data.metadata.status !== undefined) {
        const validStatuses = ['not_started', 'in_progress', 'completed', 'failed'];
        if (typeof data.metadata.status !== 'string') {
          errors.push('metadata.status must be a string');
        } else if (!validStatuses.includes(data.metadata.status)) {
          errors.push(`metadata.status must be one of: ${validStatuses.join(', ')}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate partial project data (for updates)
 */
export function validatePartialProjectData(data: any): ValidationResult {
  const errors: string[] = [];

  // Check types if fields are present
  if (data.project_id !== undefined) {
    if (typeof data.project_id !== 'string') {
      errors.push('project_id must be a string');
    } else if (!/^proj-[0-9]+-[a-z0-9]+$/.test(data.project_id)) {
      errors.push('project_id must match pattern: proj-{timestamp}-{random}');
    }
  }

  if (data.project_name !== undefined) {
    if (typeof data.project_name !== 'string') {
      errors.push('project_name must be a string');
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.project_name)) {
      errors.push('project_name must be in kebab-case (lowercase with hyphens)');
    } else if (data.project_name.length > 100) {
      errors.push('project_name must be 100 characters or less');
    }
  }

  if (data.created_at !== undefined && !isValidISODate(data.created_at)) {
    errors.push('created_at must be a valid ISO 8601 date-time string');
  }

  if (data.updated_at !== undefined && !isValidISODate(data.updated_at)) {
    errors.push('updated_at must be a valid ISO 8601 date-time string');
  }

  if (data.status !== undefined) {
    const validStatuses: ProjectStatus[] = ['not_started', 'in_progress', 'completed', 'failed'];
    if (typeof data.status !== 'string') {
      errors.push('status must be a string');
    } else if (!validStatuses.includes(data.status as ProjectStatus)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (data.coordinates !== undefined) {
    if (typeof data.coordinates !== 'object') {
      errors.push('coordinates must be an object');
    } else {
      if (data.coordinates.latitude !== undefined) {
        if (typeof data.coordinates.latitude !== 'number') {
          errors.push('coordinates.latitude must be a number');
        } else if (data.coordinates.latitude < -90 || data.coordinates.latitude > 90) {
          errors.push('coordinates.latitude must be between -90 and 90');
        }
      }

      if (data.coordinates.longitude !== undefined) {
        if (typeof data.coordinates.longitude !== 'number') {
          errors.push('coordinates.longitude must be a number');
        } else if (data.coordinates.longitude < -180 || data.coordinates.longitude > 180) {
          errors.push('coordinates.longitude must be between -180 and 180');
        }
      }
    }
  }

  if (data.metadata !== undefined) {
    if (typeof data.metadata !== 'object') {
      errors.push('metadata must be an object');
    } else {
      if (data.metadata.turbine_count !== undefined) {
        if (typeof data.metadata.turbine_count !== 'number') {
          errors.push('metadata.turbine_count must be a number');
        } else if (data.metadata.turbine_count < 0) {
          errors.push('metadata.turbine_count must be non-negative');
        }
      }

      if (data.metadata.total_capacity_mw !== undefined) {
        if (typeof data.metadata.total_capacity_mw !== 'number') {
          errors.push('metadata.total_capacity_mw must be a number');
        } else if (data.metadata.total_capacity_mw < 0) {
          errors.push('metadata.total_capacity_mw must be non-negative');
        }
      }

      if (data.metadata.annual_energy_gwh !== undefined) {
        if (typeof data.metadata.annual_energy_gwh !== 'number') {
          errors.push('metadata.annual_energy_gwh must be a number');
        } else if (data.metadata.annual_energy_gwh < 0) {
          errors.push('metadata.annual_energy_gwh must be non-negative');
        }
      }

      if (data.metadata.archived !== undefined) {
        if (typeof data.metadata.archived !== 'boolean') {
          errors.push('metadata.archived must be a boolean');
        }
      }

      if (data.metadata.archived_at !== undefined) {
        if (!isValidISODate(data.metadata.archived_at)) {
          errors.push('metadata.archived_at must be a valid ISO 8601 date-time string');
        }
      }

      if (data.metadata.imported_at !== undefined) {
        if (!isValidISODate(data.metadata.imported_at)) {
          errors.push('metadata.imported_at must be a valid ISO 8601 date-time string');
        }
      }

      if (data.metadata.status !== undefined) {
        const validStatuses = ['not_started', 'in_progress', 'completed', 'failed'];
        if (typeof data.metadata.status !== 'string') {
          errors.push('metadata.status must be a string');
        } else if (!validStatuses.includes(data.metadata.status)) {
          errors.push(`metadata.status must be one of: ${validStatuses.join(', ')}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if string is valid ISO 8601 date
 */
function isValidISODate(dateString: string): boolean {
  if (typeof dateString !== 'string') {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}

/**
 * Migrate legacy project data to current schema
 * Handles data from older versions that may have different structure
 */
export function migrateProjectData(legacyData: any): ProjectData {
  // Ensure required fields exist
  const migrated: ProjectData = {
    project_id: legacyData.project_id || legacyData.id || `proj-${Date.now()}-migrated`,
    project_name: legacyData.project_name || legacyData.name || 'unnamed-project',
    created_at: legacyData.created_at || legacyData.createdAt || new Date().toISOString(),
    updated_at: legacyData.updated_at || legacyData.updatedAt || new Date().toISOString(),
  };

  // Migrate coordinates
  if (legacyData.coordinates) {
    migrated.coordinates = {
      latitude: legacyData.coordinates.latitude || legacyData.coordinates.lat,
      longitude: legacyData.coordinates.longitude || legacyData.coordinates.lon || legacyData.coordinates.lng,
    };
  } else if (legacyData.lat && legacyData.lon) {
    migrated.coordinates = {
      latitude: legacyData.lat,
      longitude: legacyData.lon,
    };
  }

  // Migrate results
  if (legacyData.terrain_results || legacyData.terrainResults) {
    migrated.terrain_results = legacyData.terrain_results || legacyData.terrainResults;
  }

  if (legacyData.layout_results || legacyData.layoutResults) {
    migrated.layout_results = legacyData.layout_results || legacyData.layoutResults;
  }

  if (legacyData.simulation_results || legacyData.simulationResults) {
    migrated.simulation_results = legacyData.simulation_results || legacyData.simulationResults;
  }

  if (legacyData.report_results || legacyData.reportResults) {
    migrated.report_results = legacyData.report_results || legacyData.reportResults;
  }

  // Migrate metadata
  if (legacyData.metadata) {
    migrated.metadata = { ...legacyData.metadata };
  } else {
    // Extract metadata from results if available
    migrated.metadata = {};
    
    if (legacyData.layout_results?.turbine_count) {
      migrated.metadata.turbine_count = legacyData.layout_results.turbine_count;
    }
    
    if (legacyData.layout_results?.total_capacity_mw) {
      migrated.metadata.total_capacity_mw = legacyData.layout_results.total_capacity_mw;
    }
    
    if (legacyData.simulation_results?.annual_energy_gwh) {
      migrated.metadata.annual_energy_gwh = legacyData.simulation_results.annual_energy_gwh;
    }
  }

  return migrated;
}

/**
 * Sanitize project name to kebab-case
 */
export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Check if project has required data for specific operation
 */
export function hasRequiredData(project: ProjectData, operation: 'layout' | 'simulation' | 'report'): boolean {
  switch (operation) {
    case 'layout':
      return !!project.coordinates;
    case 'simulation':
      return !!project.layout_results;
    case 'report':
      return !!(project.terrain_results && project.layout_results && project.simulation_results);
    default:
      return false;
  }
}

/**
 * Get missing data message for operation
 */
export function getMissingDataMessage(project: ProjectData, operation: 'layout' | 'simulation' | 'report'): string {
  const projectName = project.project_name;
  
  switch (operation) {
    case 'layout':
      return `No coordinates found for project '${projectName}'. Please run terrain analysis first with coordinates.`;
    case 'simulation':
      return `No layout found for project '${projectName}'. Please run layout optimization first.`;
    case 'report':
      const missing: string[] = [];
      if (!project.terrain_results) missing.push('terrain analysis');
      if (!project.layout_results) missing.push('layout optimization');
      if (!project.simulation_results) missing.push('wake simulation');
      
      return `Missing ${missing.join(', ')} for project '${projectName}'. Please complete these steps first.`;
    default:
      return `Unknown operation: ${operation}`;
  }
}

/**
 * Check if project is archived
 */
export function isProjectArchived(project: ProjectData): boolean {
  return project.metadata?.archived === true;
}

/**
 * Check if project is in progress
 */
export function isProjectInProgress(project: ProjectData): boolean {
  return project.status === 'in_progress';
}

/**
 * Check if project was imported
 */
export function isProjectImported(project: ProjectData): boolean {
  return !!project.metadata?.imported_at;
}

/**
 * Get project completion percentage
 */
export function getProjectCompletionPercentage(project: ProjectData): number {
  let completed = 0;
  let total = 4; // terrain, layout, simulation, report
  
  if (project.terrain_results) completed++;
  if (project.layout_results) completed++;
  if (project.simulation_results) completed++;
  if (project.report_results) completed++;
  
  return Math.round((completed / total) * 100);
}

/**
 * Get project status display string
 */
export function getProjectStatusDisplay(project: ProjectData): string {
  if (project.status === 'in_progress') {
    return 'In Progress';
  } else if (project.status === 'completed') {
    return 'Completed';
  } else if (project.status === 'failed') {
    return 'Failed';
  } else {
    return 'Not Started';
  }
}

/**
 * Get archived status display string
 */
export function getArchivedStatusDisplay(project: ProjectData): string {
  if (isProjectArchived(project)) {
    const archivedAt = project.metadata?.archived_at;
    if (archivedAt) {
      const date = new Date(archivedAt);
      return `Archived on ${date.toLocaleDateString()}`;
    }
    return 'Archived';
  }
  return 'Active';
}
