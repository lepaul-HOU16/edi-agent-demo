#!/usr/bin/env python3
"""
Direct test of OSM client to diagnose why it's falling back to synthetic data
"""

import sys
import os
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the renewableTools directory to the path
renewable_tools_path = os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools')
sys.path.insert(0, renewable_tools_path)

def test_osm_import():
    """Test if OSM client can be imported"""
    logger.info("=" * 80)
    logger.info("TEST 1: OSM Client Import")
    logger.info("=" * 80)
    
    try:
        from osm_client import query_osm_terrain_sync, OSMOverpassClient
        logger.info("✅ SUCCESS: OSM client imported successfully")
        return True
    except ImportError as e:
        logger.error(f"❌ FAILED: Could not import OSM client: {e}")
        logger.error(f"   Python path: {sys.path}")
        return False
    except Exception as e:
        logger.error(f"❌ FAILED: Unexpected error importing OSM client: {e}")
        return False

def test_dependencies():
    """Test if required dependencies are available"""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 2: Dependency Check")
    logger.info("=" * 80)
    
    dependencies = {
        'aiohttp': None,
        'asyncio': None,
        'json': None,
        'logging': None,
        'datetime': None
    }
    
    all_available = True
    for dep_name in dependencies.keys():
        try:
            __import__(dep_name)
            logger.info(f"✅ {dep_name}: Available")
            dependencies[dep_name] = True
        except ImportError as e:
            logger.error(f"❌ {dep_name}: NOT AVAILABLE - {e}")
            dependencies[dep_name] = False
            all_available = False
    
    return all_available

def test_osm_query():
    """Test actual OSM query with known coordinates"""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 3: OSM Query with Real Coordinates")
    logger.info("=" * 80)
    
    try:
        from osm_client import query_osm_terrain_sync
        
        # Test coordinates (Amarillo, TX - known to have features)
        test_lat = 35.2220
        test_lon = -101.8313
        test_radius = 5.0
        
        logger.info(f"📍 Testing with coordinates: ({test_lat}, {test_lon})")
        logger.info(f"📏 Radius: {test_radius}km")
        logger.info("🔄 Querying OSM Overpass API...")
        
        result = query_osm_terrain_sync(test_lat, test_lon, test_radius)
        
        # Analyze result
        if not result:
            logger.error("❌ FAILED: No result returned")
            return False
        
        feature_count = len(result.get('features', []))
        metadata = result.get('metadata', {})
        data_source = metadata.get('source', 'unknown')
        
        logger.info(f"\n📊 RESULTS:")
        logger.info(f"   Data Source: {data_source}")
        logger.info(f"   Feature Count: {feature_count}")
        
        if data_source == 'synthetic_fallback':
            logger.error("❌ FAILED: Returned synthetic fallback data")
            error_reason = metadata.get('error_reason', 'Unknown')
            logger.error(f"   Fallback Reason: {error_reason}")
            
            # Print feature details to confirm it's synthetic
            if feature_count > 0:
                logger.info("\n   Synthetic Features:")
                for i, feature in enumerate(result['features'][:3]):
                    props = feature.get('properties', {})
                    logger.info(f"   - {props.get('osm_id', 'unknown')}: {props.get('feature_type', 'unknown')}")
            
            return False
        
        elif data_source == 'openstreetmap':
            logger.info("✅ SUCCESS: Returned real OSM data")
            
            # Print feature statistics
            feature_stats = metadata.get('feature_statistics', {})
            if feature_stats:
                logger.info("\n   Feature Breakdown:")
                for feature_type, count in feature_stats.items():
                    logger.info(f"   - {feature_type}: {count}")
            
            # Print sample features
            if feature_count > 0:
                logger.info("\n   Sample Features:")
                for i, feature in enumerate(result['features'][:5]):
                    props = feature.get('properties', {})
                    logger.info(f"   - {props.get('name', 'Unnamed')}: {props.get('feature_type', 'unknown')}")
            
            return True
        
        else:
            logger.warning(f"⚠️ UNEXPECTED: Unknown data source '{data_source}'")
            return False
            
    except Exception as e:
        logger.error(f"❌ FAILED: Exception during OSM query: {e}")
        logger.error(f"   Error type: {type(e).__name__}")
        import traceback
        logger.error(f"   Traceback:\n{traceback.format_exc()}")
        return False

