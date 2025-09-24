#!/usr/bin/env python3
"""
Test script to verify the professional response format fix
"""

import requests
import json
import os

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
        
        # Check for specific professional elements
        if 'industry_standards' not in content.get('methodology', {}):
            return False, "Missing industry_standards in methodology"
            
        if 'uncertainty_analysis' not in content.get('quality_metrics', {}):
            return False, "Missing uncertainty_analysis in quality_metrics"
            
        if 'executive_summary' not in content.get('professional_summary', {}):
            return False, "Missing executive_summary in professional_summary"
        
        return True, "Professional format validated"
        
    except Exception as e:
        return False, f"Error parsing response: {e}"

def main():
    """Test the fixed tools"""
    print("🔧 Testing Professional MCP Response Format Fix")
    print("=" * 60)
    
    # Test Data Quality Assessment
    print("\n1. Testing Data Quality Assessment Tool...")
    dqa_response = test_mcp_tool("assess_data_quality", {
        "wellName": "WELL_001",
        "curveName": "GR"
    })
    
    dqa_valid, dqa_msg = check_professional_format(dqa_response)
    print(f"   Status: {'✅ PASS' if dqa_valid else '❌ FAIL'}")
    print(f"   Details: {dqa_msg}")
    
    # Test Uncertainty Analysis
    print("\n2. Testing Uncertainty Analysis Tool...")
    ua_response = test_mcp_tool("perform_uncertainty_analysis", {
        "wellName": "WELL_001",
        "calculationType": "porosity",
        "method": "density",
        "parameters": {}
    })
    
    ua_valid, ua_msg = check_professional_format(ua_response)
    print(f"   Status: {'✅ PASS' if ua_valid else '❌ FAIL'}")
    print(f"   Details: {ua_msg}")
    
    # Test Porosity (should still work)
    print("\n3. Testing Porosity Tool (reference)...")
    por_response = test_mcp_tool("calculate_porosity", {
        "wellName": "WELL_001",
        "method": "density"
    })
    
    por_valid, por_msg = check_professional_format(por_response)
    print(f"   Status: {'✅ PASS' if por_valid else '❌ FAIL'}")
    print(f"   Details: {por_msg}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    total_tests = 3
    passed_tests = sum([dqa_valid, ua_valid, por_valid])
    
    print(f"Tests Passed: {passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - Professional format fix successful!")
        print("\nExpected Results:")
        print("• Data Quality Assessment: 95+ professional score")
        print("• Uncertainty Analysis: 95+ professional score") 
        print("• Porosity Calculation: 108+ professional score (maintained)")
    else:
        print("⚠️  Some tests failed - check implementation")
        
        if not dqa_valid:
            print(f"• Data Quality Assessment needs fixing: {dqa_msg}")
        if not ua_valid:
            print(f"• Uncertainty Analysis needs fixing: {ua_msg}")
        if not por_valid:
            print(f"• Porosity tool broken: {por_msg}")

if __name__ == "__main__":
    main()
