#!/usr/bin/env python3
"""
Test that all subsurface demo features are within the clear zone.

This demo is primarily about SUBSURFACE visualization:
1. Wellbore trajectories (subsurface)
2. Horizon surfaces (subsurface)
3. Drilling rigs (surface structures, max 18 blocks tall)

All features must be cleared by the existing UI button.
"""

import sys
sys.path.insert(0, 'edicraft-agent')

from tools.coordinates import transform_surface_to_minecraft, transform_trajectory_to_minecraft
from tools.clear_environment_tool import ClearEnvironmentTool
from config import EDIcraftConfig

print("=" * 70)
print("SUBSURFACE DEMO CLEAR ZONE VALIDATION")
print("=" * 70)

# Initialize clear tool to get clear zone configuration
config = EDIcraftConfig()
clear_tool = ClearEnvironmentTool(config)
clear_region = clear_tool.clear_region

print(f"\nClear Zone Configuration:")
print(f"  Y Range: {clear_region['y_clear_start']} to {clear_region['y_clear_end']}")
print(f"  Ground Level: Y={clear_region['y_ground_start']}")

# Test 1: Horizon surfaces (subsurface)
print("\n" + "=" * 70)
print("TEST 1: Horizon Surfaces (Subsurface)")
print("=" * 70)

horizon_coords = [
    (100.0, 200.0, -1000.0),  # Shallowest
    (150.0, 250.0, -1500.0),  # Mid depth
    (200.0, 300.0, -2000.0),  # Deepest
]

horizon_mc = transform_surface_to_minecraft(horizon_coords)
horizon_y_coords = [c[1] for c in horizon_mc]

print(f"Horizon Y-coordinates: {min(horizon_y_coords)} to {max(horizon_y_coords)}")
print(f"  Subsurface (< Y=100): {all(y < 100 for y in horizon_y_coords)}")
print(f"  Within clear zone: {all(clear_region['y_clear_start'] <= y <= clear_region['y_clear_end'] for y in horizon_y_coords)}")

horizon_ok = all(
    clear_region['y_clear_start'] <= y < 100 
    for y in horizon_y_coords
)

if horizon_ok:
    print("✅ PASS: Horizons are subsurface and within clear zone")
else:
    print("❌ FAIL: Horizons are NOT properly positioned")

# Test 2: Wellbore trajectories (subsurface)
print("\n" + "=" * 70)
print("TEST 2: Wellbore Trajectories (Subsurface)")
print("=" * 70)

trajectory_coords = [
    (100.0, 200.0, 0.0),      # Surface
    (110.0, 210.0, -500.0),   # Shallow
    (120.0, 220.0, -1000.0),  # Mid depth
    (130.0, 230.0, -1500.0),  # Deep
]

trajectory_mc = transform_trajectory_to_minecraft(trajectory_coords)
trajectory_y_coords = [c[1] for c in trajectory_mc]

print(f"Trajectory Y-coordinates: {min(trajectory_y_coords)} to {max(trajectory_y_coords)}")
print(f"  Starts at/near surface (Y=100): {max(trajectory_y_coords) <= 100}")
print(f"  Goes subsurface: {min(trajectory_y_coords) < 100}")
print(f"  Within clear zone: {all(clear_region['y_clear_start'] <= y <= clear_region['y_clear_end'] for y in trajectory_y_coords)}")

trajectory_ok = all(
    clear_region['y_clear_start'] <= y <= 100 
    for y in trajectory_y_coords
)

if trajectory_ok:
    print("✅ PASS: Trajectories are subsurface and within clear zone")
else:
    print("❌ FAIL: Trajectories are NOT properly positioned")

# Test 3: Drilling rigs (surface structures)
print("\n" + "=" * 70)
print("TEST 3: Drilling Rigs (Surface Structures)")
print("=" * 70)

ground_level = clear_region['y_ground_start']
rig_heights = {
    "compact": 12,
    "standard": 15,
    "detailed": 18
}

print(f"Ground level: Y={ground_level}")
print(f"Rig heights:")
for style, height in rig_heights.items():
    top_y = ground_level + height
    print(f"  {style.capitalize()}: {height} blocks (top at Y={top_y})")

max_rig_height = max(rig_heights.values())
max_rig_top = ground_level + max_rig_height

rig_ok = max_rig_top <= clear_region['y_clear_end']

print(f"\nTallest rig top: Y={max_rig_top}")
print(f"Clear zone end: Y={clear_region['y_clear_end']}")
print(f"Within clear zone: {rig_ok}")

if rig_ok:
    print("✅ PASS: All rigs are within clear zone")
else:
    print("❌ FAIL: Rigs exceed clear zone")

# Test 4: Clear zone efficiency
print("\n" + "=" * 70)
print("TEST 4: Clear Zone Efficiency")
print("=" * 70)

clear_height = clear_region['y_clear_end'] - clear_region['y_clear_start']
used_height = max_rig_top - clear_region['y_clear_start']
efficiency = (used_height / clear_height) * 100

print(f"Clear zone height: {clear_height} blocks (Y={clear_region['y_clear_start']} to Y={clear_region['y_clear_end']})")
print(f"Actually used: {used_height} blocks (Y={clear_region['y_clear_start']} to Y={max_rig_top})")
print(f"Efficiency: {efficiency:.1f}%")

if efficiency > 80:
    print("✅ PASS: Clear zone is efficient (>80% utilized)")
elif efficiency > 50:
    print("⚠️  WARN: Clear zone has some waste but acceptable")
else:
    print("❌ FAIL: Clear zone is wasteful (<50% utilized)")

# Final summary
print("\n" + "=" * 70)
print("FINAL SUMMARY")
print("=" * 70)

all_tests_pass = horizon_ok and trajectory_ok and rig_ok

if all_tests_pass:
    print("✅ ALL TESTS PASSED")
    print("\nSubsurface demo features are correctly positioned:")
    print(f"  • Horizons: Y={min(horizon_y_coords)}-{max(horizon_y_coords)} (subsurface)")
    print(f"  • Trajectories: Y={min(trajectory_y_coords)}-{max(trajectory_y_coords)} (subsurface)")
    print(f"  • Rigs: Y={ground_level}-{max_rig_top} (surface)")
    print(f"  • Clear zone: Y={clear_region['y_clear_start']}-{clear_region['y_clear_end']}")
    print("\n✅ All features will be cleared by the existing UI button")
    sys.exit(0)
else:
    print("❌ SOME TESTS FAILED")
    print("\nFailed tests:")
    if not horizon_ok:
        print("  • Horizons not properly positioned")
    if not trajectory_ok:
        print("  • Trajectories not properly positioned")
    if not rig_ok:
        print("  • Rigs exceed clear zone")
    sys.exit(1)
