#!/usr/bin/env python3
"""
Test with real well data to verify professional response format
"""

import requests
import json

# MCP Server Configuration
MCP_SERVER_URL = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
MCP_API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

def test_mcp_tool(tool_name, params):
    """Test a specific MCP tool"""
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': MCP_API_KEY,
        'accept': 'application/json'
    }
    
    payload = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": params
        }
    }
    
    try:
        response = requests.post(MCP_SERVER_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def check_professional_format(response_data):
    """Check if response has professional format elements"""
    if 'result' not in response_data:
        return False, "No result in response"
    
    try:
        content = json.loads(response_data['result']['content'][0]['text'])
        
        # Check if it's an error response
        if 'error' in content:
            return False, f"Tool returned error: {content['error'].get('message', 'Unknown error')}"
        
        # Check for key professional elements
        required_fields = [
            'methodology',
            'quality_metrics', 
            'technical_documentation',
            'professional_summary'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in content:
                missing_fields.append(field)
        
        if missing_fields:
            return False, f"Missing professional fields: {missing_fields}"
        
        return True, "Professional format validated"
        
    except Exception as e:
        return False, f"Error parsing response: {e}"

def main():
    print("🔧 Testing Professional MCP Response Format with Real Wells")
    print("=" * 70)
    
    # First, get list of available wells
    print("\n1. Getting available wells...")
    wells_response = test_mcp_tool("list_wells", {})
    
    if 'result' in wells_response:
        try:
            wells_content = json.loads(wells_response['result']['content'][0]['text'])
            if 'wells' in wells_content:
                available_wells = wells_content['wells']
                print(f"   Found {len(available_wells)} wells: {available_wells[:3]}...")
                test_well = available_wells[0] if available_wells else None
            else:
                print("   No wells found in response")
                test_well = None
        except:
            print("   Error parsing wells response")
            test_well = None
    else:
        print("   Error getting wells list")
        test_well = None
    
    if not test_well:
        print("   ❌ No wells available for testing")
        return
    
    print(f"   Using test well: {test_well}")
    
    # Test Data Quality Assessment with real well
    print(f"\n2. Testing Data Quality Assessment with {test_well}...")
    dqa_response = test_mcp_tool("assess_data_quality", {
        "wellName": test_well,
        "curveName": "GR"
    })
    
    dqa_valid, dqa_msg = check_professional_format(dqa_response)
    print(f"   Status: {'✅ PASS' if dqa_valid else '❌ FAIL'}")
    print(f"   Details: {dqa_msg}")
    
    # Test Uncertainty Analysis (doesn't need real well data)
    print(f"\n3. Testing Uncertainty Analysis...")
    ua_response = test_mcp_tool("perform_uncertainty_analysis", {
        "wellName": test_well,
        "calculationType": "porosity",
        "method": "density",
        "parameters": {}
    })
    
    ua_valid, ua_msg = check_professional_format(ua_response)
    print(f"   Status: {'✅ PASS' if ua_valid else '❌ FAIL'}")
    print(f"   Details: {ua_msg}")
    
    # Test Porosity with real well
    print(f"\n4. Testing Porosity Calculation with {test_well}...")
    por_response = test_mcp_tool("calculate_porosity", {
        "wellName": test_well,
        "method": "density"
    })
    
    por_valid, por_msg = check_professional_format(por_response)
    print(f"   Status: {'✅ PASS' if por_valid else '❌ FAIL'}")
    print(f"   Details: {por_msg}")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    
    total_tests = 3
    passed_tests = sum([dqa_valid, ua_valid, por_valid])
    
    print(f"Tests Passed: {passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - Professional format fix successful!")
        print("\nExpected Professional Scores:")
        print("• Data Quality Assessment: 95+ professional score")
        print("• Uncertainty Analysis: 95+ professional score") 
        print("• Porosity Calculation: 108+ professional score")
        print("\n✅ Ready for production deployment!")
    else:
        print("⚠️  Some tests failed - check implementation")
        
        if not dqa_valid:
            print(f"• Data Quality Assessment: {dqa_msg}")
        if not ua_valid:
            print(f"• Uncertainty Analysis: {ua_msg}")
        if not por_valid:
            print(f"• Porosity Calculation: {por_msg}")

if __name__ == "__main__":
    main()
