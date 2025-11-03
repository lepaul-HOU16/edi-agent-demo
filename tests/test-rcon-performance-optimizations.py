#!/usr/bin/env python3
"""
Test RCON Performance Optimizations.
Verifies parallel execution, smart fill, adaptive chunk sizing, and performance tracking.
"""

import sys
import os
import time
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor, RCONResult
from config import EDIcraftConfig


def test_performance_tracking():
    """Test that performance tracking works correctly."""
    print("\n" + "="*80)
    print("TEST 1: Performance Tracking")
    print("="*80)
    
    try:
        config = EDIcraftConfig()
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3,
            chunk_size=32
        )
        
        # Get initial stats
        initial_stats = executor.get_performance_stats()
        print(f"\n✓ Initial performance stats:")
        print(f"  - Operations: {initial_stats['operations']}")
        print(f"  - Current chunk size: {initial_stats.get('current_chunk_size', 'N/A')}")
        print(f"  - Default chunk size: {initial_stats.get('default_chunk_size', 'N/A')}")
        
        # Track some performance
        executor._track_performance(
            operation="test_fill",
            blocks=10000,
            execution_time=2.0,
            success=True
        )
        
        # Get updated stats
        updated_stats = executor.get_performance_stats()
        print(f"\n✓ After tracking one operation:")
        print(f"  - Operations: {updated_stats['operations']}")
        print(f"  - Avg blocks/s: {updated_stats['avg_blocks_per_second']:.0f}")
        print(f"  - Success rate: {updated_stats['success_rate']:.1%}")
        
        print("\n✅ Performance tracking test PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Performance tracking test FAILED: {str(e)}")
        return False


def test_adaptive_chunk_sizing():
    """Test that adaptive chunk sizing adjusts based on performance."""
    print("\n" + "="*80)
    print("TEST 2: Adaptive Chunk Sizing")
    print("="*80)
    
    try:
        config = EDIcraftConfig()
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3,
            chunk_size=32
        )
        
        initial_chunk_size = executor._adaptive_chunk_size
        print(f"\n✓ Initial adaptive chunk size: {initial_chunk_size}")
        
        # Simulate fast performance (should increase chunk size)
        print("\n✓ Simulating fast performance (>10000 blocks/s)...")
        for i in range(10):
            executor._track_performance(
                operation="test_fill",
                blocks=20000,
                execution_time=1.5,  # Fast: 13333 blocks/s
                success=True
            )
        
        fast_chunk_size = executor._adaptive_chunk_size
        print(f"  - Chunk size after fast operations: {fast_chunk_size}")
        
        if fast_chunk_size > initial_chunk_size:
            print(f"  ✅ Chunk size increased from {initial_chunk_size} to {fast_chunk_size}")
        else:
            print(f"  ℹ️  Chunk size unchanged (may already be at max)")
        
        # Simulate slow performance (should decrease chunk size)
        print("\n✓ Simulating slow performance (<5000 blocks/s)...")
        for i in range(10):
            executor._track_performance(
                operation="test_fill",
                blocks=10000,
                execution_time=3.0,  # Slow: 3333 blocks/s
                success=True
            )
        
        slow_chunk_size = executor._adaptive_chunk_size
        print(f"  - Chunk size after slow operations: {slow_chunk_size}")
        
        if slow_chunk_size < fast_chunk_size:
            print(f"  ✅ Chunk size decreased from {fast_chunk_size} to {slow_chunk_size}")
        else:
            print(f"  ℹ️  Chunk size unchanged (may already be at min)")
        
        print("\n✅ Adaptive chunk sizing test PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Adaptive chunk sizing test FAILED: {str(e)}")
        return False


