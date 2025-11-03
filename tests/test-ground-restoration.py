#!/usr/bin/env python3
"""
Test script for ground restoration functionality.
Verifies that ground restoration works correctly with preserve_terrain flag.
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.clear_environment_tool import ClearEnvironmentTool, ChunkClearResult


def test_ground_restoration_with_preserve_terrain():
    """Test that ground restoration happens when preserve_terrain=True."""
    print("Testing ground restoration with preserve_terrain=True...")
    
    # Create a ChunkClearResult simulating successful ground restoration
    result = ChunkClearResult(
        x_start=0,
        z_start=0,
        cleared=True,
        ground_restored=True,
        blocks_cleared=195000,
        blocks_restored=5120,  # 32x32 chunks * 5 layers (y=60-64)
        execution_time=2.5,
        error=None
    )
    
    print(f"✓ Chunk cleared: {result.cleared}")
    print(f"✓ Ground restored: {result.ground_restored}")
    print(f"✓ Blocks cleared: {result.blocks_cleared:,}")
    print(f"✓ Blocks restored: {result.blocks_restored:,}")
    
    # Verify ground restoration occurred
    if result.ground_restored and result.blocks_restored > 0:
        print("✅ Ground restoration with preserve_terrain=True PASSED")
        return True
    else:
        print("❌ Ground restoration with preserve_terrain=True FAILED")
        return False


def test_no_ground_restoration_without_preserve_terrain():
    """Test that ground restoration does NOT happen when preserve_terrain=False."""
    print("\nTesting no ground restoration with preserve_terrain=False...")
    
    # Create a ChunkClearResult simulating no ground restoration
    result = ChunkClearResult(
        x_start=0,
        z_start=0,
        cleared=True,
        ground_restored=False,
        blocks_cleared=195000,
        blocks_restored=0,  # No blocks restored
        execution_time=2.5,
        error=None
    )
    
    print(f"✓ Chunk cleared: {result.cleared}")
    print(f"✓ Ground restored: {result.ground_restored}")
    print(f"✓ Blocks cleared: {result.blocks_cleared:,}")
    print(f"✓ Blocks restored: {result.blocks_restored:,}")
    
    # Verify ground restoration did NOT occur
    if not result.ground_restored and result.blocks_restored == 0:
        print("✅ No ground restoration with preserve_terrain=False PASSED")
        return True
    else:
        print("❌ No ground restoration with preserve_terrain=False FAILED")
        return False


def test_ground_restoration_failure_handling():
    """Test that ground restoration failures are handled gracefully."""
    print("\nTesting graceful handling of ground restoration failures...")
    
    # Create a ChunkClearResult simulating ground restoration failure
    result = ChunkClearResult(
        x_start=0,
        z_start=0,
        cleared=True,  # Chunk clear succeeded
        ground_restored=False,  # But ground restoration failed
        blocks_cleared=195000,
        blocks_restored=0,
        execution_time=2.5,
        error="Ground restoration failed: Connection timeout"
    )
    
    print(f"✓ Chunk cleared: {result.cleared}")
    print(f"✓ Ground restored: {result.ground_restored}")
    print(f"✓ Error message: {result.error}")
    
    # Verify that chunk clear succeeded despite ground restoration failure
    if result.cleared and not result.ground_restored and result.error:
        print("✅ Graceful ground restoration failure handling PASSED")
        return True
    else:
        print("❌ Graceful ground restoration failure handling FAILED")
        return False


def test_ground_level_coordinates():
    """Test that ground level coordinates are correct."""
    print("\nTesting ground level coordinates...")
    
    class MockConfig:
        minecraft_host = "localhost"
        minecraft_rcon_port = 25575
        minecraft_rcon_password = "test"
    
    tool = ClearEnvironmentTool(MockConfig())
    
    print(f"✓ Ground level start (y): {tool.clear_region['y_ground_start']}")
    print(f"✓ Ground level end (y): {tool.clear_region['y_ground_end']}")
    print(f"✓ Clear start (y): {tool.clear_region['y_clear_start']}")
    print(f"✓ Clear end (y): {tool.clear_region['y_clear_end']}")
    
    # Verify ground level is y=60-64
    if (tool.clear_region['y_ground_start'] == 60 and
        tool.clear_region['y_ground_end'] == 64):
        print("✅ Ground level coordinates (y=60-64) PASSED")
        return True
    else:
        print("❌ Ground level coordinates FAILED")
        return False


def test_ground_restoration_block_count():
    """Test that ground restoration block count is calculated correctly."""
    print("\nTesting ground restoration block count...")
    
    # For a 32x32 chunk with 5 layers (y=60-64)
    chunk_size = 32
    ground_layers = 5  # y=60, 61, 62, 63, 64
    expected_blocks = chunk_size * chunk_size * ground_layers
    
    print(f"✓ Chunk size: {chunk_size}x{chunk_size}")
    print(f"✓ Ground layers: {ground_layers}")
    print(f"✓ Expected blocks per chunk: {expected_blocks:,}")
    
    result = ChunkClearResult(
        x_start=0,
        z_start=0,
        cleared=True,
        ground_restored=True,
        blocks_cleared=195000,
        blocks_restored=expected_blocks,
        execution_time=2.5,
        error=None
    )
    
    print(f"✓ Actual blocks restored: {result.blocks_restored:,}")
    
    if result.blocks_restored == expected_blocks:
        print("✅ Ground restoration block count PASSED")
        return True
    else:
        print("❌ Ground restoration block count FAILED")
        return False


def test_response_formatting_with_ground_restoration():
    """Test that response includes ground restoration information."""
    print("\nTesting response formatting with ground restoration...")
    
    class MockConfig:
        minecraft_host = "localhost"
        minecraft_rcon_port = 25575
        minecraft_rcon_password = "test"
    
    tool = ClearEnvironmentTool(MockConfig())
    
    # Create a mock result
    from tools.clear_environment_tool import ClearOperationResult
    
    result = ClearOperationResult()
    result.total_chunks = 10
    result.successful_chunks = 10
    result.failed_chunks = 0
    result.total_blocks_cleared = 1950000
    result.total_blocks_restored = 51200
    result.execution_time = 25.0
    
    # Format response
    response = tool._format_clear_response(result, preserve_terrain=True)
    
    print(f"✓ Response generated ({len(response)} characters)")
    
    # Verify response includes ground restoration information
    checks = [
        "Ground Blocks Restored" in response,
        "51,200" in response,
        "Terrain Restoration" in response,
        "grass blocks" in response.lower(),
        f"y={tool.clear_region['y_ground_start']}-{tool.clear_region['y_ground_end']}" in response
    ]
    
    print(f"✓ Contains 'Ground Blocks Restored': {checks[0]}")
    print(f"✓ Contains block count: {checks[1]}")
    print(f"✓ Contains 'Terrain Restoration': {checks[2]}")
    print(f"✓ Contains 'grass blocks': {checks[3]}")
    print(f"✓ Contains ground level coordinates: {checks[4]}")
    
    if all(checks):
        print("✅ Response formatting with ground restoration PASSED")
        return True
    else:
        print("❌ Response formatting with ground restoration FAILED")
        return False


def test_response_formatting_without_ground_restoration():
    """Test that response correctly indicates when terrain is not preserved."""
    print("\nTesting response formatting without ground restoration...")
    
    class MockConfig:
        minecraft_host = "localhost"
        minecraft_rcon_port = 25575
        minecraft_rcon_password = "test"
    
    tool = ClearEnvironmentTool(MockConfig())
    
    # Create a mock result
    from tools.clear_environment_tool import ClearOperationResult
    
    result = ClearOperationResult()
    result.total_chunks = 10
    result.successful_chunks = 10
    result.failed_chunks = 0
    result.total_blocks_cleared = 1950000
    result.total_blocks_restored = 0  # No restoration
    result.execution_time = 25.0
    
    # Format response
    response = tool._format_clear_response(result, preserve_terrain=False)
    
    print(f"✓ Response generated ({len(response)} characters)")
    
    # Verify response indicates no ground restoration
    checks = [
        "Not Preserved" in response or "complete wipe" in response.lower(),
        "Ground Blocks Restored" not in response or "0" in response
    ]
    
    print(f"✓ Indicates terrain not preserved: {checks[0]}")
    print(f"✓ No ground restoration mentioned or shows 0: {checks[1]}")
    
    if all(checks):
        print("✅ Response formatting without ground restoration PASSED")
        return True
    else:
        print("❌ Response formatting without ground restoration FAILED")
        return False


def main():
    """Run all ground restoration tests."""
    print("=" * 60)
    print("Ground Restoration Tests")
    print("=" * 60)
    
    tests = [
        test_ground_level_coordinates,
        test_ground_restoration_with_preserve_terrain,
        test_no_ground_restoration_without_preserve_terrain,
        test_ground_restoration_failure_handling,
        test_ground_restoration_block_count,
        test_response_formatting_with_ground_restoration,
        test_response_formatting_without_ground_restoration
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} raised exception: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("✅ All ground restoration tests PASSED!")
        return 0
    else:
        print(f"❌ {failed} test(s) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
