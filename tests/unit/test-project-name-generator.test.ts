/**
 * Unit tests for ProjectNameGenerator
 * 
 * Tests:
 * - Location extraction from queries
 * - Reverse geocoding
 * - Name normalization
 * - Uniqueness checking
 */

import { ProjectNameGenerator, Coordinates } from '../../amplify/functions/shared/projectNameGenerator';
import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';
import { mockClient } from 'aws-sdk-client-mock';

// Mock Location client
const locationMock = mockClient(LocationClient);

// Mock ProjectStore
const mockProjectStore = {
  list: jest.fn(),
  save: jest.fn(),
  load: jest.fn(),
  findByPartialName: jest.fn(),
  delete: jest.fn(),
  clearCache: jest.fn(),
  getCacheStats: jest.fn()
} as unknown as ProjectStore;

describe('ProjectNameGenerator', () => {
  let generator: ProjectNameGenerator;

  beforeEach(() => {
    locationMock.reset();
    jest.clearAllMocks();
    
    generator = new ProjectNameGenerator(mockProjectStore, 'TestPlaceIndex');
    generator.clearCache();
  });

  describe('extractLocationFromQuery()', () => {
    it('should extract location from "in {location}" pattern', async () => {
      const query = 'analyze terrain in West Texas';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('west-texas');
    });

    it('should extract location from "at {location}" pattern', async () => {
      const query = 'create wind farm at Amarillo';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('amarillo');
    });

    it('should extract location from "{location} wind farm" pattern', async () => {
      const query = 'Panhandle wind farm analysis';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('panhandle');
    });

    it('should extract location from "for {location}" pattern', async () => {
      const query = 'optimize layout for North Texas';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('north-texas');
    });

    it('should extract location from "near {location}" pattern', async () => {
      const query = 'find sites near Lubbock';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('lubbock');
    });

    it('should extract location from "create project {name}" pattern', async () => {
      const query = 'create project Panhandle Wind';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('panhandle-wind');
    });

    it('should handle multi-word locations', async () => {
      const query = 'analyze terrain in West Texas Panhandle';
      const name = await generator.generateFromQuery(query);
      
      expect(name).toContain('west-texas-panhandle');
    });

    it('should return null for queries without location', async () => {
      // Mock empty project list
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);
      
      const query = 'show me some data';
      const name = await generator.generateFromQuery(query);
      
      // Should generate fallback name
      expect(name).toMatch(/wind-farm-/);
    });
  });

  describe('generateFromCoordinates()', () => {
    it('should generate name from coordinates using reverse geocoding', async () => {
      // Mock AWS Location Service response
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      // Mock empty project list for uniqueness check
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromCoordinates(35.067482, -101.395466);
      
      expect(name).toContain('amarillo');
      expect(name).toContain('tx');
    });

    it('should fallback to coordinate-based name on geocoding failure', async () => {
      // Mock AWS Location Service failure
      locationMock.on(SearchPlaceIndexForPositionCommand).rejects(new Error('Geocoding failed'));

      // Mock empty project list
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromCoordinates(35.067482, -101.395466);
      
      // Should contain coordinate-based name
      expect(name).toMatch(/site-/);
      expect(name).toMatch(/n35/);
      expect(name).toMatch(/w101/);
    });

    it('should cache geocoding results', async () => {
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      // First call
      await generator.generateFromCoordinates(35.067482, -101.395466);
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(1);

      // Second call with same coordinates (should use cache)
      await generator.generateFromCoordinates(35.067482, -101.395466);
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(1); // Still 1
    });

    it('should handle coordinates with different precision', async () => {
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      // Slightly different coordinates (should be treated as same location due to rounding)
      await generator.generateFromCoordinates(35.067482, -101.395466);
      await generator.generateFromCoordinates(35.067499, -101.395499);
      
      // Should use cache (coordinates rounded to 4 decimal places)
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(1);
    });

    it('should handle negative coordinates correctly', async () => {
      locationMock.on(SearchPlaceIndexForPositionCommand).rejects(new Error('Geocoding failed'));
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromCoordinates(-35.067482, 101.395466);
      
      expect(name).toMatch(/s35/); // South latitude
      expect(name).toMatch(/e101/); // East longitude
    });
  });

  describe('normalize()', () => {
    it('should convert to lowercase', () => {
      const normalized = generator.normalize('West Texas');
      expect(normalized).toBe('west-texas-wind-farm');
    });

    it('should replace spaces with hyphens', () => {
      const normalized = generator.normalize('West Texas Panhandle');
      expect(normalized).toBe('west-texas-panhandle-wind-farm');
    });

    it('should remove special characters', () => {
      const normalized = generator.normalize('West Texas (2025)');
      expect(normalized).toBe('west-texas-2025-wind-farm');
    });

    it('should remove multiple consecutive hyphens', () => {
      const normalized = generator.normalize('West---Texas');
      expect(normalized).toBe('west-texas-wind-farm');
    });

    it('should trim leading and trailing hyphens', () => {
      const normalized = generator.normalize('-West Texas-');
      expect(normalized).toBe('west-texas-wind-farm');
    });

    it('should append "wind-farm" if not present', () => {
      const normalized = generator.normalize('West Texas');
      expect(normalized).toContain('wind-farm');
    });

    it('should not duplicate "wind-farm" if already present', () => {
      const normalized = generator.normalize('West Texas Wind Farm');
      expect(normalized).toBe('west-texas-wind-farm');
      expect((normalized.match(/wind-farm/g) || []).length).toBe(1);
    });

    it('should handle underscores', () => {
      const normalized = generator.normalize('West_Texas');
      expect(normalized).toBe('west-texas-wind-farm');
    });

    it('should handle mixed case', () => {
      const normalized = generator.normalize('WeSt TeXaS');
      expect(normalized).toBe('west-texas-wind-farm');
    });
  });

  describe('ensureUnique()', () => {
    it('should return base name if unique', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const uniqueName = await generator.ensureUnique('west-texas-wind-farm');
      
      expect(uniqueName).toBe('west-texas-wind-farm');
    });

    it('should append number if name exists', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'west-texas-wind-farm' }
      ]);

      const uniqueName = await generator.ensureUnique('west-texas-wind-farm');
      
      expect(uniqueName).toBe('west-texas-wind-farm-2');
    });

    it('should increment number until unique', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'west-texas-wind-farm' },
        { project_name: 'west-texas-wind-farm-2' },
        { project_name: 'west-texas-wind-farm-3' }
      ]);

      const uniqueName = await generator.ensureUnique('west-texas-wind-farm');
      
      expect(uniqueName).toBe('west-texas-wind-farm-4');
    });

    it('should handle errors gracefully', async () => {
      (mockProjectStore.list as jest.Mock).mockRejectedValue(new Error('S3 Error'));

      const uniqueName = await generator.ensureUnique('west-texas-wind-farm');
      
      // Should append timestamp as fallback
      expect(uniqueName).toMatch(/west-texas-wind-farm-/);
      expect(uniqueName.length).toBeGreaterThan('west-texas-wind-farm-'.length);
    });

    it('should prevent infinite loop with safety check', async () => {
      // Mock 1000+ existing projects
      const existingProjects = Array.from({ length: 1001 }, (_, i) => ({
        project_name: i === 0 ? 'test-project' : `test-project-${i + 1}`
      }));
      (mockProjectStore.list as jest.Mock).mockResolvedValue(existingProjects);

      const uniqueName = await generator.ensureUnique('test-project');
      
      // Should append timestamp instead of continuing to increment
      expect(uniqueName).toMatch(/test-project-/);
      expect(uniqueName).not.toBe('test-project-1002');
    });
  });

  describe('generateFromQuery() integration', () => {
    it('should generate name from query with location', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromQuery('analyze terrain in West Texas');
      
      expect(name).toBe('west-texas-wind-farm');
    });

    it('should use coordinates if no location in query', async () => {
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const coordinates: Coordinates = { lat: 35.067482, lon: -101.395466 };
      const name = await generator.generateFromQuery('analyze terrain', coordinates);
      
      expect(name).toContain('amarillo');
    });

    it('should generate fallback name if no location or coordinates', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromQuery('analyze terrain');
      
      expect(name).toMatch(/wind-farm-/);
    });

    it('should ensure uniqueness', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([
        { project_name: 'west-texas-wind-farm' }
      ]);

      const name = await generator.generateFromQuery('analyze terrain in West Texas');
      
      expect(name).toBe('west-texas-wind-farm-2');
    });
  });

  describe('cache management', () => {
    it('should clear geocoding cache', async () => {
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      // First call
      await generator.generateFromCoordinates(35.067482, -101.395466);
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(1);

      // Clear cache
      generator.clearCache();

      // Second call (should call Location Service again)
      await generator.generateFromCoordinates(35.067482, -101.395466);
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromQuery('');
      
      expect(name).toMatch(/wind-farm-/);
    });

    it('should handle query with only special characters', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromQuery('!@#$%^&*()');
      
      expect(name).toMatch(/wind-farm-/);
    });

    it('should handle very long location names', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const longLocation = 'Very Long Location Name With Many Words That Should Be Normalized';
      const name = await generator.generateFromQuery(`analyze terrain in ${longLocation}`);
      
      expect(name).toContain('very-long-location-name');
      expect(name).toContain('wind-farm');
    });

    it('should handle location names with numbers', async () => {
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      const name = await generator.generateFromQuery('analyze terrain in Highway 287 Area');
      
      expect(name).toContain('highway-287-area');
    });

    it('should handle coordinates at boundaries', async () => {
      locationMock.on(SearchPlaceIndexForPositionCommand).rejects(new Error('Geocoding failed'));
      (mockProjectStore.list as jest.Mock).mockResolvedValue([]);

      // North Pole
      const northName = await generator.generateFromCoordinates(90, 0);
      expect(northName).toMatch(/site-n90/);

      // South Pole
      const southName = await generator.generateFromCoordinates(-90, 0);
      expect(southName).toMatch(/site-s90/);

      // International Date Line
      const eastName = await generator.generateFromCoordinates(0, 180);
      expect(eastName).toMatch(/e180/);

      const westName = await generator.generateFromCoordinates(0, -180);
      expect(westName).toMatch(/w180/);
    });
  });
});
