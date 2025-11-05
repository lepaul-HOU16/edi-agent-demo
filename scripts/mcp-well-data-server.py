#!/usr/bin/env python3
"""
MCP Server for Well Data (.las files)
Provides structured access to well log data for Strands Agent
Enhanced with petrophysical calculation capabilities
Connects to S3 bucket for .las file storage
"""
import json
import os
import math
import pandas as pd
from typing import List, Dict, Any, Optional
from mcp.server import Server
from mcp.types import Tool, TextContent
import numpy as np
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import io
from petrophysics_calculators import (
    PorosityCalculator, 
    ShaleVolumeCalculator, 
    SaturationCalculator,
    PorosityMethod,
    ShaleVolumeMethod,
    SaturationMethod
)
from data_quality_assessment import DataQualityAssessment

# Simple LAS file parser
class LASParser:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.well_info = {}
        self.curves = {}
        self.data = None
        self._parse_file()
    
    @classmethod
    def from_string(cls, content: str, filename: str):
        """Create LASParser from string content (for S3 files)"""
        instance = cls.__new__(cls)
        instance.filepath = filename
        instance.well_info = {}
        instance.curves = {}
        instance.data = None
        instance._parse_content(content.splitlines())
        return instance
    
    def _parse_file(self):
        with open(self.filepath, 'r') as f:
            lines = f.readlines()
        self._parse_content(lines)
    
    def _parse_content(self, lines):
        section = None
        curve_names = []
        
        for line in lines:
            if isinstance(line, bytes):
                line = line.decode('utf-8')
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
                        self.well_info[key] = value
            
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
                            if self.data is None:
                                self.data = {name: [] for name in curve_names}
                            for i, name in enumerate(curve_names):
                                self.data[name].append(values[i])
                    except ValueError:
                        continue

# MCP Server
server = Server("well-data-server")

# S3 Configuration
S3_BUCKET = "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m"
S3_PREFIX = "global/well-data/"
AWS_REGION = "us-east-1"

# Load well data
WELL_DATA = {}

# Initialize AWS S3 client
s3_client = None

# Initialize calculation engines
porosity_calc = PorosityCalculator()
shale_volume_calc = ShaleVolumeCalculator()
saturation_calc = SaturationCalculator()
quality_assessment = DataQualityAssessment()

def initialize_s3_client():
    """Initialize S3 client with proper credentials"""
    global s3_client
    try:
        # Try different credential sources
        credential_sources = [
            "default",  # Default AWS credentials
            "instance",  # EC2 instance profile
            "environment"  # Environment variables
        ]
        
        for source in credential_sources:
            try:
                if source == "default":
                    s3_client = boto3.client('s3', region_name=AWS_REGION)
                elif source == "instance":
                    session = boto3.Session()
                    s3_client = session.client('s3', region_name=AWS_REGION)
                elif source == "environment":
                    # Try with explicit environment variables
                    s3_client = boto3.client(
                        's3',
                        region_name=AWS_REGION,
                        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
                        aws_session_token=os.environ.get('AWS_SESSION_TOKEN')
                    )
                
                # Test connection
                s3_client.head_bucket(Bucket=S3_BUCKET)
                print(f"✓ Successfully connected to S3 bucket: {S3_BUCKET} (using {source} credentials)")
                return True
                
            except (NoCredentialsError, ClientError):
                continue
                
        print("✗ Could not establish S3 connection with any credential source")
        return False
        
    except Exception as e:
        print(f"✗ Unexpected error initializing S3: {e}")
        return False

def load_well_data():
    """Load all .las files from S3"""
    global s3_client
    
    print(f"Attempting to load well data from S3 bucket: {S3_BUCKET}")
    
    if not initialize_s3_client():
        print("Failed to initialize S3 client. Using local fallback if available.")
        load_local_well_data()
        return
    
    try:
        # List all .las files in the S3 bucket
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=S3_PREFIX
        )
        
        if 'Contents' not in response:
            print(f"No files found in S3 bucket {S3_BUCKET} with prefix {S3_PREFIX}")
            return
        
        las_files = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.las')]
        print(f"Found {len(las_files)} .las files in S3")
        
        for s3_key in las_files:
            filename = os.path.basename(s3_key)
            well_name = filename.replace('.las', '')
            
            try:
                # Download file content from S3
                response = s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key)
                file_content = response['Body'].read().decode('utf-8')
                
                # Parse LAS content
                WELL_DATA[well_name] = LASParser.from_string(file_content, filename)
                print(f"✓ Loaded well from S3: {well_name}")
                
            except Exception as e:
                print(f"✗ Error loading {filename} from S3: {e}")
                
    except Exception as e:
        print(f"✗ Error listing S3 objects: {e}")
        load_local_well_data()

