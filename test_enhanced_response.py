#!/usr/bin/env python3
"""
Test the enhanced MCP server response format
"""

import asyncio
import aiohttp
import json

# Configuration
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def test_enhanced_response():
    """Test enhanced professional response format"""
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'accept': 'application/json'
    }
    
    # Test porosity calculation with professional response
    porosity_request = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": "calculate_porosity",
            "arguments": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "method": "density",
                "parameters": {
                    "matrixDensity": 2.65,
                    "fluidDensity": 1.0
                },
                "depthStart": 1800,
                "depthEnd": 2000
            }
        }
    }
    
    print("🧪 Testing Enhanced Porosity Calculation...")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(MCP_ENDPOINT, json=porosity_request, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    
                    if 'result' in result and 'content' in result['result']:
                        content = result['result']['content'][0]['text']
                        
                        # Parse the JSON response
                        try:
                            parsed_response = json.loads(content)
                            
                            print("✅ Response received successfully")
                            print(f"Tool: {parsed_response.get('tool_name', 'Unknown')}")
                            print(f"Well: {parsed_response.get('well_name', 'Unknown')}")
                            
                            # Check for professional elements
                            has_methodology = 'methodology' in parsed_response
                            has_quality_metrics = 'quality_metrics' in parsed_response
                            has_professional_summary = 'professional_summary' in parsed_response
                            has_technical_docs = 'technical_documentation' in parsed_response
                            
                            print(f"\n📊 Professional Elements:")
                            print(f"   Methodology: {'✅' if has_methodology else '❌'}")
                            print(f"   Quality Metrics: {'✅' if has_quality_metrics else '❌'}")
                            print(f"   Professional Summary: {'✅' if has_professional_summary else '❌'}")
                            print(f"   Technical Documentation: {'✅' if has_technical_docs else '❌'}")
                            
                            if has_methodology:
                                methodology = parsed_response['methodology']
                                print(f"\n🔬 Methodology Details:")
                                print(f"   Formula: {methodology.get('formula', 'Not provided')}")
                                print(f"   Method: {methodology.get('method', 'Not provided')}")
                                print(f"   Industry Standards: {methodology.get('industry_standards', [])}")
                            
                            if has_professional_summary:
                                summary = parsed_response['professional_summary']
                                print(f"\n📋 Professional Summary:")
                                print(f"   Executive Summary: {summary.get('executive_summary', 'Not provided')}")
                                print(f"   Technical Confidence: {summary.get('technical_confidence', 'Not provided')}")
                            
                            # Show sample of full response
                            print(f"\n📄 Sample Response (first 500 chars):")
                            print(content[:500] + "..." if len(content) > 500 else content)
                            
                        except json.JSONDecodeError:
                            print("❌ Response is not valid JSON")
                            print(f"Raw content: {content[:200]}...")
                    else:
                        print("❌ Unexpected response format")
                        print(f"Response: {result}")
                else:
                    print(f"❌ Request failed: {response.status}")
                    print(await response.text())
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_enhanced_response())
