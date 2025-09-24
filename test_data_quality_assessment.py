#!/usr/bin/env python3
"""
Unit Tests for Data Quality Assessment Module
Tests curve quality assessment, environmental correction validation,
and data completeness metrics calculation
"""

import math
from data_quality_assessment import DataQualityAssessment, QualityFlag


def test_curve_quality_assessment():
    """Test curve quality assessment functionality"""
    print("Testing Curve Quality Assessment...")
    
    qa = DataQualityAssessment()
    
    # Test with high-quality data
    try:
        high_quality_data = [2.3, 2.35, 2.4, 2.38, 2.42, 2.36, 2.41, 2.39, 2.37, 2.43]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        
        result = qa.assess_curve_quality('RHOB', high_quality_data, depths)
        
        print(f"✅ High-quality RHOB assessment:")
        print(f"   Quality flag: {result.quality_flag.value}")
        print(f"   Data completeness: {result.data_completeness:.1f}%")
        print(f"   Outlier percentage: {result.outlier_percentage:.1f}%")
        print(f"   Noise level: {result.noise_level:.1f}%")
        print(f"   Validation notes: {result.validation_notes}")
        
        if result.quality_flag in [QualityFlag.EXCELLENT, QualityFlag.GOOD]:
            print(f"✅ High-quality data correctly identified as {result.quality_flag.value}")
        else:
            print(f"❌ High-quality data incorrectly flagged as {result.quality_flag.value}")
            
    except Exception as e:
        print(f"❌ High-quality data test failed: {str(e)}")
    
    # Test with poor-quality data (lots of nulls and outliers)
    try:
        poor_quality_data = [2.3, -999.25, 5.0, 2.4, -999.25, -999.25, 0.5, 2.38, -999.25, 10.0]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        
        result = qa.assess_curve_quality('RHOB', poor_quality_data, depths)
        
        print(f"\n✅ Poor-quality RHOB assessment:")
        print(f"   Quality flag: {result.quality_flag.value}")
        print(f"   Data completeness: {result.data_completeness:.1f}%")
        print(f"   Outlier percentage: {result.outlier_percentage:.1f}%")
        print(f"   Noise level: {result.noise_level:.1f}%")
        
        if result.quality_flag in [QualityFlag.POOR, QualityFlag.FAIR]:
            print(f"✅ Poor-quality data correctly identified as {result.quality_flag.value}")
        else:
            print(f"❌ Poor-quality data incorrectly flagged as {result.quality_flag.value}")
            
    except Exception as e:
        print(f"❌ Poor-quality data test failed: {str(e)}")
    
    # Test with gamma ray data
    try:
        gr_data = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        
        result = qa.assess_curve_quality('GR', gr_data, depths)
        
        print(f"\n✅ Gamma Ray assessment:")
        print(f"   Quality flag: {result.quality_flag.value}")
        print(f"   Environmental corrections: {result.environmental_corrections}")
        print(f"   Statistics: Mean={result.statistics['mean']:.1f}, Std={result.statistics['std_dev']:.1f}")
        
    except Exception as e:
        print(f"❌ Gamma ray test failed: {str(e)}")


