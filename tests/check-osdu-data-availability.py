#!/usr/bin/env python3
"""
Comprehensive test to check what OSDU data is actually available and usable.
This will help us understand if there's any working trajectory data in the account.
"""

import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

# Set environment variables
os.environ['EDI_USERNAME'] = 'edi-user'
os.environ['EDI_PASSWORD'] = 'Asd!1edi'
os.environ['EDI_CLIENT_ID'] = '7se4hblptk74h59ghbb694ovj4'
os.environ['EDI_CLIENT_SECRET'] = 'k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi'
os.environ['EDI_PARTITION'] = 'osdu'
os.environ['EDI_PLATFORM_URL'] = 'https://osdu.vavourak.people.aws.dev'

from tools.osdu_client import OSDUClient

def check_authentication():
    """Test authentication"""
    print("=" * 80)
    print("STEP 1: Testing OSDU Authentication")
    print("=" * 80)
    
    client = OSDUClient()
    if client.authenticate():
        print("✅ Authentication successful")
        print(f"   Platform: {client.platform_url}")
        print(f"   Partition: {client.partition}")
        return client
    else:
        print("❌ Authentication failed")
        return None

def check_trajectories(client):
    """Check trajectory records"""
    print("\n" + "=" * 80)
    print("STEP 2: Checking Trajectory Records")
    print("=" * 80)
    
    trajectories = client.search_trajectory_records()
    print(f"\n✅ Found {len(trajectories)} trajectory records")
    
    if trajectories:
        print("\nSample trajectories:")
        for i, traj in enumerate(trajectories[:5]):
            traj_id = traj.get('id', 'Unknown')
            traj_data = traj.get('data', {})
            wellbore_id = traj_data.get('WellboreID', 'Unknown')
            datasets = traj_data.get('Datasets', [])
            
            print(f"\n{i+1}. Trajectory ID: {traj_id[:70]}...")
            print(f"   Wellbore ID: {wellbore_id}")
            print(f"   Datasets: {len(datasets)}")
            
            if datasets:
                print(f"   Dataset IDs:")
                for ds in datasets[:2]:
                    print(f"     - {ds[:70]}...")
    
    return trajectories

def check_data_download(client, trajectories):
    """Try to download actual trajectory data"""
    print("\n" + "=" * 80)
    print("STEP 3: Testing Data Download")
    print("=" * 80)
    
    successful_downloads = []
    failed_downloads = []
    
    print(f"\nTesting first 10 trajectories for data availability...")
    
    for i, traj in enumerate(trajectories[:10]):
        traj_id = traj.get('id', '')
        traj_data = traj.get('data', {})
        wellbore_id = traj_data.get('WellboreID', 'Unknown')
        datasets = traj_data.get('Datasets', [])
        
        print(f"\n{i+1}. Testing {wellbore_id}...")
        
        if not datasets:
            print(f"   ❌ No datasets")
            failed_downloads.append((wellbore_id, "No datasets"))
            continue
        
        # Try to download first dataset
        dataset_id = datasets[0]
        signed_url = client.get_signed_url(dataset_id)
        
        if not signed_url:
            print(f"   ❌ No signed URL")
            failed_downloads.append((wellbore_id, "No signed URL"))
            continue
        
        print(f"   ✅ Got signed URL")
        
        # Try to download file
        file_content = client.download_file(signed_url)
        
        if not file_content:
            print(f"   ❌ Download failed")
            failed_downloads.append((wellbore_id, "Download failed"))
            continue
        
        print(f"   ✅ Downloaded {len(file_content)} bytes")
        
        # Try to parse coordinates
        from tools.osdu_client import parse_trajectory_coordinates
        coordinates = parse_trajectory_coordinates(file_content)
        
        if coordinates:
            print(f"   ✅ SUCCESS! Parsed {len(coordinates)} coordinates")
            print(f"   Sample coordinates:")
            for j, (x, y, z) in enumerate(coordinates[:3]):
                print(f"     Point {j+1}: X={x:.2f}, Y={y:.2f}, Z={z:.2f}")
            successful_downloads.append((wellbore_id, traj_id, len(coordinates), file_content[:500]))
        else:
            print(f"   ❌ No coordinates parsed")
            print(f"   File preview: {file_content[:200]}...")
            failed_downloads.append((wellbore_id, "No coordinates parsed"))
    
    return successful_downloads, failed_downloads

def check_wellbores(client):
    """Check wellbore master data"""
    print("\n" + "=" * 80)
    print("STEP 4: Checking Wellbore Master Data")
    print("=" * 80)
    
    wellbores = client.search_wellbores()
    print(f"\n✅ Found {len(wellbores)} wellbore records")
    
    if wellbores:
        print("\nSample wellbores:")
        for i, wellbore in enumerate(wellbores[:10]):
            wellbore_id = wellbore.get('id', 'Unknown')
            data = wellbore.get('data', {})
            facility_name = data.get('FacilityName', 'Unknown')
            
            print(f"{i+1}. {facility_name} - ID: {wellbore_id}")
    
    return wellbores

def main():
    print("\n" + "=" * 80)
    print("OSDU DATA AVAILABILITY CHECK")
    print("=" * 80)
    print("\nThis test will check what data is actually available in the OSDU account")
    print("and whether any trajectory data can be successfully downloaded and parsed.")
    print("=" * 80)
    
    # Step 1: Authentication
    client = check_authentication()
    if not client:
        print("\n❌ Cannot proceed without authentication")
        return 1
    
    # Step 2: Check trajectories
    trajectories = check_trajectories(client)
    
    # Step 3: Try to download data
    successful, failed = check_data_download(client, trajectories)
    
    # Step 4: Check wellbores
    wellbores = check_wellbores(client)
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    print(f"\n📊 Data Availability:")
    print(f"   - Trajectory records: {len(trajectories)}")
    print(f"   - Wellbore records: {len(wellbores)}")
    print(f"   - Successful downloads: {len(successful)}")
    print(f"   - Failed downloads: {len(failed)}")
    
    if successful:
        print(f"\n✅ GOOD NEWS! Found {len(successful)} working trajectory(ies):")
        for wellbore_id, traj_id, coord_count, _ in successful:
            print(f"\n   Wellbore: {wellbore_id}")
            print(f"   Trajectory ID: {traj_id[:70]}...")
            print(f"   Coordinates: {coord_count} points")
            print(f"\n   🎯 You can use this trajectory with:")
            print(f"      'Build trajectory for {traj_id}'")
    else:
        print(f"\n❌ No working trajectories found")
        print(f"\n   All {len(failed)} tested trajectories had issues:")
        issue_counts = {}
        for _, issue in failed:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
        for issue, count in issue_counts.items():
            print(f"   - {issue}: {count} trajectories")
    
    print("\n" + "=" * 80)
    
    return 0 if successful else 1

if __name__ == '__main__':
    sys.exit(main())
