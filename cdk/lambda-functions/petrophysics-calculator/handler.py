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
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to fetch LAS file: {str(e)}"
            }
        
        # Parse LAS file
        las_data = parse_las_file(las_content)
        
        # Perform calculation based on tool
        if tool == 'calculate_porosity':
            method = parameters.get('method', 'density')
            
            if method == 'density':
                if 'RHOB' not in las_data['data']:
                    return {'success': False, 'error': 'RHOB curve not found in LAS file'}
                
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
                    'tool': tool,
                    'well_name': well_name,
                    'method': method,
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
                    }],
                    'message': f"Calculated porosity for {well_name} using {method} method. Mean porosity: {mean_porosity:.3f}" if valid_porosity else "No valid data"
                }
        
        elif tool == 'calculate_shale_volume':
            if 'GR' not in las_data['data']:
                return {'success': False, 'error': 'GR curve not found in LAS file'}
            
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
                'tool': tool,
                'well_name': well_name,
                'method': method,
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
                }],
                'message': f"Calculated shale volume for {well_name} using {method} method. Mean Vsh: {mean_vsh:.3f}" if valid_vsh else "No valid data"
            }
        
        elif tool == 'calculate_saturation':
            # Need porosity and resistivity
            if 'RHOB' not in las_data['data'] or 'RT' not in las_data['data']:
                return {'success': False, 'error': 'RHOB and RT curves required for saturation calculation'}
            
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
                'tool': tool,
                'well_name': well_name,
                'method': 'archie',
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
                }],
                'message': f"Calculated water saturation for {well_name} using Archie's equation. Mean Sw: {mean_sw:.3f}" if valid_sw else "No valid data"
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
        return {
            'success': False,
            'error': str(e)
        }
