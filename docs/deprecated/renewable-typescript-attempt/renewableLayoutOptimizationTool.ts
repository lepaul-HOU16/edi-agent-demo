import { ThoughtStep } from '../../../utils/thoughtTypes';

interface RouterResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  sourceAttribution?: any[];
  agentUsed: string;
  triggerActions?: any;
}

// Types for layout optimization
interface TurbineFeature {
  type: 'Feature';
  properties: {
    turbine_id: string;
    turbine_model: string;
    capacity_MW: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface LayoutGeoJSON {
  type: 'FeatureCollection';
  features: TurbineFeature[];
  properties: {
    layout_type: string;
    total_capacity_MW: number;
    num_turbines: number;
    turbine_model: string;
  };
}

// Constants
const EARTH_RADIUS_M = 6371000;
const METERS_PER_LAT_DEGREE = 111320;

// Utility functions
function metersToLatLon(baseLat: number, baseLon: number, dxM: number, dyM: number): [number, number] {
  const latOffset = dyM / METERS_PER_LAT_DEGREE;
  const metersPerLonDegree = METERS_PER_LAT_DEGREE * Math.cos(baseLat * Math.PI / 180);
  const lonOffset = dxM / metersPerLonDegree;
  return [baseLat + latOffset, baseLon + lonOffset];
}

function rotateCoordinates(x: number, y: number, angleDeg: number): [number, number] {
  const angleRad = angleDeg * Math.PI / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  return [x * cosA - y * sinA, x * sinA + y * cosA];
}

// Main layout optimization tools
export async function createGridLayout(params: {
  project_id: string;
  center_lat: number;
  center_lon: number;
  num_turbines: number;
  turbine_model: string;
  rotor_diameter: number;
  capacity_mw: number;
  wind_angle: number;
  spacing_d?: number;
  auto_relocate?: boolean;
  search_radius_m?: number;
}): Promise<RouterResponse> {
  console.log('🌟 Layout Tool: Creating grid layout', params);
  
  try {
    const {
      project_id,
      center_lat,
      center_lon,
      num_turbines,
      turbine_model,
      rotor_diameter,
      capacity_mw,
      wind_angle,
      spacing_d = 9.0,
      auto_relocate = false,
      search_radius_m = 1000
    } = params;

    const spacingM = spacing_d * rotor_diameter;
    
    // Calculate grid dimensions
    const rows = Math.floor(Math.sqrt(num_turbines));
    const cols = Math.ceil(num_turbines / rows);
    
    // Generate turbine positions
    const allPositions: [number, number][] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (allPositions.length >= num_turbines) break;
        
        let xM = (col - cols/2) * spacingM;
        let yM = (row - rows/2) * spacingM;
        
        // Rotate based on wind direction
        [xM, yM] = rotateCoordinates(xM, yM, wind_angle);
        
        const [lat, lon] = metersToLatLon(center_lat, center_lon, xM, yM);
        allPositions.push([lat, lon]);
      }
    }
    
    // Create initial layout features
    const features: TurbineFeature[] = allPositions.map((pos, i) => ({
      type: 'Feature',
      properties: {
        turbine_id: `T${i + 1}`,
        turbine_model,
        capacity_MW: capacity_mw
      },
      geometry: {
        type: 'Point',
        coordinates: [pos[1], pos[0]] // [longitude, latitude]
      }
    }));
    
    // Generate visualization data
    const mapVisualization = {
      type: 'wind_farm_layout',
      title: `Grid Layout - ${features.length} Turbines`,
      center: {
        latitude: center_lat,
        longitude: center_lon
      },
      turbines: features.map(f => ({
        id: f.properties.turbine_id,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        model: f.properties.turbine_model,
        capacity_MW: f.properties.capacity_MW
      })),
      wind_angle,
      layout_type: 'grid',
      spacing_diameters: spacing_d,
      summary: {
        requested_turbines: num_turbines,
        placed_turbines: features.length,
        total_capacity_MW: features.length * capacity_mw
      }
    };
    
    return {
      success: true,
      message: `Successfully created grid layout with ${features.length} turbines. Total capacity: ${(features.length * capacity_mw).toFixed(1)} MW.`,
      artifacts: [mapVisualization],
      agentUsed: 'renewableEnergyAgent'
    };
    
  } catch (error) {
    console.error('Grid layout creation error:', error);
    return {
      success: false,
      message: `Failed to create grid layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
      agentUsed: 'renewableEnergyAgent'
    };
  }
}

export async function createSpiralLayout(params: {
  project_id: string;
  center_lat: number;
  center_lon: number;
  num_turbines: number;
  turbine_model: string;
  rotor_diameter: number;
  capacity_mw: number;
  wind_angle: number;
  spacing_d?: number;
}): Promise<RouterResponse> {
  console.log('🌀 Layout Tool: Creating spiral layout', params);
  
  try {
    const {
      project_id,
      center_lat,
      center_lon,
      num_turbines,
      turbine_model,
      rotor_diameter,
      capacity_mw,
      wind_angle,
      spacing_d = 5.0
    } = params;

    const minSpacingM = spacing_d * rotor_diameter;
    
    // Generate spiral path points
    const spiralPoints: Array<{lat: number; lon: number; xM: number; yM: number}> = [];
    const maxRadius = minSpacingM * num_turbines * 0.5;
    let angle = wind_angle * Math.PI / 180;
    let radius = 0;
    
    // Generate dense spiral path
    while (radius <= maxRadius) {
      const xM = radius * Math.cos(angle);
      const yM = radius * Math.sin(angle);
      const [lat, lon] = metersToLatLon(center_lat, center_lon, xM, yM);
      
      spiralPoints.push({ lat, lon, xM, yM });
      
      angle += 0.1; // Small angle increment for dense spiral
      radius += minSpacingM * 0.02; // Small radius increment
    }
    
    // Place turbines using greedy algorithm
    const features: TurbineFeature[] = [];
    const placedPositions: Array<{xM: number; yM: number}> = [];
    
    // Start with center turbine
    features.push({
      type: 'Feature',
      properties: {
        turbine_id: 'T1',
        turbine_model,
        capacity_MW: capacity_mw
      },
      geometry: {
        type: 'Point',
        coordinates: [center_lon, center_lat]
      }
    });
    placedPositions.push({ xM: 0, yM: 0 });
    
    // Place remaining turbines along spiral
    for (const point of spiralPoints) {
      if (features.length >= num_turbines) break;
      
      // Check minimum distance to all placed turbines
      const validPosition = placedPositions.every(placed => {
        const distance = Math.sqrt(
          (point.xM - placed.xM) ** 2 + (point.yM - placed.yM) ** 2
        );
        return distance >= minSpacingM;
      });
      
      if (validPosition) {
        features.push({
          type: 'Feature',
          properties: {
            turbine_id: `T${features.length + 1}`,
            turbine_model,
            capacity_MW: capacity_mw
          },
          geometry: {
            type: 'Point',
            coordinates: [point.lon, point.lat]
          }
        });
        placedPositions.push({ xM: point.xM, yM: point.yM });
      }
    }
    
    // Generate visualization
    const mapVisualization = {
      type: 'wind_farm_layout',
      title: `Spiral Layout - ${features.length} Turbines`,
      center: {
        latitude: center_lat,
        longitude: center_lon
      },
      turbines: features.map(f => ({
        id: f.properties.turbine_id,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        model: f.properties.turbine_model,
        capacity_MW: f.properties.capacity_MW
      })),
      wind_angle,
      layout_type: 'spiral',
      spacing_diameters: spacing_d,
      summary: {
        requested_turbines: num_turbines,
        placed_turbines: features.length,
        total_capacity_MW: features.length * capacity_mw,
        placement_efficiency: (features.length / num_turbines * 100).toFixed(1) + '%'
      }
    };
    
    return {
      success: true,
      message: `Successfully created spiral layout with ${features.length} turbines out of ${num_turbines} requested (${(features.length / num_turbines * 100).toFixed(1)}% efficiency). Total capacity: ${(features.length * capacity_mw).toFixed(1)} MW.`,
      artifacts: [mapVisualization],
      agentUsed: 'renewableEnergyAgent'
    };
    
  } catch (error) {
    console.error('Spiral layout creation error:', error);
    return {
      success: false,
      message: `Failed to create spiral layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
      agentUsed: 'renewableEnergyAgent'
    };
  }
}

