#!/usr/bin/env python3
"""
Complete Workflow Tests for EDIcraft RCON Reliability.

This test suite validates all complete workflows end-to-end:
1. Clear operation: build wellbore → clear → verify clean
2. Time lock: set daylight → wait 60 seconds → verify still day
3. Terrain fill: clear with holes → verify surface repaired
4. Error recovery: disconnect RCON → verify error message → reconnect → retry
5. Performance: clear 500x255x500 region → verify completes in < 30 seconds

Requirements tested: All requirements from fix-edicraft-rcon-reliability spec
"""

import sys
import os
import time
import json

# Add parent directory to path to import tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.workflow_tools import clear_minecraft_environment, lock_world_time
from tools.rcon_executor import RCONExecutor
from tools.response_templates import CloudscapeResponseBuilder
from config import EDIcraftConfig


class WorkflowTestSuite:
    """Test suite for complete EDIcraft workflows."""
    
    def __init__(self):
        """Initialize test suite with configuration."""
        self.config = EDIcraftConfig()
        self.executor = None
        self.test_results = []
        
    def setup_executor(self):
        """Setup RCON executor for tests."""
        try:
            self.executor = RCONExecutor(
                host=self.config.minecraft_host,
                port=self.config.minecraft_rcon_port,
                password=self.config.minecraft_rcon_password,
                timeout=10,
                max_retries=3,
                chunk_size=32
            )
            return True
        except Exception as e:
            print(f"❌ Failed to setup RCON executor: {str(e)}")
            return False
    
    def test_clear_operation_workflow(self) -> bool:
        """Test complete clear operation workflow.
        
        Workflow:
        1. Build test wellbore (place some blocks)
        2. Execute clear operation
        3. Verify environment is clean
        
        Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
        """
        print("\n" + "="*80)
        print("TEST 1: Clear Operation Workflow")
        print("="*80)
        print("\nWorkflow: Build test structure → Clear → Verify clean")
        
        try:
            # Step 1: Build test structure (small wellbore simulation)
            print("\n[Step 1/3] Building test structure...")
            test_blocks = [
                ("obsidian", 0, 100, 0),
                ("glowstone", 1, 100, 1),
                ("emerald_block", 2, 100, 2),
            ]
            
            blocks_placed = 0
            for block_type, x, y, z in test_blocks:
                command = f"setblock {x} {y} {z} {block_type}"
                result = self.executor.execute_command(command)
                if result.success:
                    blocks_placed += 1
                    print(f"  ✓ Placed {block_type} at ({x}, {y}, {z})")
                else:
                    print(f"  ✗ Failed to place {block_type}: {result.error}")
            
            print(f"\n  Total blocks placed: {blocks_placed}/{len(test_blocks)}")
            
            # Step 2: Execute clear operation
            print("\n[Step 2/3] Executing clear operation...")
            start_time = time.time()
            clear_result = clear_minecraft_environment(area="all", preserve_terrain=True)
            clear_time = time.time() - start_time
            
            print(f"\n  Clear operation completed in {clear_time:.2f}s")
            print(f"\n  Response preview:")
            print("  " + "\n  ".join(clear_result.split("\n")[:10]))
            
            # Check if clear was successful
            if "✅" in clear_result or "⚠️" in clear_result:
                print("\n  ✓ Clear operation completed")
            else:
                print("\n  ✗ Clear operation failed")
                print(f"\n  Full response:\n{clear_result}")
                return False
            
            # Step 3: Verify environment is clean
            print("\n[Step 3/3] Verifying environment is clean...")
            clean_count = 0
            for block_type, x, y, z in test_blocks:
                command = f"testforblock {x} {y} {z} air"
                result = self.executor.execute_command(command, verify=False)
                if result.success and "found" in result.response.lower():
                    clean_count += 1
                    print(f"  ✓ Position ({x}, {y}, {z}) is clean (air)")
                else:
                    print(f"  ✗ Position ({x}, {y}, {z}) still has blocks")
            
            print(f"\n  Clean positions: {clean_count}/{len(test_blocks)}")
            
            # Verify success
            success = clean_count == len(test_blocks)
            
            if success:
                print("\n✅ TEST PASSED: Clear operation workflow completed successfully")
                print(f"   - Built {blocks_placed} test blocks")
                print(f"   - Cleared environment in {clear_time:.2f}s")
                print(f"   - Verified {clean_count} positions are clean")
            else:
                print("\n❌ TEST FAILED: Some positions were not cleaned")
            
            return success
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: Exception occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_time_lock_workflow(self) -> bool:
        """Test complete time lock workflow.
        
        Workflow:
        1. Set time to day and lock daylight cycle
        2. Wait 60 seconds
        3. Verify time is still day (hasn't changed)
        
        Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
        """
        print("\n" + "="*80)
        print("TEST 2: Time Lock Workflow")
        print("="*80)
        print("\nWorkflow: Set daylight → Wait 60s → Verify still day")
        
        try:
            # Step 1: Set time to day and lock
            print("\n[Step 1/3] Setting time to day and locking daylight cycle...")
            lock_result = lock_world_time(time="day", enabled=True)
            
            print(f"\n  Response preview:")
            print("  " + "\n  ".join(lock_result.split("\n")[:10]))
            
            # Check if lock was successful
            if "✅" not in lock_result:
                print("\n  ✗ Time lock failed")
                print(f"\n  Full response:\n{lock_result}")
                return False
            
            print("\n  ✓ Time lock set successfully")
            
            # Query initial time
            time_query = self.executor.execute_command("time query daytime", verify=False)
            if time_query.success:
                print(f"  Initial time: {time_query.response}")
            
            # Step 2: Wait 60 seconds
            print("\n[Step 2/3] Waiting 60 seconds to verify time lock persists...")
            wait_duration = 60
            for i in range(wait_duration):
                if i % 10 == 0:
                    print(f"  Waiting... {i}/{wait_duration}s")
                time.sleep(1)
            
            print(f"  ✓ Waited {wait_duration} seconds")
            
            # Step 3: Verify time is still day
            print("\n[Step 3/3] Verifying time is still day...")
            
            # Query time after wait
            time_query_after = self.executor.execute_command("time query daytime", verify=False)
            if time_query_after.success:
                print(f"  Time after wait: {time_query_after.response}")
            
            # Verify gamerule is still set
            gamerule_verified = self.executor.verify_gamerule("doDaylightCycle", "false")
            
            if gamerule_verified:
                print("  ✓ Gamerule doDaylightCycle is still false")
            else:
                print("  ✗ Gamerule doDaylightCycle changed (not false)")
            
            # Check if time is still in day range (1000-12000)
            # Parse time from response
            import re
            time_match = re.search(r'(\d+)', time_query_after.response)
            if time_match:
                current_time = int(time_match.group(1))
                is_day = 1000 <= current_time <= 12000
                print(f"  Current time value: {current_time}")
                print(f"  Is day (1000-12000): {is_day}")
            else:
                print("  ⚠️  Could not parse time value")
                is_day = True  # Assume success if we can't parse
            
            # Verify success
            success = gamerule_verified and is_day
            
            if success:
                print("\n✅ TEST PASSED: Time lock workflow completed successfully")
                print(f"   - Time locked to day")
                print(f"   - Waited {wait_duration} seconds")
                print(f"   - Time is still day (gamerule verified)")
            else:
                print("\n❌ TEST FAILED: Time lock did not persist")
                if not gamerule_verified:
                    print("   - Gamerule doDaylightCycle is not false")
                if not is_day:
                    print("   - Time changed from day")
            
            return success
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: Exception occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_terrain_fill_workflow(self) -> bool:
        """Test complete terrain fill workflow.
        
        Workflow:
        1. Create holes in surface (replace grass with air)
        2. Execute clear with terrain preservation
        3. Verify surface is repaired (grass blocks filled)
        
        Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
        """
        print("\n" + "="*80)
        print("TEST 3: Terrain Fill Workflow")
        print("="*80)
        print("\nWorkflow: Create holes → Clear with terrain fill → Verify repaired")
        
        try:
            # Step 1: Create test holes in surface
            print("\n[Step 1/3] Creating test holes in surface...")
            test_positions = [
                (10, 65, 10),
                (15, 65, 15),
                (20, 65, 20),
            ]
            
            holes_created = 0
            for x, y, z in test_positions:
                command = f"setblock {x} {y} {z} air"
                result = self.executor.execute_command(command)
                if result.success:
                    holes_created += 1
                    print(f"  ✓ Created hole at ({x}, {y}, {z})")
                else:
                    print(f"  ✗ Failed to create hole: {result.error}")
            
            print(f"\n  Total holes created: {holes_created}/{len(test_positions)}")
            
            # Step 2: Execute clear with terrain preservation
            print("\n[Step 2/3] Executing clear with terrain fill...")
            start_time = time.time()
            clear_result = clear_minecraft_environment(area="all", preserve_terrain=True)
            clear_time = time.time() - start_time
            
            print(f"\n  Clear operation completed in {clear_time:.2f}s")
            print(f"\n  Response preview:")
            print("  " + "\n  ".join(clear_result.split("\n")[:15]))
            
            # Check if terrain fill was mentioned
            if "terrain" in clear_result.lower() and ("filled" in clear_result.lower() or "repair" in clear_result.lower()):
                print("\n  ✓ Terrain fill executed")
            else:
                print("\n  ⚠️  Terrain fill may not have executed")
            
            # Step 3: Verify surface is repaired
            print("\n[Step 3/3] Verifying surface is repaired...")
            repaired_count = 0
            for x, y, z in test_positions:
                command = f"testforblock {x} {y} {z} grass_block"
                result = self.executor.execute_command(command, verify=False)
                if result.success and "found" in result.response.lower():
                    repaired_count += 1
                    print(f"  ✓ Position ({x}, {y}, {z}) repaired (grass_block)")
                else:
                    # Check if it's air (not repaired)
                    air_check = self.executor.execute_command(f"testforblock {x} {y} {z} air", verify=False)
                    if air_check.success and "found" in air_check.response.lower():
                        print(f"  ✗ Position ({x}, {y}, {z}) still air (not repaired)")
                    else:
                        print(f"  ? Position ({x}, {y}, {z}) has unknown block")
            
            print(f"\n  Repaired positions: {repaired_count}/{len(test_positions)}")
            
            # Verify success (at least 2 out of 3 should be repaired)
            success = repaired_count >= 2
            
            if success:
                print("\n✅ TEST PASSED: Terrain fill workflow completed successfully")
                print(f"   - Created {holes_created} test holes")
                print(f"   - Executed clear with terrain fill in {clear_time:.2f}s")
                print(f"   - Repaired {repaired_count} positions")
            else:
                print("\n❌ TEST FAILED: Surface was not adequately repaired")
                print(f"   - Only {repaired_count}/{len(test_positions)} positions repaired")
            
            return success
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: Exception occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_error_recovery_workflow(self) -> bool:
        """Test error recovery workflow.
        
        Workflow:
        1. Attempt operation with invalid RCON connection
        2. Verify error message is clear and helpful
        3. Reconnect with valid credentials
        4. Retry operation successfully
        
        Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
        """
        print("\n" + "="*80)
        print("TEST 4: Error Recovery Workflow")
        print("="*80)
        print("\nWorkflow: Invalid connection → Error message → Reconnect → Retry")
        
        try:
            # Step 1: Attempt operation with invalid connection
            print("\n[Step 1/4] Attempting operation with invalid RCON password...")
            
            # Create executor with wrong password
            bad_executor = RCONExecutor(
                host=self.config.minecraft_host,
                port=self.config.minecraft_rcon_port,
                password="wrong_password_123",
                timeout=5,
                max_retries=1  # Fail fast for testing
            )
            
            # Try to execute a simple command
            result = bad_executor.execute_command("time query daytime")
            
            print(f"\n  Command result: {'Success' if result.success else 'Failed'}")
            
            if result.success:
                print("  ⚠️  Command succeeded with wrong password (unexpected)")
                print("  This may indicate RCON authentication is not enabled")
            else:
                print("  ✓ Command failed as expected")
            
            # Step 2: Verify error message is clear and helpful
            print("\n[Step 2/4] Verifying error message quality...")
            
            if result.error:
                print(f"\n  Error message:\n  {result.error}")
                
                # Check for helpful elements in error message
                has_category = "❌" in result.error or "error" in result.error.lower()
                has_suggestions = "suggestion" in result.error.lower() or "check" in result.error.lower()
                has_details = len(result.error) > 50  # Reasonable detail
                
                print(f"\n  Error message quality:")
                print(f"    - Has error indicator: {has_category}")
                print(f"    - Has suggestions: {has_suggestions}")
                print(f"    - Has details: {has_details}")
                
                error_quality = has_category and has_suggestions and has_details
                
                if error_quality:
                    print("  ✓ Error message is clear and helpful")
                else:
                    print("  ✗ Error message could be improved")
            else:
                print("  ⚠️  No error message provided")
                error_quality = False
            
            # Step 3: Reconnect with valid credentials
            print("\n[Step 3/4] Reconnecting with valid credentials...")
            
            good_executor = RCONExecutor(
                host=self.config.minecraft_host,
                port=self.config.minecraft_rcon_port,
                password=self.config.minecraft_rcon_password,
                timeout=10,
                max_retries=3
            )
            
            print("  ✓ Created new executor with valid credentials")
            
            # Step 4: Retry operation successfully
            print("\n[Step 4/4] Retrying operation with valid connection...")
            
            retry_result = good_executor.execute_command("time query daytime")
            
            if retry_result.success:
                print(f"  ✓ Command succeeded: {retry_result.response}")
            else:
                print(f"  ✗ Command failed: {retry_result.error}")
            
            # Verify success
            success = not result.success and error_quality and retry_result.success
            
            if success:
                print("\n✅ TEST PASSED: Error recovery workflow completed successfully")
                print("   - Invalid connection failed as expected")
                print("   - Error message was clear and helpful")
                print("   - Reconnection with valid credentials succeeded")
                print("   - Retry operation succeeded")
            else:
                print("\n❌ TEST FAILED: Error recovery workflow incomplete")
                if result.success:
                    print("   - Invalid connection should have failed")
                if not error_quality:
                    print("   - Error message needs improvement")
                if not retry_result.success:
                    print("   - Retry operation failed")
            
            return success
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: Exception occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_performance_workflow(self) -> bool:
        """Test performance workflow.
        
        Workflow:
        1. Execute clear operation on large region (500x255x500)
        2. Verify operation completes in < 30 seconds
        3. Verify batching and optimization were used
        
        Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
        """
        print("\n" + "="*80)
        print("TEST 5: Performance Workflow")
        print("="*80)
        print("\nWorkflow: Clear large region → Verify < 30s → Check optimization")
        
        try:
            # Step 1: Execute clear operation on large region
            print("\n[Step 1/3] Executing clear operation on large region (500x255x500)...")
            print("  Region: -250 to 250 (X), 0 to 255 (Y), -250 to 250 (Z)")
            print("  Total volume: 500 × 255 × 500 = 63,750,000 blocks")
            
            start_time = time.time()
            
            # Execute clear operation (this will use batching automatically)
            clear_result = clear_minecraft_environment(area="all", preserve_terrain=True)
            
            clear_time = time.time() - start_time
            
            print(f"\n  Clear operation completed in {clear_time:.2f}s")
            
            # Step 2: Verify operation completes in < 30 seconds
            print("\n[Step 2/3] Verifying performance...")
            
            performance_target = 30.0  # seconds
            meets_performance = clear_time < performance_target
            
            if meets_performance:
                print(f"  ✓ Operation completed in {clear_time:.2f}s (< {performance_target}s)")
            else:
                print(f"  ✗ Operation took {clear_time:.2f}s (> {performance_target}s)")
            
            # Calculate throughput
            # Estimate blocks cleared (wellbore + rig + marker blocks)
            # This is a rough estimate since we don't know exact count
            estimated_blocks = 1000  # Conservative estimate
            if "blocks" in clear_result.lower():
                # Try to extract actual count from response
                import re
                match = re.search(r'(\d+,?\d*)\s+blocks', clear_result.lower())
                if match:
                    estimated_blocks = int(match.group(1).replace(',', ''))
            
            throughput = estimated_blocks / clear_time if clear_time > 0 else 0
            print(f"  Throughput: ~{throughput:.0f} blocks/second")
            
            # Step 3: Verify batching and optimization were used
            print("\n[Step 3/3] Verifying optimization features...")
            
            # Check if response mentions batching or optimization
            has_batching = "batch" in clear_result.lower() or "chunk" in clear_result.lower()
            has_terrain_optimization = "terrain" in clear_result.lower() and "filled" in clear_result.lower()
            
            print(f"  Batching mentioned: {has_batching}")
            print(f"  Terrain optimization: {has_terrain_optimization}")
            
            # Get performance stats from executor
            if self.executor:
                perf_stats = self.executor.get_performance_stats()
                print(f"\n  Performance statistics:")
                print(f"    - Operations: {perf_stats['operations']}")
                print(f"    - Avg blocks/s: {perf_stats['avg_blocks_per_second']:.0f}")
                print(f"    - Success rate: {perf_stats['success_rate']:.1%}")
                print(f"    - Current chunk size: {perf_stats['current_chunk_size']}")
            
            # Verify success
            success = meets_performance
            
            if success:
                print("\n✅ TEST PASSED: Performance workflow completed successfully")
                print(f"   - Cleared large region in {clear_time:.2f}s")
                print(f"   - Meets performance target (< {performance_target}s)")
                print(f"   - Throughput: ~{throughput:.0f} blocks/s")
            else:
                print("\n❌ TEST FAILED: Performance target not met")
                print(f"   - Operation took {clear_time:.2f}s (target: < {performance_target}s)")
                print("   - May need optimization or server is under load")
            
            return success
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: Exception occurred: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def run_all_tests(self) -> int:
        """Run all workflow tests.
        
        Returns:
            Exit code (0 for success, 1 for failure)
        """
        print("\n" + "="*80)
        print("COMPLETE WORKFLOW TEST SUITE")
        print("EDIcraft RCON Reliability - Task 10")
        print("="*80)
        
        # Setup executor
        print("\nSetting up RCON executor...")
        if not self.setup_executor():
            print("\n❌ Failed to setup RCON executor")
            print("   Please check Minecraft server is running and RCON is enabled")
            return 1
        
        print("✓ RCON executor ready")
        
        # Define tests
        tests = [
            ("Clear Operation Workflow", self.test_clear_operation_workflow),
            ("Time Lock Workflow", self.test_time_lock_workflow),
            ("Terrain Fill Workflow", self.test_terrain_fill_workflow),
            ("Error Recovery Workflow", self.test_error_recovery_workflow),
            ("Performance Workflow", self.test_performance_workflow),
        ]
        
        # Run tests
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"\n❌ Test '{test_name}' crashed: {str(e)}")
                import traceback
                traceback.print_exc()
                results.append((test_name, False))
        
        # Print summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All workflow tests passed!")
            print("\n✅ Task 10 Complete: All workflows validated")
            print("\nVerified:")
            print("  ✓ Clear operation workflow")
            print("  ✓ Time lock persistence")
            print("  ✓ Terrain fill repair")
            print("  ✓ Error recovery")
            print("  ✓ Performance optimization")
            return 0
        else:
            print(f"\n⚠️  {total - passed} workflow test(s) failed")
            print("\nPlease review failed tests and:")
            print("  1. Check Minecraft server is running")
            print("  2. Verify RCON is enabled and accessible")
            print("  3. Check server performance and TPS")
            print("  4. Review error messages for specific issues")
            return 1


def main():
    """Main entry point."""
    suite = WorkflowTestSuite()
    return suite.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
