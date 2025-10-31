#!/usr/bin/env python3
"""
Integration example for WellNameSimplifier

This demonstrates how the name simplifier will be used in the
EDIcraft workflow tools for Minecraft visualization.
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.name_utils import WellNameSimplifier


def demo_wellbore_workflow():
    """Demonstrate name simplification in wellbore workflow."""
    print("=" * 60)
    print("EDIcraft Wellbore Workflow - Name Simplification Demo")
    print("=" * 60)
    print()
    
    simplifier = WellNameSimplifier()
    
    # Simulate receiving wellbore data from OSDU
    wellbores = [
        "osdu:work-product-component--WellboreTrajectory:WELL-001:abc123",
        "osdu:work-product-component--WellboreTrajectory:WELL-002:def456",
        "osdu:work-product-component--WellboreTrajectory:WELL-003:ghi789",
        "osdu:master-data--Wellbore:12345",
        "osdu:master-data--Wellbore:67890",
    ]
    
    print("📋 Processing wellbores from OSDU...")
    print()
    
    for osdu_id in wellbores:
        # Simplify the name for display
        short_name = simplifier.simplify_name(osdu_id)
        
        print(f"🔹 Building wellbore: {short_name}")
        print(f"   Full ID: {osdu_id}")
        print(f"   Minecraft sign text: '{short_name}'")
        print()
    
    print("=" * 60)
    print("✅ All wellbores built with simplified names!")
    print("=" * 60)
    print()
    
    # Demonstrate reverse lookup
    print("🔍 Reverse Lookup Demo:")
    print()
    
    test_name = "WELL-001"
    full_id = simplifier.get_full_id(test_name)
    print(f"User asks: 'Show me details for {test_name}'")
    print(f"Agent retrieves: {full_id}")
    print()


def demo_collection_workflow():
    """Demonstrate name simplification in collection workflow."""
    print("=" * 60)
    print("Collection Visualization - Name Simplification Demo")
    print("=" * 60)
    print()
    
    simplifier = WellNameSimplifier()
    
    # Simulate collection with 24 wells
    print("📦 Processing collection with 24 wells...")
    print()
    
    collection_wells = []
    for i in range(1, 25):
        osdu_id = f"osdu:work-product-component--WellboreTrajectory:WELL-{i:03d}:collection-abc"
        short_name = simplifier.simplify_name(osdu_id)
        collection_wells.append((short_name, osdu_id))
        
        if i <= 5 or i > 20:  # Show first 5 and last 3
            print(f"   {i:2d}. {short_name}")
        elif i == 6:
            print(f"   ... (wells 6-20)")
    
    print()
    print(f"✅ Processed {len(collection_wells)} wells")
    print(f"✅ All wells have user-friendly names")
    print()


def demo_duplicate_handling():
    """Demonstrate duplicate name handling."""
    print("=" * 60)
    print("Duplicate Name Handling Demo")
    print("=" * 60)
    print()
    
    simplifier = WellNameSimplifier()
    
    # Simulate wells with similar names from different sources
    wells = [
        ("osdu:work-product-component--WellboreTrajectory:WELL-007:source-a", "WELL-007"),
        ("osdu:work-product-component--WellboreTrajectory:WELL-007:source-b", "WELL-007"),
        ("osdu:work-product-component--WellboreTrajectory:WELL-007:source-c", "WELL-007"),
    ]
    
    print("⚠️  Processing wells with duplicate names...")
    print()
    
    for osdu_id, requested_name in wells:
        registered_name = simplifier.register_well(osdu_id, requested_name)
        print(f"Requested: {requested_name}")
        print(f"Registered as: {registered_name}")
        print(f"Full ID: {osdu_id}")
        print()
    
    print("✅ All wells registered with unique names!")
    print()


def main():
    """Run all demos."""
    demo_wellbore_workflow()
    print()
    demo_collection_workflow()
    print()
    demo_duplicate_handling()
    
    print("=" * 60)
    print("✅ Integration demos complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
