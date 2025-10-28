import os
import boto3
import hmac
import hashlib
import base64
import requests
import json
import re
from typing import Dict, List, Any, Optional, Tuple

class OSDUClient:
    def __init__(self):
        self.username = os.getenv('EDI_USERNAME', '')
        self.password = os.getenv('EDI_PASSWORD', '')
        self.client_id = os.getenv('EDI_CLIENT_ID', '')
        self.client_secret = os.getenv('EDI_CLIENT_SECRET', '')
        self.partition = os.getenv('EDI_PARTITION', 'osdu')
        self.platform_url = os.getenv('EDI_PLATFORM_URL', '')
        self.aws_region = "us-east-1"
        self.cognito = boto3.client('cognito-idp', region_name=self.aws_region)
        self.token = None
        
    def get_access_token(self) -> Optional[str]:
        """Get access token from EDI using AWS Cognito authentication"""
        try:
            message = self.username + self.client_id
            dig = hmac.new(
                self.client_secret.encode('UTF-8'), 
                msg=message.encode('UTF-8'), 
                digestmod=hashlib.sha256
            ).digest()
            secret_hash = base64.b64encode(dig).decode()

            auth_response = self.cognito.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": self.username, 
                    "PASSWORD": self.password, 
                    "SECRET_HASH": secret_hash
                },
                ClientId=self.client_id,
            )
            
            return auth_response["AuthenticationResult"]["AccessToken"]
        except Exception as e:
            print(f"EDI Authentication error: {e}")
            return None
    
    def authenticate(self) -> bool:
        """Authenticate with OSDU platform and get access token."""
        self.token = self.get_access_token()
        return self.token is not None

    def search_trajectory_records(self) -> List[Dict]:
        """Search for wellbore trajectory records in OSDU."""
        if not self.token and not self.authenticate():
            return []
            
        try:
            search_url = f"{self.platform_url}/api/search/v2/query"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json',
                'data-partition-id': self.partition
            }
            
            query = {
                "kind": ["*:*:work-product-component--WellboreTrajectory:*"],
                "limit": 200,
                "query": "*"
            }
            
            response = requests.post(search_url, headers=headers, json=query)
            if response.status_code == 200:
                return response.json().get('results', [])
            else:
                print(f"Trajectory search failed with status {response.status_code}: {response.text}")
                return []
        except Exception as e:
            print(f"Trajectory search error: {e}")
            return []
    
    def search_wellbores(self) -> List[Dict]:
        """Search for wellbore records in OSDU."""
        if not self.token and not self.authenticate():
            return []
            
        try:
            search_url = f"{self.platform_url}/api/search/v2/query"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json',
                'data-partition-id': self.partition
            }
            
            query = {
                "kind": "osdu:wks:master-data--Wellbore:1.0.0",
                "limit": 10,
                "query": "*"
            }
            
            response = requests.post(search_url, headers=headers, json=query)
            if response.status_code == 200:
                return response.json().get('results', [])
            else:
                print(f"Search failed with status {response.status_code}: {response.text}")
                return []
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def get_record(self, record_id: str) -> Dict:
        """Get any record by ID from OSDU."""
        if not self.token and not self.authenticate():
            return {}
            
        try:
            storage_url = f"{self.platform_url}/api/storage/v2/records/{record_id}"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'data-partition-id': self.partition
            }
            
            response = requests.get(storage_url, headers=headers)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Record retrieval failed with status {response.status_code}: {response.text}")
                return {}
        except Exception as e:
            print(f"Record retrieval error: {e}")
            return {}

    def get_signed_url(self, dataset_id: str) -> Optional[str]:
        """Get signed URL for downloading file from OSDU."""
        if not self.token and not self.authenticate():
            return None
            
        try:
            file_url = f"{self.platform_url}/api/file/v2/files/{dataset_id}/downloadURL"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'data-partition-id': self.partition
            }
            
            response = requests.get(file_url, headers=headers)
            if response.status_code == 200:
                file_data = response.json()
                return file_data.get("SignedUrl") or file_data.get("signedUrl")
            return None
        except Exception as e:
            print(f"Signed URL error: {e}")
            return None

    def download_file(self, signed_url: str) -> Optional[str]:
        """Download file content from signed URL."""
        try:
            response = requests.get(signed_url)
            if response.status_code == 200:
                return response.text
            return None
        except Exception as e:
            print(f"Download error: {e}")
            return None

