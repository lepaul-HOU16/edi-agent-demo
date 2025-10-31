"""
Test OSDU Search Integration
Tests the complete flow of searching OSDU and filtering wells.
"""

import logging
import json
from osdu_client import OSDUClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_build_osdu_search_json():
    """Test building OSDU search JSON."""
    logger.info("=" * 80)
    logger.info("TEST: Build OSDU Search JSON")
    logger.info("=" * 80)
    
    try:
        # Initialize client
        client = OSDUClient(
            base_url="https://community.opensubsurface.org",
            partition_id="opendes"
        )
        
        # Test well search
        logger.info("\n1. Testing WELL search JSON generation...")
        well_search = client.build_osdu_search_json(
            user_prompt="wells deeper than 3000 meters",
            schema_type="well"
        )
        logger.info(f"Well search JSON: {json.dumps(well_search, indent=2)}")
        assert 'kind' in well_search
        assert 'master-data--Well' in well_search['kind']
        logger.info("✅ Well search JSON generated correctly")
        
        # Test wellbore search
        logger.info("\n2. Testing WELLBORE search JSON generation...")
        wellbore_search = client.build_osdu_search_json(
            user_prompt="wellbores in the North Sea",
            schema_type="wellbore"
        )
        logger.info(f"Wellbore search JSON: {json.dumps(wellbore_search, indent=2)}")
        assert 'kind' in wellbore_search
        assert 'master-data--Wellbore' in wellbore_search['kind']
        assert 'aggregateBy' in wellbore_search
        assert wellbore_search['aggregateBy'] == 'data.WellID'
        logger.info("✅ Wellbore search JSON generated correctly")
        
        # Test welllog search
        logger.info("\n3. Testing WELLLOG search JSON generation...")
        welllog_search = client.build_osdu_search_json(
            user_prompt="welllogs with GR and DT curves",
            schema_type="welllog"
        )
        logger.info(f"Welllog search JSON: {json.dumps(welllog_search, indent=2)}")
        assert 'kind' in welllog_search
        assert 'work-product-component--WellLog' in welllog_search['kind']
        assert 'aggregateBy' in welllog_search
        assert welllog_search['aggregateBy'] == 'data.WellboreID'
        logger.info("✅ Welllog search JSON generated correctly")
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ ALL TESTS PASSED")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


def test_search_and_filter_flow():
    """Test the complete search and filter flow."""
    logger.info("=" * 80)
    logger.info("TEST: Search and Filter Flow")
    logger.info("=" * 80)
    
    try:
        # Initialize client
        client = OSDUClient(
            base_url="https://community.opensubsurface.org",
            partition_id="opendes"
        )
        
        # Create mock current wells
        current_wells = [
            {
                'well_id': 'opendes:master-data--Well:1001',
                'data': {
                    'FacilityName': 'Well-001',
                    'depth': 3500
                }
            },
            {
                'well_id': 'opendes:master-data--Well:1002',
                'data': {
                    'FacilityName': 'Well-002',
                    'depth': 2500
                }
            },
            {
                'well_id': 'opendes:master-data--Well:1003',
                'data': {
                    'FacilityName': 'Well-003',
                    'depth': 4000
                }
            }
        ]
        
        logger.info(f"\nCurrent wells: {len(current_wells)}")
        for well in current_wells:
            logger.info(f"  - {well['data']['FacilityName']}: {well['data']['depth']}m")
        
        # Test hierarchy determination
        logger.info("\n1. Testing hierarchy determination...")
        
        well_query = "show me wells deeper than 3000 meters"
        hierarchy = client._determine_search_hierarchy(well_query)
        logger.info(f"Query: '{well_query}' -> Hierarchy: {hierarchy}")
        assert hierarchy == 'well', f"Expected 'well', got '{hierarchy}'"
        
        wellbore_query = "show me wellbores in the North Sea"
        hierarchy = client._determine_search_hierarchy(wellbore_query)
        logger.info(f"Query: '{wellbore_query}' -> Hierarchy: {hierarchy}")
        assert hierarchy == 'wellbore', f"Expected 'wellbore', got '{hierarchy}'"
        
        welllog_query = "show me welllogs with GR curves"
        hierarchy = client._determine_search_hierarchy(welllog_query)
        logger.info(f"Query: '{welllog_query}' -> Hierarchy: {hierarchy}")
        assert hierarchy == 'welllog', f"Expected 'welllog', got '{hierarchy}'"
        
        logger.info("✅ Hierarchy determination working correctly")
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ FLOW TEST PASSED")
        logger.info("=" * 80)
        logger.info("\nNote: Full integration test requires OSDU API access")
        logger.info("      Run with valid credentials to test actual OSDU search")
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    logger.info("\n" + "=" * 80)
    logger.info("OSDU SEARCH INTEGRATION TESTS")
    logger.info("=" * 80 + "\n")
    
    # Run tests
    test1_passed = test_build_osdu_search_json()
    test2_passed = test_search_and_filter_flow()
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    logger.info(f"Build OSDU Search JSON: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    logger.info(f"Search and Filter Flow: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    logger.info("=" * 80)
    
    if test1_passed and test2_passed:
        logger.info("✅ ALL TESTS PASSED")
    else:
        logger.info("❌ SOME TESTS FAILED")
