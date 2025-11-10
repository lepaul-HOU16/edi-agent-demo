/**
 * Unit Tests for OSDU Query Builder
 * 
 * Tests query generation, validation logic, and template application
 * Requirements: All (comprehensive unit test coverage)
 */

import {
  generateOSDUQuery,
  generateFormattedOSDUQuery,
  generateCriterionQuery,
  formatQueryValue,
  escapeQueryString,
  validateQuerySyntax,
  optimizeQuery,
  type QueryCriterion
} from '@/utils/osduQueryGenerator';

import {
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByDataType,
  searchTemplates,
  saveCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  validateTemplate,
  type QueryTemplate
} from '@/utils/osduQueryTemplates';

describe('OSDU Query Generator - String Escaping', () => {
  test('should escape special characters in strings', () => {
    expect(escapeQueryString('test"value')).toBe('test\\"value');
    expect(escapeQueryString("test'value")).toBe("test\\'value");
    expect(escapeQueryString('test\\value')).toBe('test\\\\value');
    expect(escapeQueryString('test\nvalue')).toBe('test\\nvalue');
    expect(escapeQueryString('test\tvalue')).toBe('test\\tvalue');
  });

  test('should handle strings with multiple special characters', () => {
    const input = 'test"value\'with\\special\nchars';
    const escaped = escapeQueryString(input);
    expect(escaped).toContain('\\"');
    expect(escaped).toContain("\\'");
    expect(escaped).toContain('\\\\');
    expect(escaped).toContain('\\n');
  });

  test('should handle empty strings', () => {
    expect(escapeQueryString('')).toBe('');
  });
});

describe('OSDU Query Generator - Value Formatting', () => {
  describe('String values', () => {
    test('should format simple string values with quotes', () => {
      expect(formatQueryValue('Shell', 'string', '=')).toBe('"Shell"');
      expect(formatQueryValue('Norway', 'string', '=')).toBe('"Norway"');
    });

    test('should handle LIKE operator with wildcards', () => {
      expect(formatQueryValue('North*', 'string', 'LIKE')).toBe('"North%"');
      expect(formatQueryValue('?ell', 'string', 'LIKE')).toBe('"_ell"');
      expect(formatQueryValue('*test*', 'string', 'LIKE')).toBe('"%test%"');
    });

    test('should add wildcards for LIKE without user wildcards', () => {
      expect(formatQueryValue('Shell', 'string', 'LIKE')).toBe('"%Shell%"');
    });

    test('should handle IN operator with comma-separated values', () => {
      const result = formatQueryValue('Shell, BP, Equinor', 'string', 'IN');
      expect(result).toBe('("Shell", "BP", "Equinor")');
    });

    test('should handle NOT IN operator', () => {
      const result = formatQueryValue('Test, Temp', 'string', 'NOT IN');
      expect(result).toBe('("Test", "Temp")');
    });
  });

  describe('Number values', () => {
    test('should format numeric values without quotes', () => {
      expect(formatQueryValue('3000', 'number', '=')).toBe('3000');
      expect(formatQueryValue('5000.5', 'number', '>')).toBe('5000.5');
    });

    test('should handle BETWEEN operator for numbers', () => {
      const result = formatQueryValue('1000, 5000', 'number', 'BETWEEN');
      expect(result).toBe('1000 AND 5000');
    });

    test('should throw error for invalid numeric values', () => {
      expect(() => formatQueryValue('abc', 'number', '=')).toThrow('Invalid numeric value');
    });

    test('should throw error for BETWEEN with wrong number of values', () => {
      expect(() => formatQueryValue('1000', 'number', 'BETWEEN')).toThrow('exactly two values');
    });
  });

  describe('Date values', () => {
    test('should format date values with quotes', () => {
      const result = formatQueryValue('2023-01-15', 'date', '=');
      expect(result).toBe('"2023-01-15"');
    });

    test('should handle BETWEEN operator for dates', () => {
      const result = formatQueryValue('2022-01-01, 2023-12-31', 'date', 'BETWEEN');
      // Date BETWEEN values are formatted without quotes in the current implementation
      expect(result).toBe('2022-01-01 AND 2023-12-31');
    });

    test('should throw error for invalid date values', () => {
      expect(() => formatQueryValue('invalid-date', 'date', '=')).toThrow('Invalid date value');
    });
  });
});