def load_local_well_data():
    """Fallback to load local .las files"""
    local_scripts_dir = "/Users/cmgabri/edi-agent-demo/scripts"
    
    if not os.path.exists(local_scripts_dir):
        print(f"Local scripts directory not found: {local_scripts_dir}")
        return
        
    print("Loading local .las files as fallback...")
    for filename in os.listdir(local_scripts_dir):
        if filename.endswith('.las'):
            filepath = os.path.join(local_scripts_dir, filename)
            well_name = filename.replace('.las', '')
            try:
                WELL_DATA[well_name] = LASParser(filepath)
                print(f"✓ Loaded local well: {well_name}")
            except Exception as e:
                print(f"✗ Error loading local {filename}: {e}")

@server.list_tools()
async def list_tools() -> List[Tool]:
    return [
        Tool(
            name="list_wells",
            description="List all available wells",
            inputSchema={
                "type": "object",
                "properties": {},
            }
        ),
        Tool(
            name="get_well_info",
            description="Get well header information",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"}
                },
                "required": ["well_name"]
            }
        ),
        Tool(
            name="get_curve_data",
            description="Get curve data for specific depth range",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "curves": {"type": "array", "items": {"type": "string"}, "description": "Curve names (e.g., GR, RHOB, NPHI)"},
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "curves"]
            }
        ),
        Tool(
            name="calculate_statistics",
            description="Calculate statistics for curves",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "curve": {"type": "string", "description": "Curve name"},
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "curve"]
            }
        ),
        Tool(
            name="calculate_porosity",
            description="Calculate porosity using various methods (density, neutron, effective, total)",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "method": {
                        "type": "string", 
                        "enum": ["density", "neutron", "effective", "total"],
                        "description": "Porosity calculation method"
                    },
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "matrix_density": {"type": "number", "description": "Matrix density (g/cc), default 2.65"},
                            "fluid_density": {"type": "number", "description": "Fluid density (g/cc), default 1.0"}
                        },
                        "description": "Optional calculation parameters"
                    },
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "method"]
            }
        ),
        Tool(
            name="calculate_shale_volume",
            description="Calculate shale volume using various methods (larionov_tertiary, larionov_pre_tertiary, linear, clavier)",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "method": {
                        "type": "string",
                        "enum": ["larionov_tertiary", "larionov_pre_tertiary", "linear", "clavier"],
                        "description": "Shale volume calculation method"
                    },
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "gr_clean": {"type": "number", "description": "Clean sand GR value (API), default 25"},
                            "gr_shale": {"type": "number", "description": "Shale GR value (API), default 150"}
                        },
                        "description": "Optional calculation parameters"
                    },
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "method"]
            }
        ),
        Tool(
            name="calculate_saturation",
            description="Calculate water saturation using various methods (archie, waxman_smits, dual_water)",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "method": {
                        "type": "string",
                        "enum": ["archie"],
                        "description": "Water saturation calculation method"
                    },
                    "porosity_method": {
                        "type": "string",
                        "enum": ["density", "neutron", "effective", "total"],
                        "description": "Porosity method to use for saturation calculation, default 'effective'"
                    },
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "rw": {"type": "number", "description": "Formation water resistivity (ohm-m), default 0.1"},
                            "a": {"type": "number", "description": "Tortuosity factor, default 1.0"},
                            "m": {"type": "number", "description": "Cementation exponent, default 2.0"},
                            "n": {"type": "number", "description": "Saturation exponent, default 2.0"},
                            "matrix_density": {"type": "number", "description": "Matrix density for porosity calc (g/cc), default 2.65"},
                            "fluid_density": {"type": "number", "description": "Fluid density for porosity calc (g/cc), default 1.0"}
                        },
                        "description": "Optional calculation parameters"
                    },
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "method"]
            }
        ),
        Tool(
            name="assess_curve_quality",
            description="Assess the quality of a specific curve including completeness, outliers, and noise",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "curve_name": {"type": "string", "description": "Name of the curve to assess (e.g., GR, RHOB, NPHI, RT)"},
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "curve_name"]
            }
        ),
        Tool(
            name="calculate_data_completeness",
            description="Calculate comprehensive data completeness metrics for a curve",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "curve_name": {"type": "string", "description": "Name of the curve to analyze"},
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "curve_name"]
            }
        ),
        Tool(
            name="validate_environmental_corrections",
            description="Validate environmental corrections for specific curves",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "curve_name": {"type": "string", "description": "Name of the curve to validate (GR, RHOB, NPHI, RT)"},
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name", "curve_name"]
            }
        ),
        Tool(
            name="assess_well_data_quality",
            description="Comprehensive quality assessment for all curves in a well",
            inputSchema={
                "type": "object",
                "properties": {
                    "well_name": {"type": "string", "description": "Name of the well"},
                    "curves": {
                        "type": "array", 
                        "items": {"type": "string"}, 
                        "description": "List of curves to assess (optional, defaults to all available)"
                    },
                    "depth_start": {"type": "number", "description": "Start depth (optional)"},
                    "depth_end": {"type": "number", "description": "End depth (optional)"}
                },
                "required": ["well_name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    # Ensure data is loaded before processing any request
    ensure_data_loaded()
    
    if name == "list_wells":
        wells = list(WELL_DATA.keys())
        return [TextContent(type="text", text=json.dumps({"wells": wells}))]
    
    elif name == "get_well_info":
        well_name = arguments["well_name"]
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        return [TextContent(type="text", text=json.dumps({
            "well_info": well.well_info,
            "available_curves": list(well.data.keys()) if well.data else []
        }))]
    
    elif name == "get_curve_data":
        well_name = arguments["well_name"]
        curves = arguments["curves"]
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data:
            return [TextContent(type="text", text=json.dumps({"error": "No data available"}))]
        
        # Filter by depth if specified
        depths = well.data.get('DEPT', [])
        result = {"depths": depths}
        
        for curve in curves:
            if curve in well.data:
                curve_data = well.data[curve]
                if depth_start is not None or depth_end is not None:
                    filtered_data = []
                    filtered_depths = []
                    for i, depth in enumerate(depths):
                        if (depth_start is None or depth >= depth_start) and \
                           (depth_end is None or depth <= depth_end):
                            filtered_data.append(curve_data[i])
                            filtered_depths.append(depth)
                    result[curve] = filtered_data
                    if curve == curves[0]:  # Update depths for first curve
                        result["depths"] = filtered_depths
                else:
                    result[curve] = curve_data
        
        return [TextContent(type="text", text=json.dumps(result))]
    
    elif name == "calculate_statistics":
        well_name = arguments["well_name"]
        curve = arguments["curve"]
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data or curve not in well.data:
            return [TextContent(type="text", text=json.dumps({"error": f"Curve {curve} not found"}))]
        
        # Filter data by depth range
        depths = well.data.get('DEPT', [])
        curve_data = well.data[curve]
        
        if depth_start is not None or depth_end is not None:
            filtered_data = []
            for i, depth in enumerate(depths):
                if (depth_start is None or depth >= depth_start) and \
                   (depth_end is None or depth <= depth_end):
                    filtered_data.append(curve_data[i])
            curve_data = filtered_data
        
        # Calculate statistics
        valid_data = [x for x in curve_data if x != -999.25]  # Remove null values
        if not valid_data:
            return [TextContent(type="text", text=json.dumps({"error": "No valid data points"}))]
        
        stats = {
            "count": len(valid_data),
            "min": min(valid_data),
            "max": max(valid_data),
            "mean": sum(valid_data) / len(valid_data),
            "median": sorted(valid_data)[len(valid_data)//2]
        }
        
        return [TextContent(type="text", text=json.dumps(stats))]
    
    elif name == "calculate_porosity":
        well_name = arguments["well_name"]
        method = arguments["method"]
        parameters = arguments.get("parameters", {})
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data:
            return [TextContent(type="text", text=json.dumps({"error": "No data available"}))]
        
        try:
            # Prepare input data
            input_data = {}
            
            # Get depth data
            if 'DEPT' in well.data:
                input_data['depth'] = well.data['DEPT']
            else:
                return [TextContent(type="text", text=json.dumps({"error": "DEPT curve not found"}))]
            
            # Get required curves based on method
            if method in ['density', 'effective']:
                if 'RHOB' not in well.data:
                    return [TextContent(type="text", text=json.dumps({"error": "RHOB curve required for density porosity"}))]
                input_data['rhob'] = well.data['RHOB']
            
            if method in ['neutron', 'effective', 'total']:
                if 'NPHI' not in well.data:
                    return [TextContent(type="text", text=json.dumps({"error": "NPHI curve required for neutron porosity"}))]
                input_data['nphi'] = well.data['NPHI']
            
            # Set depth range if specified
            depth_range = None
            if depth_start is not None and depth_end is not None:
                depth_range = (depth_start, depth_end)
            
            # Calculate porosity
            result = porosity_calc.calculate_porosity(method, input_data, parameters, depth_range)
            
            # Include raw curve data for visualization
            curve_data = {
                "DEPT": result.depths,
                "POROSITY": result.values
            }
            
            # Add input curves if available
            if 'rhob' in input_data:
                curve_data["RHOB"] = input_data['rhob'][:len(result.depths)]
            if 'nphi' in input_data:
                curve_data["NPHI"] = input_data['nphi'][:len(result.depths)]
            if 'GR' in well.data:
                curve_data["GR"] = well.data['GR'][:len(result.depths)]
            
            # Convert NaN values to None for JSON serialization
            def clean_nan(obj):
                if isinstance(obj, dict):
                    return {k: clean_nan(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [clean_nan(v) for v in obj]
                elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                    return None
                return obj
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "method": method,
                "values": result.values,
                "depths": result.depths,
                "uncertainty": result.uncertainty,
                "methodology": result.methodology,
                "parameters": result.parameters,
                "statistics": clean_nan(result.statistics),
                "quality_metrics": clean_nan(result.quality_metrics),
                "curve_data": curve_data
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Porosity calculation failed: {str(e)}"}))]
    
    elif name == "calculate_shale_volume":
        well_name = arguments["well_name"]
        method = arguments["method"]
        parameters = arguments.get("parameters", {})
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data:
            return [TextContent(type="text", text=json.dumps({"error": "No data available"}))]
        
        try:
            # Prepare input data
            input_data = {}
            
            # Get depth data
            if 'DEPT' in well.data:
                input_data['depth'] = well.data['DEPT']
            else:
                return [TextContent(type="text", text=json.dumps({"error": "DEPT curve not found"}))]
            
            # Get GR curve
            if 'GR' not in well.data:
                return [TextContent(type="text", text=json.dumps({"error": "GR curve required for shale volume calculation"}))]
            input_data['gr'] = well.data['GR']
            
            # Set depth range if specified
            depth_range = None
            if depth_start is not None and depth_end is not None:
                depth_range = (depth_start, depth_end)
            
            # Calculate shale volume
            result = shale_volume_calc.calculate_shale_volume(method, input_data, parameters, depth_range)
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "method": method,
                "values": result.values,
                "depths": result.depths,
                "uncertainty": result.uncertainty,
                "methodology": result.methodology,
                "parameters": result.parameters,
                "statistics": result.statistics,
                "quality_metrics": result.quality_metrics
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Shale volume calculation failed: {str(e)}"}))]
    
    elif name == "calculate_saturation":
        well_name = arguments["well_name"]
        method = arguments["method"]
        porosity_method = arguments.get("porosity_method", "effective")
        parameters = arguments.get("parameters", {})
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data:
            return [TextContent(type="text", text=json.dumps({"error": "No data available"}))]
        
        try:
            # Prepare input data
            input_data = {}
            
            # Get depth data
            if 'DEPT' in well.data:
                input_data['depth'] = well.data['DEPT']
            else:
                return [TextContent(type="text", text=json.dumps({"error": "DEPT curve not found"}))]
            
            # Get RT curve
            if 'RT' not in well.data:
                return [TextContent(type="text", text=json.dumps({"error": "RT curve required for saturation calculation"}))]
            input_data['rt'] = well.data['RT']
            
            # Calculate porosity first
            porosity_input = {'depth': input_data['depth']}
            
            if porosity_method in ['density', 'effective']:
                if 'RHOB' not in well.data:
                    return [TextContent(type="text", text=json.dumps({"error": "RHOB curve required for density porosity"}))]
                porosity_input['rhob'] = well.data['RHOB']
            
            if porosity_method in ['neutron', 'effective', 'total']:
                if 'NPHI' not in well.data:
                    return [TextContent(type="text", text=json.dumps({"error": "NPHI curve required for neutron porosity"}))]
                porosity_input['nphi'] = well.data['NPHI']
            
            # Set depth range if specified
            depth_range = None
            if depth_start is not None and depth_end is not None:
                depth_range = (depth_start, depth_end)
            
            # Calculate porosity
            porosity_params = {k: v for k, v in parameters.items() if k in ['matrix_density', 'fluid_density']}
            porosity_result = porosity_calc.calculate_porosity(porosity_method, porosity_input, porosity_params, depth_range)
            
            # Use calculated porosity for saturation calculation
            input_data['porosity'] = porosity_result.values
            
            # Calculate saturation
            saturation_params = {k: v for k, v in parameters.items() if k in ['rw', 'a', 'm', 'n']}
            result = saturation_calc.calculate_saturation(method, input_data, saturation_params, depth_range)
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "method": method,
                "porosity_method": porosity_method,
                "values": result.values,
                "depths": result.depths,
                "uncertainty": result.uncertainty,
                "methodology": result.methodology,
                "parameters": result.parameters,
                "statistics": result.statistics,
                "quality_metrics": result.quality_metrics,
                "porosity_values": porosity_result.values
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Saturation calculation failed: {str(e)}"}))]
    
    elif name == "assess_curve_quality":
        well_name = arguments["well_name"]
        curve_name = arguments["curve_name"]
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data or curve_name not in well.data:
            return [TextContent(type="text", text=json.dumps({"error": f"Curve {curve_name} not found in well {well_name}"}))]
        
        try:
            # Get curve data and depths
            curve_data = well.data[curve_name]
            depths = well.data.get('DEPT', list(range(len(curve_data))))
            
            # Apply depth range filter if specified
            if depth_start is not None and depth_end is not None:
                filtered_indices = [i for i, depth in enumerate(depths) 
                                  if depth_start <= depth <= depth_end]
                curve_data = [curve_data[i] for i in filtered_indices]
                depths = [depths[i] for i in filtered_indices]
            
            # Assess curve quality
            quality_result = quality_assessment.assess_curve_quality(curve_name, curve_data, depths)
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "curve_name": quality_result.curve_name,
                "quality_flag": quality_result.quality_flag.value,
                "data_completeness": quality_result.data_completeness,
                "outlier_percentage": quality_result.outlier_percentage,
                "noise_level": quality_result.noise_level,
                "environmental_corrections": quality_result.environmental_corrections,
                "validation_notes": quality_result.validation_notes,
                "statistics": quality_result.statistics
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Curve quality assessment failed: {str(e)}"}))]
    
    elif name == "calculate_data_completeness":
        well_name = arguments["well_name"]
        curve_name = arguments["curve_name"]
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data or curve_name not in well.data:
            return [TextContent(type="text", text=json.dumps({"error": f"Curve {curve_name} not found in well {well_name}"}))]
        
        try:
            # Get curve data and depths
            curve_data = well.data[curve_name]
            depths = well.data.get('DEPT', list(range(len(curve_data))))
            
            # Apply depth range filter if specified
            if depth_start is not None and depth_end is not None:
                filtered_indices = [i for i, depth in enumerate(depths) 
                                  if depth_start <= depth <= depth_end]
                curve_data = [curve_data[i] for i in filtered_indices]
                depths = [depths[i] for i in filtered_indices]
            
            # Calculate data completeness metrics
            completeness_metrics = quality_assessment.calculate_data_completeness_metrics(curve_data, depths)
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "curve_name": curve_name,
                "total_points": completeness_metrics.total_points,
                "valid_points": completeness_metrics.valid_points,
                "null_points": completeness_metrics.null_points,
                "completeness_percentage": completeness_metrics.completeness_percentage,
                "depth_coverage": completeness_metrics.depth_coverage,
                "gaps": completeness_metrics.gaps
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Data completeness calculation failed: {str(e)}"}))]
    
    elif name == "validate_environmental_corrections":
        well_name = arguments["well_name"]
        curve_name = arguments["curve_name"]
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data or curve_name not in well.data:
            return [TextContent(type="text", text=json.dumps({"error": f"Curve {curve_name} not found in well {well_name}"}))]
        
        try:
            # Get curve data and depths
            curve_data = well.data[curve_name]
            depths = well.data.get('DEPT', list(range(len(curve_data))))
            
            # Apply depth range filter if specified
            if depth_start is not None and depth_end is not None:
                filtered_indices = [i for i, depth in enumerate(depths) 
                                  if depth_start <= depth <= depth_end]
                curve_data = [curve_data[i] for i in filtered_indices]
                depths = [depths[i] for i in filtered_indices]
            
            # Validate environmental corrections
            corrections = quality_assessment.validate_environmental_corrections(
                curve_name, curve_data, depths, well.well_info
            )
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "curve_name": curve_name,
                "corrections": [
                    {
                        "correction_type": corr.correction_type,
                        "is_applied": corr.is_applied,
                        "is_valid": corr.is_valid,
                        "correction_factor": corr.correction_factor,
                        "validation_notes": corr.validation_notes
                    }
                    for corr in corrections
                ]
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Environmental correction validation failed: {str(e)}"}))]
    
    elif name == "assess_well_data_quality":
        well_name = arguments["well_name"]
        curves = arguments.get("curves")
        depth_start = arguments.get("depth_start")
        depth_end = arguments.get("depth_end")
        
        if well_name not in WELL_DATA:
            return [TextContent(type="text", text=json.dumps({"error": f"Well {well_name} not found"}))]
        
        well = WELL_DATA[well_name]
        if not well.data:
            return [TextContent(type="text", text=json.dumps({"error": "No data available"}))]
        
        try:
            # Use specified curves or all available curves
            if curves is None:
                curves = [curve for curve in well.data.keys() if curve != 'DEPT']
            
            # Get depths
            depths = well.data.get('DEPT', list(range(len(next(iter(well.data.values()))))))
            
            # Assess quality for each curve
            quality_results = []
            for curve_name in curves:
                if curve_name in well.data:
                    curve_data = well.data[curve_name]
                    
                    # Apply depth range filter if specified
                    if depth_start is not None and depth_end is not None:
                        filtered_indices = [i for i, depth in enumerate(depths) 
                                          if depth_start <= depth <= depth_end]
                        filtered_curve_data = [curve_data[i] for i in filtered_indices]
                        filtered_depths = [depths[i] for i in filtered_indices]
                    else:
                        filtered_curve_data = curve_data
                        filtered_depths = depths
                    
                    # Assess curve quality
                    quality_result = quality_assessment.assess_curve_quality(
                        curve_name, filtered_curve_data, filtered_depths
                    )
                    
                    quality_results.append({
                        "curve_name": quality_result.curve_name,
                        "quality_flag": quality_result.quality_flag.value,
                        "data_completeness": quality_result.data_completeness,
                        "outlier_percentage": quality_result.outlier_percentage,
                        "noise_level": quality_result.noise_level,
                        "environmental_corrections": quality_result.environmental_corrections,
                        "validation_notes": quality_result.validation_notes,
                        "statistics": quality_result.statistics
                    })
            
            # Calculate overall well quality summary
            if quality_results:
                avg_completeness = sum(r["data_completeness"] for r in quality_results) / len(quality_results)
                avg_outliers = sum(r["outlier_percentage"] for r in quality_results) / len(quality_results)
                avg_noise = sum(r["noise_level"] for r in quality_results) / len(quality_results)
                
                quality_flags = [r["quality_flag"] for r in quality_results]
                flag_counts = {flag: quality_flags.count(flag) for flag in set(quality_flags)}
                overall_quality = max(flag_counts, key=flag_counts.get)
            else:
                avg_completeness = 0
                avg_outliers = 0
                avg_noise = 0
                overall_quality = "poor"
            
            # Convert result to JSON-serializable format
            response = {
                "well_name": well_name,
                "overall_quality": overall_quality,
                "summary": {
                    "average_completeness": avg_completeness,
                    "average_outlier_percentage": avg_outliers,
                    "average_noise_level": avg_noise,
                    "curves_assessed": len(quality_results)
                },
                "curve_quality_results": quality_results
            }
            
            return [TextContent(type="text", text=json.dumps(response))]
            
        except Exception as e:
            return [TextContent(type="text", text=json.dumps({"error": f"Well data quality assessment failed: {str(e)}"}))]

# Initialize with empty data - load lazily when first tool is called
WELL_DATA = {}
_data_loaded = False

def ensure_data_loaded():
    """Ensure well data is loaded before processing requests"""
    global _data_loaded
    if not _data_loaded:
        print("Loading well data on first request...")
        load_well_data()
        _data_loaded = True

if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())
    
    asyncio.run(main())
