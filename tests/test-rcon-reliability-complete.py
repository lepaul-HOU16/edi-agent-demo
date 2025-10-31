#!/usr/bin/env python3
"""
Complete RCON Reliability Test Suite
Tests all aspects of the RCON reliability fixes in a real Minecraft environment.
"""

import sys
import os
import time
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor, RCONResult
from tools.clear_environment_tool import ClearEnvironmentTool
from config import EDIcraftConfig


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


class TestResults:
    """Track test results."""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.tests = []
    
    def add_pass(self, test_name: str, message: str = ""):
        self.passed += 1
        self.tests.append({
            'name': test_name,
            'status': 'PASS',
            'message': message
        })
        print(f"{Colors.GREEN}✓ {test_name}{Colors.NC}")
        if message:
            print(f"  {message}")
    
    def add_fail(self, test_name: str, message: str = ""):
        self.failed += 1
        self.tests.append({
            'name': test_name,
            'status': 'FAIL',
            'message': message
        })
        print(f"{Colors.RED}✗ {test_name}{Colors.NC}")
        if message:
            print(f"  {message}")
    
    def add_warning(self, test_name: str, message: str = ""):
        self.warnings += 1
        self.tests.append({
            'name': test_name,
            'status': 'WARN',
            'message': message
        })
        print(f"{Colors.YELLOW}⚠ {test_name}{Colors.NC}")
        if message:
            print(f"  {message}")
    
    def print_summary(self):
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.NC}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.NC}")
        print(f"{Colors.YELLOW}Warnings: {self.warnings}{Colors.NC}")
        print(f"Total: {len(self.tests)}")
        print("=" * 60)
        
        if self.failed == 0:
            print(f"\n{Colors.GREEN}✓ All tests passed!{Colors.NC}\n")
            return True
        else:
            print(f"\n{Colors.RED}✗ Some tests failed{Colors.NC}\n")
            return False


def print_section(title: str):
    """Print a section header."""
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60 + "\n")


def test_rcon_connection(config: EDIcraftConfig, results: TestResults):
    """Test basic RCON connection."""
    print_section("Test 1: RCON Connection")
    
    try:
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3
        )
        
        # Test simple command
        result = executor.execute_command("list")
        
        if result.success:
            results.add_pass(
                "RCON Connection",
                f"Connected to {config.minecraft_host}:{config.minecraft_rcon_port}"
            )
            return executor
        else:
            results.add_fail(
                "RCON Connection",
                f"Command failed: {result.error}"
            )
            return None
            
    except Exception as e:
        results.add_fail(
            "RCON Connection",
            f"Exception: {str(e)}"
        )
        return None


def test_timeout_mechanism(executor: RCONExecutor, results: TestResults):
    """Test command timeout mechanism."""
    print_section("Test 2: Timeout Mechanism")
    
    try:
        # Test with a command that should complete quickly
        start_time = time.time()
        result = executor.execute_command("list")
        execution_time = time.time() - start_time
        
        if result.success and execution_time < executor.timeout:
            results.add_pass(
                "Timeout Mechanism",
                f"Command completed in {execution_time:.2f}s (timeout: {executor.timeout}s)"
            )
        else:
            results.add_fail(
                "Timeout Mechanism",
                f"Command took {execution_time:.2f}s or failed"
            )
            
    except Exception as e:
        results.add_fail(
            "Timeout Mechanism",
            f"Exception: {str(e)}"
        )


def test_retry_logic(executor: RCONExecutor, results: TestResults):
    """Test retry logic with exponential backoff."""
    print_section("Test 3: Retry Logic")
    
    try:
        # Test with an invalid command that should fail and retry
        result = executor.execute_command("invalid_command_test_12345")
        
        # Should fail after retries
        if not result.success and result.retries > 0:
            results.add_pass(
                "Retry Logic",
                f"Command failed after {result.retries} retries (expected)"
            )
        elif not result.success and result.retries == 0:
            results.add_warning(
                "Retry Logic",
                "Command failed without retries (may be expected for invalid commands)"
            )
        else:
            results.add_fail(
                "Retry Logic",
                "Invalid command succeeded (unexpected)"
            )
            
    except Exception as e:
        results.add_fail(
            "Retry Logic",
            f"Exception: {str(e)}"
        )


def test_command_batching(executor: RCONExecutor, results: TestResults):
    """Test command batching for large operations."""
    print_section("Test 4: Command Batching")
    
    try:
        # Test large fill operation that requires batching
        test_x, test_y, test_z = 200, 65, 200
        
        print(f"Testing batched fill: 100x10x100 region...")
        result = executor.execute_fill(
            test_x, test_y, test_z,
            test_x + 100, test_y + 10, test_z + 100,
            'air',
            replace='stone'
        )
        
        if result.success:
            results.add_pass(
                "Command Batching",
                f"Batched fill completed: {result.blocks_affected} blocks in {result.execution_time:.2f}s"
            )
        else:
            results.add_fail(
                "Command Batching",
                f"Batched fill failed: {result.error}"
            )
            
    except Exception as e:
        results.add_fail(
            "Command Batching",
            f"Exception: {str(e)}"
        )