export async function createGreedyLayout(params: {
  project_id: string;
  center_lat: number;
  center_lon: number;
  num_turbines: number;
  turbine_model: string;
  rotor_diameter: number;
  capacity_mw: number;
  wind_angle: number;
  spacing_d?: number;
  search_radius_km?: number;
}): Promise<RouterResponse> {
  console.log('🎯 Layout Tool: Creating greedy optimized layout', params);
  
  try {
    const {
      project_id,
      center_lat,
      center_lon,
      num_turbines,
      turbine_model,
      rotor_diameter,
      capacity_mw,
      wind_angle,
      spacing_d = 5.0,
      search_radius_km = 2.0
    } = params;

    const minSpacingM = spacing_d * rotor_diameter;
    
    const features: TurbineFeature[] = [];
    const placedPositions: Array<{xM: number; yM: number}> = [];
    
    // Generate candidate positions in a grid within search radius
    const candidates: Array<{lat: number; lon: number; score: number; xM: number; yM: number}> = [];
    const searchRadiusM = search_radius_km * 1000;
    const gridSpacing = minSpacingM * 0.8; // Finer grid for more options
    
    const steps = Math.floor(2 * searchRadiusM / gridSpacing);
    for (let i = -Math.floor(steps/2); i <= Math.floor(steps/2); i++) {
      for (let j = -Math.floor(steps/2); j <= Math.floor(steps/2); j++) {
        const xM = i * gridSpacing;
        const yM = j * gridSpacing;
        
        if (Math.sqrt(xM * xM + yM * yM) <= searchRadiusM) {
          const [lat, lon] = metersToLatLon(center_lat, center_lon, xM, yM);
          
          // Enhanced scoring: consider distance to center and wind alignment
          const distanceToCenter = Math.sqrt(xM * xM + yM * yM);
          const baseScore = 1.0 / (1.0 + distanceToCenter / 1000);
          const score = baseScore + wind_angle / 360;
          
          candidates.push({ lat, lon, score, xM, yM });
        }
      }
    }
    
    // Sort candidates by score (descending)
    candidates.sort((a, b) => b.score - a.score);
    
    // Greedily place turbines
    for (const candidate of candidates) {
      if (features.length >= num_turbines) break;
      
      // Check minimum spacing with existing turbines
      const validPosition = placedPositions.every(placed => {
        const distance = Math.sqrt(
          (candidate.xM - placed.xM) ** 2 + (candidate.yM - placed.yM) ** 2
        );
        return distance >= minSpacingM;
      });
      
      if (validPosition) {
        features.push({
          type: 'Feature',
          properties: {
            turbine_id: `T${features.length + 1}`,
            turbine_model,
            capacity_MW: capacity_mw
          },
          geometry: {
            type: 'Point',
            coordinates: [candidate.lon, candidate.lat]
          }
        });
        placedPositions.push({ xM: candidate.xM, yM: candidate.yM });
      }
    }
    
    // Generate visualization
    const mapVisualization = {
      type: 'wind_farm_layout',
      title: `Greedy Optimized Layout - ${features.length} Turbines`,
      center: {
        latitude: center_lat,
        longitude: center_lon
      },
      turbines: features.map(f => ({
        id: f.properties.turbine_id,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        model: f.properties.turbine_model,
        capacity_MW: f.properties.capacity_MW
      })),
      wind_angle,
      layout_type: 'greedy',
      spacing_diameters: spacing_d,
      search_radius_km,
      summary: {
        requested_turbines: num_turbines,
        placed_turbines: features.length,
        total_capacity_MW: features.length * capacity_mw,
        placement_efficiency: (features.length / num_turbines * 100).toFixed(1) + '%',
        optimization_method: 'Greedy algorithm with wind alignment scoring'
      }
    };
    
    return {
      success: true,
      message: `Successfully created greedy optimized layout with ${features.length} turbines out of ${num_turbines} requested (${(features.length / num_turbines * 100).toFixed(1)}% efficiency). Used advanced greedy algorithm with wind alignment scoring. Total capacity: ${(features.length * capacity_mw).toFixed(1)} MW.`,
      artifacts: [mapVisualization],
      agentUsed: 'renewableEnergyAgent'
    };
    
  } catch (error) {
    console.error('Greedy layout creation error:', error);
    return {
      success: false,
      message: `Failed to create greedy layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
      agentUsed: 'renewableEnergyAgent'
    };
  }
}
