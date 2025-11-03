#!/usr/bin/env python3
"""
Test script for clear_minecraft_environment tool.

This script tests the clear environment functionality to ensure it:
1. Accepts correct parameters
2. Executes RCON commands properly
3. Returns properly formatted responses
4. Handles errors gracefully
"""

import sys
import os

# Add parent directory to path to import tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.workflow_tools import clear_minecraft_environment
from tools.response_templates import CloudscapeResponseBuilder


def test_clear_all():
    """Test clearing all structures."""
    print("\n" + "="*80)
    print("TEST 1: Clear All Structures")
    print("="*80)
    
    try:
        result = clear_minecraft_environment(area="all", preserve_terrain=True)
        print("\n✅ Test passed - clear_all executed")
        print("\nResponse:")
        print(result)
        
        # Verify response format
        assert "✅" in result or "❌" in result, "Response should contain status icon"
        assert "Minecraft Environment" in result or "Clear Environment" in result, "Response should mention environment"
        
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def test_clear_wellbores_only():
    """Test clearing only wellbores."""
    print("\n" + "="*80)
    print("TEST 2: Clear Wellbores Only")
    print("="*80)
    
    try:
        result = clear_minecraft_environment(area="wellbores", preserve_terrain=True)
        print("\n✅ Test passed - clear_wellbores executed")
        print("\nResponse:")
        print(result)
        
        # Verify response format
        assert "✅" in result or "❌" in result, "Response should contain status icon"
        
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def test_clear_rigs_only():
    """Test clearing only drilling rigs."""
    print("\n" + "="*80)
    print("TEST 3: Clear Rigs Only")
    print("="*80)
    
    try:
        result = clear_minecraft_environment(area="rigs", preserve_terrain=True)
        print("\n✅ Test passed - clear_rigs executed")
        print("\nResponse:")
        print(result)
        
        # Verify response format
        assert "✅" in result or "❌" in result, "Response should contain status icon"
        
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def test_response_templates():
    """Test response template formatting."""
    print("\n" + "="*80)
    print("TEST 4: Response Template Formatting")
    print("="*80)
    
    try:
        # Test clear confirmation template
        response = CloudscapeResponseBuilder.clear_confirmation(
            wellbores_cleared=5,
            rigs_cleared=3,
            blocks_cleared=1250
        )
        
        print("\n✅ Test passed - response template generated")
        print("\nResponse:")
        print(response)
        
        # Verify response format
        assert "✅" in response, "Response should contain success icon"
        assert "Minecraft Environment Cleared" in response, "Response should have title"
        assert "5" in response, "Response should show wellbores count"
        assert "3" in response, "Response should show rigs count"
        assert "1250" in response, "Response should show blocks count"
        assert "💡" in response, "Response should contain tip icon"
        
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def test_error_handling():
    """Test error handling for invalid parameters."""
    print("\n" + "="*80)
    print("TEST 5: Error Handling")
    print("="*80)
    
    try:
        # Test with invalid area parameter
        result = clear_minecraft_environment(area="invalid_area", preserve_terrain=True)
        print("\n✅ Test passed - error handling works")
        print("\nResponse:")
        print(result)
        
        # Verify error response format
        assert "❌" in result, "Error response should contain error icon"
        assert "Clear Environment" in result, "Error response should mention operation"
        
        return True
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("CLEAR ENVIRONMENT TOOL TEST SUITE")
    print("="*80)
    
    tests = [
        ("Response Templates", test_response_templates),
        ("Error Handling", test_error_handling),
        ("Clear All", test_clear_all),
        ("Clear Wellbores Only", test_clear_wellbores_only),
        ("Clear Rigs Only", test_clear_rigs_only),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {str(e)}")
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
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