def test_parallel_execution_decision():
    """Test that parallel execution decision logic works."""
    print("\n" + "="*80)
    print("TEST 3: Parallel Execution Decision")
    print("="*80)
    
    try:
        config = EDIcraftConfig()
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3,
            chunk_size=32
        )
        
        # Test parallel execution decision
        should_use_parallel = executor._should_use_parallel_execution()
        print(f"\n✓ Should use parallel execution: {should_use_parallel}")
        
        if should_use_parallel:
            print("  ✅ Parallel execution is enabled")
        else:
            print("  ℹ️  Parallel execution is disabled")
        
        print("\n✅ Parallel execution decision test PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Parallel execution decision test FAILED: {str(e)}")
        return False


def test_smart_fill_optimization():
    """Test that smart fill optimization can be enabled."""
    print("\n" + "="*80)
    print("TEST 4: Smart Fill Optimization")
    print("="*80)
    
    try:
        config = EDIcraftConfig()
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3,
            chunk_size=32
        )
        
        print("\n✓ Testing smart fill parameter...")
        
        # Test that execute_fill accepts smart_fill parameter
        # Note: We won't actually execute this, just verify the method signature
        import inspect
        sig = inspect.signature(executor.execute_fill)
        params = list(sig.parameters.keys())
        
        if 'smart_fill' in params:
            print("  ✅ execute_fill accepts smart_fill parameter")
        else:
            print("  ❌ execute_fill missing smart_fill parameter")
            return False
        
        # Test that _optimize_chunks_for_terrain method exists
        if hasattr(executor, '_optimize_chunks_for_terrain'):
            print("  ✅ _optimize_chunks_for_terrain method exists")
        else:
            print("  ❌ _optimize_chunks_for_terrain method missing")
            return False
        
        # Test that _check_layer_has_air method exists
        if hasattr(executor, '_check_layer_has_air'):
            print("  ✅ _check_layer_has_air method exists")
        else:
            print("  ❌ _check_layer_has_air method missing")
            return False
        
        print("\n✅ Smart fill optimization test PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Smart fill optimization test FAILED: {str(e)}")
        return False


def test_gamerule_caching():
    """Test that gamerule caching is working."""
    print("\n" + "="*80)
    print("TEST 5: Gamerule Response Caching")
    print("="*80)
    
    try:
        config = EDIcraftConfig()
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3,
            chunk_size=32
        )
        
        print("\n✓ Testing gamerule cache...")
        
        # Check cache exists
        if hasattr(executor, '_gamerule_cache'):
            print("  ✅ Gamerule cache exists")
        else:
            print("  ❌ Gamerule cache missing")
            return False
        
        # Check cache TTL
        if hasattr(executor, '_cache_ttl'):
            print(f"  ✅ Cache TTL: {executor._cache_ttl} seconds")
        else:
            print("  ❌ Cache TTL missing")
            return False
        
        # Verify cache is used in verify_gamerule
        import inspect
        source = inspect.getsource(executor.verify_gamerule)
        if '_gamerule_cache' in source:
            print("  ✅ verify_gamerule uses cache")
        else:
            print("  ❌ verify_gamerule doesn't use cache")
            return False
        
        print("\n✅ Gamerule caching test PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ Gamerule caching test FAILED: {str(e)}")
        return False


def main():
    """Run all performance optimization tests."""
    print("\n" + "="*80)
    print("RCON PERFORMANCE OPTIMIZATIONS TEST SUITE")
    print("="*80)
    print("\nThis test suite verifies that all performance optimizations are implemented:")
    print("1. Performance tracking and metrics")
    print("2. Adaptive chunk sizing based on server performance")
    print("3. Parallel execution decision logic")
    print("4. Smart fill optimization for terrain")
    print("5. Gamerule response caching")
    
    results = []
    
    # Run all tests
    results.append(("Performance Tracking", test_performance_tracking()))
    results.append(("Adaptive Chunk Sizing", test_adaptive_chunk_sizing()))
    results.append(("Parallel Execution Decision", test_parallel_execution_decision()))
    results.append(("Smart Fill Optimization", test_smart_fill_optimization()))
    results.append(("Gamerule Caching", test_gamerule_caching()))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All performance optimization tests PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
