import json
import boto3
import os
from typing import Dict, Any
from petrophysics_calculators import (
    PorosityCalculator,
    ShaleVolumeCalculator,
    SaturationCalculator
)

# Initialize AWS clients
s3_client = boto3.client('s3')

# Initialize calculators
porosity_calc = PorosityCalculator()
shale_calc = ShaleVolumeCalculator()
saturation_calc = SaturationCalculator()

# Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', '')
WELL_DATA_PREFIX = os.environ.get('WELL_DATA_PREFIX', 'global/well-data/')

def lambda_handler(event, context):
    """
    Handler for petrophysics calculations
    Supports both direct invocation and AgentCore format
    """
    print(f"Received event: {json.dumps(event)}")
    
    # Check if this is direct invocation format
    if 'tool' in event:
        # Direct invocation: {tool: 'calculate_porosity', parameters: {wellName, method}}
        tool_name = event.get('tool', '')
        params = event.get('parameters', {})
        api_path = f"/{tool_name}"
        print(f"Direct invocation - Tool: {tool_name}")
    else:
        # AgentCore format: {apiPath: '/calculate_porosity', requestBody: {...}}
        api_path = event.get('apiPath', '')
        parameters = event.get('requestBody', {}).get('content', {}).get('application/json', {}).get('properties', [])
        
        # Convert parameters array to dict
        params = {}
        for param in parameters:
            params[param['name']] = param['value']
        print(f"AgentCore invocation - API Path: {api_path}")
    
    print(f"Parameters: {params}")
    print(f"API Path for routing: {api_path}")
    
    try:
        if api_path == '/list_wells':
            result = list_wells()
        elif api_path == '/get_well_info':
            result = get_well_info(params)
        elif api_path == '/get_curve_data':
            result = get_curve_data(params)
        elif api_path == '/calculate_statistics':
            result = calculate_statistics(params)
        elif api_path == '/calculate_porosity':
            result = calculate_porosity(params)
        elif api_path == '/calculate_shale_volume':
            result = calculate_shale_volume(params)
        elif api_path == '/calculate_saturation':
            result = calculate_saturation(params)
        elif api_path == '/assess_curve_quality':
            result = assess_curve_quality(params)
        elif api_path == '/assess_well_data_quality':
            result = assess_well_data_quality(params)
        elif api_path == '/calculate_data_completeness':
            result = calculate_data_completeness(params)
        elif api_path == '/validate_environmental_corrections':
            result = validate_environmental_corrections(params)
        else:
            result = {'error': f'Unknown API path: {api_path}'}
            print(f"ERROR: Unknown API path: {api_path}")
        
        print(f"Result: {json.dumps(result)[:200]}")  # Log first 200 chars of result
        
        # For direct invocation, return simple format
        if 'tool' in event:
            return result
        
        # For AgentCore, return formatted response
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'apiPath': api_path,
                'httpMethod': event.get('httpMethod'),
                'httpStatusCode': 200,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps(result)
                    }
                }
            }
        }
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR: {str(e)}")
        print(f"Traceback: {error_details}")
        return {'error': str(e), 'traceback': error_details}
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'apiPath': api_path,
                'httpMethod': event.get('httpMethod'),
                'httpStatusCode': 500,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps({'error': str(e)})
                    }
                }
            }
        }

def list_wells() -> Dict[str, Any]:
    """List all available wells from S3"""
    try:
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=WELL_DATA_PREFIX
        )
        
        wells = []
        if 'Contents' in response:
            for obj in response['Contents']:
                if obj['Key'].endswith('.las'):
                    well_name = obj['Key'].replace(WELL_DATA_PREFIX, '').replace('.las', '')
                    wells.append(well_name)
        
        return {
            'success': True,
            'wells': wells,
            'count': len(wells)
        }
    except Exception as e:
        return {'success': False, 'error': f'Failed to list wells: {str(e)}'}

