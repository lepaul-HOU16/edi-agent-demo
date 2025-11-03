#!/usr/bin/env python3
"""
Unit tests for RCON Executor error handling.
Tests all error scenarios: connection, timeout, command, and verification errors.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor, RCONResult


class TestRCONErrorHandling(unittest.TestCase):
    """Test error handling and recovery in RCONExecutor."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.executor = RCONExecutor(
            host='localhost',
            port=25575,
            password='test_password',
            timeout=10,
            max_retries=3
        )
    
    # Connection Error Tests
    
    def test_connection_refused_error(self):
        """Test handling of connection refused error."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = ConnectionRefusedError("Connection refused")
            
            result = self.executor.execute_command("time set day")
            
            self.assertFalse(result.success)
            self.assertIn("Connection Refused", result.error)
            self.assertIn("Verify Minecraft server is running", result.error)
            self.assertIn("RCON is enabled", result.error)
    
    def test_connection_timeout_error(self):
        """Test handling of connection timeout error."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            # Use a connection-related exception instead of TimeoutError
            mock_execute.side_effect = Exception("Connection timeout: unable to reach server")
            
            result = self.executor.execute_command("time set day")
            
            self.assertFalse(result.success)
            # Should be categorized as connection error due to "connection" keyword
            self.assertIn("Connection", result.error)
            self.assertIn("network", result.error.lower())
    
    def test_authentication_error(self):
        """Test handling of authentication failure."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = Exception("Authentication failed: invalid password")
            
            result = self.executor.execute_command("time set day")
            
            self.assertFalse(result.success)
            self.assertIn("Authentication Failed", result.error)
            self.assertIn("RCON password", result.error)
    
    # Timeout Error Tests
    
    def test_command_timeout_clear_operation(self):
        """Test timeout error handling for clear operation."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = TimeoutError("Command timed out")
            
            result = self.executor.execute_command(
                "fill -100 0 -100 100 255 100 air",
                operation="clear"
            )
            
            self.assertFalse(result.success)
            self.assertIn("Clear operation timed out", result.error)
            self.assertIn("area may be too large", result.error)
            self.assertIn("smaller regions", result.error)
    
    def test_command_timeout_fill_operation(self):
        """Test timeout error handling for fill operation."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = TimeoutError("Command timed out")
            
            result = self.executor.execute_command(
                "fill 0 60 0 100 70 100 grass_block",
                operation="fill"
            )
            
            self.assertFalse(result.success)
            self.assertIn("Fill operation timed out", result.error)
            self.assertIn("automatically batched", result.error)
    
    def test_command_timeout_gamerule_operation(self):
        """Test timeout error handling for gamerule operation."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = TimeoutError("Command timed out")
            
            result = self.executor.execute_command(
                "gamerule doDaylightCycle false",
                operation="gamerule"
            )
            
            self.assertFalse(result.success)
            self.assertIn("Gamerule command timed out", result.error)
            self.assertIn("Server may be unresponsive", result.error)
    
    # Command Error Tests
    
    def test_invalid_command_error(self):
        """Test handling of invalid command syntax."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "Unknown command: invalidcommand"
            
            result = self.executor.execute_command("invalidcommand")
            
            self.assertFalse(result.success)
            self.assertIn("Invalid Command", result.error)
            self.assertIn("Check command syntax", result.error)
    
    def test_permission_denied_error(self):
        """Test handling of permission denied error."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "You do not have permission to use this command"
            
            result = self.executor.execute_command("op testuser")
            
            self.assertFalse(result.success)
            self.assertIn("Permission Denied", result.error)
            self.assertIn("operator permissions", result.error)
    
    def test_target_not_found_error(self):
        """Test handling of target not found error."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "No player was found"
            
            result = self.executor.execute_command("tp nonexistent 0 64 0")
            
            self.assertFalse(result.success)
            self.assertIn("Target Not Found", result.error)
            self.assertIn("player or entity exists", result.error)
    
    def test_command_execution_failed_error(self):
        """Test handling of command execution failure."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "Cannot fill blocks outside of the world"
            
            result = self.executor.execute_command("fill 0 -100 0 10 -90 10 stone")
            
            self.assertFalse(result.success)
            self.assertIn("Command Execution Failed", result.error)
            self.assertIn("unable to execute", result.error)
    
    # Verification Error Tests
    
    def test_verification_failure_with_retry(self):
        """Test verification failure triggers retry."""
        call_count = 0
        
        def mock_execute(cmd):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                return "Command failed"
            return "Successfully filled 100 blocks"
        
        with patch.object(self.executor, '_execute_with_timeout', side_effect=mock_execute):
            result = self.executor.execute_command("fill 0 60 0 10 60 10 grass_block")
            
            # Should succeed after retries
            self.assertTrue(result.success)
            self.assertEqual(result.retries, 2)  # 2 retries before success
            self.assertEqual(call_count, 3)
    
    def test_verification_failure_exhausts_retries(self):
        """Test verification failure after all retries."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "Command failed: invalid syntax"
            
            result = self.executor.execute_command("fill 0 60 0 10 60 10 grass_block")
            
            self.assertFalse(result.success)
            self.assertEqual(result.retries, 2)  # max_retries - 1
            self.assertIn("Invalid Command", result.error)
    
    # Retry Logic Tests
    
    def test_exponential_backoff_timing(self):
        """Test exponential backoff delays between retries."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            with patch('time.sleep') as mock_sleep:
                mock_execute.side_effect = TimeoutError("Timeout")
                
                result = self.executor.execute_command("time set day")
                
                # Should have called sleep with 1s, 2s delays (not 4s since it fails on 3rd attempt)
                self.assertEqual(mock_sleep.call_count, 2)
                mock_sleep.assert_any_call(1)  # First retry: 2^0 = 1s
                mock_sleep.assert_any_call(2)  # Second retry: 2^1 = 2s
    
    def test_retry_count_in_result(self):
        """Test retry count is tracked in result."""
        call_count = 0
        
        def mock_execute(cmd):
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise TimeoutError("Timeout")
            return "Successfully set time to day"
        
        with patch.object(self.executor, '_execute_with_timeout', side_effect=mock_execute):
            result = self.executor.execute_command("time set day")
            
            self.assertTrue(result.success)
            self.assertEqual(result.retries, 1)  # One retry before success
    
    # Error Message Format Tests
    
    def test_error_message_format(self):
        """Test error messages are properly formatted."""
        error_msg = self.executor.format_error_response(
            category="Test Error",
            error="This is a test error",
            suggestions=["Suggestion 1", "Suggestion 2", "Suggestion 3"]
        )
        
        self.assertIn("❌ **Test Error**", error_msg)
        self.assertIn("**Error:** This is a test error", error_msg)
        self.assertIn("**Recovery Suggestions:**", error_msg)
        self.assertIn("1. Suggestion 1", error_msg)
        self.assertIn("2. Suggestion 2", error_msg)
        self.assertIn("3. Suggestion 3", error_msg)
    
    def test_connection_error_handler(self):
        """Test connection error handler generates proper message."""
        error = ConnectionRefusedError("Connection refused")
        error_msg = self.executor.handle_connection_error(error)
        
        self.assertIn("Connection Refused", error_msg)
        self.assertIn("Verify Minecraft server is running", error_msg)
        self.assertIn("RCON is enabled", error_msg)
    
    def test_timeout_error_handler(self):
        """Test timeout error handler generates proper message."""
        error_msg = self.executor.handle_timeout_error(
            command="fill 0 0 0 100 100 100 stone",
            operation="fill"
        )
        
        self.assertIn("Command Timeout", error_msg)
        self.assertIn("Fill operation timed out", error_msg)
        self.assertIn("automatically batched", error_msg)
    
    def test_command_error_handler(self):
        """Test command error handler generates proper message."""
        error_msg = self.executor.handle_command_error(
            command="invalidcommand",
            response="Unknown command: invalidcommand"
        )
        
        self.assertIn("Invalid Command", error_msg)
        self.assertIn("Check command syntax", error_msg)
    
    # Integration Tests
    
    def test_connection_error_in_execute_fill(self):
        """Test connection error handling in execute_fill."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = ConnectionRefusedError("Connection refused")
            
            result = self.executor.execute_fill(0, 60, 0, 10, 70, 10, "grass_block")
            
            self.assertFalse(result.success)
            self.assertIn("Connection Refused", result.error)
    
    def test_timeout_error_in_verify_gamerule(self):
        """Test timeout error handling in verify_gamerule."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = TimeoutError("Timeout")
            
            result = self.executor.verify_gamerule("doDaylightCycle", "false")
            
            self.assertFalse(result)
    
    def test_error_categorization(self):
        """Test error categorization handles various error types."""
        # Connection error
        conn_error = ConnectionRefusedError("Connection refused")
        msg = self.executor.categorize_and_handle_error(conn_error, "time set day")
        self.assertIn("Connection", msg)
        
        # Timeout error
        timeout_error = TimeoutError("Timeout")
        msg = self.executor.categorize_and_handle_error(timeout_error, "fill 0 0 0 100 100 100 stone", "fill")
        self.assertIn("Timeout", msg)
        
        # Generic error
        generic_error = Exception("Something went wrong")
        msg = self.executor.categorize_and_handle_error(generic_error, "test command")
        self.assertIn("Execution Error", msg)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
