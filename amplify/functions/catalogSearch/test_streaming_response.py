"""
Test Streaming Response Handler
Tests the streaming response functionality for natural language queries.
"""

import json
import os
import sys
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from handler import handle_natural_language_query, create_error_response
from s3_session_manager import S3SessionManager


def test_streaming_response_with_thought_steps():
    """Test that streaming response includes thought steps."""
    print("\n" + "=" * 80)
    print("TEST: Streaming Response with Thought Steps")
    print("=" * 80)
    
    # Mock S3SessionManager
    mock_s3_manager = Mock(spec=S3SessionManager)
    mock_s3_manager.get_metadata.side_effect = Exception("No existing data")
    mock_s3_manager.get_next_version.return_value = 1
    mock_s3_manager.get_history.return_value = {'messages': []}
    mock_s3_manager.store_history.return_value = None
    
    # Mock StrandsAgentProcessor
    with patch('handler.StrandsAgentProcessor') as MockAgentProcessor:
        mock_agent = MockAgentProcessor.return_value
        mock_agent.process_query.return_value = {
            'message': 'Found 5 wells matching your criteria',
            'thought_steps': [
                {
                    'id': 'search_osdu',
                    'type': 'search',
                    'title': 'Searching OSDU',
                    'summary': 'Querying OSDU API for wells',
                    'status': 'complete',
                    'timestamp': int(datetime.now().timestamp() * 1000)
                },
                {
                    'id': 'filter_results',
                    'type': 'filter',
                    'title': 'Filtering Results',
                    'summary': 'Applying depth filter > 3000m',
                    'status': 'complete',
                    'timestamp': int(datetime.now().timestamp() * 1000)
                }
            ],
            'filtered_data': {
                'metadata': [
                    {
                        'well_id': 'well-001',
                        'name': 'Test Well 1',
                        'depth': 3500,
                        'wellbores': []
                    }
                ],
                'geojson': {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'geometry': {'type': 'Point', 'coordinates': [-101.0, 35.0]},
                            'properties': {'well_id': 'well-001', 'name': 'Test Well 1'}
                        }
                    ]
                }
            },
            'stats': {
                'wellCount': 5,
                'wellboreCount': 10,
                'welllogCount': 25
            }
        }
        
        # Mock S3 storage operations
        mock_s3_manager.store_metadata.return_value = 'session-123/filtered_well_metadata_001.json'
        mock_s3_manager.store_geojson.return_value = 'session-123/filtered_well_geojson_001.json'
        mock_s3_manager.get_signed_url.side_effect = lambda sid, fname: f'https://s3.amazonaws.com/{sid}/{fname}?signature=abc123'
        
        # Execute handler
        result = handle_natural_language_query(
            prompt='Show wells deeper than 3000m',
            session_id='session-123',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        # Verify response structure
        print("\n✓ Response received")
        assert result['type'] == 'complete', f"Expected type 'complete', got '{result['type']}'"
        print("✓ Response type is 'complete'")
        
        assert 'data' in result, "Response missing 'data' field"
        print("✓ Response has 'data' field")
        
        data = result['data']
        
        # Verify thought steps are present
        assert 'thoughtSteps' in data, "Response missing 'thoughtSteps'"
        print("✓ Response has 'thoughtSteps'")
        
        thought_steps = data['thoughtSteps']
        assert len(thought_steps) > 0, "No thought steps in response"
        print(f"✓ Response has {len(thought_steps)} thought steps")
        
        # Verify initial query analysis thought step
        initial_step = thought_steps[0]
        assert initial_step['id'] == 'query_analysis', f"First thought step should be 'query_analysis', got '{initial_step['id']}'"
        assert initial_step['type'] == 'analysis', f"First thought step type should be 'analysis', got '{initial_step['type']}'"
        assert initial_step['status'] == 'complete', f"First thought step should be 'complete', got '{initial_step['status']}'"
        print("✓ Initial query analysis thought step present and complete")
        
        # Verify agent thought steps are included
        agent_step_ids = [step['id'] for step in thought_steps]
        assert 'search_osdu' in agent_step_ids, "Agent thought step 'search_osdu' not found"
        assert 'filter_results' in agent_step_ids, "Agent thought step 'filter_results' not found"
        print("✓ Agent thought steps included in response")
        
        # Verify storage thought step
        storage_steps = [step for step in thought_steps if step['type'] == 'storage']
        assert len(storage_steps) > 0, "No storage thought step found"
        assert storage_steps[0]['status'] == 'complete', "Storage thought step should be complete"
        print("✓ Storage thought step present and complete")
        
        # Verify files are present (S3 signed URLs)
        assert 'files' in data, "Response missing 'files'"
        assert data['files'] is not None, "Files should not be None"
        assert 'metadata' in data['files'], "Files missing 'metadata' URL"
        assert 'geojson' in data['files'], "Files missing 'geojson' URL"
        print("✓ S3 signed URLs present in response")
        
        # Verify stats are present
        assert 'stats' in data, "Response missing 'stats'"
        assert data['stats']['wellCount'] == 5, f"Expected 5 wells, got {data['stats']['wellCount']}"
        assert data['stats']['wellboreCount'] == 10, f"Expected 10 wellbores, got {data['stats']['wellboreCount']}"
        assert data['stats']['welllogCount'] == 25, f"Expected 25 welllogs, got {data['stats']['welllogCount']}"
        print("✓ Statistics present and correct")
        
        # Verify message is present
        assert 'message' in data, "Response missing 'message'"
        assert len(data['message']) > 0, "Message should not be empty"
        print("✓ Response message present")
        
        print("\n" + "=" * 80)
        print("✅ TEST PASSED: Streaming response with thought steps")
        print("=" * 80)
        return True


def test_streaming_response_error_handling():
    """Test that streaming response handles errors gracefully."""
    print("\n" + "=" * 80)
    print("TEST: Streaming Response Error Handling")
    print("=" * 80)
    
    # Mock S3SessionManager
    mock_s3_manager = Mock(spec=S3SessionManager)
    mock_s3_manager.get_metadata.side_effect = Exception("No existing data")
    
    # Mock StrandsAgentProcessor to raise an error
    with patch('handler.StrandsAgentProcessor') as MockAgentProcessor:
        mock_agent = MockAgentProcessor.return_value
        mock_agent.process_query.side_effect = Exception("Agent processing failed")
        
        # Execute handler
        result = handle_natural_language_query(
            prompt='Show wells',
            session_id='session-123',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        # Verify error response
        print("\n✓ Response received")
        assert result['type'] == 'error', f"Expected type 'error', got '{result['type']}'"
        print("✓ Response type is 'error'")
        
        assert 'error' in result, "Error response missing 'error' field"
        print("✓ Error message present")
        
        assert 'errorType' in result, "Error response missing 'errorType' field"
        assert result['errorType'] == 'AGENT_PROCESSING_ERROR', f"Expected 'AGENT_PROCESSING_ERROR', got '{result['errorType']}'"
        print("✓ Error type is 'AGENT_PROCESSING_ERROR'")
        
        print("\n" + "=" * 80)
        print("✅ TEST PASSED: Streaming response error handling")
        print("=" * 80)
        return True


def test_streaming_response_timeout_handling():
    """Test that streaming response handles timeouts gracefully."""
    print("\n" + "=" * 80)
    print("TEST: Streaming Response Timeout Handling")
    print("=" * 80)
    
    # Mock S3SessionManager
    mock_s3_manager = Mock(spec=S3SessionManager)
    mock_s3_manager.get_metadata.side_effect = Exception("No existing data")
    
    # Mock StrandsAgentProcessor to raise a timeout error
    with patch('handler.StrandsAgentProcessor') as MockAgentProcessor:
        mock_agent = MockAgentProcessor.return_value
        mock_agent.process_query.side_effect = TimeoutError("Agent processing timed out")
        
        # Execute handler
        result = handle_natural_language_query(
            prompt='Show wells',
            session_id='session-123',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        # Verify timeout error response
        print("\n✓ Response received")
        assert result['type'] == 'error', f"Expected type 'error', got '{result['type']}'"
        print("✓ Response type is 'error'")
        
        assert 'error' in result, "Error response missing 'error' field"
        assert 'timed out' in result['error'].lower(), "Error message should mention timeout"
        print("✓ Timeout error message present")
        
        assert 'errorType' in result, "Error response missing 'errorType' field"
        assert result['errorType'] == 'AGENT_TIMEOUT_ERROR', f"Expected 'AGENT_TIMEOUT_ERROR', got '{result['errorType']}'"
        print("✓ Error type is 'AGENT_TIMEOUT_ERROR'")
        
        print("\n" + "=" * 80)
        print("✅ TEST PASSED: Streaming response timeout handling")
        print("=" * 80)
        return True


def test_streaming_response_s3_storage_failure():
    """Test that streaming response continues when S3 storage fails."""
    print("\n" + "=" * 80)
    print("TEST: Streaming Response with S3 Storage Failure")
    print("=" * 80)
    
    # Mock S3SessionManager with storage failures
    mock_s3_manager = Mock(spec=S3SessionManager)
    mock_s3_manager.get_metadata.side_effect = Exception("No existing data")
    mock_s3_manager.get_next_version.return_value = 1
    mock_s3_manager.store_metadata.side_effect = Exception("S3 storage failed")
    mock_s3_manager.store_geojson.side_effect = Exception("S3 storage failed")
    mock_s3_manager.get_signed_url.side_effect = Exception("Cannot generate URL")
    mock_s3_manager.get_history.return_value = {'messages': []}
    mock_s3_manager.store_history.return_value = None
    
    # Mock StrandsAgentProcessor
    with patch('handler.StrandsAgentProcessor') as MockAgentProcessor:
        mock_agent = MockAgentProcessor.return_value
        mock_agent.process_query.return_value = {
            'message': 'Found 3 wells',
            'thought_steps': [],
            'filtered_data': {
                'metadata': [{'well_id': 'well-001'}],
                'geojson': {'type': 'FeatureCollection', 'features': []}
            },
            'stats': {'wellCount': 3, 'wellboreCount': 0, 'welllogCount': 0}
        }
        
        # Execute handler
        result = handle_natural_language_query(
            prompt='Show wells',
            session_id='session-123',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        # Verify response is still successful despite S3 failures
        print("\n✓ Response received")
        assert result['type'] == 'complete', f"Expected type 'complete', got '{result['type']}'"
        print("✓ Response type is 'complete' (graceful degradation)")
        
        # Verify thought steps include storage warning
        thought_steps = result['data']['thoughtSteps']
        storage_steps = [step for step in thought_steps if step['type'] == 'storage']
        assert len(storage_steps) > 0, "Storage thought step should be present"
        assert storage_steps[0]['status'] in ['warning', 'error'], "Storage step should indicate failure"
        print("✓ Storage failure indicated in thought steps")
        
        # Verify files may be None or missing
        files = result['data'].get('files')
        if files is not None:
            print("✓ Files field present (may be None or have warnings)")
        else:
            print("✓ Files field is None (expected due to S3 failure)")
        
        # Verify stats are still present
        assert 'stats' in result['data'], "Stats should still be present"
        print("✓ Statistics still present despite S3 failure")
        
        print("\n" + "=" * 80)
        print("✅ TEST PASSED: Streaming response with S3 storage failure (graceful degradation)")
        print("=" * 80)
        return True


def test_streaming_response_session_history_update():
    """Test that streaming response updates session history."""
    print("\n" + "=" * 80)
    print("TEST: Streaming Response Updates Session History")
    print("=" * 80)
    
    # Mock S3SessionManager
    mock_s3_manager = Mock(spec=S3SessionManager)
    mock_s3_manager.get_metadata.side_effect = Exception("No existing data")
    mock_s3_manager.get_next_version.return_value = 1
    mock_s3_manager.get_history.return_value = {'messages': []}
    
    # Track history updates
    history_updates = []
    def capture_history(session_id, history):
        history_updates.append(history)
    mock_s3_manager.store_history.side_effect = capture_history
    
    # Mock StrandsAgentProcessor
    with patch('handler.StrandsAgentProcessor') as MockAgentProcessor:
        mock_agent = MockAgentProcessor.return_value
        mock_agent.process_query.return_value = {
            'message': 'Query processed',
            'thought_steps': [],
            'filtered_data': None,
            'stats': {'wellCount': 0, 'wellboreCount': 0, 'welllogCount': 0}
        }
        
        # Execute handler
        result = handle_natural_language_query(
            prompt='Test query',
            session_id='session-123',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        # Verify history was updated
        print("\n✓ Response received")
        assert len(history_updates) > 0, "Session history should be updated"
        print("✓ Session history update called")
        
        history = history_updates[0]
        assert 'messages' in history, "History should have 'messages' field"
        assert len(history['messages']) == 2, f"Expected 2 messages (user + ai), got {len(history['messages'])}"
        print("✓ History contains user and AI messages")
        
        # Verify user message
        user_msg = history['messages'][0]
        assert user_msg['role'] == 'user', f"First message should be from user, got '{user_msg['role']}'"
        assert user_msg['content'] == 'Test query', f"User message content mismatch"
        print("✓ User message recorded correctly")
        
        # Verify AI message
        ai_msg = history['messages'][1]
        assert ai_msg['role'] == 'ai', f"Second message should be from AI, got '{ai_msg['role']}'"
        assert 'stats' in ai_msg, "AI message should include stats"
        print("✓ AI message recorded correctly")
        
        print("\n" + "=" * 80)
        print("✅ TEST PASSED: Streaming response updates session history")
        print("=" * 80)
        return True


if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("STREAMING RESPONSE HANDLER TEST SUITE")
    print("=" * 80)
    
    tests = [
        test_streaming_response_with_thought_steps,
        test_streaming_response_error_handling,
        test_streaming_response_timeout_handling,
        test_streaming_response_s3_storage_failure,
        test_streaming_response_session_history_update
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except AssertionError as e:
            print(f"\n❌ TEST FAILED: {test.__name__}")
            print(f"   Assertion Error: {str(e)}")
            failed += 1
        except Exception as e:
            print(f"\n❌ TEST FAILED: {test.__name__}")
            print(f"   Unexpected Error: {str(e)}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 80)
    print("TEST SUITE SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n✅ ALL TESTS PASSED")
    else:
        print(f"\n❌ {failed} TEST(S) FAILED")
    
    print("=" * 80)
    
    sys.exit(0 if failed == 0 else 1)
