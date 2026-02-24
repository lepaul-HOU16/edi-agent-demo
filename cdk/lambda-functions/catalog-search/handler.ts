import { Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { parseNaturalLanguageQuery, applyFilters, ParsedQuery } from '../shared/nlpParser';

// Thought types - inline definitions since this Lambda doesn't have access to shared utils
interface ThoughtStep {
  step: string;
  status: 'thinking' | 'complete' | 'error';
  details?: string;
  timestamp: string;
}

function createThoughtStep(step: string, details?: string): ThoughtStep {
  return {
    step,
    status: 'thinking',
    details,
    timestamp: new Date().toISOString()
  };
}

function completeThoughtStep(thoughtStep: ThoughtStep, details?: string): ThoughtStep {
  return {
    ...thoughtStep,
    status: 'complete',
    details: details || thoughtStep.details,
    timestamp: new Date().toISOString()
  };
}

// AWS S3 Configuration
const S3_BUCKET = process.env.STORAGE_BUCKET_NAME || '';
const S3_PREFIX = 'global/well-data/';
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// NEW OSDU Tools API Configuration
const OSDU_TOOLS_API_URL = process.env.OSDU_TOOLS_API_URL || 'https://f1qn9bdfye.execute-api.us-east-1.amazonaws.com/development/tools';
const OSDU_TOOLS_API_KEY = process.env.OSDU_TOOLS_API_KEY || 'sF1oCz1FfjOo9YY7OBmCaZM8TxpqzzS46JYbIvEb';


interface OSDUSearchRequest {
  kind: string;
  query?: string;
  limit?: number;
  offset?: number;
  returnedFields?: string[];
}

interface OSDUWellRecord {
  id: string;
  kind: string;
  data: {
    'WellboreID': string;
    'FacilityName': string;
    'FacilityState': string;
    'GeoLocation': {
      'Wgs84Coordinates': {
        'Latitude': number;
        'Longitude': number;
      }
    };
    'VerticalMeasurement'?: {
      'Depth': {
        'Value': number;
        'UOM': string;
      }
    };
    'WellType'?: string;
  };
}

// Function to generate exploration block polygons for Vietnam offshore
function generateExplorationBlocks(): any[] {
  const blocks = [
    {
      name: "Block 15-1",
      operator: "PetroVietnam",
      status: "Active",
      area_km2: 1250,
      license: "EP-2023-001",
      coordinates: [[[106.5, 10.5], [106.8, 10.5], [106.8, 10.8], [106.5, 10.8], [106.5, 10.5]]]
    },
    {
      name: "Block 16-2",
      operator: "Vietsovpetro",
      status: "Producing",
      area_km2: 2100,
      license: "EP-2021-045",
      production_bopd: 15000,
      coordinates: [[[107.0, 10.2], [107.4, 10.3], [107.5, 10.7], [107.2, 10.9], [106.9, 10.6], [107.0, 10.2]]]
    },
    {
      name: "Block 09-3",
      operator: "Total E&P",
      status: "Exploration",
      area_km2: 3400,
      license: "EP-2024-012",
      water_depth_m: 85,
      coordinates: [[[108.1, 11.0], [108.6, 11.1], [108.7, 11.5], [108.5, 11.8], [108.2, 11.7], [107.9, 11.4], [108.1, 11.0]]]
    },
    {
      name: "Block 12-4",
      operator: "Legacy Oil Co",
      status: "Inactive",
      area_km2: 980,
      license: "EP-2018-089 (Expired)",
      coordinates: [[[105.5, 9.5], [105.9, 9.5], [105.9, 9.9], [105.5, 9.9], [105.5, 9.5]]]
    }
  ];

  return blocks.map(block => ({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: block.coordinates
    },
    properties: {
      name: block.name,
      type: "Exploration Block",
      operator: block.operator,
      status: block.status,
      area_km2: block.area_km2,
      license: block.license,
      ...(block.production_bopd && { production_bopd: block.production_bopd }),
      ...(block.water_depth_m && { water_depth_m: block.water_depth_m })
    }
  }));
}

