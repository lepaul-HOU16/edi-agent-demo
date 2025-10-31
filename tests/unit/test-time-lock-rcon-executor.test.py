#!/usr/bin/env python3
"""
Unit test for time lock tool with RCONExecutor integration.
Tests the enhanced lock_world_time() function with verification and retry logic.
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path to import tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.rcon_executor import RCONResult


class TestTimeLockRCONExecutor(unittest.TestCase):
    """Test time lock tool with RCONExecutor integration."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Mock EDIcraftConfig
        self.mock_config = Mock()
        self.mock_config.minecraft_host = "localhost"
        self.mock_config.minecraft_rcon_port = 25575
        self.mock_config.minecraft_rcon_password = "test_password"
    
    @patch('tools.workflow_tools.EDIcraftConfig')
    @patch('tools.rcon_executor.RCONExecutor')
    def test_time_lock_success_with_verification(self, mock_executor_class, mock_config_class):
        """Test successful time lock with gamerule verification."""
        from tools.workflow_tools import lock_world_time
        
        # Setup mocks
        mock_config_class.return_value = self.mock_config
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        # Mock successful time set
        time_result = RCONResult(
            success=True,
            command="time set 1000",
            response="Set the time to 1000",
            execution_time=0.1
        )
        
        # Mock successful gamerule set
        gamerule_result = RCONResult(
            success=True,
            command="gamerule doDaylightCycle false",
            response="Gamerule doDaylightCycle is now set to: false",
            execution_time=0.1
        )
        
        # Mock gamerule query before
        query_before = RCONResult(
            success=True,
            command="gamerule doDaylightCycle",
            response="Gamerule doDaylightCycle is currently set to: true",
            execution_time=0.05
        )
        
        # Mock gamerule query after
        query_after = RCONResult(
            success=True,
            command="gamerule doDaylightCycle",
            response="Gamerule doDaylightCycle is currently set to: false",
            execution_time=0.05
        )
        
        # Setup execute_command to return different results based on command
        def execute_command_side_effect(command, verify=True):
            if "time set" in command:
                return time_result
            elif "gamerule doDaylightCycle false" in command:
                return gamerule_result
            elif "gamerule doDaylightCycle" in command and verify is False:
                # First call returns before state, second call returns after state
                if not hasattr(execute_command_side_effect, 'query_count'):
                    execute_command_side_effect.query_count = 0
                execute_command_side_effect.query_count += 1
                return query_before if execute_command_side_effect.query_count == 1 else query_after
            return RCONResult(success=True, command=command, response="OK", execution_time=0.1)
        
        mock_executor.execute_command.side_effect = execute_command_side_effect
        mock_executor.verify_gamerule.return_value = True
        
        # Execute
        result = lock_world_time(time="day", enabled=True)
        
        # Verify
        self.assertIn("✅", result)
        self.assertIn("locked", result.lower())
        self.assertIn("day", result.lower())
        self.assertIn("verification", result.lower())
        
        # Verify RCONExecutor was initialized correctly
        mock_executor_class.assert_called_once_with(
            host="localhost",
            port=25575,
            password="test_password",
            timeout=10,
            max_retries=3
        )
        
        # Verify commands were executed
        self.assertTrue(mock_executor.execute_command.called)
        self.assertTrue(mock_executor.verify_gamerule.called)
        
        # Verify gamerule verification was called with correct parameters
        mock_executor.verify_gamerule.assert_called_with("doDaylightCycle", "false")
    
    @patch('tools.workflow_tools.EDIcraftConfig')
    @patch('tools.rcon_executor.RCONExecutor')
    def test_time_lock_verification_retry(self, mock_executor_class, mock_config_class):
        """Test time lock with gamerule verification retry."""
        from tools.workflow_tools import lock_world_time
        
        # Setup mocks
        mock_config_class.return_value = self.mock_config
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        # Mock successful time set
        time_result = RCONResult(
            success=True,
            command="time set 1000",
            response="Set the time to 1000",
            execution_time=0.1
        )
        
        # Mock successful gamerule set
        gamerule_result = RCONResult(
            success=True,
            command="gamerule doDaylightCycle false",
            response="Gamerule doDaylightCycle is now set to: false",
            execution_time=0.1
        )
        
        mock_executor.execute_command.return_value = time_result
        
        def execute_command_side_effect(command, verify=True):
            if "time set" in command:
                return time_result
            elif "gamerule doDaylightCycle" in command:
                return gamerule_result
            return RCONResult(success=True, command=command, response="OK", execution_time=0.1)
        
        mock_executor.execute_command.side_effect = execute_command_side_effect
        
        # Mock verification to fail first 2 times, succeed on 3rd
        verify_call_count = [0]
        def verify_side_effect(rule, expected_value):
            verify_call_count[0] += 1
            return verify_call_count[0] >= 3
        
        mock_executor.verify_gamerule.side_effect = verify_side_effect
        
        # Execute
        result = lock_world_time(time="day", enabled=True)
        
        # Verify
        self.assertIn("✅", result)
        self.assertIn("locked", result.lower())
        
        # Verify gamerule verification was called multiple times (retry logic)
        self.assertEqual(mock_executor.verify_gamerule.call_count, 3)
    
    @patch('tools.workflow_tools.EDIcraftConfig')
    @patch('tools.rcon_executor.RCONExecutor')
    def test_time_lock_verification_failure(self, mock_executor_class, mock_config_class):
        """Test time lock with gamerule verification failure after all retries."""
        from tools.workflow_tools import lock_world_time
        
        # Setup mocks
        mock_config_class.return_value = self.mock_config
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        # Mock successful time set
        time_result = RCONResult(
            success=True,
            command="time set 1000",
            response="Set the time to 1000",
            execution_time=0.1
        )
        
        # Mock successful gamerule set
        gamerule_result = RCONResult(
            success=True,
            command="gamerule doDaylightCycle false",
            response="Gamerule doDaylightCycle is now set to: false",
            execution_time=0.1
        )
        
        def execute_command_side_effect(command, verify=True):
            if "time set" in command:
                return time_result
            elif "gamerule doDaylightCycle" in command:
                return gamerule_result
            return RCONResult(success=True, command=command, response="OK", execution_time=0.1)
        
        mock_executor.execute_command.side_effect = execute_command_side_effect
        
        # Mock verification to always fail
        mock_executor.verify_gamerule.return_value = False
        
        # Execute
        result = lock_world_time(time="day", enabled=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("verification failed", result.lower())
        
        # Verify gamerule verification was called 3 times (max attempts)
        self.assertEqual(mock_executor.verify_gamerule.call_count, 3)
    
    @patch('tools.workflow_tools.EDIcraftConfig')
    @patch('tools.rcon_executor.RCONExecutor')
    def test_time_lock_time_set_failure(self, mock_executor_class, mock_config_class):
        """Test time lock with time set command failure."""
        from tools.workflow_tools import lock_world_time
        
        # Setup mocks
        mock_config_class.return_value = self.mock_config
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        # Mock failed time set
        time_result = RCONResult(
            success=False,
            command="time set 1000",
            response="",
            error="Connection timeout",
            execution_time=10.0,
            retries=3
        )
        
        mock_executor.execute_command.return_value = time_result
        
        # Execute
        result = lock_world_time(time="day", enabled=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("failed to set world time", result.lower())
        self.assertIn("connection timeout", result.lower())
    
    @patch('tools.workflow_tools.EDIcraftConfig')
    @patch('tools.rcon_executor.RCONExecutor')
    def test_time_lock_gamerule_failure(self, mock_executor_class, mock_config_class):
        """Test time lock with gamerule set command failure."""
        from tools.workflow_tools import lock_world_time
        
        # Setup mocks
        mock_config_class.return_value = self.mock_config
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        # Mock successful time set
        time_result = RCONResult(
            success=True,
            command="time set 1000",
            response="Set the time to 1000",
            execution_time=0.1
        )
        
        # Mock failed gamerule set
        gamerule_result = RCONResult(
            success=False,
            command="gamerule doDaylightCycle false",
            response="",
            error="Permission denied",
            execution_time=0.1,
            retries=3
        )
        
        def execute_command_side_effect(command, verify=True):
            if "time set" in command:
                return time_result
            elif "gamerule doDaylightCycle" in command:
                return gamerule_result
            return RCONResult(success=True, command=command, response="OK", execution_time=0.1)
        
        mock_executor.execute_command.side_effect = execute_command_side_effect
        
        # Execute
        result = lock_world_time(time="day", enabled=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("failed to lock daylight cycle", result.lower())
        self.assertIn("permission denied", result.lower())
    
    @patch('tools.workflow_tools.EDIcraftConfig')
    @patch('tools.rcon_executor.RCONExecutor')
    def test_time_unlock(self, mock_executor_class, mock_config_class):
        """Test unlocking time (resume normal cycle)."""
        from tools.workflow_tools import lock_world_time
        
        # Setup mocks
        mock_config_class.return_value = self.mock_config
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        # Mock successful time set
        time_result = RCONResult(
            success=True,
            command="time set 1000",
            response="Set the time to 1000",
            execution_time=0.1
        )
        
        # Mock successful gamerule set (to true for unlock)
        gamerule_result = RCONResult(
            success=True,
            command="gamerule doDaylightCycle true",
            response="Gamerule doDaylightCycle is now set to: true",
            execution_time=0.1
        )
        
        def execute_command_side_effect(command, verify=True):
            if "time set" in command:
                return time_result
            elif "gamerule doDaylightCycle" in command:
                return gamerule_result
            return RCONResult(success=True, command=command, response="OK", execution_time=0.1)
        
        mock_executor.execute_command.side_effect = execute_command_side_effect
        mock_executor.verify_gamerule.return_value = True
        
        # Execute with enabled=False to unlock
        result = lock_world_time(time="day", enabled=False)
        
        # Verify
        self.assertIn("✅", result)
        self.assertIn("unlocked", result.lower())
        self.assertIn("enabled", result.lower())
        
        # Verify gamerule verification was called with "true" for unlock
        mock_executor.verify_gamerule.assert_called_with("doDaylightCycle", "true")


def main():
    """Run all tests."""
    unittest.main(verbosity=2)


if __name__ == "__main__":
    main()
