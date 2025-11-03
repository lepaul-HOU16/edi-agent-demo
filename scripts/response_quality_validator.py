"""
Response Quality Validator for Petrophysical Analysis Agent
Ensures all responses meet professional technical standards
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class QualityMetrics:
    methodology_score: float
    technical_validation_score: float
    results_completeness_score: float
    professional_standards_score: float
    overall_score: float
    missing_elements: List[str]
    recommendations: List[str]

class PetrophysicalResponseValidator:
    """Validates agent responses for technical quality and completeness"""
    
    def __init__(self):
        self.required_elements = {
            'methodology': [
                'formula', 'equation', 'method', 'calculation',
                'parameters', 'inputs', 'variables'
            ],
            'technical_validation': [
                'data quality', 'completeness', 'uncertainty', 'confidence',
                'corrections', 'validation', 'quality control'
            ],
            'results': [
                'mean', 'average', 'range', 'statistics', 'results',
                'values', 'measurements'
            ],
            'professional_standards': [
                'units', 'methodology', 'industry', 'standard',
                'reproducible', 'audit', 'traceability'
            ]
        }
        
        self.formula_patterns = [
            r'φ[A-Z]?\s*=\s*[^=]+',  # Porosity formulas
            r'Vsh\s*=\s*[^=]+',      # Shale volume formulas
            r'Sw\s*=\s*[^=]+',       # Water saturation formulas
            r'IGR\s*=\s*[^=]+',      # Gamma ray index formulas
            r'[A-Za-z]+\s*=\s*\([^)]+\)\s*/\s*\([^)]+\)'  # General ratio formulas
        ]
        
        self.parameter_patterns = [
            r'ρma\s*=\s*[\d.]+',     # Matrix density
            r'ρf\s*=\s*[\d.]+',      # Fluid density
            r'GR.*clean\s*=\s*[\d.]+', # GR clean
            r'GR.*shale\s*=\s*[\d.]+', # GR shale
            r'[a-z]\s*=\s*[\d.]+',   # General parameters
        ]

    def validate_response(self, response_text: str) -> QualityMetrics:
        """
        Comprehensive validation of agent response quality
        
        Args:
            response_text: The agent's response to validate
            
        Returns:
            QualityMetrics object with scores and recommendations
        """
        methodology_score = self._check_methodology(response_text)
        technical_score = self._check_technical_validation(response_text)
        results_score = self._check_results_completeness(response_text)
        standards_score = self._check_professional_standards(response_text)
        
        overall_score = (methodology_score + technical_score + 
                        results_score + standards_score) / 4
        
        missing_elements = self._identify_missing_elements(response_text)
        recommendations = self._generate_recommendations(
            methodology_score, technical_score, results_score, standards_score
        )
        
        return QualityMetrics(
            methodology_score=methodology_score,
            technical_validation_score=technical_score,
            results_completeness_score=results_score,
            professional_standards_score=standards_score,
            overall_score=overall_score,
            missing_elements=missing_elements,
            recommendations=recommendations
        )

    def _check_methodology(self, text: str) -> float:
        """Check for presence of formulas, parameters, and method justification"""
        score = 0.0
        
        # Check for formulas (30 points)
        formula_found = any(re.search(pattern, text, re.IGNORECASE) 
                           for pattern in self.formula_patterns)
        if formula_found:
            score += 30
            
        # Check for parameters (25 points)
        param_count = sum(1 for pattern in self.parameter_patterns 
                         if re.search(pattern, text, re.IGNORECASE))
        score += min(25, param_count * 8)
        
        # Check for method justification (25 points)
        justification_keywords = ['selected', 'chosen', 'rationale', 'because', 'optimized']
        if any(keyword in text.lower() for keyword in justification_keywords):
            score += 25
            
        # Check for variable definitions (20 points)
        if 'where' in text.lower() or '=' in text:
            score += 20
            
        return min(100.0, score)

    def _check_technical_validation(self, text: str) -> float:
        """Check for data quality metrics and validation steps"""
        score = 0.0
        
        # Check for data completeness (25 points)
        completeness_keywords = ['completeness', 'valid points', 'data coverage', '%']
        if any(keyword in text.lower() for keyword in completeness_keywords):
            score += 25
            
        # Check for uncertainty analysis (25 points)
        uncertainty_keywords = ['uncertainty', 'error', 'confidence', 'reliability']
        if any(keyword in text.lower() for keyword in uncertainty_keywords):
            score += 25
            
        # Check for quality control (25 points)
        qc_keywords = ['quality control', 'validation', 'corrections', 'outliers']
        if any(keyword in text.lower() for keyword in qc_keywords):
            score += 25
            
        # Check for numerical quality metrics (25 points)
        if re.search(r'\d+\.?\d*\s*%', text):  # Percentage values
            score += 25
            
        return min(100.0, score)

    def _check_results_completeness(self, text: str) -> float:
        """Check for comprehensive results presentation"""
        score = 0.0
        
        # Check for statistical measures (40 points)
        stats_keywords = ['mean', 'average', 'median', 'range', 'standard deviation']
        stats_found = sum(1 for keyword in stats_keywords if keyword in text.lower())
        score += min(40, stats_found * 10)
        
        # Check for units (30 points)
        unit_patterns = [r'\d+\.?\d*\s*(g/cc|ohm-m|API|%|m|ft)', r'units?']
        if any(re.search(pattern, text, re.IGNORECASE) for pattern in unit_patterns):
            score += 30
            
        # Check for interpretation (30 points)
        interp_keywords = ['interpretation', 'indicates', 'suggests', 'reservoir', 'formation']
        if any(keyword in text.lower() for keyword in interp_keywords):
            score += 30
            
        return min(100.0, score)

    def _check_professional_standards(self, text: str) -> float:
        """Check for professional presentation and standards"""
        score = 0.0
        
        # Check for industry terminology (25 points)
        industry_terms = ['petrophysical', 'porosity', 'permeability', 'saturation', 
                         'resistivity', 'gamma ray', 'density', 'neutron']
        terms_found = sum(1 for term in industry_terms if term in text.lower())
        score += min(25, terms_found * 3)
        
        # Check for reproducibility elements (25 points)
        repro_keywords = ['reproducible', 'audit', 'verification', 'independent']
        if any(keyword in text.lower() for keyword in repro_keywords):
            score += 25
            
        # Check for structured presentation (25 points)
        if '###' in text or '##' in text:  # Markdown headers
            score += 25
            
        # Check for technical precision (25 points)
        if re.search(r'\d+\.\d{2,}', text):  # Multiple decimal places
            score += 25
            
        return min(100.0, score)

    def _identify_missing_elements(self, text: str) -> List[str]:
        """Identify what elements are missing from the response"""
        missing = []
        
        if not any(re.search(pattern, text, re.IGNORECASE) 
                  for pattern in self.formula_patterns):
            missing.append("Mathematical formulas")
            
        if not re.search(r'ρ|GR|=.*\d', text, re.IGNORECASE):
            missing.append("Parameter values")
            
        if 'uncertainty' not in text.lower():
            missing.append("Uncertainty analysis")
            
        if not re.search(r'\d+\.?\d*\s*%', text):
            missing.append("Quantitative quality metrics")
            
        return missing

    def _generate_recommendations(self, method_score: float, tech_score: float, 
                                results_score: float, standards_score: float) -> List[str]:
        """Generate specific recommendations for improvement"""
        recommendations = []
        
        if method_score < 80:
            recommendations.append("Include complete mathematical formulas with variable definitions")
            recommendations.append("Provide justification for method selection")
            
        if tech_score < 80:
            recommendations.append("Add quantitative data quality metrics")
            recommendations.append("Include uncertainty analysis and confidence levels")
            
        if results_score < 80:
            recommendations.append("Provide comprehensive statistical summary")
            recommendations.append("Include geological/engineering interpretation")
            
        if standards_score < 80:
            recommendations.append("Use precise industry terminology")
            recommendations.append("Ensure reproducible documentation")
            
        return recommendations

def validate_agent_response(response: str) -> Dict:
    """
    Main validation function for agent responses
    
    Args:
        response: Agent response text to validate
        
    Returns:
        Dictionary with validation results and recommendations
    """
    validator = PetrophysicalResponseValidator()
    metrics = validator.validate_response(response)
    
    return {
        'overall_quality_score': metrics.overall_score,
        'component_scores': {
            'methodology': metrics.methodology_score,
            'technical_validation': metrics.technical_validation_score,
            'results_completeness': metrics.results_completeness_score,
            'professional_standards': metrics.professional_standards_score
        },
        'quality_grade': _get_quality_grade(metrics.overall_score),
        'missing_elements': metrics.missing_elements,
        'recommendations': metrics.recommendations,
        'meets_professional_standards': metrics.overall_score >= 85
    }

def _get_quality_grade(score: float) -> str:
    """Convert numerical score to quality grade"""
    if score >= 95:
        return "Excellent (A+)"
    elif score >= 90:
        return "Very Good (A)"
    elif score >= 85:
        return "Good (B+)"
    elif score >= 80:
        return "Acceptable (B)"
    elif score >= 70:
        return "Needs Improvement (C)"
    else:
        return "Inadequate (F)"

# Example usage
if __name__ == "__main__":
    # Test with a sample response
    sample_response = """
    ## Density Porosity Analysis - MIXED_LITHOLOGY_003 (2100-2200m)
    
    ### Methodology Applied
    - **Formula**: φD = (ρma - ρb) / (ρma - ρf)
    - **Matrix Density (ρma)**: 2.68 g/cc (customized for mixed lithology)
    - **Fluid Density (ρf)**: 1.05 g/cc (accounting for formation water salinity)
    
    ### Results
    - **Average Porosity**: 18.1%
    - **Data Completeness**: 94.5%
    - **Uncertainty Range**: 2-3%
    """
    
    results = validate_agent_response(sample_response)
    print(f"Quality Score: {results['overall_quality_score']:.1f}")
    print(f"Grade: {results['quality_grade']}")
    print(f"Meets Standards: {results['meets_professional_standards']}")