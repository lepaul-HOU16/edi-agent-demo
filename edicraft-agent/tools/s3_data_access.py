"""
S3 Data Access Layer for EDIcraft Demo Enhancements

This module provides access to well trajectory data stored in S3 buckets,
supporting collection-based visualization workflows.
"""

import os
import json
import csv
import io
import boto3
from typing import Dict, List, Any, Optional, Tuple
from botocore.exceptions import ClientError, NoCredentialsError


class S3WellDataAccess:
    """
    Access well trajectory data from S3 buckets.
    
    This class provides methods to:
    - Fetch trajectory data from S3 using s3_key
    - Parse JSON, CSV, and LAS trajectory files
    - List wells in a collection
    - Cache data to reduce S3 API calls
    """
    
    def __init__(self, bucket_name: Optional[str] = None):
        """
        Initialize S3 data access client.
        
        Args:
            bucket_name: S3 bucket name. If None, uses RENEWABLE_S3_BUCKET env var
        """
        self.bucket_name = bucket_name or os.getenv('RENEWABLE_S3_BUCKET', '')
        
        if not self.bucket_name:
            raise ValueError(
                "S3 bucket name must be provided or set via RENEWABLE_S3_BUCKET environment variable"
            )
        
        # Initialize S3 client
        try:
            self.s3_client = boto3.client('s3')
        except Exception as e:
            raise RuntimeError(f"Failed to initialize S3 client: {str(e)}")
        
        # Initialize data cache
        self._trajectory_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_enabled = True
    
    def enable_cache(self, enabled: bool = True):
        """Enable or disable data caching."""
        self._cache_enabled = enabled
        if not enabled:
            self._trajectory_cache.clear()
    
    def clear_cache(self):
        """Clear all cached trajectory data."""
        self._trajectory_cache.clear()
    
    def _get_from_cache(self, s3_key: str) -> Optional[Dict[str, Any]]:
        """Get trajectory data from cache if available."""
        if not self._cache_enabled:
            return None
        return self._trajectory_cache.get(s3_key)
    
    def _add_to_cache(self, s3_key: str, data: Dict[str, Any]):
        """Add trajectory data to cache."""
        if self._cache_enabled:
            self._trajectory_cache[s3_key] = data

    
    def get_trajectory_data(self, s3_key: str) -> Dict[str, Any]:
        """
        Fetch trajectory data from S3 using s3_key.
        
        Supports JSON and CSV trajectory files. Returns standardized coordinate format.
        Uses caching to reduce S3 API calls for repeated access.
        
        Args:
            s3_key: S3 object key for the trajectory file
        
        Returns:
            Dictionary with:
                - success: Boolean indicating if data was fetched successfully
                - data_type: "coordinates" | "survey" | "unknown"
                - coordinates: List of coordinate dicts (if coordinate format)
                - survey_data: List of survey point dicts (if survey format)
                - metadata: Additional information about the data
                - error: Error message if failed, None otherwise
        
        Example return format:
            {
                "success": True,
                "data_type": "coordinates",
                "coordinates": [
                    {"x": 1.0, "y": 2.0, "z": 3.0},
                    {"x": 1.1, "y": 2.1, "z": 3.1}
                ],
                "survey_data": None,
                "metadata": {
                    "s3_key": "wells/well-007/trajectory.json",
                    "total_points": 107,
                    "file_format": "json",
                    "cached": False
                },
                "error": None
            }
        """
        # Check cache first
        cached_data = self._get_from_cache(s3_key)
        if cached_data:
            cached_data['metadata']['cached'] = True
            return cached_data
        
        try:
            # Fetch file from S3
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            file_content = response['Body'].read().decode('utf-8')
            file_size = len(file_content)
            
            # Determine file format from extension
            file_format = self._detect_file_format(s3_key, file_content)
            
            # Parse based on format
            if file_format == 'json':
                result = self._parse_json_trajectory(file_content, s3_key)
            elif file_format == 'csv':
                result = self._parse_csv_trajectory(file_content, s3_key)
            elif file_format == 'las':
                result = self.parse_las_file(s3_key)
            else:
                result = {
                    "success": False,
                    "data_type": "unknown",
                    "coordinates": None,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": file_format,
                        "file_size": file_size,
                        "cached": False
                    },
                    "error": f"Unsupported file format: {file_format}"
                }
            
            # Add to cache if successful
            if result.get('success'):
                self._add_to_cache(s3_key, result)
            
            return result
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            
            if error_code == 'NoSuchKey':
                error_msg = f"File not found in S3: {s3_key}"
            elif error_code == 'AccessDenied':
                error_msg = f"Access denied to S3 file: {s3_key}. Check IAM permissions."
            else:
                error_msg = f"S3 error ({error_code}): {str(e)}"
            
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "cached": False
                },
                "error": error_msg
            }
        
        except NoCredentialsError:
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "cached": False
                },
                "error": "AWS credentials not found. Configure AWS credentials."
            }
        
        except Exception as e:
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "cached": False
                },
                "error": f"Unexpected error fetching trajectory data: {str(e)}"
            }
    
    def _detect_file_format(self, s3_key: str, content: str) -> str:
        """Detect file format from extension and content."""
        s3_key_lower = s3_key.lower()
        
        if s3_key_lower.endswith('.json'):
            return 'json'
        elif s3_key_lower.endswith('.csv'):
            return 'csv'
        elif s3_key_lower.endswith('.las'):
            return 'las'
        
        # Try to detect from content
        content_start = content[:100].strip()
        
        if content_start.startswith('{') or content_start.startswith('['):
            return 'json'
        elif '~Version' in content or '~Well' in content:
            return 'las'
        elif ',' in content_start:
            return 'csv'
        
        return 'unknown'
    
    def _parse_json_trajectory(self, content: str, s3_key: str) -> Dict[str, Any]:
        """Parse JSON trajectory file."""
        try:
            data = json.loads(content)
            
            # Check for coordinates format
            if isinstance(data, list):
                # Direct array of coordinates
                coordinates = data
                data_type = "coordinates"
                survey_data = None
            elif isinstance(data, dict):
                if "coordinates" in data:
                    coordinates = data["coordinates"]
                    data_type = "coordinates"
                    survey_data = None
                elif "survey_data" in data:
                    coordinates = None
                    data_type = "survey"
                    survey_data = data["survey_data"]
                else:
                    # Try to infer from keys
                    if any(key in data for key in ["x", "y", "z"]):
                        coordinates = [data]
                        data_type = "coordinates"
                        survey_data = None
                    else:
                        return {
                            "success": False,
                            "data_type": "unknown",
                            "coordinates": None,
                            "survey_data": None,
                            "metadata": {
                                "s3_key": s3_key,
                                "file_format": "json",
                                "cached": False
                            },
                            "error": "JSON format not recognized. Expected 'coordinates' or 'survey_data' field."
                        }
            else:
                return {
                    "success": False,
                    "data_type": "unknown",
                    "coordinates": None,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "json",
                        "cached": False
                    },
                    "error": "JSON must be an array or object with trajectory data."
                }
            
            # Validate data structure
            if data_type == "coordinates" and coordinates:
                # Ensure all coordinates have x, y, z
                for i, coord in enumerate(coordinates):
                    if not isinstance(coord, dict) or not all(k in coord for k in ["x", "y", "z"]):
                        return {
                            "success": False,
                            "data_type": "coordinates",
                            "coordinates": None,
                            "survey_data": None,
                            "metadata": {
                                "s3_key": s3_key,
                                "file_format": "json",
                                "total_points": len(coordinates),
                                "cached": False
                            },
                            "error": f"Coordinate at index {i} missing required fields (x, y, z)"
                        }
            
            elif data_type == "survey" and survey_data:
                # Ensure all survey points have required fields
                for i, point in enumerate(survey_data):
                    if not isinstance(point, dict) or not all(k in point for k in ["tvd", "azimuth", "inclination"]):
                        return {
                            "success": False,
                            "data_type": "survey",
                            "coordinates": None,
                            "survey_data": None,
                            "metadata": {
                                "s3_key": s3_key,
                                "file_format": "json",
                                "total_points": len(survey_data),
                                "cached": False
                            },
                            "error": f"Survey point at index {i} missing required fields (tvd, azimuth, inclination)"
                        }
            
            total_points = len(coordinates) if coordinates else len(survey_data) if survey_data else 0
            
            return {
                "success": True,
                "data_type": data_type,
                "coordinates": coordinates,
                "survey_data": survey_data,
                "metadata": {
                    "s3_key": s3_key,
                    "file_format": "json",
                    "total_points": total_points,
                    "cached": False
                },
                "error": None
            }
            
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "file_format": "json",
                    "cached": False
                },
                "error": f"JSON parsing failed: {str(e)}"
            }
    
    def _parse_csv_trajectory(self, content: str, s3_key: str) -> Dict[str, Any]:
        """Parse CSV trajectory file."""
        try:
            reader = csv.DictReader(io.StringIO(content))
            rows = list(reader)
            
            if not rows:
                return {
                    "success": False,
                    "data_type": "unknown",
                    "coordinates": None,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "csv",
                        "cached": False
                    },
                    "error": "CSV file is empty"
                }
            
            # Detect format from headers
            headers = set(k.lower() for k in rows[0].keys())
            
            # Check for coordinate format (x, y, z)
            if all(h in headers for h in ['x', 'y', 'z']):
                coordinates = []
                for i, row in enumerate(rows):
                    try:
                        coordinates.append({
                            "x": float(row.get('x', row.get('X', 0))),
                            "y": float(row.get('y', row.get('Y', 0))),
                            "z": float(row.get('z', row.get('Z', 0)))
                        })
                    except (ValueError, TypeError) as e:
                        return {
                            "success": False,
                            "data_type": "coordinates",
                            "coordinates": None,
                            "survey_data": None,
                            "metadata": {
                                "s3_key": s3_key,
                                "file_format": "csv",
                                "cached": False
                            },
                            "error": f"Invalid coordinate values at row {i}: {str(e)}"
                        }
                
                return {
                    "success": True,
                    "data_type": "coordinates",
                    "coordinates": coordinates,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "csv",
                        "total_points": len(coordinates),
                        "cached": False
                    },
                    "error": None
                }
            
            # Check for survey format (tvd, azimuth, inclination)
            elif all(h in headers for h in ['tvd', 'azimuth', 'inclination']):
                survey_data = []
                for i, row in enumerate(rows):
                    try:
                        survey_data.append({
                            "tvd": float(row.get('tvd', row.get('TVD', 0))),
                            "azimuth": float(row.get('azimuth', row.get('Azimuth', 0))),
                            "inclination": float(row.get('inclination', row.get('Inclination', 0))),
                            "measured_depth": float(row.get('measured_depth', row.get('MeasuredDepth', 0)))
                        })
                    except (ValueError, TypeError) as e:
                        return {
                            "success": False,
                            "data_type": "survey",
                            "coordinates": None,
                            "survey_data": None,
                            "metadata": {
                                "s3_key": s3_key,
                                "file_format": "csv",
                                "cached": False
                            },
                            "error": f"Invalid survey values at row {i}: {str(e)}"
                        }
                
                return {
                    "success": True,
                    "data_type": "survey",
                    "coordinates": None,
                    "survey_data": survey_data,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "csv",
                        "total_points": len(survey_data),
                        "cached": False
                    },
                    "error": None
                }
            
            else:
                return {
                    "success": False,
                    "data_type": "unknown",
                    "coordinates": None,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "csv",
                        "headers": list(headers),
                        "cached": False
                    },
                    "error": f"CSV format not recognized. Expected headers: (x,y,z) or (tvd,azimuth,inclination). Found: {list(headers)}"
                }
            
        except Exception as e:
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "file_format": "csv",
                    "cached": False
                },
                "error": f"CSV parsing failed: {str(e)}"
            }

    
    def parse_las_file(self, s3_key: str) -> Dict[str, Any]:
        """
        Parse LAS file format from S3 and extract trajectory data.
        
        LAS (Log ASCII Standard) files contain well log data in a structured format.
        This method extracts trajectory-related data from LAS sections.
        
        Args:
            s3_key: S3 object key for the LAS file
        
        Returns:
            Dictionary with parsed trajectory data in standardized format
        
        LAS File Structure:
            ~Version Information
            ~Well Information
            ~Curve Information
            ~Parameter Information
            ~ASCII Log Data (actual data values)
        """
        try:
            # Fetch LAS file from S3
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            content = response['Body'].read().decode('utf-8', errors='ignore')
            lines = content.split('\n')
            
            # Parse LAS sections
            current_section = None
            curve_names = []
            curve_units = []
            data_lines = []
            well_info = {}
            
            for line in lines:
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                
                # Detect section headers
                if line.startswith('~'):
                    section_name = line[1:].split()[0].upper()
                    current_section = section_name
                    continue
                
                # Parse based on current section
                if current_section == 'WELL':
                    # Extract well information
                    if '.' in line and ':' in line:
                        parts = line.split('.')
                        if len(parts) >= 2:
                            mnemonic = parts[0].strip()
                            rest = parts[1].split(':')
                            if len(rest) >= 2:
                                value = rest[0].strip()
                                well_info[mnemonic] = value
                
                elif current_section == 'CURVE' or current_section == 'CURVES':
                    # Extract curve names and units
                    if '.' in line:
                        parts = line.split('.')
                        if len(parts) >= 2:
                            mnemonic = parts[0].strip()
                            rest = parts[1].split()
                            unit = rest[0] if rest else ''
                            curve_names.append(mnemonic)
                            curve_units.append(unit)
                
                elif current_section == 'A' or current_section == 'ASCII':
                    # Data section - collect data lines
                    if not line.startswith('~'):
                        data_lines.append(line)
            
            if not curve_names or not data_lines:
                return {
                    "success": False,
                    "data_type": "unknown",
                    "coordinates": None,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "las",
                        "cached": False
                    },
                    "error": "No curve data found in LAS file"
                }
            
            # Parse data lines
            parsed_data = []
            for line in data_lines:
                values = line.split()
                if len(values) == len(curve_names):
                    try:
                        row = {
                            curve_names[i]: float(values[i]) 
                            for i in range(len(curve_names))
                        }
                        parsed_data.append(row)
                    except ValueError:
                        # Skip lines with non-numeric values
                        continue
            
            if not parsed_data:
                return {
                    "success": False,
                    "data_type": "unknown",
                    "coordinates": None,
                    "survey_data": None,
                    "metadata": {
                        "s3_key": s3_key,
                        "file_format": "las",
                        "curve_names": curve_names,
                        "cached": False
                    },
                    "error": "No valid numeric data found in LAS file"
                }
            
            # Try to extract trajectory data from curves
            # Look for common trajectory curve names
            curve_names_lower = [c.lower() for c in curve_names]
            
            # Check for coordinate format (X, Y, Z or similar)
            x_idx = self._find_curve_index(curve_names_lower, ['x', 'easting', 'east'])
            y_idx = self._find_curve_index(curve_names_lower, ['y', 'northing', 'north'])
            z_idx = self._find_curve_index(curve_names_lower, ['z', 'tvd', 'depth', 'md'])
            
            if x_idx is not None and y_idx is not None and z_idx is not None:
                # Extract coordinates
                coordinates = []
                for row in parsed_data:
                    x_val = row.get(curve_names[x_idx])
                    y_val = row.get(curve_names[y_idx])
                    z_val = row.get(curve_names[z_idx])
                    
                    if x_val is not None and y_val is not None and z_val is not None:
                        # Filter out null values (common in LAS: -999.25, -9999)
                        if x_val > -999 and y_val > -999 and z_val > -999:
                            coordinates.append({
                                "x": float(x_val),
                                "y": float(y_val),
                                "z": float(z_val)
                            })
                
                if coordinates:
                    return {
                        "success": True,
                        "data_type": "coordinates",
                        "coordinates": coordinates,
                        "survey_data": None,
                        "metadata": {
                            "s3_key": s3_key,
                            "file_format": "las",
                            "total_points": len(coordinates),
                            "curve_names": curve_names,
                            "well_info": well_info,
                            "cached": False
                        },
                        "error": None
                    }
            
            # Check for survey format (TVD, AZIM, INCL or similar)
            tvd_idx = self._find_curve_index(curve_names_lower, ['tvd', 'tvdss', 'true_vertical_depth'])
            azim_idx = self._find_curve_index(curve_names_lower, ['azim', 'azimuth', 'azi'])
            incl_idx = self._find_curve_index(curve_names_lower, ['incl', 'inclination', 'inc', 'devi'])
            md_idx = self._find_curve_index(curve_names_lower, ['md', 'measured_depth', 'dept', 'depth'])
            
            if tvd_idx is not None and azim_idx is not None and incl_idx is not None:
                # Extract survey data
                survey_data = []
                for row in parsed_data:
                    tvd_val = row.get(curve_names[tvd_idx])
                    azim_val = row.get(curve_names[azim_idx])
                    incl_val = row.get(curve_names[incl_idx])
                    md_val = row.get(curve_names[md_idx]) if md_idx is not None else 0
                    
                    if tvd_val is not None and azim_val is not None and incl_val is not None:
                        # Filter out null values
                        if tvd_val > -999 and azim_val > -999 and incl_val > -999:
                            survey_data.append({
                                "tvd": float(tvd_val),
                                "azimuth": float(azim_val),
                                "inclination": float(incl_val),
                                "measured_depth": float(md_val) if md_val is not None else 0
                            })
                
                if survey_data:
                    return {
                        "success": True,
                        "data_type": "survey",
                        "coordinates": None,
                        "survey_data": survey_data,
                        "metadata": {
                            "s3_key": s3_key,
                            "file_format": "las",
                            "total_points": len(survey_data),
                            "curve_names": curve_names,
                            "well_info": well_info,
                            "cached": False
                        },
                        "error": None
                    }
            
            # If no trajectory data found, return all parsed data
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "file_format": "las",
                    "curve_names": curve_names,
                    "curve_units": curve_units,
                    "well_info": well_info,
                    "total_rows": len(parsed_data),
                    "cached": False
                },
                "error": "No trajectory curves found in LAS file. Available curves: " + ", ".join(curve_names)
            }
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            
            if error_code == 'NoSuchKey':
                error_msg = f"LAS file not found in S3: {s3_key}"
            elif error_code == 'AccessDenied':
                error_msg = f"Access denied to LAS file: {s3_key}. Check IAM permissions."
            else:
                error_msg = f"S3 error ({error_code}): {str(e)}"
            
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "file_format": "las",
                    "cached": False
                },
                "error": error_msg
            }
        
        except Exception as e:
            return {
                "success": False,
                "data_type": "unknown",
                "coordinates": None,
                "survey_data": None,
                "metadata": {
                    "s3_key": s3_key,
                    "file_format": "las",
                    "cached": False
                },
                "error": f"LAS parsing failed: {str(e)}"
            }
    
    def _find_curve_index(self, curve_names: List[str], possible_names: List[str]) -> Optional[int]:
        """Find index of curve matching any of the possible names."""
        for i, curve in enumerate(curve_names):
            if any(name in curve for name in possible_names):
                return i
        return None

    
    def list_collection_wells(self, collection_prefix: str) -> Dict[str, Any]:
        """
        List all well files in collection prefix.
        
        Scans S3 bucket for trajectory files under the specified collection prefix.
        Returns S3 keys for all trajectory files found.
        
        Args:
            collection_prefix: S3 prefix for the collection (e.g., "collections/collection-123/")
        
        Returns:
            Dictionary with:
                - success: Boolean indicating if listing was successful
                - wells: List of well file information dicts
                - total_wells: Count of wells found
                - error: Error message if failed, None otherwise
        
        Example return format:
            {
                "success": True,
                "wells": [
                    {
                        "s3_key": "collections/collection-123/well-001/trajectory.json",
                        "well_name": "well-001",
                        "file_name": "trajectory.json",
                        "file_size": 12345,
                        "last_modified": "2024-01-15T10:30:00Z"
                    },
                    ...
                ],
                "total_wells": 24,
                "collection_prefix": "collections/collection-123/",
                "error": None
            }
        """
        try:
            # Ensure prefix ends with /
            if not collection_prefix.endswith('/'):
                collection_prefix += '/'
            
            # List objects in S3 with the collection prefix
            paginator = self.s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(
                Bucket=self.bucket_name,
                Prefix=collection_prefix
            )
            
            wells = []
            trajectory_extensions = ['.json', '.csv', '.las']
            
            for page in pages:
                if 'Contents' not in page:
                    continue
                
                for obj in page['Contents']:
                    s3_key = obj['Key']
                    
                    # Skip if not a trajectory file
                    if not any(s3_key.lower().endswith(ext) for ext in trajectory_extensions):
                        continue
                    
                    # Skip directory markers
                    if s3_key.endswith('/'):
                        continue
                    
                    # Extract well name from path
                    # Expected format: collections/collection-123/well-001/trajectory.json
                    path_parts = s3_key.replace(collection_prefix, '').split('/')
                    well_name = path_parts[0] if path_parts else "unknown"
                    file_name = path_parts[-1] if len(path_parts) > 1 else s3_key.split('/')[-1]
                    
                    wells.append({
                        "s3_key": s3_key,
                        "well_name": well_name,
                        "file_name": file_name,
                        "file_size": obj.get('Size', 0),
                        "last_modified": obj.get('LastModified').isoformat() if obj.get('LastModified') else None
                    })
            
            # Sort wells by name for consistent ordering
            wells.sort(key=lambda w: w['well_name'])
            
            return {
                "success": True,
                "wells": wells,
                "total_wells": len(wells),
                "collection_prefix": collection_prefix,
                "error": None
            }
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            
            if error_code == 'NoSuchBucket':
                error_msg = f"S3 bucket not found: {self.bucket_name}"
            elif error_code == 'AccessDenied':
                error_msg = f"Access denied to S3 bucket: {self.bucket_name}. Check IAM permissions."
            else:
                error_msg = f"S3 error ({error_code}): {str(e)}"
            
            return {
                "success": False,
                "wells": [],
                "total_wells": 0,
                "collection_prefix": collection_prefix,
                "error": error_msg
            }
        
        except NoCredentialsError:
            return {
                "success": False,
                "wells": [],
                "total_wells": 0,
                "collection_prefix": collection_prefix,
                "error": "AWS credentials not found. Configure AWS credentials."
            }
        
        except Exception as e:
            return {
                "success": False,
                "wells": [],
                "total_wells": 0,
                "collection_prefix": collection_prefix,
                "error": f"Unexpected error listing collection wells: {str(e)}"
            }

    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the current cache.
        
        Returns:
            Dictionary with cache statistics:
                - enabled: Whether caching is enabled
                - total_entries: Number of cached trajectory files
                - cache_keys: List of S3 keys in cache
                - total_size_estimate: Estimated memory usage (rough estimate)
        """
        import sys
        
        total_size = 0
        for data in self._trajectory_cache.values():
            # Rough estimate of memory usage
            total_size += sys.getsizeof(str(data))
        
        return {
            "enabled": self._cache_enabled,
            "total_entries": len(self._trajectory_cache),
            "cache_keys": list(self._trajectory_cache.keys()),
            "total_size_estimate_bytes": total_size,
            "total_size_estimate_mb": round(total_size / (1024 * 1024), 2)
        }
    
    def preload_collection_cache(self, collection_prefix: str) -> Dict[str, Any]:
        """
        Preload all trajectory files from a collection into cache.
        
        This is useful for batch operations where multiple wells will be accessed.
        Reduces S3 API calls by fetching all data upfront.
        
        Args:
            collection_prefix: S3 prefix for the collection
        
        Returns:
            Dictionary with preload results:
                - success: Boolean indicating if preload was successful
                - loaded_count: Number of trajectories loaded into cache
                - failed_count: Number of trajectories that failed to load
                - errors: List of error messages for failed loads
        """
        # List all wells in collection
        list_result = self.list_collection_wells(collection_prefix)
        
        if not list_result['success']:
            return {
                "success": False,
                "loaded_count": 0,
                "failed_count": 0,
                "errors": [list_result['error']]
            }
        
        wells = list_result['wells']
        loaded_count = 0
        failed_count = 0
        errors = []
        
        # Load each trajectory into cache
        for well in wells:
            s3_key = well['s3_key']
            
            # Skip if already in cache
            if self._get_from_cache(s3_key):
                loaded_count += 1
                continue
            
            # Fetch and cache trajectory data
            result = self.get_trajectory_data(s3_key)
            
            if result['success']:
                loaded_count += 1
            else:
                failed_count += 1
                errors.append(f"{well['well_name']}: {result['error']}")
        
        return {
            "success": True,
            "loaded_count": loaded_count,
            "failed_count": failed_count,
            "total_wells": len(wells),
            "errors": errors if errors else None
        }

    
    def validate_s3_access(self) -> Dict[str, Any]:
        """
        Validate S3 permissions before attempting data access.
        
        Tests basic S3 operations to ensure the client has necessary permissions:
        - List objects in bucket
        - Read access to bucket
        
        Returns:
            Dictionary with validation results:
                - success: Boolean indicating if validation passed
                - bucket_name: Name of the bucket being validated
                - permissions: Dict of permission checks (list, read)
                - error: Error message if validation failed, None otherwise
                - suggestions: List of suggestions to fix permission issues
        """
        permissions = {
            "list": False,
            "read": False
        }
        suggestions = []
        
        try:
            # Test list permission
            try:
                self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    MaxKeys=1
                )
                permissions["list"] = True
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                if error_code == 'AccessDenied':
                    suggestions.append(
                        f"Add s3:ListBucket permission for bucket: {self.bucket_name}"
                    )
                elif error_code == 'NoSuchBucket':
                    return {
                        "success": False,
                        "bucket_name": self.bucket_name,
                        "permissions": permissions,
                        "error": f"S3 bucket does not exist: {self.bucket_name}",
                        "suggestions": [
                            "Verify the bucket name is correct",
                            "Check the RENEWABLE_S3_BUCKET environment variable"
                        ]
                    }
                else:
                    suggestions.append(f"S3 list error ({error_code}): {str(e)}")
            
            # Test read permission (try to read a test object or list with prefix)
            try:
                # Try to list with a prefix to test read access
                self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix='test/',
                    MaxKeys=1
                )
                permissions["read"] = True
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                if error_code == 'AccessDenied':
                    suggestions.append(
                        f"Add s3:GetObject permission for bucket: {self.bucket_name}"
                    )
                else:
                    suggestions.append(f"S3 read error ({error_code}): {str(e)}")
            
            # Check if all permissions are granted
            all_permissions_granted = all(permissions.values())
            
            if all_permissions_granted:
                return {
                    "success": True,
                    "bucket_name": self.bucket_name,
                    "permissions": permissions,
                    "error": None,
                    "suggestions": None
                }
            else:
                missing_perms = [k for k, v in permissions.items() if not v]
                return {
                    "success": False,
                    "bucket_name": self.bucket_name,
                    "permissions": permissions,
                    "error": f"Missing S3 permissions: {', '.join(missing_perms)}",
                    "suggestions": suggestions
                }
        
        except NoCredentialsError:
            return {
                "success": False,
                "bucket_name": self.bucket_name,
                "permissions": permissions,
                "error": "AWS credentials not found",
                "suggestions": [
                    "Configure AWS credentials using AWS CLI: aws configure",
                    "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables",
                    "Ensure IAM role is attached if running on AWS Lambda/EC2"
                ]
            }
        
        except Exception as e:
            return {
                "success": False,
                "bucket_name": self.bucket_name,
                "permissions": permissions,
                "error": f"Unexpected validation error: {str(e)}",
                "suggestions": [
                    "Check AWS credentials configuration",
                    "Verify network connectivity to S3",
                    "Check IAM permissions for the AWS user/role"
                ]
            }
    
    def get_fallback_options(self, error_type: str) -> List[str]:
        """
        Provide fallback options when S3 access fails.
        
        Args:
            error_type: Type of error encountered ("access_denied", "not_found", "network", etc.)
        
        Returns:
            List of fallback option descriptions
        """
        fallback_options = {
            "access_denied": [
                "Use OSDU platform to fetch trajectory data instead",
                "Request S3 bucket access from administrator",
                "Use cached data if available from previous successful access"
            ],
            "not_found": [
                "Verify the S3 key path is correct",
                "Check if the file exists in the S3 bucket using AWS Console",
                "Try listing collection wells to see available files"
            ],
            "network": [
                "Check network connectivity to AWS S3",
                "Retry the operation after a short delay",
                "Use OSDU platform as alternative data source"
            ],
            "credentials": [
                "Configure AWS credentials using 'aws configure'",
                "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables",
                "Ensure IAM role has necessary S3 permissions"
            ],
            "unknown": [
                "Check CloudWatch logs for detailed error information",
                "Verify S3 bucket configuration",
                "Contact system administrator for assistance"
            ]
        }
        
        return fallback_options.get(error_type, fallback_options["unknown"])


# Convenience function for quick access
def create_s3_data_access(bucket_name: Optional[str] = None) -> S3WellDataAccess:
    """
    Create and return an S3WellDataAccess instance.
    
    Args:
        bucket_name: Optional S3 bucket name. If None, uses RENEWABLE_S3_BUCKET env var
    
    Returns:
        Configured S3WellDataAccess instance
    """
    return S3WellDataAccess(bucket_name=bucket_name)
