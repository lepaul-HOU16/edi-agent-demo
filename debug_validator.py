#!/usr/bin/env python3
"""
Debug the validator to see what's happening
"""

import asyncio
import aiohttp
import json

# Configuration
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def debug_validator():
    """Debug the validator test"""
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'accept': 'application/json'
    }
    
    # Test the exact same request the validator makes
    request_data = {
        "tool": "calculate_porosity",
        "parameters": {
            "wellName": "SANDSTONE_RESERVOIR_001",
            "depthStart": 1800,
            "depthEnd": 2000,
            "method": "density",
            "parameters": {
                "matrixDensity": 2.65,
                "fluidDensity": 1.0
            }
        }
    }
    
    # Convert to MCP protocol format
    mcp_request = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": request_data["tool"],
            "arguments": request_data["parameters"]
        }
    }
    
    print("🔍 Debug Validator Request")
    print("=" * 50)
    print(f"Request: {json.dumps(mcp_request, indent=2)}")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(MCP_ENDPOINT, json=mcp_request, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    if 'result' in result and 'content' in result['result']:
                        content = result['result']['content'][0]['text']
                        
                        try:
                            parsed_response = json.loads(content)
                            
                            print("\n✅ Response parsed successfully")
                            
                            # Check validation criteria
                            print("\n🔍 Validation Checks:")
                            
                            # Check methodology
                            has_methodology = 'methodology' in parsed_response
                            print(f"   Has methodology: {has_methodology}")
                            
                            if has_methodology:
                                methodology = parsed_response['methodology']
                                has_formula = 'formula' in methodology
                                has_method = 'method' in methodology
                                has_variables = 'variable_definitions' in methodology
                                has_parameters = 'parameters' in methodology
                                has_standards = 'industry_standards' in methodology
                                
                                print(f"   - Formula: {has_formula}")
                                print(f"   - Method: {has_method}")
                                print(f"   - Variables: {has_variables}")
                                print(f"   - Parameters: {has_parameters}")
                                print(f"   - Standards: {has_standards}")
                                
                                if has_parameters:
                                    parameters = methodology['parameters']
                                    print(f"   - Parameter count: {len(parameters)}")
                                    for param_name, param_data in parameters.items():
                                        has_justification = 'justification' in param_data
                                        has_source = 'source' in param_data
                                        print(f"     {param_name}: justification={has_justification}, source={has_source}")
                            
                            # Check quality metrics
                            has_quality = 'quality_metrics' in parsed_response
                            print(f"   Has quality metrics: {has_quality}")
                            
                            if has_quality:
                                quality = parsed_response['quality_metrics']
                                has_uncertainty = 'uncertainty_analysis' in quality
                                print(f"   - Uncertainty analysis: {has_uncertainty}")
                            
                            # Check professional summary
                            has_summary = 'professional_summary' in parsed_response
                            print(f"   Has professional summary: {has_summary}")
                            
                            # Check results
                            has_results = 'results' in parsed_response
                            print(f"   Has results: {has_results}")
                            
                            if has_results:
                                results = parsed_response['results']
                                has_geological = 'geological_interpretation' in results
                                print(f"   - Geological interpretation: {has_geological}")
                            
                        except json.JSONDecodeError as e:
                            print(f"❌ JSON decode error: {e}")
                            print(f"Raw content: {content[:500]}...")
                    else:
                        print("❌ Unexpected response format")
                        print(f"Response keys: {result.keys()}")
                else:
                    print(f"❌ Request failed: {response.status}")
                    print(await response.text())
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_validator())
