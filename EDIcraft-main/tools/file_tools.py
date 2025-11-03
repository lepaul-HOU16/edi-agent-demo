#!/usr/bin/env python3
"""
File processing tools for EDIcraft Agent.
"""

import requests
import logging
from typing import Dict, List, Any, Optional
from strands import tool


class FileTools:
    """File download and processing tools."""
    
    def __init__(self, access_token: str, base_url: str, partition_id: str, max_file_size_kb: int = 2000):
        """Initialize file tools.
        
        Args:
            access_token: OSDU access token
            base_url: OSDU base URL
            partition_id: OSDU partition ID
            max_file_size_kb: Maximum file size to download in KB
        """
        self.access_token = access_token
        self.base_url = base_url
        self.partition_id = partition_id
        self.max_file_size_kb = max_file_size_kb
        self.logger = logging.getLogger(__name__)

    @tool
    def download_file(self, file_id: str, max_size_kb: int = None) -> Dict[str, Any]:
        """Download a file from OSDU using the correct File API approach.
        
        Args:
            file_id: The OSDU dataset ID to download (e.g., "osdu:dataset--File.Generic:...")
            max_size_kb: Maximum file size to download in KB (default: use instance default)
        """
        if max_size_kb is None:
            max_size_kb = self.max_file_size_kb
            
        try:
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "data-partition-id": self.partition_id
            }
            
            # Use the correct File API endpoint with dataset ID
            file_url = f"{self.base_url}/api/file/v2/files/{file_id}/downloadURL"
            response = requests.get(file_url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                
                # Look for signed URL (note: OSDU returns "SignedUrl" with capital S)
                signed_url = None
                if "SignedUrl" in result:
                    signed_url = result["SignedUrl"]
                elif "signedUrl" in result:
                    signed_url = result["signedUrl"]
                elif "downloadUrl" in result:
                    signed_url = result["downloadUrl"]
                
                if signed_url and signed_url.strip():
                    # Download the file content
                    file_response = requests.get(signed_url)
                    if file_response.status_code == 200:
                        content = file_response.text
                        
                        # Check file size
                        content_size_kb = len(content.encode('utf-8')) / 1024
                        
                        # Truncate if too large
                        if content_size_kb > max_size_kb:
                            lines = content.split('\n')
                            truncated_lines = lines[:min(50, len(lines))]
                            content = '\n'.join(truncated_lines)
                            content += f"\n\n[TRUNCATED: File too large ({content_size_kb:.1f}KB), showing first 50 lines]"
                        
                        return {
                            "status": "success",
                            "file_id": file_id,
                            "content": content,
                            "size_kb": content_size_kb,
                            "full_size_kb": len(file_response.text.encode('utf-8')) / 1024,
                            "signed_url": signed_url[:100] + "..." if len(signed_url) > 100 else signed_url,
                            "message": f"Successfully downloaded file ({content_size_kb:.1f}KB)"
                        }
                    else:
                        return {
                            "status": "error",
                            "file_id": file_id,
                            "message": f"Failed to download from signed URL: HTTP {file_response.status_code}"
                        }
                else:
                    return {
                        "status": "error",
                        "file_id": file_id,
                        "message": f"No valid signed URL in response. Response keys: {list(result.keys())}"
                    }
            else:
                return {
                    "status": "error",
                    "file_id": file_id,
                    "message": f"File API failed: HTTP {response.status_code} - {response.text}"
                }
            
        except Exception as e:
            return {
                "status": "error",
                "file_id": file_id,
                "message": f"Error downloading file: {str(e)}"
            }

    @tool
    def get_wellbore_trajectory(self, wellbore_id: str) -> Dict[str, Any]:
        """Get trajectory data for a specific wellbore.
        
        Args:
            wellbore_id: The wellbore ID to get trajectory for (e.g., "osdu:master-data--Wellbore:1014")
        """
        try:
            # First search for trajectory records for this wellbore
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "data-partition-id": self.partition_id
            }
            
            # Search for trajectories matching this wellbore
            query = {
                "kind": ["*:*:work-product-component--WellboreTrajectory:*"],
                "query": f"data.WellboreID:\"{wellbore_id}\"",
                "returnedFields": ["id", "data.WellboreID", "data.Name", "data.TopDepthMeasuredDepth", "data.BaseDepthMeasuredDepth", "data.Datasets"],
                "limit": 10
            }
            
            search_url = f"{self.base_url}/api/search/v2/query/"
            response = requests.post(search_url, headers=headers, json=query)
            
            if response.status_code == 200:
                search_result = response.json()
                trajectories = search_result.get("results", [])
                
                if not trajectories:
                    return {
                        "status": "not_found",
                        "message": f"No trajectory data found for wellbore {wellbore_id}",
                        "wellbore_id": wellbore_id
                    }
                
                # Get detailed information for the first trajectory
                trajectory_record = trajectories[0]
                trajectory_id = trajectory_record["id"]
                
                # Get full trajectory record details using storage API
                storage_url = f"{self.base_url}/api/storage/v2/records/{trajectory_id}"
                storage_response = requests.get(storage_url, headers=headers)
                
                full_trajectory = None
                if storage_response.status_code == 200:
                    full_trajectory = {
                        "status": "success",
                        "record": storage_response.json()
                    }
                else:
                    full_trajectory = {
                        "status": "error",
                        "message": f"Failed to get full trajectory record: HTTP {storage_response.status_code}"
                    }
                
                return {
                    "status": "success",
                    "wellbore_id": wellbore_id,
                    "trajectory_count": len(trajectories),
                    "trajectory_records": trajectories,
                    "detailed_trajectory": full_trajectory,
                    "message": f"Found {len(trajectories)} trajectory record(s) for wellbore {wellbore_id}"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Search failed: HTTP {response.status_code}: {response.text}",
                    "wellbore_id": wellbore_id
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error retrieving trajectory: {str(e)}",
                "wellbore_id": wellbore_id
            }

    @tool
    def get_trajectory_coordinates(self, wellbore_id: str, max_stations: int = 20) -> Dict[str, Any]:
        """Get actual X,Y,Z coordinates from a wellbore trajectory by downloading the CSV file.
        
        Args:
            wellbore_id: The wellbore ID to get coordinates for (e.g., "osdu:master-data--Wellbore:1014")
            max_stations: Maximum number of trajectory stations to return (default: 20)
        """
        try:
            # First get the trajectory metadata
            trajectory_result = self.get_wellbore_trajectory(wellbore_id)
            
            if trajectory_result.get("status") != "success":
                return trajectory_result
            
            # Extract dataset information from the trajectory
            detailed_trajectory = trajectory_result.get("detailed_trajectory", {})
            if detailed_trajectory.get("status") != "success":
                return {
                    "status": "error",
                    "message": "Could not retrieve detailed trajectory information"
                }
            
            trajectory_record = detailed_trajectory.get("record", {})
            datasets = trajectory_record.get("data", {}).get("Datasets")
            
            if not datasets or len(datasets) == 0:
                return {
                    "status": "error",
                    "message": "No dataset found in trajectory record"
                }
            
            # Get the dataset ID
            dataset_id = datasets[0]  # Take the first dataset
            
            # Download the CSV file
            download_result = self.download_file(dataset_id, max_size_kb=1000)
            
            if download_result.get("status") != "success":
                return download_result
            
            csv_content = download_result.get("content", "")
            lines = csv_content.strip().split('\n')
            
            if len(lines) < 2:
                return {
                    "status": "error",
                    "message": "CSV file appears to be empty or invalid"
                }
            
            # Parse header and data
            header = lines[0].split('\t') if '\t' in lines[0] else lines[0].split(',')
            
            # Find coordinate columns
            coord_columns = {}
            for i, col in enumerate(header):
                col_lower = col.lower()
                if 'x' in col_lower and ('surface' in col_lower or 'utm' in col_lower):
                    coord_columns['x'] = i
                elif 'y' in col_lower and ('surface' in col_lower or 'utm' in col_lower):
                    coord_columns['y'] = i
                elif 'depth' in col_lower and ('tv' in col_lower or 'true' in col_lower):
                    coord_columns['z'] = i
                elif 'ah_depth' in col_lower or 'measured' in col_lower:
                    coord_columns['md'] = i
            
            # Parse coordinate data
            coordinates = []
            for i, line in enumerate(lines[1:max_stations+1]):
                if not line.strip():
                    continue
                
                values = line.split('\t') if '\t' in line else line.split(',')
                
                try:
                    coord_point = {"station": i + 1}
                    
                    if 'x' in coord_columns:
                        coord_point['x'] = float(values[coord_columns['x']])
                    if 'y' in coord_columns:
                        coord_point['y'] = float(values[coord_columns['y']])
                    if 'z' in coord_columns:
                        coord_point['z'] = float(values[coord_columns['z']])
                    if 'md' in coord_columns:
                        coord_point['measured_depth'] = float(values[coord_columns['md']])
                    
                    coordinates.append(coord_point)
                except (ValueError, IndexError) as e:
                    continue
            
            return {
                "status": "success",
                "wellbore_id": wellbore_id,
                "total_stations": len(coordinates),
                "header_columns": header,
                "coordinate_columns": coord_columns,
                "coordinates": coordinates,
                "message": f"Successfully retrieved {len(coordinates)} coordinate points"
            }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error retrieving trajectory coordinates: {str(e)}"
            }

    def parse_csv_coordinates(self, csv_content: str, max_points: int = 100) -> Dict[str, Any]:
        """Parse coordinate data from CSV content.
        
        Args:
            csv_content: CSV file content as string
            max_points: Maximum number of coordinate points to extract
            
        Returns:
            Dictionary with parsed coordinate data
        """
        try:
            lines = csv_content.strip().split('\n')
            
            if len(lines) < 2:
                return {
                    "status": "error",
                    "message": "CSV file appears to be empty or invalid"
                }
            
            # Parse header
            header_line = lines[0].strip('"')
            headers = [h.strip('"') for h in header_line.split('","')]
            
            # Find coordinate columns
            coord_columns = {}
            for i, header in enumerate(headers):
                header_lower = header.lower()
                if 'measureddepth' in header_lower or header_lower == 'measureddepth':
                    coord_columns['md'] = i
                elif 'tvd' in header_lower:
                    coord_columns['tvd'] = i
                elif 'azimuth' in header_lower:
                    coord_columns['azimuth'] = i
                elif 'inclination' in header_lower:
                    coord_columns['inclination'] = i
                elif 'surfacex' in header_lower:
                    coord_columns['x'] = i
                elif 'surfacey' in header_lower:
                    coord_columns['y'] = i
            
            # Parse coordinate data
            coordinates = []
            for i, line in enumerate(lines[1:max_points+1]):
                if not line.strip():
                    continue
                
                # Parse CSV line
                values = [v.strip('"') for v in line.split('","')]
                
                try:
                    coord_point = {"station": i + 1}
                    
                    if 'md' in coord_columns and coord_columns['md'] < len(values):
                        coord_point['measured_depth'] = float(values[coord_columns['md']])
                    if 'tvd' in coord_columns and coord_columns['tvd'] < len(values):
                        coord_point['tvd'] = float(values[coord_columns['tvd']])
                    if 'azimuth' in coord_columns and coord_columns['azimuth'] < len(values):
                        coord_point['azimuth'] = float(values[coord_columns['azimuth']])
                    if 'inclination' in coord_columns and coord_columns['inclination'] < len(values):
                        coord_point['inclination'] = float(values[coord_columns['inclination']])
                    if 'x' in coord_columns and coord_columns['x'] < len(values):
                        x_val = values[coord_columns['x']]
                        if x_val and x_val != '':
                            coord_point['surface_x'] = float(x_val)
                    if 'y' in coord_columns and coord_columns['y'] < len(values):
                        y_val = values[coord_columns['y']]
                        if y_val and y_val != '':
                            coord_point['surface_y'] = float(y_val)
                    
                    coordinates.append(coord_point)
                except (ValueError, IndexError):
                    continue
            
            return {
                "status": "success",
                "headers": headers,
                "coordinate_columns": coord_columns,
                "coordinates": coordinates,
                "coordinate_count": len(coordinates)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error parsing CSV coordinates: {str(e)}"
            }

    def get_tools(self) -> List:
        """Get list of file processing tools for agent integration."""
        return [
            self.download_file,
            self.get_wellbore_trajectory,
            self.get_trajectory_coordinates
        ]