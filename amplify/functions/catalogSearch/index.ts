import { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  try {
    const { prompt } = event.arguments;
    
    // For now, return mock search results based on the prompt
    // In production, this would integrate with actual search services
    const mockSearchResults = {
      type: "FeatureCollection",
      metadata: {
        type: "wells",
        searchQuery: prompt
      },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [108.4, 14.15]
          },
          properties: {
            name: `Search Result Well - ${prompt.substring(0, 10)}`,
            depth: "3800m",
            status: "Active",
            matchScore: 0.95
          }
        }
      ]
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        geojson: mockSearchResults
      })
    };
  } catch (error) {
    console.error('Error in catalogSearch:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
