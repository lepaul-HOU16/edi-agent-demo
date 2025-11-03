/**
 * Tests for standardized renewable energy utilities
 * Validates error handling, loading states, validation, exports, and design tokens
 */

import {
  RenewableErrorHandler,
  handleRenewableError,
  RenewableDataValidator,
  RenewableValidators,
  ValidationUtils,
  RenewableExportService,
  ExportUtils,
  RenewableColors,
  getPerformanceColor,
  getWakeImpactColor,
  formatMetricValue,
  analyzeComponentForMigration,
  validateCloudscapeCompliance
} from '../index';

describe('RenewableErrorHandler', () => {
  let errorHandler: RenewableErrorHandler;

  beforeEach(() => {
    errorHandler = RenewableErrorHandler.getInstance();
  });

  test('should format error for user display', () => {
    const error = new Error('Network connection failed');
    const context = { component: 'WindRoseVisualization', action: 'loadData' };
    
    const formatted = errorHandler.formatForUser(error, context);
    
    expect(formatted.message).toContain('Unable to connect to the service');
    expect(formatted.code).toContain('WINDROSEVISUALIZATION_NETWORK_ERROR');
    expect(formatted.severity).toBe('medium');
    expect(formatted.recoverable).toBe(true);
    expect(formatted.suggestions).toContain('Check your internet connection');
  });

  test('should handle different error types', () => {
    const exportError = new Error('Export failed');
    const validationError = new Error('Invalid data format');
    
    const exportFormatted = handleRenewableError(exportError, 'ExportService');
    const validationFormatted = handleRenewableError(validationError, 'DataValidator');
    
    expect(exportFormatted.severity).toBe('low');
    expect(validationFormatted.severity).toBe('medium');
  });
});

describe('RenewableDataValidator', () => {
  test('should validate wind data correctly', () => {
    const validWindData = {
      location: { latitude: 40.7128, longitude: -74.0060 },
      windSpeed: [5.2, 6.1, 4.8],
      windDirection: [180, 200, 160],
      measurements: [{ speed: 5.2, direction: 180 }]
    };

    const result = RenewableValidators.windData.validate(validWindData);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect invalid coordinates', () => {
    const invalidWindData = {
      location: { latitude: 91, longitude: -181 }, // Invalid coordinates
      windSpeed: [5.2],
      windDirection: [180],
      measurements: [{}]
    };

    const result = RenewableValidators.windData.validate(invalidWindData);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'location.latitude')).toBe(true);
    expect(result.errors.some(e => e.field === 'location.longitude')).toBe(true);
  });

  test('should validate terrain data structure', () => {
    const terrainData = {
      features: [{ type: 'Feature', geometry: {}, properties: {} }],
      metadata: { source: 'openstreetmap', reliability: 'high' }
    };

    const result = RenewableValidators.terrainData.validate(terrainData);
    
    expect(result.isValid).toBe(true);
  });
});

describe('ValidationUtils', () => {
  test('should validate coordinates correctly', () => {
    expect(ValidationUtils.isValidCoordinate(40.7128, -74.0060)).toBe(true);
    expect(ValidationUtils.isValidCoordinate(91, -74.0060)).toBe(false);
    expect(ValidationUtils.isValidCoordinate(40.7128, -181)).toBe(false);
  });

  test('should validate wind speed and direction', () => {
    expect(ValidationUtils.isValidWindSpeed(15.5)).toBe(true);
    expect(ValidationUtils.isValidWindSpeed(-5)).toBe(false);
    expect(ValidationUtils.isValidWindSpeed(150)).toBe(false);

    expect(ValidationUtils.isValidWindDirection(180)).toBe(true);
    expect(ValidationUtils.isValidWindDirection(360)).toBe(false);
    expect(ValidationUtils.isValidWindDirection(-10)).toBe(false);
  });

  test('should validate GeoJSON features', () => {
    const validFeature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Test' }
    };

    const invalidFeature = {
      type: 'InvalidType',
      geometry: null,
      properties: null
    };

    expect(ValidationUtils.isValidGeoJSONFeature(validFeature)).toBe(true);
    expect(ValidationUtils.isValidGeoJSONFeature(invalidFeature)).toBe(false);
  });
});

describe('RenewableExportService', () => {
  let exportService: RenewableExportService;

  beforeEach(() => {
    exportService = RenewableExportService.getInstance();
  });

  test('should generate appropriate filename', () => {
    const data = { title: 'Wind Rose Analysis', data: {} };
    const options = { format: 'json' as const };

    // Mock the private method by testing the public interface
    const result = exportService.exportData(data, options);
    
    expect(result).toBeDefined();
  });

  test('should validate export options', () => {
    const validOptions = { format: 'png' as const, quality: 0.8 };
    const invalidOptions = { format: 'png' as const, quality: 1.5 };

    const validErrors = ExportUtils.validateExportOptions(validOptions);
    const invalidErrors = ExportUtils.validateExportOptions(invalidOptions);

    expect(validErrors).toHaveLength(0);
    expect(invalidErrors).toContain('Quality must be between 0 and 1');
  });

  test('should get correct MIME types', () => {
    expect(ExportUtils.getMimeType('json')).toBe('application/json');
    expect(ExportUtils.getMimeType('png')).toBe('image/png');
    expect(ExportUtils.getMimeType('csv')).toBe('text/csv');
  });
});

