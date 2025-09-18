import { Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// AWS S3 Configuration
const S3_BUCKET = process.env.STORAGE_BUCKET_NAME || 'amplify-digitalassistant--workshopstoragebucketd9b-1kur1xycq1xq';
const S3_PREFIX = 'global/well-data/';
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// OSDU Search API Configuration
const OSDU_BASE_URL = process.env.OSDU_BASE_URL || 'https://community.opensubsurface.org';
const OSDU_API_VERSION = 'v2';
const OSDU_PARTITION_ID = process.env.OSDU_PARTITION_ID || 'opendes';

interface OSDUSearchRequest {
  kind: string;
  query?: string;
  limit?: number;
  offset?: number;
  returnedFields?: string[];
}

// Function to fetch well data from OSDU
async function fetchOSDUWells(): Promise<any> {
  try {
    const searchParams: OSDUSearchRequest = {
      kind: 'osdu:wks:master-data--Wellbore:*',
      limit: 50,
      returnedFields: ['data.WellboreID', 'data.FacilityName', 'data.FacilityState', 'data.GeoLocation', 'data.VerticalMeasurement', 'data.WellType']
    };

    console.log('Fetching wells from OSDU:', JSON.stringify(searchParams, null, 2));

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
      console.warn(`OSDU API returned ${response.status}: ${response.statusText}`);
      return generateMockWellsData();
    }

    const osduResults = await response.json();
    console.log('OSDU Wells Results:', JSON.stringify(osduResults, null, 2));

    // Transform OSDU results to GeoJSON
    return transformWellsToGeoJSON(osduResults.results || []);

  } catch (error) {
    console.error('Error fetching wells from OSDU:', error);
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

// Transform OSDU well records to GeoJSON format
function transformWellsToGeoJSON(osduRecords: any[]): any {
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
        status: 'Active'
      }
    };
  });

  return {
    type: "FeatureCollection",
    features: features
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

// Function to fetch LAS files from S3 and create "My Wells"
async function fetchMyWells(): Promise<any> {
  try {
    console.log(`Fetching LAS files from S3 bucket: ${S3_BUCKET}, prefix: ${S3_PREFIX}`);
    
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: S3_PREFIX,
      MaxKeys: 50
    });
    
    const response = await s3Client.send(listCommand);
    const lasFiles = response.Contents?.filter(obj => obj.Key?.endsWith('.las')) || [];
    
    console.log(`Found ${lasFiles.length} LAS files in S3`);
    
    // Generate coordinates in Vietnamese territorial waters - closer to Vietnam coast
    const vietnameseOffshorePetroleum = [
      [106.8, 10.1], [106.9, 10.3], [107.0, 10.2], [106.7, 10.4], [106.8, 10.0],
      [106.9, 10.1], [107.1, 10.3], [106.8, 10.2], [106.7, 10.1], [106.9, 10.4],
      [107.0, 10.0], [106.8, 10.3], [106.7, 10.2], [106.9, 10.0], [107.1, 10.1],
      [106.8, 10.4], [106.7, 10.3], [106.9, 10.2], [107.0, 10.1], [106.8, 10.1],
      [106.7, 10.0], [106.9, 10.3], [107.1, 10.2], [106.8, 10.3]
    ];
    
    const myWellsFeatures = lasFiles.map((file, index) => {
      const fileName = file.Key?.replace(S3_PREFIX, '') || `Well-${index + 1}`;
      const wellName = fileName.replace('.las', '').replace(/_/g, ' ');
      const coordinates = vietnameseOffshorePetroleum[index] || [107.2 + (index * 0.02), 10.2 + (index * 0.02)];
      
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
          location: "Bach Ho Field Area",
          operator: "My Company",
          category: "personal",
          fileName: fileName,
          fileSize: `${fileSizeMB.toFixed(2)} MB`,
          s3Key: file.Key,
          lastModified: file.LastModified?.toISOString() || new Date().toISOString(),
          dataSource: "Personal LAS Files"
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
    const { type } = event.arguments;
    
    console.log('Catalog Map Data Request:', { type });
    
    // Fetch wells, seismic data, and "My Wells" LAS files in parallel
    const [wellsData, seismicData, myWellsData] = await Promise.all([
      fetchOSDUWells(),
      fetchOSDUSeismic(),
      fetchMyWells()
    ]);

    // Combine OSDU wells and My Wells into a single collection
    const combinedWells = {
      type: "FeatureCollection",
      features: [
        ...(wellsData?.features || []),
        ...(myWellsData?.features || [])
      ]
    };

    const response = {
      wells: combinedWells,
      seismic: seismicData,
      myWells: myWellsData // Also provide separately for filtering
    };

    console.log('Map Data Response:', {
      osduWellsCount: wellsData?.features?.length || 0,
      myWellsCount: myWellsData?.features?.length || 0,
      totalWellsCount: combinedWells.features.length,
      seismicCount: seismicData?.features?.length || 0
    });

    // Return the JSON string directly (matching the schema expectation)
    return JSON.stringify(response);
  } catch (error) {
    console.error('Error in catalogMapData:', error);
    throw new Error(`Map data fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
