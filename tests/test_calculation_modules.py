#!/usr/bin/env python3
"""
Unit Tests for Petrophysical Calculation Modules
Tests the calculation engines directly
"""

import json
import math
from petrophysics_calculators import (
    PorosityCalculator, 
    ShaleVolumeCalculator, 
    SaturationCalculator,
    PorosityMethod,
    ShaleVolumeMethod,
    SaturationMethod
)


def test_porosity_calculator():
    """Test porosity calculation methods"""
    print("Testing Porosity Calculator...")
    
    calc = PorosityCalculator()
    
    # Test data
    rhob_data = [2.3, 2.4, 2.5, 2.2, -999.25]  # Bulk density data
    nphi_data = [15, 20, 25, 30, -999.25]       # Neutron porosity data
    depth_data = [2000, 2001, 2002, 2003, 2004]
    
    # Test density porosity
    try:
        input_data = {'rhob': rhob_data, 'depth': depth_data}
        result = calc.calculate_porosity('density', input_data)
        
        print(f"✅ Density porosity: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        print(f"   Methodology: {result.methodology}")
        
        # Verify calculation: φD = (2.65 - RHOB) / (2.65 - 1.0)
        expected_first = (2.65 - 2.3) / (2.65 - 1.0)  # Should be ~0.212
        if abs(result.values[0] - expected_first) < 0.001:
            print(f"✅ Density porosity calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Density porosity calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Density porosity test failed: {str(e)}")
    
    # Test neutron porosity
    try:
        input_data = {'nphi': nphi_data, 'depth': depth_data}
        result = calc.calculate_porosity('neutron', input_data)
        
        print(f"✅ Neutron porosity: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        
        # Verify calculation: φN = NPHI / 100
        expected_first = 15 / 100  # Should be 0.15
        if abs(result.values[0] - expected_first) < 0.001:
            print(f"✅ Neutron porosity calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Neutron porosity calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Neutron porosity test failed: {str(e)}")
    
    # Test effective porosity
    try:
        input_data = {'rhob': rhob_data, 'nphi': nphi_data, 'depth': depth_data}
        result = calc.calculate_porosity('effective', input_data)
        
        print(f"✅ Effective porosity: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        
        # Verify calculation: φE = (φD + φN) / 2
        phi_d = (2.65 - 2.3) / (2.65 - 1.0)  # ~0.212
        phi_n = 15 / 100  # 0.15
        expected_first = (phi_d + phi_n) / 2  # Should be ~0.181
        if abs(result.values[0] - expected_first) < 0.001:
            print(f"✅ Effective porosity calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Effective porosity calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Effective porosity test failed: {str(e)}")


def test_shale_volume_calculator():
    """Test shale volume calculation methods"""
    print("\nTesting Shale Volume Calculator...")
    
    calc = ShaleVolumeCalculator()
    
    # Test data
    gr_data = [40, 60, 80, 100, -999.25]  # Gamma ray data
    depth_data = [2000, 2001, 2002, 2003, 2004]
    
    parameters = {'gr_clean': 30, 'gr_shale': 120}
    
    # Test Larionov Tertiary
    try:
        input_data = {'gr': gr_data, 'depth': depth_data}
        result = calc.calculate_shale_volume('larionov_tertiary', input_data, parameters)
        
        print(f"✅ Larionov Tertiary: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        print(f"   Methodology: {result.methodology}")
        
        # Verify calculation: IGR = (40 - 30) / (120 - 30) = 0.111, Vsh = 0.083 * (2^(3.7 * 0.111) - 1)
        igr = (40 - 30) / (120 - 30)  # 0.111
        expected_first = 0.083 * (math.pow(2, 3.7 * igr) - 1)  # Should be ~0.045
        if abs(result.values[0] - expected_first) < 0.01:
            print(f"✅ Larionov Tertiary calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Larionov Tertiary calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Larionov Tertiary test failed: {str(e)}")
    
    # Test Linear method
    try:
        input_data = {'gr': gr_data, 'depth': depth_data}
        result = calc.calculate_shale_volume('linear', input_data, parameters)
        
        print(f"✅ Linear method: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        
        # Verify calculation: Vsh = IGR = (40 - 30) / (120 - 30) = 0.111
        expected_first = (40 - 30) / (120 - 30)  # Should be ~0.111
        if abs(result.values[0] - expected_first) < 0.001:
            print(f"✅ Linear method calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Linear method calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Linear method test failed: {str(e)}")
    
    # Test Clavier method
    try:
        input_data = {'gr': gr_data, 'depth': depth_data}
        result = calc.calculate_shale_volume('clavier', input_data, parameters)
        
        print(f"✅ Clavier method: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        
        # Verify calculation: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
        igr = (40 - 30) / (120 - 30)  # 0.111
        term = 3.38 - math.pow(igr + 0.7, 2)
        expected_first = 1.7 - math.sqrt(term) if term >= 0 else -999.25
        if abs(result.values[0] - expected_first) < 0.01:
            print(f"✅ Clavier method calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Clavier method calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Clavier method test failed: {str(e)}")


def test_saturation_calculator():
    """Test water saturation calculation methods"""
    print("\nTesting Saturation Calculator...")
    
    calc = SaturationCalculator()
    
    # Test data
    rt_data = [10, 20, 50, 100, -999.25]      # Resistivity data
    porosity_data = [0.2, 0.15, 0.1, 0.05, -999.25]  # Porosity data
    depth_data = [2000, 2001, 2002, 2003, 2004]
    
    parameters = {'rw': 0.1, 'a': 1.0, 'm': 2.0, 'n': 2.0}
    
    # Test Archie equation
    try:
        input_data = {'rt': rt_data, 'porosity': porosity_data, 'depth': depth_data}
        result = calc.calculate_saturation('archie', input_data, parameters)
        
        print(f"✅ Archie equation: Mean={result.statistics['mean']:.3f}, Valid count={result.statistics['valid_count']}")
        print(f"   Methodology: {result.methodology}")
        
        # Verify calculation: Sw = ((a * Rw) / (φ^m * RT))^(1/n)
        # F = a / φ^m = 1.0 / 0.2^2 = 25
        # Sw = ((25 * 0.1) / 10)^(1/2) = (2.5 / 10)^0.5 = 0.5
        formation_factor = 1.0 / math.pow(0.2, 2.0)  # 25
        expected_first = math.pow((formation_factor * 0.1) / 10, 1 / 2.0)  # Should be 0.5
        if abs(result.values[0] - expected_first) < 0.01:
            print(f"✅ Archie equation calculation verified: {result.values[0]:.3f} ≈ {expected_first:.3f}")
        else:
            print(f"❌ Archie equation calculation error: {result.values[0]:.3f} ≠ {expected_first:.3f}")
            
    except Exception as e:
        print(f"❌ Archie equation test failed: {str(e)}")


def test_error_handling():
    """Test error handling and validation"""
    print("\nTesting Error Handling...")
    
    calc = PorosityCalculator()
    
    # Test missing required curve
    try:
        input_data = {'depth': [2000, 2001, 2002]}  # Missing RHOB
        result = calc.calculate_porosity('density', input_data)
        print(f"❌ Missing curve validation failed - should have thrown error")
    except Exception as e:
        print(f"✅ Missing curve validation working: {str(e)}")
    
    # Test invalid method
    try:
        input_data = {'rhob': [2.3, 2.4], 'depth': [2000, 2001]}
        result = calc.calculate_porosity('invalid_method', input_data)
        print(f"❌ Invalid method validation failed - should have thrown error")
    except Exception as e:
        print(f"✅ Invalid method validation working: {str(e)}")
    
    # Test null value handling
    try:
        input_data = {'rhob': [-999.25, 2.4, float('nan')], 'depth': [2000, 2001, 2002]}
        result = calc.calculate_porosity('density', input_data)
        
        # Should have 1 valid value (2.4), others should be -999.25
        valid_count = result.statistics['valid_count']
        if valid_count == 1:
            print(f"✅ Null value handling working: {valid_count} valid values")
        else:
            print(f"❌ Null value handling failed: expected 1, got {valid_count}")
            
    except Exception as e:
        print(f"❌ Null value handling test failed: {str(e)}")


def run_all_tests():
    """Run all calculation module tests"""
    print("Petrophysical Calculation Module Tests")
    print("="*50)
    
    try:
        test_porosity_calculator()
        test_shale_volume_calculator()
        test_saturation_calculator()
        test_error_handling()
        
        print("\n🎉 All calculation module tests completed!")
        return True
        
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)