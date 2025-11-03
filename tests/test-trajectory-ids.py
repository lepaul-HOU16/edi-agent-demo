#!/usr/bin/env python3
"""Test script to get available trajectory IDs from OSDU"""

import sys
import os

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

def main():
    client = OSDUClient()
    
    if not client.authenticate():
        print("❌ Authentication failed")
        return
    
    print("✅ Authentication successful")
    print("\nFetching trajectory records...")
    
    trajectories = client.search_trajectory_records()
    print(f"\nFound {len(trajectories)} trajectories\n")
    
    for i, traj in enumerate(trajectories[:10]):
        traj_id = traj.get('id', 'Unknown')
        traj_data = traj.get('data', {})
        wellbore_id = traj_data.get('WellboreID', 'Unknown')
        datasets = traj_data.get('Datasets', [])
        
        print(f"{i+1}. Trajectory ID: {traj_id}")
        print(f"   Wellbore ID: {wellbore_id}")
        print(f"   Datasets: {len(datasets)}")
        print()

if __name__ == '__main__':
    main()
