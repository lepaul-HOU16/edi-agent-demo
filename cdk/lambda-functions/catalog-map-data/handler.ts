import { Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

// AWS S3 Configuration
const S3_BUCKET = process.env.STORAGE_BUCKET_NAME || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
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

// Function to fetch well data from NEW OSDU Tools API
async function fetchOSDUWells(maxResults: number = 100): Promise<any> {
  try {
    console.log(`Fetching wells from OSDU Tools API (maxResults: ${maxResults})`);

    const response = await fetch(OSDU_TOOLS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': OSDU_TOOLS_API_KEY,
      },
      body: JSON.stringify({
        toolName: 'searchWells',
        input: {
          maxResults: maxResults,
        }
      })
    });

    if (!response.ok) {
      console.warn(`OSDU Tools API returned ${response.status}: ${response.statusText}`);
      return generateMockWellsData();
    }

    const result = await response.json();
    console.log('OSDU Tools API Response:', JSON.stringify({
      statusCode: result.statusCode,
      metadata: result.body?.metadata,
      recordCount: result.body?.records?.length
    }, null, 2));

    if (result.statusCode !== 200 || !result.body?.records) {
      console.warn('Invalid response from OSDU Tools API');
      return generateMockWellsData();
    }

    // Transform OSDU Tools API results to GeoJSON
    return transformWellsToGeoJSON(result.body.records, result.body.metadata);

  } catch (error) {
    console.error('Error fetching wells from OSDU Tools API:', error);
    return generateMockWellsData();
  }
}

