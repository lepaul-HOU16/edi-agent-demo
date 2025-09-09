import { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  try {
    const { type } = event.arguments;
    
    // For now, return mock data structure that matches what the catalog expects
    // In production, this would call the actual map service or database
    const mockWellsData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [108.5, 14.2]
          },
          properties: {
            name: "Well A-1",
            depth: "3500m",
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
            name: "Well B-2",
            depth: "4200m", 
            status: "Inactive"
          }
        }
      ]
    };

    const mockSeismicData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [[108.2, 14.0], [108.6, 14.3]]
          },
          properties: {
            name: "Seismic Line 1",
            survey: "2023-Survey"
          }
        }
      ]
    };

    const response = {
      wells: mockWellsData,
      seismic: mockSeismicData
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error in catalogMapData:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
