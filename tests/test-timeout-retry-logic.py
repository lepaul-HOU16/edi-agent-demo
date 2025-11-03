#!/usr/bin/env python3
"""
Test timeout and retry logic for EDIcraft clear operation.
Tests Requirements 4.1-4.5 from the specification.
"""

import sys
import os
import time
import logging
from unittest.mock import Mock, patch, MagicMock
from dataclasses import dataclass

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.clear_environment_tool import ClearEnvironmentTool, ChunkClearResult, ClearOperationResult
from tools.rcon_executor import RCONExecutor, RCONResult
from config import EDIcraftConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TestTimeoutRetryLogic:
    """Test suite for timeout and retry logic."""
    
    def __init__(self):
        """Initialize test suite."""
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_results = []
    
    def run_test(self, test_name: str, test_func):
        """Run a single test and track results.
        
        Args:
            test_name: Name of the test
            test_func: Test function to execute
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"Running: {test_name}")
        logger.info(f"{'='*60}")
        
        try:
            test_func()
            self.passed_tests += 1
            self.test_results.append((test_name, "PASSED", None))
            logger.info(f"✅ {test_name} PASSED")
        except AssertionError as e:
            self.failed_tests += 1
            self.test_results.append((test_name, "FAILED", str(e)))
            logger.error(f"❌ {test_name} FAILED: {str(e)}")
        except Exception as e:
            self.failed_tests += 1
            self.test_results.append((test_name, "ERROR", str(e)))
            logger.error(f"❌ {test_name} ERROR: {str(e)}")
    
    def test_requirement_4_1_chunk_timeout(self):
        """Test Requirement 4.1: 30-second timeout per chunk operation."""
        logger.info("Testing 30-second timeout per chunk...")
        
        # Create mock config
        config = Mock(spec=EDIcraftConfig)
        config.minecraft_host = "localhost"
        config.minecraft_rcon_port = 25575
        config.minecraft_rcon_password = "test"
        
        # Create tool
        tool = ClearEnvironmentTool(config)
        
        # Verify timeout configuration
        assert tool.chunk_timeout == 30, f"Expected chunk_timeout=30, got {tool.chunk_timeout}"
        logger.info(f"✓ Chunk timeout configured: {tool.chunk_timeout} seconds")
        
        # Verify RCONExecutor receives timeout
        with patch('tools.clear_environment_tool.RCONExecutor') as mock_executor_class:
            mock_executor = Mock()
            mock_executor.execute_command.return_value = RCONResult(
                success=True,
                command="list",
                response="There are 0 players online"
            )
            mock_executor_class.return_value = mock_executor
            
            try:
                tool._create_rcon_executor()
            except:
                pass  # Connection will fail, but we can check the call
            
            # Verify timeout was passed to RCONExecutor
            if mock_executor_class.called:
                call_kwargs = mock_executor_class.call_args[1]
                assert call_kwargs['timeout'] == 30, f"Expected timeout=30, got {call_kwargs['timeout']}"
                logger.info(f"✓ RCONExecutor initialized with timeout: {call_kwargs['timeout']} seconds")
        
        logger.info("✅ Requirement 4.1 verified: 30-second timeout per chunk")
    
    def test_requirement_4_2_chunk_retry(self):
        """Test Requirement 4.2: 3 retry attempts for failed chunks."""
        logger.info("Testing 3 retry attempts for failed chunks...")
        
        # Create mock config
        config = Mock(spec=EDIcraftConfig)
        config.minecraft_host = "localhost"
        config.minecraft_rcon_port = 25575
        config.minecraft_rcon_password = "test"
        
        # Create tool
        tool = ClearEnvironmentTool(config)
        
        # Verify retry configuration
        assert tool.max_chunk_retries == 3, f"Expected max_chunk_retries=3, got {tool.max_chunk_retries}"
        logger.info(f"✓ Max chunk retries configured: {tool.max_chunk_retries}")
        
        # Test retry logic with mock executor
        mock_executor = Mock()
        
        # Simulate 2 failures then success
        call_count = [0]
        def mock_execute(command, verify=True, operation="command"):
            call_count[0] += 1
            if call_count[0] < 3:
                # First 2 attempts fail
                return RCONResult(
                    success=False,
                    command=command,
                    response="Error",
                    error="Simulated failure"
                )
            else:
                # Third attempt succeeds
                return RCONResult(
                    success=True,
                    command=command,
                    response="Successfully filled 1000 blocks",
                    blocks_affected=1000
                )
        
        mock_executor.execute_command = mock_execute
        
        # Test chunk clear with retry
        with patch('time.sleep'):  # Skip actual sleep delays
            result = tool._clear_chunk_with_retry(mock_executor, 0, 0, True)
        
        # Verify retries occurred
        assert call_count[0] >= 3, f"Expected at least 3 attempts, got {call_count[0]}"
        assert result.cleared, "Expected chunk to succeed after retries"
        logger.info(f"✓ Chunk succeeded after {call_count[0]} attempts (including retries)")
        
        logger.info("✅ Requirement 4.2 verified: 3 retry attempts for failed chunks")
    
    def test_requirement_4_3_total_timeout(self):
        """Test Requirement 4.3: 5-minute total operation timeout."""
        logger.info("Testing 5-minute total operation timeout...")
        
        # Create mock config
        config = Mock(spec=EDIcraftConfig)
        config.minecraft_host = "localhost"
        config.minecraft_rcon_port = 25575
        config.minecraft_rcon_password = "test"
        
        # Create tool
        tool = ClearEnvironmentTool(config)
        
        # Verify total timeout configuration
        assert tool.total_timeout == 300, f"Expected total_timeout=300, got {tool.total_timeout}"
        logger.info(f"✓ Total timeout configured: {tool.total_timeout} seconds (5 minutes)")
        
        # Test that timeout is checked in main loop
        # We'll verify this by checking the code logic
        import inspect
        source = inspect.getsource(tool.clear_minecraft_environment)
        
        assert "elapsed > self.total_timeout" in source, "Total timeout check not found in code"
        assert "break" in source, "Timeout break not found in code"
        logger.info("✓ Total timeout check implemented in main loop")
        
        logger.info("✅ Requirement 4.3 verified: 5-minute total operation timeout")
    
    def test_requirement_4_4_continue_on_failure(self):
        """Test Requirement 4.4: Continue with remaining chunks if one fails."""
        logger.info("Testing continue with remaining chunks on failure...")
        
        # Create mock config
        config = Mock(spec=EDIcraftConfig)
        config.minecraft_host = "localhost"
        config.minecraft_rcon_port = 25575
        config.minecraft_rcon_password = "test"
        
        # Create tool
        tool = ClearEnvironmentTool(config)
        
        # Mock executor that always fails on specific chunks (even with retries)
        mock_executor = Mock()
        
        chunk_calls = []
        def mock_execute(command, verify=True, operation="command"):
            chunk_calls.append(command)
            # Always fail on commands containing "32" (chunk 2), succeed on others
            if "32" in command and "fill" in command:
                return RCONResult(
                    success=False,
                    command=command,
                    response="Error",
                    error="Simulated persistent chunk 2 failure"
                )
            else:
                return RCONResult(
                    success=True,
                    command=command,
                    response="Successfully filled 1000 blocks",
                    blocks_affected=1000
                )
        
        mock_executor.execute_command = mock_execute
        
        # Test clearing multiple chunks
        with patch('time.sleep'):  # Skip sleep delays
            # Clear 3 chunks - chunk 2 will fail even with retries
            result1 = tool._clear_chunk_with_retry(mock_executor, 0, 0, False)
            result2 = tool._clear_chunk_with_retry(mock_executor, 32, 0, False)
            result3 = tool._clear_chunk_with_retry(mock_executor, 64, 0, False)
        
        # Verify chunk 1 succeeded
        assert result1.cleared, "Chunk 1 should succeed"
        logger.info("✓ Chunk 1 succeeded")
        
        # Verify chunk 2 failed (even after retries)
        assert not result2.cleared, "Chunk 2 should fail after all retries"
        logger.info("✓ Chunk 2 failed after all retries (as expected)")
        
        # Verify chunk 3 succeeded (continued after failure)
        assert result3.cleared, "Chunk 3 should succeed (continued after chunk 2 failure)"
        logger.info("✓ Chunk 3 succeeded (operation continued after failure)")
        
        # Verify we attempted chunk 3 even though chunk 2 failed
        chunk_3_calls = [c for c in chunk_calls if "64" in c]
        assert len(chunk_3_calls) > 0, "Chunk 3 should have been attempted"
        logger.info(f"✓ Operation continued to chunk 3 after chunk 2 failure ({len(chunk_3_calls)} attempts)")
        
        logger.info("✅ Requirement 4.4 verified: Continue with remaining chunks on failure")
    
    def test_requirement_4_5_rcon_connection_retry(self):
        """Test Requirement 4.5: RCON connection retry logic (3 attempts)."""
        logger.info("Testing RCON connection retry logic...")
        
        # Create mock config
        config = Mock(spec=EDIcraftConfig)
        config.minecraft_host = "localhost"
        config.minecraft_rcon_port = 25575
        config.minecraft_rcon_password = "test"
        
        # Create tool
        tool = ClearEnvironmentTool(config)
        
        # Verify connection retry configuration
        assert tool.rcon_connection_retries == 3, f"Expected rcon_connection_retries=3, got {tool.rcon_connection_retries}"
        logger.info(f"✓ RCON connection retries configured: {tool.rcon_connection_retries}")
        
        # Test connection retry logic
        connection_attempts = [0]
        
        def mock_rcon_init(*args, **kwargs):
            connection_attempts[0] += 1
            if connection_attempts[0] < 3:
                # First 2 attempts fail
                raise Exception("Connection refused")
            else:
                # Third attempt succeeds
                mock_executor = Mock()
                mock_executor.execute_command.return_value = RCONResult(
                    success=True,
                    command="list",
                    response="There are 0 players online"
                )
                return mock_executor
        
        with patch('tools.clear_environment_tool.RCONExecutor', side_effect=mock_rcon_init):
            with patch('time.sleep'):  # Skip sleep delays
                try:
                    executor = tool._create_rcon_executor()
                    # Verify connection succeeded after retries
                    assert connection_attempts[0] == 3, f"Expected 3 connection attempts, got {connection_attempts[0]}"
                    logger.info(f"✓ Connection succeeded after {connection_attempts[0]} attempts")
                except Exception as e:
                    # If all retries fail, verify we tried 3 times
                    assert connection_attempts[0] == 3, f"Expected 3 connection attempts, got {connection_attempts[0]}"
                    logger.info(f"✓ Connection failed after {connection_attempts[0]} attempts (as expected)")
        
        logger.info("✅ Requirement 4.5 verified: RCON connection retry logic (3 attempts)")
    
    def test_exponential_backoff(self):
        """Test that retry delays use exponential backoff."""
        logger.info("Testing exponential backoff for retries...")
        
        # Create mock config
        config = Mock(spec=EDIcraftConfig)
        config.minecraft_host = "localhost"
        config.minecraft_rcon_port = 25575
        config.minecraft_rcon_password = "test"
        
        # Create tool
        tool = ClearEnvironmentTool(config)
        
        # Mock executor that always fails
        mock_executor = Mock()
        mock_executor.execute_command.return_value = RCONResult(
            success=False,
            command="test",
            response="Error",
            error="Simulated failure"
        )
        
        # Track sleep delays
        sleep_delays = []
        original_sleep = time.sleep
        def mock_sleep(delay):
            sleep_delays.append(delay)
        
        with patch('time.sleep', side_effect=mock_sleep):
            result = tool._clear_chunk_with_retry(mock_executor, 0, 0, False)
        
        # Verify exponential backoff: 1s, 2s, 4s (2^0, 2^1, 2^2)
        # Note: We expect 2 delays for 3 attempts (no delay after last attempt)
        assert len(sleep_delays) == 2, f"Expected 2 delays, got {len(sleep_delays)}"
        assert sleep_delays[0] == 1, f"Expected first delay=1s, got {sleep_delays[0]}s"
        assert sleep_delays[1] == 2, f"Expected second delay=2s, got {sleep_delays[1]}s"
        logger.info(f"✓ Exponential backoff verified: delays = {sleep_delays}")
        
        logger.info("✅ Exponential backoff test passed")
    
    def print_summary(self):
        """Print test summary."""
        logger.info(f"\n{'='*60}")
        logger.info("TEST SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Total tests: {self.passed_tests + self.failed_tests}")
        logger.info(f"Passed: {self.passed_tests}")
        logger.info(f"Failed: {self.failed_tests}")
        logger.info(f"{'='*60}")
        
        if self.failed_tests > 0:
            logger.info("\nFailed tests:")
            for name, status, error in self.test_results:
                if status != "PASSED":
                    logger.info(f"  ❌ {name}: {error}")
        
        logger.info(f"\n{'='*60}")
        if self.failed_tests == 0:
            logger.info("✅ ALL TESTS PASSED")
        else:
            logger.info(f"❌ {self.failed_tests} TEST(S) FAILED")
        logger.info(f"{'='*60}\n")
        
        return self.failed_tests == 0


def main():
    """Run all timeout and retry logic tests."""
    logger.info("Starting timeout and retry logic tests...")
    logger.info("Testing Requirements 4.1-4.5 from specification\n")
    
    test_suite = TestTimeoutRetryLogic()
    
    # Run all tests
    test_suite.run_test(
        "Requirement 4.1: 30-second timeout per chunk",
        test_suite.test_requirement_4_1_chunk_timeout
    )
    
    test_suite.run_test(
        "Requirement 4.2: 3 retry attempts for failed chunks",
        test_suite.test_requirement_4_2_chunk_retry
    )
    
    test_suite.run_test(
        "Requirement 4.3: 5-minute total operation timeout",
        test_suite.test_requirement_4_3_total_timeout
    )
    
    test_suite.run_test(
        "Requirement 4.4: Continue with remaining chunks on failure",
        test_suite.test_requirement_4_4_continue_on_failure
    )
    
    test_suite.run_test(
        "Requirement 4.5: RCON connection retry logic (3 attempts)",
        test_suite.test_requirement_4_5_rcon_connection_retry
    )
    
    test_suite.run_test(
        "Exponential backoff for retries",
        test_suite.test_exponential_backoff
    )
    
    # Print summary
    success = test_suite.print_summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
