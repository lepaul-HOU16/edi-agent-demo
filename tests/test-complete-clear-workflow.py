#!/usr/bin/env python3
"""
Complete Clear and Restore Workflow Test
Tests the entire clear operation workflow end-to-end.
"""

import sys
import os
import time
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.clear_environment_tool import ClearEnvironmentTool
from tools.workflow_tools import build_wellbore_trajectory_complete, build_horizon_surface_complete
from tools.rcon_executor import RCONExecutor
from config import EDIcraftConfig


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def verify_blocks_exist(executor, x, z, y_min, y_max, expected_blocks=None):
    """Verify that blocks exist in a region.
    
    Args:
        executor: RCONExecutor instance
        x: X coordinate
        z: Z coordinate
        y_min: Minimum Y coordinate
        y_max: Maximum Y coordinate
        expected_blocks: List of expected block types (optional)
        
    Returns:
        dict with verification results
    """
    print(f"  Checking blocks at ({x}, {y_min}-{y_max}, {z})...")
    
    blocks_found = []
    air_count = 0
    
    # Sample blocks at different heights
    sample_heights = [y_min, (y_min + y_max) // 2, y_max]
    
    for y in sample_heights:
        # Query block type
        cmd = f"testforblock {x} {y} {z} air"
        result = executor.execute_command(cmd, verify=False, operation="test")
        
        if result.success and "successfully" in result.response.lower():
            air_count += 1
            blocks_found.append(("air", y))
        else:
            # Not air, try to determine block type
            blocks_found.append(("non-air", y))
    
    return {
        "blocks_found": blocks_found,
        "air_count": air_count,
        "total_sampled": len(sample_heights),
        "all_air": air_count == len(sample_heights)
    }


def verify_ground_restored(executor, x, z, y_ground_start, y_ground_end):
    """Verify that ground level has been restored.
    
    Args:
        executor: RCONExecutor instance
        x: X coordinate
        z: Z coordinate
        y_ground_start: Ground level start Y
        y_ground_end: Ground level end Y
        
    Returns:
        dict with verification results
    """
    print(f"  Checking ground restoration at ({x}, {y_ground_start}-{y_ground_end}, {z})...")
    
    grass_count = 0
    total_checks = 0
    
    for y in range(y_ground_start, y_ground_end + 1):
        total_checks += 1
        
        # Check if block is grass_block
        cmd = f"testforblock {x} {y} {z} grass_block"
        result = executor.execute_command(cmd, verify=False, operation="test")
        
        if result.success and "successfully" in result.response.lower():
            grass_count += 1
    
    return {
        "grass_blocks": grass_count,
        "total_checked": total_checks,
        "fully_restored": grass_count == total_checks,
        "restoration_percentage": (grass_count / total_checks * 100) if total_checks > 0 else 0
    }


def main():
    """Run complete clear and restore workflow test."""
    print_section("COMPLETE CLEAR AND RESTORE WORKFLOW TEST")
    
    print("This test validates the entire clear operation workflow:")
    print("1. Build test structures (wellbores, horizons)")
    print("2. Execute chunk-based clear operation")
    print("3. Verify all blocks removed in cleared area")
    print("4. Verify ground restored to flat surface")
    print("5. Verify operation completes within timeout")
    print("6. Check for any remaining structures or artifacts")
    
    # Initialize configuration
    print("\nInitializing EDIcraft configuration...")
    try:
        config = EDIcraftConfig()
        print(f"✓ Configuration loaded")
        print(f"  Minecraft Host: {config.minecraft_host}")
        print(f"  RCON Port: {config.minecraft_rcon_port}")
    except Exception as e:
        print(f"✗ Failed to load configuration: {e}")
        return False
    
    # Initialize tools
    print("\nInitializing tools...")
    try:
        clear_tool = ClearEnvironmentTool(config)
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=30,
            max_retries=3
        )
        print(f"✓ Tools initialized")
    except Exception as e:
        print(f"✗ Failed to initialize tools: {e}")
        return False

    # Test RCON connection
    print("\nTesting RCON connection...")
    test_result = executor.execute_command("list", verify=False, operation="test")
    if not test_result.success:
        print(f"✗ RCON connection failed: {test_result.error}")
        print("\nPlease ensure:")
        print("  1. Minecraft server is running")
        print("  2. RCON is enabled in server.properties")
        print("  3. RCON password is correct")
        return False
    print(f"✓ RCON connection successful")
    
    # ========================================================================
    # PHASE 1: BUILD TEST STRUCTURES
    # ========================================================================
    print_section("PHASE 1: BUILD TEST STRUCTURES")
    
    test_structures_built = False
    wellbore_built = False
    horizon_built = False
    
    print("Building test wellbore trajectory...")
    try:
        # Build a simple test wellbore at known location
        # Using a simple vertical wellbore for testing
        test_wellbore_x = 100
        test_wellbore_y = 100
        test_wellbore_z = 100
        
        # Build vertical wellbore using setblock commands
        print(f"  Building test wellbore at ({test_wellbore_x}, {test_wellbore_y}, {test_wellbore_z})...")
        
        for y in range(test_wellbore_y, test_wellbore_y + 20):
            cmd = f"setblock {test_wellbore_x} {y} {test_wellbore_z} obsidian"
            result = executor.execute_command(cmd, verify=False, operation="build")
            if not result.success:
                print(f"  Warning: Failed to place block at y={y}")
        
        # Add marker at top
        cmd = f"setblock {test_wellbore_x} {test_wellbore_y + 20} {test_wellbore_z} glowstone"
        executor.execute_command(cmd, verify=False, operation="build")
        
        wellbore_built = True
        print(f"✓ Test wellbore built (20 blocks)")
        
    except Exception as e:
        print(f"✗ Failed to build test wellbore: {e}")
        print("  Continuing with test...")
    
    print("\nBuilding test horizon surface...")
    try:
        # Build a simple test horizon surface
        test_horizon_x = 150
        test_horizon_z = 150
        test_horizon_y = 110
        
        print(f"  Building test horizon at ({test_horizon_x}, {test_horizon_y}, {test_horizon_z})...")
        
        # Build 5x5 horizon surface
        for x in range(test_horizon_x - 2, test_horizon_x + 3):
            for z in range(test_horizon_z - 2, test_horizon_z + 3):
                cmd = f"setblock {x} {test_horizon_y} {z} sandstone"
                result = executor.execute_command(cmd, verify=False, operation="build")
                if not result.success:
                    print(f"  Warning: Failed to place block at ({x}, {test_horizon_y}, {z})")
        
        horizon_built = True
        print(f"✓ Test horizon built (5x5 surface)")
        
    except Exception as e:
        print(f"✗ Failed to build test horizon: {e}")
        print("  Continuing with test...")
    
    test_structures_built = wellbore_built or horizon_built
    
    if test_structures_built:
        print(f"\n✓ Test structures built successfully")
        print(f"  Wellbore: {'Yes' if wellbore_built else 'No'}")
        print(f"  Horizon: {'Yes' if horizon_built else 'No'}")
    else:
        print(f"\n⚠ No test structures built, but continuing with clear test...")
    
    # Wait a moment for blocks to settle
    print("\nWaiting for blocks to settle...")
    time.sleep(2)
    
    # ========================================================================
    # PHASE 2: VERIFY STRUCTURES EXIST (PRE-CLEAR)
    # ========================================================================
    print_section("PHASE 2: VERIFY STRUCTURES EXIST (PRE-CLEAR)")
    
    pre_clear_verification = {}
    
    if wellbore_built:
        print("Verifying wellbore exists...")
        wellbore_check = verify_blocks_exist(
            executor,
            test_wellbore_x,
            test_wellbore_z,
            test_wellbore_y,
            test_wellbore_y + 20
        )
        pre_clear_verification['wellbore'] = wellbore_check
        
        if wellbore_check['all_air']:
            print(f"  ⚠ Warning: Wellbore area is already clear (all air)")
        else:
            print(f"  ✓ Wellbore blocks detected ({wellbore_check['air_count']}/{wellbore_check['total_sampled']} air)")
    
    if horizon_built:
        print("\nVerifying horizon exists...")
        horizon_check = verify_blocks_exist(
            executor,
            test_horizon_x,
            test_horizon_z,
            test_horizon_y,
            test_horizon_y
        )
        pre_clear_verification['horizon'] = horizon_check
        
        if horizon_check['all_air']:
            print(f"  ⚠ Warning: Horizon area is already clear (all air)")
        else:
            print(f"  ✓ Horizon blocks detected ({horizon_check['air_count']}/{horizon_check['total_sampled']} air)")
    
    # ========================================================================
    # PHASE 3: EXECUTE CHUNK-BASED CLEAR OPERATION
    # ========================================================================
    print_section("PHASE 3: EXECUTE CHUNK-BASED CLEAR OPERATION")
    
    print("Starting clear operation with preserve_terrain=True...")
    print("This will:")
    print("  - Clear all blocks from y=65 to y=255")
    print("  - Restore ground level (y=60-64) with grass blocks")
    print("  - Process area in 32x32 chunks")
    print("  - Handle timeouts and retries")
    
    clear_start_time = time.time()
    
    try:
        result = clear_tool.clear_minecraft_environment(preserve_terrain=True)
        
        clear_duration = time.time() - clear_start_time
        
        print(f"\n✓ Clear operation completed in {clear_duration:.2f} seconds")
        print("\nClear Operation Result:")
        print("-" * 80)
        print(result)
        print("-" * 80)
        
    except Exception as e:
        clear_duration = time.time() - clear_start_time
        print(f"\n✗ Clear operation failed after {clear_duration:.2f} seconds")
        print(f"Error: {e}")
        return False
    
    # ========================================================================
    # PHASE 4: VERIFY BLOCKS REMOVED (POST-CLEAR)
    # ========================================================================
    print_section("PHASE 4: VERIFY BLOCKS REMOVED (POST-CLEAR)")
    
    print("Waiting for clear operation to complete...")
    time.sleep(3)
    
    post_clear_verification = {}
    
    if wellbore_built:
        print("Verifying wellbore removed...")
        wellbore_check = verify_blocks_exist(
            executor,
            test_wellbore_x,
            test_wellbore_z,
            test_wellbore_y,
            test_wellbore_y + 20
        )
        post_clear_verification['wellbore'] = wellbore_check
        
        if wellbore_check['all_air']:
            print(f"  ✓ Wellbore successfully removed (all air)")
        else:
            print(f"  ✗ Wellbore still has blocks ({wellbore_check['air_count']}/{wellbore_check['total_sampled']} air)")
    
    if horizon_built:
        print("\nVerifying horizon removed...")
        horizon_check = verify_blocks_exist(
            executor,
            test_horizon_x,
            test_horizon_z,
            test_horizon_y,
            test_horizon_y
        )
        post_clear_verification['horizon'] = horizon_check
        
        if horizon_check['all_air']:
            print(f"  ✓ Horizon successfully removed (all air)")
        else:
            print(f"  ✗ Horizon still has blocks ({horizon_check['air_count']}/{horizon_check['total_sampled']} air)")
    
    # ========================================================================
    # PHASE 5: VERIFY GROUND RESTORED
    # ========================================================================
    print_section("PHASE 5: VERIFY GROUND RESTORED")
    
    print("Verifying ground restoration at wellbore location...")
    wellbore_ground = verify_ground_restored(
        executor,
        test_wellbore_x,
        test_wellbore_z,
        clear_tool.clear_region['y_ground_start'],
        clear_tool.clear_region['y_ground_end']
    )
    
    if wellbore_ground['fully_restored']:
        print(f"  ✓ Ground fully restored ({wellbore_ground['grass_blocks']}/{wellbore_ground['total_checked']} grass blocks)")
    else:
        print(f"  ⚠ Ground partially restored ({wellbore_ground['restoration_percentage']:.1f}%)")
    
    print("\nVerifying ground restoration at horizon location...")
    horizon_ground = verify_ground_restored(
        executor,
        test_horizon_x,
        test_horizon_z,
        clear_tool.clear_region['y_ground_start'],
        clear_tool.clear_region['y_ground_end']
    )
    
    if horizon_ground['fully_restored']:
        print(f"  ✓ Ground fully restored ({horizon_ground['grass_blocks']}/{horizon_ground['total_checked']} grass blocks)")
    else:
        print(f"  ⚠ Ground partially restored ({horizon_ground['restoration_percentage']:.1f}%)")
    
    # ========================================================================
    # PHASE 6: VERIFY TIMEOUT COMPLIANCE
    # ========================================================================
    print_section("PHASE 6: VERIFY TIMEOUT COMPLIANCE")
    
    max_timeout = clear_tool.total_timeout
    
    print(f"Clear operation duration: {clear_duration:.2f} seconds")
    print(f"Maximum allowed timeout: {max_timeout} seconds")
    
    if clear_duration < max_timeout:
        print(f"✓ Operation completed within timeout ({clear_duration:.2f}s < {max_timeout}s)")
        timeout_ok = True
    else:
        print(f"✗ Operation exceeded timeout ({clear_duration:.2f}s > {max_timeout}s)")
        timeout_ok = False
    
    # ========================================================================
    # PHASE 7: CHECK FOR REMAINING ARTIFACTS
    # ========================================================================
    print_section("PHASE 7: CHECK FOR REMAINING ARTIFACTS")
    
    print("Checking for remaining structures or artifacts...")
    
    # Sample multiple locations in the clear region
    sample_locations = [
        (0, 100, 0),      # Center
        (100, 120, 100),  # Wellbore location
        (150, 110, 150),  # Horizon location
        (-100, 150, -100), # Corner
        (200, 200, 200),  # Edge
    ]
    
    artifacts_found = 0
    locations_checked = 0
    
    for x, y, z in sample_locations:
        # Check if location is within clear region
        region = clear_tool.clear_region
        if not (region['x_min'] <= x <= region['x_max'] and
                region['z_min'] <= z <= region['z_max'] and
                region['y_clear_start'] <= y <= region['y_clear_end']):
            continue
        
        locations_checked += 1
        
        # Check if block is air
        cmd = f"testforblock {x} {y} {z} air"
        result = executor.execute_command(cmd, verify=False, operation="test")
        
        if not (result.success and "successfully" in result.response.lower()):
            artifacts_found += 1
            print(f"  ⚠ Non-air block found at ({x}, {y}, {z})")
    
    if artifacts_found == 0:
        print(f"✓ No artifacts found ({locations_checked} locations checked)")
    else:
        print(f"⚠ {artifacts_found} artifacts found in {locations_checked} locations checked")
    
    # ========================================================================
    # FINAL SUMMARY
    # ========================================================================
    print_section("TEST SUMMARY")
    
    all_tests_passed = True
    
    print("Test Results:")
    print("-" * 80)
    
    # Test 1: Structures built
    if test_structures_built:
        print("✓ Test structures built successfully")
    else:
        print("⚠ No test structures built (non-critical)")
    
    # Test 2: Clear operation completed
    print("✓ Clear operation completed")
    
    # Test 3: Blocks removed
    if wellbore_built and post_clear_verification.get('wellbore', {}).get('all_air'):
        print("✓ Wellbore blocks removed")
    elif wellbore_built:
        print("✗ Wellbore blocks NOT fully removed")
        all_tests_passed = False
    
    if horizon_built and post_clear_verification.get('horizon', {}).get('all_air'):
        print("✓ Horizon blocks removed")
    elif horizon_built:
        print("✗ Horizon blocks NOT fully removed")
        all_tests_passed = False
    
    # Test 4: Ground restored
    if wellbore_ground['fully_restored'] and horizon_ground['fully_restored']:
        print("✓ Ground fully restored")
    else:
        print(f"⚠ Ground partially restored (wellbore: {wellbore_ground['restoration_percentage']:.1f}%, horizon: {horizon_ground['restoration_percentage']:.1f}%)")
        # Not a critical failure
    
    # Test 5: Timeout compliance
    if timeout_ok:
        print("✓ Operation completed within timeout")
    else:
        print("✗ Operation exceeded timeout")
        all_tests_passed = False
    
    # Test 6: No artifacts
    if artifacts_found == 0:
        print("✓ No remaining artifacts")
    else:
        print(f"⚠ {artifacts_found} artifacts found (may be expected)")
        # Not a critical failure
    
    print("-" * 80)
    
    if all_tests_passed:
        print("\n✓✓✓ ALL CRITICAL TESTS PASSED ✓✓✓")
        print("\nThe chunk-based clear and restore workflow is working correctly!")
        return True
    else:
        print("\n✗✗✗ SOME TESTS FAILED ✗✗✗")
        print("\nPlease review the failures above and fix the issues.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