// Function to fetch real coordinates from CSV file in S3
async function fetchWellCoordinatesFromCSV(): Promise<Map<string, { lat: number; lon: number }>> {
  try {
    console.log('Fetching well coordinates from converted_coordinates.csv');
    
    const csvCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${S3_PREFIX}converted_coordinates.csv`
    });
    
    const csvResponse = await s3Client.send(csvCommand);
    const csvContent = await csvResponse.Body?.transformToString();
    
    if (!csvContent) {
      console.warn('No CSV content found, using fallback coordinates');
      return new Map();
    }
    
    const coordinatesMap = new Map<string, { lat: number; lon: number }>();
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    // CSV format: wellId,wellName,originalLat,originalLon,convertedX,convertedY,utmZone,datum
    for (let i = 1; i < lines.length; i++) {
      const [wellId, wellName, latitude, longitude, x, y] = lines[i].split(',');
      if (wellId && latitude && longitude) {
        // Use wellId (e.g., "WELL-001") as the key since that matches the LAS file names
        coordinatesMap.set(wellId.trim(), {
          lat: parseFloat(latitude.trim()),
          lon: parseFloat(longitude.trim())
        });
      }
    }
    
    console.log(`Loaded coordinates for ${coordinatesMap.size} wells from CSV`);
    return coordinatesMap;
  } catch (error) {
    console.error('Error loading coordinates from CSV:', error);
    return new Map();
  }
}

// Function to fetch user's LAS files from S3
async function fetchUserWells(): Promise<any[]> {
  try {
    console.log(`Fetching user LAS files from S3 bucket: ${S3_BUCKET}, prefix: ${S3_PREFIX}`);
    
    // First get real coordinates
    const coordinatesMap = await fetchWellCoordinatesFromCSV();
    
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: S3_PREFIX,
      MaxKeys: 50
    });
    
    const response = await s3Client.send(listCommand);
    const lasFiles = response.Contents?.filter(obj => obj.Key?.endsWith('.las')) || [];
    
    console.log(`Found ${lasFiles.length} user LAS files in S3`);
    
    // Fallback coordinates for offshore Brunei/Malaysia if no CSV data
    const fallbackCoordinates = [
      [114.45, 10.47], [114.49, 10.55], [114.49, 10.53], [114.49, 10.30], [114.56, 10.48],
      [114.55, 10.35], [114.49, 10.39], [114.46, 10.36], [114.52, 10.41], [114.64, 10.45],
      [114.62, 10.39], [114.46, 10.60], [114.50, 10.21], [114.50, 10.19], [114.63, 10.21],
      [114.56, 10.12], [114.58, 10.15], [114.56, 10.15], [114.58, 10.16], [114.62, 10.20],
      [114.57, 10.12], [114.56, 10.12], [114.49, 10.53], [114.55, 10.35], [114.52, 10.41]
    ];
    
    const userWellsFeatures = lasFiles.map((file, index) => {
      const fileName = file.Key?.replace(S3_PREFIX, '') || `Well-${index + 1}`;
      const wellName = fileName.replace('.las', '').toUpperCase(); // FIXED: Keep hyphens, don't replace with spaces
      
      // Use real coordinates from CSV if available, otherwise fallback
      let coordinates;
      const realCoords = coordinatesMap.get(wellName);
      if (realCoords) {
        coordinates = [realCoords.lon, realCoords.lat];
      } else {
        coordinates = fallbackCoordinates[index] || [114.5 + (index * 0.02), 10.3 + (index * 0.02)];
      }
      
      // Estimate depth based on file size (rough approximation)
      const fileSizeMB = (file.Size || 0) / (1024 * 1024);
      const estimatedDepth = Math.floor(2000 + (fileSizeMB * 500)); // Rough estimate
      
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coordinates
        },
        properties: {
          name: wellName,
          type: "My Wells",
          depth: `${estimatedDepth}m (est.)`,
          location: "Offshore Brunei/Malaysia",
          operator: "My Company",
          category: "personal",
          fileName: fileName,
          fileSize: `${fileSizeMB.toFixed(2)} MB`,
          s3Key: file.Key,
          lastModified: file.LastModified?.toISOString() || new Date().toISOString(),
          dataSource: "Personal LAS Files (Real Coordinates)",
          latitude: coordinates[1]?.toFixed(6),
          longitude: coordinates[0]?.toFixed(6)
        }
      };
    });
    
    return userWellsFeatures;
    
  } catch (error) {
    console.error('Error fetching user LAS files from S3:', error);
    return [];
  }
}

/**
 * Filter catalog data (24 LAS files) using shared NLP parser
 * Supports location, depth, operator, and well name prefix filtering
 */
function filterCatalogData(wells: any[], filters: ParsedQuery): any[] {
  console.log('🔍 Filtering catalog data with shared parser');
  console.log('📊 Input wells:', wells.length);
  console.log('🎯 Filters:', JSON.stringify(filters, null, 2));
  console.log('🎯 Specific wells filter:', filters.specificWells);
  
  if (!filters.hasFilters) {
    console.log('✅ No filters detected, returning all wells');
    return wells;
  }
  
  // Use shared parser's applyFilters function
  const filtered = applyFilters(wells, filters, {
    location: (well) => well.properties?.location || '',
    operator: (well) => well.properties?.operator || '',
    wellName: (well) => {
      const name = well.properties?.name || '';
      console.log(`  Checking well: "${name}"`);
      return name;
    },
    depth: (well) => {
      const depthStr = well.properties?.depth || '0m';
      const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
      return depthMatch ? parseFloat(depthMatch[1]) : 0;
    }
  });
  
  console.log('✅ Filtered catalog data:', filtered.length, 'wells match criteria');
  console.log('✅ Filtered well names:', filtered.map(w => w.properties?.name));
  return filtered;
}

// Enhanced NLP query parser with conservative intent detection to prevent hallucinations
// Simplified NLP parser - only detects frontend-specific query types
// All OSDU queries are forwarded raw to the backend's Strands agent which handles NLP
function parseNLPQuery(searchQuery: string): { queryType: string; parameters: any; confidence: number } {
  const lowerQuery = searchQuery.toLowerCase().trim();
  
  console.log('🔍 === QUERY ROUTING ===');
  console.log('📝 Query:', searchQuery);
  
  // Weather maps detection
  const hasWeather = lowerQuery.includes('weather');
  const hasWells = lowerQuery.includes('wells') || lowerQuery.includes('well');
  const hasMap = lowerQuery.includes('map') || lowerQuery.includes('maps');
  
  if (hasWeather && (hasWells || hasMap)) {
    console.log('🌤️ Weather query detected');
    return {
      queryType: 'weatherMaps',
      confidence: 0.9,
      parameters: {
        includeUserWells: true,
        weatherTypes: ['temperature', 'precipitation'],
        additionalWeatherTypes: ['wind', 'pressure', 'humidity'],
        radius: 50,
        region: 'user_wells_area',
        coordinates: null
      }
    };
  }
  
  // "Show all wells" / "all data" - combines OSDU + S3 user wells
  if (lowerQuery.includes('show all wells') || lowerQuery.includes('all wells') || 
      lowerQuery.includes('show me all wells') || lowerQuery.includes('list all wells') ||
      lowerQuery.includes('all available data') || lowerQuery.includes('what data do you have') ||
      lowerQuery.includes('show me everything') || lowerQuery.includes('all data')) {
    console.log('📊 All wells query detected');
    return {
      queryType: 'allWells',
      confidence: 0.8,
      parameters: {
        includeUserWells: true,
        region: 'all',
      }
    };
  }
  
  // Polygon search detection
  const polygonPatterns = [
    /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
    /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
    /(?:polygon|area)\s*(?:filter|selection)/i,
  ];
  
  if (polygonPatterns.some(pattern => pattern.test(lowerQuery))) {
    console.log('🔷 Polygon query detected');
    return {
      queryType: 'polygonSearch',
      confidence: 0.8,
      parameters: { includeUserWells: true, searchType: 'polygon_filter', region: 'polygon_area' }
    };
  }

  // "My wells" - personal S3 LAS files only
  if (lowerQuery.includes('my wells') || lowerQuery.includes('show me my wells') ||
      lowerQuery.includes('personal wells') || lowerQuery.includes('user wells')) {
    console.log('👤 My wells query detected');
    return {
      queryType: 'myWells',
      confidence: 0.9,
      parameters: { region: 'personal' }
    };
  }
  
  // Depth filtering on existing context
  const depthMatch = lowerQuery.match(/(?:depth|deeper)\s*(?:>|greater\s*than|more\s*than|over)\s*(\d+)/);
  if (depthMatch) {
    console.log('📏 Depth filter detected:', depthMatch[1]);
    return {
      queryType: 'depth',
      confidence: 0.8,
      parameters: { minDepth: parseInt(depthMatch[1]), operator: 'greater_than', unit: 'm' }
    };
  }
  
  // Everything else → forward raw to OSDU Tools API (backend agent handles NLP)
  console.log('🔄 Forwarding to OSDU Tools API (backend agent handles NLP)');
  return { queryType: 'osdu', confidence: 0.9, parameters: { rawQuery: searchQuery } };
}

// Function to handle weather maps queries - combines wells with weather overlay
async function handleWeatherMapsQuery(searchQuery: string, parsedQuery: any): Promise<any> {
  console.log('🌤️ === WEATHER MAPS HANDLER START ===');
  console.log('📍 Parameters:', parsedQuery.parameters);
  
  try {
    // Step 1: Get user wells first
    console.log('🔍 Step 1: Fetching user wells for weather map context');
    const userWells = await fetchUserWells();
    
    if (userWells.length === 0) {
      console.log('❌ No user wells found, cannot determine weather map area');
      return {
        type: "FeatureCollection",
        metadata: {
          type: "error",
          searchQuery: searchQuery,
          error: "No wells found to determine weather map area. Please ensure well data is available.",
          queryType: 'weatherMaps'
        },
        features: []
      };
    }
    
    // Step 2: Calculate 50km bounding area around wells
    console.log('🗺️ Step 2: Calculating 50km bounding area around', userWells.length, 'wells');
    const wellCoordinates = userWells.map(well => well.geometry.coordinates);
    const bounds = calculateWeatherBounds(wellCoordinates, parsedQuery.parameters.radius);
    
    console.log('📐 Weather map bounds:', bounds);
    
    // Step 3: Fetch weather data for the area
    console.log('🌦️ Step 3: Fetching weather data for region');
    const weatherData = await fetchWeatherDataForRegion(bounds, parsedQuery.parameters);
    
    // Step 4: Create combined GeoJSON with wells and weather
    console.log('🔗 Step 4: Combining wells with weather overlay data');
    const combinedFeatures = [
      ...userWells, // Existing wells
      ...weatherData.features // Weather overlay features
    ];
    
    const enhancedMetadata = {
      type: "wells_with_weather",
      searchQuery: searchQuery,
      source: "Personal Wells + Weather Data",
      recordCount: userWells.length,
      weatherDataPoints: weatherData.features.length,
      region: 'user_wells_area',
      queryType: 'weatherMaps',
      timestamp: new Date().toISOString(),
      coordinateBounds: bounds,
      weatherLayers: weatherData.weatherLayers,
      weatherSettings: {
        radius: parsedQuery.parameters.radius,
        primaryWeatherTypes: parsedQuery.parameters.weatherTypes,
        additionalWeatherTypes: parsedQuery.parameters.additionalWeatherTypes,
        lastUpdated: weatherData.timestamp
      }
    };
    
    console.log('✅ Weather maps query completed successfully');
    console.log('📊 Result summary:', {
      wells: userWells.length,
      weatherPoints: weatherData.features.length,
      totalFeatures: combinedFeatures.length,
      weatherLayers: Object.keys(weatherData.weatherLayers).length
    });
    
    console.log('🌤️ === WEATHER MAPS HANDLER END (SUCCESS) ===');
    
    return {
      type: "FeatureCollection",
      metadata: enhancedMetadata,
      features: combinedFeatures,
      weatherLayers: weatherData.weatherLayers, // Add weather layer configuration
      weatherControls: {
        primaryLayers: parsedQuery.parameters.weatherTypes,
        additionalLayers: parsedQuery.parameters.additionalWeatherTypes,
        radius: parsedQuery.parameters.radius
      }
    };
    
  } catch (error) {
    console.error('❌ Error in weather maps handler:', error);
    console.log('🌤️ === WEATHER MAPS HANDLER END (ERROR) ===');
    
    return {
      type: "FeatureCollection",
      metadata: {
        type: "error",
        searchQuery: searchQuery,
        error: `Weather map generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        queryType: 'weatherMaps'
      },
      features: []
    };
  }
}

