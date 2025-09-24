#!/usr/bin/env python3
"""
Debug script to see actual MCP responses
"""

import requests
import json

# MCP Server Configuration
MCP_SERVER_URL = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
MCP_API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

def test_mcp_tool(tool_name, params):
    """Test a specific MCP tool and show raw response"""
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

def main():
    print("🔍 DEBUG: MCP Response Analysis")
    print("=" * 60)
    
    # Test Data Quality Assessment
    print("\n1. Data Quality Assessment Response:")
    dqa_response = test_mcp_tool("assess_data_quality", {
        "wellName": "WELL_001",
        "curveName": "GR"
    })
    print(json.dumps(dqa_response, indent=2))
    
    print("\n" + "="*60)
    
    # Test Uncertainty Analysis  
    print("\n2. Uncertainty Analysis Response:")
    ua_response = test_mcp_tool("perform_uncertainty_analysis", {
        "wellName": "WELL_001",
        "calculationType": "porosity",
        "method": "density",
        "parameters": {}
    })
    print(json.dumps(ua_response, indent=2))
    
    print("\n" + "="*60)
    
    # Test Porosity
    print("\n3. Porosity Response:")
    por_response = test_mcp_tool("calculate_porosity", {
        "wellName": "WELL_001",
        "method": "density"
    })
    print(json.dumps(por_response, indent=2))

if __name__ == "__main__":
    main()
