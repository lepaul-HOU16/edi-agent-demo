import { BaseEnhancedAgent } from '../../cdk/lambda-functions/chat/agents/BaseEnhancedAgent';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

interface WeatherAgentResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: any[];
}

/**
 * Weather Agent - Example implementation
 * 
 * Demonstrates:
 * - Simple agent pattern
 * - Tool Lambda invocation
 * - Thought step generation
 * - Artifact creation
 */
export class WeatherAgent extends BaseEnhancedAgent {
  private lambdaClient: LambdaClient;

  constructor() {
    super(true); // Enable verbose logging
    this.lambdaClient = new LambdaClient({});
  }

  /**
   * Process weather-related queries
   */
  async processMessage(message: string): Promise<WeatherAgentResponse> {
    const thoughtSteps = [];

    try {
      // Step 1: Parse location from query
      thoughtSteps.push(this.createThoughtStep(
        'intent_detection',
        'Analyzing Weather Request',
        'Extracting location information from user query'
      ));

      const location = this.extractLocation(message);
      
      if (!location) {
        return {
          success: false,
          message: 'Could not determine location. Please specify a city or coordinates.',
          thoughtSteps,
        };
      }

      thoughtSteps[0].status = 'complete';
      thoughtSteps[0].summary = `Location identified: ${location}`;

      // Step 2: Fetch weather data
      thoughtSteps.push(this.createThoughtStep(
        'execution',
        'Fetching Weather Data',
        `Retrieving current weather conditions for ${location}`
      ));

      const weatherData = await this.invokeWeatherTool(location);

      thoughtSteps[1].status = 'complete';
      thoughtSteps[1].summary = `Weather data retrieved: ${weatherData.temperature}°F, ${weatherData.conditions}`;

      // Step 3: Generate response
      thoughtSteps.push(this.createThoughtStep(
        'completion',
        'Generating Response',
        'Formatting weather information for display'
      ));

      const response = this.formatWeatherResponse(location, weatherData);
      const artifacts = this.createWeatherArtifacts(location, weatherData);

      thoughtSteps[2].status = 'complete';

      return {
        success: true,
        message: response,
        artifacts,
        thoughtSteps,
      };

    } catch (error: any) {
      console.error('Weather agent error:', error);
      
      return {
        success: false,
        message: `Failed to fetch weather data: ${error.message}`,
        thoughtSteps,
      };
    }
  }

  /**
   * Extract location from user query
   */
  private extractLocation(message: string): string | null {
    // Simple pattern matching - enhance with NLP in production
    const patterns = [
      /weather in ([A-Za-z\s]+)/i,
      /weather for ([A-Za-z\s]+)/i,
      /weather at ([A-Za-z\s]+)/i,
      /([A-Za-z\s]+) weather/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Invoke weather tool Lambda
   */
  private async invokeWeatherTool(location: string): Promise<any> {
    const command = new InvokeCommand({
      FunctionName: process.env.WEATHER_TOOL_FUNCTION_NAME,
      Payload: JSON.stringify({
        location,
        units: 'imperial',
      }),
    });

    const response = await this.lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode !== 200) {
      throw new Error('Weather tool invocation failed');
    }

    return JSON.parse(result.body);
  }

  /**
   * Format weather response message
   */
  private formatWeatherResponse(location: string, data: any): string {
    return `
## Weather Report for ${location}

**Current Conditions:**
- Temperature: ${data.temperature}°F (feels like ${data.feelsLike}°F)
- Conditions: ${data.conditions}
- Humidity: ${data.humidity}%
- Wind: ${data.windSpeed} mph ${data.windDirection}
- Pressure: ${data.pressure} inHg

**Forecast:**
${data.forecast.map((day: any) => 
  `- ${day.date}: ${day.high}°F / ${day.low}°F - ${day.conditions}`
).join('\n')}

*Data provided by OpenWeatherMap API*
    `.trim();
  }

  /**
   * Create weather artifacts for visualization
   */
  private createWeatherArtifacts(location: string, data: any): any[] {
    return [
      {
        type: 'weather_current',
        data: {
          messageContentType: 'weather_current',
          location,
          temperature: data.temperature,
          conditions: data.conditions,
          icon: data.icon,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
        },
      },
      {
        type: 'weather_forecast',
        data: {
          messageContentType: 'weather_forecast',
          location,
          forecast: data.forecast,
        },
      },
    ];
  }

  /**
   * Create thought step helper
   */
  private createThoughtStep(
    type: string,
    title: string,
    summary: string
  ): any {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      title,
      summary,
      status: 'in_progress',
    };
  }
}

/**
 * Intent detection patterns for weather queries
 */
export const weatherPatterns = [
  /weather/i,
  /temperature/i,
  /forecast/i,
  /rain/i,
  /snow/i,
  /sunny/i,
  /cloudy/i,
  /conditions/i,
];

/**
 * Example usage:
 * 
 * const agent = new WeatherAgent();
 * const result = await agent.processMessage("What's the weather in Seattle?");
 * console.log(result.message);
 */
