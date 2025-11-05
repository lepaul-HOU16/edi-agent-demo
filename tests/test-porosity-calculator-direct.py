#!/usr/bin/env python3
"""
Direct test of porosity calculator to verify it works
"""
import sys
sys.path.insert(0, 'amplify/functions/petrophysicsCalculator')

from petrophysics_calculators import PorosityCalculator

# Create test data
test_data = {
    'rhob': [2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6],
    'depth': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
}

calc = PorosityCalculator()
result = calc.calculate_porosity('density', test_data, {}, None)

print(f"Result type: {type(result)}")
print(f"Has values: {hasattr(result, 'values')}")
print(f"Has depths: {hasattr(result, 'depths')}")
print(f"Values: {result.values}")
print(f"Depths: {result.depths}")
print(f"Statistics: {result.statistics}")
