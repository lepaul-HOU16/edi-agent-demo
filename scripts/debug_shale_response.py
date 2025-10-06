#!/usr/bin/env python3
"""
Debug shale volume response
"""

import asyncio
import aiohttp
import json

MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def debug_shale():
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'accept': 'application/json'
    }
    
    request = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": "calculate_shale_volume",
            "arguments": {
                "wellName": "SANDSTONE_RESERVOIR_001", 
                "method": "larionov_tertiary",
                "parameters": {
                    "grClean": 30,
                    "grShale": 120
                },
                "depthStart": 1800,
                "depthEnd": 2000
            }
        }
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(MCP_ENDPOINT, json=request, headers=headers) as response:
            if response.status == 200:
                result = await response.json()
                content = result['result']['content'][0]['text']
                print("Raw response:")
                print(content[:500] + "..." if len(content) > 500 else content)
                
                try:
                    parsed = json.loads(content)
                    print(f"\nParsed keys: {list(parsed.keys())}")
                except:
                    print("\nNot JSON")

if __name__ == "__main__":
    asyncio.run(debug_shale())
