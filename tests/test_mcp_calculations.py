#!/usr/bin/env python3
"""
Integration Tests for MCP Server Petrophysical Calculations
Tests the enhanced MCP server with calculation capabilities
"""

import json
import asyncio
import tempfile
import os
from typing import Dict, Any
from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client
import subprocess
import time


class MCPCalculationTester:
    """Test class for MCP server petrophysical calculations"""
    
    def __init__(self):
        self.test_results = []
    
    async def test_porosity_calculations(self, session: ClientSession):
        """Test porosity calculation tools"""
        print("Testing porosity calculations...")
        
        # Test density porosity
        try:
            result = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "density",
                    "parameters": {
                        "matrix_density": 2.65,
                        "fluid_density": 1.0
                    }
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Density porosity test failed: {response['error']}")
                self.test_results.append(("density_porosity", False, response['error']))
            else:
                print(f"✅ Density porosity calculation successful")
                print(f"   Method: {response['method']}")
                print(f"   Methodology: {response['methodology']}")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}, Count={response['statistics']['valid_count']}")
                self.test_results.append(("density_porosity", True, "Success"))
                
        except Exception as e:
            print(f"❌ Density porosity test error: {str(e)}")
            self.test_results.append(("density_porosity", False, str(e)))
        
        # Test neutron porosity
        try:
            result = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "neutron"
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Neutron porosity test failed: {response['error']}")
                self.test_results.append(("neutron_porosity", False, response['error']))
            else:
                print(f"✅ Neutron porosity calculation successful")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}, Count={response['statistics']['valid_count']}")
                self.test_results.append(("neutron_porosity", True, "Success"))
                
        except Exception as e:
            print(f"❌ Neutron porosity test error: {str(e)}")
            self.test_results.append(("neutron_porosity", False, str(e)))
        
        # Test effective porosity
        try:
            result = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "effective",
                    "depth_start": 2000,
                    "depth_end": 2100
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Effective porosity test failed: {response['error']}")
                self.test_results.append(("effective_porosity", False, response['error']))
            else:
                print(f"✅ Effective porosity calculation successful")
                print(f"   Depth range: {len(response['depths'])} points")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}")
                self.test_results.append(("effective_porosity", True, "Success"))
                
        except Exception as e:
            print(f"❌ Effective porosity test error: {str(e)}")
            self.test_results.append(("effective_porosity", False, str(e)))
    
    async def test_shale_volume_calculations(self, session: ClientSession):
        """Test shale volume calculation tools"""
        print("\nTesting shale volume calculations...")
        
        # Test Larionov Tertiary method
        try:
            result = await session.call_tool(
                "calculate_shale_volume",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "larionov_tertiary",
                    "parameters": {
                        "gr_clean": 30,
                        "gr_shale": 120
                    }
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Larionov Tertiary test failed: {response['error']}")
                self.test_results.append(("larionov_tertiary", False, response['error']))
            else:
                print(f"✅ Larionov Tertiary calculation successful")
                print(f"   Methodology: {response['methodology']}")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}")
                self.test_results.append(("larionov_tertiary", True, "Success"))
                
        except Exception as e:
            print(f"❌ Larionov Tertiary test error: {str(e)}")
            self.test_results.append(("larionov_tertiary", False, str(e)))
        
        # Test Linear method
        try:
            result = await session.call_tool(
                "calculate_shale_volume",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "linear"
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Linear shale volume test failed: {response['error']}")
                self.test_results.append(("linear_shale", False, response['error']))
            else:
                print(f"✅ Linear shale volume calculation successful")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}")
                self.test_results.append(("linear_shale", True, "Success"))
                
        except Exception as e:
            print(f"❌ Linear shale volume test error: {str(e)}")
            self.test_results.append(("linear_shale", False, str(e)))
        
        # Test Clavier method
        try:
            result = await session.call_tool(
                "calculate_shale_volume",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "clavier"
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Clavier test failed: {response['error']}")
                self.test_results.append(("clavier", False, response['error']))
            else:
                print(f"✅ Clavier calculation successful")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}")
                self.test_results.append(("clavier", True, "Success"))
                
        except Exception as e:
            print(f"❌ Clavier test error: {str(e)}")
            self.test_results.append(("clavier", False, str(e)))
    
    async def test_saturation_calculations(self, session: ClientSession):
        """Test water saturation calculation tools"""
        print("\nTesting water saturation calculations...")
        
        # Test Archie equation
        try:
            result = await session.call_tool(
                "calculate_saturation",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "archie",
                    "porosity_method": "effective",
                    "parameters": {
                        "rw": 0.05,
                        "a": 1.0,
                        "m": 2.0,
                        "n": 2.0
                    }
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"❌ Archie saturation test failed: {response['error']}")
                self.test_results.append(("archie_saturation", False, response['error']))
            else:
                print(f"✅ Archie saturation calculation successful")
                print(f"   Methodology: {response['methodology']}")
                print(f"   Statistics: Mean={response['statistics']['mean']:.3f}")
                print(f"   Porosity method: {response['porosity_method']}")
                self.test_results.append(("archie_saturation", True, "Success"))
                
        except Exception as e:
            print(f"❌ Archie saturation test error: {str(e)}")
            self.test_results.append(("archie_saturation", False, str(e)))
    
    async def test_parameter_validation(self, session: ClientSession):
        """Test parameter validation and error handling"""
        print("\nTesting parameter validation...")
        
        # Test invalid porosity method
        try:
            result = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "invalid_method"
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response:
                print(f"✅ Invalid method validation working: {response['error']}")
                self.test_results.append(("invalid_method_validation", True, "Correctly rejected"))
            else:
                print(f"❌ Invalid method validation failed - should have been rejected")
                self.test_results.append(("invalid_method_validation", False, "Should have been rejected"))
                
        except Exception as e:
            print(f"✅ Invalid method validation working: {str(e)}")
            self.test_results.append(("invalid_method_validation", True, "Correctly rejected"))
        
        # Test missing well
        try:
            result = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "NONEXISTENT_WELL",
                    "method": "density"
                }
            )
            
            response = json.loads(result.content[0].text)
            
            if "error" in response and "not found" in response['error']:
                print(f"✅ Missing well validation working: {response['error']}")
                self.test_results.append(("missing_well_validation", True, "Correctly rejected"))
            else:
                print(f"❌ Missing well validation failed")
                self.test_results.append(("missing_well_validation", False, "Should have been rejected"))
                
        except Exception as e:
            print(f"✅ Missing well validation working: {str(e)}")
            self.test_results.append(("missing_well_validation", True, "Correctly rejected"))
    
    async def test_depth_filtering(self, session: ClientSession):
        """Test depth range filtering functionality"""
        print("\nTesting depth range filtering...")
        
        try:
            # Get full dataset
            result_full = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "density"
                }
            )
            
            response_full = json.loads(result_full.content[0].text)
            
            # Get filtered dataset
            result_filtered = await session.call_tool(
                "calculate_porosity",
                {
                    "well_name": "SANDSTONE_RESERVOIR_001",
                    "method": "density",
                    "depth_start": 2000,
                    "depth_end": 2050
                }
            )
            
            response_filtered = json.loads(result_filtered.content[0].text)
            
            if "error" not in response_full and "error" not in response_filtered:
                full_count = len(response_full['values'])
                filtered_count = len(response_filtered['values'])
                
                if filtered_count < full_count:
                    print(f"✅ Depth filtering working: {full_count} -> {filtered_count} points")
                    self.test_results.append(("depth_filtering", True, f"Filtered {full_count} to {filtered_count}"))
                else:
                    print(f"❌ Depth filtering failed: counts should be different")
                    self.test_results.append(("depth_filtering", False, "No filtering occurred"))
            else:
                print(f"❌ Depth filtering test failed due to calculation errors")
                self.test_results.append(("depth_filtering", False, "Calculation errors"))
                
        except Exception as e:
            print(f"❌ Depth filtering test error: {str(e)}")
            self.test_results.append(("depth_filtering", False, str(e)))
    
    def print_test_summary(self):
        """Print summary of all test results"""
        print("\n" + "="*60)
        print("MCP CALCULATION TESTS SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {passed/total*100:.1f}%")
        
        print("\nDetailed Results:")
        for test_name, success, message in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"  {status} {test_name}: {message}")
        
        return passed == total


