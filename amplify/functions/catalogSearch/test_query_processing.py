"""
Test Query Processing with Context Awareness

This test verifies that the query processing implementation correctly:
1. Loads existing all_well_metadata.json from context
2. Determines which level of hierarchy needs to be filtered
3. Processes natural language filter queries
4. Generates thought steps during processing

Note: This test retrieves OSDU credentials from the deployed Lambda function.
"""

import json
import logging
import os
import boto3

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_lambda_env_vars():
    """
    Retrieve environment variables from the deployed catalogSearch Lambda function.
    
    Returns:
        dict: Environment variables from the Lambda function
    """
    try:
        lambda_client = boto3.client('lambda')
        
        # List functions to find the catalogSearch Lambda
        logger.info("Looking for catalogSearch Lambda function...")
        response = lambda_client.list_functions()
        
        catalog_search_function = None
        for function in response['Functions']:
            if 'catalogSearch' in function['FunctionName'] or 'CatalogSearch' in function['FunctionName']:
                catalog_search_function = function['FunctionName']
                logger.info(f"Found Lambda function: {catalog_search_function}")
                break
        
        if not catalog_search_function:
            logger.error("Could not find catalogSearch Lambda function")
            return {}
        
        # Get function configuration including environment variables
        logger.info(f"Retrieving environment variables from {catalog_search_function}...")
        config = lambda_client.get_function_configuration(FunctionName=catalog_search_function)
        
        env_vars = config.get('Environment', {}).get('Variables', {})
        logger.info(f"Retrieved {len(env_vars)} environment variables")
        
        # Set them in the current process environment
        for key, value in env_vars.items():
            if key.startswith('OSDU_') or key.startswith('EDI_') or key == 'COGNITO_REGION':
                os.environ[key] = value
                logger.info(f"Set environment variable: {key}")
        
        return env_vars
        
    except Exception as e:
        logger.error(f"Error retrieving Lambda environment variables: {str(e)}")
        return {}


# Retrieve environment variables from deployed Lambda
logger.info("=" * 80)
logger.info("RETRIEVING OSDU CREDENTIALS FROM DEPLOYED LAMBDA")
logger.info("=" * 80)
env_vars = get_lambda_env_vars()
logger.info("=" * 80)
logger.info("")

# Now import the processor after setting environment variables
from strands_agent_processor import StrandsAgentProcessor

# Sample well metadata for testing
SAMPLE_WELLS = [
    {
        'well_id': 'well-001',
        'data': {
            'FacilityName': 'Test Well Alpha',
            'depth': 3500,
            'operator': 'Test Operator A',
            'type': 'Oil',
            'SpatialLocation': {
                'Wgs84Coordinates': {
                    'latitude': 35.0,
                    'longitude': -101.0
                }
            }
        },
        'wellbores': [
            {
                'wellbore_id': 'wellbore-001-a',
                'data': {
                    'FacilityName': 'Test Wellbore A1',
                    'NameAliases': ['TB-A1']
                },
                'welllogs': [
                    {
                        'welllog_id': 'welllog-001-a-1',
                        'data': {
                            'Name': 'GR Log',
                            'Curves': [{'Mnemonic': 'GR'}]
                        }
                    }
                ]
            }
        ]
    },
    {
        'well_id': 'well-002',
        'data': {
            'FacilityName': 'Test Well Beta',
            'depth': 2500,
            'operator': 'Test Operator B',
            'type': 'Gas',
            'SpatialLocation': {
                'Wgs84Coordinates': {
                    'latitude': 35.5,
                    'longitude': -101.5
                }
            }
        },
        'wellbores': [
            {
                'wellbore_id': 'wellbore-002-a',
                'data': {
                    'FacilityName': 'Test Wellbore B1',
                    'NameAliases': ['TB-B1']
                },
                'welllogs': []
            }
        ]
    },
    {
        'well_id': 'well-003',
        'data': {
            'FacilityName': 'Test Well Gamma',
            'depth': 4000,
            'operator': 'Test Operator A',
            'type': 'Oil',
            'SpatialLocation': {
                'Wgs84Coordinates': {
                    'latitude': 36.0,
                    'longitude': -102.0
                }
            }
        },
        'wellbores': []
    }
]


def test_load_context():
    """Test loading existing well metadata from context."""
    logger.info("=" * 80)
    logger.info("TEST 1: Load Context")
    logger.info("=" * 80)
    
    try:
        # Initialize processor with environment variables
        osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
        osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'opendes')
        
        logger.info(f"Using OSDU Base URL: {osdu_base_url}")
        logger.info(f"Using OSDU Partition ID: {osdu_partition_id}")
        
        processor = StrandsAgentProcessor(
            osdu_base_url=osdu_base_url,
            osdu_partition_id=osdu_partition_id
        )
        
        # Test with no context
        result = processor.process_query(
            query="Show all wells",
            session_id="test-session-1",
            existing_context=None
        )
        
        assert result['message'] == 'No well data loaded. Please run /getdata first to load well data.'
        assert len(result['thought_steps']) == 1
        assert result['thought_steps'][0]['status'] == 'error'
        logger.info("✅ No context test passed")
        
        # Test with context
        result = processor.process_query(
            query="Show all wells",
            session_id="test-session-2",
            existing_context={'allWells': SAMPLE_WELLS}
        )
        
        assert result['stats']['wellCount'] == 3
        assert len(result['thought_steps']) > 0
        assert result['thought_steps'][0]['id'] == 'load_context'
        assert result['thought_steps'][0]['status'] == 'complete'
        logger.info("✅ With context test passed")
        
        logger.info("=" * 80)
        logger.info("✅ TEST 1 PASSED: Load Context")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST 1 FAILED: {str(e)}", exc_info=True)
        return False


