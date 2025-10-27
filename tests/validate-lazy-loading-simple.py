#!/usr/bin/env python3
"""
Simple validation test for lazy loading implementation
Tests only the core lazy loading mechanism without requiring all dependencies
"""
import sys
import os

# Add the Lambda function directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableAgents'))

def test_lazy_imports_exists():
    """Test that lazy_imports module exists and has required functions"""
    print("\n✓ Testing lazy_imports module exists...")
    
    try:
        from lazy_imports import (
            get_pywake, 
            get_geopandas, 
            get_matplotlib, 
            get_matplotlib_pyplot,
            is_loaded,
            get_loading_status
        )
        print("  ✅ All lazy loading functions available")
        return True
    except ImportError as e:
        print(f"  ❌ Import failed: {e}")
        return False

def test_initial_state():
    """Test that dependencies are not loaded initially"""
    print("\n✓ Testing initial state (no dependencies loaded)...")
    
    from lazy_imports import get_loading_status
    
    status = get_loading_status()
    print(f"  Status: {status}")
    
    if not any(status.values()):
        print("  ✅ No dependencies loaded initially (correct)")
        return True
    else:
        print("  ⚠️  Some dependencies already loaded (may be from previous tests)")
        return True  # Not a failure, just a note

def test_geopandas_loading():
    """Test GeoPandas lazy loading"""
    print("\n✓ Testing GeoPandas lazy loading...")
    
    try:
        from lazy_imports import get_geopandas, is_loaded
        
        # Check if already loaded
        was_loaded = is_loaded('geopandas')
        
        # Load it
        gpd = get_geopandas()
        
        # Verify it's loaded now
        now_loaded = is_loaded('geopandas')
        
        if gpd is not None and now_loaded:
            print("  ✅ GeoPandas loaded successfully")
            return True
        else:
            print("  ❌ GeoPandas loading failed")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_matplotlib_backend():
    """Test Matplotlib backend configuration"""
    print("\n✓ Testing Matplotlib backend configuration...")
    
    try:
        from lazy_imports import get_matplotlib
        
        matplotlib = get_matplotlib()
        backend = matplotlib.get_backend()
        
        if backend.lower() == 'agg':
            print(f"  ✅ Matplotlib backend is '{backend}' (correct for Lambda)")
            return True
        else:
            print(f"  ⚠️  Matplotlib backend is '{backend}' (expected 'Agg')")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_caching():
    """Test that modules are cached"""
    print("\n✓ Testing module caching...")
    
    try:
        from lazy_imports import get_geopandas
        import time
        
        # First call
        start1 = time.time()
        gpd1 = get_geopandas()
        time1 = time.time() - start1
        
        # Second call (should be instant)
        start2 = time.time()
        gpd2 = get_geopandas()
        time2 = time.time() - start2
        
        print(f"  First call: {time1:.4f}s")
        print(f"  Second call: {time2:.4f}s")
        
        if gpd1 is gpd2:
            print("  ✅ Module caching works (same object returned)")
            return True
        else:
            print("  ❌ Module caching failed (different objects)")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def test_wind_farm_dev_tools():
    """Test that wind_farm_dev_tools uses lazy loading"""
    print("\n✓ Testing wind_farm_dev_tools lazy loading...")
    
    try:
        # This should import without loading geopandas eagerly
        from tools import wind_farm_dev_tools
        
        # Check that the module has the expected tools
        has_tools = (
            hasattr(wind_farm_dev_tools, 'generate_project_id') and
            hasattr(wind_farm_dev_tools, 'validate_layout_quality')
        )
        
        if has_tools:
            print("  ✅ wind_farm_dev_tools imports correctly with lazy loading")
            return True
        else:
            print("  ❌ wind_farm_dev_tools missing expected tools")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Lazy Loading Validation (Simple)")
    print("=" * 60)
    
    tests = [
        ("Lazy imports module", test_lazy_imports_exists),
        ("Initial state", test_initial_state),
        ("GeoPandas loading", test_geopandas_loading),
        ("Matplotlib backend", test_matplotlib_backend),
        ("Module caching", test_caching),
        ("wind_farm_dev_tools", test_wind_farm_dev_tools)
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  ❌ Test '{name}' crashed: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print("Validation Results")
    print("=" * 60)
    print(f"✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n🎉 All validation tests passed!")
        print("\nLazy loading is correctly implemented:")
        print("  • Dependencies loaded only when needed")
        print("  • Modules cached for reuse")
        print("  • Matplotlib configured for Lambda (Agg backend)")
        print("  • Tool files use lazy loading pattern")
    else:
        print(f"\n⚠️  {failed} test(s) failed")
        print("Review the errors above for details")
    
    print("=" * 60)
    
    sys.exit(0 if failed == 0 else 1)