describe('OSDU Query Generator - Criterion Generation', () => {
  test('should generate simple equality criterion', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.operator',
      fieldType: 'string',
      operator: '=',
      value: 'Shell',
      logic: 'AND',
      isValid: true
    };
    
    expect(generateCriterionQuery(criterion)).toBe('data.operator = "Shell"');
  });

  test('should generate comparison criteria for numbers', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.depth',
      fieldType: 'number',
      operator: '>',
      value: 3000,
      logic: 'AND',
      isValid: true
    };
    
    expect(generateCriterionQuery(criterion)).toBe('data.depth > 3000');
  });

  test('should generate LIKE criterion', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.wellName',
      fieldType: 'string',
      operator: 'LIKE',
      value: 'North*',
      logic: 'AND',
      isValid: true
    };
    
    expect(generateCriterionQuery(criterion)).toBe('data.wellName LIKE "North%"');
  });

  test('should generate IN criterion', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.operator',
      fieldType: 'string',
      operator: 'IN',
      value: 'Shell, BP, Equinor',
      logic: 'AND',
      isValid: true
    };
    
    expect(generateCriterionQuery(criterion)).toBe('data.operator IN ("Shell", "BP", "Equinor")');
  });

  test('should generate BETWEEN criterion', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.depth',
      fieldType: 'number',
      operator: 'BETWEEN',
      value: '1000, 5000',
      logic: 'AND',
      isValid: true
    };
    
    expect(generateCriterionQuery(criterion)).toBe('data.depth BETWEEN 1000 AND 5000');
  });
});

describe('OSDU Query Generator - Complete Query Generation', () => {
  test('should generate query with single criterion', () => {
    const criteria: QueryCriterion[] = [{
      id: '1',
      field: 'data.operator',
      fieldType: 'string',
      operator: '=',
      value: 'Shell',
      logic: 'AND',
      isValid: true
    }];
    
    expect(generateOSDUQuery(criteria)).toBe('data.operator = "Shell"');
  });

  test('should generate query with multiple AND criteria', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.country',
        fieldType: 'string',
        operator: '=',
        value: 'Norway',
        logic: 'AND',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    expect(query).toContain('data.operator = "Shell"');
    expect(query).toContain('AND data.country = "Norway"');
  });

  test('should generate query with OR logic', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'BP',
        logic: 'OR',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    expect(query).toContain('data.operator = "Shell"');
    expect(query).toContain('OR data.operator = "BP"');
  });

  test('should generate query with mixed AND/OR logic', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'BP',
        logic: 'OR',
        isValid: true
      },
      {
        id: '3',
        field: 'data.country',
        fieldType: 'string',
        operator: '=',
        value: 'Norway',
        logic: 'AND',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    // Should have proper grouping with parentheses
    expect(query).toContain('(');
    expect(query).toContain(')');
    expect(query).toContain('AND');
    expect(query).toContain('OR');
  });

  test('should handle depth range query', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: 1000,
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.depth',
        fieldType: 'number',
        operator: '<',
        value: 5000,
        logic: 'AND',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    expect(query).toContain('data.depth > 1000');
    expect(query).toContain('AND data.depth < 5000');
  });

  test('should return empty string for empty criteria', () => {
    expect(generateOSDUQuery([])).toBe('');
  });
});

describe('OSDU Query Generator - Formatted Query', () => {
  test('should generate formatted multi-line query', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.country',
        fieldType: 'string',
        operator: '=',
        value: 'Norway',
        logic: 'AND',
        isValid: true
      }
    ];
    
    const formatted = generateFormattedOSDUQuery(criteria);
    expect(formatted).toContain('\n');
    expect(formatted).toContain('data.operator = "Shell"');
    expect(formatted).toContain('AND data.country = "Norway"');
  });

  test('should return placeholder for empty criteria', () => {
    const formatted = generateFormattedOSDUQuery([]);
    expect(formatted).toContain('Add criteria');
  });
});

describe('OSDU Query Generator - Query Validation', () => {
  test('should validate correct query syntax', () => {
    const query = 'data.operator = "Shell" AND data.country = "Norway"';
    const result = validateQuerySyntax(query);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect empty query', () => {
    const result = validateQuerySyntax('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Query cannot be empty');
  });

  test('should detect unmatched quotes', () => {
    const query = 'data.operator = "Shell';
    const result = validateQuerySyntax(query);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('quotes'))).toBe(true);
  });

  test('should detect unmatched parentheses', () => {
    const query = '(data.operator = "Shell" AND data.country = "Norway"';
    const result = validateQuerySyntax(query);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('parentheses'))).toBe(true);
  });

  test('should detect missing operators', () => {
    const query = 'data.operator "Shell"';
    const result = validateQuerySyntax(query);
    expect(result.isValid).toBe(false);
  });
});

