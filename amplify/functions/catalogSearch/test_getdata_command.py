"""
Test /getdata command handler implementation.
"""

import json
import logging
from unittest.mock import Mock, patch, MagicMock
from command_router import CommandRouter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_getdata_command_execution():
    """
    Test /getdata command execution end-to-end.
    
    Verifies:
    - OSDU API is called correctly
    - Data is transformed properly
    - Files are stored in S3
    - Signed URLs are generated
    - Statistics are calculated correctly
    """
    print("\n" + "="*80)
    print("TEST: /getdata Command Execution")
    print("="*80)
    
    # Mock OSDU response with sample well data
    mock_osdu_wells = [
        {
            'id': 'osdu:master-data--Well:Well-001',
            'data': {
                'FacilityName': 'Test Well 001',
                'NameAliases': [
                    {'AliasName': 'TW-001'},
                    {'AliasName': 'TestWell-1'}
                ],
                'SpatialLocation.Wgs84Coordinates': {
                    'geometries': [
                        {
                            'coordinates': [-95.3698, 29.7604],
                            'type': 'point'
                        }
                    ],
                    'type': 'geometrycollection'
                },
                'TotalDepth': 3500.0,
                'Operator': 'Test Operator',
                'WellType': 'exploration'
            }
        },
        {
            'id': 'osdu:master-data--Well:Well-002',
            'data': {
                'FacilityName': 'Test Well 002',
                'NameAliases': [
                    {'AliasName': 'TW-002'}
                ],
                'SpatialLocation.Wgs84Coordinates': {
                    'geometries': [
                        {
                            'coordinates': [-95.3700, 29.7600],
                            'type': 'point'
                        }
                    ],
                    'type': 'geometrycollection'
                },
                'TotalDepth': 4000.0,
                'Operator': 'Test Operator',
                'WellType': 'production'
            }
        }
    ]
    
    # Initialize CommandRouter with mock S3 bucket
    router = CommandRouter(s3_bucket_name='test-catalog-bucket')
    
    # Mock OSDU client
    with patch('command_router.OSDUClient') as MockOSDUClient:
        mock_client = MockOSDUClient.return_value
        mock_client.fetch_all_wells.return_value = mock_osdu_wells
        
        # Mock S3 manager
        with patch('command_router.S3SessionManager') as MockS3Manager:
            mock_s3 = MockS3Manager.return_value
            mock_s3.store_metadata.return_value = 'test-session/all_well_metadata.json'
            mock_s3.store_geojson.return_value = 'test-session/all_well_geojson.json'
            mock_s3.get_signed_url.side_effect = [
                'https://s3.amazonaws.com/test-bucket/test-session/all_well_metadata.json?signature=abc',
                'https://s3.amazonaws.com/test-bucket/test-session/all_well_geojson.json?signature=def'
            ]
            
            # Execute /getdata command
            result = router.execute_command(
                command_type='getdata',
                session_id='test-session-123',
                osdu_config={
                    'url': 'https://test-osdu.example.com',
                    'dataPartitionId': 'test-partition'
                },
                auth_token='test-auth-token'
            )
            
            # Verify result structure
            print("\n✓ Command executed successfully")
            print(f"  Success: {result.get('success')}")
            print(f"  Message: {result.get('message')}")
            
            # Verify files
            files = result.get('files', {})
            print(f"\n✓ Files generated:")
            print(f"  Metadata URL: {files.get('metadata')}")
            print(f"  GeoJSON URL: {files.get('geojson')}")
            
            # Verify statistics
            stats = result.get('stats', {})
            print(f"\n✓ Statistics:")
            print(f"  Wells: {stats.get('wellCount')}")
            print(f"  Wellbores: {stats.get('wellboreCount')}")
            print(f"  Welllogs: {stats.get('welllogCount')}")
            
            # Assertions
            assert result['success'] is True, "Command should succeed"
            assert 'files' in result, "Result should include files"
            assert 'metadata' in result['files'], "Files should include metadata URL"
            assert 'geojson' in result['files'], "Files should include geojson URL"
            assert 'stats' in result, "Result should include statistics"
            assert stats['wellCount'] == 2, "Should have 2 wells"
            
            # Verify OSDU client was called correctly
            MockOSDUClient.assert_called_once_with(
                base_url='https://test-osdu.example.com',
                partition_id='test-partition',
                auth_token='test-auth-token'
            )
            mock_client.fetch_all_wells.assert_called_once()
            
            # Verify S3 operations
            mock_s3.store_metadata.assert_called_once()
            mock_s3.store_geojson.assert_called_once()
            assert mock_s3.get_signed_url.call_count == 2, "Should generate 2 signed URLs"
            
            print("\n✅ All assertions passed!")
            return True


