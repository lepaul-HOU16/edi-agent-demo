"""
Test Error Handling and Logging
Tests comprehensive error handling for OSDU API, S3, and Strands Agent errors.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import json
from handler import (
    lambda_handler,
    handle_getdata_command,
    handle_reset_command,
    handle_natural_language_query,
    create_error_response
)


class TestErrorHandling(unittest.TestCase):
    """Test error handling and logging functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_context = Mock()
        self.mock_context.request_id = 'test-request-123'
        self.mock_context.function_name = 'catalogSearchHandler'
        self.mock_context.memory_limit_in_mb = 512
        self.mock_context.get_remaining_time_in_millis = Mock(return_value=30000)
        
        self.valid_event = {
            'arguments': {
                'prompt': '/getdata',
                'sessionId': 'test-session-123',
                'existingContext': None
            }
        }
    
    def test_create_error_response_structure(self):
        """Test error response structure."""
        error_msg = "Test error message"
        error_type = "TEST_ERROR"
        
        response = create_error_response(error_msg, error_type)
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['error'], error_msg)
        self.assertEqual(response['errorType'], error_type)
        self.assertIn('timestamp', response)
        self.assertIsInstance(response['timestamp'], int)
    
    def test_create_error_response_default_type(self):
        """Test error response with default error type."""
        error_msg = "Test error"
        
        response = create_error_response(error_msg)
        
        self.assertEqual(response['errorType'], 'GENERAL_ERROR')
    
    def test_validation_error_missing_prompt(self):
        """Test validation error for missing prompt."""
        event = {
            'arguments': {
                'sessionId': 'test-session',
                'existingContext': None
            }
        }
        
        response = lambda_handler(event, self.mock_context)
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'VALIDATION_ERROR')
        self.assertIn('prompt', response['error'])
    
    def test_validation_error_missing_session_id(self):
        """Test validation error for missing sessionId."""
        event = {
            'arguments': {
                'prompt': '/getdata',
                'existingContext': None
            }
        }
        
        response = lambda_handler(event, self.mock_context)
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'VALIDATION_ERROR')
        self.assertIn('sessionId', response['error'])
    
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': ''})
    def test_s3_config_error(self):
        """Test S3 configuration error."""
        response = lambda_handler(self.valid_event, self.mock_context)
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'S3_CONFIG_ERROR')
        self.assertIn('S3 bucket not configured', response['error'])
    
    @patch('handler.S3_BUCKET', 'test-bucket')
    @patch('handler.S3SessionManager')
    @patch('handler.CommandRouter')
    def test_component_init_error(self, mock_router, mock_s3):
        """Test component initialization error."""
        mock_s3.side_effect = Exception("S3 init failed")
        
        response = lambda_handler(self.valid_event, self.mock_context)
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'INIT_ERROR')
        self.assertIn('Initialization error', response['error'])
    
    @patch('handler.OSDUClient')
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_osdu_auth_error_401(self, mock_osdu_client):
        """Test OSDU authentication error (401)."""
        mock_client = Mock()
        mock_client.fetch_all_wells.side_effect = Exception("401 authentication failed")
        mock_osdu_client.return_value = mock_client
        
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        
        response = handle_getdata_command(
            session_id='test-session',
            osdu_instance={'url': 'https://test.com', 'dataPartitionId': 'test'},
            auth_token='invalid-token',
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'OSDU_AUTH_ERROR')
        self.assertIn('authentication failed', response['error'])
    
    @patch('handler.OSDUClient')
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_osdu_not_found_error_404(self, mock_osdu_client):
        """Test OSDU endpoint not found error (404)."""
        mock_client = Mock()
        mock_client.fetch_all_wells.side_effect = Exception("404 not found")
        mock_osdu_client.return_value = mock_client
        
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        
        response = handle_getdata_command(
            session_id='test-session',
            osdu_instance={'url': 'https://invalid.com', 'dataPartitionId': 'test'},
            auth_token='token',
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'OSDU_NOT_FOUND_ERROR')
        self.assertIn('not found', response['error'])
    
    @patch('handler.OSDUClient')
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_osdu_timeout_error(self, mock_osdu_client):
        """Test OSDU timeout error."""
        mock_client = Mock()
        mock_client.fetch_all_wells.side_effect = Exception("Request timeout")
        mock_osdu_client.return_value = mock_client
        
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        
        response = handle_getdata_command(
            session_id='test-session',
            osdu_instance={'url': 'https://test.com', 'dataPartitionId': 'test'},
            auth_token='token',
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'OSDU_TIMEOUT_ERROR')
        self.assertIn('timed out', response['error'])
    
    @patch('handler.OSDUClient')
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_osdu_connection_error(self, mock_osdu_client):
        """Test OSDU connection error."""
        mock_client = Mock()
        mock_client.fetch_all_wells.side_effect = Exception("Connection refused")
        mock_osdu_client.return_value = mock_client
        
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        
        response = handle_getdata_command(
            session_id='test-session',
            osdu_instance={'url': 'https://test.com', 'dataPartitionId': 'test'},
            auth_token='token',
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'OSDU_CONNECTION_ERROR')
        self.assertIn('connect', response['error'])
    
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_s3_reset_permission_error(self):
        """Test S3 permission error during reset."""
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        mock_s3_manager.reset_session.side_effect = Exception("AccessDenied: permission denied")
        
        response = handle_reset_command(
            session_id='test-session',
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'S3_PERMISSION_ERROR')
        self.assertIn('Permission denied', response['error'])
    
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_s3_bucket_not_found_error(self):
        """Test S3 bucket not found error."""
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        mock_s3_manager.reset_session.side_effect = Exception("NoSuchBucket")
        
        response = handle_reset_command(
            session_id='test-session',
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'S3_BUCKET_ERROR')
        self.assertIn('bucket not found', response['error'])
    
    @patch('handler.StrandsAgentProcessor')
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_agent_init_error(self, mock_agent_processor):
        """Test Strands Agent initialization error."""
        mock_agent_processor.side_effect = Exception("Agent init failed")
        
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        
        response = handle_natural_language_query(
            prompt='show wells',
            session_id='test-session',
            osdu_instance={'url': 'https://test.com', 'dataPartitionId': 'test'},
            auth_token='token',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'AGENT_INIT_ERROR')
        self.assertIn('initialize AI agent', response['error'])
    
    @patch('handler.StrandsAgentProcessor')
    @patch.dict('os.environ', {'CATALOG_S3_BUCKET': 'test-bucket'})
    def test_agent_timeout_error(self, mock_agent_processor):
        """Test Strands Agent timeout error."""
        mock_processor = Mock()
        mock_processor.process_query.side_effect = Exception("Agent timeout")
        mock_agent_processor.return_value = mock_processor
        
        from s3_session_manager import S3SessionManager
        mock_s3_manager = Mock(spec=S3SessionManager)
        mock_s3_manager.get_metadata.side_effect = Exception("No metadata")
        
        response = handle_natural_language_query(
            prompt='show wells',
            session_id='test-session',
            osdu_instance={'url': 'https://test.com', 'dataPartitionId': 'test'},
            auth_token='token',
            existing_context=None,
            s3_manager=mock_s3_manager
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'AGENT_TIMEOUT_ERROR')
        self.assertIn('timed out', response['error'])
    
    def test_unknown_command_error(self):
        """Test unknown command error."""
        from command_router import CommandRouter
        from s3_session_manager import S3SessionManager
        
        mock_router = Mock(spec=CommandRouter)
        mock_router.is_command.return_value = True
        mock_router.get_command_type.return_value = 'unknown'
        
        mock_s3_manager = Mock(spec=S3SessionManager)
        
        from handler import handle_command
        response = handle_command(
            prompt='/unknown',
            session_id='test-session',
            osdu_instance={'url': 'https://test.com', 'dataPartitionId': 'test'},
            auth_token='token',
            s3_manager=mock_s3_manager,
            command_router=mock_router
        )
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['errorType'], 'UNKNOWN_COMMAND_ERROR')
    
    def test_logging_sanitizes_auth_token(self):
        """Test that auth token is sanitized in logs."""
        from handler import sanitize_event_for_logging
        
        event = {
            'arguments': {
                'authToken': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
                'prompt': 'test'
            }
        }
        
        sanitized = sanitize_event_for_logging(event)
        
        # Token should be truncated
        self.assertNotEqual(
            sanitized['arguments']['authToken'],
            event['arguments']['authToken']
        )
        self.assertIn('...', sanitized['arguments']['authToken'])
    
    def test_logging_handles_short_token(self):
        """Test that short tokens are fully masked."""
        from handler import sanitize_event_for_logging
        
        event = {
            'arguments': {
                'authToken': 'short',
                'prompt': 'test'
            }
        }
        
        sanitized = sanitize_event_for_logging(event)
        
        self.assertEqual(sanitized['arguments']['authToken'], '***')


if __name__ == '__main__':
    unittest.main()
