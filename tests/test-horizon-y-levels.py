#!/usr/bin/env python3
"""Test that horizons are placed at correct Y-levels (subsurface, within clear zone)."""

import sys
sys.path.insert(0, 'edicraft-agent')

from tools.coordinates import transform_surface_to_minecraft

# Test with sample horizon coordinates
test_coords = [
    (100.0, 200.0, -1000.0),  # Shallowest depth
    (150.0, 250.0, -1500.0),  # Mid depth
    (200.0, 300.0, -2000.0),  # Deepest depth
]

result = transform_surface_to_minecraft(test_coords)
print('Transformed coordinates:')
for i, (x, y, z) in enumerate(result):
    print(f'  Point {i+1}: MC X={x}, Y={y}, Z={z}')
    
y_coords = [c[1] for c in result]
print(f'\nY-coordinate range: {min(y_coords)} to {max(y_coords)}')
print(f'All Y-coords < 100 (subsurface): {all(c[1] < 100 for c in result)}')
print(f'All Y-coords >= 10 (within clear zone): {all(c[1] >= 10 for c in result)}')
print(f'Ground level: Y=100')
print(f'Clear zone: Y=10 to Y=130')

# Verify they're subsurface and within clear zone (Y=50-90)
if all(50 <= c[1] <= 90 for c in result):
    print('\n✅ SUCCESS: All horizon Y-coordinates are SUBSURFACE (50-90) and within clear zone')
    print('   Horizons are geological surfaces below ground!')
else:
    print('\n❌ FAILURE: Some horizon Y-coordinates are outside the subsurface range (50-90)')
    sys.exit(1)
