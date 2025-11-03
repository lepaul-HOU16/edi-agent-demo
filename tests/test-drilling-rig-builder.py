#!/usr/bin/env python3
"""
Test script for drilling rig builder functionality.

This script tests the build_drilling_rig tool to ensure it:
1. Accepts valid parameters
2. Handles different rig styles
3. Generates proper Cloudscape responses
4. Integrates with name simplification
"""

import sys
import os

# Add parent directory to path to import tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.workflow_tools import build_drilling_rig
from tools.name_utils import simplify_well_name


def test_standard_rig():
    """Test building a standard drilling rig."""
    print("\n" + "="*80)
    print("TEST 1: Standard Drilling Rig")
    print("="*80)
    
    result = build_drilling_rig(
        x=100,
        y=100,
        z=100,
        well_name="WELL-007",
        rig_style="standard"
    )
    
    print(result)
    
    # Verify response contains expected elements
    assert "✅" in result, "Response should contain success icon"
    assert "WELL-007" in result, "Response should contain well name"
    assert "standard" in result.lower(), "Response should mention rig style"
    assert "Platform:" in result, "Response should describe platform"
    assert "Derrick:" in result, "Response should describe derrick"
    
    print("\n✅ Standard rig test PASSED")
    return True


def test_compact_rig():
    """Test building a compact drilling rig."""
    print("\n" + "="*80)
    print("TEST 2: Compact Drilling Rig")
    print("="*80)
    
    result = build_drilling_rig(
        x=200,
        y=100,
        z=200,
        well_name="WELL-011",
        rig_style="compact"
    )
    
    print(result)
    
    # Verify response contains expected elements
    assert "✅" in result, "Response should contain success icon"
    assert "WELL-011" in result, "Response should contain well name"
    assert "compact" in result.lower(), "Response should mention rig style"
    assert "3x3" in result, "Compact rig should have 3x3 platform"
    
    print("\n✅ Compact rig test PASSED")
    return True


def test_detailed_rig():
    """Test building a detailed drilling rig."""
    print("\n" + "="*80)
    print("TEST 3: Detailed Drilling Rig")
    print("="*80)
    
    result = build_drilling_rig(
        x=300,
        y=100,
        z=300,
        well_name="WELL-024",
        rig_style="detailed"
    )
    
    print(result)
    
    # Verify response contains expected elements
    assert "✅" in result, "Response should contain success icon"
    assert "WELL-024" in result, "Response should contain well name"
    assert "detailed" in result.lower(), "Response should mention rig style"
    assert "7x7" in result, "Detailed rig should have 7x7 platform"
    
    print("\n✅ Detailed rig test PASSED")
    return True


def test_invalid_style():
    """Test error handling for invalid rig style."""
    print("\n" + "="*80)
    print("TEST 4: Invalid Rig Style (Error Handling)")
    print("="*80)
    
    result = build_drilling_rig(
        x=400,
        y=100,
        z=400,
        well_name="WELL-999",
        rig_style="invalid_style"
    )
    
    print(result)
    
    # Verify error response
    assert "❌" in result, "Response should contain error icon"
    assert "Invalid rig style" in result, "Response should mention invalid style"
    assert "standard" in result, "Response should suggest valid styles"
    
    print("\n✅ Invalid style error handling test PASSED")
    return True


def test_osdu_id_simplification():
    """Test that OSDU IDs are simplified to short names."""
    print("\n" + "="*80)
    print("TEST 5: OSDU ID Simplification")
    print("="*80)
    
    # Use a full OSDU ID
    osdu_id = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
    
    result = build_drilling_rig(
        x=500,
        y=100,
        z=500,
        well_name=osdu_id,
        rig_style="standard"
    )
    
    print(result)
    
    # Verify that the short name is used in the response
    assert "WELL-007" in result, "OSDU ID should be simplified to WELL-007"
    assert osdu_id not in result, "Full OSDU ID should not appear in response"
    
    print("\n✅ OSDU ID simplification test PASSED")
    return True


def test_response_format():
    """Test that response follows Cloudscape format."""
    print("\n" + "="*80)
    print("TEST 6: Cloudscape Response Format")
    print("="*80)
    
    result = build_drilling_rig(
        x=600,
        y=100,
        z=600,
        well_name="WELL-TEST",
        rig_style="standard"
    )
    
    print(result)
    
    # Verify Cloudscape formatting elements
    assert "**Details:**" in result, "Response should have Details section"
    assert "**Structure:**" in result, "Response should have Structure section"
    assert "**Location:**" in result, "Response should have Location section"
    assert "💡 **Tip:**" in result, "Response should have Tip section"
    assert "Blocks Placed:" in result, "Response should show blocks placed"
    assert "Commands Executed:" in result, "Response should show commands executed"
    
    print("\n✅ Cloudscape response format test PASSED")
    return True


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("DRILLING RIG BUILDER TEST SUITE")
    print("="*80)
    print("\nNote: These tests verify the tool logic and response formatting.")
    print("Actual Minecraft commands will not be executed without RCON connection.")
    print("="*80)
    
    tests = [
        test_standard_rig,
        test_compact_rig,
        test_detailed_rig,
        test_invalid_style,
        test_osdu_id_simplification,
        test_response_format,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except AssertionError as e:
            print(f"\n❌ Test FAILED: {str(e)}")
            failed += 1
        except Exception as e:
            print(f"\n❌ Test ERROR: {str(e)}")
            failed += 1
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n❌ {failed} TEST(S) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
