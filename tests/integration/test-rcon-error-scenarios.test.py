#!/usr/bin/env python3
"""
Integration tests for RCON error scenarios.
Tests complete error handling workflows with realistic scenarios.
"""

import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor


class TestRCONErrorScenarios(unittest.TestCase):
    """Integration tests for complete error handling scenarios."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.executor = RCONExecutor(
            host='localhost',
            port=25575,
            password='test_password',
            timeout=5,
            max_retries=3
        )
    
    def test_scenario_server_offline(self):
        """Test complete workflow when server is offline."""
        with patch.object(self.executor, '_execute_raw') as mock_raw:
            mock_raw.side_effect = ConnectionRefusedError("Connection refused")
            
            # Try to execute a clear operation
            result = self.executor.execute_fill(
                -100, 0, -100, 100, 255, 100, 
                "air", 
                replace="minecraft:stone"
            )
            
            # Should fail with connection error
            self.assertFalse(result.success)
            self.assertIn("Connection Refused", result.error)
            self.assertIn("Verify Minecraft server is running", result.error)
            
            # Should have retried 3 times
            self.assertEqual(result.retries, 2)
    
    def test_scenario_wrong_password(self):
        """Test complete workflow with wrong RCON password."""
        with patch.object(self.executor, '_execute_raw') as mock_raw:
            mock_raw.side_effect = Exception("Authentication failed: invalid password")
            
            # Try to set time
            result = self.executor.execute_command("time set day")
            
            # Should fail with authentication error
            self.assertFalse(result.success)
            self.assertIn("Authentication Failed", result.error)
            self.assertIn("RCON password", result.error)
    
    def test_scenario_server_lag_then_recovery(self):
        """Test scenario where server is lagging but eventually responds."""
        call_count = 0
        
        def mock_execute(cmd):
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise TimeoutError("Server not responding")
            return "Successfully filled 1000 blocks"
        
        with patch.object(self.executor, '_execute_with_timeout', side_effect=mock_execute):
            result = self.executor.execute_command("fill 0 60 0 10 70 10 grass_block")
            
            # Should succeed after retry
            self.assertTrue(result.success)
            self.assertEqual(result.retries, 1)
            self.assertEqual(result.blocks_affected, 1000)
    
    def test_scenario_invalid_coordinates(self):
        """Test scenario with invalid world coordinates."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "Cannot fill blocks outside of the world"
            
            result = self.executor.execute_fill(
                0, -100, 0, 10, -90, 10, "stone"
            )
            
            # Should fail with command execution error
            self.assertFalse(result.success)
            self.assertIn("Command Execution Failed", result.error)
            self.assertIn("unable to execute", result.error)
    
    def test_scenario_permission_denied_for_op_command(self):
        """Test scenario where RCON user lacks permissions."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "You do not have permission to use this command"
            
            result = self.executor.execute_command("op testuser")
            
            # Should fail with permission error
            self.assertFalse(result.success)
            self.assertIn("Permission Denied", result.error)
            self.assertIn("operator permissions", result.error)
    
    def test_scenario_large_fill_with_batching(self):
        """Test scenario with large fill that requires batching."""
        # Mock successful responses for all chunks
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "Successfully filled 32768 blocks"
            
            # Large fill: 100x100x100 = 1,000,000 blocks
            # Should be split into multiple chunks
            result = self.executor.execute_fill(
                0, 0, 0, 99, 99, 99, "stone"
            )
            
            # Should succeed with batching
            self.assertTrue(result.success)
            self.assertGreater(result.blocks_affected, 0)
            self.assertIn("batched", result.command)
    
    def test_scenario_partial_batch_failure(self):
        """Test scenario where some batches succeed and some fail."""
        call_count = 0
        
        def mock_execute(cmd):
            nonlocal call_count
            call_count += 1
            # Fail every 3rd chunk
            if call_count % 3 == 0:
                raise TimeoutError("Chunk timed out")
            return "Successfully filled 32768 blocks"
        
        with patch.object(self.executor, '_execute_with_timeout', side_effect=mock_execute):
            # Large fill that will be batched
            result = self.executor.execute_fill(
                0, 0, 0, 99, 99, 99, "stone"
            )
            
            # Should report partial success
            self.assertFalse(result.success)  # Overall failure due to some chunks failing
            self.assertGreater(result.blocks_affected, 0)  # But some blocks were filled
            self.assertIn("Chunk", result.error)
    
    def test_scenario_gamerule_verification_failure(self):
        """Test scenario where gamerule is set but verification fails."""
        call_count = 0
        
        def mock_execute(cmd):
            nonlocal call_count
            call_count += 1
            if "gamerule doDaylightCycle false" in cmd:
                return "Gamerule doDaylightCycle is now set to: false"
            elif "gamerule doDaylightCycle" in cmd:
                # Verification shows it's still true (failed to set)
                return "Gamerule doDaylightCycle is currently set to: true"
            return "Success"
        
        with patch.object(self.executor, '_execute_with_timeout', side_effect=mock_execute):
            # Set gamerule
            result = self.executor.execute_command("gamerule doDaylightCycle false")
            self.assertTrue(result.success)
            
            # Verify gamerule (should fail)
            verified = self.executor.verify_gamerule("doDaylightCycle", "false")
            self.assertFalse(verified)
    
    def test_scenario_command_syntax_error(self):
        """Test scenario with invalid command syntax."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "Unknown command: fil. Did you mean fill?"
            
            result = self.executor.execute_command("fil 0 60 0 10 60 10 stone")
            
            # Should fail with invalid command error
            self.assertFalse(result.success)
            self.assertIn("Invalid Command", result.error)
            self.assertIn("Check command syntax", result.error)
    
    def test_scenario_player_not_found(self):
        """Test scenario where target player doesn't exist."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.return_value = "No player was found with name 'NonExistentPlayer'"
            
            result = self.executor.execute_command("tp NonExistentPlayer 0 64 0")
            
            # Should fail with target not found error
            self.assertFalse(result.success)
            self.assertIn("Target Not Found", result.error)
            self.assertIn("player or entity exists", result.error)
    
    def test_scenario_recovery_after_transient_error(self):
        """Test scenario where transient error is recovered through retry."""
        call_count = 0
        
        def mock_execute(cmd):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Server is busy, try again")
            return "Successfully set time to day"
        
        with patch.object(self.executor, '_execute_with_timeout', side_effect=mock_execute):
            result = self.executor.execute_command("time set day")
            
            # Should succeed after retry
            self.assertTrue(result.success)
            self.assertEqual(result.retries, 1)
            self.assertIn("set time to day", result.response)
    
    def test_scenario_all_retries_exhausted(self):
        """Test scenario where all retries are exhausted."""
        with patch.object(self.executor, '_execute_with_timeout') as mock_execute:
            mock_execute.side_effect = TimeoutError("Server not responding")
            
            result = self.executor.execute_command("time set day")
            
            # Should fail after all retries
            self.assertFalse(result.success)
            self.assertEqual(result.retries, 2)  # max_retries - 1
            self.assertIn("Command Timeout", result.error)
    
    def test_scenario_error_message_quality(self):
        """Test that error messages are helpful and actionable."""
        with patch.object(self.executor, '_execute_raw') as mock_raw:
            mock_raw.side_effect = ConnectionRefusedError("Connection refused")
            
            result = self.executor.execute_command("time set day")
            
            # Error message should be formatted and helpful
            self.assertIn("❌", result.error)
            self.assertIn("**", result.error)  # Markdown formatting
            self.assertIn("Recovery Suggestions:", result.error)
            self.assertIn("1.", result.error)  # Numbered list
            
            # Should contain actionable advice
            self.assertIn("Verify", result.error)
            self.assertIn("Check", result.error)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