def test_data_completeness_metrics():
    """Test data completeness metrics calculation"""
    print("\nTesting Data Completeness Metrics...")
    
    qa = DataQualityAssessment()
    
    # Test with complete data
    try:
        complete_data = [2.3, 2.35, 2.4, 2.38, 2.42, 2.36, 2.41, 2.39, 2.37, 2.43]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        
        metrics = qa.calculate_data_completeness_metrics(complete_data, depths)
        
        print(f"✅ Complete data metrics:")
        print(f"   Total points: {metrics.total_points}")
        print(f"   Valid points: {metrics.valid_points}")
        print(f"   Completeness: {metrics.completeness_percentage:.1f}%")
        print(f"   Depth coverage: {metrics.depth_coverage:.1f}")
        print(f"   Gaps: {len(metrics.gaps)}")
        
        if metrics.completeness_percentage == 100.0:
            print(f"✅ Complete data correctly identified: 100% completeness")
        else:
            print(f"❌ Complete data incorrectly calculated: {metrics.completeness_percentage}%")
            
    except Exception as e:
        print(f"❌ Complete data test failed: {str(e)}")
    
    # Test with incomplete data (gaps)
    try:
        incomplete_data = [2.3, 2.35, -999.25, -999.25, -999.25, 2.36, 2.41, -999.25, 2.37, 2.43]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        
        metrics = qa.calculate_data_completeness_metrics(incomplete_data, depths)
        
        print(f"\n✅ Incomplete data metrics:")
        print(f"   Total points: {metrics.total_points}")
        print(f"   Valid points: {metrics.valid_points}")
        print(f"   Null points: {metrics.null_points}")
        print(f"   Completeness: {metrics.completeness_percentage:.1f}%")
        print(f"   Gaps identified: {len(metrics.gaps)}")
        
        expected_completeness = (6 / 10) * 100  # 6 valid out of 10 total
        if abs(metrics.completeness_percentage - expected_completeness) < 0.1:
            print(f"✅ Incomplete data correctly calculated: {metrics.completeness_percentage}%")
        else:
            print(f"❌ Incomplete data incorrectly calculated: {metrics.completeness_percentage}% (expected {expected_completeness}%)")
            
    except Exception as e:
        print(f"❌ Incomplete data test failed: {str(e)}")


def test_environmental_correction_validation():
    """Test environmental correction validation"""
    print("\nTesting Environmental Correction Validation...")
    
    qa = DataQualityAssessment()
    
    # Test density correction validation
    try:
        # Good density data (realistic values)
        good_density_data = [2.3, 2.35, 2.4, 2.38, 2.42, 2.36, 2.41, 2.39, 2.37, 2.43]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        well_info = {"well_name": "TEST_WELL"}
        
        corrections = qa.validate_environmental_corrections('RHOB', good_density_data, depths, well_info)
        
        print(f"✅ Density correction validation:")
        for corr in corrections:
            print(f"   Type: {corr.correction_type}")
            print(f"   Applied: {corr.is_applied}")
            print(f"   Valid: {corr.is_valid}")
            print(f"   Notes: {corr.validation_notes}")
        
        if corrections and corrections[0].is_valid:
            print(f"✅ Good density data correctly validated")
        else:
            print(f"❌ Good density data incorrectly invalidated")
            
    except Exception as e:
        print(f"❌ Density correction test failed: {str(e)}")
    
    # Test with bad density data (unrealistic values)
    try:
        bad_density_data = [0.5, 2.35, 5.0, 2.38, 10.0, 2.36, 0.1, 2.39, 15.0, 2.43]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        well_info = {"well_name": "TEST_WELL"}
        
        corrections = qa.validate_environmental_corrections('RHOB', bad_density_data, depths, well_info)
        
        print(f"\n✅ Bad density correction validation:")
        for corr in corrections:
            print(f"   Type: {corr.correction_type}")
            print(f"   Valid: {corr.is_valid}")
            print(f"   Notes: {corr.validation_notes}")
        
        if corrections and not corrections[0].is_valid:
            print(f"✅ Bad density data correctly invalidated")
        else:
            print(f"❌ Bad density data incorrectly validated")
            
    except Exception as e:
        print(f"❌ Bad density correction test failed: {str(e)}")
    
    # Test neutron correction validation
    try:
        neutron_data = [15, 20, 25, 18, 22, 16, 24, 19, 17, 23]
        depths = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009]
        well_info = {"well_name": "TEST_WELL"}
        
        corrections = qa.validate_environmental_corrections('NPHI', neutron_data, depths, well_info)
        
        print(f"\n✅ Neutron correction validation:")
        for corr in corrections:
            print(f"   Type: {corr.correction_type}")
            print(f"   Valid: {corr.is_valid}")
            print(f"   Notes: {corr.validation_notes}")
            
    except Exception as e:
        print(f"❌ Neutron correction test failed: {str(e)}")


