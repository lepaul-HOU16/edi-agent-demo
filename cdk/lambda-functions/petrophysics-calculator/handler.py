#!/usr/bin/env python3
"""
Petrophysics Calculator Lambda
Uses AWS Bedrock AgentCore/Strands to perform petrophysical calculations
"""
import json
import boto3
import os
from typing import Dict, Any, List, Optional

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('STORAGE_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')

def parse_las_file(content: str) -> Dict[str, Any]:
    """Simple LAS file parser"""
    lines = content.splitlines()
    well_info = {}
    curves = {}
    data = {}
    section = None
    curve_names = []
    
    for line in lines:
        line = line.strip()
        if line.startswith('~'):
            section = line[1:].split()[0].upper()
            continue
            
        if section == 'WELL':
            if '.' in line and ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].split('.')[0].strip()
                    value = parts[1].strip()
                    well_info[key] = value
        
        elif section == 'CURVE':
            if '.' in line and ':' in line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    curve_name = parts[0].split('.')[0].strip()
                    curve_names.append(curve_name)
        
        elif section == 'ASCII':
            if line and not line.startswith('#'):
                try:
                    values = [float(x) for x in line.split()]
                    if len(values) == len(curve_names):
                        for i, name in enumerate(curve_names):
                            if name not in data:
                                data[name] = []
                            data[name].append(values[i])
                except ValueError:
                    continue
    
    return {'well_info': well_info, 'curves': curve_names, 'data': data}

def calculate_porosity_density(rhob_data: List[float], matrix_density: float = 2.65, fluid_density: float = 1.0) -> List[float]:
    """Calculate porosity using density method"""
    porosity = []
    for rhob in rhob_data:
        if rhob != -999.25 and rhob != -9999:  # Filter null values
            phi = (matrix_density - rhob) / (matrix_density - fluid_density)
            phi = max(0.0, min(1.0, phi))  # Clamp between 0 and 1
            porosity.append(phi)
        else:
            porosity.append(None)
    return porosity

def calculate_shale_volume(gr_data: List[float], gr_clean: float = 25, gr_shale: float = 150, method: str = 'linear') -> List[float]:
    """Calculate shale volume using various methods"""
    vsh = []
    for gr in gr_data:
        if gr != -999.25 and gr != -9999:
            # Calculate gamma ray index
            igr = (gr - gr_clean) / (gr_shale - gr_clean)
            igr = max(0.0, min(1.0, igr))
            
            if method == 'linear':
                vsh_value = igr
            elif method == 'larionov_tertiary':
                vsh_value = 0.083 * (2 ** (3.7 * igr) - 1)
            elif method == 'larionov_pre_tertiary':
                vsh_value = 0.33 * (2 ** (2 * igr) - 1)
            elif method == 'clavier':
                vsh_value = 1.7 - (3.38 - (igr + 0.7) ** 2) ** 0.5
            else:
                vsh_value = igr
            
            vsh.append(max(0.0, min(1.0, vsh_value)))
        else:
            vsh.append(None)
    return vsh

def calculate_water_saturation(porosity: List[float], rt_data: List[float], rw: float = 0.1, a: float = 1.0, m: float = 2.0, n: float = 2.0) -> List[float]:
    """Calculate water saturation using Archie's equation"""
    sw = []
    for phi, rt in zip(porosity, rt_data):
        if phi and phi > 0 and rt and rt != -999.25 and rt != -9999:
            # Archie's equation: Sw = ((a * Rw) / (phi^m * Rt))^(1/n)
            sw_value = ((a * rw) / (phi ** m * rt)) ** (1 / n)
            sw.append(max(0.0, min(1.0, sw_value)))
        else:
            sw.append(None)
    return sw

def calculate_data_completeness_impl(curve_data: List[float]) -> Dict[str, Any]:
    """
    Calculate detailed completeness metrics for a curve
    
    Returns:
        {
            "total_points": int,
            "valid_points": int,
            "null_points": int,
            "completeness_percentage": float
        }
    """
    total_points = len(curve_data)
    null_points = sum(1 for v in curve_data if v == -999.25 or v == -9999)
    valid_points = total_points - null_points
    completeness_percentage = valid_points / total_points if total_points > 0 else 0.0
    
    return {
        "total_points": total_points,
        "valid_points": valid_points,
        "null_points": null_points,
        "completeness_percentage": completeness_percentage
    }

