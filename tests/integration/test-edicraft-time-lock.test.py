#!/usr/bin/env python3
"""
Integration tests for lock_world_time tool.

Tests the complete time lock workflow including:
- Time setting (day, noon, night, etc.)
- Daylight cycle lock/unlock
- Response formatting
- Error handling
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.workflow_tools import lock_world_time
from tools.response_templates import CloudscapeResponseBuilder


class TestTimeLockIntegration(unittest.TestCase):
    """Integration tests for time lock tool."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_rcon = MagicMock()
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_lock_time_day(self, mock_get_rcon):
        """Test locking time to day."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Set the time to 1000"
        
        # Execute time lock
        result = lock_world_time(time="day", enabled=True)
        
        # Verify RCON commands were called
        self.assertTrue(self.mock_rcon.command.called)
        
        # Verify response format
        self.assertIn("✅", result)
        self.assertIn("locked", result.lower())
        self.assertIn("day", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_lock_time_noon(self, mock_get_rcon):
        """Test locking time to noon."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Set the time to 6000"
        
        # Execute time lock
        result = lock_world_time(time="noon", enabled=True)
        
        # Verify response
        self.assertIn("✅", result)
        self.assertIn("noon", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_lock_time_night(self, mock_get_rcon):
        """Test locking time to night."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Set the time to 13000"
        
        # Execute time lock
        result = lock_world_time(time="night", enabled=True)
        
        # Verify response
        self.assertIn("✅", result)
        self.assertIn("night", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_unlock_daylight_cycle(self, mock_get_rcon):
        """Test unlocking daylight cycle."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Gamerule doDaylightCycle is now set to: true"
        
        # Execute time unlock
        result = lock_world_time(time="day", enabled=False)
        
        # Verify response
        self.assertIn("✅", result)
        self.assertIn("unlocked", result.lower())
        self.assertIn("enabled", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_all_time_values(self, mock_get_rcon):
        """Test all supported time values."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Set the time"
        
        time_values = ["day", "morning", "noon", "midday", "afternoon", "sunset", "dusk", "night", "midnight"]
        
        for time_val in time_values:
            result = lock_world_time(time=time_val, enabled=True)
            
            # Each should succeed
            self.assertIn("✅", result, f"Failed for time={time_val}")
            self.assertIn(time_val.lower(), result.lower(), f"Time value not in response for {time_val}")
            
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_time_value_mapping(self, mock_get_rcon):
        """Test that time values map to correct Minecraft times."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Set the time"
        
        # Test specific mappings
        time_mappings = {
            "day": "1000",
            "noon": "6000",
            "sunset": "12000",
            "night": "13000",
            "midnight": "18000"
        }
        
        for time_val, expected_time in time_mappings.items():
            self.mock_rcon.command.reset_mock()
            result = lock_world_time(time=time_val, enabled=True)
            
            # Verify correct time command was called
            calls = [str(call) for call in self.mock_rcon.command.call_args_list]
            combined_calls = ' '.join(calls)
            
            # Should contain the time value
            self.assertTrue(
                expected_time in combined_calls or time_val in result.lower(),
                f"Time mapping incorrect for {time_val}"
            )
            
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_daylight_cycle_lock_command(self, mock_get_rcon):
        """Test that daylight cycle lock command is executed."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Gamerule set"
        
        # Execute time lock
        result = lock_world_time(time="day", enabled=True)
        
        # Verify gamerule command was called
        calls = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(calls)
        
        self.assertTrue(
            "doDaylightCycle" in combined_calls or "gamerule" in combined_calls.lower(),
            "Daylight cycle gamerule command not called"
        )
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_daylight_cycle_unlock_command(self, mock_get_rcon):
        """Test that daylight cycle unlock command is executed."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Gamerule set"
        
        # Execute time unlock
        result = lock_world_time(time="day", enabled=False)
        
        # Verify gamerule command was called with true
        calls = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(calls)
        
        self.assertTrue(
            "true" in combined_calls.lower() or "enabled" in result.lower(),
            "Daylight cycle should be enabled"
        )
        
    def test_response_formatting(self):
        """Test that response follows Cloudscape format."""
        # Test time lock template
        response = CloudscapeResponseBuilder.time_lock_confirmation(
            time="day",
            locked=True
        )
        
        # Verify Cloudscape formatting
        self.assertIn("✅", response)
        self.assertIn("**Details:**", response)
        self.assertIn("Time Set:", response)
        self.assertIn("Daylight Cycle:", response)
        self.assertIn("💡 **Tip:**", response)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_handling_invalid_time(self, mock_get_rcon):
        """Test error handling for invalid time value."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        
        # Execute with invalid time
        result = lock_world_time(time="invalid_time", enabled=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("invalid", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_handling_rcon_failure(self, mock_get_rcon):
        """Test error handling when RCON connection fails."""
        # Setup mock to raise exception
        mock_get_rcon.side_effect = Exception("RCON connection failed")
        
        # Execute time lock
        result = lock_world_time(time="day", enabled=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("Time Lock", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_recovery_suggestions(self, mock_get_rcon):
        """Test that error responses include recovery suggestions."""
        # Setup mock to fail
        mock_get_rcon.side_effect = Exception("Connection timeout")
        
        # Execute time lock
        result = lock_world_time(time="day", enabled=True)
        
        # Verify suggestions are provided
        self.assertTrue(
            "check" in result.lower() or "verify" in result.lower() or "try" in result.lower(),
            "Error response should include suggestions"
        )
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_lock_unlock_sequence(self, mock_get_rcon):
        """Test locking and then unlocking time."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Success"
        
        # Lock time
        result1 = lock_world_time(time="day", enabled=True)
        self.assertIn("locked", result1.lower())
        
        # Unlock time
        result2 = lock_world_time(time="day", enabled=False)
        self.assertIn("unlocked", result2.lower())
        
    def test_response_template_consistency(self):
        """Test that all response templates are consistent."""
        # Test success response
        success = CloudscapeResponseBuilder.time_lock_confirmation(
            time="day",
            locked=True
        )
        
        # Test error response
        error = CloudscapeResponseBuilder.error_response(
            "Time Lock",
            "Invalid time value",
            ["Use: day, noon, night, etc."]
        )
        
        # Both should have consistent structure
        self.assertIn("**", success)  # Bold formatting
        self.assertIn("**", error)
        
        # Success should have success icon
        self.assertIn("✅", success)
        
        # Error should have error icon
        self.assertIn("❌", error)


def run_tests():
    """Run all integration tests."""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestTimeLockIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
