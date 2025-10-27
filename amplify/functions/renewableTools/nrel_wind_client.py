"""
NREL Wind Toolkit API Client
Matches workshop implementation exactly - NO SYNTHETIC DATA
"""

import json
import requests
import boto3
import os
import numpy as np
import pandas as pd
from io import StringIO
from scipy import stats
from typing import Dict, Optional
import logging

# Configure logging
log_level = logging.INFO if os.getenv('GET_INFO_LOGS') else logging.WARNING
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)
logger = logging.getLogger('nrel_wind_client')

# Suppress specific loggers
logging.getLogger('botocore').setLevel(logging.ERROR)


def get_nrel_api_key():
    """
    Get NREL API key from AWS Secrets Manager or environment variable.
    
    Priority:
    1. Environment variable NREL_API_KEY
    2. AWS Secrets Manager (nrel/api_key)
    3. Raise error - NO DEMO KEY FALLBACK
    
    Returns:
        str: NREL API key
        
    Raises:
        ValueError: If API key cannot be found
    """
    # First try to get from environment variable
    api_key = os.environ.get('NREL_API_KEY')
    if api_key:
        logger.info("Using NREL API key from environment variable")
        return api_key
        
    # Then try AWS Secrets Manager
    try:
        client = boto3.client('secretsmanager', region_name='us-west-2')
        response = client.get_secret_value(SecretId='nrel/api_key')
        api_key = json.loads(response['SecretString'])['api_key']
        logger.info("Using NREL API key from AWS Secrets Manager")
        return api_key
    except Exception as e:
        logger.error(f"Could not get API key from Secrets Manager: {e}")
        
    # NO DEMO KEY FALLBACK - Raise error
    error_msg = (
        "NREL API key not configured. "
        "Please set NREL_API_KEY environment variable or configure in AWS Secrets Manager. "
        "Get a free API key at: https://developer.nrel.gov/signup/"
    )
    logger.error(error_msg)
    raise ValueError(error_msg)


def fetch_wind_data(latitude: float, longitude: float, year: int = 2023) -> str:
    """
    Fetch wind data from NREL Wind Toolkit API.
    
    Args:
        latitude: Latitude coordinate of the location
        longitude: Longitude coordinate of the location
        year: Year for wind data (default: 2023)
    
    Returns:
        str: CSV data from NREL API
        
    Raises:
        Exception: If API request fails
    """
    api_key = get_nrel_api_key()
    
    nrel_api_url = (
        f'https://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv?'
        f'api_key={api_key}&'
        f'wkt=POINT({longitude} {latitude})&'
        f'attributes=windspeed_100m,winddirection_100m&'
        f'years={year}&'
        f'email=alonso.decosio@gmail.com'
    )
    
    headers = {
        'content-type': "application/x-www-form-urlencoded",
        'cache-control': "no-cache"
    }
    
    logger.info(f"Fetching wind data from NREL API for lat={latitude}, lon={longitude}, year={year}")
    
    try:
        response = requests.post(nrel_api_url, headers=headers, timeout=120)
        
        if response.status_code == 200:
            logger.info(f"Successfully fetched wind data ({len(response.text)} bytes)")
            return response.text
        else:
            error_msg = f"NREL API request failed (Status: {response.status_code})"
            logger.error(error_msg)
            raise Exception(error_msg)
            
    except requests.exceptions.Timeout:
        error_msg = "NREL API request timed out after 120 seconds"
        logger.error(error_msg)
        raise Exception(error_msg)
    except requests.exceptions.RequestException as e:
        error_msg = f"NREL API request failed: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)