def parse_trajectory_coordinates(file_content: str) -> List[Tuple[float, float, float]]:
    """Parse trajectory coordinates from WITSML or LAS file content."""
    coordinates = []
    lines = file_content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('~'):
            continue
            
        # Look for CSV-style data with commas
        if ',' in line:
            parts = line.split(',')
        else:
            parts = line.split()
        
        if len(parts) >= 3:
            try:
                # Try to extract numeric values
                nums = []
                for part in parts:
                    try:
                        nums.append(float(part.strip()))
                    except ValueError:
                        continue
                
                if len(nums) >= 3:
                    coordinates.append((nums[0], nums[1], nums[2]))
                    
            except Exception:
                continue
    
    return coordinates

def search_all_trajectories_for_files() -> str:
    """Search through all trajectory records to find ones with downloadable files."""
    client = OSDUClient()
    
    if not client.authenticate():
        return "Authentication failed. Check EDI credentials and AWS configuration."
    
    # Search for trajectory records
    trajectories = client.search_trajectory_records()
    
    if not trajectories:
        return "No trajectory records found."
    
    result = f"Searching {len(trajectories)} trajectory records for downloadable files...\n\n"
    found_files = 0
    
    for i, traj in enumerate(trajectories):
        traj_id = traj.get('id', 'Unknown')
        traj_data = traj.get('data', {})
        wellbore_id = traj_data.get('WellboreID', 'Unknown')
        datasets = traj_data.get('Datasets', [])
        
        if datasets:
            result += f"{i+1}. Trajectory {traj_id[-8:]}... (Wellbore: {wellbore_id}) - {len(datasets)} datasets\n"
            
            # Try to download first dataset
            for dataset_id in datasets[:1]:
                signed_url = client.get_signed_url(dataset_id)
                if signed_url:
                    file_content = client.download_file(signed_url)
                    if file_content:
                        coordinates = parse_trajectory_coordinates(file_content)
                        if coordinates:
                            found_files += 1
                            result += f"   ✅ SUCCESS! Downloaded {len(file_content)} chars, parsed {len(coordinates)} coordinates\n"
                            # Show first few coordinates
                            for j, (x, y, z) in enumerate(coordinates[:3]):
                                result += f"      Point {j+1}: X={x:.2f}, Y={y:.2f}, Z={z:.2f}\n"
                            break
                        else:
                            result += f"   ❌ File downloaded but no coordinates parsed\n"
                    else:
                        result += f"   ❌ Signed URL found but download failed\n"
                else:
                    result += f"   ❌ No signed URL available\n"
        else:
            result += f"{i+1}. Trajectory {traj_id[-8:]}... (Wellbore: {wellbore_id}) - No datasets\n"
    
    result += f"\n📊 Summary: Found {found_files} trajectories with downloadable coordinate files out of {len(trajectories)} total trajectories."
    return result

def search_wellbores_live() -> str:
    """Search for wellbore trajectories using live OSDU connection."""
    return search_all_trajectories_for_files()

def get_trajectory_coordinates_live(trajectory_id: str) -> str:
    """Get trajectory coordinates for a specific trajectory record using live OSDU connection."""
    client = OSDUClient()
    
    if not client.authenticate():
        return "Authentication failed. Check EDI credentials and AWS configuration."
    
    # Get trajectory record
    trajectory = client.get_record(trajectory_id)
    if not trajectory:
        return f"No trajectory record found for: {trajectory_id}"
    
    # Look for Datasets field in the trajectory record
    data = trajectory.get('data', {})
    datasets = data.get('Datasets', [])
    
    if not datasets:
        return f"No datasets found in trajectory {trajectory_id}. Available keys: {list(data.keys())}"
    
    # Try to download and parse trajectory files
    for dataset_id in datasets[:1]:  # Try first dataset
        signed_url = client.get_signed_url(dataset_id)
        if not signed_url:
            continue
            
        file_content = client.download_file(signed_url)
        if not file_content:
            continue
            
        coordinates = parse_trajectory_coordinates(file_content)
        if coordinates:
            result = f"SUCCESS! Trajectory coordinates for {trajectory_id}:\n"
            result += f"Dataset: {dataset_id}\n"
            result += f"Downloaded file with {len(file_content)} characters\n"
            for i, (x, y, z) in enumerate(coordinates[:10]):  # Show first 10 points
                result += f"Point {i+1}: X={x:.2f}, Y={y:.2f}, Z={z:.2f}\n"
            
            if len(coordinates) > 10:
                result += f"... and {len(coordinates) - 10} more points\n"
            
            return result
    
    return f"Could not download or parse trajectory data for {trajectory_id}. Found {len(datasets)} datasets but none were accessible."
