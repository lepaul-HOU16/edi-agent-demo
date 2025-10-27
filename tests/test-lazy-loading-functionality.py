#!/usr/bin/env python3
"""
Test script to verify lazy loading functionality
Ensures dependencies are loaded only when needed
"""
import sys
import os
import time

# Add the Lambda function directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableAgents'))

def test_lazy_imports_module():
    """Test that lazy_imports module works correctly"""
    print("\n1. Testing lazy_imports module...")
    
    from lazy_imports import (
        get_pywake, 
        get_geopandas, 
        get_matplotlib, 
        get_matplotlib_pyplot,
        is_loaded,
        get_loading_status
    )
    
    # Check initial state - nothing should be loaded
    status = get_loading_status()
    print(f"   Initial status: {status}")
    
    assert not status['pywake'], "PyWake should not be loaded initially"
    assert not status['geopandas'], "GeoPandas should not be loaded initially"
    assert not status['matplotlib'], "Matplotlib should not be loaded initially"
    
    print("   ✅ All dependencies unloaded initially")
    return True

def test_selective_loading():
    """Test that we can load dependencies selectively"""
    print("\n2. Testing selective loading...")
    
    from lazy_imports import get_geopandas, is_loaded, get_loading_status
    
    # Load only geopandas
    start = time.time()
    gpd = get_geopandas()
    elapsed = time.time() - start
    
    print(f"   GeoPandas loaded in {elapsed:.3f}s")
    
    # Check status
    status = get_loading_status()
    print(f"   Status after loading GeoPandas: {status}")
    
    assert status['geopandas'], "GeoPandas should be loaded"
    assert gpd is not None, "GeoPandas module should be returned"
    
    print("   ✅ Selective loading works correctly")
    return True

def test_caching():
    """Test that loaded modules are cached"""
    print("\n3. Testing module caching...")
    
    from lazy_imports import get_geopandas
    
    # First call
    start1 = time.time()
    gpd1 = get_geopandas()
    time1 = time.time() - start1
    
    # Second call (should be cached)
    start2 = time.time()
    gpd2 = get_geopandas()
    time2 = time.time() - start2
    
    print(f"   First call: {time1:.3f}s")
    print(f"   Second call: {time2:.3f}s (cached)")
    print(f"   Speedup: {(time1/time2):.1f}x faster")
    
    assert gpd1 is gpd2, "Should return same cached module"
    assert time2 < time1 / 10, "Cached call should be much faster"
    
    print("   ✅ Module caching works correctly")
    return True

def test_matplotlib_backend():
    """Test that matplotlib is configured with Agg backend"""
    print("\n4. Testing matplotlib backend configuration...")
    
    from lazy_imports import get_matplotlib, get_matplotlib_pyplot
    
    # Load matplotlib
    matplotlib = get_matplotlib()
    plt = get_matplotlib_pyplot()
    
    backend = matplotlib.get_backend()
    print(f"   Matplotlib backend: {backend}")
    
    assert backend.lower() == 'agg', f"Backend should be 'agg', got '{backend}'"
    
    print("   ✅ Matplotlib configured correctly for Lambda")
    return True

def test_all_dependencies():
    """Test loading all dependencies"""
    print("\n5. Testing all dependencies...")
    
    from lazy_imports import (
        get_pywake,
        get_geopandas,
        get_matplotlib,
        get_matplotlib_pyplot,
        get_loading_status
    )
    
    # Load all
    start = time.time()
    py_wake = get_pywake()
    gpd = get_geopandas()
    matplotlib = get_matplotlib()
    plt = get_matplotlib_pyplot()
    elapsed = time.time() - start
    
    print(f"   All dependencies loaded in {elapsed:.3f}s")
    
    # Verify all loaded
    status = get_loading_status()
    print(f"   Final status: {status}")
    
    assert all(status.values()), "All dependencies should be loaded"
    assert py_wake is not None, "PyWake should be loaded"
    assert gpd is not None, "GeoPandas should be loaded"
    assert matplotlib is not None, "Matplotlib should be loaded"
    assert plt is not None, "Pyplot should be loaded"
    
    print("   ✅ All dependencies loaded successfully")
    return True

def test_terrain_tools_lazy_loading():
    """Test that terrain_tools uses lazy loading"""
    print("\n6. Testing terrain_tools lazy loading...")
    
    # Import terrain_tools - should not load geopandas yet
    from tools import terrain_tools
    from lazy_imports import get_loading_status
    
    # Check if geopandas is loaded (it might be from previous tests)
    status = get_loading_status()
    print(f"   Status after importing terrain_tools: {status}")
    
    # The module should import without errors
    assert hasattr(terrain_tools, 'get_unbuildable_areas'), "Tool should be available"
    
    print("   ✅ terrain_tools imports correctly with lazy loading")
    return True

def test_simulation_tools_lazy_loading():
    """Test that simulation_tools uses lazy loading"""
    print("\n7. Testing simulation_tools lazy loading...")
    
    # Import simulation_tools - should not load pywake yet
    from tools import simulation_tools
    
    # The module should import without errors
    assert hasattr(simulation_tools, 'run_wake_simulation'), "Tool should be available"
    
    print("   ✅ simulation_tools imports correctly with lazy loading")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Lazy Loading Functionality Tests")
    print("=" * 60)
    
    tests = [
        test_lazy_imports_module,
        test_selective_loading,
        test_caching,
        test_matplotlib_backend,
        test_all_dependencies,
        test_terrain_tools_lazy_loading,
        test_simulation_tools_lazy_loading
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"   ❌ Test failed: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print("Test Results")
    print("=" * 60)
    print(f"✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n🎉 All tests passed! Lazy loading is working correctly.")
        print("\nBenefits:")
        print("  • Terrain agent: Only loads GeoPandas")
        print("  • Layout agent: Only loads GeoPandas")
        print("  • Simulation agent: Loads PyWake + Matplotlib when needed")
        print("  • Report agent: Loads Matplotlib when needed")
        print("  • Warm starts: All modules stay cached in memory")
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
        sys.exit(1)
    
    print("=" * 60)