def assess_curve_quality_impl(curve_name: str, curve_data: List[float], depths: List[float]) -> Dict[str, Any]:
    """
    Assess quality of a single curve
    
    Returns:
        {
            "curve_name": str,
            "quality_flag": str,  # "excellent", "good", "fair", "poor"
            "data_completeness": float,  # 0.0 to 1.0
            "outlier_percentage": float,
            "noise_level": float,
            "environmental_corrections": dict,
            "validation_notes": List[str],
            "statistics": dict
        }
    """
    # Calculate completeness
    completeness_metrics = calculate_data_completeness_impl(curve_data)
    data_completeness = completeness_metrics["completeness_percentage"]
    
    # Filter valid data
    valid_data = [v for v in curve_data if v != -999.25 and v != -9999]
    
    validation_notes = []
    
    if not valid_data:
        return {
            "curve_name": curve_name,
            "quality_flag": "poor",
            "data_completeness": 0.0,
            "outlier_percentage": 0.0,
            "noise_level": 0.0,
            "environmental_corrections": {},
            "validation_notes": ["No valid data points found"],
            "statistics": {}
        }
    
    # Calculate statistics
    mean_val = sum(valid_data) / len(valid_data)
    variance = sum((x - mean_val) ** 2 for x in valid_data) / len(valid_data)
    std_dev = variance ** 0.5
    min_val = min(valid_data)
    max_val = max(valid_data)
    
    # Detect outliers using IQR method
    sorted_data = sorted(valid_data)
    q1_idx = len(sorted_data) // 4
    q3_idx = 3 * len(sorted_data) // 4
    q1 = sorted_data[q1_idx]
    q3 = sorted_data[q3_idx]
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers = [v for v in valid_data if v < lower_bound or v > upper_bound]
    outlier_percentage = len(outliers) / len(valid_data) if valid_data else 0.0
    
    # Calculate noise level (coefficient of variation)
    noise_level = std_dev / abs(mean_val) if mean_val != 0 else 0.0
    
    # Determine quality flag
    if data_completeness > 0.9 and outlier_percentage < 0.05 and noise_level < 0.1:
        quality_flag = "excellent"
    elif data_completeness > 0.8 and outlier_percentage < 0.1 and noise_level < 0.2:
        quality_flag = "good"
    elif data_completeness > 0.6 and outlier_percentage < 0.2:
        quality_flag = "fair"
    else:
        quality_flag = "poor"
    
    # Add validation notes
    if data_completeness < 0.8:
        validation_notes.append(f"Data completeness is {data_completeness:.1%}, below recommended 80%")
    if outlier_percentage > 0.1:
        validation_notes.append(f"High outlier percentage: {outlier_percentage:.1%}")
    if noise_level > 0.2:
        validation_notes.append(f"High noise level: {noise_level:.2f}")
    if not validation_notes:
        validation_notes.append("Curve quality is within acceptable ranges")
    
    # Environmental corrections info
    env_corrections = validate_environmental_corrections_impl(curve_name, valid_data)
    
    return {
        "curve_name": curve_name,
        "quality_flag": quality_flag,
        "data_completeness": data_completeness,
        "outlier_percentage": outlier_percentage,
        "noise_level": noise_level,
        "environmental_corrections": env_corrections,
        "validation_notes": validation_notes,
        "statistics": {
            "mean": mean_val,
            "min": min_val,
            "max": max_val,
            "std_dev": std_dev,
            "count": len(valid_data)
        }
    }

