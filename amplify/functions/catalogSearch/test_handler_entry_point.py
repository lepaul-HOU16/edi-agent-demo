"""
Test Lambda Handler Entry Point
Tests for task 6.1: Create Lambda handler entry point

This test file validates:
- AppSync GraphQL streaming handler setup
- Request parsing (prompt, sessionId)
- Logging and error handling initialization

Note: OSDU authentication is handled via Lambda environment variables,
      not via event parameters.
"""

import unittest
import json
from unittest.mock import Mock, patch, MagicMock
from handler import lambda_handler, sanitize_event_for_logging, create_error_response


class TestLambdaHandlerEntryPoint(unittest.TestCase):
    """Test suite for Lambda handler entry point (Task 6.1)"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.valid_event = {
            'arguments': {
                'prompt': '/getdata',
                'sessionId': 'test-session-123',
                'existingContext': None
            }
        }
        
        self.mock_context = Mock()
        self.mock_context.request_id = 'test-request-123'
        self.mock_context.function_name = 'catalogSearchHandler'
        self.mock_context.memory_limit_in_mb = 1024
        self.mock_context.get_remaining_time_in_millis = Mock(return_value=300000)
    
    def test_sanitize_event_for_logging(self):
        """Test that event is sanitized for logging"""
        event = {
            'arguments': {
                'prompt': '/getdata',
                'sessionId': 'test-session-123'
            }
        }
        
        sanitized = sanitize_event_for_logging(event)
        
        # Event should be returned unchanged (no sensitive data in event)
        self.assertEqual(sanitized, event)
    
    def test_create_error_response(self):
        """Test error response creation"""
        error_msg = "Test error message"
        response = create_error_response(error_msg)
        
        self.assertEqual(response['type'], 'error')
        self.assertEqual(response['error'], error_msg)
        self.assertIn('timestamp', response)
        self.assertIsInstance(response['timestamp'], int)
    
    def test_handler_validates_required_parameters(self):
        """Test that handler validates all required parameters"""
        # Test missing prompt
        event = self.valid_event.copy()
        event['arguments'] = event['arguments'].copy()
        event['arguments']['prompt'] = ''
        
        with patch('handler.S3SessionManager'), \
             patch('handler.CommandRouter'):
            response = lambda_handler(event, self.mock_context)
        
        self.assertEqual(response['type'], 'error')
        self.assertIn('prompt', response['error'].lower())
    
    def test_handler_validates_session_id(self):
        """Test that handler validates sessionId"""
        event = self.valid_event.copy()
        event['arguments'] = event['arguments'].copy()
        event['arguments']['sessionId'] = ''
        
        with patch('handler.S3SessionManager'), \
             patch('handler.CommandRouter'):
            response = lambda_handler(event, self.mock_context)
        
        self.assertEqual(response['type'], 'error')
        self.assertIn('sessionid', response['error'].lower())
    

    
    def test_handler_parses_appsync_event(self):
        """Test that handler correctly parses AppSync GraphQL event"""
        with patch('handler.S3_BUCKET', 'test-bucket'), \
             patch('handler.S3SessionManager') as mock_s3, \
             patch('handler.CommandRouter') as mock_router, \
             patch('handler.handle_command') as mock_handle:
            
            # Setup mocks
            mock_router_instance = MagicMock()
            mock_router_instance.is_command.return_value = True
            mock_router_instance.get_command_type.return_value = 'getdata'
            mock_router.return_value = mock_router_instance
            
            mock_handle.return_value = {
                'type': 'complete',
                'data': {'message': 'Success'}
            }
            
            # Call handler
            response = lambda_handler(self.valid_event, self.mock_context)
            
            # Verify command handler was called with correct parameters
            mock_handle.assert_called_once()
            call_args = mock_handle.call_args[1]
            
            self.assertEqual(call_args['prompt'], '/getdata')
            self.assertEqual(call_args['session_id'], 'test-session-123')
    
    def test_handler_routes_to_command_handler(self):
        """Test that handler routes commands to command handler"""
        with patch('handler.S3_BUCKET', 'test-bucket'), \
             patch('handler.S3SessionManager'), \
             patch('handler.CommandRouter') as mock_router, \
             patch('handler.handle_command') as mock_handle:
            
            # Setup mocks
            mock_router_instance = MagicMock()
            mock_router_instance.is_command.return_value = True
            mock_router.return_value = mock_router_instance
            
            mock_handle.return_value = {
                'type': 'complete',
                'data': {'message': 'Success'}
            }
            
            # Call handler
            response = lambda_handler(self.valid_event, self.mock_context)
            
            # Verify routing
            mock_router_instance.is_command.assert_called_once_with('/getdata')
            mock_handle.assert_called_once()
    
    def test_handler_routes_to_natural_language_handler(self):
        """Test that handler routes natural language queries to agent handler"""
        event = self.valid_event.copy()
        event['arguments'] = event['arguments'].copy()
        event['arguments']['prompt'] = 'show wells deeper than 3000m'
        
        with patch('handler.S3_BUCKET', 'test-bucket'), \
             patch('handler.S3SessionManager'), \
             patch('handler.CommandRouter') as mock_router, \
             patch('handler.handle_natural_language_query') as mock_handle:
            
            # Setup mocks
            mock_router_instance = MagicMock()
            mock_router_instance.is_command.return_value = False
            mock_router.return_value = mock_router_instance
            
            mock_handle.return_value = {
                'type': 'complete',
                'data': {'message': 'Success'}
            }
            
            # Call handler
            response = lambda_handler(event, self.mock_context)
            
            # Verify routing
            mock_router_instance.is_command.assert_called_once()
            mock_handle.assert_called_once()
    
    def test_handler_handles_exceptions_gracefully(self):
        """Test that handler catches and returns errors gracefully"""
        with patch('handler.S3_BUCKET', 'test-bucket'), \
             patch('handler.S3SessionManager') as mock_s3:
            # Make S3SessionManager raise an exception
            mock_s3.side_effect = Exception("S3 initialization failed")
            
            response = lambda_handler(self.valid_event, self.mock_context)
            
            self.assertEqual(response['type'], 'error')
            self.assertIn('error', response)
            # Check for either 'initialization' or the actual error message
            self.assertTrue(
                'initialization' in response['error'].lower() or
                's3 initialization failed' in response['error'].lower()
            )
    
    def test_handler_validates_s3_bucket_configuration(self):
        """Test that handler validates S3 bucket is configured"""
        with patch('handler.S3_BUCKET', ''):
            response = lambda_handler(self.valid_event, self.mock_context)
            
            self.assertEqual(response['type'], 'error')
            self.assertIn('s3', response['error'].lower())
            self.assertIn('bucket', response['error'].lower())
    
    def test_handler_initializes_logging(self):
        """Test that handler initializes logging properly"""
        with patch('handler.logger') as mock_logger, \
             patch('handler.S3SessionManager'), \
             patch('handler.CommandRouter'), \
             patch('handler.handle_command') as mock_handle:
            
            mock_handle.return_value = {
                'type': 'complete',
                'data': {'message': 'Success'}
            }
            
            # Call handler
            lambda_handler(self.valid_event, self.mock_context)
            
            # Verify logging was called
            self.assertTrue(mock_logger.info.called)
            
            # Check that key log messages were logged
            log_calls = [call[0][0] for call in mock_logger.info.call_args_list]
            
            # Should log invocation
            self.assertTrue(
                any('CATALOG SEARCH LAMBDA INVOCATION' in msg for msg in log_calls)
            )
            
            # Should log completion
            self.assertTrue(
                any('COMPLETED' in msg for msg in log_calls)
            )


if __name__ == '__main__':
    unittest.main()