def process_wind_data(wind_data_csv: str) -> Dict:
    """
    Process raw CSV wind data from NREL API into wind conditions with Weibull fitting.
    
    Args:
        wind_data_csv: CSV string from NREL API
    
    Returns:
        Dict with wind conditions:
            - p_wd: Probability by direction (12 sectors)
            - a: Weibull scale parameter by sector
            - k: Weibull shape parameter by sector
            - wd_bins: Direction bins
            - ti: Turbulence intensity
            - mean_wind_speed: Mean wind speed (m/s)
            - total_hours: Total data points
            - prevailing_wind_direction: Prevailing direction (degrees)
            - data_source: 'NREL Wind Toolkit'
            - data_year: Year of data
    
    Raises:
        Exception: If data processing fails
    """
    try:
        # Parse CSV using pandas
        df = pd.read_csv(StringIO(wind_data_csv), skiprows=1)
        
        # Extract wind speed and direction data
        wind_speeds = pd.to_numeric(df.iloc[:, 5], errors='coerce').values  # Wind Speed at 100m
        wind_directions = pd.to_numeric(df.iloc[:, 6], errors='coerce').values  # Wind Direction at 100m
        
        # Filter out invalid data
        valid_mask = (wind_speeds > 0) & (~np.isnan(wind_speeds)) & (~np.isnan(wind_directions))
        wind_speeds = wind_speeds[valid_mask]
        wind_directions = wind_directions[valid_mask]
        
        if len(wind_speeds) == 0:
            raise Exception("No valid wind data after filtering")
        
        logger.info(f"Processing {len(wind_speeds)} valid wind data points")
        
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
        
        logger.info(f"Wind data processed: mean_speed={np.mean(wind_speeds):.2f} m/s, "
                   f"prevailing_direction={prevailing_wind_direction}°")
        
        return {
            'p_wd': p_wd.tolist(),
            'a': a_weibull.tolist(),
            'k': k_weibull.tolist(),
            'wd_bins': wd_bins[:-1].tolist(),
            'ti': 0.1,  # Turbulence intensity
            'mean_wind_speed': float(np.mean(wind_speeds)),
            'total_hours': len(wind_speeds),
            'prevailing_wind_direction': prevailing_wind_direction,
            'data_source': 'NREL Wind Toolkit',
            'data_year': 2023,
            'reliability': 'high',
            # CRITICAL: Include raw wind data arrays for visualization
            'wind_speeds': wind_speeds.tolist(),
            'wind_directions': wind_directions.tolist()
        }
        
    except Exception as e:
        error_msg = f"Failed to process wind data: {str(e)}"
        logger.error(error_msg)
        raise Exception(error_msg)


def get_wind_conditions(latitude: float, longitude: float, year: int = 2023) -> Dict:
    """
    Fetch and process wind data from NREL API for a specific location and year.
    
    This is the main entry point that combines fetch_wind_data and process_wind_data.
    
    Args:
        latitude: Latitude coordinate of the location
        longitude: Longitude coordinate of the location  
        year: Year for wind data (default: 2023)
    
    Returns:
        Dict with the wind conditions for the location
        
    Raises:
        Exception: If fetching or processing fails
    """
    logger.info(f"Getting wind conditions for lat={latitude}, lon={longitude}, year={year}")
    
    try:        
        wind_data = fetch_wind_data(latitude, longitude, year)
        wind_conditions = process_wind_data(wind_data)
        logger.info("Wind data fetched and processed successfully")
        return wind_conditions
    except Exception as e:
        logger.error(f"Error getting wind conditions: {e}")
        raise


class NRELWindClient:
    """
    Client for NREL Wind Toolkit API.
    Provides methods to fetch and process real wind data.
    NO SYNTHETIC DATA - raises errors if API fails.
    """
    
    def __init__(self):
        """Initialize NREL Wind Client"""
        self.api_key = None
        logger.info("Initialized NRELWindClient")
    
    def get_api_key(self) -> str:
        """Get NREL API key (cached)"""
        if self.api_key is None:
            self.api_key = get_nrel_api_key()
        return self.api_key
    
    def fetch_wind_data(self, latitude: float, longitude: float, year: int = 2023) -> str:
        """Fetch wind data from NREL API"""
        return fetch_wind_data(latitude, longitude, year)
    
    def process_wind_data(self, wind_data_csv: str) -> Dict:
        """Process wind data with Weibull fitting"""
        return process_wind_data(wind_data_csv)
    
    def get_wind_conditions(self, latitude: float, longitude: float, year: int = 2023) -> Dict:
        """Get complete wind conditions for a location"""
        return get_wind_conditions(latitude, longitude, year)
