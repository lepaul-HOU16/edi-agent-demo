/**
 * Unit tests for ProximityDetector module
 * 
 * Tests Haversine distance calculation, radius-based search,
 * duplicate grouping, and edge cases.
 */

import { ProximityDetector, Coordinates, DuplicateMatch, DuplicateGroup } from '../../amplify/functions/shared/proximityDetector';
import { ProjectData } from '../../amplify/functions/shared/projectStore';

describe('ProximityDetector', () => {
  let detector: ProximityDetector;

  beforeEach(() => {
    detector = new ProximityDetector();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates accurately', () => {
      // New York to Los Angeles (approximately 3944 km)
      const nyc: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const la: Coordinates = { latitude: 34.0522, longitude: -118.2437 };

      const distance = detector.calculateDistance(nyc, la);

      // Allow 1% margin of error
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for identical coordinates', () => {
      const coord: Coordinates = { latitude: 35.067482, longitude: -101.395466 };

      const distance = detector.calculateDistance(coord, coord);

      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Two points approximately 1km apart
      const coord1: Coordinates = { latitude: 35.067482, longitude: -101.395466 };
      const coord2: Coordinates = { latitude: 35.076482, longitude: -101.395466 };

      const distance = detector.calculateDistance(coord1, coord2);

      // Should be approximately 1km (0.009 degrees latitude ≈ 1km)
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });

    it('should handle coordinates across the equator', () => {
      const north: Coordinates = { latitude: 10, longitude: 0 };
      const south: Coordinates = { latitude: -10, longitude: 0 };

      const distance = detector.calculateDistance(north, south);

      // Should be approximately 2223 km (20 degrees latitude)
      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2250);
    });

    it('should handle coordinates across the prime meridian', () => {
      const west: Coordinates = { latitude: 0, longitude: -10 };
      const east: Coordinates = { latitude: 0, longitude: 10 };

      const distance = detector.calculateDistance(west, east);

      // Should be approximately 2226 km (20 degrees longitude at equator)
      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2250);
    });

    it('should throw error for invalid latitude', () => {
      const invalid: Coordinates = { latitude: 91, longitude: 0 };
      const valid: Coordinates = { latitude: 0, longitude: 0 };

      expect(() => detector.calculateDistance(invalid, valid)).toThrow('Invalid coordinates');
    });

    it('should throw error for invalid longitude', () => {
      const invalid: Coordinates = { latitude: 0, longitude: 181 };
      const valid: Coordinates = { latitude: 0, longitude: 0 };

      expect(() => detector.calculateDistance(valid, invalid)).toThrow('Invalid coordinates');
    });
  });

  describe('findProjectsWithinRadius', () => {
    const baseCoord: Coordinates = { latitude: 35.067482, longitude: -101.395466 };

    const createMockProject = (name: string, lat: number, lon: number): ProjectData => ({
      project_name: name,
      coordinates: { latitude: lat, longitude: lon },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ProjectData);

    it('should find projects within 1km radius', () => {
      const projects: ProjectData[] = [
        createMockProject('project-1', 35.067482, -101.395466), // 0km
        createMockProject('project-2', 35.075482, -101.395466), // ~0.89km
        createMockProject('project-3', 35.067482, -101.404466), // ~0.72km
        createMockProject('project-4', 35.100000, -101.395466), // ~3.6km
      ];

      const matches = detector.findProjectsWithinRadius(projects, baseCoord, 1.0);

      expect(matches.length).toBe(3);
      expect(matches[0].project.project_name).toBe('project-1');
      expect(matches[0].distanceKm).toBe(0);
    });

    it('should sort results by distance (closest first)', () => {
      const projects: ProjectData[] = [
        createMockProject('far', 35.100000, -101.395466),
        createMockProject('close', 35.068482, -101.395466),
        createMockProject('exact', 35.067482, -101.395466),
        createMockProject('medium', 35.080000, -101.395466),
      ];

      const matches = detector.findProjectsWithinRadius(projects, baseCoord, 5.0);

      expect(matches[0].project.project_name).toBe('exact');
      expect(matches[1].project.project_name).toBe('close');
      expect(matches[2].project.project_name).toBe('medium');
      expect(matches[3].project.project_name).toBe('far');
    });

    it('should return empty array when no projects within radius', () => {
      const projects: ProjectData[] = [
        createMockProject('far-1', 40.0, -100.0),
        createMockProject('far-2', 30.0, -110.0),
      ];

      const matches = detector.findProjectsWithinRadius(projects, baseCoord, 1.0);

      expect(matches).toEqual([]);
    });

    it('should skip projects without coordinates', () => {
      const projects: ProjectData[] = [
        createMockProject('with-coords', 35.067482, -101.395466),
        { project_name: 'no-coords', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ProjectData,
      ];

      const matches = detector.findProjectsWithinRadius(projects, baseCoord, 1.0);

      expect(matches.length).toBe(1);
      expect(matches[0].project.project_name).toBe('with-coords');
    });

    it('should use default radius of 1km when not specified', () => {
      const projects: ProjectData[] = [
        createMockProject('close', 35.067482, -101.395466),
        createMockProject('far', 35.100000, -101.395466),
      ];

      const matches = detector.findProjectsWithinRadius(projects, baseCoord);

      expect(matches.length).toBe(1);
      expect(matches[0].project.project_name).toBe('close');
    });

    it('should throw error for invalid radius', () => {
      const projects: ProjectData[] = [];

      expect(() => detector.findProjectsWithinRadius(projects, baseCoord, 0)).toThrow('Radius must be greater than 0');
      expect(() => detector.findProjectsWithinRadius(projects, baseCoord, -1)).toThrow('Radius must be greater than 0');
    });

    it('should throw error for invalid target coordinates', () => {
      const projects: ProjectData[] = [];
      const invalidCoord: Coordinates = { latitude: 100, longitude: 0 };

      expect(() => detector.findProjectsWithinRadius(projects, invalidCoord, 1.0)).toThrow('Invalid coordinates');
    });
  });

  describe('groupDuplicates', () => {
    const createMockProject = (name: string, lat: number, lon: number): ProjectData => ({
      project_name: name,
      coordinates: { latitude: lat, longitude: lon },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ProjectData);

    it('should group projects within 1km of each other', () => {
      const projects: ProjectData[] = [
        // Group 1: Texas location
        createMockProject('texas-1', 35.067482, -101.395466),
        createMockProject('texas-2', 35.068482, -101.395466),
        createMockProject('texas-3', 35.069482, -101.395466),
        // Group 2: California location
        createMockProject('california-1', 34.0522, -118.2437),
        createMockProject('california-2', 34.0532, -118.2437),
        // Isolated project
        createMockProject('isolated', 40.7128, -74.0060),
      ];

      const groups = detector.groupDuplicates(projects, 1.0);

      expect(groups.length).toBe(2);
      expect(groups[0].count).toBe(3); // Texas group (largest)
      expect(groups[1].count).toBe(2); // California group
    });

    it('should sort groups by count (largest first)', () => {
      const projects: ProjectData[] = [
        // Small group
        createMockProject('small-1', 30.0, -100.0),
        createMockProject('small-2', 30.001, -100.0),
        // Large group
        createMockProject('large-1', 35.0, -101.0),
        createMockProject('large-2', 35.001, -101.0),
        createMockProject('large-3', 35.002, -101.0),
        createMockProject('large-4', 35.003, -101.0),
      ];

      const groups = detector.groupDuplicates(projects, 1.0);

      expect(groups[0].count).toBe(4); // Large group first
      expect(groups[1].count).toBe(2); // Small group second
    });

    it('should calculate average distance for each group', () => {
      const projects: ProjectData[] = [
        createMockProject('project-1', 35.067482, -101.395466),
        createMockProject('project-2', 35.068482, -101.395466),
        createMockProject('project-3', 35.069482, -101.395466),
      ];

      const groups = detector.groupDuplicates(projects, 1.0);

      expect(groups.length).toBe(1);
      expect(groups[0].averageDistance).toBeGreaterThan(0);
      expect(groups[0].averageDistance).toBeLessThan(1.0);
    });

    it('should return empty array when no duplicates exist', () => {
      const projects: ProjectData[] = [
        createMockProject('project-1', 35.0, -101.0),
        createMockProject('project-2', 40.0, -100.0),
        createMockProject('project-3', 30.0, -110.0),
      ];

      const groups = detector.groupDuplicates(projects, 1.0);

      expect(groups).toEqual([]);
    });

    it('should handle projects without coordinates', () => {
      const projects: ProjectData[] = [
        createMockProject('with-coords-1', 35.067482, -101.395466),
        createMockProject('with-coords-2', 35.068482, -101.395466),
        { project_name: 'no-coords', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ProjectData,
      ];

      const groups = detector.groupDuplicates(projects, 1.0);

      expect(groups.length).toBe(1);
      expect(groups[0].count).toBe(2);
    });

    it('should use default radius of 1km when not specified', () => {
      const projects: ProjectData[] = [
        createMockProject('project-1', 35.067482, -101.395466),
        createMockProject('project-2', 35.068482, -101.395466),
      ];

      const groups = detector.groupDuplicates(projects);

      expect(groups.length).toBe(1);
    });

    it('should handle empty project array', () => {
      const groups = detector.groupDuplicates([]);

      expect(groups).toEqual([]);
    });

    it('should not create duplicate groups for same projects', () => {
      const projects: ProjectData[] = [
        createMockProject('project-1', 35.067482, -101.395466),
        createMockProject('project-2', 35.068482, -101.395466),
        createMockProject('project-3', 35.069482, -101.395466),
      ];

      const groups = detector.groupDuplicates(projects, 1.0);

      expect(groups.length).toBe(1);
      
      // Verify all projects are in the single group
      const allProjectNames = groups[0].projects.map(p => p.project_name);
      expect(allProjectNames).toContain('project-1');
      expect(allProjectNames).toContain('project-2');
      expect(allProjectNames).toContain('project-3');
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box for given radius', () => {
      const center: Coordinates = { latitude: 35.067482, longitude: -101.395466 };
      const radiusKm = 10;

      const bbox = detector.getBoundingBox(center, radiusKm);

      expect(bbox.minLat).toBeLessThan(center.latitude);
      expect(bbox.maxLat).toBeGreaterThan(center.latitude);
      expect(bbox.minLon).toBeLessThan(center.longitude);
      expect(bbox.maxLon).toBeGreaterThan(center.longitude);
    });

    it('should respect latitude bounds (-90 to 90)', () => {
      const northPole: Coordinates = { latitude: 89, longitude: 0 };
      const radiusKm = 200;

      const bbox = detector.getBoundingBox(northPole, radiusKm);

      expect(bbox.maxLat).toBeLessThanOrEqual(90);
      expect(bbox.minLat).toBeGreaterThanOrEqual(-90);
    });

    it('should respect longitude bounds (-180 to 180)', () => {
      const dateLine: Coordinates = { latitude: 0, longitude: 179 };
      const radiusKm = 200;

      const bbox = detector.getBoundingBox(dateLine, radiusKm);

      expect(bbox.maxLon).toBeLessThanOrEqual(180);
      expect(bbox.minLon).toBeGreaterThanOrEqual(-180);
    });

    it('should throw error for invalid coordinates', () => {
      const invalid: Coordinates = { latitude: 100, longitude: 0 };

      expect(() => detector.getBoundingBox(invalid, 10)).toThrow('Invalid coordinates');
    });
  });

  describe('isWithinBoundingBox', () => {
    const createMockProject = (name: string, lat: number, lon: number): ProjectData => ({
      project_name: name,
      coordinates: { latitude: lat, longitude: lon },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ProjectData);

    it('should return true for project within bounding box', () => {
      const project = createMockProject('test', 35.0, -101.0);
      const bbox = {
        minLat: 34.0,
        maxLat: 36.0,
        minLon: -102.0,
        maxLon: -100.0,
      };

      const result = detector.isWithinBoundingBox(project, bbox);

      expect(result).toBe(true);
    });

    it('should return false for project outside bounding box', () => {
      const project = createMockProject('test', 40.0, -100.0);
      const bbox = {
        minLat: 34.0,
        maxLat: 36.0,
        minLon: -102.0,
        maxLon: -100.0,
      };

      const result = detector.isWithinBoundingBox(project, bbox);

      expect(result).toBe(false);
    });

    it('should return false for project without coordinates', () => {
      const project = { project_name: 'no-coords', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ProjectData;
      const bbox = {
        minLat: 34.0,
        maxLat: 36.0,
        minLon: -102.0,
        maxLon: -100.0,
      };

      const result = detector.isWithinBoundingBox(project, bbox);

      expect(result).toBe(false);
    });

    it('should handle edge cases at bounding box boundaries', () => {
      const bbox = {
        minLat: 34.0,
        maxLat: 36.0,
        minLon: -102.0,
        maxLon: -100.0,
      };

      // On boundary (should be included)
      const onBoundary = createMockProject('boundary', 34.0, -102.0);
      expect(detector.isWithinBoundingBox(onBoundary, bbox)).toBe(true);

      // Just outside (should be excluded)
      const justOutside = createMockProject('outside', 33.9999, -102.0001);
      expect(detector.isWithinBoundingBox(justOutside, bbox)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle projects at the North Pole', () => {
      const northPole: Coordinates = { latitude: 90, longitude: 0 };
      const nearNorthPole: Coordinates = { latitude: 89.99, longitude: 0 };

      const distance = detector.calculateDistance(northPole, nearNorthPole);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2);
    });

    it('should handle projects at the South Pole', () => {
      const southPole: Coordinates = { latitude: -90, longitude: 0 };
      const nearSouthPole: Coordinates = { latitude: -89.99, longitude: 0 };

      const distance = detector.calculateDistance(southPole, nearSouthPole);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2);
    });

    it('should handle projects crossing the International Date Line', () => {
      const west: Coordinates = { latitude: 0, longitude: 179.99 };
      const east: Coordinates = { latitude: 0, longitude: -179.99 };

      const distance = detector.calculateDistance(west, east);

      // Should calculate the shorter distance across the date line
      expect(distance).toBeLessThan(50);
    });
  });
});
