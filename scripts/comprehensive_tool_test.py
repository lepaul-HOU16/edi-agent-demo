#!/usr/bin/env python3
"""
Comprehensive test of all MCP tools with Nova Pro model
"""

import asyncio
import aiohttp
import json
import time

# Configuration
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def test_all_tools():
    """Test all available MCP tools comprehensively"""
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'accept': 'application/json'
    }
    
    print("🧪 COMPREHENSIVE MCP TOOL TEST - NOVA PRO MODEL")
    print("=" * 60)
    
    # First, get list of available tools
    list_request = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/list"
    }
    
    tools = []
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(MCP_ENDPOINT, json=list_request, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    tools = result.get('result', {}).get('tools', [])
                    print(f"📋 Found {len(tools)} available tools:")
                    for i, tool in enumerate(tools, 1):
                        print(f"   {i}. {tool.get('name', 'Unknown')}")
                else:
                    print(f"❌ Failed to get tools list: {response.status}")
                    return
        except Exception as e:
            print(f"❌ Error getting tools: {e}")
            return
    
    # Test each tool with appropriate parameters
    test_cases = [
        {
            "name": "list_wells",
            "params": {},
            "description": "List all available wells"
        },
        {
            "name": "get_well_info", 
            "params": {"wellName": "SANDSTONE_RESERVOIR_001"},
            "description": "Get well header information"
        },
        {
            "name": "get_curve_data",
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "curveNames": ["RHOB", "GR"],
                "depthStart": 1800,
                "depthEnd": 2000
            },
            "description": "Get curve data for specific depth range"
        },
        {
            "name": "calculate_porosity",
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "method": "density",
                "parameters": {
                    "matrixDensity": 2.65,
                    "fluidDensity": 1.0
                },
                "depthStart": 1800,
                "depthEnd": 2000
            },
            "description": "Calculate density porosity with professional documentation"
        },
        {
            "name": "calculate_shale_volume",
            "params": {
                "wellName": "MIXED_LITHOLOGY_003",  # Use different well that has GR
                "method": "larionov_tertiary",
                "parameters": {
                    "grClean": 30,
                    "grShale": 120
                },
                "depthStart": 1800,
                "depthEnd": 2000
            },
            "description": "Calculate shale volume with geological interpretation"
        },
        {
            "name": "calculate_saturation",
            "params": {
                "wellName": "MIXED_LITHOLOGY_003",  # Use different well that has RT
                "method": "archie", 
                "parameters": {
                    "rw": 0.1,
                    "a": 1.0,
                    "m": 2.0,
                    "n": 2.0
                },
                "depthStart": 1800,
                "depthEnd": 2000
            },
            "description": "Calculate water saturation with Archie equation"
        },
        {
            "name": "assess_data_quality",
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "curveName": "RHOB",
                "depthStart": 1800,
                "depthEnd": 2000
            },
            "description": "Assess data quality for well log curves"
        },
        {
            "name": "perform_uncertainty_analysis",
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "calculationType": "porosity",
                "method": "density",
                "parameters": {
                    "matrixDensity": 2.65,
                    "fluidDensity": 1.0
                },
                "depthStart": 1800,
                "depthEnd": 2000
            },
            "description": "Perform Monte Carlo uncertainty analysis"
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        tool_name = test_case["name"]
        params = test_case["params"]
        description = test_case["description"]
        
        print(f"\n🔧 Testing: {tool_name}")
        print(f"   Description: {description}")
        
        request = {
            "jsonrpc": "2.0",
            "id": str(len(results) + 1),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": params
            }
        }
        
        start_time = time.time()
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(MCP_ENDPOINT, json=request, headers=headers, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        result = await response.json()
                        
                        if 'result' in result and 'content' in result['result']:
                            content = result['result']['content'][0]['text']
                            
                            # Analyze response quality
                            try:
                                parsed_response = json.loads(content)
                                
                                # Check for professional elements
                                has_methodology = 'methodology' in parsed_response
                                has_quality_metrics = 'quality_metrics' in parsed_response
                                has_professional_summary = 'professional_summary' in parsed_response
                                has_results = 'results' in parsed_response
                                has_technical_docs = 'technical_documentation' in parsed_response
                                
                                professional_score = sum([
                                    has_methodology,
                                    has_quality_metrics, 
                                    has_professional_summary,
                                    has_results,
                                    has_technical_docs
                                ]) * 20  # 20 points each
                                
                                print(f"   ✅ Success ({response_time:.1f}s)")
                                print(f"   📊 Professional Score: {professional_score}/100")
                                print(f"   📋 Elements: Methodology={has_methodology}, Quality={has_quality_metrics}, Summary={has_professional_summary}")
                                
                                # Show key results
                                if 'results' in parsed_response:
                                    results_data = parsed_response['results']
                                    if 'primary_statistics' in results_data:
                                        stats = results_data['primary_statistics']
                                        for key, value in stats.items():
                                            if isinstance(value, dict) and 'value' in value:
                                                print(f"   📈 {key}: {value['value']} {value.get('units', '')}")
                                
                                results.append({
                                    "tool": tool_name,
                                    "status": "success",
                                    "response_time": response_time,
                                    "professional_score": professional_score,
                                    "has_methodology": has_methodology,
                                    "has_quality_metrics": has_quality_metrics,
                                    "has_professional_summary": has_professional_summary,
                                    "content_length": len(content)
                                })
                                
                            except json.JSONDecodeError:
                                print(f"   ⚠️  Success but non-JSON response ({len(content)} chars)")
                                results.append({
                                    "tool": tool_name,
                                    "status": "success_non_json",
                                    "response_time": response_time,
                                    "professional_score": 0,
                                    "content_length": len(content)
                                })
                        else:
                            print(f"   ❌ Unexpected response format")
                            results.append({
                                "tool": tool_name,
                                "status": "format_error",
                                "response_time": response_time,
                                "professional_score": 0
                            })
                    else:
                        error_text = await response.text()
                        print(f"   ❌ Failed: {response.status} - {error_text[:100]}")
                        results.append({
                            "tool": tool_name,
                            "status": "error",
                            "response_time": response_time,
                            "professional_score": 0,
                            "error": f"{response.status}: {error_text[:100]}"
                        })
                        
            except Exception as e:
                print(f"   ❌ Exception: {str(e)}")
                results.append({
                    "tool": tool_name,
                    "status": "exception",
                    "response_time": 0,
                    "professional_score": 0,
                    "error": str(e)
                })
    
    # Generate summary report
    print(f"\n📊 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    
    successful_tests = [r for r in results if r["status"] == "success"]
    failed_tests = [r for r in results if r["status"] not in ["success", "success_non_json"]]
    
    print(f"Total Tools Tested: {len(results)}")
    print(f"Successful: {len(successful_tests)}")
    print(f"Failed: {len(failed_tests)}")
    
    if successful_tests:
        avg_response_time = sum(r["response_time"] for r in successful_tests) / len(successful_tests)
        avg_professional_score = sum(r["professional_score"] for r in successful_tests) / len(successful_tests)
        
        print(f"\n🎯 PERFORMANCE METRICS:")
        print(f"   Average Response Time: {avg_response_time:.1f}s")
        print(f"   Average Professional Score: {avg_professional_score:.1f}/100")
        
        # Professional elements analysis
        methodology_count = sum(1 for r in successful_tests if r.get("has_methodology", False))
        quality_count = sum(1 for r in successful_tests if r.get("has_quality_metrics", False))
        summary_count = sum(1 for r in successful_tests if r.get("has_professional_summary", False))
        
        print(f"\n📋 PROFESSIONAL ELEMENTS:")
        print(f"   Tools with Methodology: {methodology_count}/{len(successful_tests)}")
        print(f"   Tools with Quality Metrics: {quality_count}/{len(successful_tests)}")
        print(f"   Tools with Professional Summary: {summary_count}/{len(successful_tests)}")
        
        # Grade the overall system
        overall_score = (len(successful_tests) / len(results)) * 50 + (avg_professional_score / 100) * 50
        
        if overall_score >= 90:
            grade = "A"
            status = "EXCELLENT - Production Ready"
        elif overall_score >= 80:
            grade = "B"
            status = "GOOD - Minor improvements needed"
        elif overall_score >= 70:
            grade = "C"
            status = "ACCEPTABLE - Some improvements needed"
        elif overall_score >= 60:
            grade = "D"
            status = "NEEDS IMPROVEMENT"
        else:
            grade = "F"
            status = "SIGNIFICANT ISSUES"
        
        print(f"\n🏆 OVERALL ASSESSMENT:")
        print(f"   Overall Score: {overall_score:.1f}/100")
        print(f"   Grade: {grade}")
        print(f"   Status: {status}")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for test in failed_tests:
            print(f"   {test['tool']}: {test.get('error', 'Unknown error')}")
    
    print(f"\n✅ Comprehensive test complete!")

if __name__ == "__main__":
    asyncio.run(test_all_tools())
