"""
Weather Tool Lambda - Example Implementation

Demonstrates:
- External API integration
- Error handling
- Response formatting
- Environment variable usage
"""

import json
import os
import requests
from typing import Dict, Any, List
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for weather tool
    
    Args:
        event: Lambda event containing location and units
        context: Lambda context
        
    Returns:
        Weather data response
    """
    try:
        # Parse input
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        location = body.get('location')
        units = body.get('units', 'imperial')
        
        if not location:
            return error_response('Location is required', 400)
        
        # Get API key from environment
        api_key = os.environ.get('WEATHER_API_KEY')
        if not api_key:
            # For demo purposes, return mock data
            return success_response(get_mock_weather_data(location))
        
        # Fetch real weather data
        weather_data = fetch_weather_data(location, units, api_key)
        
        return success_response(weather_data)
        
    except Exception as e:
        print(f"Error in weather tool: {str(e)}")
        return error_response(str(e), 500)


def fetch_weather_data(location: str, units: str, api_key: str) -> Dict[str, Any]:
    """
    Fetch weather data from OpenWeatherMap API
    
    Args:
        location: City name or coordinates
        units: Temperature units (imperial/metric)
        api_key: OpenWeatherMap API key
        
    Returns:
        Weather data dictionary
    """
    # Current weather
    current_url = f"https://api.openweathermap.org/data/2.5/weather"
    current_params = {
        'q': location,
        'appid': api_key,
        'units': units
    }
    
    current_response = requests.get(current_url, params=current_params)
    current_response.raise_for_status()
    current_data = current_response.json()
    
    # Forecast
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast"
    forecast_params = {
        'q': location,
        'appid': api_key,
        'units': units,
        'cnt': 5  # 5 days
    }
    
    forecast_response = requests.get(forecast_url, params=forecast_params)
    forecast_response.raise_for_status()
    forecast_data = forecast_response.json()
    
    # Format response
    return {
        'location': location,
        'temperature': round(current_data['main']['temp']),
        'feelsLike': round(current_data['main']['feels_like']),
        'conditions': current_data['weather'][0]['description'].title(),
        'icon': current_data['weather'][0]['icon'],
        'humidity': current_data['main']['humidity'],
        'windSpeed': round(current_data['wind']['speed']),
        'windDirection': degrees_to_direction(current_data['wind']['deg']),
        'pressure': round(current_data['main']['pressure'] * 0.02953, 2),  # Convert to inHg
        'forecast': format_forecast(forecast_data['list'], units)
    }


def get_mock_weather_data(location: str) -> Dict[str, Any]:
    """
    Return mock weather data for demo purposes
    
    Args:
        location: City name
        
    Returns:
        Mock weather data
    """
    return {
        'location': location,
        'temperature': 72,
        'feelsLike': 70,
        'conditions': 'Partly Cloudy',
        'icon': '02d',
        'humidity': 65,
        'windSpeed': 8,
        'windDirection': 'NW',
        'pressure': 30.12,
        'forecast': [
            {
                'date': (datetime.now() + timedelta(days=i)).strftime('%A'),
                'high': 75 + i,
                'low': 55 + i,
                'conditions': 'Sunny' if i % 2 == 0 else 'Cloudy'
            }
            for i in range(5)
        ]
    }


def format_forecast(forecast_list: List[Dict], units: str) -> List[Dict[str, Any]]:
    """
    Format forecast data
    
    Args:
        forecast_list: Raw forecast data from API
        units: Temperature units
        
    Returns:
        Formatted forecast list
    """
    daily_forecasts = {}
    
    for item in forecast_list:
        date = datetime.fromtimestamp(item['dt']).strftime('%A')
        temp = round(item['main']['temp'])
        
        if date not in daily_forecasts:
            daily_forecasts[date] = {
                'date': date,
                'high': temp,
                'low': temp,
                'conditions': item['weather'][0]['description'].title()
            }
        else:
            daily_forecasts[date]['high'] = max(daily_forecasts[date]['high'], temp)
            daily_forecasts[date]['low'] = min(daily_forecasts[date]['low'], temp)
    
    return list(daily_forecasts.values())[:5]


def degrees_to_direction(degrees: float) -> str:
    """
    Convert wind degrees to cardinal direction
    
    Args:
        degrees: Wind direction in degrees
        
    Returns:
        Cardinal direction (N, NE, E, etc.)
    """
    directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    index = round(degrees / 45) % 8
    return directions[index]


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format success response
    
    Args:
        data: Response data
        
    Returns:
        Lambda response dictionary
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data)
    }


def error_response(message: str, status_code: int = 500) -> Dict[str, Any]:
    """
    Format error response
    
    Args:
        message: Error message
        status_code: HTTP status code
        
    Returns:
        Lambda error response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': message
        })
    }


# Example event for testing:
# {
#     "location": "Seattle",
#     "units": "imperial"
# }
