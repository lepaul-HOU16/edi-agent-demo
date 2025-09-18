#!/usr/bin/env python3
import asyncio
import aiohttp
import json

MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def check_wells():
    headers = {'Content-Type': 'application/json', 'X-API-Key': API_KEY}
    
    # List wells
    request = {"jsonrpc": "2.0", "id": "1", "method": "tools/call", "params": {"name": "list_wells", "arguments": {}}}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(MCP_ENDPOINT, json=request, headers=headers) as response:
            result = await response.json()
            content = result['result']['content'][0]['text']
            print("Available wells:")
            print(content)
            
            # Check well info for each
            try:
                wells_data = json.loads(content)
                if 'wells' in wells_data:
                    for well in wells_data['wells'][:2]:  # Check first 2 wells
                        well_name = well.get('name', well.get('wellName', 'Unknown'))
                        print(f"\n--- {well_name} ---")
                        
                        info_request = {"jsonrpc": "2.0", "id": "2", "method": "tools/call", 
                                      "params": {"name": "get_well_info", "arguments": {"wellName": well_name}}}
                        
                        async with session.post(MCP_ENDPOINT, json=info_request, headers=headers) as info_response:
                            info_result = await info_response.json()
                            info_content = info_result['result']['content'][0]['text']
                            info_data = json.loads(info_content)
                            
                            if 'curves' in info_data:
                                curves = [c.get('name', c.get('displayName', 'Unknown')) for c in info_data['curves']]
                                print(f"Curves: {curves}")
            except Exception as e:
                print(f"Error parsing: {e}")

if __name__ == "__main__":
    asyncio.run(check_wells())
