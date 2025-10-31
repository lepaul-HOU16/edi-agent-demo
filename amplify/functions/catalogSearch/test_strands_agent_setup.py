"""
Test Strands Agent Setup
Tests the initialization and configuration of Strands Agent with OSDU tools.
"""

import os
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set environment variables for testing (using actual Lambda credentials)
os.environ['OSDU_BASE_URL'] = 'https://osdu.vavourak.people.aws.dev'
os.environ['OSDU_PARTITION_ID'] = 'osdu'
os.environ['EDI_USERNAME'] = 'edi-user'
os.environ['EDI_PASSWORD'] = 'Asd!1edi'
os.environ['EDI_CLIENT_ID'] = '7se4hblptk74h59ghbb694ovj4'
os.environ['EDI_CLIENT_SECRET'] = 'k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi'
os.environ['COGNITO_REGION'] = 'us-east-1'
os.environ['STRANDS_AGENT_MODEL'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0'

def test_strands_agent_initialization():
    """Test that Strands Agent processor initializes correctly."""
    logger.info("=" * 80)
    logger.info("TEST: Strands Agent Initialization")
    logger.info("=" * 80)
    
    try:
        from strands_agent_processor import StrandsAgentProcessor
        
        # Initialize processor
        logger.info("Initializing Strands Agent processor...")
        processor = StrandsAgentProcessor(
            osdu_base_url=os.environ['OSDU_BASE_URL'],
            osdu_partition_id=os.environ['OSDU_PARTITION_ID']
        )
        
        logger.info("✅ Strands Agent processor initialized successfully")
        
        # Check that components are initialized
        assert processor.osdu_client is not None, "OSDU client should be initialized"
        assert processor.transformer is not None, "Transformer should be initialized"
        logger.info("✅ OSDU client and transformer initialized")
        
        # Check that agent is initialized (may be None if strands_agents not available)
        if processor.agent is not None:
            logger.info("✅ Strands Agent initialized")
        else:
            logger.warning("⚠️  Strands Agent not available (fallback mode)")
        
        logger.info("=" * 80)
        logger.info("✅ TEST PASSED: Strands Agent Setup")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


def test_tools_creation():
    """Test that OSDU tools are created correctly."""
    logger.info("=" * 80)
    logger.info("TEST: OSDU Tools Creation")
    logger.info("=" * 80)
    
    try:
        from strands_agent_processor import StrandsAgentProcessor
        
        # Initialize processor
        processor = StrandsAgentProcessor(
            osdu_base_url=os.environ['OSDU_BASE_URL'],
            osdu_partition_id=os.environ['OSDU_PARTITION_ID']
        )
        
        # Test tool creation methods
        logger.info("Creating OSDU tools...")
        
        analyze_query_tool = processor._create_search_osdu_tool()
        logger.info("✅ analyze_query tool created")
        
        filter_wells_tool = processor._create_filter_wells_tool()
        logger.info("✅ filter_wells_by_criteria tool created")
        
        transform_tool = processor._create_transform_to_geojson_tool()
        logger.info("✅ transform_to_geojson tool created")
        
        stats_tool = processor._create_calculate_statistics_tool()
        logger.info("✅ calculate_statistics tool created")
        
        logger.info("=" * 80)
        logger.info("✅ TEST PASSED: OSDU Tools Creation")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


def test_helper_methods():
    """Test helper methods for filtering and statistics."""
    logger.info("=" * 80)
    logger.info("TEST: Helper Methods")
    logger.info("=" * 80)
    
    try:
        from strands_agent_processor import StrandsAgentProcessor
        
        # Initialize processor
        processor = StrandsAgentProcessor(
            osdu_base_url=os.environ['OSDU_BASE_URL'],
            osdu_partition_id=os.environ['OSDU_PARTITION_ID']
        )
        
        # Test data
        test_wells = [
            {
                'well_id': 'well-001',
                'data': {
                    'FacilityName': 'Test Well 001',
                    'depth': 3500,
                    'operator': 'Test Company',
                    'type': 'Oil'
                },
                'wellbores': [
                    {
                        'wellbore_id': 'wellbore-001',
                        'welllogs': [
                            {'welllog_id': 'log-001'},
                            {'welllog_id': 'log-002'}
                        ]
                    }
                ]
            },
            {
                'well_id': 'well-002',
                'data': {
                    'FacilityName': 'Test Well 002',
                    'depth': 2500,
                    'operator': 'Test Company',
                    'type': 'Gas'
                },
                'wellbores': []
            }
        ]
        
        # Test calculate_stats
        logger.info("Testing _calculate_stats...")
        stats = processor._calculate_stats(test_wells)
        assert stats['wellCount'] == 2, f"Expected 2 wells, got {stats['wellCount']}"
        assert stats['wellboreCount'] == 1, f"Expected 1 wellbore, got {stats['wellboreCount']}"
        assert stats['welllogCount'] == 2, f"Expected 2 welllogs, got {stats['welllogCount']}"
        logger.info(f"✅ Statistics calculated correctly: {stats}")
        
        # Test apply_filters with depth
        logger.info("Testing _apply_filters with depth criteria...")
        filtered = processor._apply_filters(test_wells, {'depth': {'min': 3000}})
        assert len(filtered) == 1, f"Expected 1 well with depth > 3000, got {len(filtered)}"
        assert filtered[0]['well_id'] == 'well-001', "Wrong well filtered"
        logger.info("✅ Depth filter works correctly")
        
        # Test apply_filters with name
        logger.info("Testing _apply_filters with name criteria...")
        filtered = processor._apply_filters(test_wells, {'name': '002'})
        assert len(filtered) == 1, f"Expected 1 well with '002' in name, got {len(filtered)}"
        assert filtered[0]['well_id'] == 'well-002', "Wrong well filtered"
        logger.info("✅ Name filter works correctly")
        
        logger.info("=" * 80)
        logger.info("✅ TEST PASSED: Helper Methods")
        logger.info("=" * 80)
        return True
        
    except Exception as e:
        logger.error(f"❌ TEST FAILED: {str(e)}", exc_info=True)
        return False


if __name__ == '__main__':
    logger.info("\n" + "=" * 80)
    logger.info("STRANDS AGENT SETUP TEST SUITE")
    logger.info("=" * 80 + "\n")
    
    results = []
    
    # Run tests
    results.append(("Initialization", test_strands_agent_initialization()))
    results.append(("Tools Creation", test_tools_creation()))
    results.append(("Helper Methods", test_helper_methods()))
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info("=" * 80)
    logger.info(f"TOTAL: {passed}/{total} tests passed")
    logger.info("=" * 80)
    
    sys.exit(0 if passed == total else 1)