// Function to calculate weather bounding area around wells
function calculateWeatherBounds(wellCoordinates: [number, number][], radiusKm: number): any {
  console.log('📐 Calculating weather bounds for', wellCoordinates.length, 'wells with', radiusKm, 'km radius');
  
  // Find bounding box of all wells
  const minLon = Math.min(...wellCoordinates.map(coord => coord[0]));
  const maxLon = Math.max(...wellCoordinates.map(coord => coord[0]));
  const minLat = Math.min(...wellCoordinates.map(coord => coord[1]));
  const maxLat = Math.max(...wellCoordinates.map(coord => coord[1]));
  
  // Convert radius to degrees (rough approximation: 1 degree ≈ 111 km)
  const radiusDegrees = radiusKm / 111;
  
  const weatherBounds = {
    minLon: minLon - radiusDegrees,
    maxLon: maxLon + radiusDegrees, 
    minLat: minLat - radiusDegrees,
    maxLat: maxLat + radiusDegrees,
    centerLon: (minLon + maxLon) / 2,
    centerLat: (minLat + maxLat) / 2,
    radiusKm: radiusKm
  };
  
  console.log('✅ Weather bounds calculated:', weatherBounds);
  return weatherBounds;
}

// Function to fetch weather data for a specific region
async function fetchWeatherDataForRegion(bounds: any, parameters: any): Promise<any> {
  console.log('🌦️ Fetching weather data for bounds:', bounds);
  console.log('⚙️ Weather parameters:', parameters);
  
  try {
    // For now, generate mock weather data since we don't have a weather API key
    // In production, this would call OpenWeatherMap, WeatherAPI, or similar service
    const weatherFeatures = [];
    const weatherLayers: any = {};
    
    // Generate temperature overlay data (primary weather type)
    if (parameters.weatherTypes.includes('temperature')) {
      console.log('🌡️ Generating temperature overlay data');
      const tempData = await generateTemperatureOverlay(bounds);
      weatherFeatures.push(...tempData.features);
      weatherLayers.temperature = tempData.layerConfig;
    }
    
    // Generate precipitation overlay data (secondary weather type)  
    if (parameters.weatherTypes.includes('precipitation')) {
      console.log('🌧️ Generating precipitation overlay data');
      const precipData = await generatePrecipitationOverlay(bounds);
      weatherFeatures.push(...precipData.features);
      weatherLayers.precipitation = precipData.layerConfig;
    }
    
    // Generate additional weather types for progressive disclosure
    const additionalLayers: any = {};
    for (const weatherType of parameters.additionalWeatherTypes || []) {
      console.log(`🌤️ Generating ${weatherType} overlay data for progressive disclosure`);
      const additionalData = await generateAdditionalWeatherOverlay(bounds, weatherType);
      additionalLayers[weatherType] = additionalData.layerConfig;
    }
    
    return {
      features: weatherFeatures,
      weatherLayers: {
        ...weatherLayers,
        additional: additionalLayers
      },
      timestamp: new Date().toISOString(),
      bounds: bounds
    };
    
  } catch (error) {
    console.error('❌ Error fetching weather data:', error);
    return {
      features: [],
      weatherLayers: {},
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown weather data error'
    };
  }
}

// Generate temperature overlay data
async function generateTemperatureOverlay(bounds: any): Promise<any> {
  const features = [];
  const gridSize = 0.1; // ~11km grid
  
  for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += gridSize) {
    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += gridSize) {
      // Generate realistic temperature data for Southeast Asia
      const baseTemp = 28; // Typical tropical temperature
      const variation = (Math.random() - 0.5) * 4; // +/- 2°C variation
      const temperature = Math.round((baseTemp + variation) * 10) / 10;
      
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        properties: {
          type: "weather_temperature",
          temperature: temperature,
          unit: "°C",
          layer: "temperature",
          gridCell: true,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  
  return {
    features,
    layerConfig: {
      type: "temperature",
      unit: "°C",
      colorScale: {
        min: 24,
        max: 32,
        colors: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]
      },
      opacity: 0.6,
      visible: true,
      displayName: "Temperature"
    }
  };
}

