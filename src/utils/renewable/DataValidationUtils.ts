/**
 * Standardized data validation utilities for renewable energy components
 * Provides consistent validation patterns, error reporting, and data sanitization
 */

export interface ValidationRule<T = any> {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Standardized data validator for renewable energy data
 */
export class RenewableDataValidator {
  private rules: ValidationRule[] = [];

  constructor(rules: ValidationRule[] = []) {
    this.rules = rules;
  }

  /**
   * Add validation rule
   */
  public addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Validate data against all rules
   */
  public validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const sanitizedData = { ...data };

    for (const rule of this.rules) {
      const fieldValue = this.getNestedValue(data, rule.field);
      const fieldErrors = this.validateField(rule, fieldValue, rule.field);
      
      errors.push(...fieldErrors.filter(e => e.severity === 'error'));
      warnings.push(...fieldErrors.filter(e => e.severity === 'warning').map(e => ({
        field: e.field,
        message: e.message,
        suggestion: this.getSuggestion(rule, fieldValue)
      })));

      // Sanitize data if needed
      if (fieldValue !== undefined) {
        this.setNestedValue(sanitizedData, rule.field, this.sanitizeValue(rule, fieldValue));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  private validateField(rule: ValidationRule, value: any, fieldPath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required field check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldPath,
        message: `${fieldPath} is required`,
        code: 'REQUIRED_FIELD_MISSING',
        severity: 'error'
      });
      return errors; // Skip other validations if required field is missing
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null)) {
      return errors;
    }

    // Type validation
    if (rule.type && !this.validateType(value, rule.type)) {
      errors.push({
        field: fieldPath,
        message: `${fieldPath} must be of type ${rule.type}`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    }

    // Range validation for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldPath,
          message: `${fieldPath} must be at least ${rule.min}`,
          code: 'VALUE_TOO_LOW',
          severity: 'error'
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldPath,
          message: `${fieldPath} must be at most ${rule.max}`,
          code: 'VALUE_TOO_HIGH',
          severity: 'error'
        });
      }
    }

    // Pattern validation for strings
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        field: fieldPath,
        message: `${fieldPath} format is invalid`,
        code: 'INVALID_FORMAT',
        severity: 'error'
      });
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field: fieldPath,
          message: typeof customResult === 'string' ? customResult : `${fieldPath} failed custom validation`,
          code: 'CUSTOM_VALIDATION_FAILED',
          severity: 'error'
        });
      }
    }

    return errors;
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private sanitizeValue(rule: ValidationRule, value: any): any {
    if (rule.type === 'string' && typeof value !== 'string') {
      return String(value);
    }
    if (rule.type === 'number' && typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  }

  private getSuggestion(rule: ValidationRule, value: any): string | undefined {
    if (rule.type === 'number' && typeof value === 'string') {
      return 'Try converting to a number';
    }
    if (rule.pattern && typeof value === 'string') {
      return 'Check the format requirements';
    }
    return undefined;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

/**
 * Pre-defined validators for common renewable energy data types
 */
export const RenewableValidators = {
  /**
   * Validator for wind resource data
   */
  windData: new RenewableDataValidator([
    { field: 'location.latitude', required: true, type: 'number', min: -90, max: 90 },
    { field: 'location.longitude', required: true, type: 'number', min: -180, max: 180 },
    { field: 'windSpeed', required: true, type: 'array' },
    { field: 'windDirection', required: true, type: 'array' },
    { field: 'measurements', required: true, type: 'array' }
  ]),

  /**
   * Validator for terrain data
   */
  terrainData: new RenewableDataValidator([
    { field: 'features', required: true, type: 'array' },
    { field: 'mapHtml', required: false, type: 'string' },
    { field: 'metadata.source', required: true, type: 'string' },
    { field: 'metadata.reliability', required: true, type: 'string' }
  ]),

  /**
   * Validator for turbine layout data
   */
  layoutData: new RenewableDataValidator([
    { field: 'turbines', required: true, type: 'array' },
    { field: 'siteArea', required: true, type: 'object' },
    { field: 'constraints', required: false, type: 'array' },
    { field: 'optimization.energyYield', required: false, type: 'number', min: 0 }
  ]),

  /**
   * Validator for wake analysis data
   */
  wakeData: new RenewableDataValidator([
    { field: 'turbinePositions', required: true, type: 'array' },
    { field: 'wakeEffects', required: true, type: 'array' },
    { field: 'totalWakeLoss', required: true, type: 'number', min: 0, max: 100 }
  ]),

  /**
   * Validator for site suitability data
   */
  suitabilityData: new RenewableDataValidator([
    { field: 'overallScore', required: true, type: 'number', min: 0, max: 100 },
    { field: 'componentScores', required: true, type: 'object' },
    { field: 'riskFactors', required: false, type: 'array' },
    { field: 'recommendations', required: false, type: 'array' }
  ])
};

/**
 * Utility functions for common validation tasks
 */
export const ValidationUtils = {
  /**
   * Validate coordinate pair
   */
  isValidCoordinate: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  /**
   * Validate wind speed value
   */
  isValidWindSpeed: (speed: number): boolean => {
    return speed >= 0 && speed <= 100; // m/s
  },

  /**
   * Validate wind direction value
   */
  isValidWindDirection: (direction: number): boolean => {
    return direction >= 0 && direction < 360;
  },

  /**
   * Validate percentage value
   */
  isValidPercentage: (value: number): boolean => {
    return value >= 0 && value <= 100;
  },

  /**
   * Sanitize HTML content for safe display
   */
  sanitizeHtml: (html: string): string => {
    // Basic HTML sanitization - in production, use a proper library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '');
  },

  /**
   * Validate GeoJSON feature
   */
  isValidGeoJSONFeature: (feature: any): boolean => {
    return (
      feature &&
      typeof feature === 'object' &&
      feature.type === 'Feature' &&
      feature.geometry &&
      typeof feature.geometry === 'object' &&
      feature.properties &&
      typeof feature.properties === 'object'
    );
  }
};

/**
 * Hook for using validation in components
 */
export const useRenewableValidation = (validatorType: keyof typeof RenewableValidators) => {
  const validator = RenewableValidators[validatorType];

  return {
    validate: (data: any) => validator.validate(data),
    isValid: (data: any) => validator.validate(data).isValid,
    getErrors: (data: any) => validator.validate(data).errors,
    getWarnings: (data: any) => validator.validate(data).warnings,
    sanitize: (data: any) => validator.validate(data).sanitizedData
  };
};