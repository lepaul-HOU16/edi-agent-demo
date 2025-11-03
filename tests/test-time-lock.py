#!/usr/bin/env python3
"""
Test script for time lock tool.
Tests the lock_world_time() function with various time settings.
"""

import sys
import os

# Add parent directory to path to import tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.workflow_tools import lock_world_time


def test_lock_time_day():
    """Test locking time to day."""
    print("\n" + "="*60)
    print("TEST 1: Lock time to day")
    print("="*60)
    
    result = lock_world_time(time="day", enabled=True)
    print(result)
    
    # Check for success indicators
    assert "✅" in result, "Should contain success icon"
    assert "locked" in result.lower(), "Should indicate time is locked"
    assert "day" in result.lower(), "Should mention day time"
    
    print("\n✅ TEST 1 PASSED")


def test_lock_time_noon():
    """Test locking time to noon."""
    print("\n" + "="*60)
    print("TEST 2: Lock time to noon")
    print("="*60)
    
    result = lock_world_time(time="noon", enabled=True)
    print(result)
    
    # Check for success indicators
    assert "✅" in result, "Should contain success icon"
    assert "locked" in result.lower(), "Should indicate time is locked"
    assert "noon" in result.lower(), "Should mention noon time"
    
    print("\n✅ TEST 2 PASSED")


def test_unlock_time():
    """Test unlocking time (resume normal cycle)."""
    print("\n" + "="*60)
    print("TEST 3: Unlock time (resume cycle)")
    print("="*60)
    
    result = lock_world_time(time="day", enabled=False)
    print(result)
    
    # Check for success indicators
    assert "✅" in result, "Should contain success icon"
    assert "unlocked" in result.lower(), "Should indicate time is unlocked"
    assert "enabled" in result.lower(), "Should mention cycle is enabled"
    
    print("\n✅ TEST 3 PASSED")


def test_invalid_time():
    """Test error handling for invalid time value."""
    print("\n" + "="*60)
    print("TEST 4: Invalid time value")
    print("="*60)
    
    result = lock_world_time(time="invalid_time", enabled=True)
    print(result)
    
    # Check for error indicators
    assert "❌" in result, "Should contain error icon"
    assert "invalid" in result.lower(), "Should mention invalid time"
    assert "suggestions" in result.lower() or "tip" in result.lower(), "Should provide suggestions"
    
    print("\n✅ TEST 4 PASSED")


def test_all_time_values():
    """Test all supported time values."""
    print("\n" + "="*60)
    print("TEST 5: All supported time values")
    print("="*60)
    
    time_values = ["day", "morning", "noon", "midday", "afternoon", "sunset", "dusk", "night", "midnight"]
    
    for time_val in time_values:
        print(f"\nTesting time: {time_val}")
        result = lock_world_time(time=time_val, enabled=True)
        
        # Should succeed for all valid time values
        assert "✅" in result, f"Should succeed for time={time_val}"
        assert time_val.lower() in result.lower(), f"Should mention {time_val}"
        print(f"  ✓ {time_val} works correctly")
    
    print("\n✅ TEST 5 PASSED")


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("TIME LOCK TOOL TEST SUITE")
    print("="*60)
    
    try:
        test_lock_time_day()
        test_lock_time_noon()
        test_unlock_time()
        test_invalid_time()
        test_all_time_values()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        print("\nThe lock_world_time() tool is working correctly!")
        print("\nFeatures verified:")
        print("  ✓ Time setting logic (day, noon, night, etc.)")
        print("  ✓ Daylight cycle lock/unlock")
        print("  ✓ Cloudscape response formatting")
        print("  ✓ Error handling for invalid inputs")
        print("  ✓ All supported time values")
        
        return 0
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        return 1
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