def validate_environmental_corrections_impl(curve_name: str, curve_data: List[float]) -> Dict[str, Any]:
    """
    Validate environmental corrections for specific curves
    
    Returns:
        {
            "curve_name": str,
            "corrections_applied": bool,
            "correction_type": str,
            "validation_status": str,
            "recommendations": List[str]
        }
    """
    recommendations = []
    corrections_applied = False
    correction_type = "unknown"
    validation_status = "not_applicable"
    
    # Check curve-specific corrections
    if curve_name == "GR":
        correction_type = "gamma_ray"
        # Check if values are in reasonable range for GR (typically 0-200 API)
        if curve_data:
            mean_val = sum(curve_data) / len(curve_data)
            if 0 <= mean_val <= 200:
                validation_status = "valid"
                corrections_applied = True
                recommendations.append("GR values are within typical range (0-200 API)")
            else:
                validation_status = "questionable"
                recommendations.append(f"GR mean value {mean_val:.1f} is outside typical range (0-200 API)")
                recommendations.append("Verify environmental corrections have been applied")
    
    elif curve_name == "RHOB":
        correction_type = "density"
        # Check if values are in reasonable range for bulk density (typically 1.5-3.0 g/cc)
        if curve_data:
            mean_val = sum(curve_data) / len(curve_data)
            if 1.5 <= mean_val <= 3.0:
                validation_status = "valid"
                corrections_applied = True
                recommendations.append("RHOB values are within typical range (1.5-3.0 g/cc)")
            else:
                validation_status = "questionable"
                recommendations.append(f"RHOB mean value {mean_val:.2f} is outside typical range (1.5-3.0 g/cc)")
                recommendations.append("Verify borehole and mudcake corrections have been applied")
    
    elif curve_name == "NPHI":
        correction_type = "neutron_porosity"
        # Check if values are in reasonable range for neutron porosity (typically 0-0.5)
        if curve_data:
            mean_val = sum(curve_data) / len(curve_data)
            if 0 <= mean_val <= 0.5:
                validation_status = "valid"
                corrections_applied = True
                recommendations.append("NPHI values are within typical range (0-0.5 v/v)")
            else:
                validation_status = "questionable"
                recommendations.append(f"NPHI mean value {mean_val:.2f} is outside typical range (0-0.5 v/v)")
                recommendations.append("Verify environmental and lithology corrections have been applied")
    
    elif curve_name == "RT":
        correction_type = "resistivity"
        # Check if values are positive (resistivity should always be positive)
        if curve_data:
            min_val = min(curve_data)
            if min_val > 0:
                validation_status = "valid"
                corrections_applied = True
                recommendations.append("RT values are positive as expected")
            else:
                validation_status = "invalid"
                recommendations.append("RT contains negative values - data quality issue")
    
    else:
        recommendations.append(f"No specific environmental correction validation for {curve_name}")
    
    return {
        "curve_name": curve_name,
        "corrections_applied": corrections_applied,
        "correction_type": correction_type,
        "validation_status": validation_status,
        "recommendations": recommendations
    }

