"""
Test script for geocontext filtering functionality.

This script demonstrates how the OSDU client now:
1. Detects location-based queries
2. Fetches available GeoPoliticalEntity records
3. Uses an AI agent to match the query to specific geocontexts
4. Adds geocontext filters to the OSDU search query
"""

import os
import sys
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from osdu_client import OSDUClient


def test_geocontext_detection():
    """Test that location-based queries are detected correctly."""
    print("=" * 80)
    print("TEST 1: Geocontext Detection")
    print("=" * 80)
    
    # Get OSDU configuration from environment
    osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://your-osdu-instance.com')
    osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'osdu')
    
    try:
        client = OSDUClient(osdu_base_url, osdu_partition_id)
        
        # Test queries with location intent
        test_queries = [
            "show me wells in Netherlands",
            "wells from the North Sea",
            "data in Texas",
            "wells around Norway",
            "show all wells",  # No location intent
            "wells with GR logs"  # No location intent
        ]
        
        for query in test_queries:
            print(f"\nQuery: '{query}'")
            matching_ids = client.determine_matching_geocontexts(query)
            
            if matching_ids:
                print(f"  ✅ Location detected: {len(matching_ids)} geocontext(s) matched")
                for geo_id in matching_ids:
                    print(f"     - {geo_id}")
            else:
                print(f"  ℹ️  No location intent or no matching geocontexts")
        
        print("\n✅ Geocontext detection test complete")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()


def test_query_building_with_geocontext():
    """Test that queries are built correctly with geocontext filters."""
    print("\n" + "=" * 80)
    print("TEST 2: Query Building with Geocontext")
    print("=" * 80)
    
    # Get OSDU configuration from environment
    osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://your-osdu-instance.com')
    osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'osdu')
    
    try:
        client = OSDUClient(osdu_base_url, osdu_partition_id)
        
        # Test queries
        test_cases = [
            {
                'query': 'wells in Netherlands with depth > 3000',
                'schema_type': 'well',
                'description': 'Location + depth filter'
            },
            {
                'query': 'show me wells in the North Sea',
                'schema_type': 'well',
                'description': 'Location only'
            },
            {
                'query': 'wells with GR and DT logs',
                'schema_type': 'welllog',
                'description': 'No location (welllog level)'
            }
        ]
        
        for test_case in test_cases:
            print(f"\n{test_case['description']}")
            print(f"Query: '{test_case['query']}'")
            print(f"Schema type: {test_case['schema_type']}")
            
            search_json = client.build_osdu_search_json(
                test_case['query'],
                test_case['schema_type']
            )
            
            print(f"\nGenerated OSDU search JSON:")
            print(json.dumps(search_json, indent=2))
            
            # Check if geocontext filter was added
            if 'query' in search_json and 'nested(data.GeoContexts' in search_json['query']:
                print("✅ Geocontext filter added to query")
            else:
                print("ℹ️  No geocontext filter (expected for non-location queries)")
        
        print("\n✅ Query building test complete")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()


def test_fetch_geopolitical_entities():
    """Test fetching GeoPoliticalEntity records from OSDU."""
    print("\n" + "=" * 80)
    print("TEST 3: Fetch GeoPoliticalEntity Records")
    print("=" * 80)
    
    # Get OSDU configuration from environment
    osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://your-osdu-instance.com')
    osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'osdu')
    
    try:
        client = OSDUClient(osdu_base_url, osdu_partition_id)
        
        print("\nFetching GeoPoliticalEntity records from OSDU...")
        entities = client.fetch_geopolitical_entities()
        
        print(f"\n✅ Fetched {len(entities)} GeoPoliticalEntity records")
        
        if entities:
            print("\nSample entities (first 10):")
            for i, entity in enumerate(entities[:10]):
                print(f"  {i+1}. {entity['name']} ({entity['id']})")
        else:
            print("\n⚠️  No GeoPoliticalEntity records found in OSDU instance")
        
        print("\n✅ Fetch test complete")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("GEOCONTEXT FILTERING TEST SUITE")
    print("=" * 80)
    
    # Run all tests
    test_fetch_geopolitical_entities()
    test_geocontext_detection()
    test_query_building_with_geocontext()
    
    print("\n" + "=" * 80)
    print("ALL TESTS COMPLETE")
    print("=" * 80)
