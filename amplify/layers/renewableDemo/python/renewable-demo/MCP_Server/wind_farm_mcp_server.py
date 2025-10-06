import json
import requests
import boto3
import os
import numpy as np
import pandas as pd
from io import StringIO
from scipy import stats
from typing import Dict, Optional

# Configure logging
import logging

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)
logger = logging.getLogger('wind_farm_mcp_server')

# Suppress specific loggers
logging.getLogger('botocore').setLevel(logging.ERROR)

def get_nrel_api_key():
    """Get NREL API key from AWS Secrets Manager or environment variable"""
    # First try to get from environment variable
    import os
    api_key = os.environ.get('NREL_API_KEY')
    if api_key:
        return api_key
        
    # Then try AWS Secrets Manager
    try:
        client = boto3.client('secretsmanager', region_name='us-west-2')
        response = client.get_secret_value(SecretId='nrel/api_key')
        return json.loads(response['SecretString'])['api_key']
    except Exception as e:
        logger.info(f"Warning: Could not get API key from Secrets Manager: {e}")
        logger.info("Please set NREL_API_KEY environment variable or get a free key from https://developer.nrel.gov/signup/")
        
        # For development/testing, use a demo key
        logger.info("Using demo key for development purposes. For production use, please get your own API key.")
        return "DEMO_KEY"

def fetch_wind_data(latitude, longitude, year=2023):
    """Fetch wind data from NREL API"""
    api_key = get_nrel_api_key()
    
    nrel_api_url = (f'http://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv?'
        f'api_key={api_key}&'
        f'wkt=POINT({longitude} {latitude})&'
        f'attributes=windspeed_100m,winddirection_100m&'
        f'years={year}&'
        f'email=alonso.decosio@gmail.com')
    
    headers = {
        'content-type': "application/x-www-form-urlencoded",
        'cache-control': "no-cache"
    }
    
    response = requests.post(nrel_api_url, headers=headers, timeout=120)
    
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Unable to fetch wind data (Status: {response.status_code})")

def process_wind_data(wind_data_csv):
    """Process raw CSV wind data from NREL API into wind conditions for PyWake"""
    # Parse CSV using pandas
    df = pd.read_csv(StringIO(wind_data_csv), skiprows=1)
    
    # Extract wind speed and direction data
    wind_speeds = pd.to_numeric(df.iloc[:, 5], errors='coerce').values  # Wind Speed at 100m
    wind_directions = pd.to_numeric(df.iloc[:, 6], errors='coerce').values  # Wind Direction at 100m
    
    # Filter out invalid data
    valid_mask = (wind_speeds > 0) & (~np.isnan(wind_speeds)) & (~np.isnan(wind_directions))
    wind_speeds = wind_speeds[valid_mask]
    wind_directions = wind_directions[valid_mask]
    
    # Calculate wind direction sectors (12 sectors of 30 degrees)
    wd_bins = np.arange(0, 361, 30)
    n_sectors = len(wd_bins) - 1
    
    # Calculate frequency distribution for each sector
    p_wd = np.zeros(n_sectors)
    a_weibull = np.zeros(n_sectors)  # Weibull scale parameter
    k_weibull = np.zeros(n_sectors)  # Weibull shape parameter
    
    for i in range(n_sectors):
        # Find wind speeds in this direction sector
        mask = ((wind_directions >= wd_bins[i]) & (wind_directions < wd_bins[i+1]))
        sector_speeds = wind_speeds[mask]
        
        if len(sector_speeds) > 10:  # Need sufficient data for Weibull fit
            p_wd[i] = len(sector_speeds) / len(wind_speeds)
            
            # Fit Weibull distribution to sector wind speeds
            try:
                k, loc, a = stats.weibull_min.fit(sector_speeds, floc=0)
                k_weibull[i] = k
                a_weibull[i] = a
            except:
                # Fallback to overall statistics if fit fails
                k_weibull[i] = 2.0
                a_weibull[i] = np.mean(sector_speeds)
        else:
            # Use overall statistics for sectors with little data
            p_wd[i] = 1.0 / n_sectors  # Equal probability
            k_weibull[i] = 2.0
            a_weibull[i] = np.mean(wind_speeds)
    
    # Normalize probabilities
    p_wd = p_wd / np.sum(p_wd)
    
    # Calculate prevailing wind direction (sector with highest probability)
    prevailing_sector_idx = np.argmax(p_wd)
    prevailing_wind_direction = int(wd_bins[prevailing_sector_idx])
    
    return {
        'p_wd': p_wd.tolist(),
        'a': a_weibull.tolist(),
        'k': k_weibull.tolist(),
        'wd_bins': wd_bins[:-1].tolist(),
        'ti': 0.1,  # Turbulence intensity
        'mean_wind_speed': float(np.mean(wind_speeds)),
        'total_hours': len(wind_speeds),
        'prevailing_wind_direction': prevailing_wind_direction
    }

def get_wind_conditions(latitude: float, longitude: float, year: int = 2023) -> Dict:
    """
    Fetch wind data from NREL API for a specific location and year
    
    Args:
        latitude: Latitude coordinate of the location
        longitude: Longitude coordinate of the location  
        year: Year for wind data (default: 2023)
    
    Returns:
        Dict with the wind conditions for the location
    """
    logger.info(f"Fetching wind data for lat={latitude}, lon={longitude}, year={year}")
    
    try:        
        wind_data = fetch_wind_data(latitude, longitude, year)
        wind_conditions = process_wind_data(wind_data)
        logger.debug("Wind data fetched and processed successfully")
        return wind_conditions
    except Exception as e:
        logger.error(f"Error fetching wind data: {e}")
        return f"Error fetching wind data: {str(e)}"

def lambda_handler(event, context):
    """Lambda handler for AgentCore gateway"""
    result = get_wind_conditions(**event)
    return result
    try:
        logger.info(f"event: {event}")
        logger.info(f"context: {context}")
        logger.info(f"context.client_context: {context.client_context}")

        # Get the tool name from the context
        extended_tool_name = context.client_context.custom["bedrockAgentCoreToolName"]
        tool_name = extended_tool_name.split("___")[1]
        
        # Process the request based on the tool name
        if tool_name == 'get_wind_conditions':
            result = get_wind_conditions(**event)
        
        return result
    except Exception as e:
        logger.info(f"Error in lambda_handler: {e}")
        return f"Error in lambda_handler: {str(e)}"

if __name__ == "__main__":
    # Run as MCP server
    from mcp.server.fastmcp import FastMCP
    
    mcp = FastMCP("Wind Farm Wake Simulation MCP Server")
    
    @mcp.tool()
    def mcp_get_wind_conditions(latitude: float, longitude: float, year: int = 2023) -> Dict:
        """MCP tool wrapper for get_wind_conditions"""
        return get_wind_conditions(latitude, longitude, year)
    
    mcp.run()