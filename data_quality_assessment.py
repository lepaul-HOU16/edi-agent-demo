#!/usr/bin/env python3
"""
Data Quality Assessment Module for MCP Server
Implements curve quality assessment, environmental correction validation,
and data completeness metrics calculation
Based on requirements 6.1, 6.2, 6.3
"""

import math
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class QualityFlag(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


@dataclass
class CurveQualityResult:
    curve_name: str
    quality_flag: QualityFlag
    data_completeness: float
    outlier_percentage: float
    noise_level: float
    environmental_corrections: List[str]
    validation_notes: List[str]
    statistics: Dict[str, float]


@dataclass
class DataCompletenessMetrics:
    total_points: int
    valid_points: int
    null_points: int
    completeness_percentage: float
    depth_coverage: float
    gaps: List[Tuple[float, float]]  # (start_depth, end_depth) of gaps


@dataclass
class EnvironmentalCorrectionValidation:
    correction_type: str
    is_applied: bool
    is_valid: bool
    correction_factor: Optional[float]
    validation_notes: List[str]


class DataQualityAssessment:
    """
    Data Quality Assessment Class
    Provides comprehensive quality control for well log data
    """
    
    def __init__(self):
        self.null_value = -999.25
        
        # Standard curve ranges for validation
        self.curve_ranges = {
            'GR': (0, 300),      # Gamma Ray (API units)
            'RHOB': (1.5, 3.0), # Bulk Density (g/cc)
            'NPHI': (0, 100),    # Neutron Porosity (%)
            'RT': (0.1, 1000),   # Resistivity (ohm-m)
            'DEPT': (0, 10000),  # Depth (ft or m)
            'SP': (-200, 200),   # Spontaneous Potential (mV)
            'CALI': (6, 20),     # Caliper (inches)
        }
    
    def assess_curve_quality(self, curve_name: str, curve_data: List[float], 
                           depths: List[float]) -> CurveQualityResult:
        """
        Assess the quality of a single curve
        """
        # Calculate basic statistics
        statistics = self._calculate_curve_statistics(curve_data)
        
        # Calculate data completeness
        completeness = self._calculate_data_completeness(curve_data)
        
        # Detect outliers
        outlier_percentage = self._detect_outliers(curve_name, curve_data)
        
        # Assess noise level
        noise_level = self._assess_noise_level(curve_data)
        
        # Check environmental corrections needed
        env_corrections = self._check_environmental_corrections(curve_name, curve_data, depths)
        
        # Determine overall quality flag
        quality_flag = self._determine_quality_flag(
            completeness, outlier_percentage, noise_level, curve_name
        )
        
        # Generate validation notes
        validation_notes = self._generate_validation_notes(
            curve_name, completeness, outlier_percentage, noise_level
        )
        
        return CurveQualityResult(
            curve_name=curve_name,
            quality_flag=quality_flag,
            data_completeness=completeness,
            outlier_percentage=outlier_percentage,
            noise_level=noise_level,
            environmental_corrections=env_corrections,
            validation_notes=validation_notes,
            statistics=statistics
        )
    
    def calculate_data_completeness_metrics(self, curve_data: List[float], 
                                          depths: List[float]) -> DataCompletenessMetrics:
        """
        Calculate comprehensive data completeness metrics
        """
        total_points = len(curve_data)
        valid_points = sum(1 for val in curve_data 
                          if val != self.null_value and not math.isnan(val) and math.isfinite(val))
        null_points = total_points - valid_points
        completeness_percentage = (valid_points / total_points * 100) if total_points > 0 else 0
        
        # Calculate depth coverage
        if depths and len(depths) > 1:
            total_depth_range = max(depths) - min(depths)
            depth_coverage = total_depth_range if total_depth_range > 0 else 0
        else:
            depth_coverage = 0
        
        # Identify gaps in data
        gaps = self._identify_data_gaps(curve_data, depths)
        
        return DataCompletenessMetrics(
            total_points=total_points,
            valid_points=valid_points,
            null_points=null_points,
            completeness_percentage=completeness_percentage,
            depth_coverage=depth_coverage,
            gaps=gaps
        )
    
    def validate_environmental_corrections(self, curve_name: str, curve_data: List[float], 
                                         depths: List[float], 
                                         well_info: Dict[str, Any]) -> List[EnvironmentalCorrectionValidation]:
        """
        Validate environmental corrections for specific curves
        """
        corrections = []
        
        if curve_name == 'RHOB':
            # Density correction for mud cake and borehole effects
            corrections.append(self._validate_density_correction(curve_data, depths, well_info))
        
        elif curve_name == 'NPHI':
            # Neutron correction for lithology and borehole effects
            corrections.append(self._validate_neutron_correction(curve_data, depths, well_info))
        
        elif curve_name == 'RT':
            # Resistivity correction for borehole and invasion effects
            corrections.append(self._validate_resistivity_correction(curve_data, depths, well_info))
        
        elif curve_name == 'GR':
            # Gamma ray correction for borehole size and mud weight
            corrections.append(self._validate_gamma_ray_correction(curve_data, depths, well_info))
        
        return corrections
    
    def _calculate_curve_statistics(self, curve_data: List[float]) -> Dict[str, float]:
        """Calculate basic statistical measures for curve data"""
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return {
                'mean': float('nan'),
                'median': float('nan'),
                'std_dev': float('nan'),
                'min': float('nan'),
                'max': float('nan'),
                'range': float('nan'),
                'count': len(curve_data),
                'valid_count': 0
            }
        
        valid_data.sort()
        mean = sum(valid_data) / len(valid_data)
        variance = sum((val - mean) ** 2 for val in valid_data) / len(valid_data)
        std_dev = math.sqrt(variance)
        
        return {
            'mean': mean,
            'median': valid_data[len(valid_data) // 2],
            'std_dev': std_dev,
            'min': valid_data[0],
            'max': valid_data[-1],
            'range': valid_data[-1] - valid_data[0],
            'count': len(curve_data),
            'valid_count': len(valid_data)
        }
    
    def _calculate_data_completeness(self, curve_data: List[float]) -> float:
        """Calculate data completeness percentage"""
        if not curve_data:
            return 0.0
        
        valid_count = sum(1 for val in curve_data 
                         if val != self.null_value and not math.isnan(val) and math.isfinite(val))
        return (valid_count / len(curve_data)) * 100
    
    def _detect_outliers(self, curve_name: str, curve_data: List[float]) -> float:
        """Detect statistical outliers using IQR method"""
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if len(valid_data) < 4:
            return 0.0
        
        valid_data.sort()
        n = len(valid_data)
        
        # Calculate quartiles
        q1_idx = n // 4
        q3_idx = 3 * n // 4
        q1 = valid_data[q1_idx]
        q3 = valid_data[q3_idx]
        iqr = q3 - q1
        
        # Define outlier bounds
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        # Check curve-specific ranges
        if curve_name in self.curve_ranges:
            curve_min, curve_max = self.curve_ranges[curve_name]
            lower_bound = max(lower_bound, curve_min)
            upper_bound = min(upper_bound, curve_max)
        
        # Count outliers
        outliers = sum(1 for val in valid_data 
                      if val < lower_bound or val > upper_bound)
        
        return (outliers / len(valid_data)) * 100
    
    def _assess_noise_level(self, curve_data: List[float]) -> float:
        """Assess noise level using standard deviation of differences"""
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if len(valid_data) < 3:
            return 0.0
        
        # Calculate differences between consecutive points
        differences = [abs(valid_data[i+1] - valid_data[i]) for i in range(len(valid_data)-1)]
        
        if not differences:
            return 0.0
        
        # Calculate standard deviation of differences as noise measure
        mean_diff = sum(differences) / len(differences)
        variance_diff = sum((diff - mean_diff) ** 2 for diff in differences) / len(differences)
        noise_level = math.sqrt(variance_diff)
        
        # Normalize by data range
        data_range = max(valid_data) - min(valid_data)
        if data_range > 0:
            noise_level = (noise_level / data_range) * 100
        
        return min(noise_level, 100.0)  # Cap at 100%
    
    def _check_environmental_corrections(self, curve_name: str, curve_data: List[float], 
                                       depths: List[float]) -> List[str]:
        """Check what environmental corrections may be needed"""
        corrections = []
        
        if curve_name == 'RHOB':
            corrections.extend(['mud_cake_correction', 'borehole_size_correction'])
        elif curve_name == 'NPHI':
            corrections.extend(['lithology_correction', 'borehole_fluid_correction'])
        elif curve_name == 'RT':
            corrections.extend(['borehole_correction', 'invasion_correction'])
        elif curve_name == 'GR':
            corrections.extend(['borehole_size_correction', 'mud_weight_correction'])
        
        return corrections
    
    def _determine_quality_flag(self, completeness: float, outlier_percentage: float, 
                              noise_level: float, curve_name: str) -> QualityFlag:
        """Determine overall quality flag based on metrics"""
        # Quality scoring system
        score = 0
        
        # Completeness scoring (40% weight)
        if completeness >= 95:
            score += 40
        elif completeness >= 85:
            score += 30
        elif completeness >= 70:
            score += 20
        elif completeness >= 50:
            score += 10
        
        # Outlier scoring (30% weight)
        if outlier_percentage <= 2:
            score += 30
        elif outlier_percentage <= 5:
            score += 20
        elif outlier_percentage <= 10:
            score += 10
        
        # Noise scoring (30% weight)
        if noise_level <= 5:
            score += 30
        elif noise_level <= 10:
            score += 20
        elif noise_level <= 20:
            score += 10
        
        # Determine quality flag
        if score >= 85:
            return QualityFlag.EXCELLENT
        elif score >= 65:
            return QualityFlag.GOOD
        elif score >= 40:
            return QualityFlag.FAIR
        else:
            return QualityFlag.POOR
    
    def _generate_validation_notes(self, curve_name: str, completeness: float, 
                                 outlier_percentage: float, noise_level: float) -> List[str]:
        """Generate validation notes based on quality metrics"""
        notes = []
        
        if completeness < 80:
            notes.append(f"Low data completeness: {completeness:.1f}%")
        
        if outlier_percentage > 5:
            notes.append(f"High outlier percentage: {outlier_percentage:.1f}%")
        
        if noise_level > 15:
            notes.append(f"High noise level: {noise_level:.1f}%")
        
        if curve_name in ['RHOB', 'NPHI'] and noise_level > 10:
            notes.append("Consider environmental corrections for porosity calculations")
        
        if curve_name == 'RT' and outlier_percentage > 10:
            notes.append("Check for invasion effects in resistivity data")
        
        if curve_name == 'GR' and noise_level > 20:
            notes.append("High gamma ray noise may affect shale volume calculations")
        
        if not notes:
            notes.append("Curve quality is acceptable for petrophysical calculations")
        
        return notes
    
    def _identify_data_gaps(self, curve_data: List[float], depths: List[float]) -> List[Tuple[float, float]]:
        """Identify significant gaps in data coverage"""
        gaps = []
        
        if not depths or len(depths) != len(curve_data):
            return gaps
        
        gap_start = None
        gap_threshold = 5  # Minimum gap size to report
        
        for i, (depth, value) in enumerate(zip(depths, curve_data)):
            is_null = (value == self.null_value or math.isnan(value) or not math.isfinite(value))
            
            if is_null and gap_start is None:
                gap_start = depth
            elif not is_null and gap_start is not None:
                gap_size = depth - gap_start
                if gap_size >= gap_threshold:
                    gaps.append((gap_start, depth))
                gap_start = None
        
        # Handle gap at end of data
        if gap_start is not None:
            gap_size = depths[-1] - gap_start
            if gap_size >= gap_threshold:
                gaps.append((gap_start, depths[-1]))
        
        return gaps
    
    def _validate_density_correction(self, curve_data: List[float], depths: List[float], 
                                   well_info: Dict[str, Any]) -> EnvironmentalCorrectionValidation:
        """Validate density environmental corrections"""
        # Check for typical density correction indicators
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return EnvironmentalCorrectionValidation(
                correction_type="density_environmental",
                is_applied=False,
                is_valid=False,
                correction_factor=None,
                validation_notes=["Insufficient data for validation"]
            )
        
        # Check for unrealistic density values (indication of poor correction)
        unrealistic_count = sum(1 for val in valid_data if val < 1.5 or val > 3.5)
        unrealistic_percentage = (unrealistic_count / len(valid_data)) * 100
        
        is_valid = unrealistic_percentage < 5  # Less than 5% unrealistic values
        
        notes = []
        if unrealistic_percentage > 5:
            notes.append(f"High percentage of unrealistic density values: {unrealistic_percentage:.1f}%")
        if unrealistic_percentage > 15:
            notes.append("Consider re-applying environmental corrections")
        
        return EnvironmentalCorrectionValidation(
            correction_type="density_environmental",
            is_applied=True,  # Assume corrections are applied in processed data
            is_valid=is_valid,
            correction_factor=None,
            validation_notes=notes if notes else ["Density corrections appear valid"]
        )
    
    def _validate_neutron_correction(self, curve_data: List[float], depths: List[float], 
                                   well_info: Dict[str, Any]) -> EnvironmentalCorrectionValidation:
        """Validate neutron environmental corrections"""
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return EnvironmentalCorrectionValidation(
                correction_type="neutron_environmental",
                is_applied=False,
                is_valid=False,
                correction_factor=None,
                validation_notes=["Insufficient data for validation"]
            )
        
        # Check for reasonable neutron porosity range
        unrealistic_count = sum(1 for val in valid_data if val < 0 or val > 100)
        unrealistic_percentage = (unrealistic_count / len(valid_data)) * 100
        
        is_valid = unrealistic_percentage < 2  # Less than 2% unrealistic values
        
        notes = []
        if unrealistic_percentage > 2:
            notes.append(f"Unrealistic neutron porosity values: {unrealistic_percentage:.1f}%")
        
        return EnvironmentalCorrectionValidation(
            correction_type="neutron_environmental",
            is_applied=True,
            is_valid=is_valid,
            correction_factor=None,
            validation_notes=notes if notes else ["Neutron corrections appear valid"]
        )
    
    def _validate_resistivity_correction(self, curve_data: List[float], depths: List[float], 
                                       well_info: Dict[str, Any]) -> EnvironmentalCorrectionValidation:
        """Validate resistivity environmental corrections"""
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return EnvironmentalCorrectionValidation(
                correction_type="resistivity_environmental",
                is_applied=False,
                is_valid=False,
                correction_factor=None,
                validation_notes=["Insufficient data for validation"]
            )
        
        # Check for reasonable resistivity range
        unrealistic_count = sum(1 for val in valid_data if val <= 0 or val > 10000)
        unrealistic_percentage = (unrealistic_count / len(valid_data)) * 100
        
        is_valid = unrealistic_percentage < 5
        
        notes = []
        if unrealistic_percentage > 5:
            notes.append(f"Unrealistic resistivity values: {unrealistic_percentage:.1f}%")
        
        return EnvironmentalCorrectionValidation(
            correction_type="resistivity_environmental",
            is_applied=True,
            is_valid=is_valid,
            correction_factor=None,
            validation_notes=notes if notes else ["Resistivity corrections appear valid"]
        )
    
    def _validate_gamma_ray_correction(self, curve_data: List[float], depths: List[float], 
                                     well_info: Dict[str, Any]) -> EnvironmentalCorrectionValidation:
        """Validate gamma ray environmental corrections"""
        valid_data = [val for val in curve_data 
                     if val != self.null_value and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return EnvironmentalCorrectionValidation(
                correction_type="gamma_ray_environmental",
                is_applied=False,
                is_valid=False,
                correction_factor=None,
                validation_notes=["Insufficient data for validation"]
            )
        
        # Check for reasonable gamma ray range
        unrealistic_count = sum(1 for val in valid_data if val < 0 or val > 500)
        unrealistic_percentage = (unrealistic_count / len(valid_data)) * 100
        
        is_valid = unrealistic_percentage < 2
        
        notes = []
        if unrealistic_percentage > 2:
            notes.append(f"Unrealistic gamma ray values: {unrealistic_percentage:.1f}%")
        
        return EnvironmentalCorrectionValidation(
            correction_type="gamma_ray_environmental",
            is_applied=True,
            is_valid=is_valid,
            correction_factor=None,
            validation_notes=notes if notes else ["Gamma ray corrections appear valid"]
        )