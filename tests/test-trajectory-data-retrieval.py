#!/usr/bin/env python3
"""Test script to retrieve and parse trajectory data"""

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

from tools.osdu_client import get_trajectory_coordinates_live
from tools.trajectory_tools import parse_trajectory_data

def main():
    # Test with first trajectory
    trajectory_id = "osdu:work-product-component--WellboreTrajectory:6ec4485cfed716a909ccabf93cbc658fe7ba2a1bd971d33041ba505d43b949d5"
    
    print(f"Testing trajectory: {trajectory_id}\n")
    print("=" * 80)
    print("\nStep 1: Fetching trajectory data from OSDU...")
    print("=" * 80)
    
    trajectory_data = get_trajectory_coordinates_live(trajectory_id)
    
    print("\nRaw trajectory data:")
    print(trajectory_data[:500] if len(trajectory_data) > 500 else trajectory_data)
    print("\n...")
    
    print("\n" + "=" * 80)
    print("\nStep 2: Parsing trajectory data...")
    print("=" * 80)
    
    parsed = parse_trajectory_data(trajectory_data)
    
    print(f"\nParsed result:")
    print(f"  Format: {parsed['format']}")
    print(f"  Valid: {parsed['valid']}")
    print(f"  Error: {parsed.get('error', 'None')}")
    print(f"  Metadata: {parsed.get('metadata', {})}")
    
    if parsed['valid'] and parsed['data']:
        print(f"\n  Data sample (first 3 points):")
        for i, point in enumerate(parsed['data'][:3]):
            print(f"    Point {i+1}: {point}")

if __name__ == '__main__':
    main()
