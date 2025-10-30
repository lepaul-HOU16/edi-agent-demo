#!/usr/bin/env python3
"""Test script to find and test the 24 numbered wells (WELL-001 through WELL-024)"""

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

from tools.osdu_client import OSDUClient, get_trajectory_coordinates_live
from tools.trajectory_tools import parse_trajectory_data

def main():
    client = OSDUClient()
    
    if not client.authenticate():
        print("❌ Authentication failed")
        return
    
    print("✅ Authentication successful")
    print("\nSearching for numbered wells (WELL-001 through WELL-024)...")
    print("=" * 80)
    
    # Search for wellbores
    wellbores = client.search_wellbores()
    print(f"\nFound {len(wellbores)} wellbores")
    
    # Look for numbered wells
    numbered_wells = []
    for wellbore in wellbores:
        wellbore_id = wellbore.get('id', '')
        data = wellbore.get('data', {})
        facility_name = data.get('FacilityName', '')
        
        # Check if this is a numbered well (WELL-001, WELL-002, etc.)
        if 'WELL-' in facility_name.upper() or 'WELL-' in wellbore_id.upper():
            numbered_wells.append({
                'id': wellbore_id,
                'name': facility_name,
                'data': data
            })
    
    print(f"\nFound {len(numbered_wells)} numbered wells:")
    for i, well in enumerate(numbered_wells[:24]):
        print(f"{i+1}. {well['name']} - ID: {well['id']}")
    
    if not numbered_wells:
        print("\n⚠️  No numbered wells found. Showing all wellbores:")
        for i, wellbore in enumerate(wellbores[:10]):
            wellbore_id = wellbore.get('id', '')
            data = wellbore.get('data', {})
            facility_name = data.get('FacilityName', 'Unknown')
            print(f"{i+1}. {facility_name} - ID: {wellbore_id}")
    
    # Now search for trajectories associated with these wellbores
    print("\n" + "=" * 80)
    print("\nSearching for trajectories...")
    print("=" * 80)
    
    trajectories = client.search_trajectory_records()
    print(f"\nFound {len(trajectories)} total trajectories")
    
    # Try to match trajectories to numbered wells
    if numbered_wells:
        print("\nLooking for trajectories for numbered wells...")
        for well in numbered_wells[:5]:  # Test first 5
            well_id = well['id']
            print(f"\n{well['name']} ({well_id}):")
            
            # Find trajectories for this wellbore
            matching_trajectories = []
            for traj in trajectories:
                traj_data = traj.get('data', {})
                traj_wellbore_id = traj_data.get('WellboreID', '')
                if well_id in traj_wellbore_id or traj_wellbore_id in well_id:
                    matching_trajectories.append(traj)
            
            if matching_trajectories:
                print(f"  ✅ Found {len(matching_trajectories)} trajectory(ies)")
                for traj in matching_trajectories[:1]:  # Test first trajectory
                    traj_id = traj.get('id', '')
                    print(f"  Testing trajectory: {traj_id[:60]}...")
                    
                    # Try to get trajectory data
                    trajectory_data = get_trajectory_coordinates_live(traj_id)
                    parsed = parse_trajectory_data(trajectory_data)
                    
                    if parsed['valid']:
                        print(f"    ✅ SUCCESS! Format: {parsed['format']}, Points: {parsed['metadata'].get('total_points', 0)}")
                        if parsed['data']:
                            print(f"    Sample point: {parsed['data'][0]}")
                    else:
                        print(f"    ❌ Failed: {parsed.get('error', 'Unknown error')}")
            else:
                print(f"  ❌ No trajectories found")
    else:
        # If no numbered wells found, test first few trajectories
        print("\nTesting first 5 trajectories from OSDU:")
        for i, traj in enumerate(trajectories[:5]):
            traj_id = traj.get('id', '')
            traj_data = traj.get('data', {})
            wellbore_id = traj_data.get('WellboreID', 'Unknown')
            
            print(f"\n{i+1}. Trajectory: {traj_id[:60]}...")
            print(f"   Wellbore: {wellbore_id}")
            
            trajectory_data = get_trajectory_coordinates_live(traj_id)
            parsed = parse_trajectory_data(trajectory_data)
            
            if parsed['valid']:
                print(f"   ✅ SUCCESS! Format: {parsed['format']}, Points: {parsed['metadata'].get('total_points', 0)}")
                if parsed['data']:
                    print(f"   Sample point: {parsed['data'][0]}")
                break  # Found a working one!
            else:
                print(f"   ❌ Failed: {parsed.get('error', 'Unknown error')[:100]}")

if __name__ == '__main__':
    main()
