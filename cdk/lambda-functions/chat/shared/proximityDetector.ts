/**
 * ProximityDetector Module
 * 
 * Provides geospatial proximity detection for renewable energy projects.
 * Uses Haversine formula for accurate distance calculations between coordinates.
 * 
 * Requirements: 1.1, 1.2, 1.6, 4.1
 */

import { ProjectData } from './projectStore';

/**
 * Coordinates interface for latitude/longitude pairs
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Result of duplicate detection with distance information
 */
export interface DuplicateMatch {
  project: ProjectData;
  distanceKm: number;
}

/**
 * Grouped duplicates by location
 */
export interface DuplicateGroup {
  centerCoordinates: Coordinates;
  projects: ProjectData[];
  count: number;
  averageDistance: number;
}

/**
 * ProximityDetector class for geospatial operations
 */
export class ProximityDetector {
  private static readonly EARTH_RADIUS_KM = 6371;
  private static readonly DEFAULT_RADIUS_KM = 1.0;

  /**
   * Calculate distance between two coordinates using Haversine formula
   * 
   * @param coord1 First coordinate
   * @param coord2 Second coordinate
   * @returns Distance in kilometers
   */
  public calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    // Validate coordinates
    this.validateCoordinates(coord1);
    this.validateCoordinates(coord2);

    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = ProximityDetector.EARTH_RADIUS_KM * c;

    return distance;
  }

  /**
   * Find projects within specified radius of given coordinates
   * 
   * @param projects Array of projects to search
   * @param targetCoordinates Center point for search
   * @param radiusKm Search radius in kilometers (default: 1km)
   * @returns Array of projects within radius, sorted by distance
   */
  public findProjectsWithinRadius(
    projects: ProjectData[],
    targetCoordinates: Coordinates,
    radiusKm: number = ProximityDetector.DEFAULT_RADIUS_KM
  ): DuplicateMatch[] {
    // Validate inputs
    this.validateCoordinates(targetCoordinates);
    if (radiusKm <= 0) {
      throw new Error('Radius must be greater than 0');
    }

    const matches: DuplicateMatch[] = [];

    for (const project of projects) {
      // Skip projects without coordinates
      if (!project.coordinates) {
        continue;
      }

      const projectCoords: Coordinates = {
        latitude: project.coordinates.latitude,
        longitude: project.coordinates.longitude,
      };

      const distance = this.calculateDistance(targetCoordinates, projectCoords);

      // Include projects within radius
      if (distance <= radiusKm) {
        matches.push({
          project,
          distanceKm: distance,
        });
      }
    }

    // Sort by distance (closest first)
    matches.sort((a, b) => a.distanceKm - b.distanceKm);

    return matches;
  }

  /**
   * Group projects by proximity to detect duplicates
   * 
   * @param projects Array of projects to analyze
   * @param radiusKm Grouping radius in kilometers (default: 1km)
   * @returns Array of duplicate groups
   */
  public groupDuplicates(
    projects: ProjectData[],
    radiusKm: number = ProximityDetector.DEFAULT_RADIUS_KM
  ): DuplicateGroup[] {
    // Filter projects with valid coordinates
    const projectsWithCoords = projects.filter(
      (p) => p.coordinates && p.coordinates.latitude && p.coordinates.longitude
    );

    if (projectsWithCoords.length === 0) {
      return [];
    }

    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (const project of projectsWithCoords) {
      // Skip if already processed
      if (processed.has(project.project_name)) {
        continue;
      }

      const projectCoords: Coordinates = {
        latitude: project.coordinates!.latitude,
        longitude: project.coordinates!.longitude,
      };

      // Find all projects within radius
      const nearbyProjects = this.findProjectsWithinRadius(
        projectsWithCoords,
        projectCoords,
        radiusKm
      );

      // Only create group if there are multiple projects
      if (nearbyProjects.length > 1) {
        // Mark all projects in this group as processed
        nearbyProjects.forEach((match) => {
          processed.add(match.project.project_name);
        });

        // Calculate average distance
        const totalDistance = nearbyProjects.reduce(
          (sum, match) => sum + match.distanceKm,
          0
        );
        const averageDistance = totalDistance / nearbyProjects.length;

        groups.push({
          centerCoordinates: projectCoords,
          projects: nearbyProjects.map((m) => m.project),
          count: nearbyProjects.length,
          averageDistance,
        });
      } else {
        // Mark single project as processed
        processed.add(project.project_name);
      }
    }

    // Sort groups by count (largest first)
    groups.sort((a, b) => b.count - a.count);

    return groups;
  }

  /**
   * Check if coordinates are within valid range
   * 
   * @param coords Coordinates to validate
   * @throws Error if coordinates are invalid
   */
  private validateCoordinates(coords: Coordinates): void {
    if (
      coords.latitude < -90 ||
      coords.latitude > 90 ||
      coords.longitude < -180 ||
      coords.longitude > 180
    ) {
      throw new Error(
        `Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180. Got: ${coords.latitude}, ${coords.longitude}`
      );
    }
  }

  /**
   * Convert degrees to radians
   * 
   * @param degrees Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculate bounding box for optimization (future enhancement)
   * Can be used to filter projects before calculating exact distances
   * 
   * @param center Center coordinates
   * @param radiusKm Radius in kilometers
   * @returns Bounding box coordinates
   */
  public getBoundingBox(
    center: Coordinates,
    radiusKm: number
  ): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } {
    this.validateCoordinates(center);

    // Approximate degrees per kilometer
    const latDegreesPerKm = 1 / 111.32;
    const lonDegreesPerKm =
      1 / (111.32 * Math.cos(this.toRadians(center.latitude)));

    const latDelta = radiusKm * latDegreesPerKm;
    const lonDelta = radiusKm * lonDegreesPerKm;

    return {
      minLat: Math.max(-90, center.latitude - latDelta),
      maxLat: Math.min(90, center.latitude + latDelta),
      minLon: Math.max(-180, center.longitude - lonDelta),
      maxLon: Math.min(180, center.longitude + lonDelta),
    };
  }

  /**
   * Check if a project is within bounding box (optimization helper)
   * 
   * @param project Project to check
   * @param boundingBox Bounding box to check against
   * @returns True if project is within bounding box
   */
  public isWithinBoundingBox(
    project: ProjectData,
    boundingBox: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    }
  ): boolean {
    if (!project.coordinates) {
      return false;
    }

    const { latitude, longitude } = project.coordinates;

    return (
      latitude >= boundingBox.minLat &&
      latitude <= boundingBox.maxLat &&
      longitude >= boundingBox.minLon &&
      longitude <= boundingBox.maxLon
    );
  }
}
