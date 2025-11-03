/**
 * Renewable Energy Tools
 * 
 * Lambda function providing renewable energy analysis tools:
 * - Wind data retrieval from NREL API
 * - Wind farm site analysis
 * - Energy production calculations
 */

import { Handler } from 'aws-lambda';

interface WindDataRequest {
  latitude: number;
  longitude: number;
  year?: number;
}

interface WindDataResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Fetch wind data from NREL API
 */
async function getWindConditions(params: WindDataRequest): Promise<any> {
  const { latitude, longitude, year } = params;
  
  console.log(`Fetching wind data for lat=${latitude}, lon=${longitude}, year=${year || 'latest'}`);
  
  try {
    // NREL Wind Toolkit API
    const apiUrl = 'https://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-download.json';
    
    // Note: In production, use API key from environment variable
    const apiKey = process.env.NREL_API_KEY || 'DEMO_KEY';
    
    const params = new URLSearchParams({
      api_key: apiKey,
      lat: latitude.toString(),
      lon: longitude.toString(),
      year: (year || 2019).toString(),
      attributes: 'windspeed_100m,winddirection_100m,temperature_100m,pressure_100m',
      interval: '60', // hourly data
    });
    
    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`NREL API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process and summarize the data
    const summary = processWindData(data);
    
    return {
      location: { latitude, longitude },
      year: year || 2019,
      summary,
      rawData: data,
    };
    
  } catch (error) {
    console.error('Error fetching wind data:', error);
    throw error;
  }
}

/**
 * Process wind data and calculate statistics
 */
function processWindData(data: any): any {
  // Calculate basic statistics from wind data
  const windSpeeds = data.windspeed_100m || [];
  
  if (windSpeeds.length === 0) {
    return {
      meanWindSpeed: 0,
      maxWindSpeed: 0,
      minWindSpeed: 0,
      totalHours: 0,
    };
  }
  
  const sum = windSpeeds.reduce((a: number, b: number) => a + b, 0);
  const mean = sum / windSpeeds.length;
  const max = Math.max(...windSpeeds);
  const min = Math.min(...windSpeeds);
  
  return {
    meanWindSpeed: mean.toFixed(2),
    maxWindSpeed: max.toFixed(2),
    minWindSpeed: min.toFixed(2),
    totalHours: windSpeeds.length,
    dataQuality: 'good',
  };
}

/**
 * Calculate wind farm energy production
 */
async function calculateEnergyProduction(params: {
  latitude: number;
  longitude: number;
  turbineCount: number;
  turbineCapacity: number; // MW
}): Promise<any> {
  const { latitude, longitude, turbineCount, turbineCapacity } = params;
  
  console.log(`Calculating energy production for ${turbineCount} turbines at ${latitude}, ${longitude}`);
  
  try {
    // Get wind data
    const windData = await getWindConditions({ latitude, longitude });
    
    // Simple capacity factor calculation (in production, use more sophisticated model)
    const meanWindSpeed = parseFloat(windData.summary.meanWindSpeed);
    const capacityFactor = calculateCapacityFactor(meanWindSpeed);
    
    // Calculate annual energy production
    const totalCapacity = turbineCount * turbineCapacity; // MW
    const hoursPerYear = 8760;
    const annualProduction = totalCapacity * capacityFactor * hoursPerYear; // MWh
    
    return {
      location: { latitude, longitude },
      windFarm: {
        turbineCount,
        turbineCapacity,
        totalCapacity,
      },
      windConditions: {
        meanWindSpeed: windData.summary.meanWindSpeed,
        capacityFactor: (capacityFactor * 100).toFixed(1) + '%',
      },
      energyProduction: {
        annualMWh: annualProduction.toFixed(0),
        annualGWh: (annualProduction / 1000).toFixed(2),
        monthlyAverageMWh: (annualProduction / 12).toFixed(0),
      },
    };
    
  } catch (error) {
    console.error('Error calculating energy production:', error);
    throw error;
  }
}

/**
 * Calculate capacity factor based on wind speed
 * Simplified model - in production use power curve
 */
function calculateCapacityFactor(windSpeed: number): number {
  // Typical capacity factors by wind speed
  if (windSpeed < 4) return 0.15;
  if (windSpeed < 5) return 0.20;
  if (windSpeed < 6) return 0.25;
  if (windSpeed < 7) return 0.30;
  if (windSpeed < 8) return 0.35;
  if (windSpeed < 9) return 0.40;
  return 0.45;
}

/**
 * Lambda handler
 */
export const handler: Handler = async (event) => {
  console.log('Renewable Tools Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    const { action, params } = event;
    
    let result;
    
    switch (action) {
      case 'getWindConditions':
        result = await getWindConditions(params);
        break;
        
      case 'calculateEnergyProduction':
        result = await calculateEnergyProduction(params);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result,
      }),
    };
    
  } catch (error: any) {
    console.error('Error in renewable tools:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
    };
  }
};