def test_result_verification(executor: RCONExecutor, results: TestResults):
    """Test command result verification and parsing."""
    print_section("Test 5: Result Verification")
    
    try:
        # Test fill command and verify blocks filled count
        test_x, test_y, test_z = 250, 65, 250
        
        print(f"Testing result verification with 10x10x10 fill...")
        result = executor.execute_fill(
            test_x, test_y, test_z,
            test_x + 10, test_y + 10, test_z + 10,
            'stone'
        )
        
        expected_blocks = 11 * 11 * 11  # 1331 blocks
        
        if result.success and result.blocks_affected > 0:
            results.add_pass(
                "Result Verification",
                f"Verified {result.blocks_affected} blocks filled (expected ~{expected_blocks})"
            )
        else:
            results.add_fail(
                "Result Verification",
                f"Verification failed: {result.blocks_affected} blocks (expected {expected_blocks})"
            )
            
    except Exception as e:
        results.add_fail(
            "Result Verification",
            f"Exception: {str(e)}"
        )


def test_gamerule_verification(executor: RCONExecutor, results: TestResults):
    """Test gamerule verification."""
    print_section("Test 6: Gamerule Verification")
    
    try:
        # Set gamerule
        print("Setting gamerule doDaylightCycle to false...")
        result = executor.execute_command("gamerule doDaylightCycle false")
        
        if not result.success:
            results.add_fail(
                "Gamerule Verification",
                f"Failed to set gamerule: {result.error}"
            )
            return
        
        # Verify gamerule
        print("Verifying gamerule...")
        verified = executor.verify_gamerule("doDaylightCycle", "false")
        
        if verified:
            results.add_pass(
                "Gamerule Verification",
                "Gamerule verified successfully"
            )
        else:
            results.add_fail(
                "Gamerule Verification",
                "Gamerule verification failed"
            )
            
    except Exception as e:
        results.add_fail(
            "Gamerule Verification",
            f"Exception: {str(e)}"
        )


def test_clear_environment(config: EDIcraftConfig, results: TestResults):
    """Test clear environment tool with batching."""
    print_section("Test 7: Clear Environment Tool")
    
    try:
        # Create test structures
        print("Creating test structures...")
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password
        )
        
        # Place some test blocks
        test_x, test_y, test_z = 300, 65, 300
        executor.execute_fill(
            test_x, test_y, test_z,
            test_x + 20, test_y + 20, test_z + 20,
            'obsidian'
        )
        
        # Clear environment
        print("Clearing environment...")
        clear_tool = ClearEnvironmentTool(config)
        result = clear_tool.clear_minecraft_environment(
            area="all",
            preserve_terrain=True
        )
        
        if "✅" in result or "success" in result.lower():
            results.add_pass(
                "Clear Environment Tool",
                "Environment cleared successfully"
            )
        else:
            results.add_fail(
                "Clear Environment Tool",
                f"Clear failed: {result}"
            )
            
    except Exception as e:
        results.add_fail(
            "Clear Environment Tool",
            f"Exception: {str(e)}"
        )


def test_terrain_fill(executor: RCONExecutor, results: TestResults):
    """Test terrain fill with smart optimization."""
    print_section("Test 8: Terrain Fill")
    
    try:
        # Create holes in terrain
        test_x, test_y, test_z = 350, 65, 350
        
        print("Creating test holes...")
        hole_result = executor.execute_fill(
            test_x, test_y, test_z,
            test_x + 20, test_y + 5, test_z + 20,
            'air',
            replace='grass_block'
        )
        
        if not hole_result.success:
            results.add_fail(
                "Terrain Fill - Create Holes",
                f"Failed to create test holes: {hole_result.error}"
            )
            return
        
        print(f"Created {hole_result.blocks_affected} holes")
        
        # Fill terrain with smart fill
        print("Filling terrain with smart fill...")
        fill_result = executor.execute_fill(
            test_x, 61, test_z,
            test_x + 20, 70, test_z + 20,
            'grass_block',
            replace='air',
            smart_fill=True
        )
        
        if fill_result.success and fill_result.blocks_affected > 0:
            results.add_pass(
                "Terrain Fill",
                f"Filled {fill_result.blocks_affected} blocks in {fill_result.execution_time:.2f}s"
            )
        else:
            results.add_fail(
                "Terrain Fill",
                f"Fill failed: {fill_result.error if not fill_result.success else 'No blocks filled'}"
            )
            
    except Exception as e:
        results.add_fail(
            "Terrain Fill",
            f"Exception: {str(e)}"
        )


