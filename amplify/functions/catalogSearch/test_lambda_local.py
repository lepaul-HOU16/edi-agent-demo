#!/usr/bin/env python3
"""
Local Lambda Test Script

This script allows you to test the catalogSearch Lambda function locally
without deploying to AWS.

Usage:
    python3 test_lambda_local.py

This will:
1. Load the test event from test_lambda_event.json
2. Call the Lambda handler
3. Print the response
4. Show detailed stats about wells, wellbores, and welllogs
"""

import json
import sys
import os
from pathlib import Path

# Add the function directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Import the Lambda handler
from handler import handler

def load_test_event():
    """Load test event from JSON file."""
    event_file = Path(__file__).parent / 'test_lambda_event.json'
    with open(event_file, 'r') as f:
        return json.load(f)

def print_separator(char='=', length=80):
    """Print a separator line."""
    print(char * length)

def analyze_response(response):
    """Analyze and print detailed information about the response."""
    print_separator()
    print("RESPONSE ANALYSIS")
    print_separator()
    
    # Check response type
    response_type = response.get('type', 'unknown')
    print(f"\n📋 Response Type: {response_type}")
    
    if response_type == 'error':
        print(f"\n❌ ERROR: {response.get('error', 'Unknown error')}")
        return
    
    # Get data section
    data = response.get('data', {})
    
    # Print message
    message = data.get('message', '')
    print(f"\n💬 Message: {message}")
    
    # Print stats
    stats = data.get('stats', {})
    if stats:
        print(f"\n📊 Statistics:")
        print(f"   Wells: {stats.get('wellCount', 0)}")
        print(f"   Wellbores: {stats.get('wellboreCount', 0)}")
        print(f"   Welllogs: {stats.get('welllogCount', 0)}")
        
        if stats.get('curveCount'):
            print(f"   Curves: {stats.get('curveCount', 0)}")
    
    # Print file URLs
    files = data.get('files', {})
    if files:
        print(f"\n📁 Files:")
        if files.get('metadata'):
            print(f"   Metadata: {files['metadata']}")
        if files.get('geojson'):
            print(f"   GeoJSON: {files['geojson']}")
    
    # Print thought steps count
    thought_steps = data.get('thoughtSteps', [])
    if thought_steps:
        print(f"\n🧠 Thought Steps: {len(thought_steps)}")

def fetch_and_analyze_metadata(response):
    """Fetch metadata file and analyze its structure."""
    import requests
    
    data = response.get('data', {})
    files = data.get('files', {})
    metadata_url = files.get('metadata')
    
    if not metadata_url:
        print("\n⚠️  No metadata URL in response")
        return
    
    print_separator()
    print("METADATA FILE ANALYSIS")
    print_separator()
    
    try:
        print(f"\n📥 Fetching metadata from: {metadata_url}")
        response = requests.get(metadata_url, timeout=30)
        response.raise_for_status()
        
        metadata = response.json()
        
        print(f"\n✅ Successfully fetched metadata")
        print(f"   Total wells: {len(metadata)}")
        
        # Analyze first well
        if metadata:
            first_well = metadata[0]
            print(f"\n🔍 First Well Structure:")
            print(f"   ID: {first_well.get('id', 'N/A')}")
            print(f"   Name: {first_well.get('name', 'N/A')}")
            
            # Check for wellbores
            wellbores = first_well.get('wellbores', [])
            print(f"   Wellbores: {len(wellbores) if isinstance(wellbores, list) else 'N/A (not a list)'}")
            
            if wellbores and isinstance(wellbores, list):
                first_wellbore = wellbores[0]
                print(f"\n   First Wellbore:")
                print(f"      ID: {first_wellbore.get('wellbore_id', 'N/A')}")
                print(f"      Name: {first_wellbore.get('facilityName', 'N/A')}")
                
                # Check for welllogs
                welllogs = first_wellbore.get('welllogs', [])
                print(f"      Welllogs: {len(welllogs) if isinstance(welllogs, list) else 'N/A (not a list)'}")
                
                if welllogs and isinstance(welllogs, list):
                    first_welllog = welllogs[0]
                    print(f"\n      First Welllog:")
                    print(f"         ID: {first_welllog.get('welllog_id', 'N/A')}")
                    print(f"         Name: {first_welllog.get('name', 'N/A')}")
                    
                    curves = first_welllog.get('Curves', []) or first_welllog.get('curves', [])
                    print(f"         Curves: {len(curves) if isinstance(curves, list) else 'N/A'}")
            
            # Count totals
            total_wellbores = 0
            total_welllogs = 0
            total_curves = 0
            
            for well in metadata:
                wellbores = well.get('wellbores', [])
                if isinstance(wellbores, list):
                    total_wellbores += len(wellbores)
                    
                    for wellbore in wellbores:
                        welllogs = wellbore.get('welllogs', [])
                        if isinstance(welllogs, list):
                            total_welllogs += len(welllogs)
                            
                            for welllog in welllogs:
                                curves = welllog.get('Curves', []) or welllog.get('curves', [])
                                if isinstance(curves, list):
                                    total_curves += len(curves)
            
            print(f"\n📊 Metadata Totals:")
            print(f"   Wells: {len(metadata)}")
            print(f"   Wellbores: {total_wellbores}")
            print(f"   Welllogs: {total_welllogs}")
            print(f"   Curves: {total_curves}")
            
            if total_wellbores == 0:
                print(f"\n⚠️  WARNING: No wellbores found in metadata!")
                print(f"   This means the OSDU client is only fetching wells.")
                print(f"   See docs/osdu-hierarchy-fetching-limitation.md for details.")
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error fetching metadata: {e}")
    except json.JSONDecodeError as e:
        print(f"\n❌ Error parsing metadata JSON: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

def main():
    """Main test function."""
    print_separator('=')
    print("LAMBDA FUNCTION LOCAL TEST")
    print_separator('=')
    
    # Load test event
    print("\n📋 Loading test event...")
    event = load_test_event()
    print(f"   Prompt: {event['arguments']['prompt']}")
    print(f"   Session ID: {event['arguments']['sessionId']}")
    
    # Call Lambda handler
    print("\n🚀 Calling Lambda handler...")
    try:
        response = handler(event, None)
        
        print("\n✅ Lambda handler completed successfully")
        
        # Analyze response
        analyze_response(response)
        
        # Fetch and analyze metadata file
        if response.get('type') == 'complete':
            fetch_and_analyze_metadata(response)
        
        # Print full response (optional)
        print_separator()
        print("FULL RESPONSE (JSON)")
        print_separator()
        print(json.dumps(response, indent=2))
        
    except Exception as e:
        print(f"\n❌ Lambda handler failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print_separator('=')
    print("TEST COMPLETE")
    print_separator('=')

if __name__ == '__main__':
    main()