def test_network_connectivity():
    """Test basic network connectivity"""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 4: Network Connectivity")
    logger.info("=" * 80)
    
    try:
        import urllib.request
        
        # Test basic HTTP connectivity
        test_url = "https://httpbin.org/status/200"
        logger.info(f"🌐 Testing connectivity to: {test_url}")
        
        req = urllib.request.Request(test_url, headers={'User-Agent': 'OSM-Test/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                logger.info("✅ SUCCESS: Network connectivity confirmed")
                return True
            else:
                logger.error(f"❌ FAILED: Unexpected status code {response.status}")
                return False
                
    except Exception as e:
        logger.error(f"❌ FAILED: Network connectivity test failed: {e}")
        return False

def test_overpass_endpoints():
    """Test connectivity to Overpass API endpoints"""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 5: Overpass API Endpoint Connectivity")
    logger.info("=" * 80)
    
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter"
    ]
    
    import urllib.request
    import urllib.parse
    
    results = {}
    for endpoint in endpoints:
        try:
            logger.info(f"\n📡 Testing: {endpoint}")
            
            # Simple test query
            query = "[out:json][timeout:5]; (node(0);); out;"
            data = urllib.parse.urlencode({'data': query}).encode('utf-8')
            
            req = urllib.request.Request(
                endpoint,
                data=data,
                headers={
                    'User-Agent': 'OSM-Test/1.0',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.status
                logger.info(f"   Status: {status}")
                
                if status == 200:
                    logger.info(f"   ✅ Endpoint is accessible")
                    results[endpoint] = True
                else:
                    logger.warning(f"   ⚠️ Unexpected status code")
                    results[endpoint] = False
                    
        except Exception as e:
            logger.error(f"   ❌ Failed to connect: {e}")
            results[endpoint] = False
    
    # Summary
    accessible_count = sum(1 for v in results.values() if v)
    logger.info(f"\n📊 SUMMARY: {accessible_count}/{len(endpoints)} endpoints accessible")
    
    return accessible_count > 0

def main():
    """Run all tests"""
    logger.info("\n" + "=" * 80)
    logger.info("OSM CLIENT DIAGNOSTIC TEST SUITE")
    logger.info("=" * 80)
    
    results = {
        'import': test_osm_import(),
        'dependencies': test_dependencies(),
        'network': test_network_connectivity(),
        'endpoints': test_overpass_endpoints(),
        'query': False  # Will be set by test_osm_query
    }
    
    # Only run query test if import succeeded
    if results['import']:
        results['query'] = test_osm_query()
    else:
        logger.warning("\n⚠️ Skipping OSM query test due to import failure")
    
    # Final summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{status}: {test_name.upper()}")
    
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    logger.info(f"\n📊 Overall: {passed_count}/{total_count} tests passed")
    
    if results['query']:
        logger.info("\n🎉 SUCCESS: OSM integration is working correctly!")
        logger.info("   The system should be retrieving real terrain data.")
    else:
        logger.error("\n❌ FAILURE: OSM integration is not working")
        logger.error("   This explains why the system is using synthetic fallback data.")
        
        # Provide diagnostic guidance
        logger.info("\n🔍 DIAGNOSTIC GUIDANCE:")
        if not results['import']:
            logger.info("   - Fix import issues first")
        elif not results['dependencies']:
            logger.info("   - Install missing dependencies (especially aiohttp)")
        elif not results['network']:
            logger.info("   - Check network connectivity and firewall settings")
        elif not results['endpoints']:
            logger.info("   - Overpass API endpoints may be down or blocked")
        else:
            logger.info("   - Check Lambda logs for specific error messages")
    
    return 0 if results['query'] else 1

if __name__ == '__main__':
    sys.exit(main())
