"""
Unit tests for S3SessionManager
Tests session cleanup and reset functionality
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from s3_session_manager import S3SessionManager


class TestS3SessionManagerReset(unittest.TestCase):
    """Test suite for S3SessionManager reset and versioning functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.bucket_name = 'test-catalog-bucket'
        self.session_id = 'test-session-123'
        
    @patch('s3_session_manager.boto3.client')
    def test_reset_session_deletes_filtered_files(self, mock_boto_client):
        """Test that reset_session deletes filtered files"""
        # Setup mock S3 client
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3
        
        # Mock list_objects_v2 response with filtered files
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'{self.session_id}/all_well_metadata.json'},
                {'Key': f'{self.session_id}/all_well_geojson.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_001.json'},
                {'Key': f'{self.session_id}/filtered_well_geojson_001.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_002.json'},
                {'Key': f'{self.session_id}/filtered_well_geojson_002.json'},
                {'Key': f'{self.session_id}/session_history.json'},
            ]
        }
        
        # Create manager and reset session
        manager = S3SessionManager(self.bucket_name)
        manager.reset_session(self.session_id, keep_all_files=True)
        
        # Verify filtered files were deleted
        delete_calls = [call[1]['Key'] for call in mock_s3.delete_object.call_args_list]
        
        # Should delete filtered files and history
        assert f'{self.session_id}/filtered_well_metadata_001.json' in delete_calls
        assert f'{self.session_id}/filtered_well_geojson_001.json' in delete_calls
        assert f'{self.session_id}/filtered_well_metadata_002.json' in delete_calls
        assert f'{self.session_id}/filtered_well_geojson_002.json' in delete_calls
        assert f'{self.session_id}/session_history.json' in delete_calls
        
        # Should NOT delete all_well_* files
        assert f'{self.session_id}/all_well_metadata.json' not in delete_calls
        assert f'{self.session_id}/all_well_geojson.json' not in delete_calls
        
        # Verify history was cleared (store_history called with empty messages)
        mock_s3.put_object.assert_called()
        
    @patch('s3_session_manager.boto3.client')
    def test_reset_session_preserves_all_well_files(self, mock_boto_client):
        """Test that reset_session preserves all_well_* files when keep_all_files=True"""
        # Setup mock S3 client
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3
        
        # Mock list_objects_v2 response
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'{self.session_id}/all_well_metadata.json'},
                {'Key': f'{self.session_id}/all_well_geojson.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_001.json'},
            ]
        }
        
        # Create manager and reset session
        manager = S3SessionManager(self.bucket_name)
        manager.reset_session(self.session_id, keep_all_files=True)
        
        # Verify all_well_* files were NOT deleted
        delete_calls = [call[1]['Key'] for call in mock_s3.delete_object.call_args_list]
        assert f'{self.session_id}/all_well_metadata.json' not in delete_calls
        assert f'{self.session_id}/all_well_geojson.json' not in delete_calls
        
    @patch('s3_session_manager.boto3.client')
    def test_reset_session_clears_history(self, mock_boto_client):
        """Test that reset_session clears session_history.json"""
        # Setup mock S3 client
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3
        
        # Mock list_objects_v2 response
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'{self.session_id}/session_history.json'},
            ]
        }
        
        # Create manager and reset session
        manager = S3SessionManager(self.bucket_name)
        manager.reset_session(self.session_id, keep_all_files=True)
        
        # Verify store_history was called to clear history
        # Check that put_object was called with empty messages
        put_object_calls = mock_s3.put_object.call_args_list
        assert len(put_object_calls) > 0
        
        # Find the call that stores history
        history_call = None
        for call in put_object_calls:
            if 'session_history.json' in call[1].get('Key', ''):
                history_call = call
                break
        
        assert history_call is not None, "store_history should be called to clear history"
        
    @patch('s3_session_manager.boto3.client')
    def test_get_next_version_returns_1_for_new_session(self, mock_boto_client):
        """Test that get_next_version returns 1 for a new session with no filtered files"""
        # Setup mock S3 client
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3
        
        # Mock empty list_objects_v2 response (no filtered files)
        mock_s3.list_objects_v2.return_value = {
            'Contents': []
        }
        
        # Create manager and get next version
        manager = S3SessionManager(self.bucket_name)
        next_version = manager.get_next_version(self.session_id)
        
        # Should return 1 for new session
        assert next_version == 1
        
    @patch('s3_session_manager.boto3.client')
    def test_get_next_version_increments_correctly(self, mock_boto_client):
        """Test that get_next_version increments version numbers correctly"""
        # Setup mock S3 client
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3
        
        # Mock list_objects_v2 response with existing filtered files
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'{self.session_id}/filtered_well_metadata_001.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_002.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_003.json'},
            ]
        }
        
        # Create manager and get next version
        manager = S3SessionManager(self.bucket_name)
        next_version = manager.get_next_version(self.session_id)
        
        # Should return 4 (max version 3 + 1)
        assert next_version == 4
        
    @patch('s3_session_manager.boto3.client')
    def test_get_next_version_handles_gaps_in_versions(self, mock_boto_client):
        """Test that get_next_version handles gaps in version numbers"""
        # Setup mock S3 client
        mock_s3 = Mock()
        mock_boto_client.return_value = mock_s3
        
        # Mock list_objects_v2 response with gaps in version numbers
        mock_s3.list_objects_v2.return_value = {
            'Contents': [
                {'Key': f'{self.session_id}/filtered_well_metadata_001.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_005.json'},
                {'Key': f'{self.session_id}/filtered_well_metadata_003.json'},
            ]
        }
        
        # Create manager and get next version
        manager = S3SessionManager(self.bucket_name)
        next_version = manager.get_next_version(self.session_id)
        
        # Should return 6 (max version 5 + 1)
        assert next_version == 6


if __name__ == '__main__':
    unittest.main()