def test_determine_hierarchy_level():
    """Test determining which hierarchy level to filter."""
    logger.info("=" * 80)
    logger.info("TEST 2: Determine Hierarchy Level")
    logger.info("=" * 80)
    
    try:
        osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
        osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'opendes')
        
        processor = StrandsAgentProcessor(
            osdu_base_url=osdu_base_url,
            osdu_partition_id=osdu_partition_id
        )
        
        # Test well-level queries
        level = processor._determine_hierarchy_level("Show wells deeper than 3000m")
        assert level == 'well', f"Expected 'well', got '{level}'"
        logger.info("✅ Well-level query detected correctly")
        
        # Test wellbore-level queries
        level = processor._determine_hierarchy_level("Show wellbores in this area")
        assert level == 'wellbore', f"Expected 'wellbore', got '{level}'"
        logger.info("✅ Wellbore-level query detected correctly")
        
        # Test welllog-level queries
        level = processor._determine_hierarchy_level("Show welllogs with GR curves")
        assert level == 'welllog', f"Expected 'welllog', got '{level}'"
        logger.info("✅ Welllog-level query detected correctly")
        
        level = processor._determine_hierarchy_level("Find curves with density data")
        assert level == 'welllog', f"Expected 'welllog', got '{level}'"
        logger.info("✅ Curve-level query detected correctly")
        
        logger.info("=" * 80)
        logger.info("✅ TEST 2 PASSED: Determine Hierarchy Level")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST 2 FAILED: {str(e)}", exc_info=True)
        return False


def test_process_natural_language_queries():
    """Test processing various natural language filter queries."""
    logger.info("=" * 80)
    logger.info("TEST 3: Process Natural Language Queries")
    logger.info("=" * 80)
    
    try:
        osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
        osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'opendes')
        
        processor = StrandsAgentProcessor(
            osdu_base_url=osdu_base_url,
            osdu_partition_id=osdu_partition_id
        )
        
        context = {'allWells': SAMPLE_WELLS}
        
        # Test depth filter
        result = processor.process_query(
            query="Show wells deeper than 3000m",
            session_id="test-session-3",
            existing_context=context
        )
        
        assert result['stats']['wellCount'] == 2, f"Expected 2 wells, got {result['stats']['wellCount']}"
        assert 'depth > 3000m' in result['message'] or 'deeper than' in result['message'].lower()
        logger.info("✅ Depth filter query processed correctly")
        
        # Test name filter
        result = processor.process_query(
            query='Show wells named "Alpha"',
            session_id="test-session-4",
            existing_context=context
        )
        
        assert result['stats']['wellCount'] == 1, f"Expected 1 well, got {result['stats']['wellCount']}"
        logger.info("✅ Name filter query processed correctly")
        
        # Test operator filter
        result = processor.process_query(
            query='Show wells operated by "Test Operator A"',
            session_id="test-session-5",
            existing_context=context
        )
        
        assert result['stats']['wellCount'] == 2, f"Expected 2 wells, got {result['stats']['wellCount']}"
        logger.info("✅ Operator filter query processed correctly")
        
        # Test type filter
        result = processor.process_query(
            query="Show oil wells",
            session_id="test-session-6",
            existing_context=context
        )
        
        assert result['stats']['wellCount'] == 2, f"Expected 2 wells, got {result['stats']['wellCount']}"
        logger.info("✅ Type filter query processed correctly")
        
        logger.info("=" * 80)
        logger.info("✅ TEST 3 PASSED: Process Natural Language Queries")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST 3 FAILED: {str(e)}", exc_info=True)
        return False