async def run_mcp_calculation_tests():
    """Run all MCP calculation tests"""
    print("Starting MCP Server Petrophysical Calculation Tests")
    print("="*60)
    
    # Start MCP server as subprocess
    server_process = subprocess.Popen(
        ["python", "mcp-well-data-server.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Give server time to start
    await asyncio.sleep(2)
    
    try:
        # Connect to MCP server
        async with stdio_client() as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                # Initialize session
                await session.initialize()
                
                # Create tester instance
                tester = MCPCalculationTester()
                
                # Run all tests
                await tester.test_porosity_calculations(session)
                await tester.test_shale_volume_calculations(session)
                await tester.test_saturation_calculations(session)
                await tester.test_parameter_validation(session)
                await tester.test_depth_filtering(session)
                
                # Print summary
                all_passed = tester.print_test_summary()
                
                return all_passed
                
    except Exception as e:
        print(f"Test execution failed: {str(e)}")
        return False
    
    finally:
        # Clean up server process
        server_process.terminate()
        server_process.wait()


if __name__ == "__main__":
    # Run tests
    success = asyncio.run(run_mcp_calculation_tests())
    
    if success:
        print("\n🎉 All MCP calculation tests passed!")
        exit(0)
    else:
        print("\n💥 Some MCP calculation tests failed!")
        exit(1)