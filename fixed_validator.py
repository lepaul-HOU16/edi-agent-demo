#!/usr/bin/env python3
"""
Fixed validator that tests actual tools with correct parameters
"""

import asyncio
import aiohttp
import json
import time

MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
API_KEY = "TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg"

async def fixed_validation():
    """Test actual tools with professional standards"""
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'accept': 'application/json'
    }
    
    print("🔍 FIXED PROFESSIONAL VALIDATION")
    print("=" * 50)
    
    # Test cases for actual tools
    test_cases = [
        {
            "name": "Porosity Calculation",
            "tool": "calculate_porosity",
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "method": "density",
                "parameters": {"matrixDensity": 2.65, "fluidDensity": 1.0},
                "depthStart": 1800, "depthEnd": 2000
            }
        },
        {
            "name": "Data Quality Assessment", 
            "tool": "assess_data_quality",
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "curveName": "RHOB",
                "depthStart": 1800, "depthEnd": 2000
            }
        },
        {
            "name": "Uncertainty Analysis",
            "tool": "perform_uncertainty_analysis", 
            "params": {
                "wellName": "SANDSTONE_RESERVOIR_001",
                "calculationType": "porosity",
                "method": "density",
                "parameters": {"matrixDensity": 2.65, "fluidDensity": 1.0},
                "depthStart": 1800, "depthEnd": 2000
            }
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        
        request = {
            "jsonrpc": "2.0",
            "id": "1", 
            "method": "tools/call",
            "params": {
                "name": test_case["tool"],
                "arguments": test_case["params"]
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
                            
                            try:
                                parsed_response = json.loads(content)
                                
                                # Professional standards validation
                                has_methodology = 'methodology' in parsed_response
                                has_quality_metrics = 'quality_metrics' in parsed_response
                                has_professional_summary = 'professional_summary' in parsed_response
                                has_technical_docs = 'technical_documentation' in parsed_response
                                has_results = 'results' in parsed_response
                                
                                # Check methodology completeness
                                methodology_score = 0
                                if has_methodology:
                                    methodology = parsed_response['methodology']
                                    if 'formula' in methodology: methodology_score += 5
                                    if 'industry_standards' in methodology: methodology_score += 5
                                    if 'parameters' in methodology: methodology_score += 5
                                    if 'variable_definitions' in methodology: methodology_score += 5
                                
                                # Check parameter justification
                                parameter_score = 0
                                if has_methodology and 'parameters' in parsed_response['methodology']:
                                    params = parsed_response['methodology']['parameters']
                                    for param_data in params.values():
                                        if isinstance(param_data, dict):
                                            if 'justification' in param_data: parameter_score += 5
                                            if 'source' in param_data: parameter_score += 5
                                
                                # Check uncertainty analysis
                                uncertainty_score = 0
                                if has_quality_metrics:
                                    quality = parsed_response['quality_metrics']
                                    if 'uncertainty_analysis' in quality: uncertainty_score += 10
                                
                                # Check professional interpretation
                                interpretation_score = 0
                                if has_results:
                                    results_data = parsed_response['results']
                                    if 'geological_interpretation' in results_data: interpretation_score += 10
                                if has_professional_summary: interpretation_score += 10
                                
                                # Calculate total score
                                total_score = methodology_score + parameter_score + uncertainty_score + interpretation_score
                                max_score = 60  # 20 + 20 + 10 + 20
                                percentage_score = (total_score / max_score) * 100
                                
                                print(f"   ✅ Success ({response_time:.1f}s)")
                                print(f"   📊 Professional Score: {percentage_score:.1f}/100")
                                print(f"   📋 Methodology: {methodology_score}/20")
                                print(f"   🔧 Parameters: {parameter_score}/20") 
                                print(f"   📈 Uncertainty: {uncertainty_score}/10")
                                print(f"   🎯 Interpretation: {interpretation_score}/20")
                                
                                results.append({
                                    "test": test_case['name'],
                                    "score": percentage_score,
                                    "response_time": response_time,
                                    "status": "success"
                                })
                                
                            except json.JSONDecodeError:
                                print(f"   ⚠️  Non-JSON response")
                                results.append({
                                    "test": test_case['name'],
                                    "score": 0,
                                    "response_time": response_time,
                                    "status": "non_json"
                                })
                        else:
                            print(f"   ❌ Unexpected format")
                            results.append({
                                "test": test_case['name'],
                                "score": 0,
                                "response_time": response_time,
                                "status": "format_error"
                            })
                    else:
                        print(f"   ❌ Failed: {response.status}")
                        results.append({
                            "test": test_case['name'],
                            "score": 0,
                            "response_time": response_time,
                            "status": "error"
                        })
                        
            except Exception as e:
                print(f"   ❌ Exception: {str(e)}")
                results.append({
                    "test": test_case['name'],
                    "score": 0,
                    "response_time": 0,
                    "status": "exception"
                })
    
    # Generate final assessment
    print(f"\n📊 FINAL ASSESSMENT")
    print("=" * 50)
    
    successful_tests = [r for r in results if r["status"] == "success"]
    
    if successful_tests:
        avg_score = sum(r["score"] for r in successful_tests) / len(successful_tests)
        avg_time = sum(r["response_time"] for r in successful_tests) / len(successful_tests)
        
        print(f"Tests Completed: {len(successful_tests)}/{len(results)}")
        print(f"Average Professional Score: {avg_score:.1f}/100")
        print(f"Average Response Time: {avg_time:.1f}s")
        
        if avg_score >= 90:
            grade = "A"
            status = "EXCELLENT - Production Ready"
        elif avg_score >= 80:
            grade = "B" 
            status = "GOOD - Production Ready"
        elif avg_score >= 70:
            grade = "C"
            status = "ACCEPTABLE - Minor improvements"
        elif avg_score >= 60:
            grade = "D"
            status = "NEEDS IMPROVEMENT"
        else:
            grade = "F"
            status = "SIGNIFICANT ISSUES"
        
        print(f"\n🏆 OVERALL GRADE: {grade}")
        print(f"🎯 STATUS: {status}")
        
        # Detailed breakdown
        for result in successful_tests:
            print(f"   {result['test']}: {result['score']:.1f}/100")
    
    print(f"\n✅ Fixed validation complete!")

if __name__ == "__main__":
    asyncio.run(fixed_validation())
