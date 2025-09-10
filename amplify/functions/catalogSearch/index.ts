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
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [108.6, 14.25]
          },
          properties: {
            name: `Well-008`,
            depth: "4200m",
            status: "Production", 
            matchScore: 0.88
          }
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [108.2, 13.95]
          },
          properties: {
            name: `Well-GR-DTC-RHOB-001`,
            depth: "3600m",
            status: "Active",
            logs: ["GR", "DTC", "RHOB"],
            matchScore: 0.92
          }
        }
      ]
    };

    // Return the JSON string directly (not wrapped in HTTP response)
    return JSON.stringify(mockSearchResults);
  } catch (error) {
    console.error('Error in catalogSearch:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
