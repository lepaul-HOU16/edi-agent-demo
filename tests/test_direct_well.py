#!/usr/bin/env python3
"""
Test MCP server with known well names
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

def main():
    print("🔧 Testing MCP Server with Known Wells")
    print("=" * 50)
    
    # Test with WELL-001 (we know this exists)
    print("\n1. Testing Data Quality Assessment with WELL-001...")
    dqa_response = test_mcp_tool("assess_data_quality", {
        "wellName": "WELL-001",
        "curveName": "GR"
    })
    
    if 'result' in dqa_response:
        try:
            content = json.loads(dqa_response['result']['content'][0]['text'])
            if 'error' in content:
                print(f"   ❌ Error: {content['error']['message']}")
            else:
                print("   ✅ SUCCESS - Professional response received!")
                print(f"   Well: {content.get('well_name', 'N/A')}")
                print(f"   Curve: {content.get('curve_name', 'N/A')}")
                if 'methodology' in content:
                    print("   ✅ Professional format confirmed")
        except Exception as e:
            print(f"   ❌ Parse error: {e}")
    else:
        print(f"   ❌ No result: {dqa_response}")
    
    print("\n2. Testing Porosity Calculation with WELL-001...")
    por_response = test_mcp_tool("calculate_porosity", {
        "wellName": "WELL-001",
        "method": "density"
    })
    
    if 'result' in por_response:
        try:
            content = json.loads(por_response['result']['content'][0]['text'])
            if 'error' in content:
                print(f"   ❌ Error: {content['error']['message']}")
            else:
                print("   ✅ SUCCESS - Professional response received!")
                print(f"   Well: {content.get('well_name', 'N/A')}")
                if 'methodology' in content:
                    print("   ✅ Professional format confirmed")
        except Exception as e:
            print(f"   ❌ Parse error: {e}")
    else:
        print(f"   ❌ No result: {por_response}")

if __name__ == "__main__":
    main()
