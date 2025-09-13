import { Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

// OSDU Search API Configuration
const OSDU_BASE_URL = process.env.OSDU_BASE_URL || 'https://community.opensubsurface.org';
const OSDU_API_VERSION = 'v2';
const OSDU_PARTITION_ID = process.env.OSDU_PARTITION_ID || 'opendes';

// S3 Configuration
function getS3Client() {
  return new S3Client();
}

function getBucketName() {
  try {
    const outputs = require('@/../amplify_outputs.json');
    const bucketName = outputs.storage.bucket_name;
    
    if (!bucketName) {
      throw new Error("bucket_name not found in amplify_outputs.json");
    }
    
    return bucketName;
  } catch (error) {
    console.error("Error loading bucket name from amplify_outputs.json:", error);
    const envBucketName = process.env.STORAGE_BUCKET_NAME;
    if (!envBucketName) {
      throw new Error("STORAGE_BUCKET_NAME is not set and amplify_outputs.json is not accessible");
    }
    return envBucketName;
  }
}

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
      [108.3 + (index * 0.1), 14.1 + (index * 0.1)]; // Fallback coordinates
    
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
    const baseCoords = [108.2 + (index * 0.2), 14.0 + (index * 0.2)];
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

// Generate mock wells data as fallback
function generateMockWellsData(): any {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [108.5, 14.2]
        },
        properties: {
          name: "Well Alpha",
          type: "Production",
          depth: "3500m",
          location: "Block A-123",
          status: "Active"
        }
      },
      {
        type: "Feature", 
        geometry: {
          type: "Point",
          coordinates: [108.3, 14.1]
        },
        properties: {
          name: "Well Beta",
          type: "Exploration",
          depth: "4200m",
          location: "Block B-456", 
          status: "Active"
        }
      },
      {
        type: "Feature", 
        geometry: {
          type: "Point",
          coordinates: [108.7, 14.35]
        },
        properties: {
          name: "Well Gamma",
          type: "Injection",
          depth: "2800m",
          location: "Block C-789", 
          status: "Active"
        }
      }
    ]
  };
}