def test_outlier_detection():
    """Test outlier detection functionality"""
    print("\nTesting Outlier Detection...")
    
    qa = DataQualityAssessment()
    
    # Test with data containing clear outliers
    try:
        # Normal data with outliers
        data_with_outliers = [2.3, 2.35, 2.4, 10.0, 2.42, 2.36, 0.5, 2.39, 2.37, 2.43]  # 10.0 and 0.5 are outliers
        
        outlier_percentage = qa._detect_outliers('RHOB', data_with_outliers)
        
        print(f"✅ Outlier detection test:")
        print(f"   Data: {data_with_outliers}")
        print(f"   Outlier percentage: {outlier_percentage:.1f}%")
        
        # Should detect approximately 20% outliers (2 out of 10)
        if 15 <= outlier_percentage <= 25:
            print(f"✅ Outliers correctly detected: ~20% expected, {outlier_percentage:.1f}% found")
        else:
            print(f"❌ Outlier detection error: expected ~20%, got {outlier_percentage:.1f}%")
            
    except Exception as e:
        print(f"❌ Outlier detection test failed: {str(e)}")
    
    # Test with clean data (no outliers)
    try:
        clean_data = [2.3, 2.35, 2.4, 2.38, 2.42, 2.36, 2.41, 2.39, 2.37, 2.43]
        
        outlier_percentage = qa._detect_outliers('RHOB', clean_data)
        
        print(f"\n✅ Clean data outlier test:")
        print(f"   Outlier percentage: {outlier_percentage:.1f}%")
        
        if outlier_percentage <= 5:  # Should be very low for clean data
            print(f"✅ Clean data correctly identified: {outlier_percentage:.1f}% outliers")
        else:
            print(f"❌ Clean data incorrectly flagged: {outlier_percentage:.1f}% outliers")
            
    except Exception as e:
        print(f"❌ Clean data test failed: {str(e)}")


def test_noise_assessment():
    """Test noise level assessment"""
    print("\nTesting Noise Level Assessment...")
    
    qa = DataQualityAssessment()
    
    # Test with low-noise data
    try:
        low_noise_data = [2.30, 2.31, 2.32, 2.33, 2.34, 2.35, 2.36, 2.37, 2.38, 2.39]  # Smooth trend
        
        noise_level = qa._assess_noise_level(low_noise_data)
        
        print(f"✅ Low-noise data test:")
        print(f"   Data: {low_noise_data}")
        print(f"   Noise level: {noise_level:.1f}%")
        
        if noise_level <= 10:  # Should be low for smooth data
            print(f"✅ Low noise correctly identified: {noise_level:.1f}%")
        else:
            print(f"❌ Low noise incorrectly assessed: {noise_level:.1f}%")
            
    except Exception as e:
        print(f"❌ Low-noise test failed: {str(e)}")
    
    # Test with high-noise data
    try:
        high_noise_data = [2.30, 2.45, 2.25, 2.50, 2.20, 2.55, 2.15, 2.60, 2.10, 2.65]  # Very noisy
        
        noise_level = qa._assess_noise_level(high_noise_data)
        
        print(f"\n✅ High-noise data test:")
        print(f"   Data: {high_noise_data}")
        print(f"   Noise level: {noise_level:.1f}%")
        
        if noise_level >= 20:  # Should be high for noisy data
            print(f"✅ High noise correctly identified: {noise_level:.1f}%")
        else:
            print(f"❌ High noise incorrectly assessed: {noise_level:.1f}%")
            
    except Exception as e:
        print(f"❌ High-noise test failed: {str(e)}")


def run_all_tests():
    """Run all data quality assessment tests"""
    print("Data Quality Assessment Module Tests")
    print("="*50)
    
    try:
        test_curve_quality_assessment()
        test_data_completeness_metrics()
        test_environmental_correction_validation()
        test_outlier_detection()
        test_noise_assessment()
        
        print("\n🎉 All data quality assessment tests completed!")
        return True
        
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)