describe('OSDU Query Generator - Query Optimization', () => {
  test('should remove unnecessary outer parentheses', () => {
    const query = '(data.operator = "Shell")';
    expect(optimizeQuery(query)).toBe('data.operator = "Shell"');
  });

  test('should remove multiple layers of outer parentheses', () => {
    const query = '((data.operator = "Shell"))';
    expect(optimizeQuery(query)).toBe('data.operator = "Shell"');
  });

  test('should preserve necessary parentheses', () => {
    const query = '(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway"';
    const optimized = optimizeQuery(query);
    expect(optimized).toContain('(');
    expect(optimized).toContain(')');
  });

  test('should handle query without parentheses', () => {
    const query = 'data.operator = "Shell"';
    expect(optimizeQuery(query)).toBe('data.operator = "Shell"');
  });
});

describe('OSDU Query Templates - Template Retrieval', () => {
  test('should get all built-in templates', () => {
    const templates = getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every(t => t.id && t.name && t.dataType)).toBe(true);
  });

  test('should get template by ID', () => {
    const template = getTemplateById('wells-by-operator');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Wells by Operator');
    expect(template?.dataType).toBe('well');
  });

  test('should return undefined for non-existent template ID', () => {
    const template = getTemplateById('non-existent-id');
    expect(template).toBeUndefined();
  });

  test('should get templates by category', () => {
    const commonTemplates = getTemplatesByCategory('common');
    expect(commonTemplates.length).toBeGreaterThan(0);
    expect(commonTemplates.every(t => t.category === 'common')).toBe(true);
  });

  test('should get templates by data type', () => {
    const wellTemplates = getTemplatesByDataType('well');
    expect(wellTemplates.length).toBeGreaterThan(0);
    expect(wellTemplates.every(t => t.dataType === 'well')).toBe(true);
  });

  test('should search templates by name', () => {
    const results = searchTemplates('operator');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(t => t.name.toLowerCase().includes('operator'))).toBe(true);
  });

  test('should search templates by tags', () => {
    const results = searchTemplates('depth');
    expect(results.length).toBeGreaterThan(0);
  });

  test('should return empty array for no search matches', () => {
    const results = searchTemplates('xyz123nonexistent');
    expect(results).toHaveLength(0);
  });
});

describe('OSDU Query Templates - Template Validation', () => {
  test('should validate complete template', () => {
    const template = {
      name: 'Test Template',
      description: 'Test description',
      dataType: 'well' as const,
      category: 'custom' as const,
      criteria: [{
        field: 'data.operator',
        fieldType: 'string' as const,
        operator: '=',
        value: 'Shell',
        logic: 'AND' as const
      }]
    };
    
    const result = validateTemplate(template);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing template name', () => {
    const template = {
      name: '',
      dataType: 'well' as const,
      criteria: []
    };
    
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  test('should detect missing data type', () => {
    const template = {
      name: 'Test',
      criteria: []
    };
    
    const result = validateTemplate(template as any);
    expect(result.isValid).toBe(false);
    // Check for either 'data type' or 'Data type' in error message
    expect(result.errors.some(e => e.toLowerCase().includes('data type'))).toBe(true);
  });

  test('should detect missing criteria', () => {
    const template = {
      name: 'Test',
      dataType: 'well' as const,
      criteria: []
    };
    
    const result = validateTemplate(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('criterion'))).toBe(true);
  });

  test('should detect invalid criterion structure', () => {
    const template = {
      name: 'Test',
      dataType: 'well' as const,
      criteria: [{
        field: '',
        operator: '',
        value: '',
        logic: 'AND' as const
      }]
    };
    
    const result = validateTemplate(template as any);
    expect(result.isValid).toBe(false);
  });
});

describe('OSDU Query Templates - Custom Templates (Browser Environment)', () => {
  // Mock localStorage for testing
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    
    global.localStorage = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
      length: 0,
      key: () => null
    } as Storage;
  });

  test('should save custom template', () => {
    const template = {
      name: 'My Custom Template',
      description: 'Custom description',
      dataType: 'well' as const,
      criteria: [{
        field: 'data.operator',
        fieldType: 'string' as const,
        operator: '=',
        value: 'Shell',
        logic: 'AND' as const
      }]
    };
    
    const saved = saveCustomTemplate(template);
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('My Custom Template');
    expect(saved.category).toBe('custom');
    expect(saved.isCustom).toBe(true);
    expect(saved.createdAt).toBeDefined();
  });

  test('should update custom template', () => {
    const template = {
      name: 'Original Name',
      description: 'Original description',
      dataType: 'well' as const,
      criteria: [{
        field: 'data.operator',
        fieldType: 'string' as const,
        operator: '=',
        value: 'Shell',
        logic: 'AND' as const
      }]
    };
    
    const saved = saveCustomTemplate(template);
    const updated = updateCustomTemplate(saved.id, { name: 'Updated Name' });
    
    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated Name');
    expect(updated?.id).toBe(saved.id);
  });

  test('should delete custom template', () => {
    const template = {
      name: 'To Delete',
      description: 'Will be deleted',
      dataType: 'well' as const,
      criteria: [{
        field: 'data.operator',
        fieldType: 'string' as const,
        operator: '=',
        value: 'Shell',
        logic: 'AND' as const
      }]
    };
    
    const saved = saveCustomTemplate(template);
    const deleted = deleteCustomTemplate(saved.id);
    
    expect(deleted).toBe(true);
    
    const retrieved = getTemplateById(saved.id);
    expect(retrieved).toBeUndefined();
  });

  test('should return false when deleting non-existent template', () => {
    const deleted = deleteCustomTemplate('non-existent-id');
    expect(deleted).toBe(false);
  });

  test('should return null when updating non-existent template', () => {
    const updated = updateCustomTemplate('non-existent-id', { name: 'New Name' });
    expect(updated).toBeNull();
  });
});

