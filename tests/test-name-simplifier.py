#!/usr/bin/env python3
"""
Test script for WellNameSimplifier

This script tests the name simplification functionality to ensure
it correctly handles various OSDU ID patterns.
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.name_utils import WellNameSimplifier


def test_basic_simplification():
    """Test basic name simplification."""
    print("Testing basic name simplification...")
    simplifier = WellNameSimplifier()
    
    # Test Pattern 1: WELL-007 format
    osdu_id1 = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
    short1 = simplifier.simplify_name(osdu_id1)
    assert short1 == "WELL-007", f"Expected 'WELL-007', got '{short1}'"
    print(f"✅ Pattern 1: {osdu_id1} -> {short1}")
    
    # Test Pattern 2: Numeric ID
    osdu_id2 = "osdu:master-data--Wellbore:12345"
    short2 = simplifier.simplify_name(osdu_id2)
    assert short2 == "WELL-12345", f"Expected 'WELL-12345', got '{short2}'"
    print(f"✅ Pattern 2: {osdu_id2} -> {short2}")
    
    # Test Pattern 3: Alphanumeric ID
    osdu_id3 = "osdu:work-product-component--WellboreTrajectory:abc123:xyz"
    short3 = simplifier.simplify_name(osdu_id3)
    assert short3 == "WELL-abc123", f"Expected 'WELL-abc123', got '{short3}'"
    print(f"✅ Pattern 3: {osdu_id3} -> {short3}")
    
    print("✅ Basic simplification tests passed!\n")


def test_reverse_lookup():
    """Test reverse lookup from short name to full ID."""
    print("Testing reverse lookup...")
    simplifier = WellNameSimplifier()
    
    osdu_id = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
    short_name = simplifier.simplify_name(osdu_id)
    
    # Test reverse lookup
    full_id = simplifier.get_full_id(short_name)
    assert full_id == osdu_id, f"Expected '{osdu_id}', got '{full_id}'"
    print(f"✅ Reverse lookup: {short_name} -> {full_id}")
    
    # Test non-existent name
    non_existent = simplifier.get_full_id("WELL-999")
    assert non_existent is None, f"Expected None, got '{non_existent}'"
    print(f"✅ Non-existent lookup: WELL-999 -> None")
    
    print("✅ Reverse lookup tests passed!\n")


def test_duplicate_handling():
    """Test handling of duplicate names."""
    print("Testing duplicate name handling...")
    simplifier = WellNameSimplifier()
    
    # Register first well
    osdu_id1 = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
    short1 = simplifier.register_well(osdu_id1, "WELL-007")
    assert short1 == "WELL-007", f"Expected 'WELL-007', got '{short1}'"
    print(f"✅ First registration: {short1}")
    
    # Register second well with same name
    osdu_id2 = "osdu:work-product-component--WellboreTrajectory:WELL-007:xyz789"
    short2 = simplifier.register_well(osdu_id2, "WELL-007")
    assert short2 == "WELL-007-2", f"Expected 'WELL-007-2', got '{short2}'"
    print(f"✅ Duplicate registration: {short2}")
    
    # Register third well with same name
    osdu_id3 = "osdu:work-product-component--WellboreTrajectory:WELL-007:def456"
    short3 = simplifier.register_well(osdu_id3, "WELL-007")
    assert short3 == "WELL-007-3", f"Expected 'WELL-007-3', got '{short3}'"
    print(f"✅ Third registration: {short3}")
    
    # Verify all can be looked up
    assert simplifier.get_full_id("WELL-007") == osdu_id1
    assert simplifier.get_full_id("WELL-007-2") == osdu_id2
    assert simplifier.get_full_id("WELL-007-3") == osdu_id3
    print(f"✅ All duplicates can be looked up correctly")
    
    print("✅ Duplicate handling tests passed!\n")


def test_custom_registration():
    """Test custom name registration."""
    print("Testing custom name registration...")
    simplifier = WellNameSimplifier()
    
    # Register with custom name
    osdu_id = "osdu:work-product-component--WellboreTrajectory:abc123:xyz"
    custom_name = "DEMO-WELL-1"
    registered = simplifier.register_well(osdu_id, custom_name)
    assert registered == custom_name, f"Expected '{custom_name}', got '{registered}'"
    print(f"✅ Custom registration: {osdu_id} -> {custom_name}")
    
    # Verify lookup works
    full_id = simplifier.get_full_id(custom_name)
    assert full_id == osdu_id, f"Expected '{osdu_id}', got '{full_id}'"
    print(f"✅ Custom name lookup: {custom_name} -> {full_id}")
    
    print("✅ Custom registration tests passed!\n")


def test_cache_operations():
    """Test cache operations."""
    print("Testing cache operations...")
    simplifier = WellNameSimplifier()
    
    # Register some wells
    simplifier.register_well("osdu:work-product-component--WellboreTrajectory:WELL-001:abc", "WELL-001")
    simplifier.register_well("osdu:work-product-component--WellboreTrajectory:WELL-002:def", "WELL-002")
    simplifier.register_well("osdu:work-product-component--WellboreTrajectory:WELL-003:ghi", "WELL-003")
    
    # Test length
    assert len(simplifier) == 3, f"Expected 3 wells, got {len(simplifier)}"
    print(f"✅ Cache length: {len(simplifier)} wells")
    
    # Test contains
    assert "WELL-001" in simplifier, "WELL-001 should be in cache"
    assert "WELL-999" not in simplifier, "WELL-999 should not be in cache"
    print(f"✅ Contains check works")
    
    # Test get_all_wells
    all_wells = simplifier.get_all_wells()
    assert len(all_wells) == 3, f"Expected 3 wells, got {len(all_wells)}"
    print(f"✅ Get all wells: {len(all_wells)} wells")
    
    # Test clear
    simplifier.clear_cache()
    assert len(simplifier) == 0, f"Expected 0 wells after clear, got {len(simplifier)}"
    print(f"✅ Cache cleared successfully")
    
    print("✅ Cache operation tests passed!\n")


def test_convenience_functions():
    """Test convenience functions."""
    print("Testing convenience functions...")
    
    from tools.name_utils import simplify_well_name, get_full_well_id, register_well
    
    # Test simplify_well_name
    osdu_id = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
    short = simplify_well_name(osdu_id)
    assert short == "WELL-007", f"Expected 'WELL-007', got '{short}'"
    print(f"✅ simplify_well_name: {osdu_id} -> {short}")
    
    # Test get_full_well_id
    full = get_full_well_id(short)
    assert full == osdu_id, f"Expected '{osdu_id}', got '{full}'"
    print(f"✅ get_full_well_id: {short} -> {full}")
    
    # Test register_well
    new_id = "osdu:work-product-component--WellboreTrajectory:WELL-008:xyz"
    registered = register_well(new_id, "WELL-008")
    assert registered == "WELL-008", f"Expected 'WELL-008', got '{registered}'"
    print(f"✅ register_well: {new_id} -> {registered}")
    
    print("✅ Convenience function tests passed!\n")


def main():
    """Run all tests."""
    print("=" * 60)
    print("WellNameSimplifier Test Suite")
    print("=" * 60)
    print()
    
    try:
        test_basic_simplification()
        test_reverse_lookup()
        test_duplicate_handling()
        test_custom_registration()
        test_cache_operations()
        test_convenience_functions()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        return 0
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
