"""
Test script to verify well counting functionality

This script demonstrates how the system should be able to count wells by:
1. Using the global directory scanner to find LAS files
2. Searching for well log files using patterns
3. Providing accurate well counts

This addresses the issue where "how many wells do I have" doesn't return the right answer.
"""

import json
import requests
import os

def test_api_well_scanning():
    """Test the API endpoint for scanning wells"""
    try:
        # Test the global directory scan API
        api_url = "http://localhost:3000/api/global-directory-scan"
        
        response = requests.post(api_url, json={
            "forceRefresh": True,
            "chatSessionId": "test-session"
        })
        
        if response.status_code == 200:
            data = response.json()
            well_logs = data.get('filesByType', {}).get('Well Log', [])
            
            print("=== API WELL SCANNING TEST ===")
            print(f"✅ API Response Status: {response.status_code}")
            print(f"📊 Total Files Found: {data.get('totalFiles', 0)}")
            print(f"🏗️  Total Directories: {data.get('totalDirectories', 0)}")
            print(f"⛽ Well Log Files Found: {len(well_logs)}")
            
            if well_logs:
                print("\n📋 Well Log Files:")
                for i, well_file in enumerate(well_logs[:10], 1):  # Show first 10
                    print(f"  {i}. {well_file['name']} ({well_file.get('key', 'No key')})")
                
                if len(well_logs) > 10:
                    print(f"  ... and {len(well_logs) - 10} more wells")
            
            print(f"\n🎯 ANSWER TO 'HOW MANY WELLS DO I HAVE': {len(well_logs)} wells")
            
            return len(well_logs)
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return 0
            
    except requests.exceptions.ConnectionError:
        print("⚠️  API server not running at localhost:3000")
        print("   This test requires the Next.js development server to be running")
        return 0
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return 0

def simulate_agent_well_search():
    """Simulate how the agent should search for wells using S3 tools"""
    print("\n=== SIMULATED AGENT WELL SEARCH ===")
    print("This shows how the agent should find wells using available tools:")
    print()
    
    # Simulate the search patterns the agent should use
    search_patterns = [
        ".*\\.las$",           # All LAS files
        "global/well-data/.*", # Wells in global well-data directory
        "WELL-.*\\.las$",      # Files starting with WELL-
        ".*well.*\\.las$"      # Any LAS file with 'well' in the name
    ]
    
    print("🔍 Search Patterns the Agent Should Use:")
    for i, pattern in enumerate(search_patterns, 1):
        print(f"  {i}. searchFiles({{filePattern: \"{pattern}\", includeGlobal: true}})")
    
    print("\n📝 Agent Instructions for Well Counting:")
    print("When user asks 'how many wells do I have', the agent should:")
    print("1. Use searchFiles tool with pattern '.*\\.las$' to find all LAS files")
    print("2. Count the results from both global and session-specific storage")
    print("3. Report the total number as the well count")
    print("4. Optionally list the well names if requested")
    
    return True

def create_well_counting_prompt():
    """Create a prompt that should work for well counting"""
    prompt = """
# Well Counting Instructions for Agent

When a user asks "how many wells do I have" or similar questions about well count:

## Step 1: Search for LAS Files
Use the searchFiles tool to find all well log files:
```
searchFiles({
    "filePattern": ".*\\.las$",
    "maxFiles": 500,
    "includeGlobal": true
})
```

## Step 2: Count and Report
- Count the total number of LAS files found
- Each LAS file typically represents one well
- Report the count to the user

## Step 3: Optional Details
If user wants more information:
- List well names using the file names
- Show locations (global vs session-specific)
- Provide file sizes or other metadata

## Example Response Pattern:
"I found [X] wells in your data:
- [Y] wells in global storage (shared data)
- [Z] wells in your session-specific uploads

The wells are: [list of well names from filenames]"

## Troubleshooting:
If no wells found:
1. Try listFiles("global/well-data") to check global well directory
2. Try listFiles("") to see session-specific files
3. Check if files are in different formats (.LAS vs .las)
4. Suggest user upload well data if none found
    """
    
    print("\n=== AGENT PROMPT FOR WELL COUNTING ===")
    print(prompt)
    
    return prompt

def main():
    """Main function to run all tests"""
    print("🔍 WELL COUNTING SYSTEM TEST")
    print("=" * 50)
    
    # Test 1: API-based well scanning
    well_count_api = test_api_well_scanning()
    
    # Test 2: Simulate agent search patterns
    simulate_agent_well_search()
    
    # Test 3: Generate instructions
    create_well_counting_prompt()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    
    if well_count_api > 0:
        print(f"✅ System CAN find wells: {well_count_api} LAS files detected")
        print("✅ API endpoint working correctly")
        print("✅ Global directory scanner functioning")
        print()
        print("🎯 SOLUTION:")
        print("The system has the necessary tools to count wells.")
        print("The agent needs to use searchFiles tool with pattern '.*\\.las$'")
        print("to find and count all LAS files when asked about well count.")
        print()
        print("💡 RECOMMENDATION:")
        print("Add explicit instructions to the agent's system message about")
        print("using searchFiles for well counting questions.")
        
    else:
        print("⚠️  No wells found through API - this could mean:")
        print("   1. No LAS files uploaded to the system")
        print("   2. Files in different location than expected")
        print("   3. API server not running for testing")
        print()
        print("🔧 TROUBLESHOOTING:")
        print("   1. Check if LAS files exist in S3 bucket")
        print("   2. Verify global directory scanner configuration")
        print("   3. Test with the development server running")
    
    return well_count_api

if __name__ == "__main__":
    main()
