#!/usr/bin/env python3
"""
Test error handling with invalid trajectory ID.
Tests Requirements 2.4, 2.5 - Error handling and clear error messages.
"""

import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.workflow_tools import build_wellbore_trajectory_complete

def test_invalid_trajectory_id():
    """Test with invalid trajectory ID - should return clear error message."""
    print("=" * 80)
    print("TEST: Invalid Trajectory ID Error Handling")
    print("=" * 80)
    print()
    
    # Test with non-existent trajectory ID
    invalid_ids = [
        "INVALID-TRAJECTORY-999",
        "DOES-NOT-EXIST",
        "FAKE-WELL-123",
        ""  # Empty string
    ]
    
    all_passed = True
    
    for trajectory_id in invalid_ids:
        print(f"\n📋 Testing with invalid ID: '{trajectory_id}'")
        print("-" * 80)
        
        try:
            result = build_wellbore_trajectory_complete(trajectory_id)
            
            # Check that we got an error message
            if "error" in result.lower() or "failed" in result.lower() or "not found" in result.lower():
                print("✅ PASS: Received appropriate error message")
                print(f"   Error message: {result[:200]}...")
                
                # Verify no crash occurred
                if "exception" not in result.lower() and "traceback" not in result.lower():
                    print("✅ PASS: No crash or exception in error message")
                else:
                    print("❌ FAIL: Error message contains exception/traceback (should be user-friendly)")
                    all_passed = False
                    
            else:
                print("❌ FAIL: Did not receive error message for invalid trajectory ID")
                print(f"   Result: {result[:200]}...")
                all_passed = False
                
        except Exception as e:
            print(f"❌ FAIL: Exception raised (should return error message instead): {str(e)}")
            all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Invalid trajectory ID handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Invalid trajectory ID handling needs improvement")
    print("=" * 80)
    
    return all_passed

def test_malformed_trajectory_id():
    """Test with malformed trajectory IDs - special characters, SQL injection attempts."""
    print()
    print("=" * 80)
    print("TEST: Malformed Trajectory ID Error Handling")
    print("=" * 80)
    print()
    
    # Test with malformed IDs
    malformed_ids = [
        "'; DROP TABLE trajectories; --",  # SQL injection attempt
        "<script>alert('xss')</script>",   # XSS attempt
        "../../etc/passwd",                 # Path traversal attempt
        "WELL-001' OR '1'='1",             # SQL injection
        None  # None value
    ]
    
    all_passed = True
    
    for trajectory_id in malformed_ids:
        print(f"\n📋 Testing with malformed ID: '{trajectory_id}'")
        print("-" * 80)
        
        try:
            result = build_wellbore_trajectory_complete(trajectory_id)
            
            # Check that we got an error message (not a crash)
            if isinstance(result, str):
                print("✅ PASS: Function returned string result (no crash)")
                
                # Verify error message is present
                if "error" in result.lower() or "failed" in result.lower() or "invalid" in result.lower():
                    print("✅ PASS: Received appropriate error message")
                    print(f"   Error message: {result[:200]}...")
                else:
                    print("⚠️  WARNING: No explicit error message, but no crash")
                    print(f"   Result: {result[:200]}...")
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
        except TypeError as e:
            # None value might cause TypeError - this is acceptable
            if trajectory_id is None:
                print(f"✅ PASS: TypeError for None value is acceptable: {str(e)}")
            else:
                print(f"❌ FAIL: TypeError raised: {str(e)}")
                all_passed = False
        except Exception as e:
            print(f"❌ FAIL: Unexpected exception: {type(e).__name__}: {str(e)}")
            all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Malformed trajectory ID handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Malformed trajectory ID handling needs improvement")
    print("=" * 80)
    
    return all_passed

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("ERROR HANDLING TEST SUITE: Invalid Trajectory ID")
    print("Testing Requirements 2.4, 2.5")
    print("=" * 80)
    
    test1_passed = test_invalid_trajectory_id()
    test2_passed = test_malformed_trajectory_id()
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    print(f"Invalid Trajectory ID Test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Malformed Trajectory ID Test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print("=" * 80)
    
    sys.exit(0 if (test1_passed and test2_passed) else 1)