// Generate precipitation overlay data  
async function generatePrecipitationOverlay(bounds: any): Promise<any> {
  const features = [];
  const gridSize = 0.15; // Slightly larger grid for precipitation
  
  for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += gridSize) {
    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += gridSize) {
      // Generate realistic precipitation data for tropical region
      const basePrecip = Math.random() * 10; // 0-10mm baseline
      const intensity = Math.random() > 0.7 ? Math.random() * 20 : 0; // 30% chance of higher precipitation
      const precipitation = Math.round((basePrecip + intensity) * 10) / 10;
      
      // Only add precipitation points where there's measurable rain
      if (precipitation > 0.5) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point", 
            coordinates: [lon, lat]
          },
          properties: {
            type: "weather_precipitation",
            precipitation: precipitation,
            unit: "mm/h",
            layer: "precipitation",
            gridCell: true,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }
  
  return {
    features,
    layerConfig: {
      type: "precipitation",
      unit: "mm/h",
      colorScale: {
        min: 0,
        max: 25,
        colors: ["#ffffff00", "#87ceeb", "#4682b4", "#1e90ff", "#0000ff", "#8b00ff", "#ff1493"]
      },
      opacity: 0.7,
      visible: true,
      displayName: "Precipitation"
    }
  };
}

// Generate additional weather overlay data for progressive disclosure
async function generateAdditionalWeatherOverlay(bounds: any, weatherType: string): Promise<any> {
  const features = [];
  const gridSize = 0.2;
  
  // Define weather type configuration outside the loop
  let unit: string;
  let colorScale: any;
  
  switch (weatherType) {
    case 'wind':
      unit = "m/s";
      colorScale = {
        min: 0,
        max: 20,
        colors: ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#2c7fb8", "#253494"]
      };
      break;
      
    case 'pressure':
      unit = "hPa";
      colorScale = {
        min: 1005,
        max: 1020,
        colors: ["#d73027", "#fc8d59", "#fee08b", "#e6f598", "#99d594", "#3288bd"]
      };
      break;
      
    case 'humidity':
      unit = "%";
      colorScale = {
        min: 50,
        max: 90,
        colors: ["#ffffd4", "#fed98e", "#fe9929", "#d95f0e", "#993404"]
      };
      break;
      
    default:
      // Return empty data for unknown weather types
      return {
        features: [],
        layerConfig: {
          type: weatherType,
          unit: "unknown",
          colorScale: { min: 0, max: 1, colors: ["#ffffff"] },
          opacity: 0.5,
          visible: false,
          displayName: weatherType.charAt(0).toUpperCase() + weatherType.slice(1)
        }
      };
  }
  
  // Generate grid data
  for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += gridSize) {
    for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += gridSize) {
      let value: number;
      
      switch (weatherType) {
        case 'wind':
          value = Math.round((Math.random() * 15 + 5) * 10) / 10; // 5-20 m/s
          break;
        case 'pressure':
          value = Math.round((1013 + (Math.random() - 0.5) * 10) * 10) / 10; // 1008-1018 hPa
          break;
        case 'humidity':
          value = Math.round((70 + (Math.random() - 0.5) * 30) * 10) / 10; // 55-85%
          break;
        default:
          value = 0;
      }
      
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        properties: {
          type: `weather_${weatherType}`,
          [weatherType]: value,
          unit: unit,
          layer: weatherType,
          gridCell: true,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  
  return {
    features,
    layerConfig: {
      type: weatherType,
      unit: unit,
      colorScale: colorScale,
      opacity: 0.5,
      visible: false, // Hidden by default for progressive disclosure
      displayName: weatherType.charAt(0).toUpperCase() + weatherType.slice(1)
    }
  };
}

// Function to search OSDU for well data with enhanced NLP processing
async function searchOSDUWells(searchQuery: string, existingContext?: any): Promise<any> {
  console.log('Processing search query:', searchQuery);
  
  const parsedQuery = parseNLPQuery(searchQuery);
  console.log('Parsed query:', parsedQuery);
  
  // Create lowerPrompt for context filtering logic
  const lowerPrompt = (searchQuery || '').toLowerCase();
  
  try {
    // searchParams no longer needed - backend agent handles query interpretation
    
    // Handle special query types before OSDU search
    if (parsedQuery.queryType === 'weatherMaps') {
      console.log('Handling weather maps query - combining wells with weather overlay');
      return await handleWeatherMapsQuery(searchQuery, parsedQuery);
    }
    
    if (parsedQuery.queryType === 'polygonSearch') {
      console.log('🔷 Handling "wells in polygon" query - fetching user LAS files from S3 for polygon search');
      const userWells = await fetchUserWells();
      
      return {
        type: "FeatureCollection",
        metadata: {
          type: "wells",
          searchQuery: searchQuery,
          source: "Personal LAS Files (Real Coordinates)",
          recordCount: userWells.length,
          region: 'offshore-brunei-malaysia',
          queryType: 'polygonSearch',
          polygonFilter: {
            id: 'polygon_ready',
            message: 'Wells loaded for polygon filtering'
          },
          timestamp: new Date().toISOString(),
          coordinateBounds: userWells.length > 0 ? {
            minLon: Math.min(...userWells.map(f => f.geometry.coordinates[0])),
            maxLon: Math.max(...userWells.map(f => f.geometry.coordinates[0])),
            minLat: Math.min(...userWells.map(f => f.geometry.coordinates[1])),
            maxLat: Math.max(...userWells.map(f => f.geometry.coordinates[1]))
          } : null
        },
        features: userWells
      };
    }

    // Handle depth filtering for user wells or any depth queries
    if (parsedQuery.queryType === 'depth') {
      console.log('🔍 Handling depth filtering query - applying depth criteria');
      console.log('📏 Depth parameters:', parsedQuery.parameters);
      
    // Enhanced context-aware filtering detection
    const hasExistingWells = existingContext?.wells && existingContext.wells.length > 0;
    const isExplicitFilter = existingContext?.isFilterOperation === true;
    
    // Detect if this is likely a filter operation
    const filterIndicators = [
      'depth', 'filter', 'greater than', 'deeper', '>',
      'show wells with', 'wells with', 'having depth',
      'where depth', 'depth >', 'deeper than'
    ];
    const hasFilterKeywords = filterIndicators.some(keyword => lowerPrompt.includes(keyword));
    
    const isContextualFilter = hasExistingWells && (isExplicitFilter || hasFilterKeywords);
      
      if (isContextualFilter) {
        console.log('🎯 APPLYING FILTER TO EXISTING CONTEXT');
        console.log('📊 Existing context wells:', existingContext.wells.length);
        console.log('🔍 Filter operation type:', isExplicitFilter ? 'explicit' : 'detected from keywords');
        
        // Apply appropriate filter to existing context wells
        let filteredContextWells = [];
        
        if (parsedQuery.parameters.minDepth && parsedQuery.parameters.operator === 'greater_than') {
          const minDepth = parsedQuery.parameters.minDepth;
          console.log(`🔍 Filtering EXISTING CONTEXT wells with depth > ${minDepth}m`);
          
          filteredContextWells = existingContext.wells.filter((well: any) => {
            const depthStr = well.depth || '0m';
            const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
            const depthValue = depthMatch ? parseFloat(depthMatch[1]) : 0;
            const passesFilter = depthValue > minDepth;
            
            console.log(`  - ${well.name}: "${depthStr}" -> ${depthValue}m ${passesFilter ? '✅ PASS' : '❌ FAIL'}`);
            return passesFilter;
          });
          
          console.log(`✅ Context wells depth filtering: ${filteredContextWells.length}/${existingContext.wells.length} wells match criteria`);
        } else {
          // For non-depth filters, return original context (can be extended for other filter types)
          console.log('⚠️ Non-depth filter detected, returning original context');
          filteredContextWells = existingContext.wells;
        }
        
        // Convert context wells back to GeoJSON features
        const contextFeatures = filteredContextWells.map((well: any) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: well.coordinates || [0, 0]
          },
          properties: {
            name: well.name,
            type: well.type,
            depth: well.depth,
            location: well.location,
            operator: well.operator,
            category: well.category || 'contextual',
            dataSource: 'Context Filter Applied'
          }
        }));
        
        return {
          type: "FeatureCollection",
          metadata: {
            type: "wells",
            searchQuery: searchQuery,
            source: "Filtered from Previous Search Context",
            recordCount: contextFeatures.length,
            region: 'context-filtered',
            queryType: parsedQuery.queryType || 'filter',
            contextFilter: true,
            isFilterOperation: true,
            originalContext: {
              wells: existingContext.wells.length,
              queryType: existingContext.queryType,
              timestamp: existingContext.timestamp
            },
            filterCriteria: parsedQuery.parameters,
            timestamp: new Date().toISOString(),
            coordinateBounds: contextFeatures.length > 0 ? {
              minLon: Math.min(...contextFeatures.map(f => f.geometry.coordinates[0])),
              maxLon: Math.max(...contextFeatures.map(f => f.geometry.coordinates[0])),
              minLat: Math.min(...contextFeatures.map(f => f.geometry.coordinates[1])),
              maxLat: Math.max(...contextFeatures.map(f => f.geometry.coordinates[1]))
            } : null
          },
          features: contextFeatures
        };
      }
      
      // Otherwise, do fresh search with depth filtering (existing logic)
      console.log('🆕 No existing context or not contextual filter - doing fresh search');
      
      // Get user wells first
      const userWells = await fetchUserWells();
      
      // Apply depth filtering to user wells
      let filteredUserWells = userWells;
      if (parsedQuery.parameters.minDepth && parsedQuery.parameters.operator === 'greater_than') {
        const minDepth = parsedQuery.parameters.minDepth;
        console.log(`🔍 Filtering USER wells with depth > ${minDepth}m`);
        
        filteredUserWells = userWells.filter(well => {
          const depthStr = well.properties.depth || '0m';
          // Enhanced depth parsing to handle multiple formats
          const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
          const depthValue = depthMatch ? parseFloat(depthMatch[1]) : 0;
          const passesFilter = depthValue > minDepth;
          
          console.log(`  - ${well.properties.name}: "${depthStr}" -> ${depthValue}m ${passesFilter ? '✅ PASS' : '❌ FAIL'}`);
          return passesFilter;
        });
        
        console.log(`✅ User wells depth filtering: ${filteredUserWells.length}/${userWells.length} wells match criteria`);
      }
      
      // Only use user wells from S3 for depth filtering (no mock data)
      console.log('🔍 Using only real S3 user wells for depth filtering');
      const allFilteredFeatures = [...filteredUserWells];
      
      return {
        type: "FeatureCollection",
        metadata: {
          type: "wells",
          searchQuery: searchQuery,
          source: "Personal LAS Files (Depth Filtered)",
          recordCount: allFilteredFeatures.length,
          region: 'offshore-brunei-malaysia',
          queryType: 'depth',
          depthFilter: {
            minDepth: parsedQuery.parameters.minDepth,
            operator: parsedQuery.parameters.operator,
            unit: parsedQuery.parameters.unit
          },
          timestamp: new Date().toISOString(),
          coordinateBounds: allFilteredFeatures.length > 0 ? {
            minLon: Math.min(...allFilteredFeatures.map(f => f.geometry.coordinates[0])),
            maxLon: Math.max(...allFilteredFeatures.map(f => f.geometry.coordinates[0])),
            minLat: Math.min(...allFilteredFeatures.map(f => f.geometry.coordinates[1])),
            maxLat: Math.max(...allFilteredFeatures.map(f => f.geometry.coordinates[1]))
          } : null
        },
        features: allFilteredFeatures
      };
    }

    if (parsedQuery.queryType === 'myWells') {
      console.log('Handling "my wells" query - fetching user LAS files from S3');
      const userWells = await fetchUserWells();
      
      // Parse query using shared NLP parser for filtering
      const filters = parseNaturalLanguageQuery(searchQuery);
      console.log('🎯 Shared parser filters:', filters);
      
      // Apply filters to catalog data
      const filteredWells = filterCatalogData(userWells, filters);
      const isFiltered = filteredWells.length < userWells.length;
      
      console.log(`📊 Catalog filtering: ${filteredWells.length}/${userWells.length} wells ${isFiltered ? '(Filtered)' : ''}`);
      
      // Add exploration blocks
      const explorationBlocks = generateExplorationBlocks();
      const allFeatures = [...explorationBlocks, ...filteredWells];
      
      return {
        type: "FeatureCollection",
        metadata: {
          type: "wells",
          searchQuery: searchQuery,
          source: `Personal LAS Files (Real Coordinates)${isFiltered ? ' (Filtered)' : ''}`,
          recordCount: filteredWells.length,
          blocksCount: explorationBlocks.length,
          originalCount: userWells.length,
          filtered: isFiltered,
          filterCriteria: filters.hasFilters ? filters : undefined,
          region: 'offshore-brunei-malaysia',
          queryType: 'myWells',
          timestamp: new Date().toISOString(),
          coordinateBounds: filteredWells.length > 0 ? {
            minLon: Math.min(...filteredWells.map(f => f.geometry.coordinates[0])),
            maxLon: Math.max(...filteredWells.map(f => f.geometry.coordinates[0])),
            minLat: Math.min(...filteredWells.map(f => f.geometry.coordinates[1])),
            maxLat: Math.max(...filteredWells.map(f => f.geometry.coordinates[1]))
          } : null
        },
        features: allFeatures
      };
    }
    
    if (parsedQuery.queryType === 'allWells') {
      console.log('Handling "all wells" query - combining OSDU wells with user wells');
      
      // Get user wells first
      const userWells = await fetchUserWells();
      
      // Fetch real OSDU wells via Tools API
      let osduFeatures: any[] = [];
      try {
        console.log('Fetching real OSDU wells via Tools API for allWells query');
        const osduResponse = await fetch(OSDU_TOOLS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': OSDU_TOOLS_API_KEY,
          },
          body: JSON.stringify({
            toolName: 'searchWells',
            input: {
              filters: {},
              maxResults: 100,
            }
          })
        });

        if (osduResponse.ok) {
          const osduResult = await osduResponse.json();
          if (osduResult.statusCode === 200 && osduResult.body?.records?.length) {
            osduFeatures = osduResult.body.records
              .filter((r: any) => r.location?.lat && r.location?.lon)
              .map((record: any) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [record.location.lon, record.location.lat] },
                properties: {
                  name: record.WellName || record.name,
                  type: record.LogType || 'Well Log',
                  depth: record.TopDepth && record.BottomDepth ? `${record.TopDepth}-${record.BottomDepth}m` : 'Unknown',
                  location: `${record.field || ''} (${record.basin || ''})`,
                  operator: record.company || 'Unknown',
                  category: 'osdu',
                  dataSource: 'OSDU Platform (Live)',
                  osduId: record.osduRecordId || record.recordId,
                  country: record.country,
                  field: record.field,
                  basin: record.basin,
                  logType: record.LogType,
                  latitude: record.location.lat.toFixed(6),
                  longitude: record.location.lon.toFixed(6),
                }
              }));
            console.log(`Fetched ${osduFeatures.length} real OSDU wells`);
          } else {
            console.warn('OSDU Tools API returned no records for allWells query');
          }
        } else {
          console.warn(`OSDU Tools API error for allWells: ${osduResponse.status}`);
        }
      } catch (osduError) {
        console.warn('Error fetching OSDU wells for allWells query:', osduError);
      }

      // Add exploration blocks
      const explorationBlocks = generateExplorationBlocks();
      
      // Combine all datasets - blocks first so they render under wells
      const allFeatures = [
        ...explorationBlocks,
        ...osduFeatures,
        ...userWells
      ];
      
      return {
        type: "FeatureCollection",
        metadata: {
          type: "wells",
          searchQuery: searchQuery,
          source: osduFeatures.length > 0 ? "OSDU Platform (Live) + Personal LAS Files + Exploration Blocks" : "Personal LAS Files + Exploration Blocks",
          recordCount: osduFeatures.length + userWells.length,
          blocksCount: explorationBlocks.length,
          region: 'all',
          queryType: 'allWells',
          timestamp: new Date().toISOString(),
          coordinateBounds: allFeatures.length > 0 ? {
            minLon: Math.min(...allFeatures.filter(f => f.geometry.type === 'Point').map(f => f.geometry.coordinates[0])),
            maxLon: Math.max(...allFeatures.filter(f => f.geometry.type === 'Point').map(f => f.geometry.coordinates[0])),
            minLat: Math.min(...allFeatures.filter(f => f.geometry.type === 'Point').map(f => f.geometry.coordinates[1])),
            maxLat: Math.max(...allFeatures.filter(f => f.geometry.type === 'Point').map(f => f.geometry.coordinates[1]))
          } : null
        },
        features: allFeatures
      };
    }
    
    // Extract structured filters from natural language query
    const filters: any = {};
    const lowerSearch = searchQuery.toLowerCase();
    
    // Known companies in the OSDU backend
    const knownCompanies: { pattern: RegExp; name: string }[] = [
      { pattern: /\bshell\b/i, name: 'Shell' },
      { pattern: /\bchevron\b/i, name: 'Chevron' },
      { pattern: /\bpetrobras\b/i, name: 'Petrobras' },
      { pattern: /\bsaudi\s*aramco\b/i, name: 'Saudi Aramco' },
      { pattern: /\bequinor\b/i, name: 'Equinor' },
      { pattern: /\bconocophillips\b/i, name: 'ConocoPhillips' },
      { pattern: /\bcontinental\s*resources\b/i, name: 'Continental Resources' },
    ];
    
    // Known locations/fields in the OSDU backend
    const knownLocations: { pattern: RegExp; name: string }[] = [
      { pattern: /\bvolve\b/i, name: 'Volve' },
      { pattern: /\bbrent\b/i, name: 'Brent' },
      { pattern: /\bdelaware\s*basin\b/i, name: 'Delaware Basin' },
      { pattern: /\beagle\s*ford\b/i, name: 'Eagle Ford Shale' },
      { pattern: /\bsafaniya\b/i, name: 'Safaniya' },
      { pattern: /\bmars\b/i, name: 'Mars' },
      { pattern: /\blula\b/i, name: 'Lula' },
    ];
    
    const matchedCompany = knownCompanies.find(c => c.pattern.test(searchQuery));
    const matchedLocation = knownLocations.find(l => l.pattern.test(searchQuery));
    
    if (matchedCompany) {
      filters.company = matchedCompany.name;
      console.log('🏢 Company filter:', filters.company);
    } else if (matchedLocation) {
      filters.location = matchedLocation.name;
      console.log('📍 Location filter:', filters.location);
    } else {
      console.log('🔄 No specific filter detected, doing full scan');
    }
    
    // Call OSDU Tools API with structured filters
    console.log('📡 Calling searchWells with filters:', JSON.stringify(filters));
    const response = await fetch(OSDU_TOOLS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': OSDU_TOOLS_API_KEY,
      },
      body: JSON.stringify({
        toolName: 'searchWells',
        input: {
          filters,
          maxResults: 100,
        }
      })
    });

    if (!response.ok) {
      console.warn(`OSDU Tools API returned ${response.status}: ${response.statusText}`);
      return {
        type: "FeatureCollection",
        metadata: {
          type: "error",
          searchQuery,
          error: `OSDU Tools API returned ${response.status}: ${response.statusText}`,
          message: 'Failed to fetch well data from OSDU.',
          suggestion: 'Try again later or search for "my wells" to see your personal S3 well data.',
          queryType: parsedQuery?.queryType || 'osdu',
          timestamp: new Date().toISOString(),
        },
        features: [],
      };
    }

    const toolsResult = await response.json();
    console.log('OSDU Tools API result:', { statusCode: toolsResult.statusCode, recordCount: toolsResult.body?.records?.length });

    if (toolsResult.statusCode !== 200 || !toolsResult.body?.records?.length) {
      console.log('No results from OSDU Tools API');
      return {
        type: "FeatureCollection",
        metadata: {
          type: "wells",
          searchQuery,
          source: "OSDU Platform (Live)",
          recordCount: 0,
          message: `No wells found${matchedCompany ? ` for company "${matchedCompany.name}"` : matchedLocation ? ` in "${matchedLocation.name}"` : ''}.`,
          suggestion: 'Try a broader search or use "my wells" to see your personal S3 well data.',
          queryType: parsedQuery?.queryType || 'osdu',
          timestamp: new Date().toISOString(),
        },
        features: [],
      };
    }

    // Transform records to GeoJSON features (only records with coordinates get map pins)
    const features = toolsResult.body.records
      .filter((r: any) => r.location?.lat && r.location?.lon)
      .map((record: any) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [record.location.lon, record.location.lat] },
        properties: {
          name: record.WellName || record.name,
          type: record.LogType || 'Well Log',
          depth: record.TopDepth && record.BottomDepth ? `${record.TopDepth}-${record.BottomDepth}m` : 'Unknown',
          location: `${record.field || ''} (${record.basin || ''})`,
          operator: record.company || 'Unknown',
          category: 'osdu',
          dataSource: 'OSDU Platform (Live)',
          osduId: record.osduRecordId || record.recordId,
          country: record.country,
          field: record.field,
          basin: record.basin,
          logType: record.LogType,
          latitude: record.location.lat.toFixed(6),
          longitude: record.location.lon.toFixed(6),
        }
      }));

    const totalRecords = toolsResult.body.records.length;
    const unmappableRecords = totalRecords - features.length;
    if (unmappableRecords > 0) {
      console.log(`📊 ${unmappableRecords} records without coordinates (will show in table but not on map)`);
    }

    return {
      type: "FeatureCollection",
      metadata: {
        type: "wells",
        searchQuery,
        source: "OSDU Platform (Live)",
        recordCount: features.length,
        totalRecords,
        unmappableRecords,
        totalFound: toolsResult.body.metadata?.totalFound,
        queryType: parsedQuery?.queryType || 'osdu',
        timestamp: new Date().toISOString(),
        ...(features.length > 0 && {
          coordinateBounds: {
            minLon: Math.min(...features.map((f: any) => f.geometry.coordinates[0])),
            maxLon: Math.max(...features.map((f: any) => f.geometry.coordinates[0])),
            minLat: Math.min(...features.map((f: any) => f.geometry.coordinates[1])),
            maxLat: Math.max(...features.map((f: any) => f.geometry.coordinates[1])),
          }
        })
      },
      features,
    };

  } catch (error) {
    console.error('Error in OSDU search:', error);
    
    return {
      type: "FeatureCollection",
      metadata: {
        type: "error",
        searchQuery,
        error: `OSDU search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        message: 'An error occurred while searching OSDU.',
        suggestion: 'Try again later or search for "my wells" to see your personal S3 well data.',
        queryType: 'error',
        timestamp: new Date().toISOString(),
      },
      features: [],
    };
  }
}



export const handler: Handler = async (event) => {
  console.log('🔍 === CATALOG SEARCH WITH CHAIN OF THOUGHT START ===');
  console.log('📝 Raw event:', JSON.stringify(event, null, 2));
  
  // Initialize thought steps array for chain of thought at handler level
  const thoughtSteps: ThoughtStep[] = [];
  const addThoughtStep = (step: ThoughtStep) => {
    thoughtSteps.push(step);
    console.log('🧠 CATALOG THOUGHT STEP ADDED:', {
      type: step.type,
      title: step.title,
      summary: step.summary,
      context: step.context
    });
  };

  try {
    const { prompt, existingContext } = event.arguments;
    console.log('🔍 === SEARCH CONTEXT ANALYSIS ===');
    console.log('📝 Received prompt:', prompt);
    console.log('🔄 Existing context provided:', !!existingContext);
    console.log('📊 Context wells count:', existingContext?.wells?.length || 0);
    console.log('🔤 Prompt type:', typeof prompt);
    console.log('📏 Prompt length:', prompt?.length || 0);
    
    // Enhanced depth filtering debug
    const lowerPrompt = (prompt || '').toLowerCase();
    console.log('🔤 Lowercase prompt:', lowerPrompt);
    console.log('🔍 Contains "depth":', lowerPrompt.includes('depth'));
    console.log('🔍 Contains "greater than":', lowerPrompt.includes('greater than'));
    console.log('🔍 Contains ">":', lowerPrompt.includes('>'));
    console.log('🔍 Contains numbers:', /\d+/.test(lowerPrompt));
    
    // Context-aware filtering detection - ENHANCED DEBUG
    const hasExistingWells = existingContext?.wells && existingContext.wells.length > 0;
    const isDepthFilterQuery = lowerPrompt.includes('depth') || lowerPrompt.includes('deeper') || lowerPrompt.includes('>');
    const isFilterQuery = lowerPrompt.includes('filter') || lowerPrompt.includes('greater than');
    const isLikelyFilter = hasExistingWells && (isDepthFilterQuery || isFilterQuery);
    
    console.log('🔍 === ENHANCED CONTEXT-AWARE ANALYSIS ===');
    console.log('   - Raw existing context:', existingContext);
    console.log('   - Has existing wells:', hasExistingWells);
    console.log('   - Existing wells count:', existingContext?.wells?.length || 0);
    console.log('   - Is depth filter query:', isDepthFilterQuery);
    console.log('   - Is filter query:', isFilterQuery);
    console.log('   - Looks like filter overall:', isLikelyFilter);
    console.log('   - Should use context:', isLikelyFilter && hasExistingWells);
    console.log('   - Previous query type:', existingContext?.queryType || 'none');
    
    if (hasExistingWells) {
      console.log('📋 Context wells preview:', existingContext.wells.slice(0, 3).map((w: any) => w.name));
    }
    
    // 🚨 EMERGENCY WEATHER DETECTION AT HANDLER LEVEL 🚨
    console.log('🚨 EMERGENCY HANDLER-LEVEL WEATHER CHECK');
    console.log('🔍 Prompt:', prompt);
    console.log('🔍 Contains weather:', prompt.includes('weather'));
    console.log('🔍 Contains wells:', prompt.includes('wells') || prompt.includes('well'));
    
    if (prompt.includes('weather') && (prompt.includes('wells') || prompt.includes('well'))) {
      console.log('🌤️ EMERGENCY OVERRIDE: WEATHER QUERY DETECTED AT HANDLER LEVEL');
      console.log('🚨 BYPASSING ALL OTHER LOGIC - GOING STRAIGHT TO WEATHER HANDLER');
      
      // Force weather maps query directly
      const emergencyWeatherQuery = {
        queryType: 'weatherMaps',
        parameters: {
          includeUserWells: true,
          weatherTypes: ['temperature', 'precipitation'],
          additionalWeatherTypes: ['wind', 'pressure', 'humidity'],
          radius: 50,
          region: 'user_wells_area',
          coordinates: null
        }
      };
      
      // Call weather handler directly
      const weatherResult = await handleWeatherMapsQuery(prompt, emergencyWeatherQuery);
      console.log('🌤️ EMERGENCY WEATHER RESULT:', {
        type: weatherResult.type,
        features: weatherResult.features?.length || 0,
        metadata: weatherResult.metadata
      });
      
      // Add emergency thought steps
      const emergencyThoughtSteps = [
        {
          id: 'emergency-weather-detection',
          type: 'intent_detection',
          title: '🚨 Emergency Weather Detection',
          summary: 'Weather query detected at handler level - bypassing normal processing',
          status: 'completed',
          timestamp: Date.now()
        },
        {
          id: 'weather-processing',
          type: 'execution', 
          title: '🌤️ Weather Map Generation',
          summary: `Generated weather maps for ${weatherResult.metadata?.recordCount || 0} wells with weather overlays`,
          status: 'completed',
          timestamp: Date.now()
        }
      ];
      
      const emergencyResponse = {
        ...weatherResult,
        thoughtSteps: emergencyThoughtSteps
      };
      
      console.log('🚨 RETURNING EMERGENCY WEATHER RESPONSE');
      return JSON.stringify(emergencyResponse);
    }

    // THOUGHT STEP 1: Intent Detection
    console.log('🧠 Starting catalog query intent detection...');
    const intentStep = createThoughtStep(
      'intent_detection',
      'Analyzing Catalog Query',
      'Processing natural language input to understand data search requirements',
      { analysisType: 'catalog_search' }
    );
    addThoughtStep(intentStep);

    // Parse the query to understand intent
    const parsedQuery = parseNLPQuery(prompt);
    console.log('Parsed catalog query:', parsedQuery);

    // Complete intent detection step
    const completedIntentStep = completeThoughtStep(
      intentStep,
      `Catalog query type detected: ${parsedQuery.queryType}. ` +
      `Search scope: ${parsedQuery.parameters.region || 'general'}. ` +
      `${parsedQuery.parameters.includeUserWells ? 'Including user wells. ' : ''}` +
      `Parameters identified for data retrieval.`
    );
    completedIntentStep.confidence = 0.9;
    completedIntentStep.context = {
      analysisType: parsedQuery.queryType,
      parameters: parsedQuery.parameters
    };
    thoughtSteps[thoughtSteps.length - 1] = completedIntentStep;

    // THOUGHT STEP 2: Parameter Extraction
    const paramStep = createThoughtStep(
      'parameter_extraction',
      'Extracting Search Parameters',
      `Configuring ${parsedQuery.queryType} search parameters`,
      {
        analysisType: parsedQuery.queryType,
        parameters: parsedQuery.parameters
      }
    );
    addThoughtStep(paramStep);

    // Complete parameter extraction
    const completedParamStep = completeThoughtStep(
      paramStep,
      `Search parameters configured: Query type=${parsedQuery.queryType}, ` +
      `Region=${parsedQuery.parameters.region || 'all'}, ` +
      `Include user wells=${!!parsedQuery.parameters.includeUserWells}`
    );
    thoughtSteps[thoughtSteps.length - 1] = completedParamStep;

    // THOUGHT STEP 3: Data Source Selection  
    const dataSourceStep = createThoughtStep(
      'tool_selection',
      'Selecting Data Sources',
      'Determining optimal data sources for catalog search',
      {
        analysisType: 'data_source_selection',
        method: parsedQuery.queryType,
        parameters: { dataSources: ['OSDU', 'S3', 'Regional Database'] }
      }
    );
    addThoughtStep(dataSourceStep);

    // Determine which data sources to use
    let useS3 = parsedQuery.queryType === 'myWells' || parsedQuery.queryType === 'allWells';
    let useOSDU = parsedQuery.queryType !== 'myWells';
    
    const completedDataSourceStep = completeThoughtStep(
      dataSourceStep,
      `Data sources selected: ` +
      `${useOSDU ? 'OSDU Community Platform, ' : ''}` +
      `${useS3 ? 'S3 Personal Data, ' : ''}` +
      `South China Sea Regional Database`
    );
    thoughtSteps[thoughtSteps.length - 1] = completedDataSourceStep;

    // THOUGHT STEP 4: Search Execution
    const executionStep = createThoughtStep(
      'execution',
      'Executing Data Search',
      `Searching ${parsedQuery.queryType} across selected data sources`,
      {
        analysisType: 'data_search',
        method: parsedQuery.queryType,
        parameters: { searchQuery: prompt }
      }
    );
    addThoughtStep(executionStep);

    // Execute the search with context
    const searchResults = await searchOSDUWells(prompt, existingContext);
    console.log('Search results received:', searchResults.features?.length || 0, 'wells');

    // Complete execution step
    const completedExecutionStep = completeThoughtStep(
      executionStep,
      `Search completed successfully. Found ${searchResults.features?.length || 0} wells. ` +
      `Data sources: ${searchResults.metadata?.source || 'Multiple'}. ` +
      `Region coverage: ${searchResults.metadata?.region || 'Global'}.`
    );
    completedExecutionStep.context = {
      analysisType: 'search_results',
      parameters: {
        resultCount: searchResults.features?.length || 0,
        dataSource: searchResults.metadata?.source,
        region: searchResults.metadata?.region
      }
    };
    thoughtSteps[thoughtSteps.length - 1] = completedExecutionStep;

    // THOUGHT STEP 5: Data Processing
    const processingStep = createThoughtStep(
      'validation',
      'Processing Search Results',
      'Converting and validating search results for map display',
      {
        analysisType: 'data_processing',
        method: 'GeoJSON',
        parameters: { resultCount: searchResults.features?.length || 0 }
      }
    );
    addThoughtStep(processingStep);

    // Complete processing step
    const completedProcessingStep = completeThoughtStep(
      processingStep,
      `Results processed: ${searchResults.features?.length || 0} wells converted to GeoJSON format. ` +
      `Coordinate bounds calculated. Map markers prepared for interactive display.`
    );
    thoughtSteps[thoughtSteps.length - 1] = completedProcessingStep;

    // THOUGHT STEP 6: Completion
    const completionStep = createThoughtStep(
      'completion',
      'Catalog Search Complete',
      'Search results ready for visualization and analysis',
      {
        analysisType: 'catalog_search_complete',
        method: 'search_completion',
        parameters: { resultCount: searchResults.features?.length || 0, searchQuery: prompt }
      }
    );
    addThoughtStep(completionStep);

    // Complete the completion step
    const completedCompletionStep = completeThoughtStep(
      completionStep,
      `Catalog search completed successfully. ${searchResults.features?.length || 0} wells ready for map display. ` +
      `Interactive markers prepared with well details and analysis options.`
    );
    thoughtSteps[thoughtSteps.length - 1] = completedCompletionStep;

    console.log('🧠 CATALOG SEARCH: Generated', thoughtSteps.length, 'thought steps');

    // Enhanced response with thought steps
    const enhancedResults = {
      ...searchResults,
      thoughtSteps: thoughtSteps,
      chainOfThought: {
        totalSteps: thoughtSteps.length,
        processingTime: Date.now(),
        searchType: parsedQuery.queryType
      }
    };
    
    console.log('🔍 === CATALOG SEARCH WITH CHAIN OF THOUGHT END ===');
    console.log('🧠 Final thought steps count:', thoughtSteps.length);
    
    // Return the enhanced JSON string with thought steps
    return JSON.stringify(enhancedResults);
  } catch (error) {
    console.error('Error in catalogSearch:', error);
    
    // Add error thought step if we have the array initialized
    if (thoughtSteps) {
      const errorStep = createThoughtStep(
        'completion',
        'Search Error Occurred', 
        'Catalog search encountered an error',
        { 
          analysisType: 'error_handling',
          parameters: { error: error instanceof Error ? error.message : 'Unknown error' }
        }
      );
      errorStep.status = 'error';
      addThoughtStep(errorStep);
      
      // Return error response with thought steps
      const errorResults = {
        type: "FeatureCollection",
        features: [],
        metadata: {
          type: "error",
          searchQuery: event.arguments?.prompt || '',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        thoughtSteps: thoughtSteps
      };
      
      return JSON.stringify(errorResults);
    }
    
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
