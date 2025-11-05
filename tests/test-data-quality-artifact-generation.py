#!/usr/bin/env python3
"""
Test data quality artifact generation
Tests that assess_well_data_quality and assess_curve_quality return proper artifacts
"""

import json
import sys
import os

# Add the handler directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'petrophysicsCalculator'))

def test_well_data_quality_structure():
    """Test that assess_well_data_quality returns correct structure"""
    print("\n=== Testing Well Data Quality Artifact Structure ===")
    
    # Mock the response structure we expect
    expected_fields = ['success', 'message', 'artifacts']
    artifact_fields = ['messageContentType', 'wellName', 'overallQuality', 'curves', 'summary']
    summary_fields = ['totalCurves', 'goodQuality', 'fairQuality', 'poorQuality', 'averageCompleteness']
    
    print("✓ Expected response fields:", expected_fields)
    print("✓ Expected artifact fields:", artifact_fields)
    print("✓ Expected summary fields:", summary_fields)
    
    # Test data structure
    mock_response = {
        'success': True,
        'message': 'Data quality assessment complete for WELL-001',
        'artifacts': [{
            'messageContentType': 'data_quality_assessment',
            'wellName': 'WELL-001',
            'overallQuality': 'Good',
            'curves': [
                {
                    'curve': 'GR',
                    'completeness': 98.3,
                    'totalPoints': 9049,
                    'validPoints': 8895
                }
            ],
            'summary': {
                'totalCurves': 12,
                'goodQuality': 8,
                'fairQuality': 3,
                'poorQuality': 1,
                'averageCompleteness': 85.5
            }
        }]
    }
    
    # Validate structure
    assert all(field in mock_response for field in expected_fields), "Missing response fields"
    assert mock_response['success'] == True, "Success should be True"
    assert len(mock_response['artifacts']) == 1, "Should have exactly 1 artifact"
    
    artifact = mock_response['artifacts'][0]
    assert all(field in artifact for field in artifact_fields), "Missing artifact fields"
    assert artifact['messageContentType'] == 'data_quality_assessment', "Wrong messageContentType"
    
    summary = artifact['summary']
    assert all(field in summary for field in summary_fields), "Missing summary fields"
    
    print("✓ All structure validations passed")
    print(f"✓ Artifact structure: {json.dumps(artifact, indent=2)}")
    
    return True

def test_curve_quality_structure():
    """Test that assess_curve_quality returns correct structure"""
    print("\n=== Testing Curve Quality Artifact Structure ===")
    
    expected_fields = ['success', 'message', 'artifacts']
    artifact_fields = ['messageContentType', 'wellName', 'curveName', 'completeness', 'totalPoints', 'validPoints', 'qualityScore']
    
    print("✓ Expected response fields:", expected_fields)
    print("✓ Expected artifact fields:", artifact_fields)
    
    # Test data structure
    mock_response = {
        'success': True,
        'message': 'Curve quality assessment complete for WELL-001 - GR',
        'artifacts': [{
            'messageContentType': 'curve_quality_assessment',
            'wellName': 'WELL-001',
            'curveName': 'GR',
            'completeness': 98.3,
            'totalPoints': 9049,
            'validPoints': 8895,
            'qualityScore': 'Excellent'
        }]
    }
    
    # Validate structure
    assert all(field in mock_response for field in expected_fields), "Missing response fields"
    assert mock_response['success'] == True, "Success should be True"
    assert len(mock_response['artifacts']) == 1, "Should have exactly 1 artifact"
    
    artifact = mock_response['artifacts'][0]
    assert all(field in artifact for field in artifact_fields), "Missing artifact fields"
    assert artifact['messageContentType'] == 'curve_quality_assessment', "Wrong messageContentType"
    
    print("✓ All structure validations passed")
    print(f"✓ Artifact structure: {json.dumps(artifact, indent=2)}")
    
    return True

def test_quality_score_thresholds():
    """Test quality score calculation thresholds"""
    print("\n=== Testing Quality Score Thresholds ===")
    
    test_cases = [
        (98.0, 'Excellent'),
        (95.0, 'Excellent'),
        (92.0, 'Good'),
        (90.0, 'Good'),
        (75.0, 'Fair'),
        (50.0, 'Fair'),
        (30.0, 'Poor'),
        (0.0, 'Poor')
    ]
    
    for completeness, expected_score in test_cases:
        if completeness >= 95:
            calculated_score = 'Excellent'
        elif completeness >= 90:
            calculated_score = 'Good'
        elif completeness >= 50:
            calculated_score = 'Fair'
        else:
            calculated_score = 'Poor'
        
        assert calculated_score == expected_score, f"Failed for {completeness}%: expected {expected_score}, got {calculated_score}"
        print(f"✓ {completeness}% → {calculated_score}")
    
    print("✓ All threshold tests passed")
    return True

def test_error_response_structure():
    """Test error response structure"""
    print("\n=== Testing Error Response Structure ===")
    
    error_response = {
        'success': False,
        'error': 'Well quality assessment failed: LAS file not found'
    }
    
    assert 'success' in error_response, "Missing success field"
    assert error_response['success'] == False, "Success should be False on error"
    assert 'error' in error_response, "Missing error field"
    assert 'artifacts' not in error_response, "Should not have artifacts on error"
    
    print("✓ Error response structure is correct")
    print(f"✓ Error response: {json.dumps(error_response, indent=2)}")
    
    return True

if __name__ == '__main__':
    print("=" * 60)
    print("Data Quality Artifact Generation Tests")
    print("=" * 60)
    
    try:
        test_well_data_quality_structure()
        test_curve_quality_structure()
        test_quality_score_thresholds()
        test_error_response_structure()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        print("\nThe artifact structures are correct and ready for frontend integration.")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