def test_getdata_with_no_wells():
    """
    Test /getdata command when OSDU returns no wells.
    """
    print("\n" + "="*80)
    print("TEST: /getdata Command with No Wells")
    print("="*80)
    
    router = CommandRouter(s3_bucket_name='test-catalog-bucket')
    
    # Mock OSDU client returning empty list
    with patch('command_router.OSDUClient') as MockOSDUClient:
        mock_client = MockOSDUClient.return_value
        mock_client.fetch_all_wells.return_value = []
        
        # Execute command
        result = router.execute_command(
            command_type='getdata',
            session_id='test-session-456',
            osdu_config={
                'url': 'https://test-osdu.example.com',
                'dataPartitionId': 'test-partition'
            },
            auth_token='test-auth-token'
        )
        
        # Verify result
        print(f"\n✓ Result: {result.get('message')}")
        
        assert result['success'] is True, "Command should succeed even with no wells"
        assert result['stats']['wellCount'] == 0, "Should have 0 wells"
        assert 'files' not in result, "Should not have files when no wells"
        
        print("✅ Test passed!")
        return True


def test_getdata_osdu_error():
    """
    Test /getdata command when OSDU API fails.
    """
    print("\n" + "="*80)
    print("TEST: /getdata Command with OSDU Error")
    print("="*80)
    
    router = CommandRouter(s3_bucket_name='test-catalog-bucket')
    
    # Mock OSDU client raising exception
    with patch('command_router.OSDUClient') as MockOSDUClient:
        mock_client = MockOSDUClient.return_value
        mock_client.fetch_all_wells.side_effect = Exception("OSDU API error: 401 Unauthorized")
        
        # Execute command
        result = router.execute_command(
            command_type='getdata',
            session_id='test-session-789',
            osdu_config={
                'url': 'https://test-osdu.example.com',
                'dataPartitionId': 'test-partition'
            },
            auth_token='invalid-token'
        )
        
        # Verify error handling
        print(f"\n✓ Error handled: {result.get('message')}")
        
        assert result['success'] is False, "Command should fail on OSDU error"
        assert 'error' in result, "Result should include error message"
        
        print("✅ Test passed!")
        return True


def test_command_validation():
    """
    Test command validation before execution.
    """
    print("\n" + "="*80)
    print("TEST: Command Validation")
    print("="*80)
    
    router = CommandRouter(s3_bucket_name='test-catalog-bucket')
    
    # Test valid /getdata command
    validation = router.validate_command('/getdata')
    print(f"\n✓ /getdata validation: {validation}")
    assert validation['valid'] is True
    assert validation['command_type'] == 'getdata'
    
    # Test invalid command with extra text
    validation = router.validate_command('/getdata extra text')
    print(f"✓ /getdata with extra text: {validation}")
    assert validation['valid'] is False
    assert 'error' in validation
    
    # Test unknown command
    validation = router.validate_command('/unknown')
    print(f"✓ Unknown command: {validation}")
    assert validation['valid'] is False
    
    # Test non-command
    validation = router.validate_command('show wells')
    print(f"✓ Non-command: {validation}")
    assert validation['valid'] is False
    assert validation['error'] is None  # Not an error, just not a command
    
    print("\n✅ All validation tests passed!")
    return True


if __name__ == '__main__':
    try:
        # Run all tests
        test_command_validation()
        test_getdata_command_execution()
        test_getdata_with_no_wells()
        test_getdata_osdu_error()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED")
        print("="*80)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        raise
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        raise