def handler(event, context):
    """
    Lambda handler for petrophysics calculations
    
    Expected event format:
    {
        "tool": "calculate_porosity" | "calculate_shale_volume" | "calculate_saturation",
        "parameters": {
            "well_name": "WELL-001",
            "method": "density" | "neutron" | "linear" | "archie",
            ...other parameters
        }
    }
    """
    print(f"Petrophysics Calculator invoked: {json.dumps(event)}")
    
    try:
        tool = event.get('tool')
        parameters = event.get('parameters', {})
        well_name = parameters.get('well_name', parameters.get('wellName'))
        
        # list_wells doesn't require well_name
        if tool == 'list_wells':
            try:
                prefix = "global/well-data/"
                response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
                
                wells = []
                if 'Contents' in response:
                    for obj in response['Contents']:
                        key = obj['Key']
                        if key.endswith('.las'):
                            well_name_from_key = key.replace(prefix, '').replace('.las', '')
                            wells.append(well_name_from_key)
                
                return {
                    'success': True,
                    'message': f"Found {len(wells)} wells in S3",
                    'artifacts': [{
                        'messageContentType': 'well_list',
                        'analysisType': 'data_retrieval',
                        'results': {
                            'wells': wells,
                            'count': len(wells)
                        }
                    }]
                }
            except Exception as e:
                error_type = type(e).__name__
                return {
                    'success': False,
                    'error': f"Failed to list wells from S3",
                    'message': f"Unable to access S3 bucket to list wells due to {error_type}: {str(e)}",
                    'suggestion': f"Check S3 bucket permissions and verify the Lambda has ListBucket access to s3://{S3_BUCKET}/global/well-data/",
                    's3_location': f"s3://{S3_BUCKET}/global/well-data/"
                }
        
        # All other tools require well_name
        if not well_name:
            return {
                'success': False,
                'error': 'well_name is required'
            }
        
        # Fetch LAS file from S3
        las_key = f"global/well-data/{well_name}.las"
        print(f"Fetching LAS file: s3://{S3_BUCKET}/{las_key}")
        
        try:
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=las_key)
            las_content = response['Body'].read().decode('utf-8')
        except s3_client.exceptions.NoSuchKey:
            return {
                'success': False,
                'error': f"Well '{well_name}' not found in S3",
                'message': f"The well '{well_name}' does not exist in the data storage.",
                'suggestion': f"Available wells can be listed using the list_wells tool. Verify the well name is correct.",
                's3_location': f"s3://{S3_BUCKET}/{las_key}"
            }
        except Exception as e:
            error_type = type(e).__name__
            return {
                'success': False,
                'error': f"Failed to access S3 bucket",
                'message': f"Unable to fetch LAS file from S3 due to {error_type}: {str(e)}",
                'suggestion': "Check S3 bucket permissions and verify the Lambda has read access to the bucket.",
                's3_location': f"s3://{S3_BUCKET}/{las_key}"
            }
        
        # Parse LAS file
        try:
            las_data = parse_las_file(las_content)
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to parse LAS file for well '{well_name}'",
                'message': f"The LAS file could not be parsed: {str(e)}",
                'suggestion': "Verify the LAS file format is valid and follows standard LAS 2.0 specification.",
                's3_location': f"s3://{S3_BUCKET}/{las_key}"
            }
        
        # Perform calculation based on tool
        if tool == 'calculate_porosity':
            method = parameters.get('method', 'density')
            
            if method == 'density':
                if 'RHOB' not in las_data['data']:
                    return {
                        'success': False,
                        'error': f"Required curve 'RHOB' not found in well '{well_name}'",
                        'message': f"The RHOB (bulk density) curve is required for density porosity calculation but is missing from well '{well_name}'.",
                        'available_curves': las_data['curves'],
                        'suggestion': "Verify the LAS file contains RHOB curve data. Available curves are listed above."
                    }
                
                matrix_density = parameters.get('matrix_density', 2.65)
                fluid_density = parameters.get('fluid_density', 1.0)
                
                porosity = calculate_porosity_density(
                    las_data['data']['RHOB'],
                    matrix_density,
                    fluid_density
                )
                
                # Filter out None values for statistics
                valid_porosity = [p for p in porosity if p is not None]
                
                mean_porosity = sum(valid_porosity) / len(valid_porosity) if valid_porosity else 0
                
                return {
                    'success': True,
                    'message': f"Calculated porosity for {well_name} using {method} method. Mean porosity: {mean_porosity:.3f}" if valid_porosity else "No valid data",
                    'artifacts': [{
                        'messageContentType': 'comprehensive_porosity_analysis',
                        'analysisType': 'single_well',
                        'wellName': well_name,
                        'results': {
                            'method': method,
                            'curveData': {
                                'porosity': porosity[:100]  # Limit to first 100 points
                            },
                            'statistics': {
                                'mean': mean_porosity,
                                'min': min(valid_porosity) if valid_porosity else 0,
                                'max': max(valid_porosity) if valid_porosity else 0,
                                'count': len(valid_porosity),
                                'std_dev': 0  # Calculate if needed
                            },
                            'dataQuality': {
                                'completeness': len(valid_porosity) / len(porosity) if porosity else 0,
                                'validPoints': len(valid_porosity),
                                'totalPoints': len(porosity)
                            }
                        }
                    }]
                }
        
        elif tool == 'calculate_shale_volume':
            if 'GR' not in las_data['data']:
                return {
                    'success': False,
                    'error': f"Required curve 'GR' not found in well '{well_name}'",
                    'message': f"The GR (gamma ray) curve is required for shale volume calculation but is missing from well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': "Verify the LAS file contains GR curve data. Available curves are listed above."
                }
            
            method = parameters.get('method', 'linear')
            gr_clean = parameters.get('gr_clean', 25)
            gr_shale = parameters.get('gr_shale', 150)
            
            vsh = calculate_shale_volume(
                las_data['data']['GR'],
                gr_clean,
                gr_shale,
                method
            )
            
            valid_vsh = [v for v in vsh if v is not None]
            mean_vsh = sum(valid_vsh) / len(valid_vsh) if valid_vsh else 0
            
            return {
                'success': True,
                'message': f"Calculated shale volume for {well_name} using {method} method. Mean Vsh: {mean_vsh:.3f}" if valid_vsh else "No valid data",
                'artifacts': [{
                    'messageContentType': 'shale_volume_analysis',
                    'analysisType': 'single_well',
                    'wellName': well_name,
                    'results': {
                        'method': method,
                        'curveData': {
                            'shale_volume': vsh[:100]
                        },
                        'statistics': {
                            'mean': mean_vsh,
                            'min': min(valid_vsh) if valid_vsh else 0,
                            'max': max(valid_vsh) if valid_vsh else 0,
                            'count': len(valid_vsh),
                            'std_dev': 0
                        },
                        'dataQuality': {
                            'completeness': len(valid_vsh) / len(vsh) if vsh else 0,
                            'validPoints': len(valid_vsh),
                            'totalPoints': len(vsh)
                        }
                    }
                }]
            }
        
        elif tool == 'calculate_saturation':
            # Need porosity and resistivity
            missing_curves = []
            if 'RHOB' not in las_data['data']:
                missing_curves.append('RHOB (bulk density)')
            if 'RT' not in las_data['data']:
                missing_curves.append('RT (resistivity)')
            
            if missing_curves:
                return {
                    'success': False,
                    'error': f"Required curves missing from well '{well_name}': {', '.join(missing_curves)}",
                    'message': f"Water saturation calculation requires RHOB and RT curves, but the following are missing: {', '.join(missing_curves)}",
                    'available_curves': las_data['curves'],
                    'suggestion': "Verify the LAS file contains both RHOB and RT curve data. Available curves are listed above."
                }
            
            # First calculate porosity
            porosity = calculate_porosity_density(las_data['data']['RHOB'])
            
            # Then calculate saturation
            rw = parameters.get('rw', 0.1)
            a = parameters.get('a', 1.0)
            m = parameters.get('m', 2.0)
            n = parameters.get('n', 2.0)
            
            sw = calculate_water_saturation(porosity, las_data['data']['RT'], rw, a, m, n)
            
            valid_sw = [s for s in sw if s is not None]
            mean_sw = sum(valid_sw) / len(valid_sw) if valid_sw else 0
            
            return {
                'success': True,
                'message': f"Calculated water saturation for {well_name} using Archie's equation. Mean Sw: {mean_sw:.3f}" if valid_sw else "No valid data",
                'artifacts': [{
                    'messageContentType': 'water_saturation_analysis',
                    'analysisType': 'single_well',
                    'wellName': well_name,
                    'results': {
                        'method': 'archie',
                        'curveData': {
                            'water_saturation': sw[:100]
                        },
                        'statistics': {
                            'mean': mean_sw,
                            'min': min(valid_sw) if valid_sw else 0,
                            'max': max(valid_sw) if valid_sw else 0,
                            'count': len(valid_sw),
                            'std_dev': 0
                        },
                        'dataQuality': {
                            'completeness': len(valid_sw) / len(sw) if sw else 0,
                            'validPoints': len(valid_sw),
                            'totalPoints': len(sw)
                        }
                    }
                }]
            }
        
        elif tool == 'get_well_info':
            # Return well header information and available curves
            return {
                'success': True,
                'message': f"Retrieved well information for {well_name}",
                'artifacts': [{
                    'messageContentType': 'well_info',
                    'analysisType': 'data_retrieval',
                    'wellName': well_name,
                    'results': {
                        'well_info': las_data['well_info'],
                        'curves': las_data['curves'],
                        'curve_count': len(las_data['curves'])
                    }
                }]
            }
        
        elif tool == 'get_curve_data':
            # Return curve data for specified depth range
            curve_names = parameters.get('curves', parameters.get('curve_names', []))
            depth_start = parameters.get('depth_start')
            depth_end = parameters.get('depth_end')
            
            if not curve_names:
                return {
                    'success': False,
                    'error': 'curves parameter is required (list of curve names)'
                }
            
            # Check if curves exist
            missing_curves = [c for c in curve_names if c not in las_data['data']]
            if missing_curves:
                return {
                    'success': False,
                    'error': f"Required curves not found in well '{well_name}': {', '.join(missing_curves)}",
                    'message': f"The following curves are missing from well '{well_name}': {', '.join(missing_curves)}",
                    'available_curves': las_data['curves'],
                    'suggestion': f"Verify the LAS file contains the requested curves. Available curves: {', '.join(las_data['curves'])}"
                }
            
            # Get depth data
            if 'DEPT' not in las_data['data']:
                return {
                    'success': False,
                    'error': f"DEPT curve not found in well '{well_name}'",
                    'message': f"The DEPT (depth) curve is required but is missing from well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': "DEPT curve is essential for depth-based operations. Verify the LAS file contains depth data."
                }
            
            depths = las_data['data']['DEPT']
            
            # Filter by depth range if specified
            start_idx = 0
            end_idx = len(depths)
            
            if depth_start is not None:
                for i, d in enumerate(depths):
                    if d >= depth_start:
                        start_idx = i
                        break
            
            if depth_end is not None:
                for i, d in enumerate(depths):
                    if d > depth_end:
                        end_idx = i
                        break
            
            # Extract curve data
            curve_data = {}
            for curve_name in curve_names:
                curve_data[curve_name] = las_data['data'][curve_name][start_idx:end_idx]
            
            curve_data['DEPT'] = depths[start_idx:end_idx]
            
            return {
                'success': True,
                'message': f"Retrieved {len(curve_names)} curves for {well_name}",
                'artifacts': [{
                    'messageContentType': 'curve_data',
                    'analysisType': 'data_retrieval',
                    'wellName': well_name,
                    'results': {
                        'curves': curve_data,
                        'depth_range': {
                            'start': curve_data['DEPT'][0] if curve_data['DEPT'] else None,
                            'end': curve_data['DEPT'][-1] if curve_data['DEPT'] else None
                        },
                        'point_count': len(curve_data['DEPT'])
                    }
                }]
            }
        
        elif tool == 'calculate_statistics':
            # Calculate statistics for a specific curve
            curve_name = parameters.get('curve', parameters.get('curve_name'))
            depth_start = parameters.get('depth_start')
            depth_end = parameters.get('depth_end')
            
            if not curve_name:
                return {
                    'success': False,
                    'error': 'curve parameter is required'
                }
            
            if curve_name not in las_data['data']:
                return {
                    'success': False,
                    'error': f"Curve '{curve_name}' not found in well '{well_name}'",
                    'message': f"The curve '{curve_name}' does not exist in well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': f"Available curves in this well: {', '.join(las_data['curves'])}"
                }
            
            # Get curve data
            curve_data = las_data['data'][curve_name]
            
            # Filter by depth range if specified
            if depth_start is not None or depth_end is not None:
                if 'DEPT' not in las_data['data']:
                    return {
                        'success': False,
                        'error': f"DEPT curve not found in well '{well_name}'",
                        'message': f"Depth filtering requires DEPT curve, but it is missing from well '{well_name}'.",
                        'available_curves': las_data['curves'],
                        'suggestion': "Cannot filter by depth range without DEPT curve. Remove depth_start/depth_end parameters or use a well with DEPT data."
                    }
                
                depths = las_data['data']['DEPT']
                filtered_data = []
                
                for i, d in enumerate(depths):
                    if (depth_start is None or d >= depth_start) and (depth_end is None or d <= depth_end):
                        filtered_data.append(curve_data[i])
                
                curve_data = filtered_data
            
            # Filter out null values
            valid_data = [v for v in curve_data if v != -999.25 and v != -9999]
            
            if not valid_data:
                return {
                    'success': False,
                    'error': f"No valid data points found for curve '{curve_name}' in well '{well_name}'",
                    'message': f"All data points in curve '{curve_name}' are null values (no valid measurements).",
                    'suggestion': f"The curve exists but contains only null values. Check data quality or try a different depth range."
                }
            
            # Calculate statistics
            mean_val = sum(valid_data) / len(valid_data)
            sorted_data = sorted(valid_data)
            median_val = sorted_data[len(sorted_data) // 2] if len(sorted_data) % 2 == 1 else (sorted_data[len(sorted_data) // 2 - 1] + sorted_data[len(sorted_data) // 2]) / 2
            
            # Calculate standard deviation
            variance = sum((x - mean_val) ** 2 for x in valid_data) / len(valid_data)
            std_dev = variance ** 0.5
            
            return {
                'success': True,
                'message': f"Calculated statistics for {curve_name} in {well_name}",
                'artifacts': [{
                    'messageContentType': 'curve_statistics',
                    'analysisType': 'data_retrieval',
                    'wellName': well_name,
                    'results': {
                        'curve_name': curve_name,
                        'statistics': {
                            'mean': mean_val,
                            'median': median_val,
                            'min': min(valid_data),
                            'max': max(valid_data),
                            'std_dev': std_dev,
                            'count': len(valid_data),
                            'total_points': len(curve_data),
                            'completeness': len(valid_data) / len(curve_data) if curve_data else 0
                        }
                    }
                }]
            }
        
        elif tool == 'assess_well_data_quality':
            # Assess quality of all curves in the well
            depth_start = parameters.get('depth_start')
            depth_end = parameters.get('depth_end')
            
            # Get depth data
            if 'DEPT' not in las_data['data']:
                return {
                    'success': False,
                    'error': f"DEPT curve not found in well '{well_name}'",
                    'message': f"Data quality assessment requires DEPT curve, but it is missing from well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': "DEPT curve is essential for quality assessment. Verify the LAS file contains depth data."
                }
            
            depths = las_data['data']['DEPT']
            
            # Filter depth range if specified
            start_idx = 0
            end_idx = len(depths)
            
            if depth_start is not None:
                for i, d in enumerate(depths):
                    if d >= depth_start:
                        start_idx = i
                        break
            
            if depth_end is not None:
                for i, d in enumerate(depths):
                    if d > depth_end:
                        end_idx = i
                        break
            
            # Assess quality for each curve
            curve_assessments = []
            total_completeness = 0
            total_outliers = 0
            total_noise = 0
            curve_count = 0
            
            for curve_name in las_data['curves']:
                # Skip DEPT curve itself
                if curve_name == 'DEPT':
                    continue
                
                # Get curve data for the specified depth range
                curve_data = las_data['data'][curve_name][start_idx:end_idx]
                depth_subset = depths[start_idx:end_idx]
                
                # Assess curve quality
                assessment = assess_curve_quality_impl(curve_name, curve_data, depth_subset)
                curve_assessments.append(assessment)
                
                # Accumulate for overall summary
                total_completeness += assessment['data_completeness']
                total_outliers += assessment['outlier_percentage']
                total_noise += assessment['noise_level']
                curve_count += 1
            
            # Calculate overall quality summary
            if curve_count > 0:
                avg_completeness = total_completeness / curve_count
                avg_outliers = total_outliers / curve_count
                avg_noise = total_noise / curve_count
                
                # Determine overall quality
                if avg_completeness > 0.9 and avg_outliers < 0.05 and avg_noise < 0.1:
                    overall_quality = "excellent"
                elif avg_completeness > 0.8 and avg_outliers < 0.1 and avg_noise < 0.2:
                    overall_quality = "good"
                elif avg_completeness > 0.6 and avg_outliers < 0.2:
                    overall_quality = "fair"
                else:
                    overall_quality = "poor"
            else:
                avg_completeness = 0
                avg_outliers = 0
                avg_noise = 0
                overall_quality = "poor"
            
            # Build concise quality message (1-2 sentences max)
            # Detailed data is in the artifact for CloudscapeDataQualityDisplay
            message = f"Assessed data quality for {well_name}: {overall_quality} quality across {curve_count} curves."
            
            return {
                'success': True,
                'message': message,
                'artifacts': [{
                    'messageContentType': 'well_data_quality',
                    'analysisType': 'single_well',
                    'wellName': well_name,
                    'results': {
                        'well_name': well_name,
                        'overall_quality': overall_quality,
                        'summary': {
                            'average_completeness': avg_completeness,
                            'average_outliers': avg_outliers,
                            'average_noise': avg_noise,
                            'total_curves': curve_count
                        },
                        'curves': curve_assessments
                    }
                }]
            }
        
        elif tool == 'assess_curve_quality':
            # Assess quality of a specific curve
            curve_name = parameters.get('curve_name', parameters.get('curve'))
            depth_start = parameters.get('depth_start')
            depth_end = parameters.get('depth_end')
            
            if not curve_name:
                return {
                    'success': False,
                    'error': 'curve_name parameter is required'
                }
            
            # Check if curve exists
            if curve_name not in las_data['data']:
                return {
                    'success': False,
                    'error': f"Curve '{curve_name}' not found in well '{well_name}'",
                    'message': f"The curve '{curve_name}' does not exist in well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': f"Available curves in this well: {', '.join(las_data['curves'])}"
                }
            
            # Get depth data
            if 'DEPT' not in las_data['data']:
                return {
                    'success': False,
                    'error': f"DEPT curve not found in well '{well_name}'",
                    'message': f"Curve quality assessment requires DEPT curve, but it is missing from well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': "DEPT curve is essential for quality assessment. Verify the LAS file contains depth data."
                }
            
            depths = las_data['data']['DEPT']
            curve_data = las_data['data'][curve_name]
            
            # Filter by depth range if specified
            start_idx = 0
            end_idx = len(depths)
            
            if depth_start is not None:
                for i, d in enumerate(depths):
                    if d >= depth_start:
                        start_idx = i
                        break
            
            if depth_end is not None:
                for i, d in enumerate(depths):
                    if d > depth_end:
                        end_idx = i
                        break
            
            # Get curve data for the specified depth range
            curve_data_subset = curve_data[start_idx:end_idx]
            depth_subset = depths[start_idx:end_idx]
            
            # Assess curve quality using helper function
            assessment = assess_curve_quality_impl(curve_name, curve_data_subset, depth_subset)
            
            return {
                'success': True,
                'message': f"Assessed quality for curve {curve_name} in {well_name}. Quality: {assessment['quality_flag']}",
                'artifacts': [{
                    'messageContentType': 'curve_quality_assessment',
                    'analysisType': 'single_curve',
                    'wellName': well_name,
                    'results': assessment
                }]
            }
        
        elif tool == 'calculate_data_completeness':
            # Calculate detailed completeness metrics for a specific curve
            curve_name = parameters.get('curve_name', parameters.get('curve'))
            depth_start = parameters.get('depth_start')
            depth_end = parameters.get('depth_end')
            
            if not curve_name:
                return {
                    'success': False,
                    'error': 'curve_name parameter is required'
                }
            
            # Check if curve exists
            if curve_name not in las_data['data']:
                return {
                    'success': False,
                    'error': f"Curve '{curve_name}' not found in well '{well_name}'",
                    'message': f"The curve '{curve_name}' does not exist in well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': f"Available curves in this well: {', '.join(las_data['curves'])}"
                }
            
            # Get depth data
            if 'DEPT' not in las_data['data']:
                return {
                    'success': False,
                    'error': f"DEPT curve not found in well '{well_name}'",
                    'message': f"Data completeness calculation requires DEPT curve, but it is missing from well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': "DEPT curve is essential for depth-based analysis. Verify the LAS file contains depth data."
                }
            
            depths = las_data['data']['DEPT']
            curve_data = las_data['data'][curve_name]
            
            # Filter by depth range if specified
            start_idx = 0
            end_idx = len(depths)
            
            if depth_start is not None:
                for i, d in enumerate(depths):
                    if d >= depth_start:
                        start_idx = i
                        break
            
            if depth_end is not None:
                for i, d in enumerate(depths):
                    if d > depth_end:
                        end_idx = i
                        break
            
            # Get curve data for the specified depth range
            curve_data_subset = curve_data[start_idx:end_idx]
            
            # Calculate data completeness using helper function
            completeness_metrics = calculate_data_completeness_impl(curve_data_subset)
            
            return {
                'success': True,
                'message': f"Calculated data completeness for curve {curve_name} in {well_name}. Completeness: {completeness_metrics['completeness_percentage']:.1%}",
                'artifacts': [{
                    'messageContentType': 'data_completeness',
                    'analysisType': 'single_curve',
                    'wellName': well_name,
                    'results': {
                        'curve_name': curve_name,
                        'completeness_metrics': completeness_metrics
                    }
                }]
            }
        
        elif tool == 'validate_environmental_corrections':
            # Validate environmental corrections for a specific curve
            curve_name = parameters.get('curve_name', parameters.get('curve'))
            depth_start = parameters.get('depth_start')
            depth_end = parameters.get('depth_end')
            
            if not curve_name:
                return {
                    'success': False,
                    'error': 'curve_name parameter is required'
                }
            
            # Check if curve exists
            if curve_name not in las_data['data']:
                return {
                    'success': False,
                    'error': f"Curve '{curve_name}' not found in well '{well_name}'",
                    'message': f"The curve '{curve_name}' does not exist in well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': f"Available curves in this well: {', '.join(las_data['curves'])}"
                }
            
            # Get depth data
            if 'DEPT' not in las_data['data']:
                return {
                    'success': False,
                    'error': f"DEPT curve not found in well '{well_name}'",
                    'message': f"Environmental corrections validation requires DEPT curve, but it is missing from well '{well_name}'.",
                    'available_curves': las_data['curves'],
                    'suggestion': "DEPT curve is essential for depth-based analysis. Verify the LAS file contains depth data."
                }
            
            depths = las_data['data']['DEPT']
            curve_data = las_data['data'][curve_name]
            
            # Filter by depth range if specified
            start_idx = 0
            end_idx = len(depths)
            
            if depth_start is not None:
                for i, d in enumerate(depths):
                    if d >= depth_start:
                        start_idx = i
                        break
            
            if depth_end is not None:
                for i, d in enumerate(depths):
                    if d > depth_end:
                        end_idx = i
                        break
            
            # Get curve data for the specified depth range
            curve_data_subset = curve_data[start_idx:end_idx]
            
            # Filter out null values for validation
            valid_data = [v for v in curve_data_subset if v != -999.25 and v != -9999]
            
            if not valid_data:
                return {
                    'success': False,
                    'error': f"No valid data points found for curve '{curve_name}' in well '{well_name}'",
                    'message': f"All data points in curve '{curve_name}' are null values (no valid measurements).",
                    'suggestion': f"The curve exists but contains only null values. Check data quality or try a different depth range."
                }
            
            # Validate environmental corrections using helper function
            validation_result = validate_environmental_corrections_impl(curve_name, valid_data)
            
            return {
                'success': True,
                'message': f"Validated environmental corrections for curve {curve_name} in {well_name}. Status: {validation_result['validation_status']}",
                'artifacts': [{
                    'messageContentType': 'environmental_corrections_validation',
                    'analysisType': 'single_curve',
                    'wellName': well_name,
                    'results': validation_result
                }]
            }
        
        else:
            return {
                'success': False,
                'error': f"Unknown tool: {tool}"
            }
    
    except Exception as e:
        print(f"Error in petrophysics calculator: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # CRITICAL: Never return mock or fake data on errors
        # Return clear error message with no artifacts
        return {
            'success': False,
            'error': f"Unexpected error in petrophysics calculator: {str(e)}",
            'message': f"An unexpected error occurred while processing the request.",
            'suggestion': "Check CloudWatch logs for detailed error information. Verify all parameters are correct and the well data is valid."
        }