describe('OSDU Query Builder - Field Type Validation', () => {
  test('should validate string field values', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.operator',
      fieldType: 'string',
      operator: '=',
      value: 'Shell',
      logic: 'AND',
      isValid: true
    };
    
    expect(() => generateCriterionQuery(criterion)).not.toThrow();
  });

  test('should validate number field values', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.depth',
      fieldType: 'number',
      operator: '>',
      value: 3000,
      logic: 'AND',
      isValid: true
    };
    
    expect(() => generateCriterionQuery(criterion)).not.toThrow();
  });

  test('should validate date field values', () => {
    const criterion: QueryCriterion = {
      id: '1',
      field: 'data.createdDate',
      fieldType: 'date',
      operator: '>',
      value: '2023-01-01',
      logic: 'AND',
      isValid: true
    };
    
    expect(() => generateCriterionQuery(criterion)).not.toThrow();
  });
});

describe('OSDU Query Builder - Complex Query Scenarios', () => {
  test('should handle query with all operator types', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.wellName',
        fieldType: 'string',
        operator: 'LIKE',
        value: 'North*',
        logic: 'AND',
        isValid: true
      },
      {
        id: '3',
        field: 'data.depth',
        fieldType: 'number',
        operator: 'BETWEEN',
        value: '1000, 5000',
        logic: 'AND',
        isValid: true
      },
      {
        id: '4',
        field: 'data.status',
        fieldType: 'string',
        operator: 'IN',
        value: 'Active, Drilling',
        logic: 'AND',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    expect(query).toContain('data.operator = "Shell"');
    expect(query).toContain('data.wellName LIKE "North%"');
    expect(query).toContain('data.depth BETWEEN 1000 AND 5000');
    expect(query).toContain('data.status IN ("Active", "Drilling")');
  });

  test('should handle query with NOT operators', () => {
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '!=',
        value: 'Unknown',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.wellName',
        fieldType: 'string',
        operator: 'NOT LIKE',
        value: '*Test*',
        logic: 'AND',
        isValid: true
      },
      {
        id: '3',
        field: 'data.status',
        fieldType: 'string',
        operator: 'NOT IN',
        value: 'Abandoned, Inactive',
        logic: 'AND',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    expect(query).toContain('!=');
    expect(query).toContain('NOT LIKE');
    expect(query).toContain('NOT IN');
  });

  test('should handle production-ready query example', () => {
    // Real-world example: Find active production wells in North Sea operated by Shell
    const criteria: QueryCriterion[] = [
      {
        id: '1',
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND',
        isValid: true
      },
      {
        id: '2',
        field: 'data.basin',
        fieldType: 'string',
        operator: '=',
        value: 'North Sea',
        logic: 'AND',
        isValid: true
      },
      {
        id: '3',
        field: 'data.status',
        fieldType: 'string',
        operator: '=',
        value: 'Active',
        logic: 'AND',
        isValid: true
      },
      {
        id: '4',
        field: 'data.wellType',
        fieldType: 'string',
        operator: '=',
        value: 'Production',
        logic: 'AND',
        isValid: true
      },
      {
        id: '5',
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: 3000,
        logic: 'AND',
        isValid: true
      }
    ];
    
    const query = generateOSDUQuery(criteria);
    expect(query).toContain('data.operator = "Shell"');
    expect(query).toContain('data.basin = "North Sea"');
    expect(query).toContain('data.status = "Active"');
    expect(query).toContain('data.wellType = "Production"');
    expect(query).toContain('data.depth > 3000');
    
    // Verify it's a valid query
    const validation = validateQuerySyntax(query);
    expect(validation.isValid).toBe(true);
  });
});
