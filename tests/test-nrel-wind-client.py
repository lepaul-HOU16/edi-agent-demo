#!/usr/bin/env python3
"""
Test NREL Wind Client Implementation
Verifies the client matches workshop implementation
"""

import sys
import os

# Add the renewableTools directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools'))

from nrel_wind_client import (
    get_nrel_api_key,
    fetch_wind_data,
    process_wind_data,
    get_wind_conditions,
    NRELWindClient
)

def test_api_key_error():
    """Test that missing API key raises error (NO DEMO KEY fallback)"""
    print("Testing API key error handling...")
    
    # Remove API key from environment
    original_key = os.environ.get('NREL_API_KEY')
    if 'NREL_API_KEY' in os.environ:
        del os.environ['NREL_API_KEY']
    
    try:
        get_nrel_api_key()
        print("❌ FAILED: Should have raised ValueError for missing API key")
        return False
    except ValueError as e:
        if "NREL API key not configured" in str(e):
            print("✅ PASSED: Correctly raises error for missing API key")
            return True
        else:
            print(f"❌ FAILED: Wrong error message: {e}")
            return False
    finally:
        # Restore original key
        if original_key:
            os.environ['NREL_API_KEY'] = original_key

def test_no_synthetic_data():
    """Test that NO synthetic data generation functions exist"""
    print("\nTesting for synthetic data functions...")
    
    import nrel_wind_client
    
    # Check for prohibited function names
    prohibited_functions = [
        '_generate_realistic_wind_data',
        'create_synthetic_wind_fallback',
        'generate_synthetic_data',
        'mock_wind_data'
    ]
    
    for func_name in prohibited_functions:
        if hasattr(nrel_wind_client, func_name):
            print(f"❌ FAILED: Found prohibited function: {func_name}")
            return False
    
    print("✅ PASSED: No synthetic data generation functions found")
    return True

def test_required_functions():
    """Test that all required functions are implemented"""
    print("\nTesting required functions...")
    
    import nrel_wind_client
    
    required_functions = [
        'get_nrel_api_key',
        'fetch_wind_data',
        'process_wind_data',
        'get_wind_conditions'
    ]
    
    for func_name in required_functions:
        if not hasattr(nrel_wind_client, func_name):
            print(f"❌ FAILED: Missing required function: {func_name}")
            return False
    
    print("✅ PASSED: All required functions implemented")
    return True

def test_nrel_client_class():
    """Test NRELWindClient class"""
    print("\nTesting NRELWindClient class...")
    
    try:
        client = NRELWindClient()
        
        # Check methods exist
        required_methods = [
            'get_api_key',
            'fetch_wind_data',
            'process_wind_data',
            'get_wind_conditions'
        ]
        
        for method_name in required_methods:
            if not hasattr(client, method_name):
                print(f"❌ FAILED: Missing method: {method_name}")
                return False
        
        print("✅ PASSED: NRELWindClient class properly implemented")
        return True
    except Exception as e:
        print(f"❌ FAILED: Error creating NRELWindClient: {e}")
        return False

def test_data_source_metadata():
    """Test that data source metadata is included"""
    print("\nTesting data source metadata...")
    
    # Create mock CSV data
    mock_csv = """Year,Month,Day,Hour,Minute,Wind Speed at 100m (m/s),Wind Direction at 100m (deg)
2023,1,1,0,0,8.5,180
2023,1,1,1,0,9.2,185
2023,1,1,2,0,7.8,175
2023,1,1,3,0,8.1,180
2023,1,1,4,0,9.5,190
2023,1,1,5,0,8.7,182
2023,1,1,6,0,9.0,188
2023,1,1,7,0,8.3,178
2023,1,1,8,0,8.9,183
2023,1,1,9,0,9.1,186
2023,1,1,10,0,8.6,181
2023,1,1,11,0,9.3,187
"""
    
    try:
        result = process_wind_data(mock_csv)
        
        # Check for required metadata
        required_fields = ['data_source', 'data_year', 'reliability']
        for field in required_fields:
            if field not in result:
                print(f"❌ FAILED: Missing metadata field: {field}")
                return False
        
        if result['data_source'] != 'NREL Wind Toolkit':
            print(f"❌ FAILED: Wrong data source: {result['data_source']}")
            return False
        
        print("✅ PASSED: Data source metadata properly included")
        return True
    except Exception as e:
        print(f"❌ FAILED: Error processing wind data: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("NREL Wind Client Implementation Tests")
    print("=" * 60)
    
    tests = [
        test_api_key_error,
        test_no_synthetic_data,
        test_required_functions,
        test_nrel_client_class,
        test_data_source_metadata
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"❌ FAILED: Test crashed: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)
    
    if all(results):
        print("\n✅ ALL TESTS PASSED - Implementation matches requirements")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED - Review implementation")
        return 1

if __name__ == "__main__":
    sys.exit(main())
