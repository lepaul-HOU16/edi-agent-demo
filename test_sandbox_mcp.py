#!/usr/bin/env python3
"""
Quick test script for the deployed MCP server in Amplify sandbox
"""

import asyncio
import aiohttp
import json

# Configuration from CloudFormation outputs
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def test_mcp_server():
    """Test basic MCP server functionality"""
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'accept': 'application/json'
    }
    
    # Test 1: List available tools
    print("🔍 Testing MCP Server Tools List...")
    list_request = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/list"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(MCP_ENDPOINT, json=list_request, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Tools list successful: {len(result.get('result', {}).get('tools', []))} tools available")
                    for tool in result.get('result', {}).get('tools', []):
                        print(f"   - {tool.get('name', 'Unknown')}: {tool.get('description', 'No description')}")
                else:
                    print(f"❌ Tools list failed: {response.status}")
                    print(await response.text())
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False
    
    # Test 2: Try a simple tool call
    print("\n🧪 Testing Well Data Tool...")
    tool_request = {
        "jsonrpc": "2.0",
        "id": "2",
        "method": "tools/call",
        "params": {
            "name": "list_wells",
            "arguments": {}
        }
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(MCP_ENDPOINT, json=tool_request, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Well listing successful")
                    if 'result' in result and 'content' in result['result']:
                        content = result['result']['content']
                        if isinstance(content, list) and content:
                            print(f"   Found {len(content)} content items")
                        else:
                            print(f"   Content: {str(content)[:100]}...")
                else:
                    print(f"❌ Well listing failed: {response.status}")
                    print(await response.text())
        except Exception as e:
            print(f"❌ Tool call error: {e}")
    
    return True

if __name__ == "__main__":
    print("🚀 Testing Amplify Sandbox MCP Server")
    print("=" * 50)
    asyncio.run(test_mcp_server())
    print("\n✅ Test complete")