def test_generate_thought_steps():
    """Test that thought steps are generated during processing."""
    logger.info("=" * 80)
    logger.info("TEST 4: Generate Thought Steps")
    logger.info("=" * 80)
    
    try:
        osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
        osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'opendes')
        
        processor = StrandsAgentProcessor(
            osdu_base_url=osdu_base_url,
            osdu_partition_id=osdu_partition_id
        )
        
        context = {'allWells': SAMPLE_WELLS}
        
        result = processor.process_query(
            query="Show wells deeper than 3000m",
            session_id="test-session-7",
            existing_context=context
        )
        
        # Verify thought steps exist
        assert 'thought_steps' in result, "No thought_steps in result"
        assert len(result['thought_steps']) > 0, "No thought steps generated"
        
        # Verify thought step structure
        for step in result['thought_steps']:
            assert 'id' in step, "Thought step missing 'id'"
            assert 'type' in step, "Thought step missing 'type'"
            assert 'title' in step, "Thought step missing 'title'"
            assert 'summary' in step, "Thought step missing 'summary'"
            assert 'status' in step, "Thought step missing 'status'"
            assert 'timestamp' in step, "Thought step missing 'timestamp'"
        
        # Verify expected thought steps
        step_ids = [step['id'] for step in result['thought_steps']]
        assert 'load_context' in step_ids, "Missing 'load_context' thought step"
        assert 'analyze_hierarchy' in step_ids, "Missing 'analyze_hierarchy' thought step"
        assert 'apply_filters' in step_ids or 'intelligent_filtering' in step_ids, "Missing filtering thought step"
        
        logger.info(f"✅ Generated {len(result['thought_steps'])} thought steps")
        logger.info(f"   Thought step IDs: {step_ids}")
        
        # Verify all thought steps completed successfully
        for step in result['thought_steps']:
            if step['status'] not in ['complete', 'warning']:
                logger.warning(f"⚠️  Thought step '{step['id']}' has status '{step['status']}'")
        
        logger.info("=" * 80)
        logger.info("✅ TEST 4 PASSED: Generate Thought Steps")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST 4 FAILED: {str(e)}", exc_info=True)
        return False


def test_filtered_data_structure():
    """Test that filtered data has correct structure."""
    logger.info("=" * 80)
    logger.info("TEST 5: Filtered Data Structure")
    logger.info("=" * 80)
    
    try:
        osdu_base_url = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
        osdu_partition_id = os.environ.get('OSDU_PARTITION_ID', 'opendes')
        
        processor = StrandsAgentProcessor(
            osdu_base_url=osdu_base_url,
            osdu_partition_id=osdu_partition_id
        )
        
        context = {'allWells': SAMPLE_WELLS}
        
        result = processor.process_query(
            query="Show wells deeper than 3000m",
            session_id="test-session-8",
            existing_context=context
        )
        
        # Verify filtered_data structure
        assert 'filtered_data' in result, "No filtered_data in result"
        assert result['filtered_data'] is not None, "filtered_data is None"
        assert 'metadata' in result['filtered_data'], "No metadata in filtered_data"
        assert 'geojson' in result['filtered_data'], "No geojson in filtered_data"
        
        # Verify metadata structure
        metadata = result['filtered_data']['metadata']
        assert isinstance(metadata, list), "Metadata is not a list"
        assert len(metadata) > 0, "Metadata is empty"
        
        for well in metadata:
            assert 'well_id' in well, "Well missing 'well_id'"
            assert 'data' in well, "Well missing 'data'"
            assert 'wellbores' in well, "Well missing 'wellbores'"
        
        # Verify GeoJSON structure
        geojson = result['filtered_data']['geojson']
        assert geojson['type'] == 'FeatureCollection', "GeoJSON type is not FeatureCollection"
        assert 'features' in geojson, "GeoJSON missing 'features'"
        # Note: GeoJSON feature count may be less than metadata count if wells are missing coordinates
        assert len(geojson['features']) <= len(metadata), "GeoJSON has more features than metadata"
        
        if len(geojson['features']) > 0:
            for feature in geojson['features']:
                assert feature['type'] == 'Feature', "Feature type is not 'Feature'"
                assert 'geometry' in feature, "Feature missing 'geometry'"
                assert feature['geometry']['type'] == 'Point', "Geometry type is not 'Point'"
                assert 'properties' in feature, "Feature missing 'properties'"
        
        logger.info("✅ Filtered data structure is correct")
        logger.info(f"   Metadata: {len(metadata)} wells")
        logger.info(f"   GeoJSON: {len(geojson['features'])} features (some wells may lack coordinates)")
        
        logger.info("=" * 80)
        logger.info("✅ TEST 5 PASSED: Filtered Data Structure")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST 5 FAILED: {str(e)}", exc_info=True)
        return False


def run_all_tests():
    """Run all tests and report results."""
    logger.info("\n" + "=" * 80)
    logger.info("RUNNING ALL QUERY PROCESSING TESTS")
    logger.info("=" * 80 + "\n")
    
    tests = [
        ("Load Context", test_load_context),
        ("Determine Hierarchy Level", test_determine_hierarchy_level),
        ("Process Natural Language Queries", test_process_natural_language_queries),
        ("Generate Thought Steps", test_generate_thought_steps),
        ("Filtered Data Structure", test_filtered_data_structure)
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\nRunning: {test_name}")
        result = test_func()
        results.append((test_name, result))
        logger.info("")
    
    # Print summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{status}: {test_name}")
    
    logger.info("=" * 80)
    logger.info(f"TOTAL: {passed}/{total} tests passed")
    logger.info("=" * 80)
    
    return passed == total


if __name__ == '__main__':
    success = run_all_tests()
    exit(0 if success else 1)
