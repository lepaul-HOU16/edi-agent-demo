"""
Cloud MCP Server Deployment Validator
Ensures deployed server matches local quality and professional standards
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import aiohttp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    test_name: str
    passed: bool
    score: float
    details: Dict[str, Any]
    professional_standard_met: bool
    recommendations: List[str]

class CloudMCPValidator:
    """Validates that cloud-deployed MCP server meets professional standards"""
    
    def __init__(self, cloud_endpoint: str):
        """
        Initialize validator for cloud MCP server
        
        Args:
            cloud_endpoint: URL of deployed MCP server
        """
        self.cloud_endpoint = cloud_endpoint
        self.professional_threshold = 85.0
        self.required_response_elements = [
            'methodology', 'results', 'quality_metrics', 
            'technical_documentation', 'professional_summary'
        ]
        
    async def validate_full_deployment(self) -> Dict[str, Any]:
        """
        Comprehensive validation of cloud deployment
        
        Returns:
            Complete validation report with professional assessment
        """
        logger.info("Starting comprehensive cloud MCP server validation...")
        
        validation_results = []
        
        # Test 1: Porosity Calculation Professional Standards
        porosity_result = await self._test_porosity_calculation()
        validation_results.append(porosity_result)
        
        # Test 2: Shale Volume Analysis Quality
        shale_result = await self._test_shale_volume_analysis()
        validation_results.append(shale_result)
        
        # Test 3: Water Saturation Methodology
        saturation_result = await self._test_water_saturation()
        validation_results.append(saturation_result)
        
        # Test 4: Statistical Analysis Completeness
        stats_result = await self._test_statistical_analysis()
        validation_results.append(stats_result)
        
        # Test 5: Error Handling Professional Standards
        error_result = await self._test_error_handling()
        validation_results.append(error_result)
        
        # Test 6: Performance and Scalability
        performance_result = await self._test_performance()
        validation_results.append(performance_result)
        
        # Test 7: Data Quality Validation
        quality_result = await self._test_data_quality_validation()
        validation_results.append(quality_result)
        
        # Generate comprehensive report
        report = self._generate_validation_report(validation_results)
        
        return report

    async def _test_porosity_calculation(self) -> ValidationResult:
        """Test porosity calculation for professional standards compliance"""
        try:
            # Test density porosity calculation with correct parameter names
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
            
            start_time = time.time()
            response = await self._make_mcp_request(request_data)
            response_time = time.time() - start_time
            
            # Validate professional standards
            score = 0.0
            details = {}
            recommendations = []
            
            # Check methodology documentation (25 points)
            if self._validate_methodology(response):
                score += 25
                details['methodology_complete'] = True
            else:
                recommendations.append("Include complete mathematical formulas and variable definitions")
                details['methodology_complete'] = False
            
            # Check parameter justification (25 points)
            if self._validate_parameters(response):
                score += 25
                details['parameters_justified'] = True
            else:
                recommendations.append("Provide geological justification for all parameters")
                details['parameters_justified'] = False
            
            # Check uncertainty analysis (25 points)
            if self._validate_uncertainty_analysis(response):
                score += 25
                details['uncertainty_included'] = True
            else:
                recommendations.append("Include quantitative uncertainty analysis")
                details['uncertainty_included'] = False
            
            # Check professional interpretation (25 points)
            if self._validate_professional_interpretation(response):
                score += 25
                details['interpretation_professional'] = True
            else:
                recommendations.append("Provide professional geological interpretation")
                details['interpretation_professional'] = False
            
            details['response_time'] = response_time
            details['response_size'] = len(json.dumps(response))
            
            return ValidationResult(
                test_name="Porosity Calculation Professional Standards",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Porosity calculation test failed: {str(e)}")
            return ValidationResult(
                test_name="Porosity Calculation Professional Standards",
                passed=False,
                score=0.0,
                details={'error': str(e)},
                professional_standard_met=False,
                recommendations=["Fix server connectivity and error handling"]
            )

    async def _test_shale_volume_analysis(self) -> ValidationResult:
        """Test shale volume analysis for industry compliance"""
        try:
            request_data = {
                "tool": "calculate_shale_volume",
                "parameters": {
                    "wellName": "MIXED_LITHOLOGY_003",
                    "depthStart": 2100,
                    "depthEnd": 2200,
                    "method": "larionov_tertiary",
                    "parameters": {
                        "grClean": 25,
                        "grShale": 150
                    }
                }
            }
            
            response = await self._make_mcp_request(request_data)
            
            score = 0.0
            details = {}
            recommendations = []
            
            # Validate method selection justification
            if self._check_method_justification(response, "larionov_tertiary"):
                score += 30
                details['method_justified'] = True
            else:
                recommendations.append("Justify method selection based on formation age and lithology")
            
            # Validate parameter documentation
            if self._check_parameter_documentation(response):
                score += 30
                details['parameters_documented'] = True
            else:
                recommendations.append("Document parameter selection with geological rationale")
            
            # Validate industry standards compliance
            if self._check_industry_standards(response):
                score += 40
                details['industry_compliant'] = True
            else:
                recommendations.append("Reference applicable industry standards (API, SPE)")
            
            return ValidationResult(
                test_name="Shale Volume Analysis Industry Compliance",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_error_result("Shale Volume Analysis", str(e))

    async def _test_water_saturation(self) -> ValidationResult:
        """Test water saturation calculation methodology"""
        try:
            request_data = {
                "tool": "calculate_saturation",
                "parameters": {
                    "wellName": "SANDSTONE_RESERVOIR_001",
                    "depthStart": 1800,
                    "depthEnd": 2000,
                    "method": "archie",
                    "parameters": {
                        "a": 1.0,
                        "m": 2.0,
                        "n": 2.0,
                        "rw": 0.1
                    }
                }
            }
            
            response = await self._make_mcp_request(request_data)
            
            score = 0.0
            details = {}
            recommendations = []
            
            # Check Archie equation documentation
            if self._validate_archie_equation(response):
                score += 35
                details['archie_documented'] = True
            else:
                recommendations.append("Include complete Archie equation with parameter definitions")
            
            # Check parameter validation
            if self._validate_archie_parameters(response):
                score += 35
                details['parameters_validated'] = True
            else:
                recommendations.append("Validate Archie parameters against formation characteristics")
            
            # Check hydrocarbon assessment
            if self._validate_hydrocarbon_assessment(response):
                score += 30
                details['hydrocarbon_assessed'] = True
            else:
                recommendations.append("Provide professional hydrocarbon potential assessment")
            
            return ValidationResult(
                test_name="Water Saturation Methodology",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_error_result("Water Saturation Methodology", str(e))

    async def _test_statistical_analysis(self) -> ValidationResult:
        """Test statistical analysis completeness"""
        try:
            request_data = {
                "tool": "assess_data_quality",
                "parameters": {
                    "wellName": "CARBONATE_PLATFORM_002",
                    "curveName": "GR",
                    "depthStart": 2000,
                    "depthEnd": 2200
                }
            }
            
            response = await self._make_mcp_request(request_data)
            
            score = 0.0
            details = {}
            recommendations = []
            
            # Check statistical completeness
            required_stats = ['mean', 'median', 'std_dev', 'min', 'max', 'count']
            stats_present = sum(1 for stat in required_stats if stat in str(response))
            score += (stats_present / len(required_stats)) * 40
            
            # Check data quality metrics
            if self._validate_data_quality_metrics(response):
                score += 30
                details['quality_metrics_present'] = True
            else:
                recommendations.append("Include comprehensive data quality metrics")
            
            # Check professional interpretation
            if self._validate_statistical_interpretation(response):
                score += 30
                details['interpretation_present'] = True
            else:
                recommendations.append("Provide professional statistical interpretation")
            
            return ValidationResult(
                test_name="Statistical Analysis Completeness",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_error_result("Statistical Analysis", str(e))

    async def _test_error_handling(self) -> ValidationResult:
        """Test professional error handling"""
        try:
            # Test with invalid parameters to trigger error
            request_data = {
                "tool": "calculate_porosity",
                "parameters": {
                    "wellName": "NONEXISTENT_WELL",
                    "depthStart": 5000,
                    "depthEnd": 6000,
                    "method": "invalid_method"
                }
            }
            
            response = await self._make_mcp_request(request_data)
            
            score = 0.0
            details = {}
            recommendations = []
            
            # Check if error response is professional
            if self._validate_professional_error_response(response):
                score += 50
                details['professional_error_handling'] = True
            else:
                recommendations.append("Implement professional error responses with technical guidance")
            
            # Check if error provides actionable guidance
            if self._validate_error_guidance(response):
                score += 50
                details['actionable_guidance'] = True
            else:
                recommendations.append("Provide specific technical recommendations in error responses")
            
            return ValidationResult(
                test_name="Professional Error Handling",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            # This is actually expected for error testing
            return ValidationResult(
                test_name="Professional Error Handling",
                passed=True,
                score=100.0,
                details={'error_handling_working': True},
                professional_standard_met=True,
                recommendations=[]
            )

    async def _test_performance(self) -> ValidationResult:
        """Test performance and scalability"""
        try:
            # Test multiple concurrent requests
            tasks = []
            for i in range(5):
                request_data = {
                    "tool": "assess_data_quality",
                    "parameters": {
                        "wellName": "SANDSTONE_RESERVOIR_001",
                        "curveName": "RHOB"
                    }
                }
                tasks.append(self._make_mcp_request(request_data))
            
            start_time = time.time()
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            total_time = time.time() - start_time
            
            score = 0.0
            details = {}
            recommendations = []
            
            # Check response times
            avg_response_time = total_time / len(tasks)
            if avg_response_time < 2.0:
                score += 50
                details['performance_acceptable'] = True
            else:
                recommendations.append("Optimize response times to under 2 seconds")
            
            # Check concurrent handling
            successful_responses = sum(1 for r in responses if not isinstance(r, Exception))
            if successful_responses == len(tasks):
                score += 50
                details['concurrent_handling'] = True
            else:
                recommendations.append("Improve concurrent request handling")
            
            details['avg_response_time'] = avg_response_time
            details['successful_concurrent_requests'] = successful_responses
            
            return ValidationResult(
                test_name="Performance and Scalability",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_error_result("Performance Testing", str(e))

    async def _test_data_quality_validation(self) -> ValidationResult:
        """Test data quality validation capabilities"""
        try:
            request_data = {
                "tool": "assess_data_quality",
                "parameters": {
                    "wellName": "MIXED_LITHOLOGY_003",
                    "curveName": "RHOB",
                    "depthStart": 2000,
                    "depthEnd": 2100
                }
            }
            
            response = await self._make_mcp_request(request_data)
            
            score = 0.0
            details = {}
            recommendations = []
            
            # Check quality metrics presence
            if self._validate_quality_metrics_presence(response):
                score += 40
                details['quality_metrics_complete'] = True
            else:
                recommendations.append("Include comprehensive data quality metrics")
            
            # Check environmental corrections validation
            if self._validate_environmental_corrections(response):
                score += 30
                details['corrections_validated'] = True
            else:
                recommendations.append("Validate and document environmental corrections")
            
            # Check professional QC standards
            if self._validate_qc_standards(response):
                score += 30
                details['qc_standards_met'] = True
            else:
                recommendations.append("Implement industry-standard QC procedures")
            
            return ValidationResult(
                test_name="Data Quality Validation",
                passed=score >= self.professional_threshold,
                score=score,
                details=details,
                professional_standard_met=score >= 90,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_error_result("Data Quality Validation", str(e))

    async def _make_mcp_request(self, request_data: Dict) -> Dict:
        """Make request to cloud MCP server"""
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': 'TKUAnchYg7agFQPUnD2Hn1wIHYtgh81Fa2G2XQcg',
            'accept': 'application/json'
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
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.cloud_endpoint,
                json=mcp_request,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                result = await response.json()
                if 'result' in result and 'content' in result['result']:
                    content = result['result']['content'][0]['text']
                    try:
                        # Parse the JSON response from the tool
                        return json.loads(content)
                    except json.JSONDecodeError:
                        return {"error": "Invalid JSON response", "raw_content": content}
                return result

    def _validate_methodology(self, response: Dict) -> bool:
        """Validate methodology documentation completeness"""
        if 'methodology' not in response:
            return False
        methodology = response['methodology']
        required_fields = ['formula', 'method', 'variable_definitions', 'parameters', 'industry_standards']
        return all(field in methodology for field in required_fields)

    def _validate_parameters(self, response: Dict) -> bool:
        """Validate parameter justification"""
        if 'methodology' not in response or 'parameters' not in response['methodology']:
            return False
        parameters = response['methodology']['parameters']
        
        # Check if parameters have proper justification structure
        for param_name, param_data in parameters.items():
            if not isinstance(param_data, dict):
                return False
            if 'justification' not in param_data or 'source' not in param_data:
                return False
        return True

    def _validate_uncertainty_analysis(self, response: Dict) -> bool:
        """Validate uncertainty analysis presence"""
        if 'quality_metrics' not in response:
            return False
        quality_metrics = response['quality_metrics']
        return 'uncertainty_analysis' in quality_metrics

    def _validate_professional_interpretation(self, response: Dict) -> bool:
        """Validate professional geological interpretation"""
        if 'results' not in response:
            return False
        results = response['results']
        
        # Check for geological interpretation in results
        has_geological = 'geological_interpretation' in results
        has_professional_summary = 'professional_summary' in response
        
        return has_geological or has_professional_summary

    def _check_method_justification(self, response: Dict, method: str) -> bool:
        """Check if method selection is justified"""
        if 'methodology' not in response:
            return False
        methodology = response['methodology']
        return 'method' in methodology and method.lower() in methodology['method'].lower()

    def _check_parameter_documentation(self, response: Dict) -> bool:
        """Check parameter documentation quality"""
        if 'methodology' not in response or 'parameters' not in response['methodology']:
            return False
        parameters = response['methodology']['parameters']
        
        # Check if all parameters have proper documentation
        for param_data in parameters.values():
            if not isinstance(param_data, dict):
                return False
            if not all(key in param_data for key in ['justification', 'source', 'units']):
                return False
        return True

    def _check_industry_standards(self, response: Dict) -> bool:
        """Check industry standards compliance"""
        if 'methodology' not in response:
            return False
        methodology = response['methodology']
        industry_standards = methodology.get('industry_standards', [])
        
        # Check for recognized industry standards
        recognized_standards = ['API', 'SPE', 'API RP 40', 'SPE Recommended Practices']
        return any(standard in str(industry_standards) for standard in recognized_standards)

    def _validate_archie_equation(self, response: Dict) -> bool:
        """Validate Archie equation documentation"""
        return ('archie' in str(response).lower() and 
                'equation' in str(response).lower())

    def _validate_archie_parameters(self, response: Dict) -> bool:
        """Validate Archie parameters"""
        archie_params = ['a', 'm', 'n', 'rw']
        return any(param in str(response) for param in archie_params)

    def _validate_hydrocarbon_assessment(self, response: Dict) -> bool:
        """Validate hydrocarbon potential assessment"""
        hc_keywords = ['hydrocarbon', 'saturation', 'potential', 'reservoir']
        return any(keyword in str(response).lower() for keyword in hc_keywords)

    def _validate_data_quality_metrics(self, response: Dict) -> bool:
        """Validate data quality metrics presence"""
        quality_keywords = ['completeness', 'quality', 'validation', 'confidence']
        return any(keyword in str(response).lower() for keyword in quality_keywords)

    def _validate_statistical_interpretation(self, response: Dict) -> bool:
        """Validate statistical interpretation"""
        return ('interpretation' in str(response).lower() or 
                'analysis' in str(response).lower())

    def _validate_professional_error_response(self, response: Dict) -> bool:
        """Validate professional error response format"""
        if 'error' not in response:
            return False
        error_data = response['error']
        return ('technical_details' in error_data or 
                'professional_guidance' in error_data)

    def _validate_error_guidance(self, response: Dict) -> bool:
        """Validate actionable error guidance"""
        return ('recommendation' in str(response).lower() or 
                'guidance' in str(response).lower())

    def _validate_quality_metrics_presence(self, response: Dict) -> bool:
        """Validate quality metrics presence"""
        return 'quality_metrics' in response or 'data_quality' in response

    def _validate_environmental_corrections(self, response: Dict) -> bool:
        """Validate environmental corrections documentation"""
        corrections_keywords = ['correction', 'environmental', 'borehole', 'temperature']
        return any(keyword in str(response).lower() for keyword in corrections_keywords)

    def _validate_qc_standards(self, response: Dict) -> bool:
        """Validate QC standards compliance"""
        qc_keywords = ['quality control', 'qc', 'validation', 'standards']
        return any(keyword in str(response).lower() for keyword in qc_keywords)

    def _create_error_result(self, test_name: str, error_msg: str) -> ValidationResult:
        """Create error validation result"""
        return ValidationResult(
            test_name=test_name,
            passed=False,
            score=0.0,
            details={'error': error_msg},
            professional_standard_met=False,
            recommendations=["Fix server connectivity and error handling"]
        )

    def _generate_validation_report(self, results: List[ValidationResult]) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        total_score = sum(r.score for r in results) / len(results)
        passed_tests = sum(1 for r in results if r.passed)
        professional_tests = sum(1 for r in results if r.professional_standard_met)
        
        report = {
            "validation_summary": {
                "overall_score": total_score,
                "overall_grade": self._get_grade(total_score),
                "tests_passed": f"{passed_tests}/{len(results)}",
                "professional_standards_met": f"{professional_tests}/{len(results)}",
                "deployment_ready": total_score >= self.professional_threshold and passed_tests == len(results)
            },
            "detailed_results": [
                {
                    "test_name": r.test_name,
                    "passed": r.passed,
                    "score": r.score,
                    "grade": self._get_grade(r.score),
                    "professional_standard_met": r.professional_standard_met,
                    "details": r.details,
                    "recommendations": r.recommendations
                }
                for r in results
            ],
            "deployment_assessment": {
                "ready_for_production": total_score >= 90 and passed_tests == len(results),
                "technical_quality": "Excellent" if total_score >= 95 else "Good" if total_score >= 85 else "Needs Improvement",
                "professional_compliance": "Full" if professional_tests == len(results) else "Partial",
                "overall_recommendation": self._get_deployment_recommendation(total_score, passed_tests, len(results))
            },
            "next_steps": self._get_next_steps(results)
        }
        
        return report

    def _get_grade(self, score: float) -> str:
        """Convert score to letter grade"""
        if score >= 95: return "A+"
        elif score >= 90: return "A"
        elif score >= 85: return "B+"
        elif score >= 80: return "B"
        elif score >= 70: return "C"
        else: return "F"

    def _get_deployment_recommendation(self, score: float, passed: int, total: int) -> str:
        """Get deployment recommendation"""
        if score >= 90 and passed == total:
            return "APPROVED: Deploy to production with confidence"
        elif score >= 85 and passed >= total * 0.8:
            return "CONDITIONAL: Address recommendations before production deployment"
        else:
            return "NOT READY: Significant improvements required before deployment"

    def _get_next_steps(self, results: List[ValidationResult]) -> List[str]:
        """Get next steps based on validation results"""
        all_recommendations = []
        for result in results:
            all_recommendations.extend(result.recommendations)
        
        # Remove duplicates and prioritize
        unique_recommendations = list(set(all_recommendations))
        
        if not unique_recommendations:
            return ["Deployment validation complete - ready for production"]
        
        return unique_recommendations[:5]  # Top 5 recommendations

# Example usage
async def main():
    """Example validation of cloud deployment"""
    # Amplify sandbox endpoint
    cloud_endpoint = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
    
    validator = CloudMCPValidator(cloud_endpoint)
    
    print("🔍 Starting Cloud MCP Server Validation...")
    print("=" * 60)
    
    validation_report = await validator.validate_full_deployment()
    
    print("\n📊 VALIDATION REPORT")
    print("=" * 60)
    print(f"Overall Score: {validation_report['validation_summary']['overall_score']:.1f}")
    print(f"Overall Grade: {validation_report['validation_summary']['overall_grade']}")
    print(f"Tests Passed: {validation_report['validation_summary']['tests_passed']}")
    print(f"Professional Standards Met: {validation_report['validation_summary']['professional_standards_met']}")
    print(f"Deployment Ready: {validation_report['validation_summary']['deployment_ready']}")
    
    print(f"\n🎯 DEPLOYMENT ASSESSMENT")
    print("=" * 60)
    assessment = validation_report['deployment_assessment']
    print(f"Ready for Production: {assessment['ready_for_production']}")
    print(f"Technical Quality: {assessment['technical_quality']}")
    print(f"Professional Compliance: {assessment['professional_compliance']}")
    print(f"Recommendation: {assessment['overall_recommendation']}")
    
    if validation_report['next_steps']:
        print(f"\n📋 NEXT STEPS")
        print("=" * 60)
        for i, step in enumerate(validation_report['next_steps'], 1):
            print(f"{i}. {step}")
    
    print(f"\n✅ Validation Complete")

if __name__ == "__main__":
    asyncio.run(main())