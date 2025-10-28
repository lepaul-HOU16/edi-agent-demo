"""
Real OpenStreetMap Overpass API Client

This module provides real OSM data integration replacing mock terrain data
with actual geographic features from the OpenStreetMap database.
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OSMAPIError(Exception):
    """OpenStreetMap API specific errors"""
    def __init__(self, message: str, status_code: int = None, retry_after: int = None):
        super().__init__(message)
        self.status_code = status_code
        self.retry_after = retry_after

class RetryConfig:
    """Configuration for API retry logic"""
    def __init__(self, max_attempts: int = 3, backoff_factor: float = 2.0, base_delay: float = 1.0):
        self.max_attempts = max_attempts
        self.backoff_factor = backoff_factor
        self.base_delay = base_delay

class OSMOverpassClient:
    """Real OpenStreetMap data integration using Overpass API"""
    
    def __init__(self):
        self.base_urls = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass.openstreetmap.ru/api/interpreter"
        ]
        # CRITICAL: Reduce timeout to prevent Lambda timeout
        # Lambda has limited execution time, so we need to fail fast
        self.timeout = 15  # Reduced from 30 to 15 seconds
        self.retry_config = RetryConfig(max_attempts=2, backoff_factor=1.5)  # Reduced retries
        self.headers = {'User-Agent': 'RenewableEnergyAnalysis/1.0'}
    
    def query_terrain_features(self, lat: float, lon: float, radius_km: float) -> Dict:
        """
        Query real terrain features from OSM Overpass API
        
        Args:
            lat: Center latitude
            lon: Center longitude  
            radius_km: Search radius in kilometers
            
        Returns:
            GeoJSON FeatureCollection with real terrain data
        """
        logger.info(f"🌍 Querying real OSM data at ({lat}, {lon}) within {radius_km}km")
        
        # Build comprehensive Overpass QL query
        # CRITICAL: Reduced timeout and result limit to prevent Lambda timeout
        radius_m = radius_km * 1000
        query = f"""
        [out:json][timeout:12][maxsize:536870912];
        (
          // Buildings - ALL buildings that affect wind flow
          way["building"](around:{radius_m},{lat},{lon});
          relation["building"](around:{radius_m},{lat},{lon});
          
          // Transportation infrastructure - ALL highways
          way["highway"](around:{radius_m},{lat},{lon});
          way["railway"](around:{radius_m},{lat},{lon});
          
          // Water bodies - affect local wind patterns
          way["natural"="water"](around:{radius_m},{lat},{lon});
          way["waterway"](around:{radius_m},{lat},{lon});
          relation["natural"="water"](around:{radius_m},{lat},{lon});
          
          // Land use - ALL types
          way["landuse"](around:{radius_m},{lat},{lon});
          way["man_made"](around:{radius_m},{lat},{lon});
          
          // Power infrastructure - exclusion zones
          way["power"](around:{radius_m},{lat},{lon});
          node["power"="tower"](around:{radius_m},{lat},{lon});
          
          // Forests and vegetation - wind roughness
          way["natural"="wood"](around:{radius_m},{lat},{lon});
          way["natural"="tree"](around:{radius_m},{lat},{lon});
          way["natural"="scrub"](around:{radius_m},{lat},{lon});
          
          // Protected areas - regulatory restrictions
          way["boundary"](around:{radius_m},{lat},{lon});
          relation["boundary"](around:{radius_m},{lat},{lon});
          
          // Additional features
          way["leisure"](around:{radius_m},{lat},{lon});
          way["amenity"](around:{radius_m},{lat},{lon});
        );
        out geom 500;
        """
        
        try:
            response_data = self._execute_query_with_retry(query)
            processed_data = self._process_osm_response(response_data, lat, lon, radius_km)
            
            logger.info(f"✅ Successfully retrieved {len(processed_data['features'])} real terrain features")
            return processed_data
            
        except OSMAPIError as e:
            logger.error(f"❌ OSM API error: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error in OSM query: {e}")
            raise OSMAPIError(f"Failed to query OSM data: {str(e)}")
    
    def _execute_query_with_retry(self, query: str) -> Dict:
        """Execute Overpass query with enhanced retry logic (synchronous)"""
        
        last_error = None
        successful_endpoints = []
        failed_endpoints = []
        
        for attempt in range(self.retry_config.max_attempts):
            logger.info(f"🔄 Starting attempt {attempt + 1}/{self.retry_config.max_attempts}")
            
            for base_url in self.base_urls:
                try:
                    logger.info(f"📡 Querying {base_url}")
                    
                    response_data = self._execute_single_query(base_url, query)
                    
                    # Validate response
                    if not response_data or 'elements' not in response_data:
                        raise OSMAPIError("Invalid response format from Overpass API")
                    
                    element_count = len(response_data['elements'])
                    logger.info(f"✅ Query successful on {base_url}, got {element_count} elements")
                    successful_endpoints.append(base_url)
                    
                    # Log success metrics for monitoring
                    if element_count > 100:
                        logger.info(f"🎉 EXCELLENT: Retrieved {element_count} features (>100)")
                    elif element_count > 50:
                        logger.info(f"✅ GOOD: Retrieved {element_count} features (>50)")
                    elif element_count > 10:
                        logger.info(f"⚠️ MODERATE: Retrieved {element_count} features (>10)")
                    else:
                        logger.warning(f"🔍 LOW: Retrieved only {element_count} features")
                    
                    return response_data
                    
                except OSMAPIError as e:
                    last_error = e
                    failed_endpoints.append(base_url)
                    logger.warning(f"⚠️ OSM API error on {base_url}: {e}")
                    
                    # Handle rate limiting with exponential backoff
                    if e.status_code == 429:
                        retry_after = e.retry_after or (2 ** attempt)
                        logger.info(f"⏳ Rate limited on {base_url}, waiting {retry_after}s")
                        time.sleep(retry_after)
                        continue
                    
                    # Handle server errors - try next endpoint
                    if e.status_code and e.status_code >= 500:
                        logger.warning(f"🔧 Server error {e.status_code} on {base_url}, trying next endpoint")
                        continue
                    
                    # Handle timeout errors
                    if e.status_code == 504:
                        logger.warning(f"⏰ Timeout on {base_url}, query may be too complex")
                        continue
                    
                    # Client errors - don't retry on this endpoint
                    if e.status_code and 400 <= e.status_code < 500:
                        logger.error(f"❌ Client error {e.status_code} on {base_url}: {e}")
                        continue
                
                except Exception as e:
                    last_error = OSMAPIError(f"Network error on {base_url}: {str(e)}")
                    failed_endpoints.append(base_url)
                    logger.warning(f"⚠️ Network error on {base_url}: {e}")
                    continue
            
            # Wait before next attempt (if not the last one)
            if attempt < self.retry_config.max_attempts - 1:
                delay = self.retry_config.base_delay * (self.retry_config.backoff_factor ** attempt)
                logger.info(f"⏳ All endpoints failed on attempt {attempt + 1}, waiting {delay}s before retry")
                time.sleep(delay)
        
        # Log final failure statistics
        logger.error(f"❌ All attempts failed after {self.retry_config.max_attempts} attempts")
        logger.error(f"📊 Failed endpoints: {failed_endpoints}")
        logger.error(f"📊 Successful endpoints: {successful_endpoints}")
        
        # All attempts failed
        raise last_error or OSMAPIError("All Overpass API endpoints failed after multiple attempts")
    
    def _execute_single_query(self, base_url: str, query: str) -> Dict:
        """Execute a single query against one Overpass endpoint (synchronous)"""
        
        start_time = time.time()
        
        try:
            # Prepare request data
            data = urllib.parse.urlencode({'data': query}).encode('utf-8')
            
            # Create request with headers
            req = urllib.request.Request(
                base_url,
                data=data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'RenewableEnergyAnalysis/1.0'
                }
            )
            
            # Execute request with timeout
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                query_time = time.time() - start_time
                logger.info(f"📊 Query completed in {query_time:.2f}s")
                
                # Read and parse response
                response_data = json.loads(response.read().decode('utf-8'))
                
                # Log response statistics
                element_count = len(response_data.get('elements', []))
                logger.info(f"📈 Response: {element_count} elements in {query_time:.2f}s")
                
                return response_data
                
        except urllib.error.HTTPError as e:
            # Handle HTTP errors
            if e.code == 429:
                retry_after = int(e.headers.get('Retry-After', 60))
                raise OSMAPIError(f"Rate limited", status_code=429, retry_after=retry_after)
            
            if e.code == 504:
                raise OSMAPIError("Query timeout - area too large or complex", status_code=504)
            
            error_text = e.read().decode('utf-8') if e.fp else str(e)
            raise OSMAPIError(f"HTTP {e.code}: {error_text}", status_code=e.code)
            
        except urllib.error.URLError as e:
            raise OSMAPIError(f"Network error: {str(e)}")
            
        except json.JSONDecodeError as e:
            raise OSMAPIError(f"Invalid JSON response: {str(e)}")
            
        except Exception as e:
            raise OSMAPIError(f"Unexpected error: {str(e)}")
    
    def _process_osm_response(self, response_data: Dict, center_lat: float, center_lon: float, radius_km: float) -> Dict:
        """Convert OSM response to GeoJSON format with proper feature classification"""
        
        logger.info("🔄 Processing OSM response data")
        
        features = []
        feature_stats = {}
        
        for element in response_data.get('elements', []):
            try:
                # Skip elements without geometry
                if element.get('type') not in ['way', 'relation']:
                    continue
                
                # Extract geometry
                geometry = self._extract_geometry(element)
                if not geometry:
                    continue
                
                # Classify feature based on tags
                tags = element.get('tags', {})
                feature_type = self._classify_feature(tags)
                
                # Update statistics
                feature_stats[feature_type] = feature_stats.get(feature_type, 0) + 1
                
                # Create GeoJSON feature
                feature = {
                    'type': 'Feature',
                    'geometry': geometry,
                    'properties': {
                        'feature_type': feature_type,
                        'osm_id': element.get('id'),
                        'osm_type': element.get('type'),
                        'tags': tags,
                        'name': tags.get('name', f"{feature_type.title()} Feature"),
                        'source': 'openstreetmap',
                        'exclusion_reason': self._get_exclusion_reason(feature_type, tags)
                    }
                }
                
                features.append(feature)
                
            except Exception as e:
                logger.warning(f"⚠️ Error processing OSM element {element.get('id')}: {e}")
                continue
        
        # Log processing results
        logger.info(f"📊 Processed features by type: {feature_stats}")
        
        return {
            'type': 'FeatureCollection',
            'features': features,
            'metadata': {
                'source': 'openstreetmap',
                'query_location': {'lat': center_lat, 'lon': center_lon},
                'query_radius_km': radius_km,
                'query_time': datetime.utcnow().isoformat(),
                'feature_count': len(features),
                'feature_statistics': feature_stats,
                'data_quality': {
                    'completeness': 'high',
                    'accuracy': 'community_verified',
                    'freshness': 'real_time'
                }
            }
        }
    
    def _extract_geometry(self, element: Dict) -> Optional[Dict]:
        """Extract geometry from OSM element"""
        
        element_type = element.get('type')
        geometry_data = element.get('geometry', [])
        
        if not geometry_data:
            return None
        
        try:
            if element_type == 'way':
                # Convert way to LineString or Polygon based on feature type
                coordinates = [[node['lon'], node['lat']] for node in geometry_data]
                
                if len(coordinates) < 2:
                    return None
                
                # Determine if this should be a polygon or linestring based on tags
                tags = element.get('tags', {})
                is_area = self._should_be_polygon(tags)
                is_closed = len(coordinates) >= 4 and coordinates[0] == coordinates[-1]
                
                if is_area and is_closed:
                    # This is an area feature (building, water, etc.)
                    return {
                        'type': 'Polygon',
                        'coordinates': [coordinates]
                    }
                else:
                    # This is a linear feature (highway, railway, etc.) or open way
                    return {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
            
            elif element_type == 'relation':
                # Handle multipolygon relations
                if element.get('tags', {}).get('type') == 'multipolygon':
                    # Simplified multipolygon handling
                    # In a full implementation, this would properly handle inner/outer ways
                    coordinates = [[node['lon'], node['lat']] for node in geometry_data]
                    if len(coordinates) >= 4:
                        if coordinates[0] != coordinates[-1]:
                            coordinates.append(coordinates[0])  # Close polygon
                        return {
                            'type': 'Polygon',
                            'coordinates': [coordinates]
                        }
            
            return None
            
        except (KeyError, IndexError, TypeError) as e:
            logger.warning(f"⚠️ Geometry extraction error: {e}")
            return None
    
    def _classify_feature(self, tags: Dict) -> str:
        """Classify OSM feature based on tags for wind farm planning"""
        
        # Buildings - major wind obstacles
        if 'building' in tags:
            return 'building'
        
        # Transportation infrastructure
        if 'highway' in tags:
            highway_type = tags['highway']
            if highway_type in ['motorway', 'trunk', 'primary']:
                return 'major_highway'
            else:
                return 'highway'
        
        if 'railway' in tags:
            return 'railway'
        
        # Water bodies - affect wind patterns
        if tags.get('natural') == 'water' or 'waterway' in tags:
            return 'water'
        
        # Industrial areas - restricted zones
        if tags.get('landuse') == 'industrial' or tags.get('man_made') == 'works':
            return 'industrial'
        
        # Power infrastructure - exclusion zones
        if 'power' in tags:
            power_type = tags['power']
            if power_type in ['line', 'substation', 'generator']:
                return 'power_infrastructure'
        
        # Forests - wind roughness
        if tags.get('landuse') == 'forest' or tags.get('natural') == 'wood':
            return 'forest'
        
        # Protected areas - regulatory restrictions
        if tags.get('boundary') == 'protected_area':
            return 'protected_area'
        
        # Default classification
        return 'other'
    
    def _should_be_polygon(self, tags: Dict) -> bool:
        """Determine if an OSM way should be treated as a polygon based on its tags"""
        
        # Features that should always be polygons (area features)
        polygon_tags = {
            'building',
            'landuse', 
            'natural',
            'leisure',
            'amenity',
            'shop',
            'craft',
            'office',
            'industrial',
            'military',
            'place',
            'boundary'
        }
        
        # Features that should always be linestrings (linear features)
        linestring_tags = {
            'highway',
            'railway',
            'waterway',
            'power',
            'barrier',
            'man_made'  # Most man_made features are linear (except some like 'works')
        }
        
        # Check for explicit area tags
        if tags.get('area') == 'yes':
            return True
        if tags.get('area') == 'no':
            return False
        
        # Check primary tags
        for tag_key in tags:
            if tag_key in polygon_tags:
                return True
            if tag_key in linestring_tags:
                # Special cases for man_made
                if tag_key == 'man_made' and tags[tag_key] in ['works', 'wastewater_plant']:
                    return True
                # Special cases for natural water features
                if tag_key == 'natural' and tags[tag_key] == 'water':
                    return True
                return False
        
        # Default to linestring for unknown features
        return False
    
    def _get_exclusion_reason(self, feature_type: str, tags: Dict) -> str:
        """Get human-readable exclusion reason for wind turbine placement"""
        
        exclusion_reasons = {
            'building': 'Noise and safety setback requirements',
            'major_highway': 'Transportation corridor restrictions',
            'highway': 'Road setback requirements',
            'railway': 'Railway corridor restrictions',
            'water': 'Water body - unsuitable foundation',
            'industrial': 'Industrial zone restrictions',
            'power_infrastructure': 'Electrical infrastructure conflicts',
            'forest': 'Environmental and access constraints',
            'protected_area': 'Environmental protection regulations'
        }
        
        return exclusion_reasons.get(feature_type, 'General land use restrictions')

# Synchronous wrapper for backward compatibility with enhanced error handling
def query_osm_terrain_sync(lat: float, lon: float, radius_km: float) -> Dict:
    """
    Synchronous OSM terrain query with progressive fallback strategy
    
    Fallback strategy:
    1. Real OSM data from Overpass API
    2. Cached OSM data (if available)
    3. Clearly labeled synthetic data with error explanation
    """
    logger.info(f"🌍 Starting OSM terrain query for ({lat}, {lon}) radius {radius_km}km")
    
    # Try to get real OSM data (now fully synchronous)
    try:
        client = OSMOverpassClient()
        result = client.query_terrain_features(lat, lon, radius_km)
        logger.info("✅ Successfully retrieved real OSM data")
        return result
            
    except OSMAPIError as osm_error:
        logger.error(f"❌ OSM API error: {osm_error}")
        # Try cached data fallback (placeholder for future implementation)
        cached_data = _try_cached_osm_data(lat, lon, radius_km)
        if cached_data:
            logger.info("✅ Using cached OSM data as fallback")
            return cached_data
        
        # Final fallback to synthetic data
        logger.warning("🔄 No cached data available, using synthetic fallback")
        return _create_synthetic_fallback(lat, lon, radius_km, f"OSM API Error: {str(osm_error)}")
        
    except Exception as error:
        logger.error(f"❌ Unexpected error in OSM query: {error}")
        logger.error(f"🔍 Error type: {type(error).__name__}")
        logger.error(f"📍 Error details: {str(error)}")
        
        # Try cached data fallback
        cached_data = _try_cached_osm_data(lat, lon, radius_km)
        if cached_data:
            logger.info("✅ Using cached OSM data as fallback")
            return cached_data
        
        # Final fallback to synthetic data
        logger.warning("🔄 No cached data available, using synthetic fallback")
        return _create_synthetic_fallback(lat, lon, radius_km, f"Query error: {type(error).__name__}: {str(error)}")

def _try_cached_osm_data(lat: float, lon: float, radius_km: float) -> Optional[Dict]:
    """
    Try to retrieve cached OSM data for the location
    
    This is a placeholder for future caching implementation.
    In production, this would check S3 or DynamoDB for cached OSM responses.
    """
    logger.info("🔍 Checking for cached OSM data (placeholder)")
    
    # TODO: Implement actual caching mechanism
    # - Check S3 for cached OSM responses by location hash
    # - Validate cache freshness (e.g., < 30 days old)
    # - Return cached data if available and fresh
    
    return None

def _create_synthetic_fallback(lat: float, lon: float, radius_km: float, error_reason: str) -> Dict:
    """
    Create clearly labeled synthetic terrain data as final fallback
    
    This ensures the system continues to function even when real OSM data is unavailable,
    but clearly indicates that the data is synthetic.
    """
    logger.warning(f"🚨 CREATING SYNTHETIC FALLBACK DATA due to: {error_reason}")
    
    # Create basic synthetic features around the location
    features = [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': [
                    [lon - 0.01, lat - 0.01],
                    [lon - 0.005, lat + 0.005],
                    [lon + 0.005, lat + 0.01]
                ]
            },
            'properties': {
                'feature_type': 'highway',
                'osm_id': 'synthetic_highway_1',
                'name': 'Synthetic Road (FALLBACK DATA)',
                'tags': {'highway': 'residential', 'synthetic': 'true'},
                'data_source': 'synthetic_fallback',
                'reliability': 'low',
                'warning': 'SYNTHETIC DATA - Real OSM data unavailable',
                'error_reason': error_reason
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [lon + 0.002, lat - 0.002],
                    [lon + 0.002, lat + 0.002],
                    [lon - 0.002, lat + 0.002],
                    [lon - 0.002, lat - 0.002],
                    [lon + 0.002, lat - 0.002]
                ]]
            },
            'properties': {
                'feature_type': 'building',
                'osm_id': 'synthetic_building_1',
                'name': 'Synthetic Building (FALLBACK DATA)',
                'tags': {'building': 'yes', 'synthetic': 'true'},
                'data_source': 'synthetic_fallback',
                'reliability': 'low',
                'warning': 'SYNTHETIC DATA - Real OSM data unavailable',
                'error_reason': error_reason
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [lon - 0.008, lat + 0.003],
                    [lon - 0.006, lat + 0.008],
                    [lon - 0.012, lat + 0.008],
                    [lon - 0.010, lat + 0.003],
                    [lon - 0.008, lat + 0.003]
                ]]
            },
            'properties': {
                'feature_type': 'water',
                'osm_id': 'synthetic_water_1',
                'name': 'Synthetic Water Body (FALLBACK DATA)',
                'tags': {'natural': 'water', 'synthetic': 'true'},
                'data_source': 'synthetic_fallback',
                'reliability': 'low',
                'warning': 'SYNTHETIC DATA - Real OSM data unavailable',
                'error_reason': error_reason
            }
        }
    ]
    
    return {
        'type': 'FeatureCollection',
        'features': features,
        'metadata': {
            'source': 'synthetic_fallback',
            'query_location': {'lat': lat, 'lon': lon},
            'query_radius_km': radius_km,
            'query_time': datetime.utcnow().isoformat(),
            'feature_count': len(features),
            'feature_statistics': {'highway': 1, 'building': 1, 'water': 1},
            'data_quality': {
                'completeness': 'synthetic',
                'accuracy': 'low',
                'freshness': 'generated'
            },
            'error_reason': error_reason,
            'warning': 'SYNTHETIC DATA - Real terrain data unavailable',
            'fallback_level': 'final'
        }
    }

# Utility functions for testing and validation
def validate_osm_response(response_data: Dict) -> Dict:
    """Validate OSM response data quality"""
    
    validation_result = {
        'is_valid': False,
        'feature_count': 0,
        'geometry_types': {},
        'feature_types': {},
        'issues': []
    }
    
    if not response_data or not isinstance(response_data, dict):
        validation_result['issues'].append('Invalid response format')
        return validation_result
    
    features = response_data.get('features', [])
    validation_result['feature_count'] = len(features)
    
    if len(features) == 0:
        validation_result['issues'].append('No features found in response')
        return validation_result
    
    # Analyze features
    for feature in features:
        # Check geometry
        geometry = feature.get('geometry', {})
        geom_type = geometry.get('type', 'unknown')
        validation_result['geometry_types'][geom_type] = validation_result['geometry_types'].get(geom_type, 0) + 1
        
        # Check feature type
        props = feature.get('properties', {})
        feature_type = props.get('feature_type', 'unknown')
        validation_result['feature_types'][feature_type] = validation_result['feature_types'].get(feature_type, 0) + 1
        
        # Validate required properties
        if not props.get('osm_id'):
            validation_result['issues'].append(f'Missing OSM ID for feature')
        
        if not props.get('source'):
            validation_result['issues'].append(f'Missing source information')
    
    # Check metadata
    metadata = response_data.get('metadata', {})
    if not metadata.get('query_time'):
        validation_result['issues'].append('Missing query timestamp')
    
    if not metadata.get('feature_statistics'):
        validation_result['issues'].append('Missing feature statistics')
    
    # Overall validation
    validation_result['is_valid'] = len(validation_result['issues']) == 0
    
    return validation_result