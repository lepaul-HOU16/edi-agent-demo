#!/usr/bin/env python3
"""
Test script for chunk-based clear algorithm.
Tests the chunk calculation and clear logic without requiring a Minecraft server.
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.clear_environment_tool import ClearEnvironmentTool, ChunkClearResult, ClearOperationResult
from config import EDIcraftConfig


def test_chunk_calculation():
    """Test that chunks are calculated correctly."""
    print("Testing chunk calculation...")
    
    # Create mock config
    class MockConfig:
        minecraft_host = "localhost"
        minecraft_rcon_port = 25575
        minecraft_rcon_password = "test"
    
    tool = ClearEnvironmentTool(MockConfig())
    
    # Calculate chunks
    chunks = tool._calculate_chunks()
    
    print(f"✓ Total chunks calculated: {len(chunks)}")
    print(f"✓ Clear region: X({tool.clear_region['x_min']} to {tool.clear_region['x_max']}), "
          f"Z({tool.clear_region['z_min']} to {tool.clear_region['z_max']})")
    print(f"✓ Chunk size: {tool.chunk_size}x{tool.chunk_size}")
    
    # Verify chunk count
    x_range = tool.clear_region['x_max'] - tool.clear_region['x_min'] + 1
    z_range = tool.clear_region['z_max'] - tool.clear_region['z_min'] + 1
    expected_x_chunks = (x_range + tool.chunk_size - 1) // tool.chunk_size
    expected_z_chunks = (z_range + tool.chunk_size - 1) // tool.chunk_size
    expected_total = expected_x_chunks * expected_z_chunks
    
    print(f"✓ Expected chunks: {expected_total} ({expected_x_chunks} x {expected_z_chunks})")
    
    if len(chunks) == expected_total:
        print("✅ Chunk calculation PASSED")
    else:
        print(f"❌ Chunk calculation FAILED: expected {expected_total}, got {len(chunks)}")
        return False
    
    # Verify first and last chunk coordinates
    first_chunk = chunks[0]
    last_chunk = chunks[-1]
    
    print(f"✓ First chunk: ({first_chunk[0]}, {first_chunk[1]})")
    print(f"✓ Last chunk: ({last_chunk[0]}, {last_chunk[1]})")
    
    # Verify chunks cover the entire region
    if first_chunk[0] == tool.clear_region['x_min'] and first_chunk[1] == tool.clear_region['z_min']:
        print("✅ First chunk starts at region minimum")
    else:
        print("❌ First chunk does not start at region minimum")
        return False
    
    return True


def test_chunk_clear_result():
    """Test ChunkClearResult dataclass."""
    print("\nTesting ChunkClearResult...")
    
    result = ChunkClearResult(
        x_start=0,
        z_start=0,
        cleared=True,
        ground_restored=True,
        blocks_cleared=195000,
        blocks_restored=5120,
        execution_time=2.5,
        error=None
    )
    
    print(f"✓ Chunk result created: cleared={result.cleared}, "
          f"blocks_cleared={result.blocks_cleared}, "
          f"blocks_restored={result.blocks_restored}")
    
    if result.cleared and result.blocks_cleared > 0:
        print("✅ ChunkClearResult PASSED")
        return True
    else:
        print("❌ ChunkClearResult FAILED")
        return False


def test_clear_operation_result():
    """Test ClearOperationResult dataclass."""
    print("\nTesting ClearOperationResult...")
    
    result = ClearOperationResult()
    result.total_chunks = 100
    result.successful_chunks = 95
    result.failed_chunks = 5
    result.total_blocks_cleared = 18525000
    result.total_blocks_restored = 486400
    result.execution_time = 250.0
    
    print(f"✓ Operation result: {result.successful_chunks}/{result.total_chunks} chunks successful")
    print(f"✓ Success property: {result.success}")
    
    if result.success and result.successful_chunks > 0:
        print("✅ ClearOperationResult PASSED")
        return True
    else:
        print("❌ ClearOperationResult FAILED")
        return False


def test_configuration():
    """Test clear configuration."""
    print("\nTesting clear configuration...")
    
    class MockConfig:
        minecraft_host = "localhost"
        minecraft_rcon_port = 25575
        minecraft_rcon_password = "test"
    
    tool = ClearEnvironmentTool(MockConfig())
    
    print(f"✓ Clear region Y range: {tool.clear_region['y_clear_start']} to {tool.clear_region['y_clear_end']}")
    print(f"✓ Ground level Y range: {tool.clear_region['y_ground_start']} to {tool.clear_region['y_ground_end']}")
    print(f"✓ Chunk size: {tool.chunk_size}")
    print(f"✓ Chunk timeout: {tool.chunk_timeout}s")
    print(f"✓ Max chunk retries: {tool.max_chunk_retries}")
    print(f"✓ Total timeout: {tool.total_timeout}s")
    
    # Verify configuration values
    if (tool.clear_region['y_clear_start'] == 65 and
        tool.clear_region['y_clear_end'] == 255 and
        tool.clear_region['y_ground_start'] == 60 and
        tool.clear_region['y_ground_end'] == 64 and
        tool.chunk_size == 32 and
        tool.chunk_timeout == 30 and
        tool.max_chunk_retries == 3 and
        tool.total_timeout == 300):
        print("✅ Configuration PASSED")
        return True
    else:
        print("❌ Configuration FAILED")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Chunk-Based Clear Algorithm Tests")
    print("=" * 60)
    
    tests = [
        test_configuration,
        test_chunk_calculation,
        test_chunk_clear_result,
        test_clear_operation_result
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
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("✅ All tests PASSED!")
        return 0
    else:
        print(f"❌ {failed} test(s) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
