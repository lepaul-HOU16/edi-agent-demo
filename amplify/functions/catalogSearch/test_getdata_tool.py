"""
Test the get_all_osdu_data Strands tool.

This test verifies that the Strands agent can understand natural language
queries like "show all data" and execute the get_all_osdu_data tool.
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set environment variables for testing
os.environ['OSDU_BASE_URL'] = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
os.environ['OSDU_PARTITION_ID'] = os.environ.get('OSDU_PARTITION_ID', 'opendes')
os.environ['CATALOG_S3_BUCKET'] = os.environ.get('CATALOG_S3_BUCKET', 'test-bucket')

from strands_agent_processor import StrandsAgentProcessor


def test_getdata_tool_directly():
    """
    Test the get_all_osdu_data tool directly.
    """
    logger.info("=" * 80)
    logger.info("TEST: get_all_osdu_data Tool Direct Invocation")
    logger.info("=" * 80)
    
    try:
        # Initialize processor
        processor = StrandsAgentProcessor(
            osdu_base_url=os.environ['OSDU_BASE_URL'],
            osdu_partition_id=os.environ['OSDU_PARTITION_ID']
        )
        
        # Get the tool
        getdata_tool = processor._create_getdata_tool()
        
        # Call the tool directly
        logger.info("Calling get_all_osdu_data tool...")
        result = getdata_tool(session_id="test-session-123")
        
        # Verify result
        logger.info("=" * 80)
        logger.info("RESULT:")
        logger.info(f"  Message: {result.get('message')}")
        logger.info(f"  Stats: {result.get('stats')}")
        logger.info(f"  Wells count: {len(result.get('wells', []))}")
        logger.info(f"  GeoJSON features: {len(result.get('geojson', {}).get('features', []))}")
        logger.info("=" * 80)
        
        # Assertions
        assert 'wells' in result, "Result should contain 'wells'"
        assert 'geojson' in result, "Result should contain 'geojson'"
        assert 'stats' in result, "Result should contain 'stats'"
        assert 'message' in result, "Result should contain 'message'"
        
        stats = result['stats']
        assert 'wellCount' in stats, "Stats should contain 'wellCount'"
        assert 'wellboreCount' in stats, "Stats should contain 'wellboreCount'"
        assert 'welllogCount' in stats, "Stats should contain 'welllogCount'"
        
        logger.info("✅ TEST PASSED: get_all_osdu_data tool works correctly")
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


def test_natural_language_query():
    """
    Test natural language queries that should trigger the get_all_osdu_data tool.
    """
    logger.info("=" * 80)
    logger.info("TEST: Natural Language Query Processing")
    logger.info("=" * 80)
    
    test_queries = [
        "show all data",
        "show all wells",
        "load all wells",
        "get all data",
        "fetch all wells",
        "display all wells"
    ]
    
    try:
        # Initialize processor
        processor = StrandsAgentProcessor(
            osdu_base_url=os.environ['OSDU_BASE_URL'],
            osdu_partition_id=os.environ['OSDU_PARTITION_ID']
        )
        
        for query in test_queries:
            logger.info(f"\nTesting query: '{query}'")
            
            # Process query (without existing context, so it should fetch from OSDU)
            result = processor.process_query(
                query=query,
                session_id="test-session-123",
                existing_context=None
            )
            
            logger.info(f"  Message: {result.get('message')}")
            logger.info(f"  Stats: {result.get('stats')}")
            logger.info(f"  Thought steps: {len(result.get('thought_steps', []))}")
            
            # Verify result structure
            assert 'message' in result, f"Result should contain 'message' for query: {query}"
            assert 'stats' in result, f"Result should contain 'stats' for query: {query}"
            
            logger.info(f"  ✓ Query processed successfully")
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ TEST PASSED: All natural language queries processed correctly")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


def main():
    """
    Run all tests.
    """
    logger.info("\n" + "=" * 80)
    logger.info("TESTING get_all_osdu_data STRANDS TOOL")
    logger.info("=" * 80 + "\n")
    
    results = []
    
    # Test 1: Direct tool invocation
    results.append(("Direct Tool Invocation", test_getdata_tool_directly()))
    
    # Test 2: Natural language query processing
    # Note: This requires Strands Agents to be installed
    # results.append(("Natural Language Queries", test_natural_language_query()))
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        logger.info("\n🎉 ALL TESTS PASSED!")
    else:
        logger.info("\n⚠️  SOME TESTS FAILED")
    
    logger.info("=" * 80 + "\n")
    
    return all_passed


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