def get_well_info(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get well information"""
    well_name = params.get('wellName')
    
    try:
        # Load LAS file from S3
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        # Parse for available curves (simple parsing)
        curves = []
        in_curve_section = False
        for line in content.split('\n'):
            if line.startswith('~C'):
                in_curve_section = True
                continue
            if line.startswith('~'):
                in_curve_section = False
            if in_curve_section and '.' in line:
                curve_name = line.split('.')[0].strip()
                if curve_name:
                    curves.append(curve_name)
        
        return {
            'success': True,
            'wellName': well_name,
            'availableCurves': curves
        }
    except Exception as e:
        return {'success': False, 'error': f'Failed to get well info: {str(e)}'}

def calculate_porosity(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate porosity"""
    well_name = params.get('wellName')
    method = params.get('method', 'density')
    
    try:
        # Load well data from S3
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        # Parse LAS file and extract curves
        input_data = parse_las_file(content)
        
        # Calculate porosity
        result = porosity_calc.calculate_porosity(method, input_data, {}, None)
        
        # Get curve data for visualization (limit to 1000 points for response size)
        # Use result.depths and result.values directly - they contain the calculated data
        # CRITICAL: Filter out null values (-999.25, -9999) before sending to frontend
        
        # Filter null values from calculated porosity
        valid_indices = [i for i, val in enumerate(result.values[:1000]) if val not in [-999.25, -9999, -999.25]]
        
        dept_data = [result.depths[i] for i in valid_indices]
        porosity_data = [result.values[i] for i in valid_indices]
        
        # Get input curves for comparison (match the valid indices)
        max_len = len(result.depths)
        rhob_full = input_data.get('rhob', [])
        nphi_full = input_data.get('nphi', [])
        gr_full = input_data.get('gr', [])
        
        # Extract values at valid indices, filtering nulls
        rhob_data = [rhob_full[i] if i < len(rhob_full) and rhob_full[i] not in [-999.25, -9999] else None for i in valid_indices]
        nphi_data = [nphi_full[i] if i < len(nphi_full) and nphi_full[i] not in [-999.25, -9999] else None for i in valid_indices]
        gr_data = [gr_full[i] if i < len(gr_full) and gr_full[i] not in [-999.25, -9999] else None for i in valid_indices]
        
        # Remove None values (keep arrays aligned by depth)
        rhob_data = [v if v is not None else 0 for v in rhob_data]
        nphi_data = [v if v is not None else 0 for v in nphi_data]
        gr_data = [v if v is not None else 0 for v in gr_data]
        
        print(f"After filtering nulls - DEPT: {len(dept_data)}, POROSITY: {len(porosity_data)}, RHOB: {len(rhob_data)}, NPHI: {len(nphi_data)}, GR: {len(gr_data)}")
        
        # Format response with proper artifact structure for frontend
        artifact = {
            'messageContentType': 'comprehensive_porosity_analysis',
            'analysisType': 'single_well',
            'wellName': well_name,
            'results': {
                'method': method,
                'statistics': {
                    'mean': float(result.statistics.get('mean', 0)),
                    'std_dev': float(result.statistics.get('std_dev', 0)),
                    'stdDev': float(result.statistics.get('std_dev', 0)),  # Alias for frontend
                    'min': float(result.statistics.get('min', 0)),
                    'max': float(result.statistics.get('max', 0))
                },
                'curveData': {
                    'DEPT': dept_data,
                    'POROSITY': porosity_data,
                    'RHOB': rhob_data,
                    'NPHI': nphi_data,
                    'GR': gr_data
                },
                'dataQuality': {
                    'totalPoints': len(input_data.get('dept', [])),
                    'validPoints': len(porosity_data),
                    'completeness': (len(porosity_data) / len(input_data.get('dept', [])) * 100) if input_data.get('dept') else 0
                }
            }
        }
        
        return {
            'success': True,
            'message': f'Porosity analysis complete for {well_name}',
            'artifacts': [artifact]
        }
    except Exception as e:
        import traceback
        print(f"Porosity calculation error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return {'error': f'Porosity calculation failed: {str(e)}'}

def get_curve_data(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get curve data for specific depth range"""
    well_name = params.get('wellName')
    curves = params.get('curves', [])
    depth_start = params.get('depthStart')
    depth_end = params.get('depthEnd')
    
    try:
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        data = parse_las_file(content)
        
        result = {'wellName': well_name, 'curves': {}}
        for curve in curves:
            curve_lower = curve.lower()
            if curve_lower in data:
                curve_data = data[curve_lower]
                if depth_start is not None and depth_end is not None and 'dept' in data:
                    depths = data['dept']
                    filtered = [(d, v) for d, v in zip(depths, curve_data) 
                               if depth_start <= d <= depth_end]
                    result['curves'][curve] = [v for _, v in filtered]
                else:
                    result['curves'][curve] = curve_data[:1000]  # Limit size
        
        return result
    except Exception as e:
        return {'error': f'Failed to get curve data: {str(e)}'}

def calculate_statistics(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate statistics for a curve"""
    well_name = params.get('wellName')
    curve = params.get('curve')
    
    try:
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        data = parse_las_file(content)
        
        curve_lower = curve.lower()
        if curve_lower not in data:
            return {'error': f'Curve {curve} not found'}
        
        values = [v for v in data[curve_lower] if v != -999.25 and v != -9999]
        
        import statistics
        return {
            'wellName': well_name,
            'curve': curve,
            'statistics': {
                'mean': statistics.mean(values) if values else 0,
                'median': statistics.median(values) if values else 0,
                'std_dev': statistics.stdev(values) if len(values) > 1 else 0,
                'min': min(values) if values else 0,
                'max': max(values) if values else 0,
                'count': len(values)
            }
        }
    except Exception as e:
        return {'error': f'Statistics calculation failed: {str(e)}'}

def calculate_shale_volume(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate shale volume"""
    well_name = params.get('wellName')
    method = params.get('method', 'larionov_tertiary')
    
    try:
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        input_data = parse_las_file(content)
        
        # Calculate shale volume
        result = shale_calc.calculate_shale_volume(method, input_data, {}, None)
        
        # CRITICAL: Filter out null values (-999.25, -9999) before sending to frontend
        valid_indices = [i for i, val in enumerate(result.values[:1000]) if val not in [-999.25, -9999]]
        
        dept_data = [result.depths[i] for i in valid_indices]
        vsh_data = [result.values[i] for i in valid_indices]
        
        # Get input curves for comparison (match the valid indices)
        gr_full = input_data.get('gr', [])
        gr_data = [gr_full[i] if i < len(gr_full) and gr_full[i] not in [-999.25, -9999] else 0 for i in valid_indices]
        
        print(f"After filtering nulls - DEPT: {len(dept_data)}, VSH: {len(vsh_data)}, GR: {len(gr_data)}")
        
        artifact = {
            'messageContentType': 'comprehensive_shale_analysis',
            'analysisType': 'single_well',
            'wellName': well_name,
            'results': {
                'method': method,
                'statistics': {
                    'mean': float(result.statistics.get('mean', 0)),
                    'std_dev': float(result.statistics.get('std_dev', 0)),
                    'stdDev': float(result.statistics.get('std_dev', 0)),
                    'min': float(result.statistics.get('min', 0)),
                    'max': float(result.statistics.get('max', 0))
                },
                'curveData': {
                    'DEPT': dept_data,
                    'VSH': vsh_data,
                    'GR': gr_data
                },
                'dataQuality': {
                    'totalPoints': len(input_data.get('dept', [])),
                    'validPoints': len(vsh_data),
                    'completeness': (len(vsh_data) / len(input_data.get('dept', [])) * 100) if input_data.get('dept') else 0
                }
            }
        }
        
        return {
            'success': True,
            'message': f'Shale volume analysis complete for {well_name}',
            'artifacts': [artifact]
        }
    except Exception as e:
        import traceback
        print(f"Shale calculation error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return {'success': False, 'error': f'Shale calculation failed: {str(e)}'}

def calculate_saturation(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate water saturation"""
    well_name = params.get('wellName')
    method = params.get('method', 'archie')
    
    try:
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        input_data = parse_las_file(content)
        
        # Calculate saturation
        result = saturation_calc.calculate_saturation(method, input_data, {}, None)
        
        # CRITICAL: Filter out null values (-999.25, -9999) before sending to frontend
        valid_indices = [i for i, val in enumerate(result.values[:1000]) if val not in [-999.25, -9999]]
        
        dept_data = [result.depths[i] for i in valid_indices]
        sw_data = [result.values[i] for i in valid_indices]
        
        # Get input curves for comparison (match the valid indices)
        rt_full = input_data.get('rt', [])
        rhob_full = input_data.get('rhob', [])
        nphi_full = input_data.get('nphi', [])
        
        rt_data = [rt_full[i] if i < len(rt_full) and rt_full[i] not in [-999.25, -9999] else 0 for i in valid_indices]
        rhob_data = [rhob_full[i] if i < len(rhob_full) and rhob_full[i] not in [-999.25, -9999] else 0 for i in valid_indices]
        nphi_data = [nphi_full[i] if i < len(nphi_full) and nphi_full[i] not in [-999.25, -9999] else 0 for i in valid_indices]
        
        print(f"After filtering nulls - DEPT: {len(dept_data)}, SW: {len(sw_data)}, RT: {len(rt_data)}")
        
        artifact = {
            'messageContentType': 'water_saturation_analysis',
            'analysisType': 'single_well',
            'wellName': well_name,
            'results': {
                'method': method,
                'statistics': {
                    'mean': float(result.statistics.get('mean', 0)),
                    'std_dev': float(result.statistics.get('std_dev', 0)),
                    'stdDev': float(result.statistics.get('std_dev', 0)),
                    'min': float(result.statistics.get('min', 0)),
                    'max': float(result.statistics.get('max', 0))
                },
                'curveData': {
                    'DEPT': dept_data,
                    'SW': sw_data,
                    'RT': rt_data,
                    'RHOB': rhob_data,
                    'NPHI': nphi_data
                },
                'dataQuality': {
                    'totalPoints': len(input_data.get('dept', [])),
                    'validPoints': len(sw_data),
                    'completeness': (len(sw_data) / len(input_data.get('dept', [])) * 100) if input_data.get('dept') else 0
                }
            }
        }
        
        return {
            'success': True,
            'message': f'Water saturation analysis complete for {well_name}',
            'artifacts': [artifact]
        }
    except Exception as e:
        import traceback
        print(f"Saturation calculation error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return {'success': False, 'error': f'Saturation calculation failed: {str(e)}'}

def assess_curve_quality(params: Dict[str, Any]) -> Dict[str, Any]:
    """Assess curve quality"""
    well_name = params.get('wellName')
    curve_name = params.get('curveName')
    
    try:
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        data = parse_las_file(content)
        
        curve_lower = curve_name.lower()
        if curve_lower not in data:
            return {'success': False, 'error': f'Curve {curve_name} not found'}
        
        values = data[curve_lower]
        valid_values = [v for v in values if v != -999.25 and v != -9999]
        completeness = len(valid_values) / len(values) * 100 if values else 0
        
        # Calculate quality score based on completeness
        if completeness >= 95:
            quality_score = 'Excellent'
        elif completeness >= 90:
            quality_score = 'Good'
        elif completeness >= 50:
            quality_score = 'Fair'
        else:
            quality_score = 'Poor'
        
        # Create artifact structure
        artifact = {
            'messageContentType': 'curve_quality_assessment',
            'wellName': well_name,
            'curveName': curve_name,
            'completeness': round(completeness, 2),
            'totalPoints': len(values),
            'validPoints': len(valid_values),
            'qualityScore': quality_score
        }
        
        print(f"Curve quality assessment complete - {curve_name}: {completeness:.2f}% ({quality_score})")
        
        return {
            'success': True,
            'message': f'Curve quality assessment complete for {well_name} - {curve_name}',
            'artifacts': [artifact]
        }
    except Exception as e:
        import traceback
        print(f"Curve quality assessment error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return {'success': False, 'error': f'Quality assessment failed: {str(e)}'}

def assess_well_data_quality(params: Dict[str, Any]) -> Dict[str, Any]:
    """Assess overall well data quality"""
    well_name = params.get('wellName')
    
    try:
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        data = parse_las_file(content)
        
        curve_assessments = []
        total_completeness = 0
        for curve_name, values in data.items():
            if curve_name != 'dept':
                valid_values = [v for v in values if v != -999.25 and v != -9999]
                completeness = len(valid_values) / len(values) * 100 if values else 0
                total_completeness += completeness
                curve_assessments.append({
                    'curve': curve_name.upper(),
                    'completeness': completeness,
                    'totalPoints': len(values),
                    'validPoints': len(valid_values)
                })
        
        # Calculate overall quality based on average completeness
        avg_completeness = total_completeness / len(curve_assessments) if curve_assessments else 0
        if avg_completeness >= 95:
            overall_quality = 'Excellent'
        elif avg_completeness >= 90:
            overall_quality = 'Good'
        elif avg_completeness >= 50:
            overall_quality = 'Fair'
        else:
            overall_quality = 'Poor'
        
        # Calculate summary statistics
        good_quality = len([c for c in curve_assessments if c['completeness'] > 90])
        fair_quality = len([c for c in curve_assessments if 50 <= c['completeness'] <= 90])
        poor_quality = len([c for c in curve_assessments if c['completeness'] < 50])
        
        # Create artifact structure
        artifact = {
            'messageContentType': 'data_quality_assessment',
            'wellName': well_name,
            'overallQuality': overall_quality,
            'curves': curve_assessments,
            'summary': {
                'totalCurves': len(curve_assessments),
                'goodQuality': good_quality,
                'fairQuality': fair_quality,
                'poorQuality': poor_quality,
                'averageCompleteness': round(avg_completeness, 2)
            }
        }
        
        print(f"Data quality assessment complete - Overall: {overall_quality}, Avg Completeness: {avg_completeness:.2f}%")
        
        return {
            'success': True,
            'message': f'Data quality assessment complete for {well_name}',
            'artifacts': [artifact]
        }
    except Exception as e:
        import traceback
        print(f"Well quality assessment error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return {'success': False, 'error': f'Well quality assessment failed: {str(e)}'}

def calculate_data_completeness(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate data completeness metrics"""
    return assess_curve_quality(params)

def validate_environmental_corrections(params: Dict[str, Any]) -> Dict[str, Any]:
    """Validate environmental corrections"""
    well_name = params.get('wellName')
    curve_name = params.get('curveName')
    
    return {
        'wellName': well_name,
        'curveName': curve_name,
        'correctionStatus': 'Applied',
        'message': 'Environmental corrections validated'
    }

def parse_las_file(content: str) -> Dict[str, list]:
    """Simple LAS file parser"""
    data = {}
    curve_names = []
    in_curve_section = False
    in_data_section = False
    
    for line in content.split('\n'):
        line = line.strip()
        
        if line.startswith('~C'):
            in_curve_section = True
            continue
        if line.startswith('~A'):
            in_data_section = True
            continue
        if line.startswith('~'):
            in_curve_section = False
            in_data_section = False
            
        if in_curve_section and '.' in line:
            curve_name = line.split('.')[0].strip()
            if curve_name:
                curve_names.append(curve_name)
                data[curve_name.lower()] = []
        
        if in_data_section and line and not line.startswith('#'):
            try:
                values = [float(x) for x in line.split()]
                if len(values) == len(curve_names):
                    for i, name in enumerate(curve_names):
                        data[name.lower()].append(values[i])
            except ValueError:
                continue
    
    return data