import { Handler } from 'aws-lambda';

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
    
    // Fetch both wells and seismic data from OSDU (or fallback to mock data)
    const [wellsData, seismicData] = await Promise.all([
      fetchOSDUWells(),
      fetchOSDUSeismic()
    ]);

    const response = {
      wells: wellsData,
      seismic: seismicData
    };

    console.log('Map Data Response:', {
      wellsCount: wellsData?.features?.length || 0,
      seismicCount: seismicData?.features?.length || 0
    });

    // Return the JSON string directly (matching the schema expectation)
    return JSON.stringify(response);
  } catch (error) {
    console.error('Error in catalogMapData:', error);
    throw new Error(`Map data fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
