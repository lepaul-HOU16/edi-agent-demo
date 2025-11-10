/**
 * OSDU Query Templates
 * 
 * Pre-built query templates for common OSDU search scenarios.
 * Supports template application, modification, and custom template saving.
 */

export interface QueryCriterion {
  field: string;
  fieldType: 'string' | 'number' | 'date';
  operator: string;
  value: string | number | string[];
  logic: 'AND' | 'OR';
}

export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  dataType: 'well' | 'wellbore' | 'log' | 'seismic';
  criteria: QueryCriterion[];
  category: 'common' | 'advanced' | 'custom';
  icon?: string;
  tags?: string[];
  isCustom?: boolean;
  createdAt?: string;
}

/**
 * Built-in query templates for common searches
 */
export const BUILT_IN_TEMPLATES: QueryTemplate[] = [
  {
    id: 'wells-by-operator',
    name: 'Wells by Operator',
    description: 'Find all wells operated by a specific company',
    dataType: 'well',
    category: 'common',
    icon: 'search',
    tags: ['operator', 'company', 'wells'],
    criteria: [
      {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'wells-by-location',
    name: 'Wells by Location',
    description: 'Find wells in a specific country or region',
    dataType: 'well',
    category: 'common',
    icon: 'search',
    tags: ['location', 'country', 'geography'],
    criteria: [
      {
        field: 'data.country',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'wells-by-depth-range',
    name: 'Wells by Depth Range',
    description: 'Find wells within a specific depth range',
    dataType: 'well',
    category: 'common',
    icon: 'search',
    tags: ['depth', 'range', 'drilling'],
    criteria: [
      {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: '',
        logic: 'AND'
      },
      {
        field: 'data.depth',
        fieldType: 'number',
        operator: '<',
        value: '',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'logs-by-type',
    name: 'Logs by Type',
    description: 'Find well logs of a specific type (GR, RHOB, etc.)',
    dataType: 'log',
    category: 'common',
    icon: 'search',
    tags: ['logs', 'curves', 'petrophysics'],
    criteria: [
      {
        field: 'data.logType',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'active-production-wells',
    name: 'Active Production Wells',
    description: 'Find all currently active production wells',
    dataType: 'well',
    category: 'common',
    icon: 'status-positive',
    tags: ['production', 'active', 'status'],
    criteria: [
      {
        field: 'data.status',
        fieldType: 'string',
        operator: '=',
        value: 'Active',
        logic: 'AND'
      },
      {
        field: 'data.wellType',
        fieldType: 'string',
        operator: '=',
        value: 'Production',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'deep-exploration-wells',
    name: 'Deep Exploration Wells',
    description: 'Find exploration wells deeper than 3000m',
    dataType: 'well',
    category: 'advanced',
    icon: 'search',
    tags: ['exploration', 'deep', 'drilling'],
    criteria: [
      {
        field: 'data.wellType',
        fieldType: 'string',
        operator: '=',
        value: 'Exploration',
        logic: 'AND'
      },
      {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: 3000,
        logic: 'AND'
      }
    ]
  },
  {
    id: 'north-sea-operators',
    name: 'North Sea Operators',
    description: 'Find all operators with wells in the North Sea basin',
    dataType: 'well',
    category: 'advanced',
    icon: 'search',
    tags: ['north sea', 'basin', 'operators'],
    criteria: [
      {
        field: 'data.basin',
        fieldType: 'string',
        operator: '=',
        value: 'North Sea',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'recent-wells',
    name: 'Recently Drilled Wells',
    description: 'Find wells drilled in the last year',
    dataType: 'well',
    category: 'advanced',
    icon: 'calendar',
    tags: ['recent', 'new', 'drilling'],
    criteria: [
      {
        field: 'data.createdDate',
        fieldType: 'date',
        operator: '>',
        value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logic: 'AND'
      }
    ]
  },
  {
    id: 'horizontal-wellbores',
    name: 'Horizontal Wellbores',
    description: 'Find all horizontal wellbores',
    dataType: 'wellbore',
    category: 'common',
    icon: 'search',
    tags: ['horizontal', 'wellbore', 'drilling'],
    criteria: [
      {
        field: 'data.wellboreType',
        fieldType: 'string',
        operator: '=',
        value: 'Horizontal',
        logic: 'AND'
      }
    ]
  },
  {
    id: 'seismic-3d-surveys',
    name: '3D Seismic Surveys',
    description: 'Find all 3D seismic surveys',
    dataType: 'seismic',
    category: 'common',
    icon: 'search',
    tags: ['seismic', '3d', 'survey'],
    criteria: [
      {
        field: 'data.surveyType',
        fieldType: 'string',
        operator: '=',
        value: '3D',
        logic: 'AND'
      }
    ]
  }
];

/**
 * Local storage key for custom templates
 */
const CUSTOM_TEMPLATES_KEY = 'osdu_custom_query_templates';

/**
 * Get all templates (built-in + custom)
 */
export function getAllTemplates(): QueryTemplate[] {
  const customTemplates = getCustomTemplates();
  return [...BUILT_IN_TEMPLATES, ...customTemplates];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'common' | 'advanced' | 'custom'): QueryTemplate[] {
  return getAllTemplates().filter(t => t.category === category);
}

/**
 * Get templates by data type
 */
export function getTemplatesByDataType(dataType: 'well' | 'wellbore' | 'log' | 'seismic'): QueryTemplate[] {
  return getAllTemplates().filter(t => t.dataType === dataType);
}

/**
 * Get a specific template by ID
 */
export function getTemplateById(id: string): QueryTemplate | undefined {
  return getAllTemplates().find(t => t.id === id);
}

/**
 * Search templates by name or tags
 */
export function searchTemplates(query: string): QueryTemplate[] {
  const lowerQuery = query.toLowerCase();
  return getAllTemplates().filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get custom templates from local storage
 */
export function getCustomTemplates(): QueryTemplate[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!stored) return [];
    
    const templates = JSON.parse(stored);
    return Array.isArray(templates) ? templates : [];
  } catch (error) {
    console.error('Failed to load custom templates:', error);
    return [];
  }
}

/**
 * Save a custom template
 */
export function saveCustomTemplate(template: Omit<QueryTemplate, 'id' | 'isCustom' | 'createdAt'>): QueryTemplate {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save templates in server-side environment');
  }

  const customTemplate: QueryTemplate = {
    ...template,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: 'custom',
    isCustom: true,
    createdAt: new Date().toISOString()
  };

  const customTemplates = getCustomTemplates();
  customTemplates.push(customTemplate);

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
    return customTemplate;
  } catch (error) {
    console.error('Failed to save custom template:', error);
    throw new Error('Failed to save template. Storage may be full.');
  }
}

/**
 * Update an existing custom template
 */
export function updateCustomTemplate(id: string, updates: Partial<QueryTemplate>): QueryTemplate | null {
  if (typeof window === 'undefined') {
    throw new Error('Cannot update templates in server-side environment');
  }

  const customTemplates = getCustomTemplates();
  const index = customTemplates.findIndex(t => t.id === id);

  if (index === -1) {
    return null;
  }

  customTemplates[index] = {
    ...customTemplates[index],
    ...updates,
    id, // Preserve original ID
    isCustom: true, // Ensure it stays marked as custom
    category: 'custom' // Ensure category stays custom
  };

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
    return customTemplates[index];
  } catch (error) {
    console.error('Failed to update custom template:', error);
    throw new Error('Failed to update template');
  }
}

/**
 * Delete a custom template
 */
export function deleteCustomTemplate(id: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('Cannot delete templates in server-side environment');
  }

  const customTemplates = getCustomTemplates();
  const filtered = customTemplates.filter(t => t.id !== id);

  if (filtered.length === customTemplates.length) {
    return false; // Template not found
  }

  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete custom template:', error);
    throw new Error('Failed to delete template');
  }
}

/**
 * Export templates as JSON
 */
export function exportTemplates(templateIds?: string[]): string {
  const templates = templateIds
    ? getAllTemplates().filter(t => templateIds.includes(t.id))
    : getAllTemplates();

  return JSON.stringify(templates, null, 2);
}

/**
 * Import templates from JSON
 */
export function importTemplates(jsonString: string): { success: number; failed: number; errors: string[] } {
  if (typeof window === 'undefined') {
    throw new Error('Cannot import templates in server-side environment');
  }

  const result = { success: 0, failed: 0, errors: [] as string[] };

  try {
    const templates = JSON.parse(jsonString);
    
    if (!Array.isArray(templates)) {
      throw new Error('Invalid format: expected array of templates');
    }

    const customTemplates = getCustomTemplates();

    for (const template of templates) {
      try {
        // Validate template structure
        if (!template.name || !template.dataType || !template.criteria) {
          result.failed++;
          result.errors.push(`Invalid template structure: ${template.name || 'unnamed'}`);
          continue;
        }

        // Create new custom template
        const newTemplate: QueryTemplate = {
          ...template,
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: 'custom',
          isCustom: true,
          createdAt: new Date().toISOString()
        };

        customTemplates.push(newTemplate);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to import template: ${error.message}`);
      }
    }

    // Save all imported templates
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customTemplates));
  } catch (error) {
    throw new Error(`Failed to parse templates: ${error.message}`);
  }

  return result;
}

/**
 * Clear all custom templates
 */
export function clearCustomTemplates(): void {
  if (typeof window === 'undefined') {
    throw new Error('Cannot clear templates in server-side environment');
  }

  localStorage.removeItem(CUSTOM_TEMPLATES_KEY);
}

/**
 * Validate template structure
 */
export function validateTemplate(template: Partial<QueryTemplate>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!template.dataType) {
    errors.push('Data type is required');
  }

  if (!template.criteria || !Array.isArray(template.criteria) || template.criteria.length === 0) {
    errors.push('At least one criterion is required');
  }

  if (template.criteria) {
    template.criteria.forEach((criterion, index) => {
      if (!criterion.field) {
        errors.push(`Criterion ${index + 1}: field is required`);
      }
      if (!criterion.operator) {
        errors.push(`Criterion ${index + 1}: operator is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
