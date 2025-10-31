#!/usr/bin/env python3
"""
Direct OSDU Client Test

This script tests the OSDU client directly to see what data is being fetched.

Usage:
    python3 test_osdu_client_direct.py
"""

import json
import sys
from pathlib import Path

# Add the function directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from osdu_client import OSDUClient
from osdu_data_transformer import OSDUDataTransformer

def print_separator(char='=', length=80):
    """Print a separator line."""
    print(char * length)

def main():
    """Test OSDU client directly."""
    print_separator('=')
    print("OSDU CLIENT DIRECT TEST")
    print_separator('=')
    
    # Initialize OSDU client
    print("\n🔧 Initializing OSDU client...")
    base_url = "https://community.opensubsurface.org"
    partition_id = "opendes"
    
    try:
        client = OSDUClient(base_url, partition_id)
        print(f"   ✅ Client initialized")
        print(f"   Base URL: {base_url}")
        print(f"   Partition: {partition_id}")
    except Exception as e:
        print(f"   ❌ Failed to initialize client: {e}")
        sys.exit(1)
    
    # Fetch wells
    print("\n📥 Fetching wells from OSDU...")
    try:
        wells = client.fetch_all_wells()
        print(f"   ✅ Fetched {len(wells)} wells")
    except Exception as e:
        print(f"   ❌ Failed to fetch wells: {e}")
        sys.exit(1)
    
    # Analyze first well
    if wells:
        print(f"\n🔍 Analyzing first well...")
        first_well = wells[0]
        
        print(f"\n   Raw OSDU Well Structure:")
        print(f"   ID: {first_well.get('id', 'N/A')}")
        
        data = first_well.get('data', {})
        print(f"   FacilityName: {data.get('FacilityName', 'N/A')}")
        print(f"   WellType: {data.get('WellType', 'N/A')}")
        
        # Check for wellbores in raw data
        wellbores_in_data = data.get('wellbores', [])
        print(f"   Wellbores in data: {len(wellbores_in_data) if isinstance(wellbores_in_data, list) else 'N/A'}")
        
        # Check for wellbores at root level
        wellbores_at_root = first_well.get('wellbores', [])
        print(f"   Wellbores at root: {len(wellbores_at_root) if isinstance(wellbores_at_root, list) else 'N/A'}")
        
        # Print all keys in the well record
        print(f"\n   All keys in well record: {list(first_well.keys())}")
        print(f"   All keys in data section: {list(data.keys())}")
        
        # Print full first well (truncated)
        print(f"\n   Full first well (first 500 chars):")
        well_json = json.dumps(first_well, indent=2)
        print(well_json[:500] + "..." if len(well_json) > 500 else well_json)
    
    # Transform wells
    print(f"\n🔄 Transforming wells with OSDUDataTransformer...")
    try:
        transformer = OSDUDataTransformer()
        transformed_wells = transformer.transform_well_data(wells)
        print(f"   ✅ Transformed {len(transformed_wells)} wells")
    except Exception as e:
        print(f"   ❌ Failed to transform wells: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Analyze transformed data
    if transformed_wells:
        print(f"\n🔍 Analyzing transformed data...")
        first_transformed = transformed_wells[0]
        
        print(f"\n   Transformed Well Structure:")
        print(f"   ID: {first_transformed.get('id', 'N/A')}")
        print(f"   Name: {first_transformed.get('name', 'N/A')}")
        
        wellbores = first_transformed.get('wellbores', [])
        print(f"   Wellbores: {len(wellbores) if isinstance(wellbores, list) else 'N/A (not a list)'}")
        
        if wellbores and isinstance(wellbores, list) and len(wellbores) > 0:
            first_wellbore = wellbores[0]
            print(f"\n   First Wellbore:")
            print(f"      ID: {first_wellbore.get('wellbore_id', 'N/A')}")
            print(f"      Name: {first_wellbore.get('facilityName', 'N/A')}")
            
            welllogs = first_wellbore.get('welllogs', [])
            print(f"      Welllogs: {len(welllogs) if isinstance(welllogs, list) else 'N/A'}")
        else:
            print(f"\n   ⚠️  No wellbores in transformed data!")
        
        # Count totals
        total_wellbores = sum(len(w.get('wellbores', [])) for w in transformed_wells)
        total_welllogs = sum(
            len(wb.get('welllogs', []))
            for w in transformed_wells
            for wb in w.get('wellbores', [])
        )
        
        print(f"\n📊 Transformed Data Totals:")
        print(f"   Wells: {len(transformed_wells)}")
        print(f"   Wellbores: {total_wellbores}")
        print(f"   Welllogs: {total_welllogs}")
        
        if total_wellbores == 0:
            print(f"\n⚠️  WARNING: No wellbores in transformed data!")
            print(f"\n   This means:")
            print(f"   1. OSDU API is not returning wellbores in the well records")
            print(f"   2. The transformer is not finding wellbores in the data")
            print(f"   3. Wellbores need to be fetched separately")
            print(f"\n   Solution:")
            print(f"   Implement batch wellbore fetching in osdu_client.py")
            print(f"   See docs/osdu-hierarchy-fetching-limitation.md")
    
    print_separator('=')
    print("TEST COMPLETE")
    print_separator('=')

if __name__ == '__main__':
    main()