describe('Design Tokens', () => {
  test('should provide consistent color values', () => {
    expect(RenewableColors.success).toBe('#037f0c');
    expect(RenewableColors.warning).toBe('#ff9900');
    expect(RenewableColors.error).toBe('#d13212');
    expect(RenewableColors.info).toBe('#0073bb');
  });

  test('should calculate performance colors correctly', () => {
    expect(getPerformanceColor(0.9)).toBe(RenewableColors.performance.excellent);
    expect(getPerformanceColor(0.7)).toBe(RenewableColors.performance.good);
    expect(getPerformanceColor(0.5)).toBe(RenewableColors.performance.moderate);
    expect(getPerformanceColor(0.3)).toBe(RenewableColors.performance.poor);
  });

  test('should calculate wake impact colors correctly', () => {
    expect(getWakeImpactColor(0.03)).toBe(RenewableColors.wake.noWake);
    expect(getWakeImpactColor(0.06)).toBe(RenewableColors.wake.lowWake);
    expect(getWakeImpactColor(0.10)).toBe(RenewableColors.wake.moderateWake);
    expect(getWakeImpactColor(0.20)).toBe(RenewableColors.wake.highWake);
  });

  test('should format metric values correctly', () => {
    expect(formatMetricValue(85.5, 'percentage')).toEqual({ value: '85.5', unit: '%' });
    expect(formatMetricValue(1500, 'power')).toEqual({ value: '1.5', unit: 'MW' });
    expect(formatMetricValue(2500, 'energy')).toEqual({ value: '2.5', unit: 'GWh' });
    expect(formatMetricValue(1500000, 'currency')).toEqual({ value: '1.5', unit: 'M' });
  });
});

describe('Component Migration Utils', () => {
  test('should analyze component for migration opportunities', () => {
    const componentCode = `
      <div style={{ fontSize: '20px', color: '#037f0c' }}>
        <span className="custom-class">Test</span>
        <button onClick={handleClick}>Click me</button>
      </div>
    `;

    const issues = analyzeComponentForMigration(componentCode);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.type === 'inline-style')).toBe(true);
    expect(issues.some(i => i.type === 'custom-class')).toBe(true);
    expect(issues.some(i => i.type === 'non-cloudscape-component')).toBe(true);
  });

  test('should validate Cloudscape compliance', () => {
    const compliantCode = `
      import { Box, Container, Button } from '@cloudscape-design/components';
      import { RenewableColors } from './CloudscapeDesignTokens';
      
      const Component = () => (
        <Container>
          <Box variant="h2" color="text-status-success">
            Compliant Component
          </Box>
          <Button variant="primary" ariaLabel="Action button">
            Action
          </Button>
        </Container>
      );
    `;

    const nonCompliantCode = `
      const Component = () => (
        <div style={{ color: 'red', fontSize: '20px' }} className="custom-style">
          <button onClick={handleClick}>Click</button>
        </div>
      );
    `;

    const compliantResult = validateCloudscapeCompliance(compliantCode);
    const nonCompliantResult = validateCloudscapeCompliance(nonCompliantCode);

    expect(compliantResult.score).toBeGreaterThan(nonCompliantResult.score);
    expect(compliantResult.checks.usesCloudscapeComponents).toBe(true);
    expect(nonCompliantResult.checks.usesCloudscapeComponents).toBe(false);
  });
});

describe('Integration Tests', () => {
  test('should work together for complete error handling workflow', () => {
    // Simulate a validation error
    const invalidData = { location: { latitude: 91, longitude: -181 } };
    const validationResult = RenewableValidators.windData.validate(invalidData);
    
    expect(validationResult.isValid).toBe(false);
    
    // Handle the validation error
    const validationError = new Error('Data validation failed');
    const formattedError = handleRenewableError(validationError, 'WindDataValidator');
    
    expect(formattedError.severity).toBe('medium');
    expect(formattedError.suggestions).toContain('Check that all required fields are filled');
  });

  test('should provide consistent styling across components', () => {
    const windColor = RenewableColors.wind.primary;
    const performanceColor = getPerformanceColor(0.8);
    
    expect(typeof windColor).toBe('string');
    expect(typeof performanceColor).toBe('string');
    expect(windColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(performanceColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});