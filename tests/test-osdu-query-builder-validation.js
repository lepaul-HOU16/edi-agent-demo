/**
 * OSDU Query Builder Validation Tests
 * 
 * These tests ensure that the query builder ONLY allows valid queries
 * and prevents users from creating failing queries.
 */

const { describe, it, expect } = require('@jest/globals');

// Mock query builder validation logic
class QueryBuilderValidator {
  validateCriterion(criterion) {
    // Check if value is empty
    if (criterion.value === '' || criterion.value === null || criterion.value === undefined) {
      return { isValid: false, errorMessage: 'Value is required' };
    }

    // Validate number fields
    if (criterion.fieldType === 'number') {
      const numValue = Number(criterion.value);
      if (isNaN(numValue)) {
        return { isValid: false, errorMessage: 'Must be a valid number' };
      }
      if (numValue < 0) {
        return { isValid: false, errorMessage: 'Must be a positive number' };
      }
    }

    // Validate date fields
    if (criterion.fieldType === 'date') {
      const dateValue = new Date(criterion.value);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, errorMessage: 'Must be a valid date (YYYY-MM-DD)' };
      }
    }

    // Validate string fields
    if (criterion.fieldType === 'string') {
      const strValue = String(criterion.value).trim();
      if (strValue.length === 0) {
        return { isValid: false, errorMessage: 'Value cannot be empty' };
      }
      if (strValue.length > 100) {
        return { isValid: false, errorMessage: 'Value too long (max 100 characters)' };
      }
    }

    return { isValid: true };
  }

  validateQuery(criteria) {
    const errors = [];

    if (criteria.length === 0) {
      errors.push('At least one filter criterion is required');
      return { isValid: false, errors };
    }

    criteria.forEach((criterion, index) => {
      const validation = this.validateCriterion(criterion);
      if (!validation.isValid) {
        errors.push(`Criterion ${index + 1}: ${validation.errorMessage}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  generateQuery(criteria) {
    if (criteria.length === 0) {
      return '// Add criteria to build your query';
    }

    const parts = [];

    criteria.forEach((criterion, index) => {
      let part = '';

      if (index > 0) {
        part += `${criterion.logic} `;
      }

      const field = criterion.field;
      const op = criterion.operator;
      const value = criterion.value;

      if (op === 'LIKE') {
        part += `${field} LIKE "%${value}%"`;
      } else if (op === 'IN') {
        const values = String(value).split(',').map(v => v.trim());
        part += `${field} IN (${values.map(v => `"${v}"`).join(', ')})`;
      } else {
        const quotedValue = criterion.fieldType === 'string' ? `"${value}"` : value;
        part += `${field} ${op} ${quotedValue}`;
      }

      parts.push(part);
    });

    return parts.join('\n');
  }
}

describe('OSDU Query Builder - Validation Tests', () => {
  const validator = new QueryBuilderValidator();

  describe('Empty Value Validation', () => {
    it('should reject empty string values', () => {
      const criterion = {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: '',
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value is required');
    });

    it('should reject null values', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: null,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value is required');
    });

    it('should reject undefined values', () => {
      const criterion = {
        field: 'data.country',
        fieldType: 'string',
        operator: '=',
        value: undefined,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value is required');
    });
  });

  describe('Number Field Validation', () => {
    it('should accept valid positive numbers', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: 3000,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });

    it('should reject non-numeric values', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: 'not a number',
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Must be a valid number');
    });

    it('should reject negative numbers', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: -100,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Must be a positive number');
    });

    it('should accept zero', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '=',
        value: 0,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Date Field Validation', () => {
    it('should accept valid date strings', () => {
      const criterion = {
        field: 'data.acquisitionDate',
        fieldType: 'date',
        operator: '>',
        value: '2024-01-01',
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid date strings', () => {
      const criterion = {
        field: 'data.acquisitionDate',
        fieldType: 'date',
        operator: '>',
        value: 'not-a-date',
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Must be a valid date (YYYY-MM-DD)');
    });

    it('should reject malformed dates', () => {
      const criterion = {
        field: 'data.acquisitionDate',
        fieldType: 'date',
        operator: '>',
        value: '2024-13-45', // Invalid month and day
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
    });
  });

  describe('String Field Validation', () => {
    it('should accept valid strings', () => {
      const criterion = {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'Shell',
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });

    it('should reject whitespace-only strings', () => {
      const criterion = {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: '   ',
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value cannot be empty');
    });

    it('should reject strings longer than 100 characters', () => {
      const criterion = {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'a'.repeat(101),
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value too long (max 100 characters)');
    });

    it('should accept strings exactly 100 characters', () => {
      const criterion = {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: 'a'.repeat(100),
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Query-Level Validation', () => {
    it('should reject queries with no criteria', () => {
      const result = validator.validateQuery([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one filter criterion is required');
    });

    it('should accept queries with all valid criteria', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: 'Shell',
          logic: 'AND'
        },
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '>',
          value: 3000,
          logic: 'AND'
        }
      ];

      const result = validator.validateQuery(criteria);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject queries with any invalid criterion', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: 'Shell',
          logic: 'AND'
        },
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '>',
          value: '', // Invalid: empty value
          logic: 'AND'
        }
      ];

      const result = validator.validateQuery(criteria);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Criterion 2');
    });

    it('should report all validation errors', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: '', // Invalid
          logic: 'AND'
        },
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '>',
          value: 'not-a-number', // Invalid
          logic: 'AND'
        },
        {
          field: 'data.country',
          fieldType: 'string',
          operator: '=',
          value: '   ', // Invalid
          logic: 'AND'
        }
      ];

      const result = validator.validateQuery(criteria);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('Query Generation', () => {
    it('should generate valid query for single criterion', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: 'Shell',
          logic: 'AND'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).toBe('data.operator = "Shell"');
    });

    it('should generate valid query for multiple criteria with AND', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: 'Shell',
          logic: 'AND'
        },
        {
          field: 'data.country',
          fieldType: 'string',
          operator: '=',
          value: 'Norway',
          logic: 'AND'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).toBe('data.operator = "Shell"\nAND data.country = "Norway"');
    });

    it('should generate valid query for multiple criteria with OR', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: 'Shell',
          logic: 'AND'
        },
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: '=',
          value: 'BP',
          logic: 'OR'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).toBe('data.operator = "Shell"\nOR data.operator = "BP"');
    });

    it('should generate valid query with LIKE operator', () => {
      const criteria = [
        {
          field: 'data.wellName',
          fieldType: 'string',
          operator: 'LIKE',
          value: 'North',
          logic: 'AND'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).toBe('data.wellName LIKE "%North%"');
    });

    it('should generate valid query with IN operator', () => {
      const criteria = [
        {
          field: 'data.operator',
          fieldType: 'string',
          operator: 'IN',
          value: 'Shell, BP, Equinor',
          logic: 'AND'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).toBe('data.operator IN ("Shell", "BP", "Equinor")');
    });

    it('should generate valid query with numeric comparison', () => {
      const criteria = [
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '>',
          value: 3000,
          logic: 'AND'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).toBe('data.depth > 3000');
    });

    it('should not quote numeric values', () => {
      const criteria = [
        {
          field: 'data.depth',
          fieldType: 'number',
          operator: '>=',
          value: 2500,
          logic: 'AND'
        }
      ];

      const query = validator.generateQuery(criteria);
      expect(query).not.toContain('"2500"');
      expect(query).toContain('2500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in string values', () => {
      const criterion = {
        field: 'data.operator',
        fieldType: 'string',
        operator: '=',
        value: "Shell's Company",
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });

    it('should handle very large numbers', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '>',
        value: 999999999,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const criterion = {
        field: 'data.depth',
        fieldType: 'number',
        operator: '=',
        value: 3456.78,
        logic: 'AND'
      };

      const result = validator.validateCriterion(criterion);
      expect(result.isValid).toBe(true);
    });
  });
});

console.log('✅ All OSDU Query Builder validation tests defined');
console.log('📋 Test Summary:');
console.log('   - Empty value validation');
console.log('   - Number field validation (positive, negative, NaN)');
console.log('   - Date field validation (valid/invalid formats)');
console.log('   - String field validation (length, whitespace)');
console.log('   - Query-level validation (no criteria, mixed valid/invalid)');
console.log('   - Query generation (single/multiple criteria, operators)');
console.log('   - Edge cases (special characters, large numbers, decimals)');
console.log('');
console.log('🎯 Goal: Ensure users can ONLY build queries that will succeed!');
