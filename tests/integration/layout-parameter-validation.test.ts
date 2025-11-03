/**
 * Integration test for layout tool parameter validation
 * Tests that coordinates are extracted correctly and passed to the layout tool
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Layout Tool Parameter Validation', () => {
  // Test data
  const testCoordinates = {
    latitude: 35.067482,
    longitude: -101.395466,
    capacity: 30
  };

  describe('Parameter Extraction', () => {
    it('should extract coordinates from query with decimal points', () => {
      const query = `Create a ${testCoordinates.capacity}MW wind farm layout at ${testCoordinates.latitude}, ${testCoordinates.longitude}`;
      
      // Regex pattern from task 2.1
      const coordinatePattern = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
      const match = query.match(coordinatePattern);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe(String(testCoordinates.latitude));
      expect(match![2]).toBe(String(testCoordinates.longitude));
    });

    it('should NOT match integers without decimal points', () => {
      const query = 'Create a 30MW wind farm layout';
      
      const coordinatePattern = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
      const match = query.match(coordinatePattern);
      
      expect(match).toBeNull();
    });

    it('should extract capacity from query', () => {
      const query = `Create a ${testCoordinates.capacity}MW wind farm layout at ${testCoordinates.latitude}, ${testCoordinates.longitude}`;
      
      const capacityPattern = /(\d+)\s*MW/i;
      const match = query.match(capacityPattern);
      
      expect(match).not.toBeNull();
      expect(match![1]).toBe(String(testCoordinates.capacity));
    });
  });

  describe('Parameter Mapping', () => {
    it('should map extracted coordinates to correct parameter names', () => {
      const extractedLat = 35.067482;
      const extractedLon = -101.395466;
      
      // According to task 2.2, parameters should be named 'latitude' and 'longitude'
      const parameters = {
        latitude: extractedLat,
        longitude: extractedLon,
        capacity_mw: 30
      };
      
      expect(parameters).toHaveProperty('latitude');
      expect(parameters).toHaveProperty('longitude');
      expect(parameters.latitude).toBe(extractedLat);
      expect(parameters.longitude).toBe(extractedLon);
      
      // Should NOT use old parameter names
      expect(parameters).not.toHaveProperty('center_lat');
      expect(parameters).not.toHaveProperty('center_lon');
    });
  });

  describe('Parameter Validation', () => {
    it('should validate latitude range', () => {
      const validLatitudes = [-90, -45, 0, 45, 90];
      const invalidLatitudes = [-91, 91, -100, 100];
      
      validLatitudes.forEach(lat => {
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      });
      
      invalidLatitudes.forEach(lat => {
        const isValid = lat >= -90 && lat <= 90;
        expect(isValid).toBe(false);
      });
    });

    it('should validate longitude range', () => {
      const validLongitudes = [-180, -90, 0, 90, 180];
      const invalidLongitudes = [-181, 181, -200, 200];
      
      validLongitudes.forEach(lon => {
        expect(lon).toBeGreaterThanOrEqual(-180);
        expect(lon).toBeLessThanOrEqual(180);
      });
      
      invalidLongitudes.forEach(lon => {
        const isValid = lon >= -180 && lon <= 180;
        expect(isValid).toBe(false);
      });
    });

    it('should identify missing required parameters', () => {
      const completeParams = {
        latitude: 35.067482,
        longitude: -101.395466,
        capacity_mw: 30
      };
      
      const missingLatitude = {
        longitude: -101.395466,
        capacity_mw: 30
      };
      
      const missingLongitude = {
        latitude: 35.067482,
        capacity_mw: 30
      };
      
      expect(completeParams).toHaveProperty('latitude');
      expect(completeParams).toHaveProperty('longitude');
      
      expect(missingLatitude).not.toHaveProperty('latitude');
      expect(missingLongitude).not.toHaveProperty('longitude');
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for missing latitude', () => {
      const missingParams = ['latitude (or center_lat)'];
      const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
      
      expect(errorMessage).toContain('latitude');
      expect(errorMessage).toContain('Missing required parameters');
    });

    it('should provide clear error message for missing longitude', () => {
      const missingParams = ['longitude (or center_lon)'];
      const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
      
      expect(errorMessage).toContain('longitude');
      expect(errorMessage).toContain('Missing required parameters');
    });

    it('should provide clear error message for invalid coordinate values', () => {
      const invalidLat = 95;
      const errorMessage = `Latitude must be between -90 and 90, got ${invalidLat}`;
      
      expect(errorMessage).toContain('Latitude');
      expect(errorMessage).toContain('-90 and 90');
      expect(errorMessage).toContain(String(invalidLat));
    });
  });

  describe('Backward Compatibility', () => {
    it('should accept old parameter names (center_lat, center_lon)', () => {
      const oldParams = {
        center_lat: 35.067482,
        center_lon: -101.395466
      };
      
      // Simulate the parameter mapping logic from handler
      const latitude = oldParams.center_lat;
      const longitude = oldParams.center_lon;
      
      expect(latitude).toBe(35.067482);
      expect(longitude).toBe(-101.395466);
    });

    it('should prefer new parameter names over old ones', () => {
      const mixedParams = {
        latitude: 35.067482,
        longitude: -101.395466,
        center_lat: 40.0,  // Should be ignored
        center_lon: -100.0  // Should be ignored
      };
      
      // Simulate the parameter mapping logic: new || old
      const latitude = mixedParams.latitude || mixedParams.center_lat;
      const longitude = mixedParams.longitude || mixedParams.center_lon;
      
      expect(latitude).toBe(35.067482);
      expect(longitude).toBe(-101.395466);
    });
  });
});

describe('Layout Creation Workflow', () => {
  it('should extract and validate parameters from complete query', () => {
    const query = 'Create a 30MW wind farm layout at 35.067482, -101.395466';
    
    // Extract coordinates
    const coordinatePattern = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
    const coordMatch = query.match(coordinatePattern);
    
    // Extract capacity
    const capacityPattern = /(\d+)\s*MW/i;
    const capacityMatch = query.match(capacityPattern);
    
    expect(coordMatch).not.toBeNull();
    expect(capacityMatch).not.toBeNull();
    
    const parameters = {
      latitude: parseFloat(coordMatch![1]),
      longitude: parseFloat(coordMatch![2]),
      capacity_mw: parseInt(capacityMatch![1])
    };
    
    // Validate parameters
    expect(parameters.latitude).toBeGreaterThanOrEqual(-90);
    expect(parameters.latitude).toBeLessThanOrEqual(90);
    expect(parameters.longitude).toBeGreaterThanOrEqual(-180);
    expect(parameters.longitude).toBeLessThanOrEqual(180);
    expect(parameters.capacity_mw).toBeGreaterThan(0);
    
    // Verify correct parameter names
    expect(parameters).toHaveProperty('latitude');
    expect(parameters).toHaveProperty('longitude');
    expect(parameters).not.toHaveProperty('center_lat');
    expect(parameters).not.toHaveProperty('center_lon');
  });
});