def test_time_lock_persistence(executor: RCONExecutor, results: TestResults):
    """Test time lock persistence over time."""
    print_section("Test 9: Time Lock Persistence")
    
    try:
        # Set time to day
        print("Setting time to day...")
        time_result = executor.execute_command("time set day")
        
        if not time_result.success:
            results.add_fail(
                "Time Lock - Set Time",
                f"Failed to set time: {time_result.error}"
            )
            return
        
        # Lock daylight cycle
        print("Locking daylight cycle...")
        gamerule_result = executor.execute_command("gamerule doDaylightCycle false")
        
        if not gamerule_result.success:
            results.add_fail(
                "Time Lock - Set Gamerule",
                f"Failed to set gamerule: {gamerule_result.error}"
            )
            return
        
        # Verify immediately
        print("Verifying gamerule...")
        verified_before = executor.verify_gamerule("doDaylightCycle", "false")
        
        if not verified_before:
            results.add_fail(
                "Time Lock - Initial Verification",
                "Gamerule verification failed immediately after setting"
            )
            return
        
        # Wait 10 seconds and verify again
        print("Waiting 10 seconds to test persistence...")
        time.sleep(10)
        
        verified_after = executor.verify_gamerule("doDaylightCycle", "false")
        
        if verified_after:
            results.add_pass(
                "Time Lock Persistence",
                "Gamerule persisted for 10 seconds"
            )
        else:
            results.add_fail(
                "Time Lock Persistence",
                "Gamerule changed after 10 seconds"
            )
            
    except Exception as e:
        results.add_fail(
            "Time Lock Persistence",
            f"Exception: {str(e)}"
        )


def test_error_handling(executor: RCONExecutor, results: TestResults):
    """Test error handling and recovery."""
    print_section("Test 10: Error Handling")
    
    try:
        # Test with invalid command
        print("Testing error handling with invalid command...")
        result = executor.execute_command("invalid_command_xyz")
        
        if not result.success and result.error:
            results.add_pass(
                "Error Handling",
                f"Error handled correctly: {result.error[:100]}"
            )
        else:
            results.add_fail(
                "Error Handling",
                "Invalid command did not produce error"
            )
            
    except Exception as e:
        results.add_fail(
            "Error Handling",
            f"Exception: {str(e)}"
        )


def test_performance_optimization(executor: RCONExecutor, results: TestResults):
    """Test performance optimizations."""
    print_section("Test 11: Performance Optimization")
    
    try:
        # Test parallel execution
        print("Testing parallel command execution...")
        commands = [
            "time query daytime",
            "gamerule doDaylightCycle",
            "list",
            "seed"
        ]
        
        start_time = time.time()
        batch_results = executor.execute_batch(commands, parallel=True)
        parallel_time = time.time() - start_time
        
        # Test sequential execution
        start_time = time.time()
        seq_results = executor.execute_batch(commands, parallel=False)
        sequential_time = time.time() - start_time
        
        successful_parallel = sum(1 for r in batch_results if r.success)
        successful_sequential = sum(1 for r in seq_results if r.success)
        
        if successful_parallel == len(commands) and successful_sequential == len(commands):
            speedup = sequential_time / parallel_time if parallel_time > 0 else 1.0
            results.add_pass(
                "Performance Optimization",
                f"Parallel: {parallel_time:.2f}s, Sequential: {sequential_time:.2f}s, Speedup: {speedup:.2f}x"
            )
        else:
            results.add_fail(
                "Performance Optimization",
                f"Some commands failed: {successful_parallel}/{len(commands)} parallel, {successful_sequential}/{len(commands)} sequential"
            )
            
    except Exception as e:
        results.add_fail(
            "Performance Optimization",
            f"Exception: {str(e)}"
        )


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("RCON Reliability Complete Test Suite")
    print("=" * 60)
    
    # Initialize results tracker
    results = TestResults()
    
    # Load configuration
    try:
        config = EDIcraftConfig()
        print(f"\nMinecraft Server: {config.minecraft_host}:{config.minecraft_rcon_port}")
        print(f"OSDU Platform: {config.osdu_platform_url}")
        print("")
    except Exception as e:
        print(f"{Colors.RED}Failed to load configuration: {str(e)}{Colors.NC}")
        return 1
    
    # Run tests
    executor = test_rcon_connection(config, results)
    
    if executor:
        test_timeout_mechanism(executor, results)
        test_retry_logic(executor, results)
        test_command_batching(executor, results)
        test_result_verification(executor, results)
        test_gamerule_verification(executor, results)
        test_clear_environment(config, results)
        test_terrain_fill(executor, results)
        test_time_lock_persistence(executor, results)
        test_error_handling(executor, results)
        test_performance_optimization(executor, results)
    else:
        print(f"\n{Colors.RED}Cannot continue tests without RCON connection{Colors.NC}")
    
    # Print summary
    success = results.print_summary()
    
    # Return exit code
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