// Function to fetch and parse .las files from S3
async function fetchCustomWellsFromS3(): Promise<any> {
  try {
    const s3Client = getS3Client();
    const bucketName = getBucketName();
    
    console.log('Fetching custom wells from S3 global/well-data directory...');
    
    // List .las files in global/well-data/
    const listParams = {
      Bucket: bucketName,
      Prefix: 'global/well-data/',
      MaxKeys: 50
    };
    
    const listCommand = new ListObjectsV2Command(listParams);
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No files found in global/well-data directory');
      return {
        type: "FeatureCollection",
        features: []
      };
    }
    
    // Filter for .las files
    const lasFiles = listResponse.Contents.filter(obj => 
      obj.Key && obj.Key.toLowerCase().endsWith('.las')
    );
    
    console.log(`Found ${lasFiles.length} .las files in global/well-data`);
    
    const customWellFeatures = [];
    
    // Process each .las file to extract well information
    for (const file of lasFiles.slice(0, 24)) { // Limit to 24 files as mentioned
      if (!file.Key) continue; // Skip if Key is undefined
      
      try {
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.Key
        });
        
        const response = await s3Client.send(getCommand);
        
        if (response.Body) {
          // Convert stream to string
          const chunks: Buffer[] = [];
          for await (const chunk of response.Body as any) {
            chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
          }
          const content = Buffer.concat(chunks).toString('utf8');
          
          // Parse .las file for well information
          const wellInfo = parseLasFile(content, file.Key);
          
          if (wellInfo) {
            customWellFeatures.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [wellInfo.longitude, wellInfo.latitude]
              },
              properties: {
                name: wellInfo.wellName,
                type: "Custom Ingest",
                depth: wellInfo.depth,
                location: wellInfo.location || "Global Well Data",
                status: "Active",
                operator: wellInfo.operator || "Custom Operator",
                source: "Custom Ingest",
                color: "blue", // Blue color for custom wells
                s3Key: file.Key
              }
            });
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.Key}:`, fileError);
        // Continue processing other files
      }
    }
    
    console.log(`Successfully processed ${customWellFeatures.length} custom wells`);
    
    return {
      type: "FeatureCollection",
      features: customWellFeatures
    };
    
  } catch (error) {
    console.error('Error fetching custom wells from S3:', error);
    return {
      type: "FeatureCollection", 
      features: []
    };
  }
}

// Function to parse .las file and extract well information
function parseLasFile(content: string, fileName: string): any {
  try {
    const lines = content.split('\n');
    let wellName = '';
    let longitude = 0;
    let latitude = 0;
    let depth = '';
    let location = '';
    let operator = '';
    
    // Extract well name from filename if not found in file
    const fileNameMatch = fileName.match(/([^/]+)\.las$/);
    wellName = fileNameMatch ? fileNameMatch[1].replace(/_/g, ' ') : 'Unknown Well';
    
    // Parse .las file sections
    let inWellSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for section headers
      if (trimmedLine.startsWith('~W') || trimmedLine.includes('WELL INFORMATION')) {
        inWellSection = true;
        continue;
      }
      
      if (trimmedLine.startsWith('~') && !trimmedLine.startsWith('~W')) {
        inWellSection = false;
        continue;
      }
      
      if (inWellSection || !wellName) {
        // Extract well name
        if (trimmedLine.includes('WELL') || trimmedLine.includes('UWI') || trimmedLine.includes('API')) {
          const wellMatch = trimmedLine.match(/:\s*([^:]+?)(?:\s|$)/);
          if (wellMatch && wellMatch[1] && !wellName) {
            wellName = wellMatch[1].trim();
          }
        }
        
        // Extract coordinates (look for various formats)
        if (trimmedLine.includes('LON') || trimmedLine.includes('LONG') || trimmedLine.includes('X')) {
          const lonMatch = trimmedLine.match(/:?\s*([-+]?\d*\.?\d+)/);
          if (lonMatch && lonMatch[1]) {
            const lonValue = parseFloat(lonMatch[1]);
            if (lonValue >= -180 && lonValue <= 180) {
              longitude = lonValue;
            }
          }
        }
        
        if (trimmedLine.includes('LAT') || trimmedLine.includes('Y')) {
          const latMatch = trimmedLine.match(/:?\s*([-+]?\d*\.?\d+)/);
          if (latMatch && latMatch[1]) {
            const latValue = parseFloat(latMatch[1]);
            if (latValue >= -90 && latValue <= 90) {
              latitude = latValue;
            }
          }
        }
        
        // Extract total depth
        if (trimmedLine.includes('TD') || trimmedLine.includes('TOTAL') || trimmedLine.includes('DEPTH')) {
          const depthMatch = trimmedLine.match(/:?\s*(\d+\.?\d*)/);
          if (depthMatch && depthMatch[1]) {
            depth = `${depthMatch[1]}m`;
          }
        }
        
        // Extract location/field
        if (trimmedLine.includes('FIELD') || trimmedLine.includes('LOCATION')) {
          const locMatch = trimmedLine.match(/:\s*([^:]+?)(?:\s|$)/);
          if (locMatch && locMatch[1]) {
            location = locMatch[1].trim();
          }
        }
        
        // Extract operator/company
        if (trimmedLine.includes('COMP') || trimmedLine.includes('OPERATOR')) {
          const opMatch = trimmedLine.match(/:\s*([^:]+?)(?:\s|$)/);
          if (opMatch && opMatch[1]) {
            operator = opMatch[1].trim();
          }
        }
      }
    }
    
    // If no coordinates found, generate random ones in South China Sea area
    if (!longitude || !latitude) {
      const index = Math.floor(Math.random() * 100);
      longitude = 108.2 + (index * 0.01); // South China Sea longitude range
      latitude = 14.0 + (index * 0.01);   // South China Sea latitude range
    }
    
    return {
      wellName: wellName || 'Unknown Well',
      longitude,
      latitude,
      depth: depth || 'Unknown',
      location: location || 'Global Well Data',
      operator: operator || 'Custom Operator'
    };
    
  } catch (error) {
    console.error('Error parsing .las file:', error);
    return null;
  }
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
          coordinates: [[108.2, 14.0], [108.6, 14.3]]
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
          coordinates: [[108.1, 13.9], [108.5, 14.2]]
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
    
    // Fetch wells, seismic data from OSDU, and custom wells from S3
    const [wellsData, seismicData, customWellsData] = await Promise.all([
      fetchOSDUWells(),
      fetchOSDUSeismic(),
      fetchCustomWellsFromS3()
    ]);

    // Merge OSDU wells with custom wells
    const combinedWells = {
      type: "FeatureCollection",
      features: [
        ...wellsData.features,
        ...customWellsData.features
      ]
    };

    const response = {
      wells: combinedWells,
      seismic: seismicData
    };

    console.log('Map Data Response:', {
      osduWellsCount: wellsData?.features?.length || 0,
      customWellsCount: customWellsData?.features?.length || 0,
      totalWellsCount: combinedWells?.features?.length || 0,
      seismicCount: seismicData?.features?.length || 0
    });

    // Return the JSON string directly (matching the schema expectation)
    return JSON.stringify(response);
  } catch (error) {
    console.error('Error in catalogMapData:', error);
    throw new Error(`Map data fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