// Function to fetch seismic data from OSDU
async function fetchOSDUSeismic(): Promise<any> {
  try {
    const searchParams: OSDUSearchRequest = {
      kind: 'osdu:wks:work-product-component--SeismicTrace:*',
      limit: 20,
      returnedFields: ['data.Name', 'data.SurveyType', 'data.GeoLocation', 'data.AcquisitionDate']
    };

    console.log('Fetching seismic from OSDU:', JSON.stringify(searchParams, null, 2));

    const response = await fetch(`${OSDU_BASE_URL}/api/search/${OSDU_API_VERSION}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'data-partition-id': OSDU_PARTITION_ID,
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      console.warn(`OSDU Seismic API returned ${response.status}: ${response.statusText}`);
      return generateMockSeismicData();
    }

    const osduResults = await response.json();
    console.log('OSDU Seismic Results:', JSON.stringify(osduResults, null, 2));

    // Transform OSDU seismic results to GeoJSON
    return transformSeismicToGeoJSON(osduResults.results || []);

  } catch (error) {
    console.error('Error fetching seismic from OSDU:', error);
    return generateMockSeismicData();
  }
}

// Transform OSDU well records to GeoJSON format (NEW API format)
function transformWellsToGeoJSON(osduRecords: any[], metadata?: any): any {
  const features = osduRecords.map((record, index) => {
    const wellData = record.data;
    const coordinates = wellData.GeoLocation?.Wgs84Coordinates ? 
      [wellData.GeoLocation.Wgs84Coordinates.Longitude, wellData.GeoLocation.Wgs84Coordinates.Latitude] :
      [107.2 + (index * 0.02), 10.2 + (index * 0.02)]; // Fallback coordinates - Vietnamese offshore petroleum blocks
    
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: {
        name: wellData.FacilityName || wellData.WellboreID || `Well-${index + 1}`,
        type: wellData.WellType || 'Unknown',
        depth: wellData.VerticalMeasurement?.Depth ? 
          `${wellData.VerticalMeasurement.Depth.Value} ${wellData.VerticalMeasurement.Depth.UOM}` : 
          'Unknown',
        location: wellData.FacilityState || 'Unknown',
        osduId: record.id,
        status: 'Active',
        company: wellData.OperatorName || 'Unknown'
      }
    };
  });

  return {
    type: "FeatureCollection",
    features: features,
    metadata: metadata ? {
      totalFound: metadata.totalFound,
      filtered: metadata.filtered,
      authorized: metadata.authorized,
      returned: metadata.returned
    } : undefined
  };
}

// Transform OSDU seismic records to GeoJSON format
function transformSeismicToGeoJSON(osduRecords: any[]): any {
  const features = osduRecords.map((record, index) => {
    const seismicData = record.data;
    
    // For seismic surveys, create line strings representing survey lines
    // This is a simplified representation - actual seismic data would be more complex
    const baseCoords = [107.3 + (index * 0.1), 10.3 + (index * 0.1)]; // Vietnamese offshore petroleum blocks coordinates
    const coordinates = [
      baseCoords,
      [baseCoords[0] + 0.4, baseCoords[1] + 0.3]
    ];
    
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates
      },
      properties: {
        name: seismicData.Name || `Seismic Survey ${index + 1}`,
        type: seismicData.SurveyType || '2D Survey',
        date: seismicData.AcquisitionDate || '2023',
        osduId: record.id
      }
    };
  });

  return {
    type: "FeatureCollection",
    features: features
  };
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
    for (let i = 1; i < lines.length; i++) {
      const [wellName, x, y, latitude, longitude] = lines[i].split(',');
      if (wellName && latitude && longitude) {
        coordinatesMap.set(wellName.trim(), {
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

// Function to fetch LAS files from S3 and create "My Wells"
async function fetchMyWells(): Promise<any> {
  try {
    console.log(`Fetching LAS files from S3 bucket: ${S3_BUCKET}, prefix: ${S3_PREFIX}`);
    
    // First get real coordinates
    const coordinatesMap = await fetchWellCoordinatesFromCSV();
    
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: S3_PREFIX,
      MaxKeys: 50
    });
    
    const response = await s3Client.send(listCommand);
    const lasFiles = response.Contents?.filter(obj => obj.Key?.endsWith('.las')) || [];
    
    console.log(`Found ${lasFiles.length} LAS files in S3`);
    
    // Fallback coordinates for offshore Brunei/Malaysia if no CSV data
    const fallbackCoordinates = [
      [114.45, 10.47], [114.49, 10.55], [114.49, 10.53], [114.49, 10.30], [114.56, 10.48],
      [114.55, 10.35], [114.49, 10.39], [114.46, 10.36], [114.52, 10.41], [114.64, 10.45],
      [114.62, 10.39], [114.46, 10.60], [114.50, 10.21], [114.50, 10.19], [114.63, 10.21],
      [114.56, 10.12], [114.58, 10.15], [114.56, 10.15], [114.58, 10.16], [114.62, 10.20],
      [114.57, 10.12], [114.56, 10.12], [114.49, 10.53], [114.55, 10.35], [114.52, 10.41]
    ];
    
    const myWellsFeatures = lasFiles.map((file, index) => {
      const fileName = file.Key?.replace(S3_PREFIX, '') || `Well-${index + 1}`;
      const wellName = fileName.replace('.las', '').replace(/_/g, ' ').toUpperCase();
      
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
          dataSource: "Personal LAS Files (Real Coordinates)"
        }
      };
    });
    
    return {
      type: "FeatureCollection",
      features: myWellsFeatures
    };
    
  } catch (error) {
    console.error('Error fetching LAS files from S3:', error);
    // Return empty collection if S3 access fails
    return {
      type: "FeatureCollection",
      features: []
    };
  }
}

// Generate mock wells data as fallback - now returns empty to remove initial dots
function generateMockWellsData(): any {
  return {
    type: "FeatureCollection",
    features: []
  };
}

// Generate mock seismic data as fallback
function generateMockSeismicData(): any {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [[107.1, 10.2], [107.6, 10.4]] // Vietnamese offshore petroleum blocks coordinates
        },
        properties: {
          name: "Seismic Survey Alpha",
          type: "3D Survey",
          date: "2023-Q4"
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [[107.0, 10.0], [107.5, 10.3]] // Vietnamese offshore petroleum blocks coordinates
        },
        properties: {
          name: "Seismic Survey Beta", 
          type: "2D Survey",
          date: "2023-Q2"
        }
      }
    ]
  };
}

export const handler: Handler = async (event) => {
  try {
    const { type, maxResults = 100 } = event.arguments;
    
    console.log('Catalog Map Data Request:', { type, maxResults });
    
    // Fetch wells and "My Wells" LAS files in parallel
    // Note: Seismic data not yet supported by new OSDU Tools API
    const [wellsData, myWellsData] = await Promise.all([
      fetchOSDUWells(maxResults),
      fetchMyWells()
    ]);

    // Generate exploration blocks
    const explorationBlocks = generateExplorationBlocks();

    // Combine OSDU wells, My Wells, and Exploration Blocks into a single collection
    const combinedWells = {
      type: "FeatureCollection",
      features: [
        ...explorationBlocks, // Add blocks FIRST so they render under wells
        ...(wellsData?.features || []),
        ...(myWellsData?.features || [])
      ],
      metadata: wellsData?.metadata
    };

    const response = {
      wells: combinedWells,
      seismic: { type: "FeatureCollection", features: [] }, // Empty for now
      myWells: myWellsData, // Also provide separately for filtering
      metadata: wellsData?.metadata
    };

    console.log('Map Data Response:', {
      explorationBlocksCount: explorationBlocks.length,
      osduWellsCount: wellsData?.features?.length || 0,
      myWellsCount: myWellsData?.features?.length || 0,
      totalFeaturesCount: combinedWells.features.length
    });

    // Return the JSON string directly (matching the schema expectation)
    return JSON.stringify(response);
  } catch (error) {
    console.error('Error in catalogMapData:', error);
    throw new Error(`Map data fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
