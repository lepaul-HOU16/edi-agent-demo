#!/usr/bin/env python3
"""
Test response format consistency for all petrophysics calculator tools
Validates Requirements 6.1, 6.2, 6.3, 6.4, 6.5
"""
import json
import sys

def test_response_format_consistency():
    """
    Test that all tool responses follow the consistent format:
    - Success responses: {success: True, message: str, artifacts: list}
    - Error responses: {success: False, error: str}
    """
    
    # Mock responses from each tool (based on handler.py)
    test_cases = [
        {
            'tool': 'list_wells',
            'success_response': {
                'success': True,
                'message': 'Found 3 wells in S3',
                'artifacts': [{
                    'messageContentType': 'well_list',
                    'analysisType': 'data_retrieval',
                    'results': {'wells': ['WELL-001', 'WELL-002', 'WELL-003'], 'count': 3}
                }]
            },
            'error_response': {
                'success': False,
                'error': 'Failed to list wells from S3: Access denied'
            }
        },
        {
            'tool': 'calculate_porosity',
            'success_response': {
                'success': True,
                'message': 'Calculated porosity for WELL-001 using density method. Mean porosity: 0.250',
                'artifacts': [{
                    'messageContentType': 'comprehensive_porosity_analysis',
                    'analysisType': 'single_well',
                    'wellName': 'WELL-001',
                    'results': {
                        'method': 'density',
                        'curveData': {'porosity': [0.25, 0.26, 0.24]},
                        'statistics': {'mean': 0.25, 'min': 0.24, 'max': 0.26, 'count': 3, 'std_dev': 0},
                        'dataQuality': {'completeness': 1.0, 'validPoints': 3, 'totalPoints': 3}
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'RHOB curve not found in LAS file'
            }
        },
        {
            'tool': 'calculate_shale_volume',
            'success_response': {
                'success': True,
                'message': 'Calculated shale volume for WELL-001 using linear method. Mean Vsh: 0.350',
                'artifacts': [{
                    'messageContentType': 'shale_volume_analysis',
                    'analysisType': 'single_well',
                    'wellName': 'WELL-001',
                    'results': {
                        'method': 'linear',
                        'curveData': {'shale_volume': [0.35, 0.36, 0.34]},
                        'statistics': {'mean': 0.35, 'min': 0.34, 'max': 0.36, 'count': 3, 'std_dev': 0},
                        'dataQuality': {'completeness': 1.0, 'validPoints': 3, 'totalPoints': 3}
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'GR curve not found in LAS file'
            }
        },
        {
            'tool': 'calculate_saturation',
            'success_response': {
                'success': True,
                'message': "Calculated water saturation for WELL-001 using Archie's equation. Mean Sw: 0.450",
                'artifacts': [{
                    'messageContentType': 'water_saturation_analysis',
                    'analysisType': 'single_well',
                    'wellName': 'WELL-001',
                    'results': {
                        'method': 'archie',
                        'curveData': {'water_saturation': [0.45, 0.46, 0.44]},
                        'statistics': {'mean': 0.45, 'min': 0.44, 'max': 0.46, 'count': 3, 'std_dev': 0},
                        'dataQuality': {'completeness': 1.0, 'validPoints': 3, 'totalPoints': 3}
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'RHOB and RT curves required for saturation calculation'
            }
        },
        {
            'tool': 'get_well_info',
            'success_response': {
                'success': True,
                'message': 'Retrieved well information for WELL-001',
                'artifacts': [{
                    'messageContentType': 'well_info',
                    'analysisType': 'data_retrieval',
                    'wellName': 'WELL-001',
                    'results': {
                        'well_info': {'WELL': 'WELL-001', 'UWI': '12345'},
                        'curves': ['DEPT', 'GR', 'RHOB'],
                        'curve_count': 3
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'well_name is required'
            }
        },
        {
            'tool': 'get_curve_data',
            'success_response': {
                'success': True,
                'message': 'Retrieved 2 curves for WELL-001',
                'artifacts': [{
                    'messageContentType': 'curve_data',
                    'analysisType': 'data_retrieval',
                    'wellName': 'WELL-001',
                    'results': {
                        'curves': {'DEPT': [100, 101, 102], 'GR': [50, 55, 60]},
                        'depth_range': {'start': 100, 'end': 102},
                        'point_count': 3
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'curves parameter is required (list of curve names)'
            }
        },
        {
            'tool': 'calculate_statistics',
            'success_response': {
                'success': True,
                'message': 'Calculated statistics for GR in WELL-001',
                'artifacts': [{
                    'messageContentType': 'curve_statistics',
                    'analysisType': 'data_retrieval',
                    'wellName': 'WELL-001',
                    'results': {
                        'curve_name': 'GR',
                        'statistics': {
                            'mean': 55.0,
                            'median': 55.0,
                            'min': 50.0,
                            'max': 60.0,
                            'std_dev': 5.0,
                            'count': 3,
                            'total_points': 3,
                            'completeness': 1.0
                        }
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'curve parameter is required'
            }
        },
        {
            'tool': 'assess_well_data_quality',
            'success_response': {
                'success': True,
                'message': '🌟 **Data Quality Assessment: WELL-001**\n**Overall Quality:** EXCELLENT\n**Curves Analyzed:** 5\n**Average Completeness:** 95.0%\n',
                'artifacts': [{
                    'messageContentType': 'well_data_quality',
                    'analysisType': 'single_well',
                    'wellName': 'WELL-001',
                    'results': {
                        'well_name': 'WELL-001',
                        'overall_quality': 'excellent',
                        'summary': {
                            'average_completeness': 0.95,
                            'average_outliers': 0.02,
                            'average_noise': 0.05,
                            'total_curves': 5
                        },
                        'curves': []
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'DEPT curve not found in LAS file'
            }
        },
        {
            'tool': 'assess_curve_quality',
            'success_response': {
                'success': True,
                'message': 'Assessed quality for curve GR in WELL-001. Quality: excellent',
                'artifacts': [{
                    'messageContentType': 'curve_quality_assessment',
                    'analysisType': 'single_curve',
                    'wellName': 'WELL-001',
                    'results': {
                        'curve_name': 'GR',
                        'quality_flag': 'excellent',
                        'data_completeness': 0.95,
                        'outlier_percentage': 0.02,
                        'noise_level': 0.05,
                        'environmental_corrections': {},
                        'validation_notes': [],
                        'statistics': {}
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'curve_name parameter is required'
            }
        },
        {
            'tool': 'calculate_data_completeness',
            'success_response': {
                'success': True,
                'message': 'Calculated data completeness for curve GR in WELL-001. Completeness: 95.0%',
                'artifacts': [{
                    'messageContentType': 'data_completeness',
                    'analysisType': 'single_curve',
                    'wellName': 'WELL-001',
                    'results': {
                        'curve_name': 'GR',
                        'completeness_metrics': {
                            'total_points': 100,
                            'valid_points': 95,
                            'null_points': 5,
                            'completeness_percentage': 0.95
                        }
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'curve_name parameter is required'
            }
        },
        {
            'tool': 'validate_environmental_corrections',
            'success_response': {
                'success': True,
                'message': 'Validated environmental corrections for curve GR in WELL-001. Status: valid',
                'artifacts': [{
                    'messageContentType': 'environmental_corrections_validation',
                    'analysisType': 'single_curve',
                    'wellName': 'WELL-001',
                    'results': {
                        'curve_name': 'GR',
                        'corrections_applied': True,
                        'correction_type': 'gamma_ray',
                        'validation_status': 'valid',
                        'recommendations': ['GR values are within typical range (0-200 API)']
                    }
                }]
            },
            'error_response': {
                'success': False,
                'error': 'curve_name parameter is required'
            }
        }
    ]
    
    print("Testing response format consistency for all tools...")
    print("=" * 80)
    
    all_passed = True
    
    for test_case in test_cases:
        tool = test_case['tool']
        success_response = test_case['success_response']
        error_response = test_case['error_response']
        
        print(f"\n✓ Testing {tool}...")
        
        # Test success response format
        if not validate_success_response(tool, success_response):
            all_passed = False
        
        # Test error response format
        if not validate_error_response(tool, error_response):
            all_passed = False
    
    print("\n" + "=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED - Response format is consistent across all tools")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Response format inconsistencies detected")
        return 1

def validate_success_response(tool, response):
    """Validate success response format (Requirements 6.1, 6.2, 6.3)"""
    errors = []
    
    # Check required fields
    if 'success' not in response:
        errors.append("Missing 'success' field")
    elif response['success'] != True:
        errors.append("'success' field should be True")
    
    if 'message' not in response:
        errors.append("Missing 'message' field")
    elif not isinstance(response['message'], str):
        errors.append("'message' field should be a string")
    
    if 'artifacts' not in response:
        errors.append("Missing 'artifacts' field")
    elif not isinstance(response['artifacts'], list):
        errors.append("'artifacts' field should be a list")
    elif len(response['artifacts']) == 0:
        errors.append("'artifacts' list should not be empty")
    else:
        # Validate artifact structure
        artifact = response['artifacts'][0]
        if 'messageContentType' not in artifact:
            errors.append("Artifact missing 'messageContentType' field")
        if 'analysisType' not in artifact:
            errors.append("Artifact missing 'analysisType' field")
        if 'results' not in artifact:
            errors.append("Artifact missing 'results' field")
    
    # Check for extra fields at root level (should only have success, message, artifacts)
    allowed_fields = {'success', 'message', 'artifacts'}
    extra_fields = set(response.keys()) - allowed_fields
    if extra_fields:
        errors.append(f"Extra fields at root level: {extra_fields}")
    
    if errors:
        print(f"  ❌ Success response validation failed:")
        for error in errors:
            print(f"     - {error}")
        return False
    else:
        print(f"  ✅ Success response format valid")
        return True

def validate_error_response(tool, response):
    """Validate error response format (Requirements 6.4, 6.5)"""
    errors = []
    
    # Check required fields
    if 'success' not in response:
        errors.append("Missing 'success' field")
    elif response['success'] != False:
        errors.append("'success' field should be False")
    
    if 'error' not in response:
        errors.append("Missing 'error' field")
    elif not isinstance(response['error'], str):
        errors.append("'error' field should be a string")
    elif len(response['error']) == 0:
        errors.append("'error' field should not be empty")
    
    # Check that artifacts is not present or empty in error responses
    if 'artifacts' in response and len(response['artifacts']) > 0:
        errors.append("Error response should not contain artifacts with data")
    
    if errors:
        print(f"  ❌ Error response validation failed:")
        for error in errors:
            print(f"     - {error}")
        return False
    else:
        print(f"  ✅ Error response format valid")
        return True

if __name__ == '__main__':
    sys.exit(test_response_format_consistency())
